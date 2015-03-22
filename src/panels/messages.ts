/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import Message = core.Message;


/**
 * A message class for child panel related messages.
 */
export
class ChildMessage extends Message {
  /**
   * Construct a new child message.
   */
  constructor(type: string, child: Panel) {
    super(type);
    this._child = child;
  }

  /**
   * The child panel for the message.
   */
  get child(): Panel {
    return this._child;
  }

  private _child: Panel;
}


/**
 * A message class for 'move' messages.
 */
export
class MoveMessage extends Message {
  /**
   * Construct a new move message.
   */
  constructor(oldX: number, oldY: number, x: number, y: number) {
    super('move');
    this._oldX = oldX;
    this._oldY = oldY;
    this._x = x;
    this._y = y;
  }

  /**
   * The previous X coordinate of the panel.
   */
  get oldX(): number {
    return this._oldX;
  }

  /**
   * The previous Y coordinate of the panel.
   */
  get oldY(): number {
    return this._oldY;
  }

  /**
   * The current X coordinate of the panel.
   */
  get x(): number {
    return this._x;
  }

  /**
   * The current Y coordinate of the panel.
   */
  get y(): number {
    return this._y;
  }

  private _oldX: number;
  private _oldY: number;
  private _x: number;
  private _y: number;
}


/**
 * A message class for 'resize' messages.
 */
export
class ResizeMessage extends Message {
  /**
   * Construct a new resize message.
   */
  constructor(oldWidth: number, oldHeight: number, width: number, height: number) {
    super('resize');
    this._oldWidth = oldWidth;
    this._oldHeight = oldHeight;
    this._width = width;
    this._height = height;
  }

  /**
   * The previous width of the panel.
   */
  get oldWidth(): number {
    return this._oldWidth;
  }

  /**
   * The previous height of the panel.
   */
  get oldHeight(): number {
    return this._oldHeight;
  }

  /**
   * The current width of the panel.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The current height of the panel.
   */
  get height(): number {
    return this._height;
  }

  private _oldWidth: number;
  private _oldHeight: number;
  private _width: number;
  private _height: number;
}

} // module phosphor.panels
