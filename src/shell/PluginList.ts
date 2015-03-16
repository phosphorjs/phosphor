/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import ArrayIterator = collections.ArrayIterator;
import IIterator = collections.IIterator;

import Container = di.Container;


/**
 * A concrete implementation of IPluginList.
 */
export
class PluginList implements IPluginList {
  /**
   * Construct a new plugin list.
   */
  constructor(container: Container) {
    this._m_container = container;
  }

  /**
   * Get an iterator over the loaded plugins.
   */
  iterator(): IIterator<IPlugin> {
    return new ArrayIterator(this._m_plugins);
  }

  /**
   * Add a plugin or promise to the plugin list.
   *
   * A number of plugins can be added to the list to be resolved and
   * initialized asynchronously. When the `initialize` method of the
   * list is called, all pending plugins are first resolved and then
   * initialized in the order they were added to the list.
   */
  add(plugin: IPlugin | Promise<IPlugin>): void {
    this._m_pending.push(plugin);
  }

  /**
   * Initialize the pending plugins in the list.
   *
   * Returns a promise which resolves after all plugins are initialized.
   */
  initialize(): Promise<void> {
    var pending = this._m_pending;
    if (pending.length === 0) {
      return Promise.resolve<void>();
    }
    this._m_pending = [];
    return Promise.all(pending).then(plugins => {
      plugins.forEach(plugin => this._addPlugin(plugin));
    });
  }

  /**
   * Invoke the given callback for each resolved plugin in the list.
   */
  forEach(callback: (plugin: IPlugin) => void): void {
    return this._m_plugins.forEach(plugin => callback(plugin));
  }

  /**
   * Initialize a plugin and append it to the plugins list.
   */
  private _addPlugin(plugin: IPlugin): void {
    plugin.initialize(this._m_container);
    this._m_plugins.push(plugin);
  }

  private _m_container: Container;
  private _m_plugins: IPlugin[] = [];
  private _m_pending: (IPlugin | Promise<IPlugin>)[] = [];
}

} // module phosphor.shell
