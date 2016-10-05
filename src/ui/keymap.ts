/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  JSONObject, deepEqual
} from '../algorithm/json';

import {
  findLastIndex
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

import {
  Vector
} from '../collections/vector';

import {
  DisposableDelegate, IDisposable
} from '../core/disposable';

import {
  ISignal, defineSignal
} from '../core/signaling';

import {
  IS_MAC, IS_WIN
} from '../dom/platform';

import {
  calculateSpecificity, matchesSelector, validateSelector
} from '../dom/selector';

import {
  CommandRegistry
} from './commandregistry';

import {
  EN_US, IKeyboardLayout
} from './keyboard';


/**
 * The timeout in ms for triggering a chord.
 */
const CHORD_TIMEOUT = 1000;


/**
 * A class which manages a collection of key bindings.
 */
export
class Keymap {
  /**
   * Construct a new keymap.
   *
   * @param options - The options for initializing the keymap.
   */
  constructor(options: Keymap.IOptions) {
    this._commands = options.commands;
    this._layout = options.layout || EN_US;
  }

  /**
   * A signal emitted when a key binding is changed.
   */
  bindingChanged: ISignal<Keymap, Keymap.IBindingChangedArgs>;

  /**
   * A signal emitted when the keyboard layout has changed.
   */
  layoutChanged: ISignal<Keymap, Keymap.ILayoutChangedArgs>;

  /**
   * The command registry used by the keymap.
   *
   * #### Notes
   * This is a read-only property.
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * Get the keyboard layout used by the keymap.
   *
   * #### Notes
   * The default is a US English layout.
   */
  get layout(): IKeyboardLayout | null {
    return this._layout;
  }

  /**
   * Set the keyboard layout used by the keymap.
   *
   * #### Notes
   * A keymap requires a keyboard layout, so setting this value to
   * `null` will revert the layout to the default US English layout.
   */
  set layout(value: IKeyboardLayout | null) {
    let oldValue = this._layout;
    let newValue = value || EN_US;
    if (oldValue === newValue) {
      return;
    }
    this._layout = newValue;
    this.layoutChanged.emit({ oldValue, newValue });
  }

  /**
   * A read-only sequence of the key bindings in the keymap.
   *
   * #### Notes
   * This is a read-only property.
   */
  get bindings(): ISequence<Keymap.IBinding> {
    return this._bindings;
  }

  /**
   * Find a key binding which matches the given command and args.
   *
   * @param command - The id of the command of interest.
   *
   * @param args - The arguments for the command.
   *
   * @returns The most recently added key binding which matches the
   *   specified command and args, or `null` if no match is found.
   *
   * #### Notes
   * This is a convenience method which searches through the public
   * sequence of key `bindings`. If custom search behavior is needed,
   * user code may search that sequence manually.
   */
  findBinding(command: string, args: JSONObject | null): Keymap.IBinding | null {
    let i = findLastIndex(this._bindings, kb => {
      return kb.command === command && deepEqual(kb.args, args);
    });
    return i !== -1 ? this._bindings.at(i) : null;
  }

  /**
   * Add a key binding to the keymap.
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
  addBinding(options: Keymap.IBindingOptions): IDisposable {
    // Create the binding for the given options.
    let binding = Private.createBinding(options);

    // Add the key binding to the internal vector.
    this._bindings.pushBack(binding);

    // Emit the `bindingChanged` signal.
    this.bindingChanged.emit({ binding, type: 'added' });

    // Return a disposable which will remove the binding.
    return new DisposableDelegate(() => {
      // Remove the binding from the vector.
      this._bindings.remove(binding);

      // Emit the `bindingChanged` signal.
      this.bindingChanged.emit({ binding, type: 'removed' });
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
   * The keymap **does not** install its own key event listeners. This
   * allows the application full control over the nodes for which the
   * keymap processes `'keydown'` events.
   */
  processKeydownEvent(event: KeyboardEvent): void {
    // Bail immediately if playing back keystrokes.
    if (this._replaying) {
      return;
    }

    // Get the normalized keystroke for the event.
    let keystroke = Keymap.keystrokeForKeydownEvent(event, this._layout);

    // If the keystroke is not valid for the keyboard layout, replay
    // any suppressed events and clear the pending state.
    if (!keystroke) {
      this._replayEvents();
      this._clearPendingState();
      return;
    }

    // Add the keystroke to the current key sequence.
    this._keys.push(keystroke);

    // Find the exact and partial matches for the key sequence.
    let { exact, partial } = Private.match(this._bindings, this._keys, event);

    // If there is no exact match and no partial match, replay
    // any suppressed events and clear the pending state.
    if (!exact && !partial) {
      this._replayEvents();
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
    if (!partial) {
      this._execute(exact!);
      this._clearPendingState();
      return;
    }

    // If there is both an exact match and a partial match, the exact
    // match is stored for future dispatch in case the timer expires
    // before a more specific match is triggered.
    if (exact) this._exact = exact;

    // Store the event for possible playback in the future.
    this._events.push(event);

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
    }, CHORD_TIMEOUT);
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
   * Clear the internal pending state.
   */
  private _clearPendingState(): void {
    this._clearTimer();
    this._exact = null;
    this._keys.length = 0;
    this._events.length = 0;
  }

  /**
   * Replay the events which were suppressed.
   */
  private _replayEvents(): void {
    if (this._events.length === 0) {
      return;
    }
    this._replaying = true;
    this._events.forEach(Private.replayEvent);
    this._replaying = false;
  }

  /**
   * Execute the command for the given key binding.
   *
   * If the command is disabled, a message will be logged.
   */
  private _execute(binding: Keymap.IBinding): void {
    let { command, args } = binding;
    if (this._commands.isEnabled(command, args)) {
      this._commands.execute(command, args);
    } else {
      // TODO - right way to handle disabled command?
      let formatted = binding.keys.map(Keymap.formatKeystroke).join(' ');
      console.log(`Command '${command}' is disabled (${formatted}).`);
    }
  }

  /**
   * Handle the partial match timeout.
   */
  private _onPendingTimeout(): void {
    this._timerID = 0;
    if (this._exact) {
      this._execute(this._exact);
    } else {
      this._replayEvents();
    }
    this._clearPendingState();
  }

  private _timerID = 0;
  private _replaying = false;
  private _keys: string[] = [];
  private _layout: IKeyboardLayout;
  private _commands: CommandRegistry;
  private _events: KeyboardEvent[] = [];
  private _exact: Keymap.IBinding | null = null;
  private _bindings = new Vector<Keymap.IBinding>();
}


// Define the signals for the `Keymap` class.
defineSignal(Keymap.prototype, 'bindingChanged');
defineSignal(Keymap.prototype, 'layoutChanged');


/**
 * The namespace for the `Keymap` class statics.
 */
export
namespace Keymap {
  /**
   * An options object for initializing a keymap.
   */
  export
  interface IOptions {
    /**
     * The command registry to use with the keymap.
     */
    commands: CommandRegistry;

    /**
     * The keyboard layout to use with the keymap.
     *
     * The default is a US English keyboard layout.
     */
    layout?: IKeyboardLayout;
  }

  /**
   * An options object for creating a key binding.
   */
  export
  interface IBindingOptions {
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
     * The CSS selector for the binding.
     *
     * The binding will only be invoked when the selector matches a
     * node on the propagation path of the keydown event. This allows
     * the binding to be restricted to user-defined contexts.
     */
    selector: string;

    /**
     * The command to execute when the binding is matched.
     */
    command: string;

    /**
     * The arguments for the command, if necessary.
     */
    args?: JSONObject | null;

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
   * A binding is an immutable object created by a keymap.
   */
  export
  interface IBinding {
    /**
     * The key sequence for the binding.
     */
    keys: string[];

    /**
     * The CSS selector for the binding.
     */
    selector: string;

    /**
     * The command executed when the binding is matched.
     */
    command: string;

    /**
     * The arguments for the command.
     */
    args: JSONObject | null;
  }

  /**
   * An arguments object for the `bindingChanged` signal.
   */
  export
  interface IBindingChangedArgs {
    /**
     * The keybinding which was changed.
     */
    binding: IBinding;

    /**
     * Whether the binding was added or removed.
     */
    type: 'added' | 'removed';
  }

  /**
   * An arguments object for the `layoutChanged` signal.
   */
  export
  interface ILayoutChangedArgs {
    /**
     * The old value for the keyboard layout.
     */
    oldValue: IKeyboardLayout;

    /**
     * The new value for the keyboard layout.
     */
    newValue: IKeyboardLayout;
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
        if (IS_MAC) {
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
    if (parts.cmd && IS_MAC) {
      mods += 'Cmd ';
    }
    return mods + parts.key;
  }

  /**
   * Format a keystroke for display on the local system.
   *
   * @param keystroke - The keystroke of interest.
   *
   * @returns The keystroke formatted for display on the local system.
   *
   * #### Notes
   * On Mac, this replaces the modifiers with the Mac-specific unicode
   * characters. On other systems, this joins the modifiers with `+`.
   */
  export
  function formatKeystroke(keystroke: string): string {
    let mods = '';
    let parts = parseKeystroke(keystroke);
    if (IS_MAC) {
      if (parts.ctrl) {
        mods += '\u2303';
      }
      if (parts.alt) {
        mods += '\u2325';
      }
      if (parts.shift) {
        mods += '\u21E7';
      }
      if (parts.cmd) {
        mods += '\u2318';
      }
    } else {
      if (parts.ctrl) {
        mods += 'Ctrl+';
      }
      if (parts.alt) {
        mods += 'Alt+';
      }
      if (parts.shift) {
        mods += 'Shift+';
      }
    }
    return mods + parts.key;
  }

  /**
   * Create a normalized keystroke for a `'keydown'` event.
   *
   * @param event - The event object for a `'keydown'` event.
   *
   * @param layout - The keyboard layout for looking up the primary key.
   *
   * @returns A normalized keystroke, or an empty string if the event
   *   does not represent a valid keystroke for the given layout.
   */
  export
  function keystrokeForKeydownEvent(event: KeyboardEvent, layout: IKeyboardLayout): string {
    let key = layout.keyForKeydownEvent(event);
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
    if (event.metaKey && IS_MAC) {
      mods += 'Cmd ';
    }
    return mods + key;
  }
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Create a binding object from binding options.
   */
  export
  function createBinding(options: Keymap.IBindingOptions): Keymap.IBinding {
    return new KeyBinding(options);
  }

  /**
   * An object which holds the results of a binding match.
   */
  export
  interface IMatchResult {
    /**
     * The best binding which exactly matches the key sequence.
     */
    exact: Keymap.IBinding | null;

    /**
     * Whether there are bindings which partially match the sequence.
     */
    partial: boolean;
  }

  /**
   * Find the bindings which match a key sequence.
   *
   * This returns a match result which contains the best exact matching
   * binding, and a flag which indicates if there are partial matches.
   */
  export
  function match(bindings: ISequence<Keymap.IBinding>, keys: string[], event: KeyboardEvent): IMatchResult {
    // Whether a partial match has been found.
    let partial = false;

    // The current best exact match.
    let exact: Keymap.IBinding | null = null;

    // The match distance for the exact match.
    let distance = Infinity;

    // The specificity for the exact match.
    let specificity = 0;

    // Iterate over the bindings and search for the best match.
    for (let i = 0, n = bindings.length; i < n; ++i) {
      // Lookup the current binding.
      let binding = bindings.at(i);

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
      let sp = calculateSpecificity(binding.selector);

      // Update the best match if this match is stronger.
      if (exact === null || td < distance || sp >= specificity) {
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
  function replayEvent(event: KeyboardEvent): void {
    event.target.dispatchEvent(cloneKeyboardEvent(event));
  }

  /**
   * A concrete implementation of `Keymap.IBinding`.
   */
  class KeyBinding implements Keymap.IBinding {
    /**
     * Construct a new binding.
     */
    constructor(options: Keymap.IBindingOptions) {
      this._keys = normalizeKeys(options);
      this._selector = normalizeSelector(options);
      this._command = options.command;
      this._args = options.args || null;
    }

    /**
     * The key sequence for the key binding.
     */
    get keys(): string[] {
      return this._keys;
    }

    /**
     * The CSS selector for the key binding.
     */
    get selector(): string {
      return this._selector;
    }

    /**
     * The command to execute when the key binding is matched.
     */
    get command(): string {
      return this._command;
    }

    /**
     * The arguments for the command.
     */
    get args(): JSONObject | null {
      return this._args;
    }

    private _keys: string[];
    private _selector: string;
    private _command: string;
    private _args: JSONObject | null;
  }

  /**
   * Get the platform-specific normalized keys for an options object.
   *
   * The normalized keys are frozen to prevent further modification.
   */
  function normalizeKeys(options: Keymap.IBindingOptions): string[] {
    let keys: string[];
    if (IS_WIN) {
      keys = options.winKeys || options.keys;
    } else if (IS_MAC) {
      keys = options.macKeys || options.keys;
    } else {
      keys = options.linuxKeys || options.keys;
    }
    return Object.freeze(keys.map(Keymap.normalizeKeystroke));
  }

  /**
   * Normalize the selector for an options object.
   *
   * This returns the validated first clause of the selector.
   */
  function normalizeSelector(options: Keymap.IBindingOptions): string {
    return validateSelector(options.selector.split(',', 1)[0]);
  }

  /**
   * An enum which describes the possible sequence matches.
   */
  const enum SequenceMatch { None, Exact, Partial };

  /**
   * Test whether a binding sequence matches a key sequence.
   *
   * Returns a `SequenceMatch` value indicating the type of match.
   */
  function matchSequence(bindKeys: string[], userKeys: string[]): SequenceMatch {
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
    let distance = 0;
    let target = event.target as Element;
    let current = event.currentTarget as Element;
    for (; target !== null; target = target.parentElement, ++distance) {
      if (matchesSelector(target, selector)) {
        return distance;
      }
      if (target === current) {
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
    return clone;
  }
}
