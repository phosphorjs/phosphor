/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Message = core.Message;


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
   * The previous width of the widget.
   */
  get oldWidth(): number {
    return this._oldWidth;
  }

  /**
   * The previous height of the widget.
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

  /**
   * The change in width of the widget.
   */
  get deltaWidth(): number {
    return this._width - this._oldWidth;
  }

  /**
   * The change in height of the widget.
   */
  get deltaHeight(): number {
    return this._height - this._oldHeight;
  }

  private _oldWidth: number;
  private _oldHeight: number;
  private _width: number;
  private _height: number;
}

} // module phosphor.widgets
