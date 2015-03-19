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
 * An event class for 'resize' events.
 */
export
class ResizeEvent extends Message {
  /**
   * Construct a new resize event.
   */
  constructor(oldWidth: number, oldHeight: number, width: number, height: number) {
    super('resize');
    this._m_oldWidth = oldWidth;
    this._m_oldHeight = oldHeight;
    this._m_width = width;
    this._m_height = height;
  }

  /**
   * The old width of the widget.
   */
  get oldWidth(): number {
    return this._m_oldWidth;
  }

  /**
   * The old height of the widget.
   */
  get oldHeight(): number {
    return this._m_oldHeight;
  }

  /**
   * The current width of the widget.
   */
  get width(): number {
    return this._m_width;
  }

  /**
   * The current height of the widget.
   */
  get height(): number {
    return this._m_height;
  }

  private _m_oldWidth: number;
  private _m_oldHeight: number;
  private _m_width: number;
  private _m_height: number;
}

} // module phosphor.events
