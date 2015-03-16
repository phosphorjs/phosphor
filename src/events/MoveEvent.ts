/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.events {

import CoreEvent = core.CoreEvent;


/**
 * An event class for 'move' events.
 */
export
class MoveEvent extends CoreEvent {
  /**
   * Construct a new move event.
   */
  constructor(oldX: number, oldY: number, x: number, y: number) {
    super('move');
    this._m_oldX = oldX;
    this._m_oldY = oldY;
    this._m_x = x;
    this._m_y = y;
  }

  /**
   * The old X coordinate of the widget.
   */
  get oldX(): number {
    return this._m_oldX;
  }

  /**
   * The old Y coordinate of the widget.
   */
  get oldY(): number {
    return this._m_oldY;
  }

  /**
   * The current X coordinate of the widget.
   */
  get x(): number {
    return this._m_x;
  }

  /**
   * The current Y coordinate of the widget.
   */
  get y(): number {
    return this._m_y;
  }

  private _m_oldX: number;
  private _m_oldY: number;
  private _m_x: number;
  private _m_y: number;
}

} // module phosphor.events
