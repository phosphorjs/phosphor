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
   * Add an array of plugins or plugin promises to the plugin list.
   *
   * When all plugins are resolved, the `initialize` method of each
   * plugin is called and the plugin is added to the list.
   *
   * Returns a promise which resolves when all plugins are added.
   */
  add(plugins: (IPlugin | Promise<IPlugin>)[]): Promise<void>;

  /**
   * Invoke a callback for each resolved plugin in the list.
   */
  forEach(callback: (plugin: IPlugin) => void): void;
}


/**
 * The interface token for IPluginList.
 */
export
var IPluginList = createToken<IPluginList>('phosphor.shell.IPluginList');

} // module phosphor.shell
