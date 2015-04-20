/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import algo = collections.algorithm;

import IMessage = core.IMessage;
import Message = core.Message;
import sendMessage = core.sendMessage;

import Pair = utility.Pair;
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
function render(content: Elem | Elem[], host: Node): any {
  var refs: any;
  stackLevel++;
  try {
    refs = renderImpl(content, host);
  } finally {
    stackLevel--;
  }
  if (stackLevel === 0) {
    notifyAttached();
  }
  return refs;
}


/**
 * The current stack level of recursive calls to `render`.
 */
var stackLevel = 0;

/**
 * Components which are pending attach notification.
 *
 * Components are pushed to this array when their node is added to the
 * DOM. When the root `render` call exits, each component in the array
 * will have its `afterAttach` method called.
 */
var needsAttachNotification: IComponent<any>[] = [];

/**
 * A weak mapping of host node to rendered content.
 */
var hostMap = new WeakMap<Node, Elem[]>();

/**
 * A weak mapping of component node to component.
 */
var componentMap = new WeakMap<Node, IComponent<any>>();

/**
 * A singleton 'update-request' message.
 */
var MSG_UPDATE_REQUEST = new Message('update-request');

/**
 * A singleton 'after-attach' message.
 */
var MSG_AFTER_ATTACH = new Message('after-attach');

/**
 * A singleton 'before-detach' message.
 */
var MSG_BEFORE_DETACH = new Message('before-detach');

/**
 * A singleton 'before-move' message.
 */
var MSG_BEFORE_MOVE = new Message('before-move');

/**
 * A singleton 'after-move' message.
 */
var MSG_AFTER_MOVE = new Message('after-move');


/**
 * An enum of element attribute types.
 */
const enum AttrMode { Property, Attribute, Event }


/**
 * A mapping of string key to pair of element and rendered node.
 */
interface IKeyMap {
  [key: string]: Pair<Elem, Node>;
}


/**
 * The internal render entry point.
 *
 * This function is separated from the `render` function so that it can
 * be optimized by V8, which does not optimize functions which contain
 * a `try-finally` block.
 */
function renderImpl(content: Elem | Elem[], host: Node): any {
  var oldContent = hostMap.get(host) || emptyArray;
  var newContent = asElementArray(content);
  hostMap.set(host, newContent);
  updateContent(host, oldContent, newContent);
  return collectRefs(host, newContent);
}


/**
 * Coerce content into an elem array.
 *
 * Null content will be coerced to an empty array.
 */
function asElementArray(content: Elem | Elem[]): Elem[] {
  if (content instanceof Array) {
    return <Elem[]>content;
  }
  if (content) {
    return [<Elem>content];
  }
  return emptyArray;
}


/**
 * Notify the components pending an `afterAttach` notification.
 */
function notifyAttached(): void {
  while (needsAttachNotification.length > 0) {
    var component = needsAttachNotification.pop();
    sendMessage(component, MSG_AFTER_ATTACH);
  }
}


/**
 * Walk the element tree and collect the refs into a new object.
 */
function collectRefs(host: Node, content: Elem[]): any {
  var refs = Object.create(null);
  refsHelper(host, content, refs);
  return refs;
}


/**
 * A recursive implementation helper for `collectRefs`.
 */
function refsHelper(host: Node, content: Elem[], refs: any): void {
  var node = host.firstChild;
  for (var i = 0, n = content.length; i < n; ++i) {
    var elem = content[i];
    switch (elem.type) {
    case ElemType.Node:
      var ref = elem.data.ref;
      if (ref) refs[ref] = node;
      refsHelper(node, elem.children, refs);
      break;
    case ElemType.Component:
      var ref = elem.data.ref;
      if (ref) refs[ref] = componentMap.get(node);
      break;
    }
    node = node.nextSibling;
  }
}


/**
 * Collect a mapping of keyed elements for the host content.
 */
function collectKeys(host: Node, content: Elem[]): IKeyMap {
  var node = host.firstChild;
  var keyed: IKeyMap = Object.create(null);
  for (var i = 0, n = content.length; i < n; ++i) {
    var elem = content[i];
    var key = elem.data.key;
    if (key) keyed[key] = new Pair(elem, node);
    node = node.nextSibling;
  }
  return keyed;
}


/**
 * Create and return a new DOM node for a give elem.
 */
function createNode(elem: Elem): Node {
  var node: Node;
  switch (elem.type) {
  case ElemType.Text:
    node = document.createTextNode(<string>elem.tag);
    break;
  case ElemType.Node:
    node = document.createElement(<string>elem.tag);
    addAttributes(<HTMLElement>node, elem.data);
    addContent(node, elem.children);
    break;
  case ElemType.Component:
    var cls = <IComponentClass<any>>elem.tag;
    var component = new cls(elem.data, elem.children);
    node = component.node;
    componentMap.set(node, component);
    needsAttachNotification.push(component);
    sendMessage(component, MSG_UPDATE_REQUEST);
    break;
  default:
    throw new Error('invalid element type');
  }
  return node;
}


/**
 * Create and add child content to a newly created DOM node.
 */
function addContent(node: Node, content: Elem[]): void {
  for (var i = 0, n = content.length; i < n; ++i) {
    node.appendChild(createNode(content[i]));
  }
}


/**
 * Update a host node with the delta of the elem content.
 *
 * This is the core "diff" algorithm. There is no explicit "patch"
 * phase. The host is patched at each step as the diff progresses.
 */
function updateContent(host: Node, oldContent: Elem[], newContent: Elem[]): void {
  // Bail early if the content is identical. This can occur when an
  // elem has no children or if a component renders cached content.
  if (oldContent === newContent) {
    return;
  }

  // Collect the old keyed elems into a mapping.
  var oldKeyed = collectKeys(host, oldContent);

  // Create a copy of the old content which can be modified in-place.
  var oldCopy = algo.copy(oldContent);

  // Update the host with the new content. The diff always proceeds
  // forward and never modifies a previously visited index. The old
  // copy array is modified in-place to reflect the changes made to
  // the host children. This causes the stale nodes to be pushed to
  // the end of the host node and removed at the end of the loop.
  var currNode = host.firstChild;
  var newCount = newContent.length;
  for (var i = 0; i < newCount; ++i) {

    // If the old elems are exhausted, create a new node.
    if (i >= oldCopy.length) {
      host.appendChild(createNode(newContent[i]));
      continue;
    }

    // Cache a reference to the old and new elems.
    var oldElem = oldCopy[i];
    var newElem = newContent[i];

    // If the new elem is keyed, move an old keyed elem to the proper
    // location before proceeding with the diff. The search can start
    // at the current index, since the unmatched old keyed elems are
    // pushed forward in the old copy array.
    var newKey = newElem.data.key;
    if (newKey && newKey in oldKeyed) {
      var pair = oldKeyed[newKey];
      if (pair.first !== oldElem) {
        algo.move(oldCopy, algo.indexOf(oldCopy, pair.first, i), i);
        sendBranch(pair.second, MSG_BEFORE_MOVE);
        host.insertBefore(pair.second, currNode);
        sendBranch(pair.second, MSG_AFTER_MOVE);
        oldElem = pair.first;
        currNode = pair.second;
      }
    }

    // If both elements are identical, there is nothing to do.
    // This can occur when a component renders cached content.
    if (oldElem === newElem) {
      currNode = currNode.nextSibling;
      continue;
    }

    // If the old elem is keyed and does not match the new elem key,
    // create a new node. This is necessary since the old keyed elem
    // may be matched at a later point in the diff.
    var oldKey = oldElem.data.key;
    if (oldKey && oldKey !== newKey) {
      algo.insert(oldCopy, i, newElem);
      host.insertBefore(createNode(newElem), currNode);
      continue;
    }

    // If the elements have different types, create a new node.
    if (oldElem.type !== newElem.type) {
      algo.insert(oldCopy, i, newElem);
      host.insertBefore(createNode(newElem), currNode);
      continue;
    }

    // If the element is a text node, update its text content.
    if (newElem.type === ElemType.Text) {
      currNode.textContent = <string>newElem.tag;
      currNode = currNode.nextSibling;
      continue;
    }

    // At this point, the element is a Node or Component type.
    // If the element tags are different, create a new node.
    if (oldElem.tag !== newElem.tag) {
      algo.insert(oldCopy, i, newElem);
      host.insertBefore(createNode(newElem), currNode);
      continue;
    }

    // If the element is a Node type, update the node in place.
    if (newElem.type === ElemType.Node) {
      updateAttributes(<HTMLElement>currNode, oldElem.data, newElem.data);
      updateContent(currNode, oldElem.children, newElem.children);
      currNode = currNode.nextSibling;
      continue;
    }

    // At this point, the node is a Component type; update it.
    var component = componentMap.get(currNode);
    component.init(newElem.data, newElem.children);
    sendMessage(component, MSG_UPDATE_REQUEST);
    currNode = currNode.nextSibling;
  }

  // Dispose of the old nodes pushed to the end of the host.
  for (var i = oldCopy.length - 1; i >= newCount; --i) {
    var oldNode = host.lastChild;
    sendBranch(oldNode, MSG_BEFORE_DETACH);
    host.removeChild(oldNode);
    disposeBranch(oldNode);
  }
}


/**
 * Send a message to each component in the branch.
 */
function sendBranch(root: Node, msg: IMessage): void {
  if (root.nodeType === 1) {
    var component = componentMap.get(root);
    if (component) sendMessage(component, msg);
  }
  for (var node = root.firstChild; node; node = node.nextSibling) {
    sendBranch(node, msg);
  }
}


/**
 * Dispose of each component in the branch.
 */
function disposeBranch(root: Node): void {
  if (root.nodeType === 1) {
    var component = componentMap.get(root);
    if (component) component.dispose();
  }
  for (var node = root.firstChild; node; node = node.nextSibling) {
    disposeBranch(node);
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
 * Update the node attributes with the delta of attribute objects.
 */
function updateAttributes(node: HTMLElement, oldAttrs: any, newAttrs: any): void {
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
