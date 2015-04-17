/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import IDisposable = utility.IDisposable;


/**
 * An object which manages its own node in a virtual DOM tree.
 */
export
interface IComponent<T extends IElemData> extends IDisposable {
  /**
   * The DOM node for the component.
   */
  node: HTMLElement;

  /**
   * Initialize the component with new data and children.
   *
   * This is called every time the component is rendered by its parent.
   *
   * A component is resposible for updating the content of its node.
   */
  init(data: T, children: Elem[]): void;
}


/**
 * A component class type.
 */
export
interface IComponentClass<T extends IElemData> {
  /**
   * Construct a new component.
   */
  new(): IComponent<T>;
}

} // module phosphor.virtualdom
