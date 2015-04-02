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
 * A class for messages related to child widgets.
 */
export
class ChildMessage extends Message {
  /**
   * Construct a new child message.
   */
  constructor(type: string, child: Widget) {
    super(type);
    this._child = child;
  }

  /**
   * The child widget for the message.
   */
  get child(): Widget {
    return this._child;
  }

  private _child: Widget;
}

} // module phosphor.widgets
