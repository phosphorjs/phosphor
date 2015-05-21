/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module chat {

import Token = phosphor.di.Token;


/**
 * A simple in-process chat client model.
 */
export
interface IChatClient {
  // currently an empty stub
}


/**
 * The interface token for IChatClient.
 */
export
var IChatClient = new Token<IChatClient>('chat.IChatClient');

} // module chat
