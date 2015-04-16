/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module chat {

import createToken = phosphor.di.createToken;


/**
 * A simple in-process chat server model.
 */
export
interface IChatServer {
  // currently an empty stub
}


/**
 * The interface token for IChatServer.
 */
export
var IChatServer = createToken<IChatServer>('chat.IChatServer');

} // module chat
