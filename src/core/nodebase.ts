/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

import IDisposable = utility.IDisposable;


/**
 * A base class for creating objects which manage a DOM node.
 */
export
class NodeBase implements IDisposable {
  /**
   * Create the DOM node for a new object instance.
   *
   * This may be reimplemented to create a custom DOM node.
   */
  static createNode(): HTMLElement {
    return document.createElement('div');
  }

  /**
   * Construct a new node base.
   */
  constructor() {
    this._node = (<any>this.constructor).createNode();
  }

  /**
   * Dispose of the resources held by the object.
   */
  dispose(): void {
    this._node = null;
  }

  /**
   * Get the DOM node managed by the object.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Test whether the object's DOM node has the given class name.
   */
  hasClass(name: string): boolean {
    return this._node.classList.contains(name);
  }

  /**
   * Add a class name to the object's DOM node.
   */
  addClass(name: string): void {
    this._node.classList.add(name);
  }

  /**
   * Remove a class name from the object's DOM node.
   */
  removeClass(name: string): void {
    this._node.classList.remove(name);
  }

  private _node: HTMLElement;
}

} // phosphor.core
