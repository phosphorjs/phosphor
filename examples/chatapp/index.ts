/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Bootstrapper = phosphor.shell.Bootstrapper;


/**
 * A simple chat application built entirely from plugins.
 */
class ChatApplication extends Bootstrapper {
  /**
   * Configure the plugins for the application.
   */
  configurePlugins(): Promise<void> {
    return this.pluginList.add([
      chat.serverplugin,
      chat.clientplugin,
      chat.roomsplugin,
      chat.feedplugin
    ]);
  }
}


/**
 * Create and start the chat application.
 */
function main(): void {
  var app = new ChatApplication();
  app.run();
}


window.onload = main;

} // module example
