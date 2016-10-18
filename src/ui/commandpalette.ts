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
  StringSearch, findIndex, indexOf
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
  scrollIntoViewIfNeeded
} from '../dom/query';

import {
  CommandRegistry
} from './commandregistry';

import {
  Keymap
} from './keymap';

import {
  Widget, WidgetFlag
} from './widget';


/**
 * The class name added to `CommandPalette` instances.
 */
const PALETTE_CLASS = 'p-CommandPalette';

/**
 * The class name added to the search section of the palette.
 */
const SEARCH_CLASS = 'p-CommandPalette-search';

/**
 * The class name added to the input wrapper in the search section.
 */
const WRAPPER_CLASS = 'p-CommandPalette-wrapper';

/**
 * The class name added to the input node in the search section.
 */
const INPUT_CLASS = 'p-CommandPalette-input';

/**
 * The class name added to the content section of the palette.
 */
const CONTENT_CLASS = 'p-CommandPalette-content';

/**
 * The class name added to a palette section header.
 */
const HEADER_CLASS = 'p-CommandPalette-header';

/**
 * The class name added to a palette item node.
 */
const ITEM_CLASS = 'p-CommandPalette-item';

/**
 * The class name added to a item label node.
 */
const LABEL_CLASS = 'p-CommandPalette-itemLabel';

/**
 * The class name added to a item shortcut node.
 */
const SHORTCUT_CLASS = 'p-CommandPalette-itemShortcut';

/**
 * The class name added to a item caption node.
 */
const CAPTION_CLASS = 'p-CommandPalette-itemCaption';

/**
 * The class name added to the active palette header or item.
 */
const ACTIVE_CLASS = 'p-mod-active';

/**
 * The class name added to a disabled command item.
 */
const DISABLED_CLASS = 'p-mod-disabled';

/**
 * The class name added to a toggled command item.
 */
const TOGGLED_CLASS = 'p-mod-toggled';


/**
 * A widget which displays command items as a searchable palette.
 */
export
class CommandPalette extends Widget {
  /**
   * Construct a new command palette.
   *
   * @param options - The options for initializing the palette.
   */
  constructor(options: CommandPalette.IOptions) {
    super({ node: Private.createNode() });
    this.addClass(PALETTE_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
    this._keymap = options.keymap;
    this._commands = options.commands;
    this._renderer = options.renderer || CommandPalette.defaultRenderer;
    this._commands.commandChanged.connect(this._onGenericChange, this);
    this._keymap.bindingChanged.connect(this._onGenericChange, this);
  }

  /**
   * Dispose of the resources held by the command palette.
   */
  dispose(): void {
    this._items.clear();
    this._itemNodes.clear();
    this._headerNodes.clear();
    this._result = null;
    this._keymap = null;
    this._commands = null;
    this._renderer = null;
    super.dispose();
  }

  /**
   * Get the command palette search node.
   *
   * #### Notes
   * This is the node which contains the search-related elements.
   *
   * This is a read-only property.
   */
  get searchNode(): HTMLDivElement {
    return this.node.getElementsByClassName(SEARCH_CLASS)[0] as HTMLDivElement;
  }

  /**
   * Get the command palette input node.
   *
   * #### Notes
   * This is a read-only property.
   */
  get inputNode(): HTMLInputElement {
    return this.node.getElementsByClassName(INPUT_CLASS)[0] as HTMLInputElement;
  }

  /**
   * Get the command palette content node.
   *
   * #### Notes
   * This is the node which holds the command item nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLUListElement;
  }

  /**
   * A read-only sequence of the command items in the palette.
   *
   * #### Notes
   * This is a read-only property.
   */
  get items(): ISequence<CommandPalette.IItem> {
    return this._items;
  }

  /**
   * The command registry used by the command palette.
   *
   * #### Notes
   * This is a read-only property.
   */
  get commands(): CommandRegistry {
    return this._commands;
  }

  /**
   * The keymap used by the command palette.
   *
   * #### Notes
   * This is a read-only property.
   */
  get keymap(): Keymap {
    return this._keymap;
  }

  /**
   * The renderer used by the command palette.
   *
   * #### Notes
   * This is a read-only property.
   */
  get renderer(): CommandPalette.IRenderer {
    return this._renderer;
  }

  /**
   * Add a command item to the command palette.
   *
   * @param options - The options for creating the command item.
   *
   * @returns The command item added to the palette.
   */
  addItem(options: CommandPalette.IItemOptions): CommandPalette.IItem {
    // Create a new command item for the options.
    let item = Private.createItem(this._commands, this._keymap, options);

    // Add the item to the vector.
    this._items.pushBack(item);

    // Schedule an update of the content.
    if (this.isAttached) this.update();

    // Return the item added to the palette.
    return item;
  }

  /**
   * Remove an item from the command palette.
   *
   * @param item - The item to remove from the palette.
   *
   * @returns The index occupied by the item, or `-1` if the item
   *   was not contained in the menu.
   */
  removeItem(item: CommandPalette.IItem): number {
    let index = indexOf(this._items, item);
    if (index !== -1) this.removeItemAt(index);
    return index;
  }

  /**
   * Remove the item at a given index from the command palette.
   *
   * @param index - The index of the item to remove.
   *
   * @returns The item occupying the index, or `null` if the index
   *   is out of range.
   */
  removeItemAt(index: number): CommandPalette.IItem {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._items.length) {
      return null;
    }

    // Remove the item from the vector.
    let item = this._items.removeAt(index);

    // Schedule an update of the content.
    if (this.isAttached) this.update();

    // Return the removed item.
    return item;
  }

  /**
   * Remove all command items from the command palette.
   */
  clearItems(): void {
    // Clear the vector of items.
    this._items.clear();

    // Schedule an update of the content.
    if (this.isAttached) this.update();
  }

  /**
   * Handle the DOM events for the command palette.
   *
   * @param event - The DOM event sent to the command palette.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the command palette's DOM node.
   * It should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(event as MouseEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'input':
      this.update();
      break;
    }
  }

  /**
   * A message handler invoked on a `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('click', this);
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('input', this);
    this.update();
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('input', this);
  }

  /**
   * A message handler invoked on an `'activate-request'` message.
   */
  protected onActivateRequest(msg: Message): void {
    if (this.isAttached) {
      let input = this.inputNode;
      input.focus();
      input.select();
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Clear the current content.
    this.contentNode.textContent = '';

    // Reset the active index and search result.
    this._activeIndex = -1;
    this._result = null;

    // Bail early if there are no command items.
    if (this._items.isEmpty) {
      return;
    }

    // Split the query text into its category and text parts.
    let { category, text } = CommandPalette.splitQuery(this.inputNode.value);

    // Search the command items for query matches.
    let result = this._result = Private.search(this._items, category, text);

    // If the result is empty, there is nothing left to do.
    if (result.parts.length === 0) {
      return;
    }

    // Fetch command variables.
    let renderer = this._renderer;
    let itemNodes = this._itemNodes;
    let headerNodes = this._headerNodes;

    // Ensure there are enough header nodes.
    while (headerNodes.length < result.headerCount) {
      headerNodes.pushBack(renderer.createHeaderNode());
    }

    // Ensure there are enough item nodes.
    while (itemNodes.length < result.itemCount) {
      itemNodes.pushBack(renderer.createItemNode());
    }

    // Setup the index counters and document fragment.
    let itemIndex = 0;
    let headerIndex = 0;
    let fragment = document.createDocumentFragment();

    // Render the search result into the fragment.
    for (let part of result.parts) {
      let node: HTMLLIElement;
      if (part.item === null) {
        node = headerNodes.at(headerIndex++);
        renderer.updateHeaderNode(node, part.markup);
      } else {
        node = itemNodes.at(itemIndex++);
        renderer.updateItemNode(node, part.item, part.markup);
      }
      fragment.appendChild(node);
    }

    // Add the fragment to the content node.
    this.contentNode.appendChild(fragment);

    // If there is query text, activate the first command item.
    // Otherwise, reset the content scroll position to the top.
    if (category || text) {
      this._activateNext('item');
    } else {
      requestAnimationFrame(() => { this.contentNode.scrollTop = 0; });
    }
  }

  /**
   * Handle the `'click'` event for the command palette.
   */
  private _evtClick(event: MouseEvent): void {
    // Bail if the click is not the left button.
    if (event.button !== 0) {
      return;
    }

    // Bail if the click was not on a content item.
    let target = event.target as HTMLElement;
    let children = this.contentNode.children;
    let i = findIndex(children, child => child.contains(target));
    if (i === -1) {
      return;
    }

    // Kill the event when a content item is clicked.
    event.preventDefault();
    event.stopPropagation();

    // Bail if there is no search result.
    if (!this._result) {
      return;
    }

    // Bail if the index is out of range.
    let part = this._result.parts[i];
    if (!part) {
      return;
    }

    // Bail if the part has a disabled item.
    if (part.item && !part.item.isEnabled) {
      return;
    }

    // Activate the index and trigger the part.
    this._activate(i);
    this._triggerActive();
  }

  /**
   * Handle the `'keydown'` event for the command palette.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }
    switch (event.keyCode) {
    case 13:  // Enter
      event.preventDefault();
      event.stopPropagation();
      this._triggerActive();
      break;
    case 38:  // Up Arrow
      event.preventDefault();
      event.stopPropagation();
      this._activatePrev('any');
      break;
    case 40:  // Down Arrow
      event.preventDefault();
      event.stopPropagation();
      this._activateNext('any');
      break;
    }
  }

  /**
   * Activate the node at the given render index.
   *
   * If the node is scrolled out of view, it will be scrolled into
   * view and aligned according to the `alignTop` parameter.
   */
  private _activate(index: number): void {
    // Fetch common variables.
    let content = this.contentNode;
    let children = content.children;

    // Ensure the index is valid.
    if (index < 0 || index >= children.length) {
      index = -1;
    }

    // Bail if there is no effective change.
    if (this._activeIndex === index) {
      return;
    }

    // Look up the relevant nodes.
    let oldNode = children[this._activeIndex] as HTMLElement;
    let newNode = children[index] as HTMLElement;

    // Update the internal active index.
    this._activeIndex = index;

    // Deactivate the old node.
    if (oldNode) {
      oldNode.classList.remove(ACTIVE_CLASS);
    }

    // Activate the new node and scroll it into view.
    if (newNode) {
      newNode.classList.add(ACTIVE_CLASS);
      requestAnimationFrame(() => {
        scrollIntoViewIfNeeded(content, newNode);
      });
    }
  }

  /**
   * Activate the next enabled index of the given kind.
   */
  private _activateNext(kind: 'item' | 'header' | 'any'): void {
    // Bail if there are no current search results.
    if (!this._result) {
      return;
    }

    // Bail if the search results are empty.
    let parts = this._result.parts;
    if (parts.length === 0) {
      return;
    }

    // Activate the next enabled index of the specified kind.
    let start = this._activeIndex + 1;
    for (let i = 0, n = parts.length; i < n; ++i) {
      let k = (start + i) % n;
      let item = parts[k].item;
      if (kind === 'item' && item && item.isEnabled) {
        this._activate(k);
        return;
      }
      if (kind === 'header' && !item) {
        this._activate(k);
        return;
      }
      if (kind === 'any' && (!item || item.isEnabled)) {
        this._activate(k);
        return;
      }
    }

    // Otherwise, deactivate the current item.
    this._activate(-1);
  }

  /**
   * Activate the previous enabled index of the given kind.
   */
  private _activatePrev(kind: 'item' | 'header' | 'any'): void {
    // Bail if there are no current search results.
    if (!this._result) {
      return;
    }

    // Bail if the search results are empty.
    let parts = this._result.parts;
    if (parts.length === 0) {
      return;
    }

    // Activate the previous enabled index of the specified kind.
    let ai = this._activeIndex;
    let start = ai <= 0 ? parts.length - 1 : ai - 1;
    for (let i = 0, n = parts.length; i < n; ++i) {
      let k = (start - i + n) % n;
      let item = parts[k].item;
      if (kind === 'item' && item && item.isEnabled) {
        this._activate(k);
        return;
      }
      if (kind === 'header' && !item) {
        this._activate(k);
        return;
      }
      if (kind === 'any' && (!item || item.isEnabled)) {
        this._activate(k);
        return;
      }
    }

    // Otherwise, deactivate the current item.
    this._activate(-1);
  }

  /**
   * Trigger the result part at the active index.
   *
   * If the part is an enabled command it will be executed. If the
   * part is a header, the category search term will be toggled.
   */
  private _triggerActive(): void {
    // Bail if there is no search result.
    if (!this._result) {
      return;
    }

    // Bail if the active index is out of range.
    let part = this._result.parts[this._activeIndex];
    if (!part) {
      return;
    }

    // Bail if the part has a disabled item.
    if (part.item && !part.item.isEnabled) {
      return;
    }

    // Look up the input node.
    let input = this.inputNode;

    // If the part has an item, focus the input field, select the
    // text, and execute the command.
    if (part.item) {
      input.focus();
      input.select();
      this._commands.execute(part.item.command, part.item.args);
      return;
    }

    // Otherwise, toggle the category text...

    // Parse the current input value.
    let { category, text } = CommandPalette.splitQuery(input.value);

    // Extract the raw category text.
    let desired = part.markup.replace(/<mark>|<\/mark>/g, '');

    // Create a new query with the toggled category.
    let computed = desired === category ? '' : desired;
    let query = CommandPalette.joinQuery(computed, text);

    // Update the input text and refocus the field.
    input.value = query;
    input.focus();

    // Schedule an update to render the new search results.
    this.update();
  }

  /**
   * A signal handler for commands and keymap changes.
   */
  private _onGenericChange(): void {
    if (this.isAttached) this.update();
  }

  private _activeIndex = 1;
  private _keymap: Keymap;
  private _commands: CommandRegistry;
  private _renderer: CommandPalette.IRenderer;
  private _itemNodes = new Vector<HTMLLIElement>();
  private _headerNodes = new Vector<HTMLLIElement>();
  private _items = new Vector<CommandPalette.IItem>();
  private _result: Private.ISearchResult = null;
}


/**
 * The namespace for the `CommandPalette` class statics.
 */
export
namespace CommandPalette {
  /**
   * An options object for creating a command palette.
   */
  export
  interface IOptions {
    /**
     * The command registry for use with the command palette.
     */
    commands: CommandRegistry;

    /**
     * The keymap for use with the command palette.
     */
    keymap: Keymap;

    /**
     * A custom renderer for use with the command palette.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * An options object for creating a command item.
   */
  export
  interface IItemOptions {
    /**
     * The command to execute when the item is triggered.
     */
    command: string;

    /**
     * The arguments for the command.
     *
     * The default value is `null`.
     */
    args?: JSONObject;

    /**
     * The category for the item.
     *
     * The default value is `'general'`.
     */
    category?: string;
  }

  /**
   * An object which represents an item in a command palette.
   *
   * #### Notes
   * An item is an immutable object created by a command palette.
   */
  export
  interface IItem {
    /**
     * The command to execute when the item is triggered.
     */
    command: string;

    /**
     * The arguments for the command.
     */
    args: JSONObject;

    /**
     * The category for the command item.
     */
    category: string;

    /**
     * The display label for the command item.
     */
    label: string;

    /**
     * The display caption for the command item.
     */
    caption: string;

    /**
     * The extra class name for the command item.
     */
    className: string;

    /**
     * Whether the command item is enabled.
     */
    isEnabled: boolean;

    /**
     * Whether the command item is toggled.
     */
    isToggled: boolean;

    /**
     * Whether the command item is visible.
     */
    isVisible: boolean;

    /**
     * The key binding for the command item.
     */
    keyBinding: Keymap.IBinding;
  }

  /**
   * A renderer for use with a command palette.
   */
  export
  interface IRenderer {
    /**
     * Create a node for a section header.
     *
     * @returns A new node for a section header.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateHeaderNode` method will be called for initialization.
     */
    createHeaderNode(): HTMLLIElement;

    /**
     * Create a node for a command item.
     *
     * @returns A new node for a command item.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateItemNode` method will be called for initialization.
     */
    createItemNode(): HTMLLIElement;

    /**
     * Update a header node to reflect the given data..
     *
     * @param node - A node created by a call to `createHeaderNode`.
     *
     * @param markup - The markup for the header text. This is the
     *   section category text interpolated with `<mark>` tags for
     *   the matching search characters.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data for the header.
     */
    updateHeaderNode(node: HTMLLIElement, markup: string): void;

    /**
     * Update an item node to reflect the state of a command item.
     *
     * @param node - A node created by a call to `createItemNode`.
     *
     * @param item - The command item holding the data for the node.
     *
     * @param markup - The markup for the item label. This is the
     *   item label text interpolated with `<mark>` tags for the
     *   matching search characters.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data for the command item.
     */
    updateItemNode(node: HTMLLIElement, item: CommandPalette.IItem, markup: string): void;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Create a node for a section header.
     *
     * @returns A new node for a section header.
     */
    createHeaderNode(): HTMLLIElement {
      let node = document.createElement('li');
      node.className = HEADER_CLASS;
      return node;
    }

    /**
     * Create a node for a command item.
     *
     * @returns A new node for a command item.
     */
    createItemNode(): HTMLLIElement {
      let node = document.createElement('li');
      let label = document.createElement('div');
      let caption = document.createElement('div');
      let shortcut = document.createElement('div');
      node.className = ITEM_CLASS;
      label.className = LABEL_CLASS;
      caption.className = CAPTION_CLASS;
      shortcut.className = SHORTCUT_CLASS;
      node.appendChild(shortcut); // will float: right
      node.appendChild(label);
      node.appendChild(caption);
      return node;
    }

    /**
     * Update a header node to reflect the given data.
     *
     * @param node - A node created by a call to `createHeaderNode`.
     *
     * @param markup - The markup for the header text. This is the
     *   section category text interpolated with `<mark>` tags for
     *   the matching search characters.
     */
    updateHeaderNode(node: HTMLLIElement, markup: string): void {
      node.className = HEADER_CLASS;
      node.innerHTML = markup;
    }

    /**
     * Update an item node to reflect the state of a command item.
     *
     * @param node - A node created by a call to `createItemNode`.
     *
     * @param item - The command item holding the data for the node.
     *
     * @param markup - The markup for the item label. This is the
     *   item label text interpolated with `<mark>` tags for the
     *   matching search characters.
     */
    updateItemNode(node: HTMLLIElement, item: CommandPalette.IItem, markup: string): void {
      // Setup the initial item class.
      let itemClass = ITEM_CLASS;

      // Add the boolean states to the item class.
      //
      // Note: non-visible items are not rendered by the palette, so
      // there is no need to check the visibility flag of the item.
      if (!item.isEnabled) {
        itemClass += ` ${DISABLED_CLASS}`;
      }
      if (item.isToggled) {
        itemClass += ` ${TOGGLED_CLASS}`;
      }

      // Add the extra class name(s) to the item class.
      let extraItemClass = item.className;
      if (extraItemClass) {
        itemClass += ` ${extraItemClass}`;
      }

      // Generate the formatted shortcut text.
      let shortcutText = this.formatShortcut(item.keyBinding);

      // Extract the relevant child nodes.
      let shortcut = node.firstChild as HTMLElement;
      let label = shortcut.nextSibling as HTMLElement;
      let caption = label.nextSibling as HTMLElement;

      // Set the command ID in the data set.
      node.dataset['command'] = item.command;

      // Update the rest of the node state.
      node.className = itemClass;
      label.innerHTML = markup;
      caption.textContent = item.caption;
      shortcut.textContent = shortcutText;
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

  /**
   * Split a query string into its category and text components.
   *
   * @param query - A query string of the form `(:<category>:)?<text>`.
   *
   * @returns The `category` and `text` components of the query with
   *   leading and trailing whitespace removed.
   */
  export
  function splitQuery(query: string): { category: string, text: string } {
    query = query.trim();
    let i = query.indexOf(':');
    if (i === -1) {
      return { category: '', text: query };
    }
    let category = query.slice(0, i).trim();
    let text = query.slice(i + 1).trim();
    return { category, text };
  }

  /**
   * Join category and text components into a query string.
   *
   * @param category - The category for the query or an empty string.
   *
   * @param text - The text for the query or an empty string.
   *
   * @returns The joined query string for the components.
   */
  export
  function joinQuery(category: string, text: string): string {
    let query: string;
    if (category && text) {
      query = `${category.trim()}: ${text.trim()}`;
    } else if (category) {
      query = `${category.trim()}: `;
    } else if (text) {
      query = text.trim();
    } else {
      query = '';
    }
    return query;
  }
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * An object which represents a part of a search result.
   */
  export
  interface IResultPart {
    /**
     * The markup for the matching characters.
     *
     * For a header part, this is the marked category text.
     *
     * For an item part, this is the marked command label.
     */
    markup: string;

    /**
     * The command item for the part.
     *
     * This is `null` for a header part.
     */
    item: CommandPalette.IItem;
  }

  /**
   * An object which represents search results.
   */
  export
  interface ISearchResult {
    /**
     * The number of header parts in the results.
     */
    headerCount: number;

    /**
     * The number of item parts in the results.
     */
    itemCount: number;

    /**
     * The flat ordered array of result parts.
     */
    parts: IResultPart[];
  }

  /**
   * Create the DOM node for a command palette.
   */
  export
  function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let search = document.createElement('div');
    let wrapper = document.createElement('div');
    let input = document.createElement('input');
    let content = document.createElement('ul');
    search.className = SEARCH_CLASS;
    wrapper.className = WRAPPER_CLASS;
    input.className = INPUT_CLASS;
    content.className = CONTENT_CLASS;
    input.spellcheck = false;
    wrapper.appendChild(input);
    search.appendChild(wrapper);
    node.appendChild(search);
    node.appendChild(content);
    return node;
  }

  /**
   * Create a new command item from a keymap, commands, and options.
   */
  export
  function createItem(commands: CommandRegistry, keymap: Keymap, options: CommandPalette.IItemOptions): CommandPalette.IItem {
    return new CommandItem(commands, keymap, options);
  }

  /**
   * Search the a sequence of command items for fuzzy matches.
   *
   * @param category - The category to match against the command items.
   *   If this is an empty string, all item categories will be matched.
   *
   * @param text - The text to match against the command items.
   *   If this is an empty string, all items will be matched.
   *
   * @returns The result of the search.
   */
  export
  function search(items: ISequence<CommandPalette.IItem>, category: string, text: string): ISearchResult {
    // Collect a mapping of the matching categories. The mapping will
    // only contain categories which match the provided query text.
    // If the category is an empty string, all categories will be
    // matched with a score of `0` and a `null` indices array.
    let catmap = matchCategory(items, category);

    // Filter the items for matching labels. Only items which have a
    // category in the given map are considered. The category score
    // is added to the label score to create the final item score.
    // If the text is an empty string, all items will be matched
    // with a label score of `0` and `null` indices array.
    let scores = matchLabel(items, text, catmap);

    // Sort the items based on their total item score. Ties are
    // broken by locale order of the category followed by label.
    scores.sort(scoreCmp);

    // Group the item scores by category. The categories are added
    // to the map in the order they appear in the scores array.
    let groups = groupScores(scores);

    // Return the result for the search. The headers are created in
    // the order of key iteration of the map. On all major browsers,
    // this is insertion order. This means that headers are created
    // in the order of first appearance in the sorted scores array.
    return createSearchResult(groups, catmap);
  }

  /**
   * A concrete implementation of `CommandPalette.IItem`.
   */
  class CommandItem implements CommandPalette.IItem {
    /**
     * Construct a new command item.
     */
    constructor(commands: CommandRegistry, keymap: Keymap, options: CommandPalette.IItemOptions) {
      this._commands = commands;
      this._keymap = keymap;
      this._command = options.command;
      this._args = options.args || null;
      this._category = normalizeCategory(options.category || 'general');
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
     * The category for the command item.
     */
    get category(): string {
      return this._category;
    }

    /**
     * The display label for the command item.
     */
    get label(): string {
      return this._commands.label(this._command, this._args);
    }

    /**
     * The display caption for the command item.
     */
    get caption(): string {
      return this._commands.caption(this._command, this._args);
    }

    /**
     * The extra class name for the command item.
     */
    get className(): string {
      return this._commands.className(this._command, this._args);
    }

    /**
     * Whether the command item is enabled.
     */
    get isEnabled(): boolean {
      return this._commands.isEnabled(this._command, this._args);
    }

    /**
     * Whether the command item is toggled.
     */
    get isToggled(): boolean {
      return this._commands.isToggled(this._command, this._args);
    }

    /**
     * Whether the command item is visible.
     */
    get isVisible(): boolean {
      return this._commands.isVisible(this._command, this._args);
    }

    /**
     * The key binding for the command item.
     */
    get keyBinding(): Keymap.IBinding {
      return this._keymap.findBinding(this._command, this._args);
    }

    private _commands: CommandRegistry;
    private _keymap: Keymap;
    private _command: string;
    private _args: JSONObject;
    private _category: string;
  }

  /**
   * A type alias for a string map object.
   */
  type StringMap<T> = { [key: string]: T };

  /**
   * An object which represents a text match score.
   */
  interface IScore {
    /**
     * The numerical score for the text match.
     */
    score: number;

    /**
     * The indices of the matched characters.
     */
    indices: number[];
  }

  /**
   * A text match score with associated command item.
   */
  interface IItemScore extends IScore {
    /**
     * The command item associated with the match.
     */
    item: CommandPalette.IItem;
  }

  /**
   * Normalize a category for a command item.
   */
  function normalizeCategory(category: string): string {
    return category.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  /**
   * Normalize the query text for a command item.
   *
   * @param text - The category or text portion of a query.
   *
   * @returns The normalized query text.
   *
   * #### Notes
   * The text is normalized by converting to lower case and removing
   * all whitespace.
   */
  function normalizeQueryText(text: string): string {
    return text.replace(/\s+/g, '').toLowerCase();
  }

  /**
   * Collect a mapping of the categories which match the given query.
   *
   * @param items - The command items to search.
   *
   * @param query - The category portion of the query.
   *
   * @returns A mapping of matched category to match score.
   *
   * #### Notes
   * The query string will be normalized by lower casing and removing
   * all whitespace. If the normalized query is an empty string, all
   * categories will be matched with a `0` score and `null` indices.
   *
   * Non-visible items will be ignored.
   */
  function matchCategory(items: ISequence<CommandPalette.IItem>, query: string): StringMap<IScore> {
    // Normalize the query text to lower case with no whitespace.
    query = normalizeQueryText(query);

    // Create the maps needed to track the match state.
    let seen: StringMap<boolean> = Object.create(null);
    let matched: StringMap<IScore> = Object.create(null);

    // Iterate over the items and match the categories.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Ignore items which are not visible.
      let item = items.at(i);
      if (!item.isVisible) {
        continue;
      }

      // If a category has already been seen, no more work is needed.
      let category = item.category;
      if (category in seen) {
        continue;
      }

      // Mark the category as seen so it is only processed once.
      seen[category] = true;

      // If the query is empty, all categories match by default.
      if (!query) {
        matched[category] = { score: 0, indices: null };
        continue;
      }

      // Run the matcher for the query and skip if no match.
      let match = StringSearch.sumOfSquares(category, query);
      if (!match) {
        continue;
      }

      // Store the match score in the results.
      matched[category] = match;
    }

    // Return the final mapping of matched categories.
    return matched;
  }

  /**
   * Filter command items for those with matching label and category.
   *
   * @param items - The command items to search.
   *
   * @param query - The text portion of the query.
   *
   * @param categories - A mapping of the valid item categories.
   *
   * @returns An array of item scores for the matching items.
   *
   * #### Notes
   * The query string will be normalized by lower casing and removing
   * all whitespace. If the normalized query is an empty string, all
   * items will be matched with a `0` label score and `null` indices.
   *
   * Items which have a category which is not present in the category
   * map will be ignored.
   *
   * Non-visible items will be ignored.
   *
   * The final item score is the sum of the item label score and the
   * relevant category score.
   */
  function matchLabel(items: ISequence<CommandPalette.IItem>, query: string, categories: StringMap<IScore>): IItemScore[] {
    // Normalize the query text to lower case with no whitespace.
    query = normalizeQueryText(query);

    // Create the array to hold the resulting scores.
    let scores: IItemScore[] = [];

    // Iterate over the items and match the text with the query.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Ignore items which are not visible.
      let item = items.at(i);
      if (!item.isVisible) {
        continue;
      }

      // Look up the category score for the item category.
      let cs = categories[item.category];

      // If the category was not matched, the item is skipped.
      if (!cs) {
        continue;
      }

      // If the query is empty, all items are matched by default.
      if (!query) {
        scores.push({ score: cs.score, indices: null, item });
        continue;
      }

      // Run the matcher for the query and skip if no match.
      let match = StringSearch.sumOfSquares(item.label.toLowerCase(), query);
      if (!match) {
        continue;
      }

      // Create the match score for the item.
      let score = cs.score + match.score;
      scores.push({ score, indices: match.indices, item });
    }

    // Return the final array of matched item scores.
    return scores;
  }

  /**
   * A sort comparison function for a command item match score.
   *
   * This orders the items first based on score (lower is better), then
   * by locale order of the item category followed by the item text.
   */
  function scoreCmp(a: IItemScore, b: IItemScore): number {
    let d1 = a.score - b.score;
    if (d1 !== 0) {
      return d1;
    }
    let d2 = a.item.category.localeCompare(b.item.category);
    if (d2 !== 0) {
      return d2;
    }
    return a.item.label.localeCompare(b.item.label);
  }

  /**
   * Group item scores by item category.
   *
   * @param scores - The items to group by category.
   *
   * @returns A mapping of category name to group of items.
   *
   * #### Notes
   * The categories are added to the map in the order of first
   * appearance in the `scores` array.
   */
  function groupScores(scores: IItemScore[]): StringMap<IItemScore[]> {
    let result: StringMap<IItemScore[]> = Object.create(null);
    for (let score of scores) {
      let cat = score.item.category;
      (result[cat] || (result[cat] = [])).push(score);
    }
    return result;
  }

  /**
   * Create the search results for a collection of item scores.
   *
   * @param groups - The item scores, grouped by category.
   *
   * @param categories - A mapping of category scores.
   *
   * @returns New search results for the given scores.
   *
   * #### Notes
   * This function renders the groups in iteration order, which on
   * all major browsers is the order of insertion (by convention).
   */
  function createSearchResult(groups: StringMap<IItemScore[]>, categories: StringMap<IScore>): ISearchResult {
    let itemCount = 0;
    let headerCount = 0;
    let parts: IResultPart[] = [];
    for (let cat in groups) {
      headerCount++;
      parts.push(createHeaderPart(cat, categories[cat]));
      for (let score of groups[cat]) {
        itemCount++;
        parts.push(createItemPart(score));
      }
    }
    return { itemCount, headerCount, parts };
  }

  /**
   * Create a header result part for the given data.
   *
   * @param category - The category name for the header.
   *
   * @param score - The score for the category match.
   *
   * @returns A header result part for the given data.
   */
  function createHeaderPart(category: string, score: IScore): IResultPart {
    let markup = highlightText(category, score.indices);
    return { markup, item: null };
  }

  /**
   * Create an item result part for the given data.
   *
   * @param score - The score for the item match.
   *
   * @returns An item result part for the given data.
   */
  function createItemPart(score: IItemScore): IResultPart {
    let markup = highlightText(score.item.label, score.indices);
    return { markup, item: score.item };
  }

  /**
   * Highlight the matching character of the given text.
   *
   * @param text - The text to highlight.
   *
   * @param indices - The character indices to highlight, or `null`.
   *
   * @returns The text interpolated with `<mark>` tags as needed.
   */
  function highlightText(text: string, indices: number[]): string {
    return indices ? StringSearch.highlight(text, indices) : text;
  }
}
