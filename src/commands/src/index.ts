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
 * An object which represents a user-defined command.
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
interface ICommand {
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
  readonly execute: (args: JSONObject | null) => any;

  /**
   * The label text for the command.
   *
   * #### Notes
   * This can be a string literal, or a function which returns the
   * label based on the provided command arguments.
   *
   * The default value is an empty string.
   */
  readonly label?: string | ((args: JSONObject | null) => string);

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
  readonly mnemonic?: number | ((args: JSONObject | null) => number);

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
  readonly icon?: string | ((args: JSONObject | null) => string);

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
  readonly caption?: string | ((args: JSONObject | null) => string);

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
  readonly usage?: string | ((args: JSONObject | null) => string);

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
  readonly className?: string | ((args: JSONObject | null) => string);

  /**
   * A function which indicates whether the command is enabled.
   *
   * #### Notes
   * Visual representations may use this value to display a disabled
   * command as grayed-out or in some other non-interactive fashion.
   *
   * The default value is `true`.
   */
  readonly isEnabled?: (args: JSONObject | null) => boolean;

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
  readonly isToggled?: (args: JSONObject | null) => boolean;

  /**
   * A function which indicates whether the command is visible.
   *
   * #### Notes
   * Visual representations may use this value to hide or otherwise
   * not display a non-visible command.
   *
   * The default value is `true`.
   */
  readonly isVisible?: (args: JSONObject | null) => boolean;
}


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
   * @param command - The command to add to the registry.
   *
   * @returns A disposable which will remove the command.
   *
   * @throws An error if the given `id` is already registered.
   */
  addCommand(id: string, command: ICommand): IDisposable {
    // Throw an error if the id is already registered.
    if (id in this._commands) {
      throw new Error(`Command '${id}' already registered.`);
    }

    // Add the command to the registry.
    this._commands[id] = command;

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
    if (!cmd || cmd.label === undefined) {
      return '';
    }
    if (typeof cmd.label === 'string') {
      return cmd.label;
    }
    return cmd.label.call(undefined, args);
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
    if (!cmd || cmd.mnemonic === undefined) {
      return -1;
    }
    if (typeof cmd.mnemonic === 'number') {
      return cmd.mnemonic;
    }
    return cmd.mnemonic.call(undefined, args);
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
    if (!cmd || cmd.icon === undefined) {
      return '';
    }
    if (typeof cmd.icon === 'string') {
      return cmd.icon;
    }
    return cmd.icon.call(undefined, args);
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
    if (!cmd || cmd.caption === undefined) {
      return '';
    }
    if (typeof cmd.caption === 'string') {
      return cmd.caption;
    }
    return cmd.caption.call(undefined, args);
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
    if (!cmd || cmd.usage === undefined) {
      return '';
    }
    if (typeof cmd.usage === 'string') {
      return cmd.usage;
    }
    return cmd.usage.call(undefined, args);
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
    if (!cmd || cmd.className === undefined) {
      return '';
    }
    if (typeof cmd.className === 'string') {
      return cmd.className;
    }
    return cmd.className.call(undefined, args);
  }

  /**
   * Test whether a specific command is enabled.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns `true` if the command is enabled, or `false` if
   *   the command is disabled or not registered.
   */
  isEnabled(id: string, args: JSONObject | null): boolean {
    let cmd = this._commands[id];
    if (!cmd) {
      return false;
    }
    if (cmd.isEnabled === undefined) {
      return true;
    }
    return cmd.isEnabled.call(undefined, args);
  }

  /**
   * Test whether a specific command is toggled.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns `true` if the command is toggled, or `false` if
   *   the command is not toggled or not registered.
   */
  isToggled(id: string, args: JSONObject | null): boolean {
    let cmd = this._commands[id];
    if (!cmd || cmd.isToggled === undefined) {
      return false;
    }
    return cmd.isToggled.call(undefined, args);
  }

  /**
   * Test whether a specific command is visible.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns `true` if the command is visible, or `false` if
   *   the command is not visible or not registered.
   */
  isVisible(id: string, args: JSONObject | null): boolean {
    let cmd = this._commands[id];
    if (!cmd) {
      return false;
    }
    if (cmd.isVisible === undefined) {
      return true;
    }
    return cmd.isVisible.call(undefined, args);
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

  private _commands: { [id: string]: ICommand } = Object.create(null);
  private _commandChanged = new Signal<this, CommandRegistry.ICommandChangedArgs>(this);
  private _commandExecuted = new Signal<this, CommandRegistry.ICommandExecutedArgs>(this);
}


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
