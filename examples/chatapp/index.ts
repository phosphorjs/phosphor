/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import ChatApplication = chat.ChatApplication;


/**
 * Create and start the chat application.
 */
export
function main(): void {
  var app = new ChatApplication();
  app.run();
}

} // module example
