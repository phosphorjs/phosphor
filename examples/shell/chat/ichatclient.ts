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
 *
 */
export
interface IChatClient {

}


/**
 *
 */
export
var IChatClient = createToken<IChatClient>('chat.IChatClient');

} // module chat
