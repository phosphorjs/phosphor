/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import IDisposable = core.IDisposable;
import IEventHandler = core.IEventHandler;

import IVirtualElement = phosphor.virtualdom.IVirtualElement;
import IVirtualElementData = phosphor.virtualdom.IVirtualElementData;


/**
 * An object which renders virtual DOM content.
 *
 * A component should update the content of its node when it receives
 * a 'render-request' event. This is typically done by calling the
 * `render` function of the virtual renderer with updated content.
 */
export
interface IComponent<T extends IVirtualElementData> extends IEventHandler, IDisposable {
  /**
   * The DOM node for the component.
   *
   * The component should render its content using this node as a host.
   */
  node: HTMLElement;

  /**
   * Initialize the component with data and children.
   *
   * This is called whenever the component is "rendered" by its parent.
   *
   * Returns true if the component should update, false otherwise.
   */
  init(data: T, children: IVirtualElement[]): boolean;
}


/**
 * A component class type.
 */
export
interface IComponentClass<T extends IVirtualElementData> {
  /**
   * Construct a new component.
   */
  new(): IComponent<T>;
}

} // module phosphor.components
