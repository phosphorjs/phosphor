/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Signal = core.Signal;
import emit = core.emit;


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
   * Whether the menu item is visible.
   */
  visible?: boolean;

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
}


/**
 * An item which can be added to a menu or menu bar.
 */
export
class MenuItem {
  /**
   * A signal emitted when the state of the menu item is changed.
   */
  static changed = new Signal<MenuItem, void>();

  /**
   * A signal emitted when a `check` type menu item is toggled.
   */
  static toggled = new Signal<MenuItem, void>();

  /**
   * A signal emitted when the menu item is triggered.
   */
  static triggered = new Signal<MenuItem, void>();

  /**
   * Construct a new menu item.
   */
  constructor(options?: IMenuItemOptions) {
    if (options) this._initFrom(options);
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
    emit(this, MenuItem.changed, void 0);
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
    emit(this, MenuItem.changed, void 0);
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
    emit(this, MenuItem.changed, void 0);
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
    emit(this, MenuItem.changed, void 0);
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
    emit(this, MenuItem.changed, void 0);
  }

  /**
   * Get whether the menu item is visible.
   */
  get visible(): boolean {
    return this._visible;
  }

  /**
   * Set whether the menu item is visible.
   */
  set visible(visible: boolean) {
    if (visible === this._visible) {
      return;
    }
    this._visible = visible;
    emit(this, MenuItem.changed, void 0);
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
    emit(this, MenuItem.changed, void 0);
    emit(this, MenuItem.toggled, void 0);
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
    emit(this, MenuItem.changed, void 0);
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
    emit(this, MenuItem.changed, void 0);
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
    emit(this, MenuItem.triggered, void 0);
  }

  /**
   * Initialize the menu item from the given options object.
   */
  private _initFrom(options: IMenuItemOptions): void {
    if (options.type !== void 0) {
      this.type = options.type;
    }
    if (options.text !== void 0) {
      this._text = options.text;
    }
    if (options.mnemonic !== void 0) {
      this.mnemonic = options.mnemonic;
    }
    if (options.shortcut !== void 0) {
      this._shortcut = options.shortcut;
    }
    if (options.enabled !== void 0) {
      this._enabled = options.enabled;
    }
    if (options.visible !== void 0) {
      this._visible = options.visible;
    }
    if (options.checked !== void 0) {
      this.checked = options.checked;
    }
    if (options.submenu !== void 0) {
      this._submenu = options.submenu;
    }
    if (options.className !== void 0) {
      this._className = options.className;
    }
  }

  private _text = '';
  private _mnemonic = '';
  private _shortcut = '';
  private _className = '';
  private _enabled = true;
  private _visible = true;
  private _type = 'normal';
  private _checked = false;
  private _submenu: Menu = null;
}

} // module phosphor.widgets
