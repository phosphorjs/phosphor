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
    this._oldWidth = oldWidth;
    this._oldHeight = oldHeight;
    this._width = width;
    this._height = height;
  }

  /**
   * The old width of the widget.
   */
  get oldWidth(): number {
    return this._oldWidth;
  }

  /**
   * The old height of the widget.
   */
  get oldHeight(): number {
    return this._oldHeight;
  }

  /**
   * The current width of the widget.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The current height of the widget.
   */
  get height(): number {
    return this._height;
  }

  private _oldWidth: number;
  private _oldHeight: number;
  private _width: number;
  private _height: number;
}

} // module phosphor.events
