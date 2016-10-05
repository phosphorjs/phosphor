/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  JSONObject
} from '../algorithm/json';

import {
  IDisposable, DisposableDelegate
} from '../core/disposable';

import {
  ISignal, defineSignal
} from '../core/signaling';


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
   * A signal emmitted when a command is changed.
   */
  commandChanged: ISignal<CommandRegistry, CommandRegistry.ICommandChangedArgs>;

  /**
   * A signal emitted when a command is executed.
   */
  commandExecuted: ISignal<CommandRegistry, CommandRegistry.ICommandExecutedArgs>;

  /**
   * List the ids of the registered commands.
   *
   * @returns A new array of the registered command ids.
   */
  listCommands(): string[] {
    return Object.keys(this._commands);
  }

  /**
   * Test whether a specific command is registered.
   *
   * @param id - The id of the command of interest.
   *
   * @returns `true` if the command is registered, `false` otherwise.
   */
  hasCommand(id: string): boolean {
    return id in this._commands;
  }

  /**
   * Add a command to the registry.
   *
   * @param id - The unique id of the command.
   *
   * @param options - The options for the command.
   *
   * @returns A disposable which will unregister the command.
   *
   * @throws An error if the given `id` is already registered.
   */
  addCommand(id: string, options: CommandRegistry.ICommandOptions): IDisposable {
    // Throw an error if the id is already registered.
    if (id in this._commands) {
      throw new Error(`Command '${id}' already registered.`);
    }

    // Create the command and add it to the registry.
    this._commands[id] = Private.createCommand(options);

    // Emit the `commandChanged` signal.
    this.commandChanged.emit({ id, type: 'added' });

    // Return a disposable which will remove the command.
    return new DisposableDelegate(() => {
      // Remove the command from the registry.
      delete this._commands[id];

      // Emit the `commandChanged` signal.
      this.commandChanged.emit({ id, type: 'removed' });
    });
  }

  /**
   * Notify listeners that the state of a command has changed.
   *
   * @param id - The id of the command which has changed.
   *
   * #### Notes
   * This method should be called by the command author whenever the
   * application state changes such that the results of the command
   * metadata functions may have changed.
   *
   * This will cause the `commandChanged` signal to be emitted.
   *
   * If the command is not registered, this is a no-op.
   */
  notifyCommandChanged(id: string): void {
    if (id in this._commands) {
      this.commandChanged.emit({ id, type: 'changed' });
    }
  }

  /**
   * Get the display label for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The display label for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  label(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.label.call(void 0, args) : '';
  }

  /**
   * Get the mnemonic index for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The mnemonic index for the command.
   *
   * #### Notes
   * Returns `-1` if the command is not registered.
   */
  mnemonic(id: string, args: JSONObject | null): number {
    let cmd = this._commands[id];
    return cmd ? cmd.mnemonic.call(void 0, args) : -1;
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
  icon(id: string, args: JSONObject | null): string {
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
  caption(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.caption.call(void 0, args) : '';
  }

  /**
   * Get the usage help text for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The usage text for the command.
   *
   * #### Notes
   * Returns an empty string if the command is not registered.
   */
  usage(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.usage.call(void 0, args) : '';
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
  className(id: string, args: JSONObject | null): string {
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
  isEnabled(id: string, args: JSONObject | null): boolean {
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
  isToggled(id: string, args: JSONObject | null): boolean {
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
  isVisible(id: string, args: JSONObject | null): boolean {
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
   * The promise will reject if the command is not registered.
   */
  execute(id: string, args: JSONObject | null): Promise<any> {
    // Reject if the command is not registered.
    let cmd = this._commands[id];
    if (!cmd) {
      return Promise.reject(new Error(`Command '${id}' not registered.`));
    }

    // Execute the command and reject if an exception is thrown.
    let result: any;
    try {
      result = cmd.execute.call(void 0, args);
    } catch (err) {
      result = Promise.reject(err);
    }

    // Create the return promise which resolves the result.
    let promise = Promise.resolve(result);

    // Emit the command executed signal.
    this.commandExecuted.emit({ id, args });

    // Return the result promise to the caller.
    return promise;
  }

  private _commands: Private.CommandMap = Object.create(null);
}


// Define the signals for the `CommandRegistry` class.
defineSignal(CommandRegistry.prototype, 'commandChanged');
defineSignal(CommandRegistry.prototype, 'commandExecuted');


/**
 * The namespace for the `CommandRegistry` class statics.
 */
export
namespace CommandRegistry {
  /**
   * An arguments object for the `commandChanged` signal.
   */
  export
  interface ICommandChangedArgs {
    /**
     * The id of the associated command.
     */
    id: string;

    /**
     * Whether the command was added, removed, or changed.
     */
    type: 'added' | 'removed' | 'changed';
  }

  /**
   * An arguments object for the `commandExecuted` signal.
   */
  export
  interface ICommandExecutedArgs {
    /**
     * The id of the associated command.
     */
    id: string;

    /**
     * The arguments object passed to the command.
     */
    args: JSONObject | null;
  }

  /**
   * A type alias for a command execute function.
   *
   * @param args - The arguments for the command.
   *
   * @returns The command result, a promise to the result, or void.
   */
  export
  type ExecFunc = (args: JSONObject | null) => any;

  /**
   * A type alias for a command string function.
   *
   * @param args - The arguments for the command.
   *
   * @returns The relevant string result.
   */
  export
  type StringFunc = (args: JSONObject | null) => string;

  /**
   * A type alias for a command number function.
   *
   * @param args - The arguments for the command.
   *
   * @returns The relevant number result.
   */
  export
  type NumberFunc = (args: JSONObject | null) => number;

  /**
   * A type alias for a command boolean function.
   *
   * @param args - The arguments for the command.
   *
   * @returns The relevant boolean result.
   */
  export
  type BoolFunc = (args: JSONObject | null) => boolean;

  /**
   * An options object for creating a command.
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
   * The metadata functions for the command should be well behaved in
   * the presence of `null` args by returning a default value.
   */
  export
  interface ICommandOptions {
    /**
     * The function to invoke when the command is executed.
     *
     * #### Notes
     * This function may be invoked manually by the user, even when
     * the `isEnabled` function returns `false`.
     */
    execute: ExecFunc;

    /**
     * The label text for the command.
     *
     * #### Notes
     * This can be a string literal, or a function which returns the
     * label based on the provided command arguments.
     *
     * The default value is an empty string.
     */
    label?: string | StringFunc;

    /**
     * The index of the mnemonic character for the command.
     *
     * #### Notes
     * This can be an index literal, or a function which returns the
     * mnemonic index based on the provided command arguments.
     *
     * The default value is `-1`.
     */
    mnemonic?: number | NumberFunc;

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
     * The caption for the command.
     *
     * #### Notes
     * This should be a simple one line description of the command. It
     * is used by some visual representations to show quick info about
     * the command.
     *
     * This can be a string literal, or a function which returns the
     * caption based on the provided command arguments.
     *
     * The default value is an empty string.
     */
    caption?: string | StringFunc;

    /**
     * The usage text for the command.
     *
     * #### Notes
     * This should be a full description of the command, which includes
     * information about the structure of the arguments and the type of
     * the return value. It is used by some visual representations when
     * displaying complete help info about the command.
     *
     * This can be a string literal, or a function which returns the
     * usage text based on the provided command arguments.
     *
     * The default value is an empty string.
     */
    usage?: string | StringFunc;

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
     * Visual representations may use this value to display a disabled
     * command as grayed-out or in some other non-interactive fashion.
     *
     * The default value is `true`.
     */
    isEnabled?: BoolFunc;

    /**
     * A function which indicates whether the command is toggled.
     *
     * #### Notes
     * Visual representations may use this value to display a toggled
     * command in a different form, such as a check mark icon for a
     * menu item or a depressed state for a toggle button.
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
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  // Convenience type aliases
  type ExecFunc = CommandRegistry.ExecFunc;
  type StringFunc = CommandRegistry.StringFunc;
  type NumberFunc = CommandRegistry.NumberFunc;
  type BoolFunc = CommandRegistry.BoolFunc;

  /**
   * A normalized command object.
   */
  export
  interface ICommand {
    execute: ExecFunc;
    label: StringFunc;
    mnemonic: NumberFunc;
    icon: StringFunc;
    caption: StringFunc;
    usage: StringFunc;
    className: StringFunc;
    isEnabled: BoolFunc;
    isToggled: BoolFunc;
    isVisible: BoolFunc;
  }

  /**
   * A type alias for a map of id to normalized command.
   */
  export
  type CommandMap = { [id: string]: ICommand };

  /**
   * Create a normalized command object from options.
   */
  export
  function createCommand(options: CommandRegistry.ICommandOptions): ICommand {
    return {
      execute: options.execute,
      label: asStringFunc(options.label),
      mnemonic: asNumberFunc(options.mnemonic),
      icon: asStringFunc(options.icon),
      caption: asStringFunc(options.caption),
      usage: asStringFunc(options.usage),
      className: asStringFunc(options.className),
      isEnabled: options.isEnabled || trueFunc,
      isToggled: options.isToggled || falseFunc,
      isVisible: options.isVisible || trueFunc
    };
  }

  /**
   * A singleton empty string function.
   */
  const emptyStringFunc: StringFunc = (args: JSONObject | null) => '';

  /**
   * A singleton `-1` number function
   */
  const negativeOneFunc: NumberFunc = (args: JSONObject | null) => -1;

  /**
   * A singleton true boolean function.
   */
  const trueFunc: BoolFunc = (args: JSONObject | null) => true;

  /**
   * A singleton false boolean function.
   */
  const falseFunc: BoolFunc = (args: JSONObject | null) => false;

  /**
   * Coerce a value to a string function.
   */
  function asStringFunc(value?: string | StringFunc): StringFunc {
    if (value === void 0) {
      return emptyStringFunc;
    }
    if (typeof value === 'function') {
      return value;
    }
    return (args: JSONObject | null) => value as string;
  }

  /**
   * Coerce a value to a number function.
   */
  function asNumberFunc(value?: number | NumberFunc): NumberFunc {
    if (value === void 0) {
      return negativeOneFunc;
    }
    if (typeof value === 'function') {
      return value;
    }
    return (args: JSONObject | null) => value as number;
  }
}
