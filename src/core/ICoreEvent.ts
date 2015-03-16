/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * An object which can be sent to an event handler.
 */
export
interface ICoreEvent {
  /**
   * The type of the event.
   */
  type: string;
}

} // module phosphor.core
