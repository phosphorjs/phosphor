/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import emptyArray = core.emptyArray;
import emptyObject = core.emptyObject;

import IComponent = virtualdom.IComponent;
import IElement = virtualdom.IElement;
import IData = virtualdom.IData;


/**
 * A concrete base implementation of IComponent.
 *
 * This class should be used by subclasses that want to manage their
 * own DOM content outside the virtual DOM, but still be embeddable
 * inside a virtual DOM hierarchy.
 */
export
class BaseComponent<T extends IData> implements IComponent<T> {
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
   * Construct a new base component.
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
  get children(): IElement[] {
    return this._m_children;
  }

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is rendered by its parent.
   */
  init(data: T, children: IElement[]): void {
    this._m_data = data;
    this._m_children = children;
  }

  private _m_node: HTMLElement;
  private _m_data: T = emptyObject;
  private _m_children: IElement[] = emptyArray;
}

} // module phosphor.components
