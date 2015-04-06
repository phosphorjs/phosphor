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
 * A typedef of the child types for an element factory.
 */
export
type FactoryChildType = string | IElement;


/**
 * A typedef for the factory child argument type.
 */
export
type FactoryChildArgType = FactoryChildType | FactoryChildType[];


/**
 * A factory function which creates a virtual element.
 */
export
interface IFactory<T extends IData> {
  /**
   * Create a virtual element with the given children.
   */
  (...children: FactoryChildArgType[]): IElement;

  /**
   * Create a virtual element with the given data and children.
   */
  (data: T, ...children: FactoryChildArgType[]): IElement;
}


/**
 * Create a virtual element factory function for the given tag.
 *
 * This will typically be used to create an element factory for a user
 * defined component. The `virtualdom` module exports a `dom` object
 * which contains factories for the standard DOM elements.
 */
export
function createFactory<T extends IData>(tag: string | IComponentClass<T>): IFactory<T> {
  return factory.bind(void 0, tag);
}


/**
 * A concrete implementation of IElement.
 */
class VirtualElement implements IElement {
  /**
   * A prototype property used to quickly type-check an element.
   */
  __isElement: boolean;

  /**
   * Construct a new element.
   */
  constructor(
    public type: ElementType,
    public tag: string | IComponentClass<any>,
    public data: IData,
    public children: IElement[]) { }
}

VirtualElement.prototype.__isElement = true;


/**
 * Create a new virtual text element.
 */
function createTextElem(text: string): IElement {
  return new VirtualElement(ElementType.Text, text, emptyObject, emptyArray);
}


/**
 * Create a new virtual node element.
 */
function createNodeElem(tag: string, data: IData, children: IElement[]): IElement {
  data = data || emptyObject;
  children = children || emptyArray;
  return new VirtualElement(ElementType.Node, tag, data, children);
}


/**
 * Create a new virtual component element.
 */
function createCompElem(tag: IComponentClass<any>, data: IData, children: IElement[]): IElement {
  data = data || emptyObject;
  children = children || emptyArray;
  return new VirtualElement(ElementType.Component, tag, data, children);
}


/**
 * Extend the first array with elements of the second.
 *
 * Falsey values in the second array are ignored.
 */
function extend(first: any[], second: any[]): void {
  for (var i = 0, n = second.length; i < n; ++i) {
    var item = second[i];
    if (item) first.push(item);
  }
}


/**
 * The virtual element factory function implementation.
 *
 * When bound to a tag, this function implements IFactory.
 */
function factory(tag: string | IComponentClass<any>, first?: any): IElement {
  var data: any = null;
  var children: any[] = null;
  if (first) {
    if (typeof first === 'string' || first.__isElement) {
      children = [first];
    } else if (first instanceof Array) {
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
      if (child instanceof Array) {
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
        children[i] = createTextElem(child);
      }
    }
  }
  var elem: IElement;
  if (typeof tag === 'string') {
    elem = createNodeElem(tag, data, children);
  } else {
    elem = createCompElem(tag, data, children);
  }
  return elem;
}

} // module phosphor.virtualdom
