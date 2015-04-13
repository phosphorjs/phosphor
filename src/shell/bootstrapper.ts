/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import Container = di.Container;
import IContainer = di.IContainer;

import createBoxSizing = utility.createBoxSizing;

import Widget = widgets.Widget;


/**
 * A class which manages bootstrapping an application.
 *
 * An application will typically define its own Bootstrapper subclass
 * which overrides the necessary methods to customize the application.
 */
export
class Bootstrapper {
  /**
   * Construct a new bootstrapper.
   */
  constructor() { }

  /**
   * Get the dependency injection container for the application.
   *
   * This is created by the `createContainer` method.
   */
  get container(): IContainer {
    return this._container;
  }

  /**
   * Get the plugin list for the application.
   *
   * This is created by the `createPluginList` method.
   */
  get pluginList(): IPluginList {
    return this._pluginList;
  }

  /**
   * Get the top-level shell widget for the application.
   *
   * This is created by the `createShell` method.
   */
  get shell(): Widget {
    return this._shell;
  }

  /**
   * Run the bootstrapper.
   *
   * This invokes the various bootstrap methods in the proper order
   * and updates the internal state of the bootstrapper.
   *
   * This method should not be reimplemented.
   */
  run(): void {
    this._container = this.createContainer();
    this.configureContainer();

    this._shell = this.createShell();
    this.configureShell();

    this._pluginList = this.createPluginList();
    this.configurePlugins().then(() => {
      this.finalize();
    }).catch(ex => {
      console.error('plugin initialization failed', ex);
    });
  }

  /**
   * Create the dependency injection container for the application.
   *
   * This can be reimplemented by subclasses as needed.
   *
   * The default implementation creates an instance of `Container`.
   */
  protected createContainer(): IContainer {
    return new Container();
  }

  /**
   * Create the application plugin list.
   *
   * This can be reimplmented by subclasses as needed.
   *
   * The default implementation resolves an `IPluginList`.
   */
  protected createPluginList(): IPluginList {
    return this.container.resolve(IPluginList);
  }

  /**
   * Create the application shell widget.
   *
   * This can be reimplemented by subclasses as needed.
   *
   * The default implementation returns null.
   */
  protected createShell(): Widget {
    return null;
  }

  /**
   * Configure the application dependency injection container.
   *
   * This can be reimplemented by subclasses as needed.
   *
   * The `IContainer` instance is registered automatically. An
   * implementation of `IPluginList` is registered if missing.
   */
  protected configureContainer(): void {
    var container = this.container;
    container.registerInstance(IContainer, container);
    if (!container.isRegistered(IPluginList)) {
      container.registerType(IPluginList, PluginList);
    }
  }

  /**
   * Configure the application plugins.
   *
   * Subclasses should reimplement this method to add the application
   * plugins to the plugin list. This should return a promise which
   * resolves once all plugins are initialized.
   *
   * The default implementation returns an empty resolved promise.
   */
  protected configurePlugins(): Promise<void> {
    return Promise.resolve<void>();
  }

  /**
   * Configure the application shell widget.
   *
   * This can be reimplemented by subclasses as needed.
   */
  protected configureShell(): void { }

  /**
   * Finalize the bootstrapping process.
   *
   * This is called after all plugins are resolved an intialized.
   *
   * It is the last method called in the bootstrapping process.
   *
   * This can be reimplemented by subclasses as needed.
   *
   * The default implementation attaches the shell widget to the DOM
   * using the "main" element or `document.body`, and adds a window
   * resize event handler which refits the shell on window resize.
   */
  protected finalize(): void {
    var shell = this.shell;
    if (!shell) {
      return;
    }
    var elem = document.getElementById('main') || document.body;
    var box = createBoxSizing(elem);
    var fit = () => shell.fit(void 0, void 0, box);
    window.addEventListener('resize', fit);
    shell.attach(elem);
    shell.show();
    fit();
  }

  private _shell: Widget = null;
  private _container: IContainer = null;
  private _pluginList: IPluginList = null;
}

} // module phosphor.shell
