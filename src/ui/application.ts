/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike, each
} from '../algorithm/iteration';

import {
  Token
} from '../core/token';

import {
  CommandRegistry
} from './commandregistry';

import {
  EN_US, IKeyboardLayout
} from './keyboard';

import {
  Keymap
} from './keymap';

import {
  Widget
} from './widget';


/**
 * An abstract base class for creating pluggable applications.
 *
 * #### Notes
 * The `Application` class is useful when creating large, complex
 * UI applications with the ability to be safely extended by third
 * party code via plugins.
 *
 * Use of this class is optional. Applications of low to moderate
 * complexity will have no need for the features this class provides.
 */
export
abstract class Application<T extends Widget> {
  /**
   * Construct a new application.
   *
   * @param options - The options for initializing the application.
   */
  constructor(options: Application.IOptions<T> = {}) {
    // Parse the options.
    let plugins = options.plugins || [];
    let layout = options.keyboardLayout || EN_US;

    // Setup the commands and keymap.
    let commands = new CommandRegistry();
    let keymap = new Keymap({ commands, layout });
    this._commands = commands;
    this._keymap = keymap;

    // Register the initial plugins.
    each(plugins, p => { this.registerPlugin(p); });
  }

  /**
   * The application shell widget.
   *
   * #### Notes
   * The shell widget is the root "container" widget for the entire
   * application. It will typically expose an API which allows the
   * application plugins to insert content in a variety of places.
   *
   * This is created by a subclass in the `createShell()` method.
   *
   * This will be `null` until the application is started.
   *
   * This is a read-only property.
   */
  get shell(): T {
    return this._shell;
  }

  /**
   * The application command registry.
   *
   * #### Notes
   * This is a read-only property.
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * The application keymap.
   *
   * #### Notes
   * This is a read-only property.
   */
  get keymap(): Keymap {
    return this._keymap;
  }

  /**
   * Register a plugin with the application.
   *
   * @param plugin - The plugin to register.
   *
   * #### Notes
   * An error will be thrown if a plugin with the same id is already
   * registered, or if the plugin has a circular dependency.
   *
   * If the plugin provides a service which has already already been
   * provided by another plugin, the new service will override.
   */
  registerPlugin<U>(plugin: Application.IPlugin<T, U>): void {

  }

  /**
   * Test whether a plugin is registered with the application.
   *
   * @param id - The id of the plugin of interest.
   *
   * @returns `true` if the plugin is registered, `false` otherwise.
   */
  hasPlugin(id: string): boolean {
    return id in this._pluginMap;
  }

  /**
   * List the IDs of the plugins registered with the application.
   *
   * @returns A new array of the IDs of the registered plugins.
   */
  listPlugins(): string[] {
    return Object.keys(this._pluginMap);
  }

  /**
   * Resolve a service of a given type.
   *
   * @param token - The token for the service type of interest.
   *
   * @returns A promise which resolves to an instance of the requested
   *   service, or rejects with an error if there is no plugin which
   *   provides the service or if its dependencies cannot be resolved.
   *
   * #### Notes
   * Services are singletons. The same instance will be returned each
   * time a given service token is resolved.
   *
   * If the plugin which provides the service has not been activated,
   * resolving the service will automatically activate the plugin.
   *
   * User code will not typically call this method directly. Instead,
   * the required services for the user's plugins will be resolved
   * automatically as needed.
   */
  resolveService<U>(token: Token<U>): Promise<U> {
    return null;
  }

  /**
   * Activate the plugin with the given id.
   *
   * @param id - The ID of the plugin of interest.
   *
   * @returns A promise which resolves when the plugin is activated
   *   or rejects with an error if it cannot be activated.
   */
  activatePlugin(id: string): Promise<void> {
    return null;
  }

  /**
   * Start the application.
   *
   * @returns A promise which resolves when all bootstrapping work
   *   is complete and the shell is mounted to the DOM, or rejects
   *   with an error if the bootstrapping process fails.
   *
   * #### Notes
   * This should be called once by the application creator after all
   * initial plugins have been registered.
   *
   * Bootstrapping the application consists of the following steps:
   * 1. Create the shell widget
   * 2. Activate the autostart plugins
   * 3. Attach the shell widget to the DOM
   * 4. Add the application event listeners
   */
  start(): Promise<void> {
    return null;
    // // Resolve immediately if the application is already started.
    // if (this._started) {
    //   return Promise.resolve<void>();
    // }

    // // Return the pending promise if it exists.
    // if (this._promise) {
    //   return this._promise;
    // }

    // // Create the shell widget.
    // this._shell = this.createShell();

    // // Setup the promise for the rest of the bootstrapping.
    // this._promise = Promise.all(promises).then(results => {

    //   // Store the resolved default services.
    //   this._commands = results[0] as ABCCommandRegistry;
    //   this._palette = results[1] as ABCPaletteRegistry;
    //   this._shortcuts = results[2] as ABCShortcutRegistry;

    //   // Compute the extension ids to activate.
    //   let extIDs: string[];
    //   let optVal = options.activateExtensions;
    //   if (optVal === true) {
    //     extIDs = this.listExtensions();
    //   } else if (optVal === false) {
    //     extIDs = [];
    //   } else if (optVal) {
    //     extIDs = optVal as string[];
    //   } else {
    //     extIDs = this.listExtensions();
    //   }

    //   // Activate the initial extensions.
    //   return Promise.all(extIDs.map(id => this.activateExtension(id)));

    // }).then(() =>  {

    //   // Mark the application as started and clear the stored promise.
    //   this._promise = null;
    //   this._started = true;

    //   // Compute the id of the shell host node.
    //   let shellHostID = options.shellHostID || '';

    //   // Attach the application shell to the host node.
    //   this.attachApplicationShell(shellHostID);

    //   // Add the application event listeners.
    //   this.addEventListeners();

    // }).catch(error => {

    //   // Clear the stored promise.
    //   this._promise = null;

    //   // Rethrow the error to reject the promise.
    //   throw error;

    // });

    // // Return the pending bootstrapping promise.
    // return this._promise;
  }

  /**
   * Handle the DOM events for the application.
   *
   * @param event - The DOM event sent to the application.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events registered for the application. It
   * should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'resize':
      this.evtResize(event);
      break;
    case 'keydown':
      this.evtKeydown(event as KeyboardEvent);
      break;
    }
  }

  /**
   * Create the shell widget for the application.
   *
   * @returns A new application shell widget.
   *
   * #### Notes
   * This method is called when the application is started.
   *
   * This method must be reimplemented by a subclass.
   */
  protected abstract createShell(): T;

  /**
   * Attach the application shell to the DOM.
   *
   * @param id - The id of the host node for shell, or `''`.
   *
   * #### Notes
   * If the id is not provided, the document body will be the host.
   *
   * A subclass may reimplement this method as needed.
   */
  protected attachShell(id: string): void {
    Widget.attach(this.shell, document.getElementById(id) || document.body);
  }

  /**
   * Add the application event listeners.
   *
   * #### Notes
   * The default implementation of this method adds listeners for
   * `'keydown'` and `'resize'` events.
   *
   * A subclass may reimplement this method as needed.
   */
  protected addEventListeners(): void {
    document.addEventListener('keydown', this);
    window.addEventListener('resize', this);
  }

  /**
   * A method invoked on a document `'keydown'` event.
   *
   * #### Notes
   * The default implementation of this method invokes the key down
   * processing method of the application keymap.
   *
   * A subclass may reimplement this method as needed.
   */
  protected evtKeydown(event: KeyboardEvent): void {
    this.keymap.processKeydownEvent(event);
  }

  /**
   * A method invoked on a window `'resize'` event.
   *
   * #### Notes
   * The default implementation of this method updates the shell.
   *
   * A subclass may reimplement this method as needed.
   */
  protected evtResize(event: Event): void {
    this.shell.update();
  }

  private _started = false;
  private _shell: T = null;
  private _keymap: Keymap;
  private _commands: CommandRegistry;
  private _promise: Promise<void> = null;
  private _serviceMap = Private.createServiceMap();
  private _pluginMap = Private.createPluginMap<T>();
}


/**
 * The namespace for the `Application` class statics.
 */
export
namespace Application {
  /**
   * A user-defined application plugin.
   *
   * #### Notes
   * Plugins are the foundation for building an extensible application.
   *
   * Plugins consume and provide "services", which are nothing more than
   * concrete implementations of interfaces and/or abstract types.
   *
   * Unlike regular imports and exports, which tie the service consumer
   * to a particular implementation of the service, plugins decouple the
   * service producer from the service consumer, allowing an application
   * to be easily customized by third parties in a type-safe fashion.
   *
   * A plugin should be treated as an immutable object.
   */
  export
  interface IPlugin<T extends Widget, U> {
    /**
     * The human readable id of the plugin.
     *
     * #### Notes
     * This must be unique within an application.
     */
    id: string;

    /**
     * The types of services required by the plugin, if any.
     *
     * #### Notes
     * These tokens correspond to the services required by the plugin.
     * When the plugin is activated, a concrete instance of each type
     * will be passed to the `activate()` function, in the order they
     * are specified in the `requires` array.
     */
    requires?: Token<any>[];

    /**
     * The type of service provided by the plugin, if any.
     *
     * #### Notes
     * This token corresponds to the service exported by the plugin.
     * When the plugin is activated, the return value of `activate()`
     * is used as the concrete instance of the type.
     */
    provides?: Token<U>;

    /**
     * A function invoked to activate the plugin.
     *
     * @param app - The application which owns the plugin.
     *
     * @param args - The services specified by the `requires` property.
     *
     * @returns The provided service, or a promise to the service.
     *
     * #### Notes
     * This function will be called whenever the plugin is manually
     * activated, or when another plugin being activated requires
     * the service it provides.
     *
     * This function will not be called unless all of its required
     * services can be fulfilled.
     */
    activate: (app: Application<T>, ...args: any[]) => U | Promise<U>;
  }

  /**
   * An options object for initializing an application.
   */
  export
  interface IOptions<T extends Widget> {
    /**
     * The element id of the host node for the application shell.
     *
     * The default is the document body.
     */
    hostID?: string;

    /**
     * The keyboard layout for the application.
     *
     * The default is a US-English layout.
     */
    keyboardLayout?: IKeyboardLayout;

    /**
     * The initial plugins for the application.
     */
    plugins?: IterableOrArrayLike<IPlugin<T, any>>;
  }
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   *
   */
  export
  type PluginMap<T extends Widget> = { [id: string]: Application.IPlugin<T, any> };

  /**
   *
   */
  export
  type ServiceMap = Map<Token<any>, string>;

  /**
   *
   */
  export
  function createPluginMap<T extends Widget>(): PluginMap<T> {
    return Object.create(null);
  }

  /**
   *
   */
  export
  function createServiceMap(): ServiceMap {
    return new Map<Token<any>, string>();
  }
}
