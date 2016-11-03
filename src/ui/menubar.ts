/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each
} from '../algorithm/iteration';

import {
  move
} from '../algorithm/mutation';

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
  Message
} from '../core/messaging';

import {
  hitTest
} from '../dom/query';

import {
  Keymap
} from './keymap';

import {
  Menu
} from './menu';

import {
  Title
} from './title';

import {
  Widget, WidgetFlag
} from './widget';


/**
 * The class name added to a menu bar widget.
 */
const MENU_BAR_CLASS = 'p-MenuBar';

/**
 * The class name added to a menu bar content node.
 */
const CONTENT_CLASS = 'p-MenuBar-content';

/**
 * The class name added to an open menu bar menu.
 */
const MENU_CLASS = 'p-MenuBar-menu';

/**
 * The class name added to a menu bar item node.
 */
const ITEM_CLASS = 'p-MenuBar-item';

/**
 * The class name added to a menu bar item icon node.
 */
const ICON_CLASS = 'p-MenuBar-itemIcon';

/**
 * The class name added to a menu bar item label node.
 */
const LABEL_CLASS = 'p-MenuBar-itemLabel';

/**
 * The class name added to a menu bar item mnemonic node.
 */
const MNEMONIC_CLASS = 'p-MenuBar-itemMnemonic';

/**
 * The class name added to an active menu bar and item.
 */
const ACTIVE_CLASS = 'p-mod-active';


/**
 * A widget which displays menus as a canonical menu bar.
 */
export
class MenuBar extends Widget {
  /**
   * Construct a new menu bar.
   *
   * @param options - The options for initializing the menu bar.
   */
  constructor(options: MenuBar.IOptions) {
    super({ node: Private.createNode() });
    this.addClass(MENU_BAR_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
    this._keymap = options.keymap;
    this._renderer = options.renderer || MenuBar.defaultRenderer;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._closeChildMenu();
    this._menus.clear();
    this._nodes.clear();
    this._keymap = null;
    this._renderer = null;
    super.dispose();
  }

  /**
   * Get the menu bar content node.
   *
   * #### Notes
   * This is the node which holds the menu title nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLUListElement;
  }

  /**
   * The keymap used by the menu bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get keymap(): Keymap {
    return this._keymap;
  }

  /**
   * The renderer used by the menu bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get renderer(): MenuBar.IRenderer {
    return this._renderer;
  }

  /**
   * A read-only sequence of the menus in the menu bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get menus(): ISequence<Menu> {
    return this._menus;
  }

  /**
   * Get the child menu of the menu bar.
   *
   * #### Notes
   * This will be `null` if the menu bar does not have an open menu.
   *
   * This is a read-only property.
   */
  get childMenu(): Menu {
    return this._childMenu;
  }

  /**
   * Get the currently active menu.
   *
   * #### Notes
   * This will be `null` if no menu is active.
   */
  get activeMenu(): Menu {
    let i = this._activeIndex;
    return i !== -1 ? this._menus.at(i): null;
  }

  /**
   * Set the currently active menu.
   *
   * #### Notes
   * If the menu does not exist, the menu will be set to `null`.
   */
  set activeMenu(value: Menu) {
    this.activeIndex = indexOf(this._menus, value);
  }

  /**
   * Get the index of the currently active menu.
   *
   * #### Notes
   * This will be `-1` if no menu is active.
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * Set the index of the currently active menu.
   *
   * #### Notes
   * If the index is out of range, the index will be set to `-1`.
   */
  set activeIndex(value: number) {
    // Coerce the value to an index.
    let i = Math.floor(value);
    if (i < 0 || i >= this._menus.length) {
      i = -1;
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
   * Open the active menu and activate its first menu item.
   *
   * #### Notes
   * If there is no active menu, this is a no-op.
   */
  openActiveMenu(): void {
    // Bail early if there is no active item.
    if (this._activeIndex === -1) {
      return;
    }

    // Open the child menu.
    this._openChildMenu();

    // Activate the first item in the child menu.
    if (this._childMenu) {
      this._childMenu.activeIndex = -1;
      this._childMenu.activateNextItem();
    }
  }

  /**
   * Add a menu to the end of the menu bar.
   *
   * @param menu - The menu to add to the menu bar.
   *
   * #### Notes
   * If the menu is already added to the menu bar, it will be moved.
   */
  addMenu(menu: Menu): void {
    this.insertMenu(this._menus.length, menu);
  }

  /**
   * Insert a menu into the menu bar at the specified index.
   *
   * @param index - The index at which to insert the menu.
   *
   * @param menu - The menu to insert into the menu bar.
   *
   * #### Notes
   * The index will be clamped to the bounds of the menus.
   *
   * If the menu is already added to the menu bar, it will be moved.
   */
  insertMenu(index: number, menu: Menu): void {
    // Close the child menu before making changes.
    this._closeChildMenu();

    // Look up the index of the menu.
    let i = indexOf(this._menus, menu);

    // Clamp the insert index to the vector bounds.
    let j = Math.max(0, Math.min(Math.floor(index), this._menus.length));

    // If the menu is not in the vector, insert it.
    if (i === -1) {
      // Create the new item node for the menu.
      let node = this._renderer.createItemNode();
      this._renderer.updateItemNode(node, menu.title);

      // Insert the node and menu into the vectors.
      this._nodes.insert(j, node);
      this._menus.insert(j, menu);

      // Add the styling class to the menu.
      menu.addClass(MENU_CLASS);

      // Look up the next sibling node.
      let ref = j + 1 < this._nodes.length ? this._nodes.at(j + 1) : null;

      // Insert the item node into the content node.
      this.contentNode.insertBefore(node, ref);

      // Connect to the menu signals.
      menu.aboutToClose.connect(this._onMenuAboutToClose, this);
      menu.menuRequested.connect(this._onMenuMenuRequested, this);
      menu.title.changed.connect(this._onTitleChanged, this);

      // There is nothing more to do.
      return;
    }

    // Otherwise, the menu exists in the vector and should be moved.

    // Adjust the index if the location is at the end of the vector.
    if (j === this._menus.length) j--;

    // Bail if there is no effective move.
    if (i === j) return;

    // Move the item node and menu to the new locations.
    move(this._nodes, i, j);
    move(this._menus, i, j);

    // Look up the next sibling node.
    let ref = j + 1 < this._nodes.length ? this._nodes.at(j + 1) : null;

    // Move the node in the content node.
    this.contentNode.insertBefore(this._nodes.at(j), ref);
  }

  /**
   * Remove a menu from the menu bar.
   *
   * @param menu - The menu to remove from the menu bar.
   *
   * @returns The index occupied by the menu, or `-1` if the menu
   *   was not contained in the menu bar.
   */
  removeMenu(menu: Menu): number {
    let index = indexOf(this._menus, menu);
    if (index !== -1) this.removeMenuAt(index);
    return index;
  }

  /**
   * Remove the menu at a given index from the menu bar.
   *
   * @param index - The index of the menu to remove.
   *
   * @returns The menu occupying the index, or `null` if the index
   *   is out of range.
   */
  removeMenuAt(index: number): Menu {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._menus.length) {
      return null;
    }

    // Close the child menu before making changes.
    this._closeChildMenu();

    // Remove the node and menu from the vectors.
    let node = this._nodes.removeAt(i);
    let menu = this._menus.removeAt(i);

    // Disconnect from the menu signals.
    menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
    menu.menuRequested.disconnect(this._onMenuMenuRequested, this);
    menu.title.changed.disconnect(this._onTitleChanged, this);

    // Remove the node from the content node.
    this.contentNode.removeChild(node);

    // Remove the styling class from the menu.
    menu.removeClass(MENU_CLASS);

    // Return the removed menu.
    return menu;
  }

  /**
   * Remove all menus from the menu bar.
   */
  clearMenus(): void {
    // Bail if there is nothing to remove.
    if (this._menus.length === 0) {
      return;
    }

    // Close the child menu before making changes.
    this._closeChildMenu();

    // Disconnect from the menu signals and remove the styling class.
    each(this._menus, menu => {
      menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
      menu.menuRequested.disconnect(this._onMenuMenuRequested, this);
      menu.title.changed.disconnect(this._onTitleChanged, this);
      menu.removeClass(MENU_CLASS);
    });

    // Clear the node and menus vectors.
    this._nodes.clear();
    this._menus.clear();

    // Clear the content node.
    this.contentNode.textContent = '';
  }

  /**
   * Handle the DOM events for the menu bar.
   *
   * @param event - The DOM event sent to the menu bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the menu bar's DOM nodes. It
   * should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseleave':
      this._evtMouseLeave(event as MouseEvent);
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
    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('mousedown', this);
    this.node.removeEventListener('mousemove', this);
    this.node.removeEventListener('mouseleave', this);
    this.node.removeEventListener('contextmenu', this);
    this._closeChildMenu();
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
    // Fetch common variables.
    let menus = this._menus;
    let nodes = this._nodes;
    let renderer = this._renderer;

    // Update the state of the item nodes.
    for (let i = 0, n = menus.length; i < n; ++i) {
      renderer.updateItemNode(nodes.at(i), menus.at(i).title);
    }

    // Add the active class to the active item.
    if (this._activeIndex !== -1) {
      nodes.at(this._activeIndex).classList.add(ACTIVE_CLASS);
    }
  }

  /**
   * Handle the `'keydown'` event for the menu bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // A menu bar handles all keydown events.
    event.preventDefault();
    event.stopPropagation();

    // Fetch the key code for the event.
    let kc = event.keyCode;

    // Enter, Up Arrow, Down Arrow
    if (kc === 13 || kc === 38 || kc === 40) {
      this.openActiveMenu();
      return;
    }

    // Escape
    if (kc === 27) {
      this._closeChildMenu();
      this.activeIndex = -1;
      this.node.blur();
      return;
    }

    // Left Arrow
    if (kc === 37) {
      let i = this._activeIndex;
      let n = this._menus.length;
      this.activeIndex = i === 0 ? n - 1 : i - 1;
      return;
    }

    // Right Arrow
    if (kc === 39) {
      let i = this._activeIndex;
      let n = this._menus.length;
      this.activeIndex = i === n - 1 ? 0 : i + 1;
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

    // Search for the best mnemonic menu. This searches the menus
    // starting at the active index and finds the following:
    //   - the index of the first matching mnemonic menu
    //   - whether there are multiple matching mnemonic menus
    //   - the index of the first menu with no mnemonic, but
    //     which has a matching first character.
    let n = this._menus.length;
    let j = this._activeIndex + 1;
    for (let i = 0; i < n; ++i) {
      let k = (i + j) % n;
      let title = this._menus.at(k).title;
      if (title.label.length === 0) {
        continue;
      }
      let mn = title.mnemonic;
      if (mn >= 0 && mn < title.label.length) {
        if (title.label[mn].toUpperCase() === key) {
          if (mnIndex === -1) {
            mnIndex = k;
          } else {
            mnMultiple = true;
          }
        }
      } else if (autoIndex === -1) {
        if (title.label[0].toUpperCase() === key) {
          autoIndex = k;
        }
      }
    }

    // Handle the requested mnemonic based on the search results.
    // If exactly one mnemonic is matched, that menu is opened.
    // Otherwise, the next mnemonic is activated if available,
    // followed by the auto mnemonic if available.
    if (mnIndex !== -1 && !mnMultiple) {
      this.activeIndex = mnIndex;
      this.openActiveMenu();
    } else if (mnIndex !== -1) {
      this.activeIndex = mnIndex;
    } else if (autoIndex !== -1) {
      this.activeIndex = autoIndex;
    }
  }

  /**
   * Handle the `'mousedown'` event for the menu bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Bail if the mouse press was not on the menu bar. This can occur
    // when the document listener is installed for an active menu bar.
    let x = event.clientX;
    let y = event.clientY;
    if (!hitTest(this.node, x, y)) {
      return;
    }

    // Stop the propagation of the event. Immediate propagation is
    // also stopped so that an open menu does not handle the event.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Check if the mouse is over one of the menu items.
    let i = findIndex(this._nodes, node => hitTest(node, x, y));

    // If the press was not on an item, close the child menu.
    if (i === -1) {
      this._closeChildMenu();
      return;
    }

    // If the press was not the left mouse button, do nothing further.
    if (event.button !== 0) {
      return;
    }

    // Otherwise, toggle the open state of the child menu.
    if (this._childMenu) {
      this._closeChildMenu();
      this.activeIndex = i;
    } else {
      this.activeIndex = i;
      this._openChildMenu();
    }
  }

  /**
   * Handle the `'mousemove'` event for the menu bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Check if the mouse is over one of the menu items.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(this._nodes, node => hitTest(node, x, y));

    // Bail early if the active index will not change.
    if (i === this._activeIndex) {
      return;
    }

    // Bail early if a child menu is open and the mouse is not over
    // an item. This allows the child menu to be kept open when the
    // mouse is over the empty part of the menu bar.
    if (i === -1 && this._childMenu) {
      return;
    }

    // Update the active index to the hovered item.
    this.activeIndex = i;

    // Open the new menu if a menu is already open.
    if (this._childMenu) {
      this._openChildMenu();
    }
  }

  /**
   * Handle the `'mouseleave'` event for the menu bar.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    // Reset the active index if there is no open menu.
    if (!this._childMenu) {
      this.activeIndex = -1;
    }
  }

  /**
   * Open the child menu at the active index immediately.
   *
   * If a different child menu is already open, it will be closed,
   * even if there is no active menu.
   */
  private _openChildMenu(): void {
    // If there is no active menu, close the current menu.
    let newMenu = this.activeMenu;
    if (!newMenu) {
      this._closeChildMenu();
      return;
    }

    // Bail, if there is no effective menu change.
    let oldMenu = this._childMenu;
    if (oldMenu === newMenu) {
      return;
    }

    // Swap the internal menu reference.
    this._childMenu = newMenu;

    // Close the current menu, or setup for the new menu.
    if (oldMenu) {
      oldMenu.close();
    } else {
      this.addClass(ACTIVE_CLASS);
      document.addEventListener('mousedown', this, true);
    }

    // Get the positioning data for the new menu.
    let node = this._nodes.at(this._activeIndex);
    let { left, bottom } = node.getBoundingClientRect();

    // Open the new menu at the computed location.
    newMenu.open(left, bottom, { forceX: true, forceY: true });
  }

  /**
   * Close the child menu immediately.
   *
   * This is a no-op if a child menu is not open.
   */
  private _closeChildMenu(): void {
    // Bail if no child menu is open.
    if (!this._childMenu) {
      return;
    }

    // Remove the active class from the menu bar.
    this.removeClass(ACTIVE_CLASS);

    // Remove the document listeners.
    document.removeEventListener('mousedown', this, true);

    // Clear the internal menu reference.
    let menu = this._childMenu;
    this._childMenu = null;

    // Close the menu.
    menu.close();

    // Reset the active index.
    this.activeIndex = -1;
  }

  /**
   * Handle the `aboutToClose` signal of a menu.
   */
  private _onMenuAboutToClose(sender: Menu): void {
    // Bail if the sender is not the child menu.
    if (sender !== this._childMenu) {
      return;
    }

    // Remove the active class from the menu bar.
    this.removeClass(ACTIVE_CLASS);

    // Remove the document listeners.
    document.removeEventListener('mousedown', this, true);

    // Clear the internal menu reference.
    this._childMenu = null;

    // Reset the active index.
    this.activeIndex = -1;
  }

  /**
   * Handle the `menuRequested` signal of a child menu.
   */
  private _onMenuMenuRequested(sender: Menu, args: 'next' | 'previous'): void {
    // Bail if the sender is not the child menu.
    if (sender !== this._childMenu) {
      return;
    }

    // Lookup the active index and menu count.
    let i = this._activeIndex;
    let n = this._menus.length;

    // Active the next requested index.
    switch (args) {
    case 'next':
      this.activeIndex = i === n - 1 ? 0 : i + 1;
      break;
    case 'previous':
      this.activeIndex = i === 0 ? n - 1 : i - 1;
      break;
    }

    // Open the active menu.
    this.openActiveMenu();
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this.update();
  }

  private _keymap: Keymap;
  private _activeIndex = -1;
  private _childMenu: Menu = null;
  private _menus = new Vector<Menu>();
  private _nodes = new Vector<HTMLLIElement>();
  private _renderer: MenuBar.IRenderer;
}


/**
 * The namespaces for the `MenuBar` class statics.
 */
export
namespace MenuBar {
  /**
   * An options object for creating a menu bar.
   */
  export
  interface IOptions {
    /**
     * The keymap to use for the menu bar.
     *
     * The layout installed on the keymap is used to translate a
     * `'keydown'` event into a mnemonic for navigation purposes.
     */
    keymap: Keymap;

    /**
     * A custom renderer for creating menu bar content.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * A renderer for use with a menu bar.
   */
  export
  interface IRenderer {
    /**
     * Create a node for a menu bar item.
     *
     * @returns A new node for a menu bar item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateItemNode` method will be called for initialization.
     */
    createItemNode(): HTMLLIElement;

    /**
     * Update an item node to reflect the state of a menu title.
     *
     * @param node - A node created by a call to `createItemNode`.
     *
     * @param title - The menu title holding the data for the node.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data in the menu title.
     */
    updateItemNode(node: HTMLLIElement, title: Title): void;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Create a node for a menu bar item.
     *
     * @returns A new node for a menu bar item.
     */
    createItemNode(): HTMLLIElement {
      let node = document.createElement('li');
      let icon = document.createElement('div');
      let label = document.createElement('div');
      node.className = ITEM_CLASS;
      icon.className = ICON_CLASS;
      label.className = LABEL_CLASS;
      node.appendChild(icon);
      node.appendChild(label);
      return node;
    }

    /**
     * Update an item node to reflect the state of a menu title.
     *
     * @param node - A node created by a call to `createItemNode`.
     *
     * @param title - The menu title holding the data for the node.
     */
    updateItemNode(node: HTMLLIElement, title: Title): void {
      let icon = node.firstChild as HTMLElement;
      let label = node.lastChild as HTMLElement;
      let itemClass = ITEM_CLASS;
      let iconClass = ICON_CLASS;
      if (title.className) itemClass += ` ${title.className}`;
      if (title.icon) iconClass += ` ${title.icon}`;
      node.className = itemClass;
      icon.className = iconClass;
      label.innerHTML = this.formatLabel(title.label, title.mnemonic);
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
   * Create the DOM node for a menu bar.
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
}
