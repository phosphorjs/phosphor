/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * An object which filters messages sent to a message handler.
 */
export
interface IMessageFilter {
  /**
   * Filter a message sent to a message handler.
   *
   * Returns true if the message should be filtered, false otherwise.
   */
  filterMessage(handler: IMessageHandler, msg: IMessage): boolean;
}

} // module phosphor.core
