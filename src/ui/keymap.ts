/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each
} from '../algorithm/iteration';

import {
  JSONValue
} from '../algorithm/json';

import {
  indexOf
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
  calculateSpecificity, matchesSelector, validateSelector
} from '../dom/selector';

import {
  commands
} from './commands';

import {
  EN_US, IKeyboardLayout
} from './keyboard';


/**
 * The timeout in ms for triggering a chord.
 */
const CHORD_TIMEOUT = 1000;


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
 *   `[<modifier 1>-[<modifier 2>-[<modifier N>-]]]<primary key>`
 *
 * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
 * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
 * `Ctrl` on all other platforms.
 *
 * The parsing is tolerant and will not throw exceptions. Notably:
 *   - Duplicate modifiers are ignored.
 *   - Extra primary keys are ignored.
 *   - The order of modifiers and primary key is irrelevant.
 *   - The keystroke should not contain whitespace.
 */
export
function parseKeystroke(keystroke: string): IKeystrokeParts {
  let key = '';
  let alt = false;
  let cmd = false;
  let ctrl = false;
  let shift = false;
  for (let token of keystroke.split('-')) {
    if (token === 'Accel') {
      if (Private.IS_MAC) {
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
    } else {
      key = token || '-';
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
  if (parts.cmd && Private.IS_MAC) {
    mods += 'Cmd-';
  }
  if (parts.ctrl) {
    mods += 'Ctrl-';
  }
  if (parts.alt) {
    mods += 'Alt-';
  }
  if (parts.shift) {
    mods += 'Shift-';
  }
  return mods + parts.key;
}


/**
 * Normalize a key sequence into a canonical representation.
 *
 * @param keys - The whitespace-separated sequence of keystrokes.
 *
 * @returns The normalized representation of the key sequence.
 *
 * #### Notes
 * This normalizes the key sequence by normalizing each keystroke
 * and reassembling them with a single space character.
 *
 * The normalized key sequence is used by the keymap for matching.
 */
export
function normalizeKeys(keys: string): string {
  let keystrokes = keys.split(/\s+/).filter(s => !!s);
  return keystrokes.map(normalizeKeystroke).join(' ');
}


/**
 * Create a normalized keystroke for a `'keydown'` event.
 *
 * @param event - The event object for a `'keydown'` event.
 *
 * @param layout - The keyboard layout for looking up the key.
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
  if (event.metaKey && Private.IS_MAC) {
    mods += 'Cmd-';
  }
  if (event.ctrlKey) {
    mods += 'Ctrl-';
  }
  if (event.altKey) {
    mods += 'Alt-';
  }
  if (event.shiftKey) {
    mods += 'Shift-';
  }
  return mods + key;
}


/**
 * An object which represents a key binding.
 *
 * #### Notes
 * Once created, a key binding is immutable.
 */
export
class KeyBinding {
  /**
   * Construct a new key binding.
   *
   * @options - The options for initializing the key binding.
   *
   * @throws An error if the key binding selector is invalid.
   *
   * #### Notes
   * The key sequence will be normalized for the platform.
   *
   * If the selector has a comma, only the first clause is used.
   */
  constructor(options: KeyBinding.IOptions) {
    this._keys = normalizeKeys(Private.platformKeys(options));
    this._selector = validateSelector(options.selector.split(',', 1)[0]);
    this._command = options.command;
    this._args = options.args || null;
  }

  /**
   * The key sequence for the key binding.
   *
   * A key sequence is composed of one or more keystrokes, where each
   * keystroke is a combination of modifiers and a primary key.
   *
   * Most key sequences will contain a single keystroke. Sequences with
   * multiple keystrokes separated by whitespace are called "chords",
   * and are useful for implementing modal input (ala Vim).
   *
   * Each keystroke in the sequence should be of the form:
   *   `[<modifier 1>-[<modifier 2>-[<modifier N>-]]]<primary key>`
   *
   * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
   * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
   * `Ctrl` on all other platforms. The `Cmd` modifier is ignored on
   * non-Mac platforms.
   *
   * The key sequence is case-sensitive.
   *
   * **Examples:** `Accel-C`, `Shift-F11`, `D D`, `Cmd-K Cmd-P`
   */
  get keys(): string {
    return this._keys;
  }

  /**
   * The CSS selector for the key binding.
   *
   * The key binding will only be invoked when the selector matches a
   * node on the propagation path of the keyboard event. This allows
   * the key binding to be restricted to user-defined contexts.
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
  get args(): JSONValue {
    return this._args;
  }

  private _keys: string;
  private _selector: string;
  private _command: string;
  private _args: JSONValue;
}


/**
 * The namespace for the `KeyBinding` class statics.
 */
export
namespace KeyBinding {
  /**
   * An options object for initializing a key binding.
   */
  export
  interface IOptions {
    /**
     * The key sequence for the key binding.
     */
    keys: string;

    /**
     * The CSS selector for the key binding.
     */
    selector: string;

    /**
     * The command to execute when the key binding is matched.
     */
    command: string;

    /**
     * The arguments for the command, if necessary.
     */
    args?: JSONValue;

    /**
     * The key sequence to use when running on Windows.
     *
     * If provided, this will override `keys` on Windows platforms.
     */
    winKeys?: string;

    /**
     * The key sequence to use when running on Mac.
     *
     * If provided, this will override `keys` on Mac platforms.
     */
    macKeys?: string;

    /**
     * The key sequence to use when running on Linux.
     *
     * If provided, this will override `keys` on Linux platforms.
     */
    linuxKeys?: string;
  }
}


/**
 * A class which manages a collection of key bindings.
 *
 * #### Notes
 * A singleton instance of this class is all that is necessary for an
 * application, and one is exported from this module as `keymap`.
 */
export
class KeymapManager {
  /**
   * Construct a new keymap manager.
   */
  constructor() { }

  /**
   * A signal emitted when a key binding is added.
   *
   * #### Notes
   * The signal argument is the added key binding.
   */
  bindingAdded: ISignal<KeymapManager, KeyBinding>;

  /**
   * A signal emitted when a key binding is removed.
   *
   * #### Notes
   * The signal argument is the removed key binding.
   */
  bindingRemoved: ISignal<KeymapManager, KeyBinding>;

  /**
   * A signal emitted when the keyboard layout is changed.
   *
   * #### Notes
   * The signal argument is the new keyboard layout.
   */
  layoutChanged: ISignal<KeymapManager, IKeyboardLayout>;

  /**
   * A read-only sequence of the key bindings in the keymap.
   *
   * #### Notes
   * This is a read-only property.
   */
  get bindings(): ISequence<KeyBinding> {
    return this._bindings;
  }

  /**
   * Get the keyboard layout used by the keymap.
   *
   * #### Notes
   * The default is a US English layout.
   */
  get layout(): IKeyboardLayout {
    return this._layout;
  }

  /**
   * Set the keyboard layout used by the keymap.
   *
   * #### Notes
   * A keymap requires a keyboard layout, so setting this value to
   * `null` will revert the layout to the default US English layout.
   */
  set layout(value: IKeyboardLayout) {
    value = value || EN_US;
    if (this._layout === value) {
      return;
    }
    this._layout = value;
    this.layoutChanged.emit(value);
  }

  /**
   * Add a key binding to the keymap.
   *
   * @param binding - The key binding to add to the keymap, or an
   *   options object to be converted into a key binding.
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
   * `Ctrl-D`, and another with the key sequence `Ctrl-D Ctrl-W`. When
   * the user presses `Ctrl-D`, the first binding cannot be immediately
   * executed, since the user may intend to complete the chord from the
   * second binding by pressing `Ctrl-W`. For such cases, a timeout is
   * used to allow the user to complete the chord. If the chord is not
   * completed before the timeout, the first binding is executed.
   */
  addBinding(binding: KeyBinding | KeyBinding.IOptions): IDisposable {
    // Coerce the binding to an actual `KeyBinding` instance.
    let kb = Private.asKeyBinding(binding);

    // Add the key binding to the internal vector.
    this._bindings.pushBack(kb);

    // Emit the binding added signal.
    this.bindingAdded.emit(kb);

    // Return a disposable which will remove the binding.
    return new DisposableDelegate(() => {
      // Remove the binding from the vector.
      let i = indexOf(this._bindings, kb);
      if (i !== -1) this._bindings.remove(i);

      // Emit the binding removed signal.
      this.bindingRemoved.emit(kb);
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
    let keystroke = keystrokeForKeydownEvent(event, this._layout);

    // If the keystroke is not valid for the keyboard layout, replay
    // any suppressed events and clear the pending state.
    if (!keystroke) {
      this._replayEvents();
      this._clearPendingState();
      return;
    }

    // Add the keystroke to the current key sequence.
    if (this._keys) {
      this._keys += ` ${keystroke}`;
    } else {
      this._keys = keystroke;
    }

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
      Private.execute(exact);
      this._clearPendingState();
      return;
    }

    // If there is both an exact match and a partial match, the exact
    // match is stored for future dispatch in case the timer expires
    // before a more specific match is triggered.
    if (exact) this._exact = exact;

    // Store the event for possible playback in the future.
    this._events.pushBack(event);

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
    this._keys = '';
    this._exact = null;
    this._events.clear();
  }

  /**
   * Replay the events which were suppressed.
   */
  private _replayEvents(): void {
    if (this._events.isEmpty) {
      return;
    }
    this._replaying = true;
    each(this._events, Private.replayEvent);
    this._replaying = false;
  }

  /**
   * Handle the partial match timeout.
   */
  private _onPendingTimeout(): void {
    this._timerID = 0;
    if (this._exact) {
      Private.execute(this._exact);
    } else {
      this._replayEvents();
    }
    this._clearPendingState();
  }

  private _keys = '';
  private _timerID = 0;
  private _layout = EN_US;
  private _replaying = false;
  private _exact: KeyBinding = null;
  private _bindings = new Vector<KeyBinding>();
  private _events = new Vector<KeyboardEvent>();
}


// Define the signals for the `KeymapManager` class.
defineSignal(KeymapManager.prototype, 'bindingAdded');
defineSignal(KeymapManager.prototype, 'bindingRemoved');
defineSignal(KeymapManager.prototype, 'layoutChanged');


/**
 * A singleton instance of a `KeymapManager`.
 *
 * #### Notes
 * This singleton instance is all that is necessary for an application.
 * User code will not typically create a new keymap instance.
 */
export
const keymap = new KeymapManager();


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * A flag indicating whether the platform is Mac.
   */
  export
  const IS_MAC = !!navigator.platform.match(/Mac/i);

  /**
   * A flag indicating whether the platform is Windows.
   */
  export
  const IS_WIN = !!navigator.platform.match(/Win/i);

  /**
   * Get the platform-specific key sequence for an options object.
   */
  export
  function platformKeys(options: KeyBinding.IOptions): string {
    if (IS_WIN) {
      return options.winKeys || options.keys;
    }
    if (IS_MAC) {
      return options.macKeys || options.keys;
    }
    return options.linuxKeys || options.keys;
  }

  /**
   * A coerce a key binding or options into a real key binding.
   */
  export
  function asKeyBinding(value: KeyBinding | KeyBinding.IOptions): KeyBinding {
    return value instanceof KeyBinding ? value : new KeyBinding(value);
  }

  /**
   * An object which holds the results of a binding match.
   */
  export
  interface IMatchResult {
    /**
     * The best binding which exactly matches the key sequence.
     */
    exact: KeyBinding;

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
  function match(bindings: ISequence<KeyBinding>, keys: string, event: KeyboardEvent): IMatchResult {
    // Whether a partial match has been found.
    let partial = false;

    // The current best exact match.
    let exact: KeyBinding = null;

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
   * Execute the command for the given key binding.
   *
   * If the command is disabled, a message will be logged.
   */
  export
  function execute(binding: KeyBinding): void {
    let { command, args } = binding;
    if (commands.isEnabled(command, args)) {
      commands.execute(command, args);
    } else {
      console.log(`'Command '${command}' is disabled (${binding.keys})`);
    }
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
   * An enum which describes the possible sequence matches.
   */
  const enum SequenceMatch { None, Exact, Partial };

  /**
   * Test whether a binding sequence matches a key sequence.
   *
   * Returns a `SequenceMatch` value indicating the type of match.
   */
  function matchSequence(bindKeys: string, userKeys: string): SequenceMatch {
    if (bindKeys.length < userKeys.length) {
      return SequenceMatch.None;
    }
    if (bindKeys === userKeys) {
      return SequenceMatch.Exact;
    }
    if (bindKeys.slice(0, userKeys.length) === userKeys) {
      return SequenceMatch.Partial;
    }
    return SequenceMatch.None;
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
    let clone = document.createEvent('Event') as KeyboardEvent;
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
