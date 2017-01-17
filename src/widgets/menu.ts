/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  JSONObject
} from '../algorithm/json';

import {
  findIndex, indexOf
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

import {
  Vector
} from '../collections/vector';

import {
  Message, sendMessage
} from '../core/messaging';

import {
  ISignal, defineSignal
} from '../core/signaling';

import {
  hitTest
} from '../dom/query';

import {
  boxSizing
} from '../dom/sizing';

import {
  CommandRegistry
} from './commandregistry';

import {
  Keymap
} from './keymap';

import {
  Widget, WidgetFlag, WidgetMessage
} from './widget';


/**
 * The class name added to Menu instances.
 */
const MENU_CLASS = 'p-Menu';

/**
 * The class name added to a menu content node.
 */
const CONTENT_CLASS = 'p-Menu-content';

/**
 * The class name added to a menu item node.
 */
const ITEM_CLASS = 'p-Menu-item';

/**
 * The class name added to a menu item icon node.
 */
const ICON_CLASS = 'p-Menu-itemIcon';

/**
 * The class name added to a menu item label node.
 */
const LABEL_CLASS = 'p-Menu-itemLabel';

/**
 * The class name added to a menu item mnemonic node.
 */
const MNEMONIC_CLASS = 'p-Menu-itemMnemonic';

/**
 * The class name added to a menu item shortcut node.
 */
const SHORTCUT_CLASS = 'p-Menu-itemShortcut';

/**
 * The class name added to a menu item submenu icon node.
 */
const SUBMENU_ICON_CLASS = 'p-Menu-itemSubmenuIcon';

/**
 * The class name added to a `'command'` type menu item.
 */
const COMMAND_TYPE_CLASS = 'p-type-command';

/**
 * The class name added to a `'separator'` type menu item.
 */
const SEPARATOR_TYPE_CLASS = 'p-type-separator';

/**
 * The class name added to a `'submenu'` type menu item.
 */
const SUBMENU_TYPE_CLASS = 'p-type-submenu';

/**
 * The class name added to active menu items.
 */
const ACTIVE_CLASS = 'p-mod-active';

/**
 * The class name added to a disabled menu item.
 */
const DISABLED_CLASS = 'p-mod-disabled';

/**
 * The class name added to a toggled menu item.
 */
const TOGGLED_CLASS = 'p-mod-toggled';

/**
 * The class name added to a hidden menu item.
 */
const HIDDEN_CLASS = 'p-mod-hidden';

/**
 * The ms delay for opening and closing a submenu.
 */
const TIMER_DELAY = 300;

/**
 * The horizontal pixel overlap for an open submenu.
 */
const SUBMENU_OVERLAP = 3;


/**
 * A widget which displays menu items as a canonical menu.
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
    this.addClass(MENU_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
    this._keymap = options.keymap;
    this._commands = options.commands;
    this._renderer = options.renderer || Menu.defaultRenderer;
  }

  /**
   * Dispose of the resources held by the menu.
   */
  dispose(): void {
    this.close();
    this._items.clear();
    this._nodes.clear();
    this._keymap = null;
    this._commands = null;
    this._renderer = null;
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
  aboutToClose: ISignal<Menu, void>;

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
  menuRequested: ISignal<Menu, 'next' | 'previous'>;

  /**
   * Get the parent menu of the menu.
   *
   * #### Notes
   * This will be `null` if the menu is not an open submenu.
   *
   * This is a read-only property.
   */
  get parentMenu(): Menu {
    return this._parentMenu;
  }

  /**
   * Get the child menu of the menu.
   *
   * #### Notes
   * This will be `null` if the menu does not have an open submenu.
   *
   * This is a read-only property.
   */
  get childMenu(): Menu {
    return this._childMenu;
  }

  /**
   * Find the root menu of this menu hierarchy.
   *
   * #### Notes
   * This is a read-only property.
   */
  get rootMenu(): Menu {
    let menu: Menu = this;
    while (menu._parentMenu) {
      menu = menu._parentMenu;
    }
    return menu;
  }

  /**
   * Find the leaf menu of this menu hierarchy.
   *
   * #### Notes
   * This is a read-only property.
   */
  get leafMenu(): Menu {
    let menu: Menu = this;
    while (menu._childMenu) {
      menu = menu._childMenu;
    }
    return menu;
  }

  /**
   * Get the menu content node.
   *
   * #### Notes
   * This is the node which holds the menu item nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLUListElement;
  }

  /**
   * The command registry used by the menu.
   *
   * #### Notes
   * This is a read-only property.
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * The keymap used by the menu.
   *
   * #### Notes
   * This is a read-only property.
   */
  get keymap(): Keymap {
    return this._keymap;
  }

  /**
   * The renderer used by the menu.
   *
   * #### Notes
   * This is a read-only property.
   */
  get renderer(): Menu.IRenderer {
    return this._renderer;
  }

  /**
   * A read-only sequence of the menu items in the menu.
   *
   * #### Notes
   * This is a read-only property.
   */
  get items(): ISequence<Menu.IItem> {
    return this._items;
  }

  /**
   * Get the currently active menu item.
   *
   * #### Notes
   * This will be `null` if no menu item is active.
   */
  get activeItem(): Menu.IItem {
    let i = this._activeIndex;
    return i !== -1 ? this._items.at(i) : null;
  }

  /**
   * Set the currently active menu item.
   *
   * #### Notes
   * If the item cannot be activated, the item will be set to `null`.
   */
  set activeItem(value: Menu.IItem) {
    this.activeIndex = indexOf(this._items, value);
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
    // Coerce the value to an index.
    let i = Math.floor(value);
    if (i < 0 || i >= this._items.length) {
      i = -1;
    }

    // Ensure the item can be activated.
    if (i !== -1) {
      let item = this._items.at(i);
      if (item.type === 'separator' || !item.isEnabled || !item.isVisible) {
        i = -1;
      }
    }

    // Bail early if the index will not change.
    if (this._activeIndex === i) {
      return;
    }

    // Remove the active class from the old node.
    if (this._activeIndex !== -1) {
      let node = this._nodes.at(this._activeIndex);
      node.classList.remove(ACTIVE_CLASS);
    }

    // Add the active class to the new node.
    if (i !== -1) {
      let node = this._nodes.at(i);
      node.classList.add(ACTIVE_CLASS);
    }

    // Update the active index.
    this._activeIndex = i;
  }

  /**
   * Activate the next selectable item in the menu.
   *
   * #### Notes
   * If no item is selectable, the index will be set to `-1`.
   */
  activateNextItem(): void {
    let n = this._items.length;
    let j = this._activeIndex + 1;
    for (let i = 0; i < n; ++i) {
      let k = (i + j) % n;
      let item = this._items.at(k);
      if (item.type !== 'separator' && item.isEnabled && item.isVisible) {
        this.activeIndex = k;
        return;
      }
    }
    this.activeIndex = -1;
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
    let j = ai <= 0 ? n - 1 : ai - 1;
    for (let i = 0; i < n; ++i) {
      let k = (j - i + n) % n;
      let item = this._items.at(k);
      if (item.type !== 'separator' && item.isEnabled && item.isVisible) {
        this.activeIndex = k;
        return;
      }
    }
    this.activeIndex = -1;
  }

  /**
   * Trigger the active menu item.
   *
   * #### Notes
   * If the active item is a submenu, it will be opened and the first
   * item will be activated.
   *
   * If the active item is a command, the command will be executed.
   *
   * If the menu is not attached, this is a no-op.
   *
   * If there is no active item, this is a no-op.
   */
  triggerActiveItem(): void {
    // Bail if the menu is not attached.
    if (!this.isAttached) {
      return;
    }

    // Bail if there is no active item.
    let item = this.activeItem;
    if (!item) {
      return;
    }

    // Cancel the pending timers.
    this._cancelOpenTimer();
    this._cancelCloseTimer();

    // If the item is a submenu, open it.
    if (item.type === 'submenu') {
      this._openChildMenu(true);
      return;
    }

    // Close the root menu before executing the command.
    this.rootMenu.close();

    // Execute the command for the item.
    let { command, args } = item;
    if (this._commands.isEnabled(command, args)) {
      this._commands.execute(command, args);
    } else {
      // TODO - is this the right logging here?
      console.log(`Command '${command}' is disabled.`);
    }
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
    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

    // Reset the active index.
    this.activeIndex = -1;

    // Clamp the insert index to the vector bounds.
    let i = Math.max(0, Math.min(Math.floor(index), this._items.length));

    // Create the item for the options.
    let item = Private.createItem(this._commands, this._keymap, options);

    // Create the node for the item. It will be initialized on open.
    let node = this._renderer.createItemNode();

    // Insert the item and node into the vectors.
    this._items.insert(i, item);
    this._nodes.insert(i, node);

    // Look up the next sibling node.
    let ref = i + 1 < this._nodes.length ? this._nodes.at(i + 1) : null;

    // Insert the node into the content node.
    this.contentNode.insertBefore(node, ref);

    // Return the item added to the menu.
    return item;
  }

  /**
   * Remove an item from the menu.
   *
   * @param item - The item to remove from the menu.
   *
   * @returns The index occupied by the item, or `-1` if the item
   *   was not contained in the menu.
   */
  removeItem(item: Menu.IItem): number {
    let index = indexOf(this._items, item);
    if (index !== -1) this.removeItemAt(index);
    return index;
  }

  /**
   * Remove the item at a given index from the menu.
   *
   * @param index - The index of the item to remove.
   *
   * @returns The item occupying the index, or `null` if the index
   *   is out of range.
   */
  removeItemAt(index: number): Menu.IItem {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._items.length) {
      return null;
    }

    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

    // Reset the active index.
    this.activeIndex = -1;

    // Remove the node and items from the vectors.
    let node = this._nodes.removeAt(i);
    let item = this._items.removeAt(i);

    // Remove the node from the content node.
    this.contentNode.removeChild(node);

    // Return the removed item.
    return item;
  }

  /**
   * Remove all menu items from the menu.
   */
  clearItems(): void {
    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

    // Reset the active index.
    this.activeIndex = -1;

    // Clear the item and node vectors.
    this._items.clear();
    this._nodes.clear();

    // Clear the content node.
    this.contentNode.textContent = '';
  }

  /**
   * Open the menu at the specified location.
   *
   * @param x - The client X coordinate of the menu location.
   *
   * @param y - The client Y coordinate of the menu location.
   *
   * @param options - The additional options for opening the menu.
   *
   * #### Notes
   * The menu will be opened at the given location unless it will not
   * fully fit on the screen. If it will not fit, it will be adjusted
   * to fit naturally on the screen.
   *
   * This is a no-op if the menu is already attached to the DOM.
   */
  open(x: number, y: number, options: Menu.IOpenOptions = {}): void {
    // Bail early if the menu is already attached.
    if (this.isAttached) {
      return;
    }

    // Extract the position options.
    let forceX = options.forceX || false;
    let forceY = options.forceY || false;

    // Open the menu as a root menu.
    Private.openRootMenu(this, x, y, forceX, forceY);

    // Activate the menu to accept keyboard input.
    this.activate();
  }

  /**
   * Handle the DOM events for the menu.
   *
   * @param event - The DOM event sent to the menu.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the menu's DOM nodes. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseenter':
      this._evtMouseEnter(event as MouseEvent);
      break;
    case 'mouseleave':
      this._evtMouseLeave(event as MouseEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('mouseup', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseenter', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
    document.addEventListener('mousedown', this, true);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('mouseup', this);
    this.node.removeEventListener('mousemove', this);
    this.node.removeEventListener('mouseenter', this);
    this.node.removeEventListener('mouseleave', this);
    this.node.removeEventListener('contextmenu', this);
    document.removeEventListener('mousedown', this, true);
  }

  /**
   * A message handler invoked on an `'activate-request'` message.
   */
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) this.node.focus();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // TODO - currently, an 'update-request' message is sent to a menu
    // just before it is opened. This ensures it is current when shown
    // without needing to subscribe to any commands or keymap signals.
    // Often, the update will be unnecessary. If it becomes an issue
    // for performance, the menu can maintain a dirty flag.

    // Fetch common variables.
    let items = this._items;
    let nodes = this._nodes;
    let renderer = this._renderer;

    // Update the state of the item nodes.
    for (let i = 0, n = items.length; i < n; ++i) {
      renderer.updateItemNode(nodes.at(i), items.at(i));
    }

    // Add the active class to the active item.
    if (this._activeIndex !== -1) {
      nodes.at(this._activeIndex).classList.add(ACTIVE_CLASS);
    }

    // Hide the extra separator nodes.
    Private.hideExtraSeparators(nodes, items);
  }

  /**
   * A message handler invoked on a `'close-request'` message.
   */
  protected onCloseRequest(msg: Message): void {
    // Cancel the pending timers.
    this._cancelOpenTimer();
    this._cancelCloseTimer();

    // Reset the active index.
    this.activeIndex = -1;

    // Close any open child menu.
    let childMenu = this._childMenu;
    if (childMenu) {
      this._childIndex = -1;
      this._childMenu = null;
      childMenu._parentMenu = null;
      childMenu.close();
    }

    // Remove this menu from its parent and activate the parent.
    let parentMenu = this._parentMenu;
    if (parentMenu) {
      this._parentMenu = null;
      parentMenu._cancelOpenTimer();
      parentMenu._cancelCloseTimer();
      parentMenu._childIndex = -1;
      parentMenu._childMenu = null;
      parentMenu.activate();
    }

    // Emit the `aboutToClose` signal if the menu is attached.
    if (this.isAttached) {
      this.aboutToClose.emit(void 0);
    }

    // Finish closing the menu.
    super.onCloseRequest(msg);
  }

  /**
   * Handle the `'keydown'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // A menu handles all keydown events.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the key code for the event.
    let kc = event.keyCode;

    // Enter
    if (kc === 13) {
      this.triggerActiveItem();
      return;
    }

    // Escape
    if (kc === 27) {
      this.close();
      return;
    }

    // Left Arrow
    if (kc === 37) {
      if (this._parentMenu) {
        this.close();
      } else {
        this.menuRequested.emit('previous');
      }
      return;
    }

    // Up Arrow
    if (kc === 38) {
      this.activatePreviousItem();
      return;
    }

    // Right Arrow
    if (kc === 39) {
      let item = this.activeItem;
      if (item && item.type === 'submenu') {
        this.triggerActiveItem();
      } else {
        this.rootMenu.menuRequested.emit('next');
      }
      return;
    }

    // Down Arrow
    if (kc === 40) {
      this.activateNextItem();
      return;
    }

    // The following code activates an item by mnemonic.

    // Get the pressed key character for the current layout.
    let key = this._keymap.layout.keyForKeydownEvent(event);

    // Bail if the key is not valid for the current layout.
    if (!key) {
      return;
    }

    // Normalize the case of the key.
    key = key.toUpperCase();

    // Setup the storage for the search results.
    let mnIndex = -1;
    let autoIndex = -1;
    let mnMultiple = false;

    // Search for the best mnemonic item. This searches the menu items
    // starting at the active index and finds the following:
    //   - the index of the first matching mnemonic item
    //   - whether there are multiple matching mnemonic items
    //   - the index of the first item with no mnemonic, but
    //     which has a matching first character
    let n = this._items.length;
    let j = this._activeIndex + 1;
    for (let i = 0; i < n; ++i) {
      let k = (i + j) % n;
      let item = this._items.at(k);
      if (item.type === 'separator' || !item.isEnabled || !item.isVisible) {
        continue;
      }
      let label = item.label;
      if (label.length === 0) {
        continue;
      }
      let mn = item.mnemonic;
      if (mn >= 0 && mn < label.length) {
        if (label[mn].toUpperCase() === key) {
          if (mnIndex === -1) {
            mnIndex = k;
          } else {
            mnMultiple = true;
          }
        }
      } else if (autoIndex === -1) {
        if (label[0].toUpperCase() === key) {
          autoIndex = k;
        }
      }
    }

    // Handle the requested mnemonic based on the search results.
    // If exactly one mnemonic is matched, that item is triggered.
    // Otherwise, the next mnemonic is activated if available,
    // followed by the auto mnemonic if available.
    if (mnIndex !== -1 && !mnMultiple) {
      this.activeIndex = mnIndex;
      this.triggerActiveItem();
    } else if (mnIndex !== -1) {
      this.activeIndex = mnIndex;
    } else if (autoIndex !== -1) {
      this.activeIndex = autoIndex;
    }
  }

  /**
   * Handle the `'mouseup'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.triggerActiveItem();
  }

  /**
   * Handle the `'mousemove'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Hit test the item nodes for the item under the mouse.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(this._nodes, node => hitTest(node, x, y));

    // Bail early if the mouse is already over the active index.
    if (i === this._activeIndex) {
      return;
    }

    // Update and coerce the active index.
    this.activeIndex = i;
    i = this.activeIndex;

    // If the index is the current child index, cancel the timers.
    if (i === this._childIndex) {
      this._cancelOpenTimer();
      this._cancelCloseTimer();
      return;
    }

    // If a child menu is currently open, start the close timer.
    if (this._childIndex !== -1) {
      this._startCloseTimer();
    }

    // Cancel the open timer to give a full delay for opening.
    this._cancelOpenTimer();

    // Bail if the active item is not a valid submenu item.
    let item = this.activeItem;
    if (!item || item.type !== 'submenu' || !item.menu) {
      return;
    }

    // Start the open timer to open the active item submenu.
    this._startOpenTimer();
  }

  /**
   * Handle the `'mouseenter'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseEnter(event: MouseEvent): void {
    // Synchronize the active ancestor items.
    for (let menu = this._parentMenu; menu; menu = menu._parentMenu) {
      menu._cancelOpenTimer();
      menu._cancelCloseTimer();
      menu.activeIndex = menu._childIndex;
    }
  }

  /**
   * Handle the `'mouseleave'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the menu node.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    // Cancel any pending submenu opening.
    this._cancelOpenTimer();

    // If there is no open child menu, just reset the active index.
    if (!this._childMenu) {
      this.activeIndex = -1;
      return;
    }

    // If the mouse is over the child menu, cancel the close timer.
    if (hitTest(this._childMenu.node, event.clientX, event.clientY)) {
      this._cancelCloseTimer();
      return;
    }

    // Otherwise, reset the active index and start the close timer.
    this.activeIndex = -1;
    this._startCloseTimer();
  }

  /**
   * Handle the `'mousedown'` event for the menu.
   *
   * #### Notes
   * This listener is attached to the document node.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Bail if the menu is not a root menu.
    if (this._parentMenu) {
      return;
    }

    // The mouse button which is pressed is irrelevant. If the press
    // is not on a menu, the entire hierarchy is closed and the event
    // is allowed to propagate. This allows other code to act on the
    // event, such as focusing the clicked element.
    if (Private.hitTestMenus(this, event.clientX, event.clientY)) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      this.close();
    }
  }

  /**
   * Open the child menu at the active index immediately.
   *
   * If a different child menu is already open, it will be closed,
   * even if the active item is not a valid submenu.
   */
  private _openChildMenu(activateFirst = false): void {
    // If the item is not a valid submenu, close the child menu.
    let item = this.activeItem;
    if (!item || item.type !== 'submenu' || !item.menu) {
      this._closeChildMenu();
      return;
    }

    // Do nothing if the child menu will not change.
    let menu = item.menu;
    if (menu === this._childMenu) {
      return;
    }

    // Ensure the current child menu is closed.
    this._closeChildMenu();

    // Update the private child state.
    this._childMenu = menu;
    this._childIndex = this._activeIndex;

    // Set the parent menu reference for the child.
    menu._parentMenu = this;

    // Open the submenu at the active node.
    Private.openSubmenu(menu, this._nodes.at(this._activeIndex));

    // Activate the first item if desired.
    if (activateFirst) {
      menu.activeIndex = -1;
      menu.activateNextItem();
    }

    // Activate the child menu.
    menu.activate();
  }

  /**
   * Close the child menu immediately.
   *
   * This is a no-op if a child menu is not open.
   */
  private _closeChildMenu(): void {
    if (this._childMenu) {
      this._childMenu.close();
    }
  }

  /**
   * Start the open timer, unless it is already pending.
   */
  private _startOpenTimer(): void {
    if (this._openTimerID === 0) {
      this._openTimerID = setTimeout(() => {
        this._openTimerID = 0;
        this._openChildMenu();
      }, TIMER_DELAY);
    }
  }

  /**
   * Start the close timer, unless it is already pending.
   */
  private _startCloseTimer(): void {
    if (this._closeTimerID === 0) {
      this._closeTimerID = setTimeout(() => {
        this._closeTimerID = 0;
        this._closeChildMenu();
      }, TIMER_DELAY);
    }
  }

  /**
   * Cancel the open timer, if the timer is pending.
   */
  private _cancelOpenTimer(): void {
    if (this._openTimerID !== 0) {
      clearTimeout(this._openTimerID);
      this._openTimerID = 0;
    }
  }

  /**
   * Cancel the close timer, if the timer is pending.
   */
  private _cancelCloseTimer(): void {
    if (this._closeTimerID !== 0) {
      clearTimeout(this._closeTimerID);
      this._closeTimerID = 0;
    }
  }

  private _keymap: Keymap;
  private _childIndex = -1;
  private _openTimerID = 0;
  private _closeTimerID = 0;
  private _activeIndex = -1;
  private _childMenu: Menu = null;
  private _parentMenu: Menu = null;
  private _renderer: Menu.IRenderer;
  private _commands: CommandRegistry;
  private _items = new Vector<Menu.IItem>();
  private _nodes = new Vector<HTMLLIElement>();
}


// Define the signals for the `Menu` class.
defineSignal(Menu.prototype, 'aboutToClose');
defineSignal(Menu.prototype, 'menuRequested');


/**
 * The namespace for the `Menu` class statics.
 */
export
namespace Menu {
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
     */
    keymap: Keymap;

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
    args?: JSONObject;

    /**
     * The menu for a `'submenu'` type item.
     *
     * The default value is `null`.
     */
    menu?: Menu;
  }

  /**
   * An object which represents a menu item.
   *
   * #### Notes
   * An item is an immutable object created by a menu.
   */
  export
  interface IItem {
    /**
     * The type of the menu item.
     */
    type: ItemType;

    /**
     * The command to execute when the item is triggered.
     */
    command: string;

    /**
     * The arguments for the command.
     */
    args: JSONObject;

    /**
     * The menu for a `'submenu'` type item.
     */
    menu: Menu;

    /**
     * The display label for the menu item.
     */
    label: string;

    /**
     * The mnemonic index for the menu item.
     */
    mnemonic: number;

    /**
     * The icon class for the menu item.
     */
    icon: string;

    /**
     * The display caption for the menu item.
     */
    caption: string;

    /**
     * The extra class name for the menu item.
     */
    className: string;

    /**
     * Whether the menu item is enabled.
     */
    isEnabled: boolean;

    /**
     * Whether the menu item is toggled.
     */
    isToggled: boolean;

    /**
     * Whether the menu item is visible.
     */
    isVisible: boolean;

    /**
     * The key binding for the menu item.
     */
    keyBinding: Keymap.IBinding;
  }

  /**
   * An options object for the `open` method on a menu.
   */
  export
  interface IOpenOptions {
    /**
     * Whether to force the X position of the menu.
     *
     * Setting to `true` will disable the logic which repositions the
     * X coordinate of the menu if it will not fit entirely on screen.
     *
     * The default is `false`.
     */
    forceX?: boolean;

    /**
     * Whether to force the Y position of the menu.
     *
     * Setting to `true` will disable the logic which repositions the
     * Y coordinate of the menu if it will not fit entirely on screen.
     *
     * The default is `false`.
     */
    forceY?: boolean;
  }

  /**
   * A renderer for use with a menu.
   */
  export
  interface IRenderer {
    /**
     * Create a node for a menu item.
     *
     * @returns A new node for a menu item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateItemNode` method will be called for initialization.
     */
    createItemNode(): HTMLLIElement;

    /**
     * Update an item node to reflect the state of a menu item.
     *
     * @param node - A node created by a call to `createItemNode`.
     *
     * @param item - The menu item holding the data for the node.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data for the menu item.
     */
    updateItemNode(node: HTMLLIElement, item: IItem): void;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Create a node for a menu item.
     *
     * @returns A new node for a menu item.
     */
    createItemNode(): HTMLLIElement {
      let node = document.createElement('li');
      let icon = document.createElement('div');
      let label = document.createElement('div');
      let shortcut = document.createElement('div');
      let submenu = document.createElement('div');
      node.className = ITEM_CLASS;
      icon.className = ICON_CLASS;
      label.className = LABEL_CLASS;
      shortcut.className = SHORTCUT_CLASS;
      submenu.className = SUBMENU_ICON_CLASS;
      node.appendChild(icon);
      node.appendChild(label);
      node.appendChild(shortcut);
      node.appendChild(submenu);
      return node;
    }

    /**
     * Update an item node to reflect the state of a menu item.
     *
     * @param node - A node created by a call to `createItemNode`.
     *
     * @param item - The menu item holding the data for the node.
     */
    updateItemNode(node: HTMLLIElement, item: IItem): void {
      // Setup the initial item class.
      let itemClass = ITEM_CLASS;

      // Add the item type to the item class.
      switch (item.type) {
      case 'command':
        itemClass += ` ${COMMAND_TYPE_CLASS}`;
        break;
      case 'submenu':
        itemClass += ` ${SUBMENU_TYPE_CLASS}`;
        break;
      case 'separator':
        itemClass += ` ${SEPARATOR_TYPE_CLASS}`;
        break;
      }

      // Add the boolean states to the item class.
      if (!item.isEnabled) {
        itemClass += ` ${DISABLED_CLASS}`;
      }
      if (item.isToggled) {
        itemClass += ` ${TOGGLED_CLASS}`;
      }
      if (!item.isVisible) {
        itemClass += ` ${HIDDEN_CLASS}`;
      }

      // Add the extra class name(s) to the item class.
      let extraItemClass = item.className;
      if (extraItemClass) {
        itemClass += ` ${extraItemClass}`;
      }

      // Setup the initial icon class.
      let iconClass = ICON_CLASS;

      // Add the extra class name(s) to the icon class.
      let extraIconClass = item.icon;
      if (extraIconClass) {
        iconClass +=  ` ${extraIconClass}`;
      }

      // Generate the formatted label HTML.
      let labelHTML = this.formatLabel(item.label, item.mnemonic);

      // Generate the formatted shortcut text.
      let shortcutText = this.formatShortcut(item.keyBinding);

      // Extract the relevant child nodes.
      let icon = node.firstChild as HTMLElement;
      let label = icon.nextSibling as HTMLElement;
      let shortcut = label.nextSibling as HTMLElement;

      // Set the command ID in the data set.
      if (item.type === 'command') {
        node.setAttribute('data-command', item.command);
      } else {
        node.removeAttribute('data-command');
      }

      // Update the rest of the node state.
      node.title = item.caption;
      node.className = itemClass;
      icon.className = iconClass;
      label.innerHTML = labelHTML;
      shortcut.textContent = shortcutText;
    }

    /**
     * Format a label into HTML for display.
     *
     * @param label - The label text of interest.
     *
     * @param mnemonic - The index of the mnemonic character.
     *
     * @return The formatted label HTML for display.
     */
    formatLabel(label: string, mnemonic: number): string {
      // If the index is out of range, do not modify the label.
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label;
      }

      // Split the label into parts.
      let pref = label.slice(0, mnemonic);
      let suff = label.slice(mnemonic + 1);
      let char = label[mnemonic];

      // Join the label with the mnemonic span.
      return `${pref}<span class="${MNEMONIC_CLASS}">${char}</span>${suff}`;
    }

    /**
     * Format a key binding into shortcut text for display.
     *
     * @param binding - The key binding to format. This may be `null`.
     *
     * @returns The formatted shortcut text for display.
     */
    formatShortcut(binding: Keymap.IBinding): string {
      return binding ? binding.keys.map(Keymap.formatKeystroke).join(' ') : '';
    }
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
    content.className = CONTENT_CLASS;
    node.appendChild(content);
    node.tabIndex = -1;
    return node;
  }

  /**
   * Create a new menu item from a keymap, commands, and options.
   */
  export
  function createItem(commands: CommandRegistry, keymap: Keymap, options: Menu.IItemOptions): Menu.IItem {
    return new MenuItem(commands, keymap, options);
  }

  /**
   * Hit test a menu hierarchy starting at the given root.
   */
  export
  function hitTestMenus(menu: Menu, x: number, y: number): boolean {
    for (; menu; menu = menu.childMenu) {
      if (hitTest(menu.node, x, y)) return true;
    }
    return false;
  }

  /**
   * Hide the extra and redundant separator nodes.
   */
  export
  function hideExtraSeparators(nodes: ISequence<HTMLLIElement>, items: ISequence<Menu.IItem>): void {
    // Hide the leading separators.
    let k1 = 0;
    let n = items.length;
    for (; k1 < n; ++k1) {
      let item = items.at(k1);
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        break;
      }
      nodes.at(k1).classList.add(HIDDEN_CLASS);
    }

    // Hide the trailing separators.
    let k2 = n - 1;
    for (; k2 >= 0; --k2) {
      let item = items.at(k2);
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        break;
      }
      nodes.at(k2).classList.add(HIDDEN_CLASS);
    }

    // Hide the remaining consecutive separators.
    let hide = false;
    while (++k1 < k2) {
      let item = items.at(k1);
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        hide = false;
      } else if (hide) {
        nodes.at(k1).classList.add(HIDDEN_CLASS);
      } else {
        hide = true;
      }
    }
  }

  /**
   * Open a menu as a root menu at the target location.
   */
  export
  function openRootMenu(menu: Menu, x: number, y: number, forceX: boolean, forceY: boolean): void {
    // Ensure the menu is updated before opening.
    sendMessage(menu, WidgetMessage.UpdateRequest);

    // Get the current position and size of the main viewport.
    let px = window.pageXOffset;
    let py = window.pageYOffset;
    let cw = document.documentElement.clientWidth;
    let ch = document.documentElement.clientHeight;

    // Compute the maximum allowed height for the menu.
    let maxHeight = ch - (forceY ? y : 0);

    // Fetch common variables.
    let node = menu.node;
    let style = node.style;

    // Clear the menu geometry and prepare it for measuring.
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
    style.visibility = 'hidden';
    style.maxHeight = `${maxHeight}px`;

    // Attach the menu to the document.
    Widget.attach(menu, document.body);

    // Expand the menu width by the scrollbar size, if present.
    if (node.scrollHeight > maxHeight) {
      style.width = `${2 * node.offsetWidth - node.clientWidth}px`;
    }

    // Measure the size of the menu.
    let { width, height } = node.getBoundingClientRect();

    // Adjust the X position of the menu to fit on-screen.
    if (!forceX && (x + width > px + cw)) {
      x = px + cw - width;
    }

    // Adjust the Y position of the menu to fit on-screen.
    if (!forceY && (y + height > py + ch)) {
      if (y > py + ch) {
        y = py + ch - height;
      } else {
        y = y - height;
      }
    }

    // Update the position of the menu to the computed position.
    style.top = `${Math.max(0, y)}px`;
    style.left = `${Math.max(0, x)}px`;

    // Finally, make the menu visible on the screen.
    style.visibility = '';
  }

  /**
   * Open a menu as a submenu using an item node for positioning.
   */
  export
  function openSubmenu(menu: Menu, itemNode: HTMLLIElement): void {
    // Ensure the menu is updated before opening.
    sendMessage(menu, WidgetMessage.UpdateRequest);

    // Get the current position and size of the main viewport.
    let px = window.pageXOffset;
    let py = window.pageYOffset;
    let cw = document.documentElement.clientWidth;
    let ch = document.documentElement.clientHeight;

    // Compute the maximum allowed height for the menu.
    let maxHeight = ch;

    // Fetch common variables.
    let node = menu.node;
    let style = node.style;

    // Clear the menu geometry and prepare it for measuring.
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
    style.visibility = 'hidden';
    style.maxHeight = `${maxHeight}px`;

    // Attach the menu to the document.
    Widget.attach(menu, document.body);

    // Expand the menu width by the scrollbar size, if present.
    if (node.scrollHeight > maxHeight) {
      style.width = `${2 * node.offsetWidth - node.clientWidth}px`;
    }

    // Measure the size of the menu.
    let { width, height } = node.getBoundingClientRect();

    // Compute the box sizing for the menu.
    let box = boxSizing(menu.node);

    // Get the bounding rect for the target item node.
    let itemRect = itemNode.getBoundingClientRect();

    // Compute the target X position.
    let x = itemRect.right - SUBMENU_OVERLAP;

    // Adjust the X position to fit on the screen.
    if (x + width > px + cw) {
      x = itemRect.left + SUBMENU_OVERLAP - width;
    }

    // Compute the target Y position.
    let y = itemRect.top - box.borderTop - box.paddingTop;

    // Adjust the Y position to fit on the screen.
    if (y + height > py + ch) {
      y = itemRect.bottom + box.borderBottom + box.paddingBottom - height;
    }

    // Update the position of the menu to the computed position.
    style.top = `${Math.max(0, y)}px`;
    style.left = `${Math.max(0, x)}px`;

    // Finally, make the menu visible on the screen.
    style.visibility = '';
  }

  /**
   * A concrete implementation of `Menu.IItem`.
   */
  class MenuItem implements Menu.IItem {
    /**
     * Construct a new menu item.
     */
    constructor(commands: CommandRegistry, keymap: Keymap, options: Menu.IItemOptions) {
      this._commands = commands;
      this._keymap = keymap;
      this._type = options.type || 'command';
      this._command = options.command || '';
      this._args = options.args || null;
      this._menu = options.menu || null;
    }

    /**
     * The type of the menu item.
     */
    get type(): Menu.ItemType {
      return this._type;
    }

    /**
     * The command to execute when the item is triggered.
     */
    get command(): string {
      return this._command;
    }

    /**
     * The arguments for the command.
     */
    get args(): JSONObject {
      return this._args;
    }

    /**
     * The menu for a `'submenu'` type item.
     */
    get menu(): Menu {
      return this._menu;
    }

    /**
     * The display label for the menu item.
     */
    get label(): string {
      if (this._type === 'command') {
        return this._commands.label(this._command, this._args);
      }
      if (this._type === 'submenu' && this._menu) {
        return this._menu.title.label;
      }
      return '';
    }

    /**
     * The mnemonic index for the menu item.
     */
    get mnemonic(): number {
      if (this._type === 'command') {
        return this._commands.mnemonic(this._command, this._args);
      }
      if (this._type === 'submenu' && this._menu) {
        return this._menu.title.mnemonic;
      }
      return -1;
    }

    /**
     * The icon class for the menu item.
     */
    get icon(): string {
      if (this._type === 'command') {
        return this._commands.icon(this._command, this._args);
      }
      if (this._type === 'submenu' && this._menu) {
        return this._menu.title.icon;
      }
      return '';
    }

    /**
     * The display caption for the menu item.
     */
    get caption(): string {
      if (this._type === 'command') {
        return this._commands.caption(this._command, this._args);
      }
      if (this._type === 'submenu' && this._menu) {
        return this._menu.title.caption;
      }
      return '';
    }

    /**
     * The extra class name for the menu item.
     */
    get className(): string {
      if (this._type === 'command') {
        return this._commands.className(this._command, this._args);
      }
      if (this._type === 'submenu' && this._menu) {
        return this._menu.title.className;
      }
      return '';
    }

    /**
     * Whether the menu item is enabled.
     */
    get isEnabled(): boolean {
      if (this._type === 'command') {
        return this._commands.isEnabled(this._command, this._args);
      }
      if (this._type === 'submenu') {
        return this._menu !== null;
      }
      return true;
    }

    /**
     * Whether the menu item is toggled.
     */
    get isToggled(): boolean {
      if (this._type === 'command') {
        return this._commands.isToggled(this._command, this._args);
      }
      return false;
    }

    /**
     * Whether the menu item is visible.
     */
    get isVisible(): boolean {
      if (this._type === 'command') {
        return this._commands.isVisible(this._command, this._args);
      }
      if (this._type === 'submenu') {
        return this._menu !== null;
      }
      return true;
    }

    /**
     * The key binding for the menu item.
     */
    get keyBinding(): Keymap.IBinding {
      if (this._type === 'command') {
        return this._keymap.findBinding(this._command, this._args);
      }
      return null;
    }

    private _commands: CommandRegistry;
    private _keymap: Keymap;
    private _type: Menu.ItemType;
    private _command: string;
    private _args: JSONObject;
    private _menu: Menu;
  }
}
