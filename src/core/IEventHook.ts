/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import ICoreEvent = require('./ICoreEvent');
import IEventHandler = require('./IEventHandler');

export = IEventHook;


/**
 * An object which hooks events dispatched to an event handler.
 */
interface IEventHook {
  /**
   * Hook an event dispatched to a handler.
   *
   * Returns true if the event should be filtered, false otherwise.
   */
  hookEvent(handler: IEventHandler, event: ICoreEvent): boolean;
}
