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
    this._node = document.createElement(<string>ctor.tagName);
    this._node.className = <string>ctor.className;
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose(): void {
    this._node = null;
    this._data = null;
    this._children = null;
  }

  /**
   * Get the DOM node for the component.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Get the current data object for the component.
   */
  get data(): T {
    return this._data;
  }

  /**
   * Get the current children for the component.
   */
  get children(): IElement[] {
    return this._children;
  }

  /**
   * Initialize the component with new data and children.
   *
   * This is called whenever the component is rendered by its parent.
   */
  init(data: T, children: IElement[]): void {
    this._data = data;
    this._children = children;
  }

  private _node: HTMLElement;
  private _data: T = emptyObject;
  private _children: IElement[] = emptyArray;
}

} // module phosphor.virtualdom
