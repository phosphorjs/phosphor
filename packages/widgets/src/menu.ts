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
  CommandRegistry
} from '@phosphor/commands';

import {
  JSONExt, ReadonlyJSONObject
} from '@phosphor/coreutils';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  getKeyboardLayout
} from '@phosphor/keyboard';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  ARIAAttrNames, ElementARIAAttrs, ElementDataset, VirtualDOM, VirtualElement, h
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
    this.addClass('p-Menu');
    this.setFlag(Widget.Flag.DisallowLayout);
    this.commands = options.commands;
    this.renderer = options.renderer || Menu.defaultRenderer;
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
  get menuRequested(): ISignal<this, 'next' | 'previous'> {
    return this._menuRequested;
  }

  /**
   * The command registry used by the menu.
   */
  readonly commands: CommandRegistry;

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
    return this.node.getElementsByClassName('p-Menu-content')[0] as HTMLUListElement;
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
    let start = ai < n - 1 ? ai + 1 : 0;
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
    if (this.commands.isEnabled(command, args)) {
      this.commands.execute(command, args);
    } else {
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
    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

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
    // Close the menu if it's attached.
    if (this.isAttached) {
      this.close();
    }

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
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('mouseup', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseenter', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
    document.addEventListener('mousedown', this, true);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
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
    if (this.isAttached) {
      this.node.focus();
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let items = this._items;
    let renderer = this.renderer;
    let activeIndex = this._activeIndex;
    let collapsedFlags = Private.computeCollapsed(items);
    let content = new Array<VirtualElement>(items.length);
    for (let i = 0, n = items.length; i < n; ++i) {
      let item = items[i];
      let active = i === activeIndex;
      let collapsed = collapsedFlags[i];
      content[i] = renderer.renderItem({ item, active, collapsed });
    }
    VirtualDOM.render(content, this.contentNode);
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
      parentMenu._childIndex = -1;
      parentMenu._childMenu = null;
      parentMenu.activate();
    }

    // Emit the `aboutToClose` signal if the menu is attached.
    if (this.isAttached) {
      this._aboutToClose.emit(undefined);
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
        this._menuRequested.emit('previous');
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
        this.rootMenu._menuRequested.emit('next');
      }
      return;
    }

    // Down Arrow
    if (kc === 40) {
      this.activateNextItem();
      return;
    }

    // Get the pressed key character.
    let key = getKeyboardLayout().keyForKeydownEvent(event);

    // Bail if the key is not valid.
    if (!key) {
      return;
    }

    // Search for the next best matching mnemonic item.
    let start = this._activeIndex + 1;
    let result = Private.findMnemonic(this._items, key, start);

    // Handle the requested mnemonic based on the search results.
    // If exactly one mnemonic is matched, that item is triggered.
    // Otherwise, the next mnemonic is activated if available,
    // followed by the auto mnemonic if available.
    if (result.index !== -1 && !result.multiple) {
      this.activeIndex = result.index;
      this.triggerActiveItem();
    } else if (result.index !== -1) {
      this.activeIndex = result.index;
    } else if (result.auto !== -1) {
      this.activeIndex = result.auto;
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
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY);
    });

    // Bail early if the mouse is already over the active index.
    if (index === this._activeIndex) {
      return;
    }

    // Update and coerce the active index.
    this.activeIndex = index;
    index = this.activeIndex;

    // If the index is the current child index, cancel the timers.
    if (index === this._childIndex) {
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
    if (!item || item.type !== 'submenu' || !item.submenu) {
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
    let { clientX, clientY } = event;
    if (ElementExt.hitTest(this._childMenu.node, clientX, clientY)) {
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
    if (!item || item.type !== 'submenu' || !item.submenu) {
      this._closeChildMenu();
      return;
    }

    // Do nothing if the child menu will not change.
    let submenu = item.submenu;
    if (submenu === this._childMenu) {
      return;
    }

    // Ensure the current child menu is closed.
    this._closeChildMenu();

    // Update the private child state.
    this._childMenu = submenu;
    this._childIndex = this._activeIndex;

    // Set the parent menu reference for the child.
    submenu._parentMenu = this;

    // Ensure the menu is updated and lookup the item node.
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
    let itemNode = this.contentNode.children[this._activeIndex];

    // Open the submenu at the active node.
    Private.openSubmenu(submenu, itemNode as HTMLElement);

    // Activate the first item if desired.
    if (activateFirst) {
      submenu.activeIndex = -1;
      submenu.activateNextItem();
    }

    // Activate the child menu.
    submenu.activate();
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
      this._openTimerID = window.setTimeout(() => {
        this._openTimerID = 0;
        this._openChildMenu();
      }, Private.TIMER_DELAY);
    }
  }

  /**
   * Start the close timer, unless it is already pending.
   */
  private _startCloseTimer(): void {
    if (this._closeTimerID === 0) {
      this._closeTimerID = window.setTimeout(() => {
        this._closeTimerID = 0;
        this._closeChildMenu();
      }, Private.TIMER_DELAY);
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

  private _childIndex = -1;
  private _activeIndex = -1;
  private _openTimerID = 0;
  private _closeTimerID = 0;
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
   * An options object for creating a menu.
   */
  export
  interface IOptions {
    /**
     * The command registry for use with the menu.
     */
    commands: CommandRegistry;

    /**
     * A custom renderer for use with the menu.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
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
     * The default value is an empty object.
     */
    args?: ReadonlyJSONObject;

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
    readonly args: ReadonlyJSONObject;

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
     * @deprecated Use `iconClass` instead.
     */
    readonly icon: string;

    /**
     * The icon class for the menu item.
     */
    readonly iconClass: string;

    /**
     * The icon label for the menu item.
     */
    readonly iconLabel: string;

    /**
     * The display caption for the menu item.
     */
    readonly caption: string;

    /**
     * The extra class name for the menu item.
     */
    readonly className: string;

    /**
     * The dataset for the menu item.
     */
    readonly dataset: CommandRegistry.Dataset;

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
    readonly keyBinding: CommandRegistry.IKeyBinding | null;
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
      let attr = this.createItemARIA(data);
      return (
        h.li({ className, dataset, ...attr },
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
      let className = this.createIconClass(data);
      return h.div({ className }, data.item.iconLabel);
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
      return h.div({ className: 'p-Menu-itemLabel' }, content);
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
      return h.div({ className: 'p-Menu-itemShortcut' }, content);
    }

    /**
     * Render the submenu icon element for a menu item.
     *
     * @param data - The data to use for rendering the submenu icon.
     *
     * @returns A virtual element representing the submenu icon.
     */
    renderSubmenu(data: IRenderData): VirtualElement {
      return h.div({ className: 'p-Menu-itemSubmenuIcon' });
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
      let name = 'p-Menu-item';

      // Add the boolean state classes.
      if (!data.item.isEnabled) {
        name += ' p-mod-disabled';
      }
      if (data.item.isToggled) {
        name += ' p-mod-toggled';
      }
      if (!data.item.isVisible) {
        name += ' p-mod-hidden';
      }
      if (data.active) {
        name += ' p-mod-active';
      }
      if (data.collapsed) {
        name += ' p-mod-collapsed';
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
      let result: ElementDataset;
      let { type, command, dataset } = data.item;
      if (type === 'command') {
        result = { ...dataset, type, command };
      } else {
        result = { ...dataset, type };
      }
      return result;
    }

    /**
     * Create the class name for the menu item icon.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the item icon.
     */
    createIconClass(data: IRenderData): string {
      let name = 'p-Menu-itemIcon';
      let extra = data.item.iconClass;
      return extra ? `${name} ${extra}` : name;
    }

    createItemARIA(data: IRenderData): ElementARIAAttrs {
      let aria: {[T in ARIAAttrNames]?: string} = {};
      switch (data.item.type) {
      case 'separator':
        aria.role = 'presentation';
        break;
      case 'submenu':
        aria['aria-haspopup'] = 'true';
        break;
      default:
        aria.role = 'menuitem';
      }
      return aria;
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
      let { label, mnemonic } = data.item;

      // If the index is out of range, do not modify the label.
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label;
      }

      // Split the label into parts.
      let prefix = label.slice(0, mnemonic);
      let suffix = label.slice(mnemonic + 1);
      let char = label[mnemonic];

      // Wrap the mnemonic character in a span.
      let span = h.span({ className: 'p-Menu-itemMnemonic' }, char);

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
      return kb ? kb.keys.map(CommandRegistry.formatKeystroke).join(', ') : null;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The ms delay for opening and closing a submenu.
   */
  export
  const TIMER_DELAY = 300;

  /**
   * The horizontal pixel overlap for an open submenu.
   */
  export
  const SUBMENU_OVERLAP = 3;

  /**
   * Create the DOM node for a menu.
   */
  export
  function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = 'p-Menu-content';
    content.setAttribute('role', 'menu');
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
    return new MenuItem(owner.commands, options);
  }

  /**
   * Hit test a menu hierarchy starting at the given root.
   */
  export
  function hitTestMenus(menu: Menu, x: number, y: number): boolean {
    for (let temp: Menu | null = menu; temp; temp = temp.childMenu) {
      if (ElementExt.hitTest(temp.node, x, y)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Compute which extra separator items should be collapsed.
   */
  export
  function computeCollapsed(items: ReadonlyArray<Menu.IItem>): boolean[] {
    // Allocate the return array and fill it with `false`.
    let result = new Array<boolean>(items.length);
    ArrayExt.fill(result, false);

    // Collapse the leading separators.
    let k1 = 0;
    let n = items.length;
    for (; k1 < n; ++k1) {
      let item = items[k1];
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        break;
      }
      result[k1] = true;
    }

    // Hide the trailing separators.
    let k2 = n - 1;
    for (; k2 >= 0; --k2) {
      let item = items[k2];
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        break;
      }
      result[k2] = true;
    }

    // Hide the remaining consecutive separators.
    let hide = false;
    while (++k1 < k2) {
      let item = items[k1];
      if (!item.isVisible) {
        continue;
      }
      if (item.type !== 'separator') {
        hide = false;
      } else if (hide) {
        result[k1] = true;
      } else {
        hide = true;
      }
    }

    // Return the resulting flags.
    return result;
  }

  /**
   * Open a menu as a root menu at the target location.
   */
  export
  function openRootMenu(menu: Menu, x: number, y: number, forceX: boolean, forceY: boolean): void {
    // Ensure the menu is updated before attaching and measuring.
    MessageLoop.sendMessage(menu, Widget.Msg.UpdateRequest);

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
  function openSubmenu(submenu: Menu, itemNode: HTMLElement): void {
    // Ensure the menu is updated before opening.
    MessageLoop.sendMessage(submenu, Widget.Msg.UpdateRequest);

    // Get the current position and size of the main viewport.
    let px = window.pageXOffset;
    let py = window.pageYOffset;
    let cw = document.documentElement.clientWidth;
    let ch = document.documentElement.clientHeight;

    // Compute the maximum allowed height for the menu.
    let maxHeight = ch;

    // Fetch common variables.
    let node = submenu.node;
    let style = node.style;

    // Clear the menu geometry and prepare it for measuring.
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
    style.visibility = 'hidden';
    style.maxHeight = `${maxHeight}px`;

    // Attach the menu to the document.
    Widget.attach(submenu, document.body);

    // Measure the size of the menu.
    let { width, height } = node.getBoundingClientRect();

    // Compute the box sizing for the menu.
    let box = ElementExt.boxSizing(submenu.node);

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
   * The results of a mnemonic search.
   */
  export
  interface IMnemonicResult {
    /**
     * The index of the first matching mnemonic item, or `-1`.
     */
    index: number;

    /**
     * Whether multiple mnemonic items matched.
     */
    multiple: boolean;

    /**
     * The index of the first auto matched non-mnemonic item.
     */
    auto: number;
  }

  /**
   * Find the best matching mnemonic item.
   *
   * The search starts at the given index and wraps around.
   */
  export
  function findMnemonic(items: ReadonlyArray<Menu.IItem>, key: string, start: number): IMnemonicResult {
    // Setup the result variables.
    let index = -1;
    let auto = -1;
    let multiple = false;

    // Normalize the key to upper case.
    let upperKey = key.toUpperCase();

    // Search the items from the given start index.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Compute the wrapped index.
      let k = (i + start) % n;

      // Lookup the item
      let item = items[k];

      // Ignore items which cannot be activated.
      if (!canActivate(item)) {
        continue;
      }

      // Ignore items with an empty label.
      let label = item.label;
      if (label.length === 0) {
        continue;
      }

      // Lookup the mnemonic index for the label.
      let mn = item.mnemonic;

      // Handle a valid mnemonic index.
      if (mn >= 0 && mn < label.length) {
        if (label[mn].toUpperCase() === upperKey) {
          if (index === -1) {
            index = k;
          } else {
            multiple = true;
          }
        }
        continue;
      }

      // Finally, handle the auto index if possible.
      if (auto === -1 && label[0].toUpperCase() === upperKey) {
        auto = k;
      }
    }

    // Return the search results.
    return { index, multiple, auto };
  }

  /**
   * A concrete implementation of `Menu.IItem`.
   */
  class MenuItem implements Menu.IItem {
    /**
     * Construct a new menu item.
     */
    constructor(commands: CommandRegistry, options: Menu.IItemOptions) {
      this._commands = commands;
      this.type = options.type || 'command';
      this.command = options.command || '';
      this.args = options.args || JSONExt.emptyObject;
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
    readonly args: ReadonlyJSONObject;

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
     * @deprecated Use `iconClass` instead.
     */
    get icon(): string {
      return this.iconClass;
    }

    /**
     * The icon class for the menu item.
     */
    get iconClass(): string {
      if (this.type === 'command') {
        return this._commands.iconClass(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.iconClass;
      }
      return '';
    }

    /**
     * The icon label for the menu item.
     */
    get iconLabel(): string {
      if (this.type === 'command') {
        return this._commands.iconLabel(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.iconLabel;
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
     * The dataset for the menu item.
     */
    get dataset(): CommandRegistry.Dataset {
      if (this.type === 'command') {
        return this._commands.dataset(this.command, this.args);
      }
      if (this.type === 'submenu' && this.submenu) {
        return this.submenu.title.dataset;
      }
      return {};
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
    get keyBinding(): CommandRegistry.IKeyBinding | null {
      if (this.type === 'command') {
        let { command, args } = this;
        return ArrayExt.findLastValue(this._commands.keyBindings, kb => {
          return kb.command === command && JSONExt.deepEqual(kb.args, args);
        }) || null;
      }
      return null;
    }

    private _commands: CommandRegistry;
  }
}
