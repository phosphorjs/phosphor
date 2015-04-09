/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import algo = collections.algorithm;

import IMessage = core.IMessage;

import Size = utility.Size;
import hitTest = utility.hitTest;


/**
 * The class name added to a menu bar widget.
 */
var MENU_BAR_CLASS = 'p-MenuBar';

/**
 * The class name assigned to an open menu bar menu.
 */
var MENU_CLASS = 'p-MenuBar-menu';

/**
 * The class name assigned to a menu item.
 */
var MENU_ITEM_CLASS = 'p-MenuBar-item';

/**
 * The class name added to a menu item icon cell.
 */
var ICON_CLASS = 'p-MenuBar-item-icon';

/**
 * The class name added to a menu item text cell.
 */
var TEXT_CLASS = 'p-MenuBar-item-text';

/**
 * The class name added to a separator type menu item.
 */
var SEPARATOR_TYPE_CLASS = 'p-mod-separator-type';

/**
 * The class name added to active menu items.
 */
var ACTIVE_CLASS = 'p-mod-active';

/**
 * The class name added to active menu items.
 */
var SELECTED_CLASS = 'p-mod-selected';

/**
 * The class name added to a disabled menu item.
 */
var DISABLED_CLASS = 'p-mod-disabled';


/**
 * A leaf widget which displays menu items as a menu bar.
 */
export
class MenuBar extends Widget {
  /**
   * Construct a new menu bar.
   */
  constructor(items?: MenuItem[]) {
    super();
    this.addClass(MENU_BAR_CLASS);
    this.verticalSizePolicy = SizePolicy.Fixed;
    if (items) items.forEach(it => this.addItem(it));
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this._closeChildMenu();
    this.clearItems();
    super.dispose();
  }

  /**
   * Get the child menu of the menu bar.
   *
   * This will be null if the menu bar does not have an open menu.
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
   * Only an enabled non-separator item can be set as the active item.
   */
  set activeIndex(index: number) {
    var ok = isSelectable(this._items[index]);
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
   * Only an enabled non-separator item can be set as the active item.
   */
  set activeItem(item: MenuItem) {
    this.activeIndex = this._items.indexOf(item);
  }

  /**
   * Get the number of menu items in the menu bar.
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
   * Add a menu item to the end of the menu bar.
   *
   * Returns the new index of the item.
   */
  addItem(item: MenuItem): number {
    return this.insertItem(this._items.length, item);
  }

  /**
   * Insert a menu item into the menu bar at the given index.
   *
   * Returns the new index of the item.
   */
  insertItem(index: number, item: MenuItem): number {
    index = Math.max(0, Math.min(index | 0, this._items.length));
    algo.insert(this._items, index, item);
    this.itemInserted(index, item);
    return index;
  }

  /**
   * Remove and return the menu item at the given index.
   */
  removeAt(index: number): MenuItem {
    index = index | 0;
    var item = algo.removeAt(this._items, index);
    if (item) this.itemRemoved(index, item);
    return item;
  }

  /**
   * Remove the given menu item from the menu bar.
   *
   * Returns the index of the removed item.
   */
  removeItem(item: MenuItem): number {
    var index = this._items.indexOf(item);
    if (index !== -1) this.removeAt(index);
    return index;
  }

  /**
   * Remove all menu items from the menu bar.
   */
  clearItems(): void {
    var items = this._items;
    while (items.length) {
      var item = items.pop();
      var index = items.length;
      this.itemRemoved(index, item);
    }
  }

  /**
   * Activate the next non-separator menu item.
   *
   * This is equivalent to pressing the right arrow key.
   */
  activateNextItem(): void {
    var fromIndex = this._activeIndex + 1;
    var i = algo.findIndex(this._items, isSelectable, fromIndex, true);
    this._setActiveIndex(i);
    var menu = this._childMenu;
    if (menu) menu.activateNextItem();
  }

  /**
   * Activate the previous non-separator menu item.
   *
   * This is equivalent to pressing the left arrow key.
   */
  activatePreviousItem(): void {
    var fromIndex = Math.max(-1, this._activeIndex - 1);
    var i = algo.findLastIndex(this._items, isSelectable, fromIndex, true);
    this._setActiveIndex(i);
    var menu = this._childMenu;
    if (menu) menu.activateNextItem();
  }

  /**
   * Activate the next menu item with the given mnemonic key.
   *
   * This is equivalent to pressing the mnemonic key.
   */
  activateMnemonicItem(key: string): void {
    key = key.toUpperCase();
    var i = algo.findIndex(this._items, it => {
      return isSelectable(it) && it.mnemonic.toUpperCase() === key;
    }, this._activeIndex + 1, true);
    this._setActiveIndex(i);
    var menu = this._childMenu;
    if (menu) menu.activateNextItem();
  }

  /**
   * Open the submenu of the active menu item.
   *
   * This is equivalent to pressing the down arrow key.
   *
   * Returns true if the item was opened, false otherwise.
   */
  openActiveItem(): boolean {
    var index = this._activeIndex;
    var item = this._items[index];
    if (!item) {
      return false;
    }
    this._setState(MBState.Active);
    this._setActiveIndex(index);
    var menu = this._childMenu;
    if (menu) menu.activateNextItem();
    return true;
  }

  /**
   * Compute the size hint for the menu bar.
   */
  sizeHint(): Size {
    return this.minSizeHint();
  }

  /**
   * Compute the minimum size hint for the menu bar.
   */
  minSizeHint(): Size {
    return new Size(0, this.boxSizing.minHeight);
  }

  /**
   * A method called when a menu item is inserted into the menu bar.
   */
  protected itemInserted(index: number, item: MenuItem): void {
    if (this._activeIndex !== -1) {
      this._setState(MBState.Inactive);
      this._setActiveIndex(-1);
    }
    var node = createItemNode(item);
    var next = this._nodes[index];
    this.node.insertBefore(node, next);
    algo.insert(this._nodes, index, node);
    item.changed.connect(this._mi_changed, this);
  }

  /**
   * A method called when a menu item is removed from the menu bar.
   */
  protected itemRemoved(index: number, item: MenuItem): void {
    if (this._activeIndex !== -1) {
      this._setState(MBState.Inactive);
      this._setActiveIndex(-1);
    }
    var node = algo.removeAt(this._nodes, index);
    this.node.removeChild(node);
    item.changed.disconnect(this._mi_changed, this);
  }

  /**
   * Create the DOM node for the panel.
   */
  protected createNode(): HTMLElement {
    return document.createElement('ul');
  }

  /**
   * A method invoked on the 'after-attach' event.
   */
  protected onAfterAttach(msg: IMessage): void {
    this.node.addEventListener('mousedown', <any>this);
    this.node.addEventListener('mousemove', <any>this);
    this.node.addEventListener('mouseleave', <any>this);
  }

  /**
   * A method invoked on the 'after-detach' event.
   */
  protected onAfterDetach(msg: IMessage): void {
    this.node.removeEventListener('mousedown', <any>this);
    this.node.removeEventListener('mousemove', <any>this);
    this.node.removeEventListener('mouseleave', <any>this);
  }

  /**
   * Handle the DOM events for the menu bar.
   */
  protected handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(<MouseEvent>event);
      break;
    case 'mousemove':
      this._evtMouseMove(<MouseEvent>event);
      break;
    case 'mouseleave':
      this._evtMouseLeave(<MouseEvent>event);
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
   * Handle the 'mousedown' event for the menu bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    var x = event.clientX;
    var y = event.clientY;
    if (this._state === MBState.Inactive) {
      if (event.button !== 0) {
        return;
      }
      var index = algo.findIndex(this._nodes, n => hitTest(n, x, y));
      if (!isSelectable(this._items[index])) {
        return;
      }
      this._setState(MBState.Active);
      this._setActiveIndex(index);
    } else {
      if (hitTestMenus(this._childMenu, x, y)) {
        return;
      }
      this._setState(MBState.Inactive);
      var index = algo.findIndex(this._nodes, n => hitTest(n, x, y));
      var ok = isSelectable(this._items[index]);
      this._setActiveIndex(ok ? index : -1);
    }
  }

  /**
   * Handle the 'mousemove' event for the menu bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    var x = event.clientX;
    var y = event.clientY;
    var index = algo.findIndex(this._nodes, n => hitTest(n, x, y));
    if (index === this._activeIndex) {
      return;
    }
    if (index === -1 && this._state === MBState.Active) {
      return;
    }
    var ok = isSelectable(this._items[index]);
    this._setActiveIndex(ok ? index : -1);
  }

  /**
   * Handle the 'mouseleave' event for the menu bar.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    if (this._state === MBState.Inactive) {
      this._setActiveIndex(-1);
    }
  }

  /**
   * Handle the 'keydown' event for the menu bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    var menu = this._childMenu;
    var leaf = menu && Menu.leafMenu(menu);
    switch (event.keyCode) {
    case 13:  // Enter
      event.preventDefault();
      if (leaf) leaf.triggerActiveItem();
      break;
    case 27:  // Escape
      event.preventDefault();
      if (leaf && leaf !== menu) {
        leaf.close();
      } else {
        this._setState(MBState.Inactive);
        this._setActiveIndex(-1);
      }
      break;
    case 37:  // Left Arrow
      event.preventDefault();
      if (leaf && leaf !== menu) {
        leaf.close();
      } else {
        this.activatePreviousItem();
      }
      break;
    case 38:  // Up Arrow
      event.preventDefault();
      if (leaf) leaf.activatePreviousItem();
      break;
    case 39:  // Right Arrow
      event.preventDefault();
      if (!leaf || !leaf.openActiveItem()) {
        this.activateNextItem();
      }
      break;
    case 40:  // Down Arrow
      event.preventDefault();
      if (leaf) leaf.activateNextItem();
      break;
    }
  }

  /**
   * Handle the 'keypress' event for the menu bar.
   */
  private _evtKeyPress(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
    var str = String.fromCharCode(event.charCode);
    if (this._childMenu) {
      Menu.leafMenu(this._childMenu).activateMnemonicItem(str);
    } else {
      this.activateMnemonicItem(str)
    }
  }

  /**
   * Set the active item index for the menu bar.
   *
   * If the index points to an item, it is assumed to be selectable.
   *
   * This will take the appropriate action based on the menu bar state.
   */
  private _setActiveIndex(index: number): void {
    var curr = this._nodes[this._activeIndex];
    var next = this._nodes[index];
    this._activeIndex = index;
    if (curr) {
      curr.classList.remove(ACTIVE_CLASS);
      curr.classList.remove(SELECTED_CLASS);
    }
    if (next) {
      next.classList.add(ACTIVE_CLASS);
    }
    if (next && this._state !== MBState.Inactive) {
      next.classList.add(SELECTED_CLASS);
    }
    this._closeChildMenu();
    if (!next || this._state !== MBState.Active) {
      return;
    }
    var item = this._items[index];
    if (!item.submenu) {
      return;
    }
    this._openChildMenu(item.submenu, next);
  }

  /**
   * Open the menu item's submenu using the node for location.
   */
  private _openChildMenu(menu: Menu, node: HTMLElement): void {
    var rect = node.getBoundingClientRect();
    this._childMenu = menu;
    menu.node.classList.add(MENU_CLASS);
    menu.closed.connect(this._mn_closed, this);
    menu.open(rect.left, rect.bottom, false, true);
  }

  /**
   * Close the current child menu, if one exists.
   */
  private _closeChildMenu(): void  {
    if (this._childMenu) {
      this._childMenu.node.classList.remove(MENU_CLASS);
      this._childMenu.closed.disconnect(this._mn_closed, this);
      this._childMenu.close();
      this._childMenu = null;
    }
  }

  /**
   * Set the state mode for the menu bar.
   *
   * This will update the menu bar event listeners accordingly.
   */
  private _setState(state: MBState): void {
    if (state === this._state) {
      return;
    }
    if (state === MBState.Inactive) {
      this._useInactiveListeners();
    } else {
      this._useActiveListeners();
    }
    this._state = state;
  }

  /**
   * Update the event listeners for the inactive state.
   */
  private _useInactiveListeners(): void {
    setTimeout(() => {
      this.node.addEventListener('mousedown', <any>this);
      document.removeEventListener('mousedown', <any>this, true);
      document.removeEventListener('keydown', <any>this, true);
      document.removeEventListener('keypress', <any>this, true);
    }, 0);
  }

  /**
   * Update the event listeners for the active and open states.
   */
  private _useActiveListeners(): void {
    setTimeout(() => {
      this.node.removeEventListener('mousedown', <any>this);
      document.addEventListener('mousedown', <any>this, true);
      document.addEventListener('keydown', <any>this, true);
      document.addEventListener('keypress', <any>this, true);
    }, 0);
  }

  /**
   * Handle the `closed` signal from the child menu.
   */
  private _mn_closed(sender: Menu): void {
    sender.closed.disconnect(this._mn_closed, this);
    sender.node.classList.remove(MENU_CLASS);
    this._childMenu = null;
    this._setState(MBState.Inactive);
    this._setActiveIndex(-1);
  }

  /**
   * Handle the `changed` signal from a menu item.
   */
  private _mi_changed(sender: MenuItem): void {
    var items = this._items;
    var nodes = this._nodes;
    for (var i = 0, n = items.length; i < n; ++i) {
      if (items[i] !== sender) {
        continue;
      }
      if (i === this._activeIndex) {
        this._setState(MBState.Inactive);
        this._setActiveIndex(-1);
      }
      initItemNode(sender, nodes[i]);
    }
  }

  private _childMenu: Menu = null;
  private _items: MenuItem[] = [];
  private _nodes: HTMLElement[] = [];
  private _state = MBState.Inactive;
  private _activeIndex = -1;
}


/**
 * An internal enum describing the current state of the menu bar.
 */
enum MBState { Inactive, Active };


/**
 * Test whether the menu bar item is selectable.
 *
 * This returns true if the item is enabled and not a separator.
 */
function isSelectable(item: MenuItem): boolean {
  return item && item.type !== 'separator' && item.enabled;
}


/**
 * Hit test the chain menus for the given client position.
 */
function hitTestMenus(menu: Menu, x: number, y: number): boolean {
  while (menu) {
    if (hitTest(menu.node, x, y)) {
      return true;
    }
    menu = menu.childMenu;
  }
  return false;
}


/**
 * Create and initialize the node for a menu item.
 */
function createItemNode(item: MenuItem): HTMLElement {
  var node = document.createElement('li');
  var icon = document.createElement('span');
  var text = document.createElement('span');
  icon.className = ICON_CLASS;
  text.className = TEXT_CLASS;
  node.appendChild(icon);
  node.appendChild(text);
  initItemNode(item, node);
  return node;
}


/**
 * Initialize the node for a menu item.
 *
 * This can be called again to update the node state.
 */
function initItemNode(item: MenuItem, node: HTMLElement): void {
  var classParts = [MENU_ITEM_CLASS];
  if (item.className) {
    classParts.push(item.className);
  }
  if (item.type === 'separator') {
    classParts.push(SEPARATOR_TYPE_CLASS);
  }
  if (!item.enabled) {
    classParts.push(DISABLED_CLASS);
  }
  node.className = classParts.join(' ');
  (<HTMLElement>node.children[1]).textContent = item.text;
}

} // module phosphor.widgets
