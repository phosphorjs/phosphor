/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module chat {

import Bootstrapper = phosphor.shell.Bootstrapper;


/**
 * A simple chat application built entirely from plugins.
 */
export
class ChatApplication extends Bootstrapper {
  /**
   * Configure the plugins for the application.
   */
  configurePlugins(): Promise<void> {
    return this.pluginList.add([
      serverplugin,
      clientplugin,
      roomsplugin,
      feedplugin
    ]);
  }
}

} // module chat
