/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

import Orientation = enums.Orientation;


/**
 * The class name assigned to a splitter handle.
 */
var HANDLE_CLASS = 'p-SplitterHandle';

/**
 * The class name assigned to a splitter handle overlay.
 */
var OVERLAY_CLASS = 'p-SplitterHandle-overlay';

/**
 * The class name added to horizontal splitter handles.
 */
var HORIZONTAL_CLASS = 'p-mod-horizontal';

/**
 * The class name added to vertical splitter handles.
 */
var VERTICAL_CLASS = 'p-mod-vertical';

/**
 * The class name added to hidden splitter handles.
 */
var HIDDEN_CLASS = 'p-mod-hidden';


/**
 * A class which manages a handle node for a splitter.
 */
export
class SplitterHandle {
  /**
   * Construct a new splitter handle.
   */
  constructor(orientation: Orientation) {
    this._node = this.createNode();
    this.orientation = orientation;
  }

  /**
   * Get whether the handle is hidden.
   */
  get hidden(): boolean {
    return this._hidden;
  }

  /**
   * Set whether the handle is hidden.
   */
  set hidden(hidden: boolean) {
    if (hidden === this._hidden) {
      return;
    }
    this._hidden = hidden;
    if (hidden) {
      this._node.classList.add(HIDDEN_CLASS);
    } else {
      this._node.classList.remove(HIDDEN_CLASS);
    }
  }

  /**
   * Get the orientation of the handle.
   */
  get orientation(): Orientation {
    return this._orientation;
  }

  /**
   * Set the orientation of the handle.
   */
  set orientation(value: Orientation) {
    if (value === this._orientation) {
      return;
    }
    var node = this._node;
    if (value === Orientation.Horizontal) {
      node.classList.remove(VERTICAL_CLASS);
      node.classList.add(HORIZONTAL_CLASS);
    } else {
      node.classList.remove(HORIZONTAL_CLASS);
      node.classList.add(VERTICAL_CLASS);
    }
    this._orientation = value;
  }

  /**
   * Get the DOM node for the handle.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Create the DOM node for the handle.
   */
  protected createNode(): HTMLElement {
    var node = document.createElement('div');
    var overlay = document.createElement('div');
    node.className = HANDLE_CLASS;
    overlay.className = OVERLAY_CLASS;
    node.appendChild(overlay);
    return node;
  }

  private _hidden = false;
  private _node: HTMLElement;
  private _orientation: Orientation;
}

} // module phosphor.layout
