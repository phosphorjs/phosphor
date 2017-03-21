/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  JSONExt, JSONObject
} from '@phosphor/coreutils';

import {
  DisposableDelegate, IDisposable
} from '@phosphor/disposable';

import {
  Platform, Selector
} from '@phosphor/domutils';

import {
  getKeyboardLayout
} from '@phosphor/keyboard';

import {
  ISignal, Signal
} from '@phosphor/signaling';


/**
 * An object which manages a collection of commands.
 *
 * #### Notes
 * A command registry can be used to populate a variety of action-based
 * widgets, such as command palettes, menus, and toolbars.
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
   * A signal emitted when a key binding is changed.
   */
  get keyBindingChanged(): ISignal<this, CommandRegistry.IKeyBindingChangedArgs> {
    return this._keyBindingChanged;
  }

  /**
   * A read-only array of the key bindings in the registry.
   */
  get keyBindings(): ReadonlyArray<CommandRegistry.IKeyBinding> {
    return this._keyBindings;
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
  label(id: string, args: JSONObject = JSONExt.emptyObject): string {
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
  mnemonic(id: string, args: JSONObject = JSONExt.emptyObject): number {
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
  icon(id: string, args: JSONObject = JSONExt.emptyObject): string {
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
  caption(id: string, args: JSONObject = JSONExt.emptyObject): string {
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
  usage(id: string, args: JSONObject = JSONExt.emptyObject): string {
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
  className(id: string, args: JSONObject = JSONExt.emptyObject): string {
    let cmd = this._commands[id];
    return cmd ? cmd.className.call(undefined, args) : '';
  }

  /**
   * Get the dataset for a specific command.
   *
   * @param id - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The dataset for the command, or an empty dataset if
   *   the command is not registered.
   */
  dataset(id: string, args: JSONObject = JSONExt.emptyObject): CommandRegistry.Dataset {
    let cmd = this._commands[id];
    return cmd ? cmd.dataset.call(undefined, args) : {};
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
  isEnabled(id: string, args: JSONObject = JSONExt.emptyObject): boolean {
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
  isToggled(id: string, args: JSONObject = JSONExt.emptyObject): boolean {
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
  isVisible(id: string, args: JSONObject = JSONExt.emptyObject): boolean {
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
   * @returns A promise which resolves with the result of the command.
   *
   * #### Notes
   * The promise will reject if the command throws an exception,
   * or if the command is not registered.
   */
  execute(id: string, args: JSONObject = JSONExt.emptyObject): Promise<any> {
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

  /**
   * Add a key binding to the registry.
   *
   * @param options - The options for creating the key binding.
   *
   * @returns A disposable which removes the added key binding.
   *
   * #### Notes
   * If multiple key bindings are registered for the same sequence, the
   * binding with the highest selector specificity is executed first. A
   * tie is broken by using the most recently added key binding.
   *
   * Ambiguous key bindings are resolved with a timeout. As an example,
   * suppose two key bindings are registered: one with the key sequence
   * `['Ctrl D']`, and another with `['Ctrl D', 'Ctrl W']`. If the user
   * presses `Ctrl D`, the first binding cannot be immediately executed
   * since the user may intend to complete the chord with `Ctrl W`. For
   * such cases, a timer is used to allow the chord to be completed. If
   * the chord is not completed before the timeout, the first binding
   * is executed.
   */
  addKeyBinding(options: CommandRegistry.IKeyBindingOptions): IDisposable {
    // Create the binding for the given options.
    let binding = Private.createKeyBinding(options);

    // Add the key binding to the bindings array.
    this._keyBindings.push(binding);

    // Emit the `bindingChanged` signal.
    this._keyBindingChanged.emit({ binding, type: 'added' });

    // Return a disposable which will remove the binding.
    return new DisposableDelegate(() => {
      // Remove the binding from the array.
      ArrayExt.removeFirstOf(this._keyBindings, binding);

      // Emit the `bindingChanged` signal.
      this._keyBindingChanged.emit({ binding, type: 'removed' });
    });
  }

  /**
   * Process a `'keydown'` event and invoke a matching key binding.
   *
   * @param event - The event object for a `'keydown'` event.
   *
   * #### Notes
   * This should be called in response to a `'keydown'` event in order
   * to invoke the command for the best matching key binding.
   *
   * The registry **does not** install its own listener for `'keydown'`
   * events. This allows the application full control over the nodes
   * and phase for which the registry processes `'keydown'` events.
   */
  processKeydownEvent(event: KeyboardEvent): void {
    // Bail immediately if playing back keystrokes.
    if (this._replaying) {
      return;
    }

    // Get the normalized keystroke for the event.
    let keystroke = CommandRegistry.keystrokeForKeydownEvent(event);

    // If the keystroke is not valid for the keyboard layout, replay
    // any suppressed events and clear the pending state.
    if (!keystroke) {
      this._replayKeydownEvents();
      this._clearPendingState();
      return;
    }

    // Add the keystroke to the current key sequence.
    this._keystrokes.push(keystroke);

    // Find the exact and partial matches for the key sequence.
    let { exact, partial } = Private.matchKeyBinding(
      this._keyBindings, this._keystrokes, event
    );

    // If there is no exact match and no partial match, replay
    // any suppressed events and clear the pending state.
    if (!exact && !partial) {
      this._replayKeydownEvents();
      this._clearPendingState();
      return;
    }

    // Stop propagation of the event. If there is only a partial match,
    // the event will be replayed if a final exact match never occurs.
    event.preventDefault();
    event.stopPropagation();

    // If there is an exact match but no partial match, the exact match
    // can be dispatched immediately. The pending state is cleared so
    // the next key press starts from the default state.
    if (exact && !partial) {
      this._executeKeyBinding(exact);
      this._clearPendingState();
      return;
    }

    // If there is both an exact match and a partial match, the exact
    // match is stored for future dispatch in case the timer expires
    // before a more specific match is triggered.
    if (exact) {
      this._exactKeyMatch = exact;
    }

    // Store the event for possible playback in the future.
    this._keydownEvents.push(event);

    // (Re)start the timer to dispatch the most recent exact match
    // in case the partial match fails to result in an exact match.
    this._startTimer();
  }

  /**
   * Start or restart the pending timeout.
   */
  private _startTimer(): void {
    this._clearTimer();
    this._timerID = setTimeout(() => {
      this._onPendingTimeout();
    }, Private.CHORD_TIMEOUT);
  }

  /**
   * Clear the pending timeout.
   */
  private _clearTimer(): void {
    if (this._timerID !== 0) {
      clearTimeout(this._timerID);
      this._timerID = 0;
    }
  }

  /**
   * Replay the keydown events which were suppressed.
   */
  private _replayKeydownEvents(): void {
    if (this._keydownEvents.length === 0) {
      return;
    }
    this._replaying = true;
    this._keydownEvents.forEach(Private.replayKeyEvent);
    this._replaying = false;
  }

  /**
   * Execute the command for the given key binding.
   *
   * If the command is missing or disabled, a warning will be logged.
   */
  private _executeKeyBinding(binding: CommandRegistry.IKeyBinding): void {
    let { command, args } = binding;
    if (!this.hasCommand(command) || !this.isEnabled(command, args)) {
      let word = this.hasCommand(command) ? 'enabled' : 'registered';
      let keys = binding.keys.join(', ');
      let msg1 = `Cannot execute key binding '${keys}':`;
      let msg2 = `command '${command}' is not ${word}.`;
      console.warn(`${msg1} ${msg2}`);
      return;
    }
    this.execute(command, args);
  }

  /**
   * Clear the internal pending state.
   */
  private _clearPendingState(): void {
    this._clearTimer();
    this._exactKeyMatch = null;
    this._keystrokes.length = 0;
    this._keydownEvents.length = 0;
  }

  /**
   * Handle the partial match timeout.
   */
  private _onPendingTimeout(): void {
    this._timerID = 0;
    if (this._exactKeyMatch) {
      this._executeKeyBinding(this._exactKeyMatch);
    } else {
      this._replayKeydownEvents();
    }
    this._clearPendingState();
  }

  private _timerID = 0;
  private _replaying = false;
  private _keystrokes: string[] = [];
  private _keydownEvents: KeyboardEvent[] = [];
  private _keyBindings: CommandRegistry.IKeyBinding[] = [];
  private _exactKeyMatch: CommandRegistry.IKeyBinding | null = null;
  private _commands: { [id: string]: Private.ICommand } = Object.create(null);
  private _commandChanged = new Signal<this, CommandRegistry.ICommandChangedArgs>(this);
  private _commandExecuted = new Signal<this, CommandRegistry.ICommandExecutedArgs>(this);
  private _keyBindingChanged = new Signal<this, CommandRegistry.IKeyBindingChangedArgs>(this);
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
  type CommandFunc<T> = (args: JSONObject) => T;

  /**
   * A type alias for a simple immutable string dataset.
   */
  export
  type Dataset = { readonly [key: string]: string };

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
     * This should return the result of the command (if applicable) or
     * a promise which yields the result. The result is resolved as a
     * promise and that promise is returned to the code which executed
     * the command.
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
     * The dataset for the command.
     *
     * #### Notes
     * This dataset values will be added to the primary node for the
     * visual representation of the command.
     *
     * This can be a dataset object, or a function which returns the
     * dataset object based on the provided command arguments.
     *
     * The default value is an empty dataset.
     */
    dataset?: Dataset | CommandFunc<Dataset>;

    /**
     * A function which indicates whether the command is enabled.
     *
     * #### Notes
     * Visual representations may use this value to display a disabled
     * command as grayed-out or in some other non-interactive fashion.
     *
     * The default value is `() => true`.
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
     * The default value is `() => false`.
     */
    isToggled?: CommandFunc<boolean>;

    /**
     * A function which indicates whether the command is visible.
     *
     * #### Notes
     * Visual representations may use this value to hide or otherwise
     * not display a non-visible command.
     *
     * The default value is `() => true`.
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
    readonly args: JSONObject;

    /**
     * The promise which resolves with the result of the command.
     */
    readonly result: Promise<any>;
  }

  /**
   * An options object for creating a key binding.
   */
  export
  interface IKeyBindingOptions {
    /**
     * The default key sequence for the key binding.
     *
     * A key sequence is composed of one or more keystrokes, where each
     * keystroke is a combination of modifiers and a primary key.
     *
     * Most key sequences will contain a single keystroke. Key sequences
     * with multiple keystrokes are called "chords", and are useful for
     * implementing modal input (ala Vim).
     *
     * Each keystroke in the sequence should be of the form:
     *   `[<modifier 1> [<modifier 2> [<modifier N> ]]]<primary key>`
     *
     * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
     * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
     * `Ctrl` on all other platforms. The `Cmd` modifier is ignored on
     * non-Mac platforms.
     *
     * Keystrokes are case sensitive.
     *
     * **Examples:** `['Accel C']`, `['Shift F11']`, `['D', 'D']`
     */
    keys: string[];

    /**
     * The CSS selector for the key binding.
     *
     * The key binding will only be invoked when the selector matches a
     * node on the propagation path of the keydown event. This allows
     * the key binding to be restricted to user-defined contexts.
     *
     * The selector must not contain commas.
     */
    selector: string;

    /**
     * The id of the command to execute when the binding is matched.
     */
    command: string;

    /**
     * The arguments for the command, if necessary.
     *
     * The default value is an empty object.
     */
    args?: JSONObject;

    /**
     * The key sequence to use when running on Windows.
     *
     * If provided, this will override `keys` on Windows platforms.
     */
    winKeys?: string[];

    /**
     * The key sequence to use when running on Mac.
     *
     * If provided, this will override `keys` on Mac platforms.
     */
    macKeys?: string[];

    /**
     * The key sequence to use when running on Linux.
     *
     * If provided, this will override `keys` on Linux platforms.
     */
    linuxKeys?: string[];
  }

  /**
   * An object which represents a key binding.
   *
   * #### Notes
   * A key binding is an immutable object created by a registry.
   */
  export
  interface IKeyBinding {
    /**
     * The key sequence for the binding.
     */
    readonly keys: ReadonlyArray<string>;

    /**
     * The CSS selector for the binding.
     */
    readonly selector: string;

    /**
     * The command executed when the binding is matched.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: JSONObject;
  }

  /**
   * An arguments object for the `keyBindingChanged` signal.
   */
  export
  interface IKeyBindingChangedArgs {
    /**
     * The key binding which was changed.
     */
    readonly binding: IKeyBinding;

    /**
     * Whether the key binding was added or removed.
     */
    readonly type: 'added' | 'removed';
  }

  /**
   * An object which holds the results of parsing a keystroke.
   */
  export
  interface IKeystrokeParts {
    /**
     * Whether `'Cmd'` appears in the keystroke.
     */
    cmd: boolean;

    /**
     * Whether `'Ctrl'` appears in the keystroke.
     */
    ctrl: boolean;

    /**
     * Whether `'Alt'` appears in the keystroke.
     */
    alt: boolean;

    /**
     * Whether `'Shift'` appears in the keystroke.
     */
    shift: boolean;

    /**
     * The primary key for the keystroke.
     */
    key: string;
  }

  /**
   * Parse a keystroke into its constituent components.
   *
   * @param keystroke - The keystroke of interest.
   *
   * @returns The parsed components of the keystroke.
   *
   * #### Notes
   * The keystroke should be of the form:
   *   `[<modifier 1> [<modifier 2> [<modifier N> ]]]<primary key>`
   *
   * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
   * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
   * `Ctrl` on all other platforms.
   *
   * The parsing is tolerant and will not throw exceptions. Notably:
   *   - Duplicate modifiers are ignored.
   *   - Extra primary keys are ignored.
   *   - The order of modifiers and primary key is irrelevant.
   *   - The keystroke parts should be separated by whitespace.
   *   - The keystroke is case sensitive.
   */
  export
  function parseKeystroke(keystroke: string): IKeystrokeParts {
    let key = '';
    let alt = false;
    let cmd = false;
    let ctrl = false;
    let shift = false;
    for (let token of keystroke.split(/\s+/)) {
      if (token === 'Accel') {
        if (Platform.IS_MAC) {
          cmd = true;
        } else {
          ctrl = true;
        }
      } else if (token === 'Alt') {
        alt = true;
      } else if (token === 'Cmd') {
        cmd = true;
      } else if (token === 'Ctrl') {
        ctrl = true;
      } else if (token === 'Shift') {
        shift = true;
      } else if (token.length > 0) {
        key = token;
      }
    }
    return { cmd, ctrl, alt, shift, key };
  }

  /**
   * Normalize a keystroke into a canonical representation.
   *
   * @param keystroke - The keystroke of interest.
   *
   * @returns The normalized representation of the keystroke.
   *
   * #### Notes
   * This normalizes the keystroke by removing duplicate modifiers and
   * extra primary keys, and assembling the parts in a canonical order.
   *
   * The `Cmd` modifier is ignored on non-Mac platforms.
   */
  export
  function normalizeKeystroke(keystroke: string): string {
    let mods = '';
    let parts = parseKeystroke(keystroke);
    if (parts.ctrl) {
      mods += 'Ctrl ';
    }
    if (parts.alt) {
      mods += 'Alt ';
    }
    if (parts.shift) {
      mods += 'Shift ';
    }
    if (parts.cmd && Platform.IS_MAC) {
      mods += 'Cmd ';
    }
    return mods + parts.key;
  }

  /**
   * Create a normalized keystroke for a `'keydown'` event.
   *
   * @param event - The event object for a `'keydown'` event.
   *
   * @returns A normalized keystroke, or an empty string if the event
   *   does not represent a valid keystroke for the given layout.
   */
  export
  function keystrokeForKeydownEvent(event: KeyboardEvent): string {
    let key = getKeyboardLayout().keyForKeydownEvent(event);
    if (!key) {
      return '';
    }
    let mods = '';
    if (event.ctrlKey) {
      mods += 'Ctrl ';
    }
    if (event.altKey) {
      mods += 'Alt ';
    }
    if (event.shiftKey) {
      mods += 'Shift ';
    }
    if (event.metaKey && Platform.IS_MAC) {
      mods += 'Cmd ';
    }
    return mods + key;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The timeout in ms for triggering a key binding chord.
   */
  export
  const CHORD_TIMEOUT = 1000;

  /**
   * A convenience type alias for a command func.
   */
  export
  type CommandFunc<T> = CommandRegistry.CommandFunc<T>;

  /**
   * A convenience type alias for a command dataset.
   */
  export
  type Dataset = CommandRegistry.Dataset;

  /**
   * A normalized command object.
   */
  export
  interface ICommand {
    readonly execute: CommandFunc<any>;
    readonly label: CommandFunc<string>;
    readonly mnemonic: CommandFunc<number>;
    readonly icon: CommandFunc<string>;
    readonly caption: CommandFunc<string>;
    readonly usage: CommandFunc<string>;
    readonly className: CommandFunc<string>;
    readonly dataset: CommandFunc<Dataset>;
    readonly isEnabled: CommandFunc<boolean>;
    readonly isToggled: CommandFunc<boolean>;
    readonly isVisible: CommandFunc<boolean>;
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
      dataset: asFunc(options.dataset, emptyDatasetFunc),
      isEnabled: options.isEnabled || trueFunc,
      isToggled: options.isToggled || falseFunc,
      isVisible: options.isVisible || trueFunc
    };
  }

  /**
   * Create a key binding object from key binding options.
   */
  export
  function createKeyBinding(options: CommandRegistry.IKeyBindingOptions): CommandRegistry.IKeyBinding {
    return {
      keys: normalizeKeys(options),
      selector: validateSelector(options),
      command: options.command,
      args: options.args || JSONExt.emptyObject
    };
  }

  /**
   * An object which holds the results of a key binding match.
   */
  export
  interface IMatchResult {
    /**
     * The best key binding which exactly matches the key sequence.
     */
    exact: CommandRegistry.IKeyBinding | null;

    /**
     * Whether there are bindings which partially match the sequence.
     */
    partial: boolean;
  }

  /**
   * Find the key bindings which match a key sequence.
   *
   * This returns a match result which contains the best exact matching
   * binding, and a flag which indicates if there are partial matches.
   */
  export
  function matchKeyBinding(bindings: ReadonlyArray<CommandRegistry.IKeyBinding>, keys: ReadonlyArray<string>, event: KeyboardEvent): IMatchResult {
    // The current best exact match.
    let exact: CommandRegistry.IKeyBinding | null = null;

    // Whether a partial match has been found.
    let partial = false;

    // The match distance for the exact match.
    let distance = Infinity;

    // The specificity for the exact match.
    let specificity = 0;

    // Iterate over the bindings and search for the best match.
    for (let i = 0, n = bindings.length; i < n; ++i) {
      // Lookup the current binding.
      let binding = bindings[i];

      // Check whether the key binding sequence is a match.
      let sqm = matchSequence(binding.keys, keys);

      // If there is no match, the binding is ignored.
      if (sqm === SequenceMatch.None) {
        continue;
      }

      // If it is a partial match and no other partial match has been
      // found, ensure the selector matches and set the partial flag.
      if (sqm === SequenceMatch.Partial) {
        if (!partial && targetDistance(binding.selector, event) !== -1) {
          partial = true;
        }
        continue;
      }

      // Ignore the match if the selector doesn't match, or if the
      // matched node is farther away than the current best match.
      let td = targetDistance(binding.selector, event);
      if (td === -1 || td > distance) {
        continue;
      }

      // Get the specificity for the selector.
      let sp = Selector.calculateSpecificity(binding.selector);

      // Update the best match if this match is stronger.
      if (!exact || td < distance || sp >= specificity) {
        exact = binding;
        distance = td;
        specificity = sp;
      }
    }

    // Return the match result.
    return { exact, partial };
  }

  /**
   * Replay a keyboard event.
   *
   * This synthetically dispatches a clone of the keyboard event.
   */
  export
  function replayKeyEvent(event: KeyboardEvent): void {
    event.target.dispatchEvent(cloneKeyboardEvent(event));
  }

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
   * A singleton empty dataset function.
   */
  const emptyDatasetFunc = () => ({});

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

  /**
   * Get the platform-specific normalized keys for an options object.
   */
  function normalizeKeys(options: CommandRegistry.IKeyBindingOptions): string[] {
    let keys: string[];
    if (Platform.IS_WIN) {
      keys = options.winKeys || options.keys;
    } else if (Platform.IS_MAC) {
      keys = options.macKeys || options.keys;
    } else {
      keys = options.linuxKeys || options.keys;
    }
    return keys.map(CommandRegistry.normalizeKeystroke);
  }

  /**
   * Validate the selector for an options object.
   *
   * This returns the validated selector, or throws if the selector is
   * invalid or contains commas.
   */
  function validateSelector(options: CommandRegistry.IKeyBindingOptions): string {
    if (options.selector.indexOf(',') !== -1) {
      throw new Error(`Selector cannot contain commas: ${options.selector}`);
    }
    if (!Selector.isValid(options.selector)) {
      throw new Error(`Invalid selector: ${options.selector}`);
    }
    return options.selector;
  }

  /**
   * An enum which describes the possible sequence matches.
   */
  const enum SequenceMatch { None, Exact, Partial };

  /**
   * Test whether a key binding sequence matches a key sequence.
   *
   * Returns a `SequenceMatch` value indicating the type of match.
   */
  function matchSequence(bindKeys: ReadonlyArray<string>, userKeys: ReadonlyArray<string>): SequenceMatch {
    if (bindKeys.length < userKeys.length) {
      return SequenceMatch.None;
    }
    for (let i = 0, n = userKeys.length; i < n; ++i) {
      if (bindKeys[i] !== userKeys[i]) {
        return SequenceMatch.None;
      }
    }
    if (bindKeys.length > userKeys.length) {
      return SequenceMatch.Partial;
    }
    return SequenceMatch.Exact;
  }

  /**
   * Find the distance from the target node to the first matching node.
   *
   * This traverses the event path from `target` to `currentTarget` and
   * computes the distance from `target` to the first node which matches
   * the CSS selector. If no match is found, `-1` is returned.
   */
  function targetDistance(selector: string, event: KeyboardEvent): number {
    let targ = event.target as (Element | null);
    let curr = event.currentTarget as (Element | null);
    for (let dist = 0; targ !== null; targ = targ.parentElement, ++dist) {
      if (Selector.matches(targ, selector)) {
        return dist;
      }
      if (targ === curr) {
        return -1;
      }
    }
    return -1;
  }

  /**
   * Clone a keyboard event.
   */
  function cloneKeyboardEvent(event: KeyboardEvent): KeyboardEvent {
    // A custom event is required because Chrome nulls out the
    // `keyCode` field in user-generated `KeyboardEvent` types.
    let clone = document.createEvent('Event') as any;
    let bubbles = event.bubbles || true;
    let cancelable = event.cancelable || true;
    clone.initEvent(event.type || 'keydown', bubbles, cancelable);
    clone.key = event.key || '';
    clone.keyCode = event.keyCode || 0;
    clone.which = event.keyCode || 0;
    clone.ctrlKey = event.ctrlKey || false;
    clone.altKey = event.altKey || false;
    clone.shiftKey = event.shiftKey || false;
    clone.metaKey = event.metaKey || false;
    clone.view = event.view || window;
    return clone as KeyboardEvent;
  }
}
