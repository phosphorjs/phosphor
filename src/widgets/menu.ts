/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import algo = collections.algorithm;

import Signal = core.Signal;

import Size = utility.Size;
import Rect = utility.Rect;
import clientViewportRect = utility.clientViewportRect;
import createBoxSizing = utility.createBoxSizing;
import hitTest = utility.hitTest;


/**
 * The class name added to menu instances.
 */
var MENU_CLASS = 'p-Menu';

/**
 * The class name added to a menu content node.
 */
var MENU_CONTENT_CLASS = 'p-Menu-content';

/**
 * The class name assigned to a menu item.
 */
var MENU_ITEM_CLASS = 'p-Menu-item';

/**
 * The class name added to a menu item icon cell.
 */
var ICON_CLASS = 'p-Menu-item-icon';

/**
 * The class name added to a menu item text cell.
 */
var TEXT_CLASS = 'p-Menu-item-text';

/**
 * The class name added to a menu item shortcut cell.
 */
var SHORTCUT_CLASS = 'p-Menu-item-shortcut';

/**
 * The class name added to a menu item submenu icon cell.
 */
var SUBMENU_ICON_CLASS = 'p-Menu-item-submenu-icon';

/**
 * The class name added to a check type menu item.
 */
var CHECK_TYPE_CLASS = 'p-mod-check-type';

/**
 * The class name added to a separator type menu item.
 */
var SEPARATOR_TYPE_CLASS = 'p-mod-separator-type';

/**
 * The class name added to active menu items.
 */
var ACTIVE_CLASS = 'p-mod-active';

/**
 * The class name added to a disabled menu item.
 */
var DISABLED_CLASS = 'p-mod-disabled';

/**
 * The class name added to a checked menu item.
 */
var CHECKED_CLASS = 'p-mod-checked';

/**
 * The class name added to a menu item with a submenu.
 */
var HAS_SUBMENU_CLASS = 'p-mod-has-submenu';

/**
 * The delay, in ms, for opening a submenu.
 */
var OPEN_DELAY = 300;

/**
 * The delay, in ms, for closing a submenu.
 */
var CLOSE_DELAY = 300;

/**
 * The horizontal overlap to use for submenus.
 */
var SUBMENU_OVERLAP = 3;


/**
 * An object which displays menu items as a popup menu.
 */
export
class Menu {
  /**
   * Find the root menu of a menu hierarchy.
   */
  static rootMenu(menu: Menu): Menu {
    while (menu._parentMenu) {
      menu = menu._parentMenu;
    }
    return menu;
  }

  /**
   * Find the leaf menu of a menu hierarchy.
   */
  static leafMenu(menu: Menu): Menu {
    while (menu._childMenu) {
      menu = menu._childMenu;
    }
    return menu;
  }

  /**
   * A signal emitted when the menu is closed.
   */
  closed = new Signal<Menu, void>();

  /**
   * Construct a new menu.
   */
  constructor(items?: MenuItem[]) {
    this._node = this.createNode();
    this._node.classList.add(MENU_CLASS);
    if (items) items.forEach(it => this.addItem(it));
  }

  /**
   * Get the DOM node for the menu.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Get the parent menu of the menu.
   *
   * This will be null if the menu is not an open submenu.
   */
  get parentMenu(): Menu {
    return this._parentMenu;
  }

  /**
   * Get the child menu of the menu.
   *
   * This will be null if the menu does not have an open submenu.
   */
  get childMenu(): Menu {
    return this._childMenu;
  }

  /**
   * Get the index of the active (highlighted) menu item.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the active (highlighted) menu item.
   *
   * Only a non-separator item can be set as the active item.
   */
  set activeIndex(index: number) {
    var item = this._items[index];
    var ok = item && item.type !== 'separator';
    this._setActiveIndex(ok ? index : -1);
  }

  /**
   * Get the active (highlighted) menu item.
   */
  get activeItem(): MenuItem {
    return this._items[this._activeIndex];
  }

  /**
   * Set the active (highlighted) menu item.
   *
   * Only a non-separator item can be set as the active item.
   */
  set activeItem(item: MenuItem) {
    this.activeIndex = this._items.indexOf(item);
  }

  /**
   * Get the number of menu items in the menu.
   */
  get count(): number {
    return this._items.length;
  }

  /**
   * Get the menu item at the given index.
   */
  itemAt(index: number): MenuItem {
    return this._items[index];
  }

  /**
   * Get the index of the given menu item.
   */
  indexOf(item: MenuItem): number {
    return this._items.indexOf(item);
  }

  /**
   * Add a menu item to the end of the menu.
   *
   * Returns the new index of the item.
   */
  addItem(item: MenuItem): number {
    return this.insertItem(this.count, item);
  }

  /**
   * Insert a menu item into the menu at the given index.
   *
   * Returns the new index of the item.
   */
  insertItem(index: number, item: MenuItem): number {
    this.removeItem(item);
    if (this._activeIndex !== -1) {
      this._reset();
    }
    var node = this.createItemNode(item);
    index = Math.max(0, Math.min(index | 0, this.count));
    algo.insert(this._items, index, item);
    algo.insert(this._nodes, index, node);
    item.changed.connect(this._mi_changed, this);
    node.addEventListener('mouseenter', <any>this);
    this.insertItemNode(index, node);
    return index;
  }

  /**
   * Remove and return the menu item at the given index.
   */
  removeAt(index: number): MenuItem {
    if (this._activeIndex !== -1) {
      this._reset();
    }
    index = index | 0;
    var item = algo.removeAt(this._items, index);
    var node = algo.removeAt(this._nodes, index);
    if (item) {
      item.changed.disconnect(this._mi_changed, this);
    }
    if (node) {
      node.removeEventListener('mouseenter', <any>this);
      this.removeItemNode(index, node);
    }
    return item;
  }

  /**
   * Remove the given menu item from the menu.
   *
   * Returns the index of the removed item.
   */
  removeItem(item: MenuItem): number {
    var index = this.indexOf(item);
    if (index !== -1) this.removeAt(index);
    return index;
  }

  /**
   * Remove all menu items from the menu.
   */
  clearItems(): void {
    while (this.count) {
      this.removeAt(this.count - 1);
    }
  }

  /**
   * Activate the next non-separator menu item.
   *
   * This is equivalent to pressing the down arrow key.
   */
  activateNextItem(): void {
    var fromIndex = this._activeIndex + 1;
    var i = algo.findIndex(this._items, isSelectable, fromIndex, true);
    this._setActiveIndex(i);
  }

  /**
   * Activate the previous non-separator menu item.
   *
   * This is equivalent to pressing the up arrow key.
   */
  activatePreviousItem(): void {
    var fromIndex = Math.max(-1, this._activeIndex - 1);
    var i = algo.findLastIndex(this._items, isSelectable, fromIndex, true);
    this._setActiveIndex(i);
  }

  /**
   * Activate the next menu item with the given mnemonic key.
   *
   * This is equivalent to pressing the mnemonic key.
   */
  activateMnemonicItem(key: string): void {
    key = key.toUpperCase();
    var i = algo.findIndex(this._items, it => {
      return isKeyable(it) && it.mnemonic.toUpperCase() === key;
    }, this._activeIndex + 1, true);
    this._setActiveIndex(i);
  }

  /**
   * Open the submenu of the active menu item.
   *
   * This is equivalent to pressing the right arrow key.
   *
   * Returns true if the item was opened, false otherwise.
   */
  openActiveItem(): boolean {
    var index = this._activeIndex;
    var item = this._items[index];
    if (!item || !item.submenu || !item.enabled) {
      return false;
    }
    this._openChildMenu(item, this._nodes[index], false);
    this._childMenu.activateNextItem();
    return true;
  }

  /**
   * Trigger (or open) the active menu item.
   *
   * This is equivalent to pressing the enter key.
   *
   * Returns true if the item was triggered, false otherwise.
   */
  triggerActiveItem(): boolean {
    var index = this._activeIndex;
    var item = this._items[index];
    if (!item || !item.enabled) {
      return false;
    }
    if (item.submenu) {
      this._openChildMenu(item, this._nodes[index], false);
      this._childMenu.activateNextItem();
    } else {
      Menu.rootMenu(this).close();
      item.trigger();
    }
    return true;
  }

  /**
   * Popup the menu at the specified location.
   *
   * The menu will be opened at the given location unless it will not
   * fully fit on the screen. If it will not fit, it will be adjusted
   * to fit naturally on the screen. The last two optional parameters
   * control whether the provided coordinate value must be obeyed.
   *
   * When the menu is opened as a popup menu, it will handle all key
   * events related to menu navigation as well as closing the menu
   * when the mouse is pressed outside of the menu hierarchy. To
   * prevent these actions, use the 'open' method instead.
   */
  popup(x: number, y: number, forceX = false, forceY = false): void {
    var node = this._node;
    if (node.parentNode) {
      return;
    }
    node.addEventListener('mouseup', <any>this);
    node.addEventListener('mouseleave', <any>this);
    node.addEventListener('contextmenu', <any>this);
    document.addEventListener('keydown', <any>this, true);
    document.addEventListener('keypress', <any>this, true);
    document.addEventListener('mousedown', <any>this, true);
    openRootMenu(this, x, y, forceX, forceY);
  }

  /**
   * Open the menu at the specified location.
   *
   * The menu will be opened at the given location unless it will not
   * fully fit on the screen. If it will not fit, it will be adjusted
   * to fit naturally on the screen. The last two optional parameters
   * control whether the provided coordinate value must be obeyed.
   *
   * When the menu is opened with this method, it will not handle key
   * events for navigation, nor will it close itself when the mouse is
   * pressed outside the menu hierarchy. This is useful when using the
   * menu from a menubar, where this menubar should handle these tasks.
   * Use the `popup` method for the alternative behavior.
   */
  open(x: number, y: number, forceX = false, forceY = false): void {
    var node = this._node;
    if (node.parentNode) {
      return;
    }
    node.addEventListener('mouseup', <any>this);
    node.addEventListener('mouseleave', <any>this);
    node.addEventListener('contextmenu', <any>this);
    openRootMenu(this, x, y, forceX, forceY);
  }

  /**
   * Close the menu and remove it's node from the DOM.
   */
  close(): void {
    var node = this._node;
    var pnode = node.parentNode;
    if (pnode) pnode.removeChild(node);
    node.removeEventListener('mouseup', <any>this);
    node.removeEventListener('mouseleave', <any>this);
    node.removeEventListener('contextmenu', <any>this);
    document.removeEventListener('keydown', <any>this, true);
    document.removeEventListener('keypress', <any>this, true);
    document.removeEventListener('mousedown', <any>this, true);
    this._reset();
    this._removeFromParent();
    this.closed.emit(this, void 0);
  }

  /**
   * Create the DOM node for the panel.
   *
   * This can be reimplemented to create a custom menu node.
   */
  protected createNode(): HTMLElement {
    var node = document.createElement('div');
    var content = document.createElement('content');
    content.className = MENU_CONTENT_CLASS;
    node.appendChild(content);
    return node;
  }

  /**
   * Create a DOM node for the given MenuItem.
   *
   * This can be reimplemented to create custom menu item nodes.
   */
  protected createItemNode(item: MenuItem): HTMLElement {
    var node = document.createElement('li');
    var icon = document.createElement('span');
    var text = document.createElement('span');
    var shortcut = document.createElement('span');
    var submenu = document.createElement('span');
    icon.className = ICON_CLASS;
    text.className = TEXT_CLASS;
    shortcut.className = SHORTCUT_CLASS;
    submenu.className = SUBMENU_ICON_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    node.appendChild(shortcut);
    node.appendChild(submenu);
    this.initItemNode(item, node);
    return node;
  }

  /**
   * Initialize the item node for the given menu item.
   *
   * This method should be reimplemented if a subclass reimplements the
   * `createItemNode` method. It should initialize the node using the
   * given menu item. It will be called any time the item changes.
   */
  protected initItemNode(item: MenuItem, node: HTMLElement): void {
    var parts = [MENU_ITEM_CLASS];
    if (item.className) {
      parts.push(item.className);
    }
    if (item.type === 'check') {
      parts.push(CHECK_TYPE_CLASS);
    } else if (item.type === 'separator') {
      parts.push(SEPARATOR_TYPE_CLASS);
    }
    if (item.checked) {
      parts.push(CHECKED_CLASS);
    }
    if (!item.enabled) {
      parts.push(DISABLED_CLASS);
    }
    if (item.submenu) {
      parts.push(HAS_SUBMENU_CLASS);
    }
    node.className = parts.join(' ');
    (<HTMLElement>node.children[1]).textContent = item.text;
    (<HTMLElement>node.children[2]).textContent = item.shortcut;
  }

  /**
   * A method invoked when a menu item is inserted into the menu.
   *
   * This method should be reimplemented if a subclass reimplements the
   * `createNode` method. It should insert the item node into the menu
   * at the specified location.
   */
  protected insertItemNode(index: number, node: HTMLElement): void {
    var content = this.node.firstChild;
    content.insertBefore(node, content.childNodes[index]);
  }

  /**
   * A method invoked when a menu item is removed from the menu.
   *
   * This method should be reimplemented if a subclass reimplements the
   * `createNode` method. It should remove the item node from the menu.
   */
  protected removeItemNode(index: number, node: HTMLElement): void {
    var content = this.node.firstChild;
    content.removeChild(node);
  }

  /**
   * Handle the DOM events for the menu.
   */
  protected handleEvent(event: Event): void {
    switch (event.type) {
    case 'mouseenter':
      this._evtMouseEnter(<MouseEvent>event);
      break;
    case 'mouseleave':
      this._evtMouseLeave(<MouseEvent>event);
      break;
    case 'mousedown':
      this._evtMouseDown(<MouseEvent>event);
      break;
    case 'mouseup':
      this._evtMouseUp(<MouseEvent>event);
      break;
    case 'contextmenu':
      this._evtContextMenu(event);
      break;
    case 'keydown':
      this._evtKeyDown(<KeyboardEvent>event);
      break;
    case 'keypress':
      this._evtKeyPress(<KeyboardEvent>event);
      break;
    }
  }

  /**
   * Handle the 'mouseenter' event for the menu.
   *
   * This event listener is attached to the child item nodes.
   */
  private _evtMouseEnter(event: MouseEvent): void {
    // Ensure the ancestor chain is properly highlighted.
    this._syncAncestors();

    // Schedule a close for the open child menu, if any.
    this._closeChildMenu();

    // Cancel the previous open request, if any.
    this._cancelPendingOpen();

    // Find the item index corresponding to the node.
    var node = <HTMLElement>event.currentTarget;
    var index = this._nodes.indexOf(node);

    // Clear the active item if the node is not tracked.
    if (index === -1) {
      this._setActiveIndex(-1);
      return;
    }

    // Clear the active item if the target item is a separator.
    var item = this._items[index];
    if (item.type === 'separator') {
      this._setActiveIndex(-1);
      return;
    }

    // Otherwise, activate the new item.
    this._setActiveIndex(index);

    // If the item has a submenu, it should be opened. If the item
    // is already open, the close request from above is cancelled.
    // Otherwise, the new item is scheduled to be opened.
    if (item.submenu && item.enabled) {
      if (item === this._childItem) {
        this._cancelPendingClose();
      } else {
        this._openChildMenu(item, node, true);
      }
    }
  }

  /**
   * Handle the 'mouseleave' event for the menu.
   *
   * This event listener is only attached to the menu node.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    this._cancelPendingOpen();
    var child = this._childMenu;
    if (!child || !hitTest(child.node, event.clientX, event.clientY)) {
      this._setActiveIndex(-1);
      this._closeChildMenu();
    }
  }

  /**
   * Handle the 'mouseup' event for the menu.
   *
   * This event listener is attached to the menu node.
   */
  private _evtMouseUp(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (event.button !== 0) {
      return;
    }
    var x = event.clientX;
    var y = event.clientY;
    var i = algo.findIndex(this._nodes, node => hitTest(node, x, y));
    if (i === this._activeIndex) {
      this.triggerActiveItem();
    }
  }

  /**
   * Handle the 'contextmenu' event for the menu.
   *
   * This event listener is attached to the menu node and disables
   * the default browser context menu.
   */
  private _evtContextMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the 'mousedown' event for the menu.
   *
   * This event listener is attached to the document for a popup menu.
   */
  private _evtMouseDown(event: MouseEvent): void {
    var menu = this;
    var hit = false;
    var x = event.clientX;
    var y = event.clientY;
    while (!hit && menu) {
      hit = hitTest(menu.node, x, y);
      menu = menu._childMenu;
    }
    if (!hit) this.close();
  }

  /**
   * Handle the key down event for the menu.
   *
   * This event listener is attached to the document for a popup menu.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    var leaf = Menu.leafMenu(this);
    switch (event.keyCode) {
    case 13:  // Enter
      event.preventDefault();
      leaf.triggerActiveItem();
      break;
    case 27:  // Escape
      event.preventDefault();
      leaf.close();
      break;
    case 37:  // Left Arrow
      event.preventDefault();
      if (leaf !== this) leaf.close();
      break;
    case 38:  // Up Arrow
      event.preventDefault();
      leaf.activatePreviousItem();
      break;
    case 39:  // Right Arrow
      event.preventDefault();
      leaf.openActiveItem();
      break;
    case 40:  // Down Arrow
      event.preventDefault();
      leaf.activateNextItem();
      break;
    }
  }

  /**
   * Handle the 'keypress' event for the menu.
   *
   * This event listener is attached to the document for a popup menu.
   */
  private _evtKeyPress(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    var str = String.fromCharCode(event.charCode);
    Menu.leafMenu(this).activateMnemonicItem(str);
  }

  /**
   * Set the active item index for the menu.
   *
   * This updates the class name of the relevant item nodes.
   */
  private _setActiveIndex(index: number): void {
    var curr = this._nodes[this._activeIndex];
    var next = this._nodes[index];
    this._activeIndex = index;
    if (curr === next) {
      return;
    }
    if (curr) curr.classList.remove(ACTIVE_CLASS);
    if (next) next.classList.add(ACTIVE_CLASS);
  }

  /**
   * Synchronize the active item hierarchy starting with the parent.
   *
   * This ensures that the proper child items are activated for the
   * ancestor menu hierarchy and that any pending open or close
   * tasks are cleared.
   */
  private _syncAncestors(): void {
    var menu = this._parentMenu;
    while (menu) {
      menu._cancelPendingOpen();
      menu._cancelPendingClose();
      menu._syncChildItem();
      menu = menu._parentMenu;
    }
  }

  /**
   * Synchronize the active item with the item for the child menu.
   *
   * This ensures that the active item is the child menu item.
   */
  private _syncChildItem(): void {
    var index = this._items.indexOf(this._childItem);
    if (index !== -1) {
      this._setActiveIndex(index);
    }
  }

  /**
   * Open the menu item's submenu using the node for location.
   *
   * If the given item is already open, this is a no-op.
   *
   * Any pending open operation will be cancelled before opening
   * the menu or queueing the delayed task to open the menu.
   */
  private _openChildMenu(item: MenuItem, node: HTMLElement, delayed: boolean): void {
    if (item === this._childItem) {
      return;
    }
    this._cancelPendingOpen();
    if (delayed) {
      this._openTimer = setTimeout(() => {
        var menu = item.submenu;
        this._openTimer = 0;
        this._childItem = item;
        this._childMenu = menu;
        menu._parentMenu = this;
        menu._openAsSubmenu(node);
      }, OPEN_DELAY);
    } else {
      var menu = item.submenu;
      this._childItem = item;
      this._childMenu = menu;
      menu._parentMenu = this;
      menu._openAsSubmenu(node);
    }
  }

  /**
   * Open the menu as a child menu.
   */
  private _openAsSubmenu(item: HTMLElement): void {
    var node = this._node;
    node.addEventListener('mouseup', <any>this);
    node.addEventListener('mouseleave', <any>this);
    node.addEventListener('contextmenu', <any>this);
    openSubmenu(this, item);
  }

  /**
   * Close the currently open child menu using a delayed task.
   *
   * If a task is pending or if there is no child menu, this is a no-op.
   */
  private _closeChildMenu(): void {
    if (this._closeTimer || !this._childMenu) {
      return;
    }
    this._closeTimer = setTimeout(() => {
      this._closeTimer = 0;
      if (this._childMenu) {
        this._childMenu.close();
        this._childMenu = null;
        this._childItem = null;
      }
    }, CLOSE_DELAY);
  }

  /**
   * Reset the state of the menu.
   *
   * This deactivates the current item and closes the child menu.
   */
  private _reset(): void {
    this._cancelPendingOpen();
    this._cancelPendingClose();
    this._setActiveIndex(-1);
    if (this._childMenu) {
      this._childMenu.close();
      this._childMenu = null;
      this._childItem = null;
    }
  }

  /**
   * Remove the menu from its parent menu.
   */
  private _removeFromParent(): void {
    var parent = this._parentMenu;
    if (!parent) {
      return;
    }
    this._parentMenu = null;
    parent._cancelPendingOpen();
    parent._cancelPendingClose();
    parent._childMenu = null;
    parent._childItem = null;
  }

  /**
   * Cancel any pending child menu open task.
   */
  private _cancelPendingOpen(): void {
    if (this._openTimer) {
      clearTimeout(this._openTimer);
      this._openTimer = 0;
    }
  }

  /**
   * Cancel any pending child menu close task.
   */
  private _cancelPendingClose(): void {
    if (this._closeTimer) {
      clearTimeout(this._closeTimer);
      this._closeTimer = 0;
    }
  }

  /**
   * Handle the `changed` signal from a menu item.
   */
  private _mi_changed(sender: MenuItem): void {
    var i = this._items.indexOf(sender);
    if (i === -1) {
      return;
    }
    if (i === this._activeIndex) {
      this._reset();
    }
    this.initItemNode(sender, this._nodes[i]);
  }

  private _node: HTMLElement;
  private _parentMenu: Menu = null;
  private _childMenu: Menu = null;
  private _childItem: MenuItem = null;
  private _items: MenuItem[] = [];
  private _nodes: HTMLElement[] = [];
  private _activeIndex = -1;
  private _openTimer = 0;
  private _closeTimer = 0;
}


/**
 * Test whether the menu item is selectable.
 *
 * Returns true if the item is not a separator.
 */
function isSelectable(item: MenuItem): boolean {
  return item && item.type !== 'separator';
}


/**
 * Test whether the menu item is keyable for a mnemonic.
 *
 * Returns true if the item is selectable and enabled.
 */
function isKeyable(item: MenuItem): boolean {
  return isSelectable(item) && item.enabled;
}


/**
 * Mount the menu as hidden and compute its optimal size.
 */
function measureMenu(menu: Menu, vpRect: Rect, minY: number): Size {
  var node = menu.node;
  var style = node.style;
  style.top = '';
  style.left = '';
  style.width = '';
  style.height = '';
  style.visibility = 'hidden';
  document.body.appendChild(menu.node);
  var rect = node.getBoundingClientRect();
  var width = Math.ceil(rect.width);
  var height = Math.ceil(rect.height);
  var maxHeight = vpRect.height - minY;
  if (height > maxHeight) {
    height = maxHeight;
    width += 17; // adjust for scrollbar
  }
  return new Size(width, height);
}


/**
 * Show the menu with the specified geometry.
 */
function showMenu(menu: Menu, x: number, y: number, w: number, h: number): void {
  var style = menu.node.style;
  style.top = Math.max(0, y) + 'px';
  style.left = Math.max(0, x) + 'px';
  style.width = w + 'px';
  style.height = h + 'px';
  style.visibility = '';
}


/**
 * Open the menu as a root menu at the target location.
 */
function openRootMenu(menu: Menu, x: number, y: number, forceX: boolean, forceY: boolean): void {
  var vpRect = clientViewportRect();
  var size = measureMenu(menu, vpRect, forceY ? y : 0);
  if (!forceX && (x + size.width > vpRect.right)) {
    x = vpRect.right - size.width;
  }
  if (!forceY && (y + size.height > vpRect.bottom)) {
    if (y > vpRect.bottom) {
      y = vpRect.bottom - size.height;
    } else {
      y = y - size.height;
    }
  }
  showMenu(menu, x, y, size.width, size.height);
}


/**
 * Open a the menu as a submenu using the item node for positioning.
 */
function openSubmenu(menu: Menu, item: HTMLElement): void {
  var vpRect = clientViewportRect();
  var size = measureMenu(menu, vpRect, 0);
  var box = createBoxSizing(menu.node);
  var itemRect = item.getBoundingClientRect();
  var x = itemRect.right - SUBMENU_OVERLAP;
  var y = itemRect.top - box.borderTop - box.paddingTop;
  if (x + size.width > vpRect.right) {
    x = itemRect.left + SUBMENU_OVERLAP - size.width;
  }
  if (y + size.height > vpRect.bottom) {
    y = itemRect.bottom + box.borderBottom + box.paddingBottom - size.height;
  }
  showMenu(menu, x, y, size.width, size.height);
}

} // module phosphor.widgets
