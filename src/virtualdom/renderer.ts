/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  VNode
} from './dom';


/**
 * Render virtual DOM content into a host element.
 *
 * @param content - The virtual DOM content to render.
 *
 * @param host - The host element for the rendered content.
 *
 * #### Notes
 * This renders the delta from the previous rendering. It assumes that
 * the content of the host element is not manipulated by external code.
 *
 * Providing `null` content will clear the rendering.
 *
 * Externally modifying the provided content or the host element will
 * result in undefined rendering behavior.
 */
export
function render(content: VNode | VNode[], host: HTMLElement): void {
  Private.renderImpl(content, host);
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * The internal render entry point.
   */
  export
  function renderImpl(content: VNode | VNode[], host: HTMLElement): void {
    let oldContent = hostMap.get(host) || emptyArray;
    let newContent = asArray(content);
    hostMap.set(host, newContent);
    updateContent(host, oldContent, newContent);
  }

  /**
   * A weak mapping of host element to virtual DOM content.
   */
  const hostMap = new WeakMap<HTMLElement, VNode[]>();

  /**
   * A shared frozen empty array.
   */
  const emptyArray = Object.freeze([]);

  /**
   * A shared frozen empty object.
   */
  const emptyObject = Object.freeze({});

  /**
   * Coerce content into a virtual node array.
   *
   * Null content will be coerced to an empty array.
   */
  function asArray(content: VNode | VNode[]): VNode[] {
    if (content instanceof Array) {
      return content as VNode[];
    }
    if (content) {
      return [content as VNode];
    }
    return emptyArray;
  }

  /**
   * Update a host element with the delta of the virtual content.
   *
   * This is the core "diff" algorithm. There is no explicit "patch"
   * phase. The host is patched at each step as the diff progresses.
   */
  function updateContent(host: HTMLElement, oldContent: VNode[], newContent: VNode[]): void {
    // Bail early if the content is identical. This can occur when an
    // node has no children or if the user is rendering cached content.
    if (oldContent === newContent) {
      return;
    }

    // Collect the old keyed elems into a mapping.
    let oldKeyed = collectKeys(host, oldContent);

    // Create a copy of the old content which can be modified in-place.
    let oldCopy = oldContent.slice();

    // Update the host with the new content. The diff always proceeds
    // forward and never modifies a previously visited index. The old
    // copy array is modified in-place to reflect the changes made to
    // the host children. This causes the stale nodes to be pushed to
    // the end of the host node and removed at the end of the loop.
    let currNode = host.firstChild;
    let newCount = newContent.length;
    for (let i = 0; i < newCount; ++i) {

      // If the old elems are exhausted, create a new node.
      if (i >= oldCopy.length) {
        host.appendChild(createNode(newContent[i]));
        continue;
      }

      // Cache a reference to the old and new elems.
      let oldVNode = oldCopy[i];
      let newVNode = newContent[i];

      // If the new elem is keyed, move an old keyed elem to the proper
      // location before proceeding with the diff. The search can start
      // at the current index, since the unmatched old keyed elems are
      // pushed forward in the old copy array.
      let newKey = newVNode.attrs.key;
      if (newKey && newKey in oldKeyed) {
        let pair = oldKeyed[newKey];
        if (pair.vNode !== oldVNode) {
          arrayMove(oldCopy, oldCopy.indexOf(pair.vNode), i);
          host.insertBefore(pair.element, currNode);
          oldVNode = pair.vNode;
          currNode = pair.element;
        }
      }

      // If both elements are identical, there is nothing to do.
      // This can occur when the user renders cached content.
      if (oldVNode === newVNode) {
        currNode = currNode.nextSibling;
        continue;
      }

      // If the old elem is keyed and does not match the new elem key,
      // create a new node. This is necessary since the old keyed elem
      // may be matched at a later point in the diff.
      let oldKey = oldVNode.attrs.key;
      if (oldKey && oldKey !== newKey) {
        arrayInsert(oldCopy, i, newVNode);
        host.insertBefore(createNode(newVNode), currNode);
        continue;
      }

      // If the elements have different types, create a new node.
      if (oldVNode.type !== newVNode.type) {
        arrayInsert(oldCopy, i, newVNode);
        host.insertBefore(createNode(newVNode), currNode);
        continue;
      }

      // If the element is a text node, update its text content.
      if (newVNode.type === 'text') {
        currNode.textContent = newVNode.tag;
        currNode = currNode.nextSibling;
        continue;
      }

      // At this point, the node is an 'element' type. If the tags
      // are different, create a new node.
      if (oldVNode.tag !== newVNode.tag) {
        arrayInsert(oldCopy, i, newVNode);
        host.insertBefore(createNode(newVNode), currNode);
        continue;
      }

      // The element tags match, update the element in place.
      updateAttrs(currNode as HTMLElement, oldVNode.attrs, newVNode.attrs);
      updateContent(currNode as HTMLElement, oldVNode.children, newVNode.children);
      currNode = currNode.nextSibling;
    }

    // Dispose of the old nodes pushed to the end of the host.
    for (let i = oldCopy.length - 1; i >= newCount; --i) {
      host.removeChild(host.lastChild);
    }
  }

  /**
   * Add attributes to a newly created DOM node.
   */
  function addAttrs(node: HTMLElement, attrs: any): void {
    // Set the known attributes defined in the attr table.
    for (let name in attrs) {
      let mode = attrModeTable[name];
      if (mode === AttrMode.Property || mode === AttrMode.Event) {
        (node as any)[name] = attrs[name];
      } else if (mode === AttrMode.Attribute) {
        node.setAttribute(name.toLowerCase(), attrs[name]);
      }
    }

    // Handle the dataset values.
    let dataset = attrs.dataset;
    if (dataset) {
      for (let name in dataset) {
        node.setAttribute(`data-${name}`, dataset[name]);
      }
    }

    // Handle the inline styles.
    let styles = attrs.style;
    if (styles) {
      let nodeStyle = node.style as any;
      for (let name in styles) {
        nodeStyle[name] = styles[name];
      }
    }
  }

  /**
   * Update the node attributes with the delta of attribute objects.
   */
  function updateAttrs(node: HTMLElement, oldAttrs: any, newAttrs: any): void {
    // Do nothing if the attrs are the same object.
    if (oldAttrs === newAttrs) {
      return;
    }

    // Remove attributes which no longer exist.
    for (let name in oldAttrs) {
      if (!(name in newAttrs)) {
        let mode = attrModeTable[name];
        if (mode === AttrMode.Property) {
          node.removeAttribute(name);
        } else if (mode === AttrMode.Attribute) {
          node.removeAttribute(name.toLowerCase());
        } else if (mode === AttrMode.Event) {
          (node as any)[name] = null;
        }
      }
    }

    // Add new attributes an update existing ones.
    for (let name in newAttrs) {
      let value = newAttrs[name];
      if (oldAttrs[name] !== value) {
        let mode = attrModeTable[name];
        if (mode === AttrMode.Property || mode === AttrMode.Event) {
          (node as any)[name] = value;
        } else if (mode === AttrMode.Attribute) {
          node.setAttribute(name.toLowerCase(), value);
        }
      }
    }

    // Handle the dataset values.
    let oldDataset = oldAttrs.dataset || emptyObject;
    let newDataset = newAttrs.dataset || emptyObject;
    if (oldDataset !== newDataset) {
      for (let name in oldDataset) {
        if (!(name in newDataset)) {
          node.removeAttribute('data-' + name);
        }
      }
      for (let name in newDataset) {
        let value = newDataset[name];
        if (oldDataset[name] !== value) {
          node.setAttribute('data-' + name, value);
        }
      }
    }

    // Handle the inline styles.
    let oldStyle = oldAttrs.style || emptyObject;
    let newStyle = newAttrs.style || emptyObject;
    if (oldStyle !== newStyle) {
      let nodeStyle = node.style as any;
      for (let name in oldStyle) {
        if (!(name in newStyle)) {
          nodeStyle[name] = '';
        }
      }
      for (let name in newStyle) {
        let value = newStyle[name];
        if (oldStyle[name] !== value) {
          nodeStyle[name] = value;
        }
      }
    }
  }

  /**
   * A mapping of string key to pair of element and rendered node.
   */
  interface IKeyMap {
    [key: string]: { vNode: VNode, element: HTMLElement };
  }

  /**
   * Collect a mapping of keyed elements for the host content.
   */
  function collectKeys(host: HTMLElement, content: VNode[]): IKeyMap {
    let node = host.firstChild;
    let keyed: IKeyMap = Object.create(null);
    for (var i = 0, n = content.length; i < n; ++i) {
      let vNode = content[i];
      if (vNode.type === 'element') {
        let key = vNode.attrs.key;
        if (key) keyed[key] = { vNode, element: node as HTMLElement };
      }
      node = node.nextSibling;
    }
    return keyed;
  }

  /**
   * Create and return a new DOM node for a virtual element.
   */
  function createNode(elem: VNode): HTMLElement | Text {
    let node: HTMLElement | Text;
    if (elem.type === 'text') {
      node = document.createTextNode(elem.tag);
    } else {
      node = document.createElement(elem.tag);
      addAttrs(node as HTMLElement, elem.attrs);
      addContent(node as HTMLElement, elem.children);
    }
    return node;
  }

  /**
   * Create and add child content to a newly created DOM node.
   */
  function addContent(node: HTMLElement, content: VNode[]): void {
    for (var i = 0, n = content.length; i < n; ++i) {
      node.appendChild(createNode(content[i]));
    }
  }

  /**
   * An enum of the element attribute types.
   */
  const enum AttrMode { Property, Attribute, Event }

  /**
   * A mapping of attribute name to attribute mode.
   */
  const attrModeTable: { [key: string]: AttrMode } = {
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
    onwaiting:          AttrMode.Event
  };

  /**
   * Insert an element into an array at a specified index.
   */
  function arrayInsert<T>(array: T[], i: number, value: T): void {
    for (let k = array.length; k > i; --k) {
      array[k] = array[k - 1];
    }
    array[i] = value;
  }

  /**
   * Move an element in an array from one index to another.
   */
  function arrayMove<T>(array: T[], i: number, j: number): void {
    if (i === j) {
      return;
    }
    let value = array[i];
    let d = i < j ? 1 : -1;
    for (let k = i; k !== j; k += d) {
      array[k] = array[k + d];
    }
    array[j] = value;
  }
}
