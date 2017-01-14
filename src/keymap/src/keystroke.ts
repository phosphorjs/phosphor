/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IS_MAC
} from '@phosphor/platform';

import {
  IKeyboardLayout
} from './keyboard';


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
