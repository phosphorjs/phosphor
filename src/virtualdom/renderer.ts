/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import sendEvent = core.sendEvent;

import IComponentClass = phosphor.components.IComponentClass
import IComponent = phosphor.components.IComponent


/**
 * Render virtual content into a host node.
 *
 * This renders the delta from the previous rendering. It assumes that
 * the contents of the host node are not manipulated by external code.
 * Modifying the host node will result in undefined rendering behavior.
 *
 * Returns a mapping of ref nodes and components.
 */
export
function render(content: IVirtualElement | IVirtualElement[], host: HTMLElement): any {
  var oldContent = hostMap.get(host) || emptyArray;
  var newContent = asElementArray(content);
  hostMap.set(host, newContent);
  updateContent(host, oldContent, newContent);
  return collectRefs(host, newContent);
}


// TODO fix me
var EVT_RENDER_REQUEST = { type: 'render-request' };


/**
 * A weak mapping of host node to rendered content.
 */
var hostMap = new WeakMap<HTMLElement, IVirtualElement[]>();

/**
 * A weak mapping of component node to component.
 */
var componentMap = new WeakMap<HTMLElement, IComponent<any>>();

/**
 * A singleton empty object.
 */
var emptyObject: any = Object.freeze(Object.create(null));

/**
 * A singleton empty array.
 */
var emptyArray: any[] = Object.freeze([]);

/**
 * A regex for testing for 'data-*' attributes.
 */
var dataRegex = /^data-/;

/**
 * A constant indicating an attribute is node property.
 */
var IS_PROPERTY = 0;

/**
 * A constant indicating an attribute is node attribute.
 */
var IS_ATTRIBUTE = 1;

/**
 * A constant indicate an attribute is an inline event handler.
 */
var IS_EVENT = 2;


/**
 * An object which holds an element and its rendered node.
 */
interface IElementPair {
  elem: IVirtualElement;
  node: HTMLElement;
}


/**
 * Coerce virtual content into a virtual element array.
 *
 * Null content will be coerced to an empty array.
 */
function asElementArray(content: IVirtualElement | IVirtualElement[]): IVirtualElement[] {
  if (Array.isArray(content)) {
    return <IVirtualElement[]>content;
  }
  if (content) {
    return [<IVirtualElement>content];
  }
  return emptyArray;
}


/**
 * Collect the mapping of keyed elements for the host content.
 */
function collectKeys(host: HTMLElement, content: IVirtualElement[]): { [k: string]: IElementPair } {
  var childNodes = host.childNodes;
  var keyed: { [k: string]: IElementPair } = Object.create(null);
  for (var i = 0, n = content.length; i < n; ++i) {
    var elem = content[i];
    var key = elem.data.key;
    if (key) keyed[key] = { elem: elem, node: <HTMLElement>childNodes[i] };
  }
  return keyed;
}


/**
 * Walk the element tree and collect the refs into a new object.
 */
function collectRefs(host: HTMLElement, content: IVirtualElement[]): any {
  var refs = Object.create(null);
  collectRefsRecursive(host, content, refs);
  return refs;
}


/**
 * A recursive implementation helper for `collectRefs`.
 */
function collectRefsRecursive(host: HTMLElement, content: IVirtualElement[], refs: any): void {
  var childNodes = host.childNodes;
  for (var i = 0, n = content.length; i < n; ++i) {
    var elem = content[i];
    var type = elem.type;
    if (type === VirtualElementType.Node) {
      var node = <HTMLElement>childNodes[i];
      var ref = elem.data.ref;
      if (ref) refs[ref] = node;
      collectRefsRecursive(node, elem.children, refs);
    } else if (type === VirtualElementType.Component) {
      var ref = elem.data.ref;
      if (ref) refs[ref] = componentMap.get(<HTMLElement>childNodes[i]);
    }
  }
}


/**
 * Move a node to a new location in a host element.
 *
 * This function will maintain focus on the node if applicable.
 */
function moveNode(host: HTMLElement, node: HTMLElement, ref: Node): void {
  // TODO - IE11 fails to set the focus properly
  var wasActive = document.activeElement === node;
  host.insertBefore(node, ref);
  if (wasActive) node.focus();
}


/**
 * Create a new DOM node for the given virtual element.
 */
function createNode(elem: IVirtualElement): Node {
  var type = elem.type;
  if (type === VirtualElementType.Text) {
    return document.createTextNode(<string>elem.tag);
  }
  if (type === VirtualElementType.Node) {
    var node = document.createElement(<string>elem.tag);
    addAttributes(node, elem.data);
    addContent(node, elem.children);
    return node;
  }
  if (type === VirtualElementType.Component) {
    var component = new (<IComponentClass<any>>elem.tag)();
    componentMap.set(component.node, component);
    component.init(elem.data, elem.children);
    sendEvent(component, EVT_RENDER_REQUEST);
    return component.node;
  }
  throw new Error('invalid element type');
}


/**
 * Add content to a newly created DOM node.
 */
function addContent(node: HTMLElement, content: IVirtualElement[]): void {
  for (var i = 0, n = content.length; i < n; ++i) {
    node.appendChild(createNode(content[i]));
  }
}


/**
 * Add attributes to a newly created DOM node.
 */
function addAttributes(node: HTMLElement, attrs: any): void {
  for (var name in attrs) {
    var mode = attrModeTable[name];
    if (mode === IS_PROPERTY || mode === IS_EVENT) {
      (<any>node)[name] = attrs[name];
    } else if (mode === IS_ATTRIBUTE) {
      node.setAttribute(name.toLowerCase(), attrs[name]);
    } else if (dataRegex.test(name)) {
      node.setAttribute(name, attrs[name]);
    }
  }
  var inlineStyles = attrs.style;
  if (!inlineStyles) {
    return;
  }
  var style = node.style;
  for (var name in inlineStyles) {
    style[name] = inlineStyles[name];
  }
}


/**
 * Update a host node with the delta of the virtual content.
 */
function updateContent(host: HTMLElement, oldContent: IVirtualElement[], newContent: IVirtualElement[]): void {
  // Bail early if the content is identical. This can occur when an
  // element has no children or if a component renders cached content.
  if (oldContent === newContent) {
    return;
  }

  // Collect the old keyed elements into a mapping.
  var oldKeyed = collectKeys(host, oldContent);

  // Create a copy of the old content which can be modified in-place.
  var oldCopy = oldContent.slice();

  // Store the child node list locally.
  var childNodes = host.childNodes;

  // Update the host with the new content. The diff algorithm always
  // proceeds forward and never modifies a previously visited index.
  // The `oldCopy` array is modified in-place to reflect the changes
  // made to the host. This causes the unused nodes to be pushed to
  // the end of the host node and removed at the end of the loop.
  var newCount = newContent.length;
  for (var i = 0; i < newCount; ++i) {
    var newElem = newContent[i];

    // If the old elements are exhausted, create a new node.
    if (i >= oldCopy.length) {
      oldCopy.push(newElem);
      host.appendChild(createNode(newElem));
      continue;
    }

    var oldElem = oldCopy[i];
    var currentNode = childNodes[i];

    // If the new element is keyed, move a keyed old element
    // to the proper location before proceeding with the diff.
    var key = newElem.data.key;
    if (key && key in oldKeyed) {
      var pair = oldKeyed[key];
      if (pair.elem !== oldElem) {
        var k = oldCopy.indexOf(pair.elem);
        if (k !== -1) oldCopy.splice(k, 1);
        oldCopy.splice(i, 0, pair.elem);
        moveNode(host, pair.node, currentNode);
        oldElem = pair.elem;
        currentNode = pair.node;
      }
    }

    // If both elements are identical, there is nothing to do.
    // This can occur when a component renders cached content.
    if (oldElem === newElem) {
      continue;
    }

    // If the elements have different types, create a new node.
    if (oldElem.type !== newElem.type) {
      oldCopy.splice(i, 0, newElem);
      host.insertBefore(createNode(newElem), currentNode);
      continue;
    }

    // If the element is a text node, update its text content.
    if (newElem.type === VirtualElementType.Text) {
      if (oldElem.tag !== newElem.tag) {
        currentNode.textContent = <string>newElem.tag;
      }
      continue;
    }

    // At this point, the element is a Node or Component type.
    // If the element tags are different, create a new node.
    if (oldElem.tag !== newElem.tag) {
      oldCopy.splice(i, 0, newElem);
      host.insertBefore(createNode(newElem), currentNode);
      continue;
    }

    // If the element is a Node type, update the node in place.
    if (newElem.type === VirtualElementType.Node) {
      updateAttributes(<HTMLElement>currentNode, oldElem.data, newElem.data);
      updateContent(<HTMLElement>currentNode, oldElem.children, newElem.children);
      continue;
    }

    // At this point, the node is a Component type. Initialize
    // the component with new data and render it if necessary.
    var component = componentMap.get(<HTMLElement>currentNode);
    if (component.init(newElem.data, newElem.children)) {
      sendEvent(component, EVT_RENDER_REQUEST);
    }
  }

  // Dispose of the old content pushed to the end of the host.
  for (var i = oldCopy.length - 1; i >= newCount; --i) {
    var oldNode = childNodes[i];
    host.removeChild(oldNode);
    disposeBranch(oldNode);
  }
}


/**
 * Update node attributes with the delta of attribute objects.
 */
function updateAttributes(node: HTMLElement, oldAttrs: any, newAttrs: any): void {
  if (oldAttrs === newAttrs) {
    return;
  }
  for (var name in oldAttrs) {
    if (!(name in newAttrs)) {
      var mode = attrModeTable[name];
      if (mode === IS_PROPERTY) {
        node.removeAttribute(name);
      } else if (mode === IS_ATTRIBUTE) {
        node.removeAttribute(name.toLowerCase());
      } else if (mode === IS_EVENT) {
        (<any>node)[name] = null;
      } else if (dataRegex.test(name)) {
        node.removeAttribute(name);
      }
    }
  }
  for (var name in newAttrs) {
    var value = newAttrs[name];
    if (oldAttrs[name] !== value) {
      var mode = attrModeTable[name];
      if (mode === IS_PROPERTY || mode === IS_EVENT) {
        (<any>node)[name] = value;
      } else if (mode === IS_ATTRIBUTE) {
        node.setAttribute(name.toLowerCase(), value);
      } else if (dataRegex.test(name)) {
        node.setAttribute(name, value);
      }
    }
  }
  var oldInlineStyles = oldAttrs.style || emptyObject;
  var newInlineStyles = newAttrs.style || emptyObject;
  if (oldInlineStyles === newInlineStyles) {
    return;
  }
  var style = node.style;
  for (var name in oldInlineStyles) {
    if (!(name in newInlineStyles)) {
      style[name] = '';
    }
  }
  for (var name in newInlineStyles) {
    var value = newInlineStyles[name];
    if (oldInlineStyles[name] !== value) {
      style[name] = value;
    }
  }
}


/**
 * Dispose of the components associated with the given branch.
 */
function disposeBranch(root: Node): void {
  if (root.nodeType === 1) {
    var component = componentMap.get(<HTMLElement>root);
    if (component) component.dispose();
  }
  for (var node = root.firstChild; node; node = node.nextSibling) {
    disposeBranch(node);
  }
}


/**
 * A mapping of attribute name to required setattr mode.
 */
var attrModeTable: { [k: string]: number } = {
  accept:             IS_PROPERTY,
  acceptCharset:      IS_PROPERTY,
  accessKey:          IS_PROPERTY,
  action:             IS_PROPERTY,
  allowFullscreen:    IS_ATTRIBUTE,
  alt:                IS_PROPERTY,
  autocomplete:       IS_PROPERTY,
  autofocus:          IS_PROPERTY,
  autoplay:           IS_PROPERTY,
  checked:            IS_PROPERTY,
  cite:               IS_PROPERTY,
  className:          IS_PROPERTY,
  colSpan:            IS_PROPERTY,
  cols:               IS_PROPERTY,
  contentEditable:    IS_PROPERTY,
  controls:           IS_PROPERTY,
  coords:             IS_PROPERTY,
  crossOrigin:        IS_PROPERTY,
  data:               IS_PROPERTY,
  dateTime:           IS_PROPERTY,
  default:            IS_PROPERTY,
  dir:                IS_PROPERTY,
  dirName:            IS_PROPERTY,
  disabled:           IS_PROPERTY,
  download:           IS_PROPERTY,
  draggable:          IS_PROPERTY,
  enctype:            IS_PROPERTY,
  form:               IS_ATTRIBUTE,
  formAction:         IS_PROPERTY,
  formEnctype:        IS_PROPERTY,
  formMethod:         IS_PROPERTY,
  formNoValidate:     IS_PROPERTY,
  formTarget:         IS_PROPERTY,
  headers:            IS_PROPERTY,
  height:             IS_PROPERTY,
  hidden:             IS_PROPERTY,
  high:               IS_PROPERTY,
  href:               IS_PROPERTY,
  hreflang:           IS_PROPERTY,
  htmlFor:            IS_PROPERTY,
  id:                 IS_PROPERTY,
  inputMode:          IS_PROPERTY,
  isMap:              IS_PROPERTY,
  kind:               IS_PROPERTY,
  label:              IS_PROPERTY,
  lang:               IS_PROPERTY,
  list:               IS_ATTRIBUTE,
  loop:               IS_PROPERTY,
  low:                IS_PROPERTY,
  max:                IS_PROPERTY,
  maxLength:          IS_PROPERTY,
  media:              IS_ATTRIBUTE,
  mediaGroup:         IS_PROPERTY,
  method:             IS_PROPERTY,
  min:                IS_PROPERTY,
  minLength:          IS_PROPERTY,
  multiple:           IS_PROPERTY,
  muted:              IS_PROPERTY,
  name:               IS_PROPERTY,
  noValidate:         IS_PROPERTY,
  optimum:            IS_PROPERTY,
  pattern:            IS_PROPERTY,
  placeholder:        IS_PROPERTY,
  poster:             IS_PROPERTY,
  preload:            IS_PROPERTY,
  readOnly:           IS_PROPERTY,
  rel:                IS_PROPERTY,
  required:           IS_PROPERTY,
  reversed:           IS_PROPERTY,
  rowSpan:            IS_PROPERTY,
  rows:               IS_PROPERTY,
  sandbox:            IS_PROPERTY,
  scope:              IS_PROPERTY,
  seamless:           IS_ATTRIBUTE,
  selected:           IS_PROPERTY,
  shape:              IS_PROPERTY,
  size:               IS_PROPERTY,
  sizes:              IS_ATTRIBUTE,
  sorted:             IS_PROPERTY,
  span:               IS_PROPERTY,
  spellcheck:         IS_PROPERTY,
  src:                IS_PROPERTY,
  srcdoc:             IS_PROPERTY,
  srclang:            IS_PROPERTY,
  srcset:             IS_ATTRIBUTE,
  start:              IS_PROPERTY,
  step:               IS_PROPERTY,
  tabIndex:           IS_PROPERTY,
  target:             IS_PROPERTY,
  title:              IS_PROPERTY,
  type:               IS_PROPERTY,
  typeMustMatch:      IS_PROPERTY,
  useMap:             IS_PROPERTY,
  value:              IS_PROPERTY,
  volume:             IS_PROPERTY,
  width:              IS_PROPERTY,
  wrap:               IS_PROPERTY,
  onabort:            IS_EVENT,
  onbeforecopy:       IS_EVENT,
  onbeforecut:        IS_EVENT,
  onbeforepaste:      IS_EVENT,
  onblur:             IS_EVENT,
  oncanplay:          IS_EVENT,
  oncanplaythrough:   IS_EVENT,
  onchange:           IS_EVENT,
  onclick:            IS_EVENT,
  oncontextmenu:      IS_EVENT,
  oncopy:             IS_EVENT,
  oncuechange:        IS_EVENT,
  oncut:              IS_EVENT,
  ondblclick:         IS_EVENT,
  ondrag:             IS_EVENT,
  ondragend:          IS_EVENT,
  ondragenter:        IS_EVENT,
  ondragleave:        IS_EVENT,
  ondragover:         IS_EVENT,
  ondragstart:        IS_EVENT,
  ondrop:             IS_EVENT,
  ondurationchange:   IS_EVENT,
  onended:            IS_EVENT,
  onemptied:          IS_EVENT,
  onerror:            IS_EVENT,
  onfocus:            IS_EVENT,
  onhelp:             IS_EVENT,
  oninput:            IS_EVENT,
  onkeydown:          IS_EVENT,
  onkeypress:         IS_EVENT,
  onkeyup:            IS_EVENT,
  onload:             IS_EVENT,
  onloadeddata:       IS_EVENT,
  onloadedmetadata:   IS_EVENT,
  onloadstart:        IS_EVENT,
  onmousedown:        IS_EVENT,
  onmouseenter:       IS_EVENT,
  onmouseleave:       IS_EVENT,
  onmousemove:        IS_EVENT,
  onmouseout:         IS_EVENT,
  onmouseover:        IS_EVENT,
  onmouseup:          IS_EVENT,
  onmousewheel:       IS_EVENT,
  onpaste:            IS_EVENT,
  onpause:            IS_EVENT,
  onplay:             IS_EVENT,
  onplaying:          IS_EVENT,
  onprogress:         IS_EVENT,
  onratechange:       IS_EVENT,
  onreadystatechange: IS_EVENT,
  onreset:            IS_EVENT,
  onscroll:           IS_EVENT,
  onseeked:           IS_EVENT,
  onseeking:          IS_EVENT,
  onselect:           IS_EVENT,
  onselectstart:      IS_EVENT,
  onstalled:          IS_EVENT,
  onsubmit:           IS_EVENT,
  onsuspend:          IS_EVENT,
  ontimeupdate:       IS_EVENT,
  onvolumechange:     IS_EVENT,
  onwaiting:          IS_EVENT,
};

} // module phosphor.virtualdom
