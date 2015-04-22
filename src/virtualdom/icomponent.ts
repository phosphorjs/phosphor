/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import IMessageHandler = core.IMessageHandler;

import IDisposable = utility.IDisposable;


/**
 * An object which manages its own DOM node in a virtual DOM hierarchy.
 *
 * The renderer will send a component the following messages:
 *
 *   'update-request' - Sent when the component should update.
 *
 *   'after-attach' - Sent after the node is attached to the DOM.
 *
 *   'before-detach' - Sent before the node is detached from the DOM.
 *
 *   'before-move' - Sent before the node is moved in the DOM.
 *
 *   'after-move' - Sent after the node is moved in the DOM.
 */
export
interface IComponent<T extends IData> extends IDisposable, IMessageHandler {
  /**
   * The DOM node for the component.
   *
   * This must remain constant for the lifetime of the component.
   */
  node: HTMLElement;

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is re-rendered by its parent.
   *
   * It is *not* called when the component is first instantiated.
   */
  init(data: T, children: Elem[]): void;
}


/**
 * A component class type.
 */
export
interface IComponentClass<T extends IData> {
  /**
   * Construct a new component.
   */
  new(data: T, children: Elem[]): IComponent<T>;
}

} // module phosphor.virtualdom
