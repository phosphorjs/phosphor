/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * The base message object which can be sent to a message handler.
 */
export
interface IMessage {
  /**
   * The type of the message.
   */
  type: string;
}

} // module phosphor.core
