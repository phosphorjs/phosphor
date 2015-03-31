/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

import IIterable = collections.IIterable;


/**
 * An object which processes messages.
 */
export
interface IMessageHandler {
  /**
   * Process a message sent to the handler.
   */
  processMessage(msg: IMessage): void;

  /**
   * Compress a message posted to the handler.
   *
   * This optional method allows the handler to merge a posted message
   * with a message which is already pending. It should return true if
   * the message was compressed and should be dropped, or false if the
   * message should be enqueued for delivery as normal.
   */
  compressMessage?(msg: IMessage, pending: IIterable<IMessage>): boolean;
}

} // module phosphor.core
