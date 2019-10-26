/*------------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|-----------------------------------------------------------------------------*/
import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  PJSX
} from './pjsx';

import {
  VNode
} from './vnode';


/**
 * The namespace for the virtual DOM functionality.
 */
export
namespace VDOM {
	/**
	 * Export `PJSX` as the namespace `JSX`.
	 */
	export
	import JSX = PJSX;

  /**
   * A type alias for VDOM props.
   */
  export
  type Props = PJSX.SpecialAttributes & Record<string, any>;

  /**
   * A type alias for a pure function component.
   */
  export
  type FC = (props: Props) => PJSX.Element;

  /**
   * Create a virtual DOM node for the given content.
   *
   * @param type - The element tag or function component to create.
   *
   * @param props - The props for the component.
   *
   * @param children - The children for the component.
   *
   * @returns A new virtual node for the given parameters.
   */
  export
  function createElement(type: string | FC, props: Props | null, ...children: PJSX.Children[]): PJSX.Element {
    return Private.createElement(type, props, children);
  }

  /**
   * The namespace for the `createElement` function statics.
   */
  export
  namespace createElement {
    /**
     * Export `PJSX` as the namespace `JSX`.
     */
    export
    import JSX = PJSX;
  }

  /**
   * Render virtual DOM content into a host element.
   *
   * @param content - The virtual content to render.
   *
   * @param host - The host element into which the content will be rendered.
   */
  export
  function render(content: PJSX.Children, host: Element): void {
    Private.render(content, host);
	}
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create a virtual DOM node for the given parameters.
   */
  export
  function createElement(type: string | VDOM.FC, props: VDOM.Props | null, children: PJSX.Children[]): PJSX.Element {
    let element: PJSX.Element;
    if (typeof type === 'string') {
      element = { tag: type, props: createProps(props, children) };
    } else {
      element = type(createProps(props, children));
    }
    return element;
  }

  /**
   * Render virtual DOM content into a host node.
   */
  export
  function render(content: PJSX.Children, host: Element): void {
    // Fetch the old content.
    let oldContent: VNode.Children = hostMap.get(host) || emptyArray;

    // Flatten the new content.
    let newContent: VNode.Children = flattenChildren([content]);

    // Save the new content.
    hostMap.set(host, newContent);

    // Update the host with the difference between old and new.
    updateContent(host, oldContent, newContent);
  }

  /**
   * A weakmap of host element to rendered content.
   */
  const hostMap = new WeakMap<Element, ReadonlyArray<VNode.Child>>();

  /**
   * A frozen empty VNode array.
   */
  const emptyArray: ReadonlyArray<any> = Object.freeze([]);

  /**
   * A frozen empty VNode props object.
   */
  const emptyProps: VNode.Props = Object.freeze({ children: emptyArray });

  /**
   * A frozen empty style attributes object.
   */
  const emptyStyle: PJSX.StyleAttributes = Object.freeze({});

  /**
   * A type guard for DOM elements.
   */
  function isElement(node: Node): node is Element {
    return node.nodeType === Node.ELEMENT_NODE;
  }

  /**
   * Create the props for a virtual node.
   */
  function createProps(props: VDOM.Props | null, children: PJSX.Children[]): VNode.Props {
    // Flatten the children.
    let kids = flattenChildren(children);

    // Clone and return the props.
    return props ? { ...props, children: kids } : { children: kids };
  }

  /**
   * Process virtual DOM children in a flat VNode array.
   */
  function flattenChildren(children: PJSX.Children[]): VNode.Children {
    // Return the frozen array singleton if there are no children.
    if (children.length === 0) {
      return emptyArray;
    }

    // Set up the flat result array.
    let result: VNode.Child[] = [];

    // Process each child.
    children.forEach(process);

    // Return the result.
    return result;

    // Process an element from the children array.
    function process(child: PJSX.Children): void {
      // Skip null children.
      if (child === null) {
        return;
      }

      // Handle string children.
      if (typeof child === 'string') {
        result.push(child);
        return;
      }

      // Handle other primitive children.
      if (typeof child === 'number' || typeof child === 'boolean') {
        result.push(String(child));
        return;
      }

      // Handle VNode children.
      if (!Array.isArray(child)) {
        result.push(child);
        return;
      }

      // Handle array children.
      child.forEach(process);
    }
  }

  /**
   * Create a new DOM node for the given virtual node.
   */
  function createDOM(node: string): Text;
  function createDOM(node: VNode): Element;
  function createDOM(node: VNode | string): Element | Text;
  function createDOM(node: VNode | string): Element | Text {
    // Handle string content.
    if (typeof node === 'string') {
      return document.createTextNode(node);
    }

    // Create the HTML element with the specified tag.
    let element = document.createElement(node.tag);

    // Update the props of the element.
    updateProps(element, emptyProps, node.props);

    // Update the content of the element.
    updateContent(element, emptyArray, node.props.children);

    // Return the populated element.
    return element;
  }

  /**
   * Find the index of a keyed vnode in a content array.
   */
  function findKeyIndex(key: string | number, content: VNode.Children, start: number): number {
    for (let i = start; i < content.length; ++i) {
      let child = content[i];
      if (typeof child !== 'string' && key === child.props.key) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Update a host element with the delta of the virtual content.
   *
   * This is the core "diff" algorithm. There is no explicit "patch"
   * phase. The host is patched at each step as the diff progresses.
   */
  function updateContent(host: Element, oldContent: VNode.Children, newContent: VNode.Children): void {
    // Bail early if the content is identical.
    if (oldContent === newContent) {
      return;
    }

		// Get a shallow copy of the content that can be mutated in-place.
		let tmpContent = [...oldContent];


    // Set up the current node variable.
    let currNode = host.firstChild;

    // Update the host with the new content. The diff always proceeds
    // forward and never modifies a previously visited index. The tmp
    // copy array is modified in-place to reflect the changes made to
    // the host children. This causes the stale nodes to be pushed to
    // the end of the host node and removed at the end of the loop.
    for (let i = 0; i < newContent.length; ++i) {
			// Look up the new child.
			let newChild = newContent[i];

      // If the old content is exhausted, create a new node.
      if (i >= tmpContent.length) {
        host.appendChild(createDOM(newChild));
        continue;
      }

      // Sanity check the DOM state.
      if (currNode === null) {
        throw new Error('invalid VDOM state');
      }

      // Lookup the old child.
      let oldChild = tmpContent[i];

      // If both elements are identical, there is nothing to do.
      if (oldChild === newChild) {
				currNode = currNode.nextSibling;
        continue;
      }

      // Handle the simplest case of in-place text update first.
      if (typeof oldChild === 'string' && typeof newChild === 'string') {
        currNode.textContent = newChild;
				currNode = currNode.nextSibling;
        continue;
      }

      // If the old or new node is a text node, the other node is now
      // known to be an element node, so create and insert a new node.
      if (typeof oldChild === 'string' || typeof newChild === 'string') {
        host.insertBefore(createDOM(newChild), currNode);
        ArrayExt.insert(tmpContent, i, newChild);
        continue;
      }

      // If the new elem is keyed, move an old keyed elem to the proper
      // location before proceeding with the diff. The search can start
      // at the current index, since the unmatched old keyed elems are
      // pushed forward in the content array.
      if (newChild.props.key !== undefined) {
        let j = findKeyIndex(newChild.props.key, tmpContent, i);
        if (j !== -1 && i !== j) {
          let node = host.childNodes[j];
          host.insertBefore(node, currNode);
          ArrayExt.move(tmpContent, j, i);
          oldChild = tmpContent[i] as VNode;
          currNode = node;
        }
      }

      // If both nodes are identical, there is nothing to do.
      if (oldChild === newChild) {
				currNode = currNode.nextSibling;
        continue;
      }

      // If the keys are different, create a new node.
      if (oldChild.props.key !== newChild.props.key) {
        host.insertBefore(createDOM(newChild), currNode);
        ArrayExt.insert(tmpContent, i, newChild);
        continue;
      }

      // If the tags are different, create a new node.
      if (oldChild.tag !== newChild.tag) {
				host.insertBefore(createDOM(newChild), currNode);
        ArrayExt.insert(tmpContent, i, newChild);
        continue;
      }

      // Sanity check the DOM state.
      if (!isElement(currNode)) {
        throw new Error('invalid virtual DOM state');
      }

      // Update the props of the current element.
      updateProps(currNode, oldChild.props, newChild.props);

      // Update the content of the current element.
      updateContent(currNode, oldChild.props.children, newChild.props.children);

      // Step to the next sibling element.
			currNode = currNode.nextSibling;
    }

    // Dispose of the old nodes pushed to the end of the host.
    for (let n = tmpContent.length - newContent.length; n > 0; --n) {
      host.removeChild(host.lastChild!);
    }
  }

  /**
   * Update an element with the difference of props.
   */
  function updateProps(element: Element, oldProps: VDOM.Props, newProps: VDOM.Props): void {
    // Do nothing if the props are the same object.
    if (oldProps === newProps) {
      return;
    }

    // Process the old props.
    for (let name in oldProps) {
      if (!(name in newProps)) {
        setProp(element, name, oldProps[name], null);
      }
    }

    // Process the new props.
    for (let name in newProps) {
      if (name in oldProps) {
        setProp(element, name, oldProps[name], newProps[name]);
      } else {
        setProp(element, name, null, newProps[name]);
      }
    }
  }

  /**
   * Apply a property difference to an element.
   */
  function setProp(element: Element, name: string, oldValue: any | null, newValue: any | null): void {
    // Skip the special `key` and `children` props.
    if (name === 'key' || name === 'children') {
      return;
    }

    // Handle the special `ref` prop.
    if (name === 'ref') {
      if (oldValue) {
        oldValue.current = null;
      }
      if (newValue) {
        newValue.current = element;
      }
      return;
    }

    // Bail early if the value does not change.
    if (oldValue === newValue) {
      return;
    }

    // Handle the style props.
    if (name === 'style') {
      if (oldValue === null) {
        oldValue = emptyStyle;
      }
      if (newValue === null) {
        newValue = emptyStyle;
      }
      updateStyle((element as HTMLElement).style, oldValue, newValue);
      return;
    }

    // Handle inline event listeners.
    if (name[0] === 'o' && name[1] === 'n') {
      (element as any)[name] = newValue;
      return;
    }

    // Set or remove the attribute as appropriate.
    if (newValue === false || newValue === null) {
      element.removeAttribute(name);
    } else if (newValue === true) {
      element.setAttribute(name, '');
    } else {
      element.setAttribute(name, newValue);
    }

    // Special-case `input.value`.
    if (name === 'value' && element.tagName === 'INPUT') {
      (element as HTMLInputElement).value = newValue;
    }
  }

  /**
   * Update a style declaration with the difference of style attributes.
   */
  function updateStyle(style: CSSStyleDeclaration, oldAttrs: PJSX.StyleAttributes, newAttrs: PJSX.StyleAttributes): void {
    // Bail early if the attr objects don't change.
    if (oldAttrs === newAttrs) {
      return;
    }

    // Process the old attrs.
    for (let name in oldAttrs) {
      if (!(name in newAttrs)) {
        setStyleAttr(style, name, oldAttrs[name], '');
      }
    }

    // Process the new attrs.
    for (let name in newAttrs) {
      if (name in oldAttrs) {
        setStyleAttr(style, name, oldAttrs[name], newAttrs[name]);
      } else {
        setStyleAttr(style, name, '', newAttrs[name]);
      }
    }
  }

  /**
   * Apply an attribute difference to a style declaration.
   */
  function setStyleAttr(style: CSSStyleDeclaration, name: string, oldValue: string | number, newValue: string | number): void {
    if (oldValue !== newValue) {
      (style as any)[name] = String(newValue);
    }
  }
}
