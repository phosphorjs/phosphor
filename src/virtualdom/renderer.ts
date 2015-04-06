/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import emptyArray = utility.emptyArray;
import emptyObject = utility.emptyObject;


/**
 * Render virtual content into a host node.
 *
 * This renders the delta from the previous rendering. It assumes that
 * the contents of the host node are not manipulated by external code.
 * Modifying the host node will result in undefined rendering behavior.
 *
 * Returns an object which maps ref names to nodes and components.
 */
export
function render(content: IElement | IElement[], host: HTMLElement): any {
  var oldContent = hostMap.get(host) || emptyArray;
  var newContent = asElementArray(content);
  hostMap.set(host, newContent);
  updateContent(host, oldContent, newContent);
  return collectRefs(host, newContent);
}


/**
 * A weak mapping of host node to rendered content.
 */
var hostMap = new WeakMap<HTMLElement, IElement[]>();


/**
 * A weak mapping of component node to component.
 */
var componentMap = new WeakMap<HTMLElement, IComponent<any>>();


/**
 * An enum of element attribute types.
 */
const enum AttrMode { Property, Attribute, Event }


/**
 * A pair of virtual element and rendered node.
 */
interface IElemPair {
  elem: IElement;
  node: HTMLElement;
}


/**
 * A mapping of string key to pair of element and rendered node.
 */
interface IKeyMap {
  [key: string]: IElemPair;
}


/**
 * Coerce virtual content into a virtual element array.
 *
 * Null content will be coerced to an empty array.
 */
function asElementArray(content: IElement | IElement[]): IElement[] {
  if (content instanceof Array) {
    return <IElement[]>content;
  }
  if (content) {
    return [<IElement>content];
  }
  return emptyArray;
}


/**
 * Collect a mapping of keyed elements for the host content.
 */
function collectKeys(host: HTMLElement, content: IElement[]): IKeyMap {
  var childNodes = host.childNodes;
  var keyed: IKeyMap = Object.create(null);
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
function collectRefs(host: HTMLElement, content: IElement[]): any {
  var refs = Object.create(null);
  refsHelper(host, content, refs);
  return refs;
}


/**
 * A recursive implementation helper for `collectRefs`.
 */
function refsHelper(host: HTMLElement, content: IElement[], refs: any): void {
  var childNodes = host.childNodes;
  for (var i = 0, n = content.length; i < n; ++i) {
    var elem = content[i];
    var type = elem.type;
    if (type === ElementType.Node) {
      var node = <HTMLElement>childNodes[i];
      var ref = elem.data.ref;
      if (ref) refs[ref] = node;
      refsHelper(node, elem.children, refs);
    } else if (type === ElementType.Component) {
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
 * Create a node for a virtual element and add it to a host.
 */
function addNode(host: HTMLElement, elem: IElement, ref?: Node): void {
  var type = elem.type;
  if (type === ElementType.Text) {
    host.insertBefore(document.createTextNode(<string>elem.tag), ref);
  } else if (type === ElementType.Node) {
    var node = document.createElement(<string>elem.tag);
    addAttributes(node, elem.data);
    host.insertBefore(node, ref);
    addContent(node, elem.children);
  } else if (type === ElementType.Component) {
    var component = new (<IComponentClass<any>>elem.tag)();
    componentMap.set(component.node, component);
    host.insertBefore(component.node, ref);
    component.init(elem.data, elem.children);
  } else {
    throw new Error('invalid element type');
  }
}


/**
 * Add content to a newly created DOM node.
 */
function addContent(host: HTMLElement, content: IElement[]): void {
  for (var i = 0, n = content.length; i < n; ++i) {
    addNode(host, content[i]);
  }
}


/**
 * Add attributes to a newly created DOM node.
 */
function addAttributes(node: HTMLElement, attrs: any): void {
  for (var name in attrs) {
    var mode = attrModeTable[name];
    if (mode === AttrMode.Property || mode === AttrMode.Event) {
      (<any>node)[name] = attrs[name];
    } else if (mode === AttrMode.Attribute) {
      node.setAttribute(name.toLowerCase(), attrs[name]);
    }
  }
  var dataset = attrs.dataset;
  if (dataset) {
    for (var name in dataset) {
      node.setAttribute('data-' + name, dataset[name]);
    }
  }
  var inlineStyles = attrs.style;
  if (inlineStyles) {
    var style = node.style;
    for (var name in inlineStyles) {
      style[name] = inlineStyles[name];
    }
  }
}


/**
 * Update a host node with the delta of the virtual content.
 */
function updateContent(
  host: HTMLElement,
  oldContent: IElement[],
  newContent: IElement[]): void {
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
      addNode(host, newElem);
      continue;
    }

    var oldElem = oldCopy[i];
    var currNode = childNodes[i];

    // If the new element is keyed, move a keyed old element to the
    // proper location before proceeding with the diff.
    var newKey = newElem.data.key;
    if (newKey && newKey in oldKeyed) {
      var pair = oldKeyed[newKey];
      if (pair.elem !== oldElem) {
        var k = oldCopy.indexOf(pair.elem);
        if (k !== -1) oldCopy.splice(k, 1);
        oldCopy.splice(i, 0, pair.elem);
        moveNode(host, pair.node, currNode);
        oldElem = pair.elem;
        currNode = pair.node;
      }
    }

    // If both elements are identical, there is nothing to do.
    // This can occur when a component renders cached content.
    if (oldElem === newElem) {
      continue;
    }

    // If the old element is keyed and does not match the new element
    // key, create a new node. This is necessary since the old element
    // may be moved forward in the tree at a later point in the diff.
    var oldKey = oldElem.data.key;
    if (oldKey && oldKey !== newKey) {
      oldCopy.splice(i, 0, newElem);
      addNode(host, newElem, currNode);
      continue;
    }

    // If the elements have different types, create a new node.
    if (oldElem.type !== newElem.type) {
      oldCopy.splice(i, 0, newElem);
      addNode(host, newElem, currNode);
      continue;
    }

    // If the element is a text node, update its text content.
    if (newElem.type === ElementType.Text) {
      if (oldElem.tag !== newElem.tag) {
        currNode.textContent = <string>newElem.tag;
      }
      continue;
    }

    // At this point, the element is a Node or Component type.
    // If the element tags are different, create a new node.
    if (oldElem.tag !== newElem.tag) {
      oldCopy.splice(i, 0, newElem);
      addNode(host, newElem, currNode);
      continue;
    }

    // If the element is a Node type, update the node in place.
    if (newElem.type === ElementType.Node) {
      updateAttrs(<HTMLElement>currNode, oldElem.data, newElem.data);
      updateContent(<HTMLElement>currNode, oldElem.children, newElem.children);
      continue;
    }

    // At this point, the node is a Component type; re-init it.
    var component = componentMap.get(<HTMLElement>currNode);
    component.init(newElem.data, newElem.children);
  }

  // Dispose of the old content pushed to the end of the host.
  for (var i = oldCopy.length - 1; i >= newCount; --i) {
    var oldNode = childNodes[i];
    host.removeChild(oldNode);
    disposeBranch(oldNode);
  }
}


/**
 * Update the node attributes with the delta of attribute objects.
 */
function updateAttrs(node: HTMLElement, oldAttrs: any, newAttrs: any): void {
  if (oldAttrs === newAttrs) {
    return;
  }
  for (var name in oldAttrs) {
    if (!(name in newAttrs)) {
      var mode = attrModeTable[name];
      if (mode === AttrMode.Property) {
        node.removeAttribute(name);
      } else if (mode === AttrMode.Attribute) {
        node.removeAttribute(name.toLowerCase());
      } else if (mode === AttrMode.Event) {
        (<any>node)[name] = null;
      }
    }
  }
  for (var name in newAttrs) {
    var value = newAttrs[name];
    if (oldAttrs[name] !== value) {
      var mode = attrModeTable[name];
      if (mode === AttrMode.Property || mode === AttrMode.Event) {
        (<any>node)[name] = value;
      } else if (mode === AttrMode.Attribute) {
        node.setAttribute(name.toLowerCase(), value);
      }
    }
  }
  var oldDataset = oldAttrs.dataset || emptyObject;
  var newDataset = newAttrs.dataset || emptyObject;
  if (oldDataset !== newDataset) {
    for (var name in oldDataset) {
      if (!(name in newDataset)) {
        node.removeAttribute('data-' + name);
      }
    }
    for (var name in newDataset) {
      var value = newDataset[name];
      if (oldDataset[name] !== value) {
        node.setAttribute('data-' + name, value);
      }
    }
  }
  var oldInlineStyles = oldAttrs.style || emptyObject;
  var newInlineStyles = newAttrs.style || emptyObject;
  if (oldInlineStyles !== newInlineStyles) {
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
}


/**
 * Dispose of the components associated with the given branch.
 */
function disposeBranch(root: Node): void {
  if (root.nodeType === 1) {
    var component = componentMap.get(<HTMLElement>root);
    if (component) component.dispose();
  }
  for (var child = root.firstChild; child; child = child.nextSibling) {
    disposeBranch(child);
  }
}


/**
 * A mapping of attribute name to required setattr mode.
 */
var attrModeTable: { [k: string]: number } = {
  accept:             AttrMode.Property,
  acceptCharset:      AttrMode.Property,
  accessKey:          AttrMode.Property,
  action:             AttrMode.Property,
  allowFullscreen:    AttrMode.Attribute,
  alt:                AttrMode.Property,
  autocomplete:       AttrMode.Property,
  autofocus:          AttrMode.Property,
  autoplay:           AttrMode.Property,
  checked:            AttrMode.Property,
  cite:               AttrMode.Property,
  className:          AttrMode.Property,
  colSpan:            AttrMode.Property,
  cols:               AttrMode.Property,
  contentEditable:    AttrMode.Property,
  controls:           AttrMode.Property,
  coords:             AttrMode.Property,
  crossOrigin:        AttrMode.Property,
  data:               AttrMode.Property,
  dateTime:           AttrMode.Property,
  default:            AttrMode.Property,
  dir:                AttrMode.Property,
  dirName:            AttrMode.Property,
  disabled:           AttrMode.Property,
  download:           AttrMode.Property,
  draggable:          AttrMode.Property,
  enctype:            AttrMode.Property,
  form:               AttrMode.Attribute,
  formAction:         AttrMode.Property,
  formEnctype:        AttrMode.Property,
  formMethod:         AttrMode.Property,
  formNoValidate:     AttrMode.Property,
  formTarget:         AttrMode.Property,
  headers:            AttrMode.Property,
  height:             AttrMode.Property,
  hidden:             AttrMode.Property,
  high:               AttrMode.Property,
  href:               AttrMode.Property,
  hreflang:           AttrMode.Property,
  htmlFor:            AttrMode.Property,
  id:                 AttrMode.Property,
  inputMode:          AttrMode.Property,
  isMap:              AttrMode.Property,
  kind:               AttrMode.Property,
  label:              AttrMode.Property,
  lang:               AttrMode.Property,
  list:               AttrMode.Attribute,
  loop:               AttrMode.Property,
  low:                AttrMode.Property,
  max:                AttrMode.Property,
  maxLength:          AttrMode.Property,
  media:              AttrMode.Attribute,
  mediaGroup:         AttrMode.Property,
  method:             AttrMode.Property,
  min:                AttrMode.Property,
  minLength:          AttrMode.Property,
  multiple:           AttrMode.Property,
  muted:              AttrMode.Property,
  name:               AttrMode.Property,
  noValidate:         AttrMode.Property,
  optimum:            AttrMode.Property,
  pattern:            AttrMode.Property,
  placeholder:        AttrMode.Property,
  poster:             AttrMode.Property,
  preload:            AttrMode.Property,
  readOnly:           AttrMode.Property,
  rel:                AttrMode.Property,
  required:           AttrMode.Property,
  reversed:           AttrMode.Property,
  rowSpan:            AttrMode.Property,
  rows:               AttrMode.Property,
  sandbox:            AttrMode.Property,
  scope:              AttrMode.Property,
  seamless:           AttrMode.Attribute,
  selected:           AttrMode.Property,
  shape:              AttrMode.Property,
  size:               AttrMode.Property,
  sizes:              AttrMode.Attribute,
  sorted:             AttrMode.Property,
  span:               AttrMode.Property,
  spellcheck:         AttrMode.Property,
  src:                AttrMode.Property,
  srcdoc:             AttrMode.Property,
  srclang:            AttrMode.Property,
  srcset:             AttrMode.Attribute,
  start:              AttrMode.Property,
  step:               AttrMode.Property,
  tabIndex:           AttrMode.Property,
  target:             AttrMode.Property,
  title:              AttrMode.Property,
  type:               AttrMode.Property,
  typeMustMatch:      AttrMode.Property,
  useMap:             AttrMode.Property,
  value:              AttrMode.Property,
  volume:             AttrMode.Property,
  width:              AttrMode.Property,
  wrap:               AttrMode.Property,
  onabort:            AttrMode.Event,
  onbeforecopy:       AttrMode.Event,
  onbeforecut:        AttrMode.Event,
  onbeforepaste:      AttrMode.Event,
  onblur:             AttrMode.Event,
  oncanplay:          AttrMode.Event,
  oncanplaythrough:   AttrMode.Event,
  onchange:           AttrMode.Event,
  onclick:            AttrMode.Event,
  oncontextmenu:      AttrMode.Event,
  oncopy:             AttrMode.Event,
  oncuechange:        AttrMode.Event,
  oncut:              AttrMode.Event,
  ondblclick:         AttrMode.Event,
  ondrag:             AttrMode.Event,
  ondragend:          AttrMode.Event,
  ondragenter:        AttrMode.Event,
  ondragleave:        AttrMode.Event,
  ondragover:         AttrMode.Event,
  ondragstart:        AttrMode.Event,
  ondrop:             AttrMode.Event,
  ondurationchange:   AttrMode.Event,
  onended:            AttrMode.Event,
  onemptied:          AttrMode.Event,
  onerror:            AttrMode.Event,
  onfocus:            AttrMode.Event,
  onhelp:             AttrMode.Event,
  oninput:            AttrMode.Event,
  onkeydown:          AttrMode.Event,
  onkeypress:         AttrMode.Event,
  onkeyup:            AttrMode.Event,
  onload:             AttrMode.Event,
  onloadeddata:       AttrMode.Event,
  onloadedmetadata:   AttrMode.Event,
  onloadstart:        AttrMode.Event,
  onmousedown:        AttrMode.Event,
  onmouseenter:       AttrMode.Event,
  onmouseleave:       AttrMode.Event,
  onmousemove:        AttrMode.Event,
  onmouseout:         AttrMode.Event,
  onmouseover:        AttrMode.Event,
  onmouseup:          AttrMode.Event,
  onmousewheel:       AttrMode.Event,
  onpaste:            AttrMode.Event,
  onpause:            AttrMode.Event,
  onplay:             AttrMode.Event,
  onplaying:          AttrMode.Event,
  onprogress:         AttrMode.Event,
  onratechange:       AttrMode.Event,
  onreadystatechange: AttrMode.Event,
  onreset:            AttrMode.Event,
  onscroll:           AttrMode.Event,
  onseeked:           AttrMode.Event,
  onseeking:          AttrMode.Event,
  onselect:           AttrMode.Event,
  onselectstart:      AttrMode.Event,
  onstalled:          AttrMode.Event,
  onsubmit:           AttrMode.Event,
  onsuspend:          AttrMode.Event,
  ontimeupdate:       AttrMode.Event,
  onvolumechange:     AttrMode.Event,
  onwaiting:          AttrMode.Event,
};

} // module phosphor.virtualdom
