/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDisposable, DisposableDelegate
} from '../core/disposable';

import {
  ISignal, defineSignal
} from '../core/signaling';


/**
 * A type alias for a command execute function.
 *
 * @param args - The arguments for the command.
 *
 * @returns The command result, a promise to the result, or void.
 */
export
type ExecFunc = (args: any) => any;


/**
 * A type alias for a command string function.
 *
 * @param args - The arguments for the command.
 *
 * @returns The relevant string result.
 */
export
type StringFunc = (args: any) => string;


/**
 * A type alias for a command boolean function.
 *
 * @param args - The arguments for the command.
 *
 * @returns The relevant boolean result.
 */
export
type BoolFunc = (args: any) => boolean;


/**
 * An object which represents code to be executed.
 *
 * #### Notes
 * A command is an abstract representation of code to be executed along
 * with metadata for describing how the command should be displayed in
 * a visual representation.
 *
 * A command is a collection of functions, *not* methods. The command
 * registry will always invoke the command functions with a `thisArg`
 * which is `undefined`.
 *
 * The metadata functions for the command should be well behaved in the
 * presence of `null` args. Visual representations of a command registry
 * will pass `null` for args when displaying the registered commands for
 * an application.
 */
export
interface ICommand {
  /**
   * The function to invoke when the command is executed.
   *
   * #### Notes
   * This function will only be invoked if `isEnabled` returns `true`.
   */
  execute: ExecFunc;

  /**
   * The display text for the command.
   *
   * #### Notes
   * This can be a string literal, or a function which returns the
   * text based on the provided command arguments.
   *
   * The default value is an empty string.
   */
  text?: string | StringFunc;

  /**
   * The icon class for the command.
   *
   * #### Notes
   * This class name will be added to the icon node for the visual
   * representation of the command.
   *
   * Multiple class names can be separated with white space.
   *
   * This can be a string literal, or a function which returns the
   * icon based on the provided command arguments.
   *
   * The default value is an empty string.
   */
  icon?: string | StringFunc;

  /**
   * The short form caption for the command.
   *
   * #### Notes
   * This should be a simple one line description of the command. It
   * is used by some visual represenations (like the command palette)
   * to show a short description of the command.
   *
   * This can be a string literal, or a function which returns the
   * caption based on the provided command arguments.
   *
   * The default value is an empty string.
   */
  caption?: string | StringFunc;

  /**
   * The long form description for the command.
   *
   * #### Notes
   * This should be a long form description of the command, including
   * its args spec. It is used by some visual represenations to show
   * help text for the command.
   *
   * This can be a string literal, or a function which returns the
   * description based on the provided command arguments.
   *
   * The default value is an empty string.
   */
  description?: string | StringFunc;

  /**
   * The category name for the command.
   *
   * #### Notes
   * This is should be a generic category header name. It is used by
   * some visual representations (like the command palette) to group
   * multiple commands with the same category.
   *
   * This can be a string literal, or a function which returns the
   * category based on the provided command arguments.
   *
   * The default value is an empty string.
   */
  category?: string | StringFunc;

  /**
   * The general class name for the command.
   *
   * #### Notes
   * This class name will be added to the primary node for the visual
   * representation of the command.
   *
   * Multiple class names can be separated with white space.
   *
   * This can be a string literal, or a function which returns the
   * class name based on the provided command arguments.
   *
   * The default value is an empty string.
   */
  className?: string | StringFunc;

  /**
   * A function which indicates whether the command is enabled.
   *
   * #### Notes
   * This `execute` function will only be invoked if this function
   * returns `true`.
   *
   * Visual representations may use this value to display a disabled
   * command as grayed-out and non-interactive.
   *
   * This function may be called often, and so should be efficient.
   *
   * The default value is `true`.
   */
  isEnabled?: BoolFunc;

  /**
   * A function which indicates whether the command is toggled.
   *
   * #### Notes
   * Visual representations may use this value to display a toggled
   * command in a different form, such as a check mark for a menu
   * item or depressed toggle button.
   *
   * The default value is `false`.
   */
  isToggled?: BoolFunc;

  /**
   * A function which indicates whether the command is visible.
   *
   * #### Notes
   * Visual representations may use this value to hide or otherwise
   * not display a non-visible command.
   *
   * The default value is `true`.
   */
  isVisible?: BoolFunc;
}


/**
 * A disposable object which represents a registered command.
 *
 * #### Notes
 * A command handle should be kept private to the code which registers
 * the command. It provides the only mechanism for unregistering and
 * refreshing the command.
 *
 * Objects of this type are created and returned by a command registry
 * when a command is registered. They will not be created directly by
 * user code.
 *
 * Disposing of the handle will unregister the command.
 */
export
interface ICommandHandle extends IDisposable {
  /**
   * The id of the registered command.
   *
   * #### Notes
   * This is a read-only property.
   */
  id: string;

  /**
   * The command registry which owns the command.
   *
   * #### Notes
   * This is a read-only property.
   */
  registry: CommandRegistry;

  /**
   * Refresh the state of the command.
   *
   * #### Notes
   * This should be called by the creator of the command whenever the
   * return values of the command functions may have changed.
   *
   * This will cause the `commandChanged` signal of the registry to be
   * emitted, so that the visual representation of the command can be
   * updated to reflect the new command state.
   */
  refresh(): void;
}


/**
 * A registry which holds user-defined commands.
 */
export
class CommandRegistry {
  /**
   * Construct a new command registry.
   */
  constructor() { }

  /**
   * A signal emitted when a command is added to the registry.
   *
   * #### Notes
   * The signal argument is the id of the added command.
   */
  commandAdded: ISignal<CommandRegistry, string>;

  /**
   * A signal emitted when a command is removed from the registry.
   *
   * #### Notes
   * The signal argument is the id of the removed command.
   */
  commandRemoved: ISignal<CommandRegistry, string>;

  /**
   * A signal emitted when the state of a command is changed.
   *
   * #### Notes
   * The signal argument is the id of the command which changed.
   */
  commandChanged: ISignal<CommandRegistry, string>;

  /**
   * List the ids of the registered commands.
   *
   * @returns A new array of the currently registered command ids.
   */
  list(): string[] {
    return Object.keys(this._commands);
  }

  /**
   * Test whether a specific command is registered.
   *
   * @param id - The id of the command of interest.
   *
   * @returns `true` if the command is registered, `false` otherwise.
   */
  has(id: string): boolean {
    return id in this._commands;
  }

  /**
   * Add a command to the registry.
   *
   * @param id - The unique id of the command.
   *
   * @param cmd - The command object to register.
   *
   * @returns A command handle which can be used to unregister and
   *   refresh the registered command.
   *
   * @throws An error if the given `id` is already registered.
   *
   * #### Notes
   * The given commmand object is cloned internally when added to
   * the registry. In place changes to the given command will have
   * no effect after the command is registered. For this reason, a
   * command will typically be added as an inline object literal.
   */
  add(id: string, cmd: ICommand): ICommandHandle {
    // Throw an error if the id is already registered.
    if (id in this._commands) {
      throw new Error(`Command '${id}' already registered.`);
    }

    // Normalize and add the command to the registry.
    this._commands[id] = Private.normalizeCommand(cmd);

    // Emit the `commandAdded` signal.
    this.commandAdded.emit(id);

    // Return a new handle for the command.
    return new Private.CommandHandle(id, this, () => {
      // Remove the command from the registry.
      delete this._commands[id];

      // Emit the `commandRemoved` signal.
      this.commandRemoved.emit(id);
    });
  }

  /**
   * Get the display text for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The display text for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  text(id: string, args: any): string {
    let cmd = this._commands[id];
    return cmd ? cmd.text.call(void 0, args) : '';
  }

  /**
   * Get the icon class for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The icon class for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  icon(id: string, args: any): string {
    let cmd = this._commands[id];
    return cmd ? cmd.icon.call(void 0, args) : '';
  }

  /**
   * Get the short form caption for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The caption for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  caption(id: string, args: any): string {
    let cmd = this._commands[id];
    return cmd ? cmd.caption.call(void 0, args) : '';
  }

  /**
   * Get the long form description for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The description for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  description(id: string, args: any): string {
    let cmd = this._commands[id];
    return cmd ? cmd.description.call(void 0, args) : '';
  }

  /**
   * Get the category name for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The category for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  category(id: string, args: any): string {
    let cmd = this._commands[id];
    return cmd ? cmd.category.call(void 0, args) : '';
  }

  /**
   * Get the extra class name for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The class name for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  className(id: string, args: any): string {
    let cmd = this._commands[id];
    return cmd ? cmd.className.call(void 0, args) : '';
  }

  /**
   * Test whether a specific command is enabled.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns `true` if the command is enabled, `false` otherwise.
   *
   * #### Notes
   * Returns `false` if the command is not registered.
   */
  isEnabled(id: string, args: any): boolean {
    let cmd = this._commands[id];
    return cmd ? cmd.isEnabled.call(void 0, args) : false;
  }

  /**
   * Test whether a specific command is toggled.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns `true` if the command is toggled, `false` otherwise.
   *
   * #### Notes
   * Returns `false` if the command is not registered.
   */
  isToggled(id: string, args: any): boolean {
    let cmd = this._commands[id];
    return cmd ? cmd.isToggled.call(void 0, args) : false;
  }

  /**
   * Test whether a specific command is visible.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns `true` if the command is visible, `false` otherwise.
   *
   * #### Notes
   * Returns `false` if the command is not registered.
   */
  isVisible(id: string, args: any): boolean {
    let cmd = this._commands[id];
    return cmd ? cmd.isVisible.call(void 0, args) : false;
  }

  /**
   * Execute a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns A promise which resolves to the result of the command.
   *
   * #### Notes
   * The returned promise will reject if the command is not registered,
   * is not enabled, throws an exception during execution, or otherwise
   * rejects its own returned promise.
   */
  execute(id: string, args: any): Promise<any> {
    // Reject if the command is not registered.
    let cmd = this._commands[id];
    if (!cmd) {
      return Promise.reject(`Command '${id}' not registered.`);
    }

    // Reject if the command is not enabled.
    if (!cmd.isEnabled.call(void 0, args)) {
      return Promise.reject(`Command '${id}' not enabled.`);
    }

    // Execute the command and reject if an exception is thrown.
    let result: any;
    try {
      result = cmd.execute.call(void 0, args);
    } catch (e) {
      result = Promise.reject(e);
    }

    // Return a promise which resolves to the command result.
    return Promise.resolve(result);
  }

  private _commands = Private.createCommandMap();
}


// Define the signals for the `CommandRegistry` class.
defineSignal(CommandRegistry.prototype, 'commandAdded');
defineSignal(CommandRegistry.prototype, 'commandRemoved');
defineSignal(CommandRegistry.prototype, 'commandChanged');


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * The concrete implementation of `ICommandHandle`.
   */
  export
  class CommandHandle extends DisposableDelegate implements ICommandHandle {
    /**
     * Construct a new command handle.
     *
     * @param id - The id of the command.
     *
     * @param registry - The command registry which owns the command.
     *
     * @param callback - A dispose callback which removes the command.
     */
    constructor(id: string, registry: CommandRegistry, callback: () => void) {
      super(callback);
      this._id = id;
      this._registry = registry;
    }

    /**
     * Dispose of the handle and unregister the command.
     */
    dispose(): void {
      this._id = '';
      this._registry = null;
      super.dispose();
    }

    /**
     * The id of the registered command.
     */
    get id(): string {
      return this._id;
    }

    /**
     * The command registry which owns the command.
     */
    get registry(): CommandRegistry {
      return this._registry;
    }

    /**
     * Refresh the state of the command.
     */
    refresh(): void {
      this._registry.commandChanged.emit(this._id);
    }

    private _id: string;
    private _registry: CommandRegistry;
  }

  /**
   * A normalized command object.
   */
  export
  interface INormalizedCommand {
    execute: ExecFunc;
    text: StringFunc;
    icon: StringFunc;
    caption: StringFunc;
    description: StringFunc;
    category: StringFunc;
    className: StringFunc;
    isEnabled: BoolFunc;
    isToggled: BoolFunc;
    isVisible: BoolFunc;
  }

  /**
   * A type alias for a map of id to normalized command.
   */
  export
  type CommandMap = { [id: string]: INormalizedCommand };

  /**
   * Create a new command map.
   */
  export
  function createCommandMap(): CommandMap {
    return Object.create(null);
  }

  /**
   * Normalize a user-defined command.
   */
  export
  function normalizeCommand(cmd: ICommand): INormalizedCommand {
    return {
      execute: cmd.execute,
      text: asStringFunc(cmd.text),
      icon: asStringFunc(cmd.icon),
      caption: asStringFunc(cmd.caption),
      description: asStringFunc(cmd.description),
      category: asStringFunc(cmd.category),
      className: asStringFunc(cmd.className),
      isEnabled: cmd.isEnabled || trueFunc,
      isToggled: cmd.isToggled || falseFunc,
      isVisible: cmd.isVisible || trueFunc
    };
  }

  /**
   * A singleton empty string function.
   */
  const emptyStringFunc: StringFunc = (args: any) => '';

  /**
   * A singleton true boolean function.
   */
  const trueFunc: BoolFunc = (args: any) => true;

  /**
   * A singleton false boolean function.
   */
  const falseFunc: BoolFunc = (args: any) => false;

  /**
   * Coerce an optional string or string func to a string func.
   */
  function asStringFunc(text?: string | StringFunc): StringFunc {
    if (text === void 0) {
      return emptyStringFunc;
    }
    if (typeof text === 'function') {
      return text;
    }
    return (args: any) => text as string;
  }
}
