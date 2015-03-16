/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {


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
    this._m_node = this.createNode();
    this.orientation = orientation;
  }

  /**
   * Get whether the handle is hidden.
   */
  get hidden(): boolean {
    return this._m_hidden;
  }

  /**
   * Set whether the handle is hidden.
   */
  set hidden(hidden: boolean) {
    if (hidden === this._m_hidden) {
      return;
    }
    this._m_hidden = hidden;
    if (hidden) {
      this._m_node.classList.add(HIDDEN_CLASS);
    } else {
      this._m_node.classList.remove(HIDDEN_CLASS);
    }
  }

  /**
   * Get the orientation of the handle.
   */
  get orientation(): Orientation {
    return this._m_orientation;
  }

  /**
   * Set the orientation of the handle.
   */
  set orientation(value: Orientation) {
    if (value === this._m_orientation) {
      return;
    }
    var node = this._m_node;
    if (value === Orientation.Horizontal) {
      node.classList.remove(VERTICAL_CLASS);
      node.classList.add(HORIZONTAL_CLASS);
    } else {
      node.classList.remove(HORIZONTAL_CLASS);
      node.classList.add(VERTICAL_CLASS);
    }
    this._m_orientation = value;
  }

  /**
   * Get the DOM node for the handle.
   */
  get node(): HTMLElement {
    return this._m_node;
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

  private _m_hidden = false;
  private _m_node: HTMLElement;
  private _m_orientation: Orientation;
}

} // module phosphor.widgets
