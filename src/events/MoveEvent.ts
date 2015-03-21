/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.events {

import Message = core.Message;


/**
 * An event class for 'move' events.
 */
export
class MoveEvent extends Message {
  /**
   * Construct a new move event.
   */
  constructor(oldX: number, oldY: number, x: number, y: number) {
    super('move');
    this._oldX = oldX;
    this._oldY = oldY;
    this._x = x;
    this._y = y;
  }

  /**
   * The old X coordinate of the widget.
   */
  get oldX(): number {
    return this._oldX;
  }

  /**
   * The old Y coordinate of the widget.
   */
  get oldY(): number {
    return this._oldY;
  }

  /**
   * The current X coordinate of the widget.
   */
  get x(): number {
    return this._x;
  }

  /**
   * The current Y coordinate of the widget.
   */
  get y(): number {
    return this._y;
  }

  private _oldX: number;
  private _oldY: number;
  private _x: number;
  private _y: number;
}

} // module phosphor.events
