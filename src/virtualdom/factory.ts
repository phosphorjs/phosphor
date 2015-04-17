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
 * A typedef for an elem factory child argument.
 */
export
type ElemChild = string | Elem;


/**
 * A factory function which creates an elem instance.
 */
export
interface IElemFactory<T extends IElemData> {
  /**
   * Create an elem instance with the given children.
   */
  (...children: (ElemChild | ElemChild[])[]): Elem;

  /**
   * Create an elem instance with the given data and children.
   */
  (data: T, ...children: (ElemChild | ElemChild[])[]): Elem;
}


/**
 * Create an elem factory function for the given tag.
 *
 * This will typically be used to create an elem factory function for
 * a user defined component. The `virtualdom` module exports a `dom`
 * object which contains factories for the standard DOM elements.
 */
export
function createElemFactory<T extends IElemData>(tag: string | IComponentClass<T>): IElemFactory<T> {
  return elemFactory.bind(void 0, tag);
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
 * The elem factory function implementation.
 *
 * When bound to a tag, this function implements IElemFactory.
 */
function elemFactory(tag: ElemTag, first?: any): Elem {
  var data: any = null;
  var children: any[] = null;

  if (first) {
    if (typeof first === 'string') {
      children = [first];
    } else if (first instanceof Elem) {
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
        children[i] = new Elem(ElemType.Text, child, emptyObject, emptyArray);
      }
    }
  }

  data = data || emptyObject;
  children = children || emptyArray;

  var elem: Elem;
  if (typeof tag === 'string') {
    elem = new Elem(ElemType.Node, tag, data, children);
  } else {
    elem = new Elem(ElemType.Component, tag, data, children);
  }

  return elem;
}

} // module phosphor.virtualdom
