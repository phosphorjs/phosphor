/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import IIterable = collections.IIterable;


/**
 * A collection which asynchronously resolves and initializes plugins.
 */
export
interface IPluginList extends IIterable<IPlugin> {
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
   * Returns a promise which resolves after all plugins are initialized.
   */
  initialize(): Promise<void>;
}

} // module phosphor.shell
