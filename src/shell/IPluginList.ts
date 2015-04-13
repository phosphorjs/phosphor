/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import createToken = di.createToken;


/**
 * An object which asynchronously resolves and initializes plugins.
 */
export
interface IPluginList {
  /**
   * Add a plugin or promise to the plugin list.
   *
   * A number of plugins can be added to the list to be resolved and
   * initialized asynchronously. When the `initialize` method of the
   * list is called, all pending plugins are first resolved and then
   * initialized in the order they were added to the list.
   */
  add(plugin: IPlugin | Promise<IPlugin>): void;

  /**
   * Initialize the pending plugins in the list.
   *
   * Returns a promise which resolves when all plugins are initialized.
   */
  initialize(): Promise<void>;

  /**
   * Invoke a callback for each resolved plugin in the list.
   */
  forEach(callback: (plugin: IPlugin) => void): void;
}


/**
 * The interface token for the IPluginList.
 */
export
var IPluginList = createToken<IPluginList>('phosphor.shell.IPluginList');

} // module phosphor.shell
