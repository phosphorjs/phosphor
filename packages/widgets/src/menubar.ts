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
  ElementExt
} from '@phosphor/domutils';

import {
  getKeyboardLayout
} from '@phosphor/keyboard';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  ElementARIAAttrs, ElementDataset, VirtualDOM, VirtualElement, h
} from '@phosphor/virtualdom';

import {
  Menu
} from './menu';

import {
  Title
} from './title';

import {
  Widget
} from './widget';


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
  constructor(options: MenuBar.IOptions = {}) {
    super({ node: Private.createNode() });
    this.addClass('p-MenuBar');
    this.setFlag(Widget.Flag.DisallowLayout);
    this.renderer = options.renderer || MenuBar.defaultRenderer;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._closeChildMenu();
    this._menus.length = 0;
    super.dispose();
  }

  /**
   * The renderer used by the menu bar.
   */
  readonly renderer: MenuBar.IRenderer;

  /**
   * The child menu of the menu bar.
   *
   * #### Notes
   * This will be `null` if the menu bar does not have an open menu.
   */
  get childMenu(): Menu | null {
    return this._childMenu;
  }

  /**
   * Get the menu bar content node.
   *
   * #### Notes
   * This is the node which holds the menu title nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName('p-MenuBar-content')[0] as HTMLUListElement;
  }

  /**
   * Get the currently active menu.
   */
  get activeMenu(): Menu | null {
    return this._menus[this._activeIndex] || null;
  }

  /**
   * Set the currently active menu.
   *
   * #### Notes
   * If the menu does not exist, the menu will be set to `null`.
   */
  set activeMenu(value: Menu | null) {
    this.activeIndex = value ? this._menus.indexOf(value) : -1;
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
   * If the menu cannot be activated, the index will be set to `-1`.
   */
  set activeIndex(value: number) {
    // Adjust the value for an out of range index.
    if (value < 0 || value >= this._menus.length) {
      value = -1;
    }

    // Bail early if the index will not change.
    if (this._activeIndex === value) {
      return;
    }

    // Update the active index.
    this._activeIndex = value;

    // Schedule an update of the items.
    this.update();
  }

  /**
   * A read-only array of the menus in the menu bar.
   */
  get menus(): ReadonlyArray<Menu> {
    return this._menus;
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
    let i = this._menus.indexOf(menu);

    // Clamp the insert index to the array bounds.
    let j = Math.max(0, Math.min(index, this._menus.length));

    // If the menu is not in the array, insert it.
    if (i === -1) {
      // Insert the menu into the array.
      ArrayExt.insert(this._menus, j, menu);

      // Add the styling class to the menu.
      menu.addClass('p-MenuBar-menu');

      // Connect to the menu signals.
      menu.aboutToClose.connect(this._onMenuAboutToClose, this);
      menu.menuRequested.connect(this._onMenuMenuRequested, this);
      menu.title.changed.connect(this._onTitleChanged, this);

      // Schedule an update of the items.
      this.update();

      // There is nothing more to do.
      return;
    }

    // Otherwise, the menu exists in the array and should be moved.

    // Adjust the index if the location is at the end of the array.
    if (j === this._menus.length) {
      j--;
    }

    // Bail if there is no effective move.
    if (i === j) {
      return;
    }

    // Move the menu to the new locations.
    ArrayExt.move(this._menus, i, j);

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Remove a menu from the menu bar.
   *
   * @param menu - The menu to remove from the menu bar.
   *
   * #### Notes
   * This is a no-op if the menu is not in the menu bar.
   */
  removeMenu(menu: Menu): void {
    this.removeMenuAt(this._menus.indexOf(menu));
  }

  /**
   * Remove the menu at a given index from the menu bar.
   *
   * @param index - The index of the menu to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeMenuAt(index: number): void {
    // Close the child menu before making changes.
    this._closeChildMenu();

    // Remove the menu from the array.
    let menu = ArrayExt.removeAt(this._menus, index);

    // Bail if the index is out of range.
    if (!menu) {
      return;
    }

    // Disconnect from the menu signals.
    menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
    menu.menuRequested.disconnect(this._onMenuMenuRequested, this);
    menu.title.changed.disconnect(this._onTitleChanged, this);

    // Remove the styling class from the menu.
    menu.removeClass('p-MenuBar-menu');

    // Schedule an update of the items.
    this.update();
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
    for (let menu of this._menus) {
      menu.aboutToClose.disconnect(this._onMenuAboutToClose, this);
      menu.menuRequested.disconnect(this._onMenuMenuRequested, this);
      menu.title.changed.disconnect(this._onTitleChanged, this);
      menu.removeClass('p-MenuBar-menu');
    }

    // Clear the menus array.
    this._menus.length = 0;

    // Schedule an update of the items.
    this.update();
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
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('mousedown', this);
    this.node.addEventListener('mousemove', this);
    this.node.addEventListener('mouseleave', this);
    this.node.addEventListener('contextmenu', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
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
    if (this.isAttached) {
      this.node.focus();
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let menus = this._menus;
    let renderer = this.renderer;
    let activeIndex = this._activeIndex;
    let content = new Array<VirtualElement>(menus.length);
    for (let i = 0, n = menus.length; i < n; ++i) {
      let title = menus[i].title;
      let active = i === activeIndex;
      content[i] = renderer.renderItem({ title, active });
    }
    VirtualDOM.render(content, this.contentNode);
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

    // Get the pressed key character.
    let key = getKeyboardLayout().keyForKeydownEvent(event);

    // Bail if the key is not valid.
    if (!key) {
      return;
    }

    // Search for the next best matching mnemonic item.
    let start = this._activeIndex + 1;
    let result = Private.findMnemonic(this._menus, key, start);

    // Handle the requested mnemonic based on the search results.
    // If exactly one mnemonic is matched, that menu is opened.
    // Otherwise, the next mnemonic is activated if available,
    // followed by the auto mnemonic if available.
    if (result.index !== -1 && !result.multiple) {
      this.activeIndex = result.index;
      this.openActiveMenu();
    } else if (result.index !== -1) {
      this.activeIndex = result.index;
    } else if (result.auto !== -1) {
      this.activeIndex = result.auto;
    }
  }

  /**
   * Handle the `'mousedown'` event for the menu bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Bail if the mouse press was not on the menu bar. This can occur
    // when the document listener is installed for an active menu bar.
    if (!ElementExt.hitTest(this.node, event.clientX, event.clientY)) {
      return;
    }

    // Stop the propagation of the event. Immediate propagation is
    // also stopped so that an open menu does not handle the event.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    // Check if the mouse is over one of the menu items.
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY);
    });

    // If the press was not on an item, close the child menu.
    if (index === -1) {
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
      this.activeIndex = index;
    } else {
      this.activeIndex = index;
      this._openChildMenu();
    }
  }

  /**
   * Handle the `'mousemove'` event for the menu bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Check if the mouse is over one of the menu items.
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return ElementExt.hitTest(node, event.clientX, event.clientY);
    });

    // Bail early if the active index will not change.
    if (index === this._activeIndex) {
      return;
    }

    // Bail early if a child menu is open and the mouse is not over
    // an item. This allows the child menu to be kept open when the
    // mouse is over the empty part of the menu bar.
    if (index === -1 && this._childMenu) {
      return;
    }

    // Update the active index to the hovered item.
    this.activeIndex = index;

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

    // Bail if there is no effective menu change.
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
      this.addClass('p-mod-active');
      document.addEventListener('mousedown', this, true);
    }

    // Ensure the menu bar is updated and look up the item node.
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
    let itemNode = this.contentNode.children[this._activeIndex];

    // Get the positioning data for the new menu.
    let { left, bottom } = (itemNode as HTMLElement).getBoundingClientRect();

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
    this.removeClass('p-mod-active');

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
    this.removeClass('p-mod-active');

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

    // Look up the active index and menu count.
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
  private _onTitleChanged(): void {
    this.update();
  }

  private _activeIndex = -1;
  private _menus: Menu[] = [];
  private _childMenu: Menu | null = null;
}


/**
 * The namespace for the `MenuBar` class statics.
 */
export
namespace MenuBar {
  /**
   * An options object for creating a menu bar.
   */
  export
  interface IOptions {
    /**
     * A custom renderer for creating menu bar content.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * An object which holds the data to render a menu bar item.
   */
  export
  interface IRenderData {
    /**
     * The title to be rendered.
     */
    readonly title: Title<Widget>;

    /**
     * Whether the item is the active item.
     */
    readonly active: boolean;
  }

  /**
   * A renderer for use with a menu bar.
   */
  export
  interface IRenderer {
    /**
     * Render the virtual element for a menu bar item.
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
     * Render the virtual element for a menu bar item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement {
      let className = this.createItemClass(data);
      let dataset = this.createItemDataset(data);
      let aria = this.createItemARIA(data);
      return (
        h.li({ className, dataset, ...aria},
          this.renderIcon(data),
          this.renderLabel(data)
        )
      );
    }

    /**
     * Render the icon element for a menu bar item.
     *
     * @param data - The data to use for rendering the icon.
     *
     * @returns A virtual element representing the item icon.
     */
    renderIcon(data: IRenderData): VirtualElement {
      let className = this.createIconClass(data);
      return h.div({ className }, data.title.iconLabel);
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
      return h.div({ className: 'p-MenuBar-itemLabel' }, content);
    }

    /**
     * Create the class name for the menu bar item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the menu item.
     */
    createItemClass(data: IRenderData): string {
      let name = 'p-MenuBar-item';
      if (data.title.className) {
        name += ` ${data.title.className}`;
      }
      if (data.active) {
        name += ' p-mod-active';
      }
      return name;
    }

    /**
     * Create the dataset for a menu bar item.
     *
     * @param data - The data to use for the item.
     *
     * @returns The dataset for the menu bar item.
     */
    createItemDataset(data: IRenderData): ElementDataset {
      return data.title.dataset;
    }

    createItemARIA(data: IRenderData): ElementARIAAttrs {
      return {role: 'menuitem', 'aria-haspopup': 'true'};
    }

    /**
     * Create the class name for the menu bar item icon.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the item icon.
     */
    createIconClass(data: IRenderData): string {
      let name = 'p-MenuBar-itemIcon';
      let extra = data.title.iconClass;
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
      let { label, mnemonic } = data.title;

      // If the index is out of range, do not modify the label.
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label;
      }

      // Split the label into parts.
      let prefix = label.slice(0, mnemonic);
      let suffix = label.slice(mnemonic + 1);
      let char = label[mnemonic];

      // Wrap the mnemonic character in a span.
      let span = h.span({ className: 'p-MenuBar-itemMnemonic' }, char);

      // Return the content parts.
      return [prefix, span, suffix];
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
   * Create the DOM node for a menu bar.
   */
  export
  function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = 'p-MenuBar-content';
    content.setAttribute('role', 'menubar');
    node.appendChild(content);
    node.tabIndex = -1;
    return node;
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
  function findMnemonic(menus: ReadonlyArray<Menu>, key: string, start: number): IMnemonicResult {
    // Setup the result variables.
    let index = -1;
    let auto = -1;
    let multiple = false;

    // Normalize the key to upper case.
    let upperKey = key.toUpperCase();

    // Search the items from the given start index.
    for (let i = 0, n = menus.length; i < n; ++i) {
      // Compute the wrapped index.
      let k = (i + start) % n;

      // Look up the menu title.
      let title = menus[k].title;

      // Ignore titles with an empty label.
      if (title.label.length === 0) {
        continue;
      }

      // Look up the mnemonic index for the label.
      let mn = title.mnemonic;

      // Handle a valid mnemonic index.
      if (mn >= 0 && mn < title.label.length) {
        if (title.label[mn].toUpperCase() === upperKey) {
          if (index === -1) {
            index = k;
          } else {
            multiple = true;
          }
        }
        continue;
      }

      // Finally, handle the auto index if possible.
      if (auto === -1 && title.label[0].toUpperCase() === upperKey) {
        auto = k;
      }
    }

    // Return the search results.
    return { index, multiple, auto };
  }
}
