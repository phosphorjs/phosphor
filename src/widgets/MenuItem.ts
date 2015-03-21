/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Signal = core.Signal;


/**
 * An options object for initializing a menu item.
 */
export
interface IMenuItemOptions {
  /**
   * The type of the menu item.
   */
  type?: string;

  /**
   * The text for the menu item.
   */
  text?: string;

  /**
   * The mnemonic for the menu item.
   */
  mnemonic?: string;

  /**
   * The shortcut combo for the menu item.
   */
  shortcut?: string;

  /**
   * Whether the menu item is enabled.
   */
  enabled?: boolean;

  /**
   * Whether a 'check' type menu item is checked.
   */
  checked?: boolean;

  /**
   * The submenu for the menu item.
   */
  submenu?: Menu;

  /**
   * The extra class name to associate with the menu item.
   */
  className?: string;

  /**
   * A callback to invoke when the menu item is toggled.
   */
  onToggled?: (item: MenuItem) => void;

  /**
   * A callback to invoke when the menu item is triggered.
   */
  onTriggered?: (item: MenuItem) => void;
}


/**
 * An object which can be added to a menu or menu bar.
 */
export
class MenuItem {
  /**
   * A signal emitted when the state of the menu item is changed.
   */
  changed = new Signal<MenuItem, void>();

  /**
   * A signal emitted when a `check` type menu item is toggled.
   */
  toggled = new Signal<MenuItem, void>();

  /**
   * A signal emitted when the menu item is triggered.
   */
  triggered = new Signal<MenuItem, void>();

  /**
   * Construct a new menu item.
   */
  constructor(opts?: IMenuItemOptions) {
    if (opts) this._initFrom(opts);
  }

  /**
   * Get the type of the menu item: 'normal' | 'check' | 'separator'.
   */
  get type(): string {
    return this._type;
  }

  /**
   * Set the type of the menu item: 'normal' | 'check' | 'separator'.
   */
  set type(type: string) {
    if (type === this._type) {
      return;
    }
    if (type !== 'normal' && type !== 'check' && type !== 'separator') {
      throw new Error('invalid menu item type: ' + type);
    }
    this._type = type;
    this._checked = false;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the text for the menu item.
   */
  get text(): string {
    return this._text;
  }

  /**
   * Set the text for the menu item.
   */
  set text(text: string) {
    if (text === this._text) {
      return;
    }
    this._text = text;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the mnemonic key for the menu item.
   */
  get mnemonic(): string {
    return this._mnemonic;
  }

  /**
   * Set the mnemonic key for the menu item.
   */
  set mnemonic(mnemonic: string) {
    if (mnemonic === this._mnemonic || mnemonic.length > 1) {
      return;
    }
    this._mnemonic = mnemonic;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the shortcut key for the menu item (decoration only).
   */
  get shortcut(): string {
    return this._shortcut;
  }

  /**
   * Set the shortcut key for the menu item (decoration only).
   */
  set shortcut(shortcut: string) {
    if (shortcut === this._shortcut) {
      return;
    }
    this._shortcut = shortcut;
    this.changed.emit(this, void 0);
  }

  /**
   * Get whether the menu item is enabled.
   */
  get enabled(): boolean {
    return this._enabled;
  }

  /**
   * Set whether the menu item is enabled.
   */
  set enabled(enabled: boolean) {
    if (enabled === this._enabled) {
      return;
    }
    this._enabled = enabled;
    this.changed.emit(this, void 0);
  }

  /**
   * Get whether the 'check' type menu item is checked.
   */
  get checked(): boolean {
    return this._checked;
  }

  /**
   * Set whether the 'check' type menu item is checked.
   */
  set checked(checked: boolean) {
    if (this._type !== 'check' || checked === this._checked) {
      return;
    }
    this._checked = checked;
    this.changed.emit(this, void 0);
    this.toggled.emit(this, void 0);
  }

  /**
   * Get the submenu for the menu item.
   */
  get submenu(): Menu {
    return this._submenu;
  }

  /**
   * Set the submenu for the menu item.
   */
  set submenu(submenu: Menu) {
    if (submenu === this._submenu) {
      return;
    }
    this._submenu = submenu;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the class name for the menu item.
   */
  get className(): string {
    return this._className;
  }

  /**
   * Set the class name for the menu item.
   */
  set className(name: string) {
    if (name === this._className) {
      return;
    }
    this._className = name;
    this.changed.emit(this, void 0);
  }

  /**
   * Trigger the menu item.
   *
   * This will emit the `triggered` signal.
   *
   * If the item is a `check` type, it will also be toggled.
   */
  trigger(): void {
    if (this._type === 'check') {
      this.checked = !this.checked;
    }
    this.triggered.emit(this, void 0);
  }

  /**
   * Initialize the menu item from the given options object.
   */
  private _initFrom(opts: IMenuItemOptions): void {
    if (opts.type !== void 0) {
      this.type = opts.type;
    }
    if (opts.text !== void 0) {
      this._text = opts.text;
    }
    if (opts.mnemonic !== void 0) {
      this.mnemonic = opts.mnemonic;
    }
    if (opts.shortcut !== void 0) {
      this._shortcut = opts.shortcut;
    }
    if (opts.enabled !== void 0) {
      this._enabled = opts.enabled;
    }
    if (opts.checked !== void 0) {
      this.checked = opts.checked;
    }
    if (opts.submenu !== void 0) {
      this._submenu = opts.submenu;
    }
    if (opts.className !== void 0) {
      this._className = opts.className;
    }
    if (opts.onTriggered !== void 0) {
      this.triggered.connect(opts.onTriggered);
    }
    if (opts.onToggled !== void 0) {
      this.toggled.connect(opts.onToggled);
    }
  }

  private _text: string;
  private _mnemonic = '';
  private _shortcut = '';
  private _className = '';
  private _enabled = true;
  private _type = 'normal';
  private _checked = false;
  private _submenu: Menu = null;
}

} // module phosphor.widgets
