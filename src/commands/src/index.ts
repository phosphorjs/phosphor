/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DisposableDelegate, IDisposable
} from '@phosphor/disposable';

import {
  JSONObject
} from '@phosphor/json';

import {
  ISignal, Signal
} from '@phosphor/signaling';


/**
 * An object which manages a collection of commands.
 *
 * #### Notes
 * Command registries are commonly used to populate command palettes,
 * menus, toolbars, and keymaps.
 */
export
class CommandRegistry {
  /**
   * Construct a new command registry.
   */
  constructor() { }

  /**
   * A signal emitted when a command has changed.
   *
   * #### Notes
   * This signal is useful for visual representations of commands which
   * need to refresh when the state of a relevant command has changed.
   */
  get commandChanged(): ISignal<this, CommandRegistry.ICommandChangedArgs> {
    return this._commandChanged;
  }

  /**
   * A signal emitted when a command has executed.
   *
   * #### Notes
   * Care should be taken when consuming this signal. It is intended to
   * be used largely for debugging and logging purposes. It should not
   * be (ab)used for general purpose spying on command execution.
   */
  get commandExecuted(): ISignal<this, CommandRegistry.ICommandExecutedArgs> {
    return this._commandExecuted;
  }

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
   * @returns A disposable which will remove the command.
   *
   * @throws An error if the given `id` is already registered.
   */
  addCommand(id: string, options: CommandRegistry.ICommandOptions): IDisposable {
    // Throw an error if the id is already registered.
    if (id in this._commands) {
      throw new Error(`Command '${id}' already registered.`);
    }

    // Add the command to the registry.
    this._commands[id] = Private.createCommand(options);

    // Emit the `commandChanged` signal.
    this._commandChanged.emit({ id, type: 'added' });

    // Return a disposable which will remove the command.
    return new DisposableDelegate(() => {
      // Remove the command from the registry.
      delete this._commands[id];

      // Emit the `commandChanged` signal.
      this._commandChanged.emit({ id, type: 'removed' });
    });
  }

  /**
   * Notify listeners that the state of a command has changed.
   *
   * @param id - The id of the command which has changed.
   *
   * @throws An error if the given `id` is not registered.
   *
   * #### Notes
   * This method should be called by the command author whenever the
   * application state changes such that the results of the command
   * metadata functions may have changed.
   *
   * This will cause the `commandChanged` signal to be emitted.
   */
  notifyCommandChanged(id: string): void {
    if (!(id in this._commands)) {
      throw new Error(`Command '${id}' is not registered.`);
    }
    this._commandChanged.emit({ id, type: 'changed' });
  }

  /**
   * Get the display label for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The display label for the command, or an empty string
   *   if the command is not registered.
   */
  label(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.label.call(undefined, args) : '';
  }

  /**
   * Get the mnemonic index for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The mnemonic index for the command, or `-1` if the
   *   command is not registered.
   */
  mnemonic(id: string, args: JSONObject | null): number {
    let cmd = this._commands[id];
    return cmd ? cmd.mnemonic.call(undefined, args) : -1;
  }

  /**
   * Get the icon class for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The icon class for the command, or an empty string if
   *   the command is not registered.
   */
  icon(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.icon.call(undefined, args) : '';
  }

  /**
   * Get the short form caption for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The caption for the command, or an empty string if the
   *   command is not registered.
   */
  caption(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.caption.call(undefined, args) : '';
  }

  /**
   * Get the usage help text for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The usage text for the command, or an empty string if
   *   the command is not registered.
   */
  usage(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.usage.call(undefined, args) : '';
  }

  /**
   * Get the extra class name for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The class name for the command, or an empty string if
   *   the command is not registered.
   */
  className(id: string, args: JSONObject | null): string {
    let cmd = this._commands[id];
    return cmd ? cmd.className.call(undefined, args) : '';
  }

  /**
   * Test whether a specific command is enabled.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns A boolean indicating whether the command is enabled,
   *   or `false` if the command is not registered.
   */
  isEnabled(id: string, args: JSONObject | null): boolean {
    let cmd = this._commands[id];
    return cmd ? cmd.isEnabled.call(undefined, args) : false;
  }

  /**
   * Test whether a specific command is toggled.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns A boolean indicating whether the command is toggled,
   *   or `false` if the command is not registered.
   */
  isToggled(id: string, args: JSONObject | null): boolean {
    let cmd = this._commands[id];
    return cmd ? cmd.isToggled.call(undefined, args) : false;
  }

  /**
   * Test whether a specific command is visible.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns A boolean indicating whether the command is visible,
   *   or `false` if the command is not registered.
   */
  isVisible(id: string, args: JSONObject | null): boolean {
    let cmd = this._commands[id];
    return cmd ? cmd.isVisible.call(undefined, args) : false;
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
   * The promise will reject if the command throws an exception,
   * or if the command is not registered.
   */
  execute(id: string, args: JSONObject | null): Promise<any> {
    // Reject if the command is not registered.
    let cmd = this._commands[id];
    if (!cmd) {
      return Promise.reject(new Error(`Command '${id}' not registered.`));
    }

    // Execute the command and reject if an exception is thrown.
    let value: any;
    try {
      value = cmd.execute.call(undefined, args);
    } catch (err) {
      value = Promise.reject(err);
    }

    // Create the return promise which resolves the result.
    let result = Promise.resolve(value);

    // Emit the command executed signal.
    this._commandExecuted.emit({ id, args, result });

    // Return the result promise to the caller.
    return result;
  }

  private _commands: { [id: string]: Private.ICommand } = Object.create(null);
  private _commandChanged = new Signal<this, CommandRegistry.ICommandChangedArgs>(this);
  private _commandExecuted = new Signal<this, CommandRegistry.ICommandExecutedArgs>(this);
}


/**
 * The namespace for the `CommandRegistry` class statics.
 */
export
namespace CommandRegistry {
  /**
   * A type alias for a user-defined command function.
   */
  export
  type CommandFunc<T> = (args: JSONObject | null) => T;

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
   */
  export
  interface ICommandOptions {
    /**
     * The function to invoke when the command is executed.
     *
     * #### Notes
     * The should return the result of the command (if applicable) or
     * a promise to the result. The result is resolved as a promise
     * and that promise is returned to the code which executed the
     * command.
     *
     * This may be invoked even when `isEnabled` returns `false`.
     */
    execute: CommandFunc<any | Promise<any>>;

    /**
     * The label for the command.
     *
     * #### Notes
     * This can be a string literal, or a function which returns the
     * label based on the provided command arguments.
     *
     * The label is often used as the primary text for the command.
     *
     * The default value is an empty string.
     */
    label?: string | CommandFunc<string>;

    /**
     * The index of the mnemonic character in the command's label.
     *
     * #### Notes
     * This can be an index literal, or a function which returns the
     * mnemonic index based on the provided command arguments.
     *
     * The mnemonic character is often used by menus to provide easy
     * single-key keyboard access for triggering a menu item. It is
     * typically rendered as an underlined character in the label.
     *
     * The default value is `-1`.
     */
    mnemonic?: number | CommandFunc<number>;

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
    icon?: string | CommandFunc<string>;

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
    caption?: string | CommandFunc<string>;

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
    usage?: string | CommandFunc<string>;

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
    className?: string | CommandFunc<string>;

    /**
     * A function which indicates whether the command is enabled.
     *
     * #### Notes
     * Visual representations may use this value to display a disabled
     * command as grayed-out or in some other non-interactive fashion.
     *
     * The default value is `true`.
     */
    isEnabled?: CommandFunc<boolean>;

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
    isToggled?: CommandFunc<boolean>;

    /**
     * A function which indicates whether the command is visible.
     *
     * #### Notes
     * Visual representations may use this value to hide or otherwise
     * not display a non-visible command.
     *
     * The default value is `true`.
     */
    isVisible?: CommandFunc<boolean>;
  }

  /**
   * An arguments object for the `commandChanged` signal.
   */
  export
  interface ICommandChangedArgs {
    /**
     * The id of the associated command.
     */
    readonly id: string;

    /**
     * Whether the command was added, removed, or changed.
     */
    readonly type: 'added' | 'removed' | 'changed';
  }

  /**
   * An arguments object for the `commandExecuted` signal.
   */
  export
  interface ICommandExecutedArgs {
    /**
     * The id of the associated command.
     */
    readonly id: string;

    /**
     * The arguments object passed to the command.
     */
    readonly args: JSONObject | null;

    /**
     * The promise which resolves to the result of the command.
     */
    readonly result: Promise<any>;
  }
}


/**
 * The namespace for the module private data.
 */
export
namespace Private {
  /**
   * A normalized command object.
   */
  export
  interface ICommand {
    readonly execute: (args: JSONObject | null) => any;
    readonly label: (args: JSONObject | null) => string;
    readonly mnemonic:(args: JSONObject | null) => number;
    readonly icon: (args: JSONObject | null) => string;
    readonly caption: (args: JSONObject | null) => string;
    readonly usage: (args: JSONObject | null) => string;
    readonly className: (args: JSONObject | null) => string;
    readonly isEnabled: (args: JSONObject | null) => boolean;
    readonly isToggled: (args: JSONObject | null) => boolean;
    readonly isVisible: (args: JSONObject | null) => boolean;
  }

  /**
   * Create a normalized command from an options object.
   */
  export
  function createCommand(options: CommandRegistry.ICommandOptions): ICommand {
    return {
      execute: options.execute,
      label: asFunc(options.label, emptyStringFunc),
      mnemonic: asFunc(options.mnemonic, negativeOneFunc),
      icon: asFunc(options.icon, emptyStringFunc),
      caption: asFunc(options.caption, emptyStringFunc),
      usage: asFunc(options.usage, emptyStringFunc),
      className: asFunc(options.className, emptyStringFunc),
      isEnabled: options.isEnabled || trueFunc,
      isToggled: options.isToggled || falseFunc,
      isVisible: options.isVisible || trueFunc
    };
  }

  /**
   * A convenience type alias.
   */
  type CommandFunc<T> = CommandRegistry.CommandFunc<T>;

  /**
   * A singleton empty string function.
   */
  const emptyStringFunc = () => '';

  /**
   * A singleton `-1` number function
   */
  const negativeOneFunc = () => -1;

  /**
   * A singleton true boolean function.
   */
  const trueFunc = () => true;

  /**
   * A singleton false boolean function.
   */
  const falseFunc = () => false;

  /**
   * Cast a value or command func to a command func.
   */
  function asFunc<T>(value: undefined | T | CommandFunc<T>, dfault: CommandFunc<T>): CommandFunc<T> {
    if (value === undefined) {
      return dfault;
    }
    if (typeof value === 'function') {
      return value;
    }
    return () => value;
  }
}
