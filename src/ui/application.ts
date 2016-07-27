/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Token
} from '../core/token';


/**
 * A user-defined application plugin.
 *
 * #### Notes
 * Plugins are the foundation for building extensible applications.
 *
 * Plugins consume and provide "services", which are nothing more than
 * concrete implementations of interfaces and/or abstract types.
 *
 * Unlike regular imports and exports, which tie the service consumer
 * to a particular implementation of the service, plugins decouple the
 * service producer from the service consumer, allowing an application
 * to be easily customized by a third party in a type-safe fashion.
 *
 * A plugin should be treated as an immutable object.
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
   * The types of services required by the plugin, if any.
   *
   * #### Notes
   * These tokens correspond to the services required by the plugin.
   * When the plugin is activated, a concrete instance of each type
   * will be passed (in order) to the `activate()` function.
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
   * @param app - The application instance which owns the plugin.
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
 *
 */
export
abstract class Application<T extends Widget> {
  /**
   * Construct a new application.
   *
   * @param options - The options for initializing the application.
   */
  constructor(options: Application.IOptions<T>) { }

  /**
   * The application shell widget.
   *
   * #### Notes
   *
   * This is a read-only property.
   */
  get shell(): T {
    return this._shell;
  }

  /**
   * Get the application command registry.
   *
   * #### Notes
   * The command registry is a service, and is provided as a property
   * for the convenience of application extension authors. A service
   * provider may require the command registry as needed.
   *
   * This is a read-only property.
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * Get the application shortcut registry.
   *
   * #### Notes
   * The shortcut registry is a service, and is provided as a property
   * for the convenience of application extension authors. A service
   * provider may require the shortcut registry as needed.
   *
   * This is a read-only property.
   */
  get keymap(): Keymap {
    return this._keymap;
  }

  /**
   * Register a service provider with the application.
   *
   * @param provider - The service provider to register.
   *
   * #### Notes
   * An error will be thrown if a provider with the same id is already
   * registered, if a provider which provides the identical service is
   * already registered, or if the provider has a circular dependency.
   */
  registerPlugin<U>(plugin: IPlugin<this, U>): void {
    this._services.registerProvider(provider);
  }

  /**
   * List the IDs of all service providers in the application.
   *
   * @returns A new array of all provider IDs in the application.
   */
  listPlugins(): string[] {
    return this._services.listProviders();
  }

  /**
   * Test whether the application has a registered service provider.
   *
   * @param id - The id of the provider of interest.
   *
   * @returns `true` if a service provider with the specified id is
   *   registered, `false` otherwise.
   */
  hasPlugin(id: string): boolean {
    return this._services.hasProvider(id);
  }

  /**
   * Test whether the application has a provider for a service type.
   *
   * @param kind - The type of the service of interest.
   *
   * @returns `true` if a service provider is registered for the
   *   given service type, `false` otherwise.
   */
  hasService<U>(token: Token<U>, name?: string): boolean {
    return this._services.hasProviderFor(kind);
  }

  /**
   * Resolve a service implementation for the given type.
   *
   * @param kind - The type of service object to resolve.
   *
   * @returns A promise which resolves the specified service type,
   *   or rejects with an error if it cannot be satisfied.
   *
   * #### Notes
   * Services are singletons. The same service instance will be
   * returned each time a given service type is resolved.
   *
   * User code will not normally call this method directly. Instead
   * the required services for the user's providers and extensions
   * will be resolved automatically as needed.
   */
  resolveService<U>(token: Token<U>, name?: string): Promise<T> {
    return this._services.resolveService(kind);
  }

  /**
   * Activate the application extension with the given id.
   *
   * @param id - The ID of the extension of interest.
   *
   * @returns A promise which resolves when the extension is fully
   *   activated or rejects with an error if it cannot be activated.
   */
  activatePlugin(id: string): Promise<void> {
    return this._extensions.activateExtension(id, this, this._services);
  }

  /**
   * Run the bootstrapping process for the application.
   *
   * @param options - The options for bootstrapping the application.
   *
   * @returns A promise which resolves when all bootstrapping work
   *   is complete and the shell is mounted to the DOM, or rejects
   *   with an error if the bootstrapping process fails.
   *
   * #### Notes
   * This should be called once by the application creator after all
   * initial providers and extensions have been registered.
   *
   * Bootstrapping the application consists of the following steps:
   * 1. Create the application shell
   * 2. Register the default providers
   * 3. Register the default extensions
   * 4. Resolve the application services
   * 5. Activate the initial extensions
   * 6. Attach the shell widget to the DOM
   * 7. Add the application event listeners
   */
  run(options: Application.IRunOptions = {}): Promise<void> {
    // Resolve immediately if the application is already started.
    if (this._started) {
      return Promise.resolve<void>();
    }

    // Return the pending bootstrapping promise if it exists.
    if (this._promise) {
      return this._promise;
    }

    // Create the application shell.
    this._shell = this.createApplicationShell();

    // Setup the promise for the rest of the bootstrapping.
    this._promise = Promise.all(promises).then(results => {

      // Store the resolved default services.
      this._commands = results[0] as ABCCommandRegistry;
      this._palette = results[1] as ABCPaletteRegistry;
      this._shortcuts = results[2] as ABCShortcutRegistry;

      // Compute the extension ids to activate.
      let extIDs: string[];
      let optVal = options.activateExtensions;
      if (optVal === true) {
        extIDs = this.listExtensions();
      } else if (optVal === false) {
        extIDs = [];
      } else if (optVal) {
        extIDs = optVal as string[];
      } else {
        extIDs = this.listExtensions();
      }

      // Activate the initial extensions.
      return Promise.all(extIDs.map(id => this.activateExtension(id)));

    }).then(() =>  {

      // Mark the application as started and clear the stored promise.
      this._promise = null;
      this._started = true;

      // Compute the id of the shell host node.
      let shellHostID = options.shellHostID || '';

      // Attach the application shell to the host node.
      this.attachApplicationShell(shellHostID);

      // Add the application event listeners.
      this.addEventsListeners();

    }).catch(error => {

      // Clear the stored promise.
      this._promise = null;

      // Rethrow the error to reject the promise.
      throw error;

    });

    // Return the pending bootstrapping promise.
    return this._promise;
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
   *
   */
  abstract createShell(): T;

  /**
   * Attach the application shell to the DOM.
   *
   * @param id - The id of the host node for shell, or `''`.
   *
   * #### Notes
   * If the id is not provided, the document body will be the host.
   *
   * A subclass may reimplement this method for custom attachment.
   */
  protected attachShell(id: string): void {
    let host = id ? document.getElementById(id) : document.body;
    Widget.attach(this.shell, host);
  }

  /**
   * Add the application event listeners.
   *
   * #### Notes
   * The default implementation of this method listens for `'resize'`
   * and `'keydown'` events.
   *
   * A subclass may reimplement this method as needed.
   */
  protected addEventsListeners(): void {
    document.addEventListener('keydown', this);
    window.addEventListener('resize', this);
  }

  /**
   * A method invoked on a document `'resize'` event.
   *
   * #### Notes
   * The default implementation of this method updates the shell.
   *
   * A subclass may reimplement this method as needed.
   */
  protected evtResize(event: Event): void {
    sendMessage(this._shell, ResizeMessage.UnknownSize);
  }

  /**
   * A method invoked on a document `'keydown'` event.
   *
   * #### Notes
   * The default implementation of this method invokes the key-down
   * processing method of the shortcut manager.
   *
   * A subclass may reimplement this method as needed.
   */
  protected evtKeydown(event: KeyboardEvent): void {
    this._keymap.processKeydownEvent(event);
  }

  private _started = false;
  private _keymap: Keymap = null;
  private _promise: Promise<void> = null;
  private _shell: ApplicationShell = null;
  private _commands: CommandRegistry = null;
  private _plugins = new PluginRegistry<Application<T>>();
}


/**
 *
 */
export
namespace Application {
  /**
   * The extension type for use with an application object.
   */
  export
  interface IApplicationExtension extends IExtension<Application> { }


  /**
   * An options object for initializing an application.
   */
  export
  interface IApplicationOptions<T extends Widget> {
    /**
     *
     */
    shell: T;

    /**
     * The initial service providers for the application, if any.
     */
    providers?: IServiceProvider<any>[];

    /**
     * The initial application extensions for the application, if any.
     */
    extensions?: IApplicationExtension[];
  }


  /**
   * An options object for running an application.
   */
  export
  interface IApplicationRunOptions {
    /**
     * Whether to activate the application extensions.
     *
     * The default value is `true` and will cause all extensions to be
     * activated. If this is `false`, no extensions will be activated.
     * An array of string IDs will activate the specified extensions.
     */
    activateExtensions?: boolean | string[];

    /**
     * The element id of the host node for the application shell.
     *
     * If this is not provided, the document body will be the host.
     */
    shellHostID?: string;
  }
}
