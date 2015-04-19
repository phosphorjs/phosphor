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
 * An object which manages its own DOM node in a virtual DOM hierarchy.
 */
export
interface IComponent<T extends IData> extends IDisposable {
  /**
   * The DOM node for the component.
   *
   * This must remain constant for the lifetime of the component.
   */
  node: HTMLElement;

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is rendered by its owner.
   *
   * The component is responsible for updating the content of its node.
   */
  init(data: T, children: Elem[]): void;

  /**
   * A method invoked after the component is attached to the DOM.
   *
   * This will be called every time the node is attached to the DOM.
   * It will be called more than once if the component is moved, since
   * moving  a node requires a remove followed by an insert.
   */
  afterAttach?(): void;

  /**
   * A method invoked before the component is detached from the DOM.
   *
   * This will be called every time the node is detached from the DOM.
   * It will be called more than once if the component is moved, since
   * moving a node requires a remove followed by an insert.
   */
  beforeDetach?(): void;
}


/**
 * A component class type.
 */
export
interface IComponentClass<T extends IData> {
  /**
   * Construct a new component.
   */
  new(): IComponent<T>;
}

} // module phosphor.virtualdom
