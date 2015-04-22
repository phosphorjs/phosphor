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
 * The class name added to a menu bar content node.
 */
var CONTENT_CLASS = 'p-MenuBar-content';

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
 * The class name added to a hidden menu item.
 */
var HIDDEN_CLASS = 'p-mod-hidden';

/**
 * The class name added to a force hidden menu item.
 */
var FORCE_HIDDEN_CLASS = 'p-mod-force-hidden';


/**
 * A leaf widget which displays menu items as a menu bar.
 */
export
class MenuBar extends Widget {
  /**
   * Create the DOM node for a menu bar.
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    var content = document.createElement('ul');
    content.className = CONTENT_CLASS;
    node.appendChild(content);
    return node;
  }

  /**
   * Create the DOM node for a MenuItem.
   *
   * This can be reimplemented to create custom menu item nodes.
   */
  static createItemNode(item: MenuItem): HTMLElement {
    var node = document.createElement('li');
    var icon = document.createElement('span');
    var text = document.createElement('span');
    icon.className = ICON_CLASS;
    text.className = TEXT_CLASS;
    node.appendChild(icon);
    node.appendChild(text);
    this.initItemNode(item, node);
    return node;
  }

  /**
   * Initialize the DOM node for the given menu item.
   *
   * This method should be reimplemented if a subclass reimplements the
   * `createItemNode` method. It should initialize the node using the
   * given menu item. It will be called any time the item changes.
   */
  static initItemNode(item: MenuItem, node: HTMLElement): void {
    var parts = [MENU_ITEM_CLASS];
    if (item.className) {
      parts.push(item.className);
    }
    if (item.type === 'separator') {
      parts.push(SEPARATOR_TYPE_CLASS);
    }
    if (!item.enabled) {
      parts.push(DISABLED_CLASS);
    }
    if (!item.visible) {
      parts.push(HIDDEN_CLASS);
    }
    node.className = parts.join(' ');
    (<HTMLElement>node.children[1]).textContent = item.text;
  }

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
    this._items = null;
    this._nodes = null;
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
    this.activeIndex = this.indexOf(item);
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
    return algo.indexOf(this._items, item);
  }

  /**
   * Add a menu item to the end of the menu bar.
   *
   * Returns the new index of the item.
   */
  addItem(item: MenuItem): number {
    return this.insertItem(this.count, item);
  }

  /**
   * Insert a menu item into the menu bar at the given index.
   *
   * Returns the new index of the item.
   */
  insertItem(index: number, item: MenuItem): number {
    this.removeItem(item);
    if (this._activeIndex !== -1) {
      this._setState(MBState.Inactive);
      this._setActiveIndex(-1);
    }
    var node = (<any>this.constructor).createItemNode(item);
    index = algo.insert(this._items, index, item);
    algo.insert(this._nodes, index, node);
    item.changed.connect(this._mi_changed, this);
    this.insertItemNode(index, node);
    this._collapseSeparators();
    return index;
  }

  /**
   * Remove and return the menu item at the given index.
   */
  removeAt(index: number): MenuItem {
    if (this._activeIndex !== -1) {
      this._setState(MBState.Inactive);
      this._setActiveIndex(-1);
    }
    var item = algo.removeAt(this._items, index);
    var node = algo.removeAt(this._nodes, index);
    if (item) {
      item.changed.disconnect(this._mi_changed, this);
    }
    if (node) {
      this.removeItemNode(node);
    }
    this._collapseSeparators();
    return item;
  }

  /**
   * Remove the given menu item from the menu bar.
   *
   * Returns the index of the removed item.
   */
  removeItem(item: MenuItem): number {
    var index = this.indexOf(item);
    if (index !== -1) this.removeAt(index);
    return index;
  }

  /**
   * Remove all menu items from the menu bar.
   */
  clearItems(): void {
    while (this.count) {
      this.removeAt(this.count - 1);
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
  protected removeItemNode(node: HTMLElement): void {
    var content = this.node.firstChild;
    content.removeChild(node);
  }

  /**
   * A method invoked on the 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    this.node.addEventListener('mousedown', <any>this);
    this.node.addEventListener('mousemove', <any>this);
    this.node.addEventListener('mouseleave', <any>this);
  }

  /**
   * A method invoked on the 'after-detach' message.
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
    menu.addClass(MENU_CLASS);
    menu.closed.connect(this._mn_closed, this);
    menu.open(rect.left, rect.bottom, false, true);
  }

  /**
   * Close the current child menu, if one exists.
   */
  private _closeChildMenu(): void  {
    if (this._childMenu) {
      this._childMenu.removeClass(MENU_CLASS);
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
   * Collapse neighboring visible separators.
   *
   * This force-hides select separator nodes such that there are never
   * multiple visible separator siblings. It also force-hides all any
   * leading and trailing separator nodes.
   */
  private _collapseSeparators(): void {
    var items = this._items;
    var nodes = this._nodes;
    var hideSeparator = true;
    var lastIndex = algo.findLastIndex(items, isVisibleItem);
    for (var i = 0, n = items.length; i < n; ++i) {
      var item = items[i];
      if (item.type === 'separator') {
        if (hideSeparator || i > lastIndex) {
          nodes[i].classList.add(FORCE_HIDDEN_CLASS);
        } else if (item.visible) {
          nodes[i].classList.remove(FORCE_HIDDEN_CLASS);
          hideSeparator = true;
        }
      } else if (item.visible) {
        hideSeparator = false;
      }
    }
  }

  /**
   * Handle the `closed` signal from the child menu.
   */
  private _mn_closed(sender: Menu): void {
    sender.closed.disconnect(this._mn_closed, this);
    sender.removeClass(MENU_CLASS);
    this._childMenu = null;
    this._setState(MBState.Inactive);
    this._setActiveIndex(-1);
  }

  /**
   * Handle the `changed` signal from a menu item.
   */
  private _mi_changed(sender: MenuItem): void {
    var i = this.indexOf(sender);
    if (i === -1) {
      return;
    }
    if (i === this._activeIndex) {
      this._setState(MBState.Inactive);
      this._setActiveIndex(-1);
    }
    (<any>this.constructor).initItemNode(sender, this._nodes[i]);
    this._collapseSeparators();
  }

  private _activeIndex = -1;
  private _childMenu: Menu = null;
  private _items: MenuItem[] = [];
  private _nodes: HTMLElement[] = [];
  private _state = MBState.Inactive;
}


/**
 * An internal enum describing the current state of the menu bar.
 */
enum MBState { Inactive, Active };


/**
 * Test whether the menu item is a visible non-separator item.
 */
function isVisibleItem(item: MenuItem): boolean {
  return item && item.type !== 'separator' && item.visible;
}


/**
 * Test whether the menu bar item is selectable.
 *
 * Returns true if the item is a visible and enabled non-separator item.
 */
function isSelectable(item: MenuItem): boolean {
  return isVisibleItem(item) && item.enabled;
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

} // module phosphor.widgets
