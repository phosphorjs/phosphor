/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import IDisposable = core.IDisposable;


/**
 * An object which manages its own node in a virtual DOM tree.
 */
export
interface IComponent<T extends IData> extends IDisposable {
  /**
   * The DOM node for the component.
   *
   * The component should render its content using this node as a host.
   */
  node: HTMLElement;

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is rendered by its parent.
   *
   * A component is resposible for updating the content of its node.
   */
  init(data: T, children: IElement[]): void;
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
