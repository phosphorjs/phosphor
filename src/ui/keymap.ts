/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DisposableDelegate, IDisposable
} from '../core/disposable';

import {
  ISignal, defineSignal
} from '../core/signaling';

import {
  calculateSpecificity, isValidSelector
} from '../dom/selector';

import {
  CommandRegistry
} from './command';

import {
  EN_US, IKeyboardLayout
} from './keyboard';


/**
 * The timeout in ms for triggering a chord.
 */
const CHORD_TIMEOUT = 1000;


/**
 * An object which defines a key binding for a command.
 */
export
interface IKeyBinding {
  /**
   * The key sequence for the key binding.
   *
   * A key sequence is composed of one or more keystrokes, where each
   * keystroke is a combination of modifiers and a primary key.
   *
   * Most key sequences will contain a single keystroke. Sequences with
   * multiple whitespace separated keystrokes are known as chords, and
   * are useful for implementing modal input (ala Vim).
   *
   * Each keystroke in the sequence should be of the form:
   *   `[<modifier 1>+[<modifier 2>+[<modifier N>+]]]<primary key>`
   *
   * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
   * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
   * `Ctrl` on all other platforms. The `Cmd` modifier is ignored on
   * non-Mac platforms.
   */
  keys: string;

  /**
   * The CSS selector for the key binding.
   *
   * The key binding will only be invoked if the selector matches a
   * node on the propagation path of the keyboard event. This allows
   * the key binding to be restricted to user-defined contexts.
   *
   * The selector must be a valid single selector (no commas).
   */
  selector: string;

  /**
   * The command to execute when the key binding is matched.
   *
   * If the command is disabled, the binding will be ignored.
   */
  command: string;

  /**
   * The arguments for the command.
   */
  args: any;
}


/**
 * A class which manages a collection of key bindings.
 */
export
class Keymap {
  /**
   * Construct a new keymap.
   *
   * @param commands - The command registry to use with the keymap.
   *
   * @param options - The options for initializing the keymap.
   */
  constructor(commands: CommandRegistry, options: Keymap.IOptions = {}) {
    this._commands = commands;
    this._layout = options.layout || EN_US;
  }

  /**
   * A signal emitted when the keyboard layout is changed.
   */
  layoutChanged: ISignal<Keymap, IKeyboardLayout>;

  /**
   * Get the command registry used by the keymap.
   *
   * #### Notes
   * This is a read-only property.
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * Get the keyboard layout used by the keymap.
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
   * Add key bindings to the keymap.
   *
   * @param bindings - The key bindings to add to the keymap.
   *
   * @returns A disposable which removes the added key bindings.
   *
   * #### Notes
   * If a key binding has an invalid selector, a warning will be logged
   * to the console and the key binding will be ignored.
   *
   * If multiple key bindings are registered for the same sequence, the
   * binding with the highest selector specificity is executed first. A
   * tie is broken by using the more recently added key binding.
   *
   * Ambiguous key bindings are resolved with a timeout. For example,
   * suppose two key bindings are registered: one with the key sequence
   * `Ctrl+D`, and another with the key sequence `Ctrl+D Ctrl+W`. When
   * the user presses `Ctrl+D`, the first binding cannot be immediately
   * executed, since the user may intend to complete the chord from the
   * second binding by pressing `Ctrl+W`. For such cases, a timeout is
   * used to allow the user to complete the chord. If the chord is not
   * completed before the timeout, the first binding is executed.
   */
  add(bindings: IKeyBinding[]): IDisposable {
    // Create an array to store the added bindings.
    let added: IKeyBinding[] = [];

    // Validate, clone, and add the bindings to the keymap.
    for (let binding of bindings) {
      // Warn and ignore if the CSS selector is invalid.
      if (!isValidSelector(binding.selector)) {
        console.warn(`Invalid key binding selector: ${binding.selector}`);
        continue;
      }

      // Create a clone of the binding with the normalized sequence.
      let clone: IKeyBinding = Object.freeze({
        keys: Keymap.normalizeSequence(binding.keys),
        selector: binding.selector,
        command: binding.command,
        args: binding.args
      });

      // Add the binding to the internal and tracking arrays.
      this._bindings.push(clone);
      added.push(clone);
    }

    // Return a disposable which will remove the added bindings.
    return new DisposableDelegate(() => {
      Private.removeBindings(this._bindings, added);
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
   * allows user code full control over the nodes for which the keymap
   * processes `'keydown'` events.
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
    if (this._keys) {
      this._keys += ` ${keystroke}`;
    } else {
      this._keys = keystroke;
    }

    // Find the exact and partial matches for the key sequence.
    let { exact, partial } = Private.match(
      this._commands, this._bindings, this._keys, event
    );

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
      this._executeBinding(exact);
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
    this._keys = '';
    this._exact = null;
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
   * Handle the partial match timeout.
   */
  private _onPendingTimeout(): void {
    this._timerID = 0;
    if (this._exact) {
      this._executeBinding(this._exact);
    } else {
      this._replayEvents();
    }
    this._clearPendingState();
  }

  /**
   * Execute the command for given key binding.
   *
   * If the command is disabled, this is a no-op.
   */
  private _executeBinding(binding: IKeyBinding): void {
    let { command, args } = binding;
    if (this._commands.isEnabled(command, args)) {
      this._commands.execute(command, args);
    } else {
      // TODO - notify if the command is disabled?
    }
  }

  private _keys = '';
  private _timerID = 0;
  private _replaying = false;
  private _layout: IKeyboardLayout;
  private _commands: CommandRegistry;
  private _exact: IKeyBinding = null;
  private _events: KeyboardEvent[] = [];
  private _bindings: IKeyBinding[] = [];
}


// Define the signals for the `Keymap` class.
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
     * The keyboard layout to use with the keymap.
     *
     * The default layout is US English.
     */
    layout?: IKeyboardLayout;
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
     * The primary keycap for the keystroke.
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
   *   `[<modifier 1>+[<modifier 2>+[<modifier N>+]]]<primary key>`
   *
   * The supported modifiers are: `Accel`, `Alt`, `Cmd`, `Ctrl`, and
   * `Shift`. The `Accel` modifier is translated to `Cmd` on Mac and
   * `Ctrl` on all other platforms. The `Cmd` modifier is ignored on
   * non-Mac platforms.
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
    for (let token of keystroke.split('+')) {
      if (token === 'Accel') {
        if (Private.IS_MAC) {
          cmd = true;
        } else {
          ctrl = true;
        }
      } else if (token === 'Alt') {
        alt = true;
      } else if (token === 'Cmd' && Private.IS_MAC) {
        cmd = true;
      } else if (token === 'Ctrl') {
        ctrl = true;
      } else if (token === 'Shift') {
        shift = true;
      } else if (token.length === 1) {
        key = token;
      } else if (token.length === 0) {
        key = '+';
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
   */
  export
  function normalizeKeystroke(keystroke: string): string {
    let mods = '';
    let parts = parseKeystroke(keystroke);
    if (parts.cmd && Private.IS_MAC) {
      mods += 'Cmd+';
    }
    if (parts.ctrl) {
      mods += 'Ctrl+';
    }
    if (parts.alt) {
      mods += 'Alt+';
    }
    if (parts.shift) {
      mods += 'Shift+';
    }
    return mods + parts.key;
  }

  /**
   * Normalize a key sequence into a canonical representation.
   *
   * @param keys - The whitespace separate sequence of keystrokes.
   *
   * @returns The normalized representation of the key sequence.
   *
   * #### Notes
   * This normalizes the key sequence by normalizing each keystroke and
   * reassembling them with a single space character.
   *
   * The normalized sequence is used by a keymap for matching.
   */
  export
  function normalizeSequence(keys: string): string {
    let keystrokes = keys.split(/\s+/).filter(s => !!s);
    return keystrokes.map(normalizeKeystroke).join(' ');
  }

  /**
   * Create a normalized keystroke for a `'keydown'` event.
   *
   * @param event - The event object for a `'keydown'` event.
   *
   * @param layout - The keyboard layout for computing the keycap.
   *
   * @returns A normalized keystroke, or an empty string if the event
   *   does not represent a valid keystroke for the given layout.
   */
  export
  function keystrokeForKeydownEvent(event: KeyboardEvent, layout: IKeyboardLayout): string {
    let key = layout.keycapForKeydownEvent(event);
    if (!key) {
      return '';
    }
    let mods = '';
    if (event.metaKey && Private.IS_MAC) {
      mods += 'Cmd+';
    }
    if (event.ctrlKey) {
      mods += 'Ctrl+';
    }
    if (event.altKey) {
      mods += 'Alt+';
    }
    if (event.shiftKey) {
      mods += 'Shift+';
    }
    return mods + key;
  }
}


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
   * An object which holds the results of a binding match.
   */
  export
  interface IMatchResult {
    /**
     * The best binding which exactly matches the key sequence.
     */
    exact: IKeyBinding;

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
  function match(commands: CommandRegistry, bindings: IKeyBinding[], keys: string, event: KeyboardEvent): IMatchResult {
    // Whether a partial match has been found.
    let partial = false;

    // The current best exact match.
    let exact: IKeyBinding = null;

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
   * Remove select key bindings from an array of key bindings.
   *
   * This mutates the bindings array in-place.
   */
  export
  function removeBindings(bindings: IKeyBinding[], targets: IKeyBinding[]): void {
    let count = 0;
    for (let i = 0, n = bindings.length; i < n; ++i) {
      let binding = bindings[i];
      if (targets.indexOf(binding) === -1) {
        bindings[i - count] = binding;
      } else {
        count++;
      }
    }
    bindings.length -= count;
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
   * A cross-browser CSS selector matching prototype function.
   */
  const protoMatchFunc: Function = (() => {
    let proto = Element.prototype as any;
    return (
      proto.matches ||
      proto.matchesSelector ||
      proto.mozMatchesSelector ||
      proto.msMatchesSelector ||
      proto.oMatchesSelector ||
      proto.webkitMatchesSelector ||
      (function(selector: string) {
        let elem = this as Element;
        let matches = elem.ownerDocument.querySelectorAll(selector);
        return Array.prototype.indexOf.call(matches, elem) !== -1;
      })
    );
  })();

  /**
   * Test whether an element matches a CSS selector.
   */
  function matchesSelector(elem: Element, selector: string): boolean {
    return protoMatchFunc.call(elem, selector);
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
