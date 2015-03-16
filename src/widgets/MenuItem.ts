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
    return this._m_type;
  }

  /**
   * Set the type of the menu item: 'normal' | 'check' | 'separator'.
   */
  set type(type: string) {
    if (type === this._m_type) {
      return;
    }
    if (type !== 'normal' && type !== 'check' && type !== 'separator') {
      throw new Error('invalid menu item type: ' + type);
    }
    this._m_type = type;
    this._m_checked = false;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the text for the menu item.
   */
  get text(): string {
    return this._m_text;
  }

  /**
   * Set the text for the menu item.
   */
  set text(text: string) {
    if (text === this._m_text) {
      return;
    }
    this._m_text = text;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the mnemonic key for the menu item.
   */
  get mnemonic(): string {
    return this._m_mnemonic;
  }

  /**
   * Set the mnemonic key for the menu item.
   */
  set mnemonic(mnemonic: string) {
    if (mnemonic === this._m_mnemonic || mnemonic.length > 1) {
      return;
    }
    this._m_mnemonic = mnemonic;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the shortcut key for the menu item (decoration only).
   */
  get shortcut(): string {
    return this._m_shortcut;
  }

  /**
   * Set the shortcut key for the menu item (decoration only).
   */
  set shortcut(shortcut: string) {
    if (shortcut === this._m_shortcut) {
      return;
    }
    this._m_shortcut = shortcut;
    this.changed.emit(this, void 0);
  }

  /**
   * Get whether the menu item is enabled.
   */
  get enabled(): boolean {
    return this._m_enabled;
  }

  /**
   * Set whether the menu item is enabled.
   */
  set enabled(enabled: boolean) {
    if (enabled === this._m_enabled) {
      return;
    }
    this._m_enabled = enabled;
    this.changed.emit(this, void 0);
  }

  /**
   * Get whether the 'check' type menu item is checked.
   */
  get checked(): boolean {
    return this._m_checked;
  }

  /**
   * Set whether the 'check' type menu item is checked.
   */
  set checked(checked: boolean) {
    if (this._m_type !== 'check' || checked === this._m_checked) {
      return;
    }
    this._m_checked = checked;
    this.changed.emit(this, void 0);
    this.toggled.emit(this, void 0);
  }

  /**
   * Get the submenu for the menu item.
   */
  get submenu(): Menu {
    return this._m_submenu;
  }

  /**
   * Set the submenu for the menu item.
   */
  set submenu(submenu: Menu) {
    if (submenu === this._m_submenu) {
      return;
    }
    this._m_submenu = submenu;
    this.changed.emit(this, void 0);
  }

  /**
   * Get the class name for the menu item.
   */
  get className(): string {
    return this._m_className;
  }

  /**
   * Set the class name for the menu item.
   */
  set className(name: string) {
    if (name === this._m_className) {
      return;
    }
    this._m_className = name;
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
    if (this._m_type === 'check') {
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
      this._m_text = opts.text;
    }
    if (opts.mnemonic !== void 0) {
      this.mnemonic = opts.mnemonic;
    }
    if (opts.shortcut !== void 0) {
      this._m_shortcut = opts.shortcut;
    }
    if (opts.enabled !== void 0) {
      this._m_enabled = opts.enabled;
    }
    if (opts.checked !== void 0) {
      this.checked = opts.checked;
    }
    if (opts.submenu !== void 0) {
      this._m_submenu = opts.submenu;
    }
    if (opts.className !== void 0) {
      this._m_className = opts.className;
    }
    if (opts.onTriggered !== void 0) {
      this.triggered.connect(opts.onTriggered);
    }
    if (opts.onToggled !== void 0) {
      this.toggled.connect(opts.onToggled);
    }
  }

  private _m_text: string;
  private _m_mnemonic = '';
  private _m_shortcut = '';
  private _m_className = '';
  private _m_enabled = true;
  private _m_type = 'normal';
  private _m_checked = false;
  private _m_submenu: Menu = null;
}

} // module phosphor.widgets
