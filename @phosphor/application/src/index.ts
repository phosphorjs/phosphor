/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  CommandRegistry
} from '@phosphor/commands';

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  Widget
} from '@phosphor/widgets';


/**
 * A runtime object which captures compile-time type information.
 *
 * #### Notes
 * A token captures the compile-time type of an interface or class in
 * an object which can be used to register a provider of that object
 * type with an application in a type-safe fashion.
 */
export
class Token<T> {
  /**
   * Construct a new token.
   *
   * @param name - A human readable name for the token.
   */
  constructor(name: string) {
    this.name = name;
  }

  /**
   * The human readable name for the token.
   *
   * #### Notes
   * This can be useful for debugging and logging.
   */
  readonly name: string;

  /**
   * A structural property to make the token unique to the compiler.
   *
   * #### Notes
   * User code should pretend this value does not exist.
   *
   * This value only serves to enforce compiler behavior.
   */
  readonly __tokenStructuralPropertyT__: T | null = null;
}


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
 */
export
interface IPlugin<T, U> {
  /**
   * The human readable id of the plugin.
   *
   * #### Notes
   * This must be unique within an application.
   */
  id: string;

  /**
   * Whether the plugin should be activated on application start.
   *
   * #### Notes
   * The default is `false`.
   */
  autoStart?: boolean;

  /**
   * The types of required services for the plugin, if any.
   *
   * #### Notes
   * These tokens correspond to the services that are required by
   * the plugin for correct operation.
   *
   * When the plugin is activated, a concrete instance of each type
   * will be passed to the `activate()` function, in the order they
   * are specified in the `requires` array.
   */
  requires?: Token<any>[];

  /**
   * The types of optional services for the plugin, if any.
   *
   * #### Notes
   * These tokens correspond to the services that can be used by the
   * plugin if available, but are not necessarily required.
   *
   * The optional services will be passed to the `activate()` function
   * following all required services. If an optional service cannot be
   * resolved, `null` will be passed in its place.
   */
  optional?: Token<any>[];

  /**
   * The type of service provided by the plugin, if any.
   *
   * #### Notes
   * This token corresponds to the service exported by the plugin.
   *
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
  activate: (app: T, ...args: any[]) => U | Promise<U>;
}


/**
 * A class for creating pluggable applications.
 *
 * #### Notes
 * The `Application` class is useful when creating large, complex
 * UI applications with the ability to be safely extended by third
 * party code via plugins.
 */
export
class Application<T extends Widget> {
  /**
   * Construct a new application.
   *
   * @param options - The options for creating the application.
   */
  constructor(options: Application.IOptions<T>) {
    this.shell = options.shell;
  }

  /**
   * The application command registry.
   */
  readonly commands = new CommandRegistry();

  /**
   * The application shell widget.
   *
   * #### Notes
   * The shell widget is the root "container" widget for the entire
   * application. It will typically expose an API which allows the
   * application plugins to insert content in a variety of places.
   */
  readonly shell: T;

  /**
   * A promise which resolves after the application has started.
   *
   * #### Notes
   * This promise will resolve after the `start()` method is called,
   * when all the bootstrapping and shell mounting work is complete.
   */
  get started(): Promise<void> {
    return this._delegate.promise;
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
   * @returns A new array of the registered plugin IDs.
   */
  listPlugins(): string[] {
    return Object.keys(this._pluginMap);
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
   * If the plugin provides a service which has already been provided
   * by another plugin, the new service will override the old service.
   */
  registerPlugin(plugin: IPlugin<this, any>): void {
    // Throw an error if the plugin id is already registered.
    if (plugin.id in this._pluginMap) {
      throw new Error(`Plugin '${plugin.id}' is already registered.`);
    }

    // Create the normalized plugin data.
    let data = Private.createPluginData(plugin);

    // Ensure the plugin does not cause a cyclic dependency.
    Private.ensureNoCycle(data, this._pluginMap, this._serviceMap);

    // Add the service token to the service map.
    if (data.provides) {
      this._serviceMap.set(data.provides, data.id);
    }

    // Add the plugin to the plugin map.
    this._pluginMap[data.id] = data;
  }

  /**
   * Register multiple plugins with the application.
   *
   * @param plugins - The plugins to register.
   *
   * #### Notes
   * This calls `registerPlugin()` for each of the given plugins.
   */
  registerPlugins(plugins: IPlugin<this, any>[]): void {
    for (let plugin of plugins) {
      this.registerPlugin(plugin);
    }
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
    // Reject the promise if the plugin is not registered.
    let data = this._pluginMap[id];
    if (!data) {
      return Promise.reject(new Error(`Plugin '${id}' is not registered.`));
    }

    // Resolve immediately if the plugin is already activated.
    if (data.activated) {
      return Promise.resolve(undefined);
    }

    // Return the pending resolver promise if it exists.
    if (data.promise) {
      return data.promise;
    }

    // Resolve the required services for the plugin.
    let required = data.requires.map(t => this.resolveRequiredService(t));

    // Resolve the optional services for the plugin.
    let optional = data.optional.map(t => this.resolveOptionalService(t));

    // Create the array of promises to resolve.
    let promises = required.concat(optional);

    // Setup the resolver promise for the plugin.
    data.promise = Promise.all(promises).then(services => {
      return data.activate.apply(undefined, [this, ...services]);
    }).then(service => {
      data.service = service;
      data.activated = true;
      data.promise = null;
    }).catch(error => {
      data.promise = null;
      throw error;
    });

    // Return the pending resolver promise.
    return data.promise;
  }

  /**
   * Resolve a required service of a given type.
   *
   * @param token - The token for the service type of interest.
   *
   * @returns A promise which resolves to an instance of the requested
   *   service, or rejects with an error if it cannot be resolved.
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
   * automatically when the plugin is activated.
   */
  resolveRequiredService<U>(token: Token<U>): Promise<U> {
    // Reject the promise if there is no provider for the type.
    let id = this._serviceMap.get(token);
    if (!id) {
      return Promise.reject(new Error(`No provider for: ${token.name}.`));
    }

    // Resolve immediately if the plugin is already activated.
    let data = this._pluginMap[id];
    if (data.activated) {
      return Promise.resolve(data.service);
    }

    // Otherwise, activate the plugin and wait on the results.
    return this.activatePlugin(id).then(() => data.service);
  }

  /**
   * Resolve an optional service of a given type.
   *
   * @param token - The token for the service type of interest.
   *
   * @returns A promise which resolves to an instance of the requested
   *   service, or `null` if it cannot be resolved.
   *
   * #### Notes
   * Services are singletons. The same instance will be returned each
   * time a given service token is resolved.
   *
   * If the plugin which provides the service has not been activated,
   * resolving the service will automatically activate the plugin.
   *
   * User code will not typically call this method directly. Instead,
   * the optional services for the user's plugins will be resolved
   * automatically when the plugin is activated.
   */
  resolveOptionalService<U>(token: Token<U>): Promise<U | null> {
    // Resolve with `null` if there is no provider for the type.
    let id = this._serviceMap.get(token);
    if (!id) {
      return Promise.resolve(null);
    }

    // Resolve immediately if the plugin is already activated.
    let data = this._pluginMap[id];
    if (data.activated) {
      return Promise.resolve(data.service);
    }

    // Otherwise, activate the plugin and wait on the results.
    return this.activatePlugin(id).then(() => {
      return data.service;
    }).catch(reason => {
      console.error(reason);
      return null;
    });
  }

  /**
   * Start the application.
   *
   * @param options - The options for starting the application.
   *
   * @returns A promise which resolves when all bootstrapping work
   *   is complete and the shell is mounted to the DOM.
   *
   * #### Notes
   * This should be called once by the application creator after all
   * initial plugins have been registered.
   *
   * If a plugin fails to the load, the error will be logged and the
   * other valid plugins will continue to be loaded.
   *
   * Bootstrapping the application consists of the following steps:
   * 1. Activate the startup plugins
   * 2. Wait for those plugins to activate
   * 3. Attach the shell widget to the DOM
   * 4. Add the application event listeners
   */
  start(options: Application.IStartOptions = {}): Promise<void> {
    // Return immediately if the application is already started.
    if (this._started) {
      return this._delegate.promise;
    }

    // Mark the application as started;
    this._started = true;

    // Parse the host id for attaching the shell.
    let hostID = options.hostID || '';

    // Collect the ids of the startup plugins.
    let startups = Private.collectStartupPlugins(this._pluginMap, options);

    // Generate the activation promises.
    let promises = startups.map(id => {
      return this.activatePlugin(id).catch(console.error);
    });

    // Wait for the plugins to activate, then finalize startup.
    Promise.all(promises).then(() => {
      this.attachShell(hostID);
      this.addEventListeners();
      this._delegate.resolve(undefined);
    });

    // Return the pending delegate promise.
    return this._delegate.promise;
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
   * Attach the application shell to the DOM.
   *
   * @param id - The id of the host node for the shell, or `''`.
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
    document.addEventListener('keydown', this, true);
    window.addEventListener('resize', this);
  }

  /**
   * A method invoked on a document `'keydown'` event.
   *
   * #### Notes
   * The default implementation of this method invokes the key down
   * processing method of the application command registry.
   *
   * A subclass may reimplement this method as needed.
   */
  protected evtKeydown(event: KeyboardEvent): void {
    this.commands.processKeydownEvent(event);
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
  private _pluginMap = Private.createPluginMap();
  private _serviceMap = Private.createServiceMap();
  private _delegate = new PromiseDelegate<void>();
}


/**
 * The namespace for the `Application` class statics.
 */
export
namespace Application {
  /**
   * An options object for creating an application.
   */
  export
  interface IOptions<T extends Widget> {
    /**
     * The shell widget to use for the application.
     *
     * This should be a newly created and initialized widget.
     *
     * The application will attach the widget to the DOM.
     */
    shell: T;
  }

  /**
   * An options object for application startup.
   */
  export
  interface IStartOptions {
    /**
     * The ID of the DOM node to host the application shell.
     *
     * #### Notes
     * If this is not provided, the document body will be the host.
     */
    hostID?: string;

    /**
     * The plugins to activate on startup.
     *
     * #### Notes
     * These will be *in addition* to any `autoStart` plugins.
     */
    startPlugins?: string[];

    /**
     * The plugins to **not** activate on startup.
     *
     * #### Notes
     * This will override `startPlugins` and any `autoStart` plugins.
     */
    ignorePlugins?: string[];
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which holds the full application state for a plugin.
   */
  export
  interface IPluginData {
    /**
     * The human readable id of the plugin.
     */
    readonly id: string;

    /**
     * Whether the plugin should be activated on application start.
     */
    readonly autoStart: boolean;

    /**
     * The types of required services for the plugin, or `[]`.
     */
    readonly requires: Token<any>[];

    /**
     * The types of optional services for the the plugin, or `[]`.
     */
    readonly optional: Token<any>[];

    /**
     * The type of service provided by the plugin, or `null`.
     */
    readonly provides: Token<any> | null;

    /**
     * The function which activates the plugin.
     */
    readonly activate: (app: any, ...args: any[]) => any;

    /**
     * Whether the plugin has been activated.
     */
    activated: boolean;

    /**
     * The resolved service for the plugin, or `null`.
     */
    service: any | null;

    /**
     * The pending resolver promise, or `null`.
     */
    promise: Promise<void> | null;
  }

  /**
   * A type alias for a mapping of plugin id to plugin data.
   */
  export
  type PluginMap = { [id: string]: IPluginData };

  /**
   * A type alias for a mapping of service token to plugin id.
   */
  export
  type ServiceMap = Map<Token<any>, string>;

  /**
   * Create a new plugin map.
   */
  export
  function createPluginMap(): PluginMap {
    return Object.create(null);
  }

  /**
   * Create a new service map.
   */
  export
  function createServiceMap(): ServiceMap {
    return new Map<Token<any>, string>();
  }

  /**
   * Create a normalized plugin data object for the given plugin.
   */
  export
  function createPluginData(plugin: IPlugin<any, any>): IPluginData {
    return {
      id: plugin.id,
      service: null,
      promise: null,
      activated: false,
      activate: plugin.activate,
      provides: plugin.provides || null,
      autoStart: plugin.autoStart || false,
      requires: plugin.requires ? plugin.requires.slice() : [],
      optional: plugin.optional ? plugin.optional.slice() : []
    };
  }

  /**
   * Ensure no cycle is present in the plugin resolution graph.
   *
   * If a cycle is detected, an error will be thrown.
   */
  export
  function ensureNoCycle(data: IPluginData, pluginMap: PluginMap, serviceMap: ServiceMap): void {
    // Bail early if there cannot be a cycle.
    if (!data.provides || data.requires.length === 0) {
      return;
    }

    // Setup a stack to trace service resolution.
    let trace = [data.id];

    // Throw an exception if a cycle is present.
    if (data.requires.some(visit)) {
      throw new Error(`Cycle detected: ${trace.join(' -> ')}.`);
    }

    function visit(token: Token<any>): boolean {
      if (token === data.provides) {
        return true;
      }
      let id = serviceMap.get(token);
      if (!id) {
        return false;
      }
      let other = pluginMap[id];
      if (other.requires.length === 0) {
        return false;
      }
      trace.push(id);
      if (other.requires.some(visit)) {
        return true;
      }
      trace.pop();
      return false;
    }
  }

  /**
   * Collect the IDs of the plugins to activate on startup.
   */
  export
  function collectStartupPlugins(pluginMap: PluginMap, options: Application.IStartOptions): string[] {
    // Create a map to hold the plugin IDs.
    let resultMap: { [id: string]: boolean } = Object.create(null);

    // Collect the auto-start plugins.
    for (let id in pluginMap) {
      if (pluginMap[id].autoStart) {
        resultMap[id] = true;
      }
    }

    // Add the startup plugins.
    if (options.startPlugins) {
      for (let id of options.startPlugins) {
        resultMap[id] = true;
      }
    }

    // Remove the ignored plugins.
    if (options.ignorePlugins) {
      for (let id of options.ignorePlugins) {
        delete resultMap[id];
      }
    }

    // Return the final startup plugins.
    return Object.keys(resultMap);
  }
}
