/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import ICoreEvent = require('./ICoreEvent');
import IEventHandler = require('./IEventHandler');

export = IEventFilter;


/**
 * An object which filters events dispatched to an event handler.
 */
interface IEventFilter {
  /**
   * Filter an event dispatched to an event handler.
   *
   * Returns true if the event should be filtered, false otherwise.
   */
  filterEvent(handler: IEventHandler, event: ICoreEvent): boolean;
}
