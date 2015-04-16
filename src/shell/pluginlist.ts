/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import IContainer = di.IContainer;


/**
 * A concrete implementation of IPluginList.
 */
export
class PluginList implements IPluginList {
  /**
   * The injection dependencies for the plugin list.
   */
  static $inject = [IContainer];

  /**
   * Construct a new plugin list.
   */
  constructor(container: IContainer) {
    this._container = container;
  }

  /**
   * Add an array of plugins or plugin promises to the plugin list.
   *
   * When all plugins are resolved, the `initialize` method of each
   * plugin is called and the plugin is added to the list.
   *
   * Returns a promise which resolves when all plugins are added.
   */
  add(plugins: (IPlugin | Promise<IPlugin>)[]): Promise<void> {
    return Promise.all(plugins).then(resolved => {
      resolved.forEach(plugin => this._addPlugin(plugin));
    });
  }

  /**
   * Invoke the given callback for each resolved plugin in the list.
   */
  forEach(callback: (plugin: IPlugin) => void): void {
    return this._plugins.forEach(plugin => callback(plugin));
  }

  /**
   * Initialize a plugin and add it to the plugins list.
   */
  private _addPlugin(plugin: IPlugin): void {
    plugin.initialize(this._container);
    this._plugins.push(plugin);
  }

  private _container: IContainer;
  private _plugins: IPlugin[] = [];
}

} // module phosphor.shell
