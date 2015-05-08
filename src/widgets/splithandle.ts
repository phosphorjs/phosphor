/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import NodeBase = core.NodeBase;


/**
 * The class name assigned to a split handle.
 */
var HANDLE_CLASS = 'p-SplitHandle';

/**
 * The class name assigned to a split handle overlay.
 */
var OVERLAY_CLASS = 'p-SplitHandle-overlay';

/**
 * The class name added to horizontal split handles.
 */
var HORIZONTAL_CLASS = 'p-mod-horizontal';

/**
 * The class name added to vertical split handles.
 */
var VERTICAL_CLASS = 'p-mod-vertical';

/**
 * The class name added to hidden split handles.
 */
var HIDDEN_CLASS = 'p-mod-hidden';


/**
 * A class which manages a handle node for a split panel.
 */
export
class SplitHandle extends NodeBase {
  /**
   * Create the DOM node for a split handle.
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    var overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    node.appendChild(overlay);
    return node;
  }

  /**
   * Construct a new split handle.
   */
  constructor(orientation: Orientation) {
    super();
    this.addClass(HANDLE_CLASS);
    this._orientation = orientation;
    if (orientation === Orientation.Horizontal) {
      this.addClass(HORIZONTAL_CLASS);
    } else {
      this.addClass(VERTICAL_CLASS);
    }
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
      this.addClass(HIDDEN_CLASS);
    } else {
      this.removeClass(HIDDEN_CLASS);
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
    this._orientation = value;
    if (value === Orientation.Horizontal) {
      this.removeClass(VERTICAL_CLASS);
      this.addClass(HORIZONTAL_CLASS);
    } else {
      this.removeClass(HORIZONTAL_CLASS);
      this.addClass(VERTICAL_CLASS);
    }
  }

  private _hidden = false;
  private _orientation: Orientation;
}

} // module phosphor.widgets
