/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.events {

import Message = core.Message;

import Widget = widgets.Widget;


/**
 * An event class for child widget related events.
 */
export
class ChildEvent extends Message {
  /**
   * Construct a new child event.
   */
  constructor(type: string, child: Widget) {
    super(type);
    this._child = child;
  }

  /**
   * The child widget for the event.
   */
  get child(): Widget {
    return this._child;
  }

  private _child: Widget;
}

} // module phosphor.events
