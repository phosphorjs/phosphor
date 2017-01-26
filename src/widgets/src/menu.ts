/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  JSONObject
} from '@phosphor/json';

import {
  Keymap
} from '@phosphor/keymap';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  ElementDataset, VirtualElement, h
} from '@phosphor/virtualdom';

import {
  Widget
} from './widget';


/**
 * A widget which displays items as a canonical menu.
 */
export
class Menu extends Widget {
  /**
   * Construct a new menu.
   *
   * @param options - The options for initializing the menu.
   */
  constructor(options: Menu.IOptions) {
    super({ node: Private.createNode() });
    this.addClass(Menu.MENU_CLASS);
    this.setFlag(Widget.Flag.DisallowLayout);
    this.commands = options.commands;
    this.keymap = options.keymap || null;
    this.renderer = options.renderer || Menu.defaultRenderer;
    // TODO warn if keymap.commands !== commands.
  }

  /**
   * Dispose of the resources held by the menu.
   */
  dispose(): void {
    this.close();
    this._items.length = 0;
    super.dispose();
  }

  /**
   * A signal emitted just before the menu is closed.
   *
   * #### Notes
   * This signal is emitted when the menu receives a `'close-request'`
   * message, just before it removes itself from the DOM.
   *
   * This signal is not emitted if the menu is already detached from
   * the DOM when it receives the `'close-request'` message.
   */
  get aboutToClose(): ISignal<this, void> {
    return this._aboutToClose;
  }

  /**
   * A signal emitted when a new menu is requested by the user.
   *
   * #### Notes
   * This signal is emitted whenever the user presses the right or left
   * arrow keys, and a submenu cannot be opened or closed in response.
   *
   * This signal is useful when implementing menu bars in order to open
   * the next or previous menu in response to a user key press.
   *
   * This signal is only emitted for the root menu in a hierarchy.
   */
  get menuRequested(): ISignal<Menu, 'next' | 'previous'> {
    return this._menuRequested;
  }

  /**
   * The command registry used by the menu.
   */
  readonly commands: CommandRegistry;

  /**
   * The keymap used by the menu.
   */
  readonly keymap: Keymap | null;

  /**
   * The renderer used by the menu.
   */
  readonly renderer: Menu.IRenderer;

  /**
   * The parent menu of the menu.
   *
   * #### Notes
   * This is `null` unless the menu is an open submenu.
   */
  get parentMenu(): Menu | null {
    return this._parentMenu;
  }

  /**
   * The child menu of the menu.
   *
   * #### Notes
   * This is `null` unless the menu has an open submenu.
   */
  get childMenu(): Menu | null {
    return this._childMenu;
  }

  /**
   * The root menu of the menu hierarchy.
   */
  get rootMenu(): Menu {
    let menu: Menu = this;
    while (menu._parentMenu) {
      menu = menu._parentMenu;
    }
    return menu;
  }

  /**
   * The leaf menu of the menu hierarchy.
   */
  get leafMenu(): Menu {
    let menu: Menu = this;
    while (menu._childMenu) {
      menu = menu._childMenu;
    }
    return menu;
  }

  /**
   * The menu content node.
   *
   * #### Notes
   * This is the node which holds the menu item nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(Menu.CONTENT_CLASS)[0] as HTMLUListElement;
  }

  /**
   * Get the currently active menu item.
   */
  get activeItem(): Menu.IItem | null {
    return this._items[this._activeIndex] || null;
  }

  /**
   * Set the currently active menu item.
   *
   * #### Notes
   * If the item cannot be activated, the item will be set to `null`.
   */
  set activeItem(value: Menu.IItem | null) {
    this.activeIndex = value ? this._items.indexOf(value) : -1;
  }

  /**
   * Get the index of the currently active menu item.
   *
   * #### Notes
   * This will be `-1` if no menu item is active.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the currently active menu item.
   *
   * #### Notes
   * If the item cannot be activated, the index will be set to `-1`.
   */
  set activeIndex(value: number) {
    // Adjust the value for an out of range index.
    if (value < 0 || value >= this._items.length) {
      value = -1;
    }

    // Ensure the item can be activated.
    if (value !== -1 && !Private.canActivate(this._items[value])) {
      value = -1;
    }

    // Bail if the index will not change.
    if (this._activeIndex === value) {
      return;
    }

    // Update the active index.
    this._activeIndex = value;

    // schedule an update of the items.
    this.update();
  }

  /**
   * A read-only array of the menu items in the menu.
   */
  get items(): ReadonlyArray<Menu.IItem> {
    return this._items;
  }

  /**
   * Activate the next selectable item in the menu.
   *
   * #### Notes
   * If no item is selectable, the index will be set to `-1`.
   */
  activateNextItem(): void {
    let n = this._items.length;
    let ai = this._activeIndex;
    let start = ai < n - 1 ? n + 1 : 0;
    let stop = start === 0 ? n - 1 : start - 1;
    this.activeIndex = ArrayExt.findFirstIndex(
      this._items, Private.canActivate, start, stop
    );
  }

  /**
   * Activate the previous selectable item in the menu.
   *
   * #### Notes
   * If no item is selectable, the index will be set to `-1`.
   */
  activatePreviousItem(): void {
    let n = this._items.length;
    let ai = this._activeIndex;
    let start = ai <= 0 ? n - 1 : ai - 1;
    let stop = start === n - 1 ? 0 : start + 1;
    this.activeIndex = ArrayExt.findLastIndex(
      this._items, Private.canActivate, start, stop
    );
  }

  /**
   * Add a menu item to the end of the menu.
   *
   * @param options - The options for creating the menu item.
   *
   * @returns The menu item added to the menu.
   */
  addItem(options: Menu.IItemOptions): Menu.IItem {
    return this.insertItem(this._items.length, options);
  }

  /**
   * Insert a menu item into the menu at the specified index.
   *
   * @param index - The index at which to insert the item.
   *
   * @param options - The options for creating the menu item.
   *
   * @returns The menu item added to the menu.
   *
   * #### Notes
   * The index will be clamped to the bounds of the items.
   */
  insertItem(index: number, options: Menu.IItemOptions): Menu.IItem {
    // Reset the active index.
    this.activeIndex = -1;

    // Clamp the insert index to the array bounds.
    let i = Math.max(0, Math.min(index, this._items.length));

    // Create the item for the options.
    let item = Private.createItem(this, options);

    // Insert the item into the array.
    ArrayExt.insert(this._items, i, item);

    // Schedule an update of the items.
    this.update();

    // Return the item added to the menu.
    return item;
  }

  /**
   * Remove an item from the menu.
   *
   * @param item - The item to remove from the menu.
   *
   * #### Notes
   * This is a no-op if the item is not in the menu.
   */
  removeItem(item: Menu.IItem): void {
    this.removeItemAt(this._items.indexOf(item));
  }

  /**
   * Remove the item at a given index from the menu.
   *
   * @param index - The index of the item to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeItemAt(index: number): void {
    // Reset the active index.
    this.activeIndex = -1;

    // Remove the item from the array.
    let item = ArrayExt.removeAt(this._items, index);

    // Bail if the index is out of range.
    if (!item) {
      return
    }

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Remove all menu items from the menu.
   */
  clearItems(): void {
    // Reset the active index.
    this.activeIndex = -1;

    // Bail if there is nothing to remove.
    if (this._items.length === 0) {
      return;
    }

    // Clear the items.
    this._items.length = 0;

    // Schedule an update of the items.
    this.update();
  }

  private _activeIndex = -1;
  private _items: Menu.IItem[] = [];
  private _childMenu: Menu | null = null;
  private _parentMenu: Menu | null = null;
  private _aboutToClose = new Signal<this, void>(this);
  private _menuRequested = new Signal<this, 'next' | 'previous'>(this);
}


/**
 * The namespace for the `Menu` class statics.
 */
export
namespace Menu {
  /**
   * The class name added to Menu instances.
   */
  export
  const MENU_CLASS = 'p-Menu';

  /**
   * The class name added to a menu content node.
   */
  export
  const CONTENT_CLASS = 'p-Menu-content';

  /**
   * An options object for creating a menu.
   */
  export
  interface IOptions {
    /**
     * The command registry for use with the menu.
     */
    commands: CommandRegistry;

    /**
     * The keymap for use with the menu.
     *
     * If a keymap is provided, it's `commands` registry should be the
     * same as the `commands` option, or the menu items may not render
     * the correct key bindings.
     */
    keymap?: Keymap;

    /**
     * A custom renderer for use with the menu.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * A type alias for a menu item type.
   */
  export
  type ItemType = 'command' | 'submenu' | 'separator';

  /**
   * An options object for creating a menu item.
   */
  export
  interface IItemOptions {
    /**
     * The type of the menu item.
     *
     * The default value is `'command'`.
     */
    type?: ItemType;

    /**
     * The command to execute when the item is triggered.
     *
     * The default value is an empty string.
     */
    command?: string;

    /**
     * The arguments for the command.
     *
     * The default value is `null`.
     */
    args?: JSONObject | null;

    /**
     * The submenu for a `'submenu'` type item.
     *
     * The default value is `null`.
     */
    submenu?: Menu | null;
  }

  /**
   * An object which represents a menu item.
   *
   * #### Notes
   * Item objects are created automatically by a menu.
   */
  export
  interface IItem {
    /**
     * The type of the menu item.
     */
    readonly type: ItemType;

    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: JSONObject | null;

    /**
     * The submenu for a `'submenu'` type item.
     */
    readonly submenu: Menu | null;

    /**
     * The display label for the menu item.
     */
    readonly label: string;

    /**
     * The mnemonic index for the menu item.
     */
    readonly mnemonic: number;

    /**
     * The icon class for the menu item.
     */
    readonly icon: string;

    /**
     * The display caption for the menu item.
     */
    readonly caption: string;

    /**
     * The extra class name for the menu item.
     */
    readonly className: string;

    /**
     * Whether the menu item is enabled.
     */
    readonly isEnabled: boolean;

    /**
     * Whether the menu item is toggled.
     */
    readonly isToggled: boolean;

    /**
     * Whether the menu item is visible.
     */
    readonly isVisible: boolean;

    /**
     * The key binding for the menu item.
     */
    readonly keyBinding: Keymap.IBinding | null;
  }

  /**
   * An object which holds the data to render a menu item.
   */
  export
  interface IRenderData {
    /**
     * The item to be rendered.
     */
    readonly item: IItem;

    /**
     * Whether the item is the active item.
     */
    readonly active: boolean;

    /**
     * Whether the item should be collapsed.
     */
    readonly collapsed: boolean;
  }

  /**
   * A renderer for use with a menu.
   */
  export
  interface IRenderer {
    /**
     * Render the virtual element for a menu item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement;
  }

  /**
   * The default implementation of `IRenderer`.
   *
   * #### Notes
   * Subclasses are free to reimplement rendering methods as needed.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Construct a new renderer.
     */
    constructor() { }

    /**
     * Render the virtual element for a menu item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement {
      let className = this.createItemClass(data);
      let dataset = this.createItemDataset(data);
      return (
        h.li({ className, dataset },
          this.renderIcon(data),
          this.renderLabel(data),
          this.renderShortcut(data),
          this.renderSubmenu(data)
        )
      );
    }

    /**
     * Render the icon element for a menu item.
     *
     * @param data - The data to use for rendering the icon.
     *
     * @returns A virtual element representing the item icon.
     */
    renderIcon(data: IRenderData): VirtualElement {
      return h.div({ className: this.createIconClass(data) });
    }

    /**
     * Render the label element for a menu item.
     *
     * @param data - The data to use for rendering the label.
     *
     * @returns A virtual element representing the item label.
     */
    renderLabel(data: IRenderData): VirtualElement {
      let content = this.formatLabel(data);
      return h.div({ className: Renderer.LABEL_CLASS }, content);
    }

    /**
     * Render the shortcut element for a menu item.
     *
     * @param data - The data to use for rendering the shortcut.
     *
     * @returns A virtual element representing the item shortcut.
     */
    renderShortcut(data: IRenderData): VirtualElement {
      let content = this.formatShortcut(data);
      return h.div({ className: Renderer.SHORTCUT_CLASS }, content);
    }

    /**
     * Render the submenu icon element for a menu item.
     *
     * @param data - The data to use for rendering the submenu icon.
     *
     * @returns A virtual element representing the submenu icon.
     */
    renderSubmenu(data: IRenderData): VirtualElement {
      return h.div({ className: Renderer.SUBMENU_ICON_CLASS });
    }

    /**
     * Create the class name for the menu item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the menu item.
     */
    createItemClass(data: IRenderData): string {
      // Setup the initial class name.
      let name = Renderer.ITEM_CLASS;

      // Add the type class.
      switch (data.item.type) {
      case 'command':
        name += ` ${Renderer.COMMAND_TYPE_CLASS}`;
        break;
      case 'submenu':
        name += ` ${Renderer.SUBMENU_TYPE_CLASS}`;
        break;
      case 'separator':
        name += ` ${Renderer.SEPARATOR_TYPE_CLASS}`;
        break;
      }

      // Add the boolean state classes.
      if (!data.item.isEnabled) {
        name += ` ${Renderer.DISABLED_CLASS}`;
      }
      if (data.item.isToggled) {
        name += ` ${Renderer.TOGGLED_CLASS}`;
      }
      if (!data.item.isVisible) {
        name += ` ${Renderer.HIDDEN_CLASS}`;
      }
      if (data.active) {
        name += ` ${Renderer.ACTIVE_CLASS}`;
      }
      if (data.collapsed) {
        name += ` ${Renderer.COLLAPSED_CLASS}`;
      }

      // Add the extra class.
      let extra = data.item.className;
      if (extra) {
        name += ` ${extra}`;
      }

      // Return the complete class name.
      return name;
    }

    /**
     * Create the dataset for the menu item.
     *
     * @param data - The data to use for creating the dataset.
     *
     * @returns The dataset for the menu item.
     */
    createItemDataset(data: IRenderData): ElementDataset {
      let { type, command } = data.item;
      return type === 'command' ? { command } : { };
    }

    /**
     * Create the class name for the menu item icon.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the item icon.
     */
    createIconClass(data: IRenderData): string {
      let name = Renderer.ICON_CLASS;
      let extra = data.item.icon;
      return extra ? `${name} ${extra}` : name;
    }

    /**
     * Create the render content for the label node.
     *
     * @param data - The data to use for the label content.
     *
     * @returns The content to add to the label node.
     */
    formatLabel(data: IRenderData): h.Child {
      // Fetch the label text and mnemonic index.
      let label = data.item.label;
      let mnemonic = data.item.mnemonic;

      // If the index is out of range, do not modify the label.
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label;
      }

      // Split the label into parts.
      let prefix = label.slice(0, mnemonic);
      let suffix = label.slice(mnemonic + 1);
      let char = label[mnemonic];

      // Wrap the mnemonic character in a span.
      let span = h.span({ className: Renderer.MNEMONIC_CLASS }, char);

      // Return the content parts.
      return [prefix, span, suffix];
    }

    /**
     * Create the render content for the shortcut node.
     *
     * @param data - The data to use for the shortcut content.
     *
     * @returns The content to add to the shortcut node.
     */
    formatShortcut(data: IRenderData): h.Child {
      let kb = data.item.keyBinding;
      return kb ? kb.keys.map(Keymap.formatKeystroke).join(' ') : null;
    }
  }

  /**
   * The namespace for the `Renderer` class statics.
   */
  export
  namespace Renderer {
    /**
     * The class name added to a menu item node.
     */
    export
    const ITEM_CLASS = 'p-Menu-item';

    /**
     * The class name added to a menu item icon node.
     */
    export
    const ICON_CLASS = 'p-Menu-itemIcon';

    /**
     * The class name added to a menu item label node.
     */
    export
    const LABEL_CLASS = 'p-Menu-itemLabel';

    /**
     * The class name added to a menu item mnemonic node.
     */
    export
    const MNEMONIC_CLASS = 'p-Menu-itemMnemonic';

    /**
     * The class name added to a menu item shortcut node.
     */
    export
    const SHORTCUT_CLASS = 'p-Menu-itemShortcut';

    /**
     * The class name added to a menu item submenu icon node.
     */
    export
    const SUBMENU_ICON_CLASS = 'p-Menu-itemSubmenuIcon';

    /**
     * The class name added to a `'command'` type menu item.
     */
    export
    const COMMAND_TYPE_CLASS = 'p-type-command';

    /**
     * The class name added to a `'separator'` type menu item.
     */
    export
    const SEPARATOR_TYPE_CLASS = 'p-type-separator';

    /**
     * The class name added to a `'submenu'` type menu item.
     */
    export
    const SUBMENU_TYPE_CLASS = 'p-type-submenu';

    /**
     * The class name added to a disabled menu item.
     */
    export
    const DISABLED_CLASS = 'p-mod-disabled';

    /**
     * The class name added to a toggled menu item.
     */
    export
    const TOGGLED_CLASS = 'p-mod-toggled';

    /**
     * The class name added to a hidden menu item.
     */
    export
    const HIDDEN_CLASS = 'p-mod-hidden';

    /**
     * The class name added to active menu items.
     */
    export
    const ACTIVE_CLASS = 'p-mod-active';

    /**
     * The class name added to a collapsed menu item.
     */
    export
    const COLLAPSED_CLASS = 'p-mod-collapsed';
  }

  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Create the DOM node for a menu.
   */
  export
  function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = Menu.CONTENT_CLASS;
    node.appendChild(content);
    node.tabIndex = -1;
    return node;
  }

  /**
   * Test whether a menu item can be activated.
   */
  export
  function canActivate(item: Menu.IItem): boolean {
    return item.type !== 'separator' && item.isEnabled && item.isVisible;
  }

  /**
   * Create a new menu item for an owner menu.
   */
  export
  function createItem(owner: Menu, options: Menu.IItemOptions): Menu.IItem {
    return new MenuItem(owner.commands, owner.keymap, options);
  }

  /**
   * A concrete implementation of `Menu.IItem`.
   */
  class MenuItem implements Menu.IItem {
    /**
     * Construct a new menu item.
     */
    constructor(commands: CommandRegistry, keymap: Keymap | null, options: Menu.IItemOptions) {
      this._commands = commands;
      this._keymap = keymap;
      this.type = options.type || 'command';
      this.command = options.command || '';
      this.args = options.args || null;
      this.submenu = options.submenu || null;
    }

    /**
     * The type of the menu item.
     */
    readonly type: Menu.ItemType;

    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: JSONObject | null;

    /**
     * The submenu for a `'submenu'` type item.
     */
    readonly submenu: Menu | null;

    /**
     * The display label for the menu item.
     */
    get label(): string {
      if (this.type === 'command') {
        return this._commands.label(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.label;
      }
      return '';
    }

    /**
     * The mnemonic index for the menu item.
     */
    get mnemonic(): number {
      if (this.type === 'command') {
        return this._commands.mnemonic(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.mnemonic;
      }
      return -1;
    }

    /**
     * The icon class for the menu item.
     */
    get icon(): string {
      if (this.type === 'command') {
        return this._commands.icon(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.icon;
      }
      return '';
    }

    /**
     * The display caption for the menu item.
     */
    get caption(): string {
      if (this.type === 'command') {
        return this._commands.caption(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.caption;
      }
      return '';
    }

    /**
     * The extra class name for the menu item.
     */
    get className(): string {
      if (this.type === 'command') {
        return this._commands.className(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.className;
      }
      return '';
    }

    /**
     * Whether the menu item is enabled.
     */
    get isEnabled(): boolean {
      if (this.type === 'command') {
        return this._commands.isEnabled(this.command, this.args);
      }
      if (this.type === 'submenu') {
        return this.submenu !== null;
      }
      return true;
    }

    /**
     * Whether the menu item is toggled.
     */
    get isToggled(): boolean {
      if (this.type === 'command') {
        return this._commands.isToggled(this.command, this.args);
      }
      return false;
    }

    /**
     * Whether the menu item is visible.
     */
    get isVisible(): boolean {
      if (this.type === 'command') {
        return this._commands.isVisible(this.command, this.args);
      }
      if (this.type === 'submenu') {
        return this.submenu !== null;
      }
      return true;
    }

    /**
     * The key binding for the menu item.
     */
    get keyBinding(): Keymap.IBinding | null {
      if (this._keymap && this.type === 'command') {
        return this._keymap.findBinding(this.command, this.args) || null;
      }
      return null;
    }

    private _commands: CommandRegistry;
    private _keymap: Keymap | null;
  }
}
