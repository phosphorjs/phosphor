/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  ElementAttrs, ElementDataset, ElementInlineStyle, VirtualElementNode,
  VirtualNode, VirtualTextNode
} from './dom';


/**
 * Create a real DOM element from a virtual element node.
 *
 * @param node - The virtual element node to realize.
 *
 * @returns A new DOM element for the given virtual element node.
 *
 * #### Notes
 * This creates a brand new *real* DOM element with a structure which
 * matches the given virtual DOM node.
 *
 * If virtual diffing is desired, use the `render` function instead.
 */
export
function realize(node: VirtualElementNode): HTMLElement {
  return Private.createDOMNode(node);
}


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
function render(content: VirtualNode | ReadonlyArray<VirtualNode> | null, host: HTMLElement): void {
  let oldContent = Private.hostMap.get(host) || [];
  let newContent = Private.asContentArray(content);
  Private.hostMap.set(host, newContent);
  Private.updateContent(host, oldContent, newContent);
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * A weak mapping of host element to virtual DOM content.
   */
  export
  const hostMap = new WeakMap<HTMLElement, ReadonlyArray<VirtualNode>>();

  /**
   * Cast a content value to a content array.
   */
  export
  function asContentArray(value: VirtualNode | ReadonlyArray<VirtualNode> | null): ReadonlyArray<VirtualNode> {
    if (!value) {
      return [];
    }
    if (value instanceof Array) {
      return value as ReadonlyArray<VirtualNode>;
    }
    return [value as VirtualNode];
  }

  /**
   * Create a new DOM element for a virtual node.
   */
  export
  function createDOMNode(node: VirtualTextNode): Text;
  export
  function createDOMNode(node: VirtualElementNode): HTMLElement;
  export
  function createDOMNode(node: VirtualNode): HTMLElement | Text;
  export
  function createDOMNode(node: VirtualNode): HTMLElement | Text {
    // Create a text node for a virtual text node.
    if (node.type === 'text') {
      return document.createTextNode(node.content);
    }

    // Create the HTML element with the specified tag.
    let element = document.createElement(node.tag);

    // Add the attributes for the new element.
    addAttrs(element, node.attrs);

    // Recursively populate the element with child content.
    for (let i = 0, n = node.children.length; i < n; ++i) {
      element.appendChild(createDOMNode(node.children[i]));
    }

    // Return the populated element.
    return element;
  }

  /**
   * Update a host element with the delta of the virtual content.
   *
   * This is the core "diff" algorithm. There is no explicit "patch"
   * phase. The host is patched at each step as the diff progresses.
   */
  export
  function updateContent(host: HTMLElement, oldContent: ReadonlyArray<VirtualNode>, newContent: ReadonlyArray<VirtualNode>): void {
    // Bail early if the content is identical.
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
    let currElem = host.firstChild;
    let newCount = newContent.length;
    for (let i = 0; i < newCount; ++i) {

      // If the old content is exhausted, create a new node.
      if (i >= oldCopy.length) {
        host.appendChild(createDOMNode(newContent[i]));
        continue;
      }

      // Lookup the old and new virtual nodes.
      let oldVNode = oldCopy[i];
      let newVNode = newContent[i];

      // If both elements are identical, there is nothing to do.
      if (oldVNode === newVNode) {
        currElem = currElem!.nextSibling;
        continue;
      }

      // Handle the simplest case of in-place text update first.
      if (oldVNode.type === 'text' && newVNode.type === 'text') {
        currElem!.textContent = newVNode.content;
        currElem = currElem!.nextSibling;
        continue;
      }

      // If the new node is text node, the old node is now known
      // to be an element node, so create and insert a new node.
      if (newVNode.type === 'text') {
        ArrayExt.insert(oldCopy, i, newVNode);
        host.insertBefore(createDOMNode(newVNode), currElem);
        continue;
      }

      // At this point, both nodes are known to be element nodes.
      let oldElemNode = oldVNode as VirtualElementNode;
      let newElemNode = newVNode as VirtualElementNode;

      // If the new elem is keyed, move an old keyed elem to the proper
      // location before proceeding with the diff. The search can start
      // at the current index, since the unmatched old keyed elems are
      // pushed forward in the old copy array.
      let newKey = newElemNode.attrs.key;
      if (newKey && newKey in oldKeyed) {
        let pair = oldKeyed[newKey];
        if (pair.vNode !== oldElemNode) {
          ArrayExt.move(oldCopy, oldCopy.indexOf(pair.vNode), i);
          host.insertBefore(pair.element, currElem);
          oldElemNode = pair.vNode;
          currElem = pair.element;
        }
      }

      // If both elements are identical, there is nothing to do.
      if (oldElemNode === newElemNode) {
        currElem = currElem!.nextSibling;
        continue;
      }

      // If the old elem is keyed and does not match the new elem key,
      // create a new node. This is necessary since the old keyed elem
      // may be matched at a later point in the diff.
      let oldKey = oldElemNode.attrs.key;
      if (oldKey && oldKey !== newKey) {
        ArrayExt.insert(oldCopy, i, newVNode);
        host.insertBefore(createDOMNode(newVNode), currElem);
        continue;
      }

      // If the tags are different, create a new node.
      if (oldElemNode.tag !== newElemNode.tag) {
        ArrayExt.insert(oldCopy, i, newElemNode);
        host.insertBefore(createDOMNode(newElemNode), currElem);
        continue;
      }

      // At this point, the element can be updated in-place.

      // Update the element attributes.
      updateAttrs(currElem as HTMLElement, oldElemNode.attrs, newElemNode.attrs);

      // Update the element content.
      updateContent(currElem as HTMLElement, oldElemNode.children, newElemNode.children);

      // Step to the next sibling element.
      currElem = currElem!.nextSibling;
    }

    // Dispose of the old nodes pushed to the end of the host.
    for (let i = oldCopy.length - newCount; i > 0; --i) {
      host.removeChild(host.lastChild!);
    }
  }

  /**
   * Add element attributes to a newly created HTML element.
   */
  function addAttrs(element: HTMLElement, attrs: ElementAttrs): void {
    // Add the inline event listeners and node attributes.
    for (let name in attrs) {
      if (name === 'key' || name === 'dataset' || name === 'style') {
        continue;
      }
      if (name.substr(0, 2) === 'on') {
        (element as any)[name] = (attrs as any)[name];
      } else {
        element.setAttribute(name, (attrs as any)[name]);
      }
    }

    // Add the dataset values.
    if (attrs.dataset) {
      addDataset(element, attrs.dataset);
    }

    // Add the inline styles.
    if (attrs.style) {
      addStyle(element, attrs.style);
    }
  }

  /**
   * Update the element attributes of an HTML element.
   */
  function updateAttrs(element: HTMLElement, oldAttrs: ElementAttrs, newAttrs: ElementAttrs): void {
    // Do nothing if the attrs are the same object.
    if (oldAttrs === newAttrs) {
      return;
    }

    // Setup the strongly typed loop variable.
    let name: keyof ElementAttrs;

    // Remove attributes and listeners which no longer exist.
    for (name in oldAttrs) {
      if (name === 'key' || name === 'dataset' || name === 'style') {
        continue;
      }
      if (name in newAttrs) {
        continue;
      }
      if (name.substr(0, 2) === 'on') {
        (element as any)[name] = null;
      } else {
        element.removeAttribute(name);
      }
    }

    // Add and update new and existing attributes and listeners.
    for (name in newAttrs) {
      if (name === 'key' || name === 'dataset' || name === 'style') {
        continue;
      }
      if (oldAttrs[name] === newAttrs[name]) {
        continue;
      }
      if (name.substr(0, 2) === 'on') {
        (element as any)[name] = (newAttrs as any)[name];
      } else {
        element.setAttribute(name, (newAttrs as any)[name]);
      }
    }

    // Update the dataset values.
    if (oldAttrs.dataset !== newAttrs.dataset) {
      updateDataset(element, oldAttrs.dataset || {}, newAttrs.dataset || {});
    }

    // Update the inline styles.
    if (oldAttrs.style !== newAttrs.style) {
      updateStyle(element, oldAttrs.style || {}, newAttrs.style || {});
    }
  }

  /**
   * Add dataset values to a newly created HTML element.
   */
  function addDataset(element: HTMLElement, dataset: ElementDataset): void {
    for (let name in dataset) {
      element.setAttribute(`data-${name}`, dataset[name]);
    }
  }

  /**
   * Update the dataset values of an HTML element.
   */
  function updateDataset(element: HTMLElement, oldDataset: ElementDataset, newDataset: ElementDataset): void {
    for (let name in oldDataset) {
      if (!(name in newDataset)) {
        element.removeAttribute(`data-${name}`);
      }
    }
    for (let name in newDataset) {
      if (oldDataset[name] !== newDataset[name]) {
        element.setAttribute(`data-${name}`, newDataset[name]);
      }
    }
  }

  /**
   * Add inline style values to a newly created HTML element.
   */
  function addStyle(element: HTMLElement, style: ElementInlineStyle): void {
    let elemStyle = element.style;
    let name: keyof ElementInlineStyle
    for (name in style) {
      elemStyle[name] = style[name];
    }
  }

  /**
   * Update the inline style values of an HTML element.
   */
  function updateStyle(element: HTMLElement, oldStyle: ElementInlineStyle, newStyle: ElementInlineStyle): void {
    let elemStyle = element.style;
    let name: keyof ElementInlineStyle;
    for (name in oldStyle) {
      if (!(name in newStyle)) {
        elemStyle[name] = null;
      }
    }
    for (name in newStyle) {
      if (oldStyle[name] !== newStyle[name]) {
        elemStyle[name] = newStyle[name];
      }
    }
  }

  /**
   * A mapping of string key to pair of element and rendered node.
   */
  type KeyMap = {
    [key: string]: { vNode: VirtualElementNode, element: HTMLElement };
  };

  /**
   * Collect a mapping of keyed elements for the host content.
   */
  function collectKeys(host: HTMLElement, content: ReadonlyArray<VirtualNode>): KeyMap {
    let node = host.firstChild;
    let keyMap: KeyMap = Object.create(null);
    for (let vNode of content) {
      if (vNode.type === 'element' && vNode.attrs.key) {
        keyMap[vNode.attrs.key] = { vNode, element: node as HTMLElement };
      }
      node = node!.nextSibling;
    }
    return keyMap;
  }
}
