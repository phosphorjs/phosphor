/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.virtualdom {

import IIterable = collections.IIterable;

import ICoreEvent = core.ICoreEvent;

/**
 * A singleton empty object.
 */
var emptyObject: any = Object.freeze(Object.create(null));

/**
 * A singleton empty array.
 */
var emptyArray: any[] = Object.freeze([]);


/**
 * A concrete implementation of IComponent that does not use the virtual DOM to
 * render content.
 *
 * This should be used by subclasses that want to manage their own content
 * outside the virtual DOM. However, the lifecycle of BaseComponent
 * instances is still managed by the virtual DOM renderer, which allows
 * nested hierarchies of Component and BaseComponents.
 */
export
class BaseComponent<T extends IVirtualElementData> implements IComponent<T> {
  /**
   * The tag name used to create the component's DOM node.
   *
   * A subclass may redefine this property.
   */
  static tagName = 'div';

  /**
   * The initial class name for the component's DOM node.
   *
   * A subclass may redefine this property.
   */
  static className = '';

  /**
   * Construct a new component.
   */
  constructor() {
    var ctor = <any>this.constructor;
    this._m_node = document.createElement(<string>ctor.tagName);
    this._m_node.className = <string>ctor.className;
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._m_node = null;
    this._m_data = null;
    this._m_children = null;
  }

  /**
   * Get the DOM node for the component.
   */
  get node(): HTMLElement {
    return this._m_node;
  }

  /**
   * Get the current data object for the component.
   */
  get data(): T {
    return this._m_data;
  }

  /**
   * Get the current children for the component.
   */
  get children(): IVirtualElement[] {
    return this._m_children;
  }

  /**
   * Initialize the component with new data and children.
   *
   * This is called automatically by the renderer at the proper times.
   *
   * Returns true if the component should be updated, false otherwise.
   * The default implementation returns true. A reimplementation must
   * call the superclass method to update the internal component state.
   */
  init(data: T, children: IVirtualElement[]): boolean {
    this._m_data = data || emptyObject;
    this._m_children = children || emptyArray;
    return true;
  }

  /**
   * Process an event dispatched to the component.
   */
  processEvent(event: ICoreEvent): void {}

  private _m_node: HTMLElement;
  private _m_data: T = emptyObject;
  private _m_children: IVirtualElement[] = emptyArray;
}

} // module phosphor.virtualdom
