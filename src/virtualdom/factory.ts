/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {


/**
 * Create a virtual element factory function for the given tag.
 */
export
function createFactory<T extends IVirtualElementData>(tag: string | IComponentClass<T>): IVirtualElementFactory<T> {
  return createElement.bind(void 0, tag);
}


/**
 * A concrete implementation of IVirtualElement.
 */
class VirtualElement implements IVirtualElement {
  /**
   * A property used to quickly type-check a virtual element object.
   */
  isElement: boolean;

  /**
   * Construct a new virtual element.
   */
  constructor(
    public type: VirtualElementType,
    public tag: string | IComponentClass<any>,
    public data: IVirtualElementData,
    public children: IVirtualElement[]) { }
}

VirtualElement.prototype.isElement = true;


/**
 * A singleton empty object.
 */
var emptyObject: any = Object.freeze(Object.create(null));

/**
 * A singleton empty array.
 */
var emptyArray: any[] = Object.freeze([]);


/**
 * Create a new virtual text element.
 */
function createTextElement(text: string): IVirtualElement {
  return new VirtualElement(VirtualElementType.Text, text, emptyObject, emptyArray);
}


/**
 * Create a new virtual node element.
 */
function createNodeElement(tag: string, data: IVirtualElementData, children: IVirtualElement[]): IVirtualElement {
  return new VirtualElement(VirtualElementType.Node, tag, data || emptyObject, children || emptyArray);
}


/**
 * Create a new virtual component element.
 */
function createComponentElement(tag: IComponentClass<any>, data: IVirtualElementData, children: IVirtualElement[]): IVirtualElement {
  return new VirtualElement(VirtualElementType.Component, tag, data || emptyObject, children || emptyArray);
}


/**
 * Extend the first array with elements of the second.
 */
function extend(first: any[], second: any[]): void {
  for (var i = 0, n = second.length; i < n; ++i) {
    var item = second[i];
    if (item) first.push(item);
  }
}


/**
 * Create a new virtual element with the given tag name.
 *
 * This can be bound to the tag name to create an element factory.
 */
function createElement(tag: string | IComponentClass<any>, first?: any): IVirtualElement {
  var data: any = null;
  var children: any[] = null;
  if (first) {
    if (typeof first === 'string' || first.isElement) {
      children = [first];
    } else if (Array.isArray(first)) {
      children = first.slice();
    } else {
      data = first;
    }
  }
  var count = arguments.length;
  if (count > 2) {
    children = children || [];
    for (var i = 2; i < count; ++i) {
      var child = arguments[i];
      if (Array.isArray(child)) {
        extend(children, child);
      } else if (child) {
        children.push(child);
      }
    }
  }
  if (children) {
    for (var i = 0, n = children.length; i < n; ++i) {
      var child = children[i];
      if (typeof child === 'string') {
        children[i] = createTextElement(child);
      }
    }
  }
  var elem: IVirtualElement;
  if (typeof tag === 'string') {
    elem = createNodeElement(tag, data, children);
  } else {
    elem = createComponentElement(tag, data, children);
  }
  return elem;
}

} // module phosphor.virtualdom
