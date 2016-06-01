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
  indexOf
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
  commands
} from './commands';

import {
  KeyBinding, formatKeystroke, keymap
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
const WRAPPER_CLASS = 'p-CommandPalette-inputWrapper';

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
 * The class name added to the item content node.
 */
const ITEM_CONTENT_CLASS = 'p-CommandPalette-itemContent';

/**
 * The class name added to a item icon node.
 */
const ITEM_ICON_CLASS = 'p-CommandPalette-itemIcon';

/**
 * The class name added to a item label node.
 */
const ITEM_LABEL_CLASS = 'p-CommandPalette-itemLabel';

/**
 * The class name added to a item shortcut node.
 */
const ITEM_SHORTCUT_CLASS = 'p-CommandPalette-itemShortcut';

/**
 * The class name added to a item caption node.
 */
const ITEM_CAPTION_CLASS = 'p-CommandPalette-itemCaption';

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
 * An object which represents a command item.
 *
 * #### Notes
 * Once created, a command item is immutable.
 */
export
class CommandItem {
  /**
   * Construct a new command item.
   *
   * @param options - The options for initializing the command item.
   */
  constructor(options: CommandItem.IOptions) {
    this._command = options.command;
    this._args = options.args || null;
    this._category = options.category || '';
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
   * The display label for the command item.
   */
  get label(): string {
    return commands.label(this._command, this._args);
  }

  /**
   * The icon class for the command item.
   */
  get icon(): string {
    return commands.icon(this._command, this._args);
  }

  /**
   * The display caption for the command item.
   */
  get caption(): string {
    return commands.caption(this._command, this._args);
  }

  /**
   * The extra class name for the command item.
   */
  get className(): string {
    return commands.className(this._command, this._args);
  }

  /**
   * Whether the command item is enabled.
   */
  get isEnabled(): boolean {
    return commands.isEnabled(this._command, this._args);
  }

  /**
   * Whether the command item is toggled.
   */
  get isToggled(): boolean {
    return commands.isToggled(this._command, this._args);
  }

  /**
   * Whether the command item is visible.
   */
  get isVisible(): boolean {
    return commands.isVisible(this._command, this._args);
  }

  /**
   * The key binding for the command item.
   */
  get keyBinding(): KeyBinding {
    return keymap.findKeyBinding(this._command, this._args);
  }

  /**
   * The category for the command item.
   */
  get category(): string {
    return this._category;
  }

  private _command: string;
  private _args: JSONObject;
  private _category: string;
}


/**
 * The namespace for the `CommandItem` class statics.
 */
export
namespace CommandItem {
  /**
   * An options object for initializing a command item.
   */
  export
  interface IOptions {
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
     * The default value is an empty string.
     */
    category?: string;
  }
}


/**
 * A widget which displays command items as a searchable palette.
 */
export
class CommandPalette extends Widget {
  /**
   * Create the DOM node for a command palette.
   */
  static createNode(): HTMLElement {
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
   * Construct a new command palette.
   */
  constructor(options: CommandPalette.IOptions = {}) {
    super();
    this.addClass(PALETTE_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
    this._renderer = options.renderer || CommandPalette.defaultRenderer;
  }

  /**
   * Dispose of the resources held by the command palette.
   */
  dispose(): void {
    this._items.clear();
    this._itemNodes.clear();
    this._headerNodes.clear();
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
  get searchNode(): HTMLElement {
    return this.node.getElementsByClassName(SEARCH_CLASS)[0] as HTMLElement;
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
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
  }

  /**
   * A read-only sequence of the command items in the palette.
   *
   * #### Notes
   * This is a read-only property.
   */
  get items(): ISequence<CommandItem> {
    return this._items;
  }

  /**
   * Add a command item to the command palette.
   *
   * @param value - The command item to add to the palette, or an
   *   options object to be converted into a command item.
   *
   * @returns The command item added to the palette.
   */
  addItem(value: CommandItem | CommandItem.IOptions): CommandItem {
    // Coerce the value to a command item.
    let item = Private.asCommandItem(value);

    // Add the item to the vector.
    this._items.pushBack(item);

    // Schedule an update of the content.
    this.update();

    // Return the item added to the palette.
    return item;
  }

  /**
   * Remove a command item from the command palette.
   *
   * @param value - The item to remove or the index thereof.
   *
   * #### Notes
   * This is a no-op if the item is not contained in the palette.
   */
  removeItem(value: CommandItem | number): void {
    // Coerce the value to an index.
    let index: number;
    if (typeof value === 'number') {
      index = value;
    } else {
      index = indexOf(this._items, value);
    }

    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._items.length) {
      return;
    }

    // Remove the item from the vector.
    this._items.remove(i);

    // Schedule an update of the content.
    this.update();
  }

  /**
   * Remove all command items from the command palette.
   */
  clearItems(): void {
    // Clear the vector of items.
    this._items.clear();

    // Schedule an update of the content.
    this.update();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Clear the current content.
    this.contentNode.textContent = '';

    // Reset the active index.
    // this._activeIndex = -1;

    // Bail early if there are no command items.
    if (this._items.isEmpty) {
      return;
    }

    // Split the query text into its category and text parts.
    let { category, text } = CommandPalette.splitQuery(this.inputNode.value);

    // Search the command items for query matches.
    let sections = Private.search(this._items, category, text);

    // If the sections are empty, there is nothing left to do.
    if (sections.length === 0) {
      return;
    }

    // Fetch command variables.
    let renderer = this._renderer;
    let itemNodes = this._itemNodes;
    let headerNodes = this._headerNodes;

    // Count the total number of items.
    let itemCount = 0;
    for (let section of sections) {
      itemCount += section.items.length;
    }

    // Ensure there are enough header nodes.
    while (headerNodes.length < sections.length) {
      headerNodes.pushBack(renderer.createHeaderNode());
    }

    // Ensure there are enough item nodes.
    while (itemNodes.length < itemCount) {
      itemNodes.pushBack(renderer.createItemNode());
    }

    // Setup the index counters and document fragment.
    let itemIndex = 0;
    let headerIndex = 0;
    let fragment = document.createDocumentFragment();

    //
    for (let section of sections) {
      let headerNode = headerNodes.at(headerIndex++);
      renderer.updateHeaderNode(headerNode, section.markup);
      fragment.appendChild(headerNode);
      for (let { markup, item } of section.items) {
        let itemNode = itemNodes.at(itemIndex++);
        renderer.updateItemNode(itemNode, item, markup);
        fragment.appendChild(itemNode);
      }
    }

    // Add the fragment to the content node.
    this.contentNode.appendChild(fragment);

    // If there is query text, highlight the first command item.
    // Otherwise, reset the content scroll position to the top.
    // if (category || text) {
    //   this.activateFirst(ActivationTarget.Command);
    // } else {
    //   requestAnimationFrame(() => { content.scrollTop = 0; });
    // }
  }

  private _items = new Vector<CommandItem>();
  private _itemNodes = new Vector<HTMLElement>();
  private _headerNodes = new Vector<HTMLElement>();
  private _renderer: CommandPalette.IContentRenderer;
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
     * A custom renderer for creating palette content.
     */
    renderer?: IContentRenderer;
  }

  /**
   * An object which renders the content for a command palette.
   *
   * #### Notes
   * User code can implement a custom renderer when the default
   * content created by the command palette is insufficient.
   */
  export
  interface IContentRenderer {
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
    createHeaderNode(): HTMLElement;

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
    createItemNode(): HTMLElement;

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
    updateHeaderNode(node: HTMLElement, markup: string): void;

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
    updateItemNode(node: HTMLElement, item: CommandItem, markup: string): void;
  }

  /**
   * The default implementation of [[IContentRenderer]].
   */
  export
  class ContentRenderer implements IContentRenderer {
    /**
     * Create a node for a section header.
     *
     * @returns A new node for a section header.
     */
    createHeaderNode(): HTMLElement {
      let node = document.createElement('li');
      node.className = HEADER_CLASS;
      return node;
    }

    /**
     * Create a node for a command item.
     *
     * @returns A new node for a command item.
     */
    createItemNode(): HTMLElement {
      let node = document.createElement('li');
      let content = document.createElement('div');
      let icon = document.createElement('span');
      let label = document.createElement('span');
      let caption = document.createElement('span');
      let shortcut = document.createElement('span');
      node.className = ITEM_CLASS;
      content.className = ITEM_CONTENT_CLASS;
      icon.className = ITEM_ICON_CLASS;
      label.className = ITEM_LABEL_CLASS;
      caption.className = ITEM_CAPTION_CLASS;
      shortcut.className = ITEM_SHORTCUT_CLASS;
      content.appendChild(shortcut);
      content.appendChild(label);
      content.appendChild(caption);
      node.appendChild(icon);
      node.appendChild(content);
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
    updateHeaderNode(node: HTMLElement, markup: string): void {
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
    updateItemNode(node: HTMLElement, item: CommandItem, markup: string): void {
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

      // Setup the initial icon class.
      let iconClass = ITEM_ICON_CLASS;

      // Add the extra class name(s) to the icon class.
      let extraIconClass = item.icon;
      if (extraIconClass) {
        iconClass +=  ` ${extraIconClass}`;
      }

      // Generate the formatted shortcut text.
      let shortcutText = this.formatShortcut(item.keyBinding);

      // Extract the relevant child nodes.
      let icon = node.firstChild as HTMLElement;
      let content = icon.nextSibling as HTMLElement;
      let shortcut = content.firstChild as HTMLElement;
      let label = shortcut.nextSibling as HTMLElement;
      let caption = label.nextSibling as HTMLElement;

      // Set the command ID in the data set.
      node.dataset['command'] = item.command;

      // Update the rest of the node state.
      node.className = itemClass;
      icon.className = iconClass;
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
    formatShortcut(binding: KeyBinding): string {
      return binding ? binding.keys.map(formatKeystroke).join(' ') : '';
    }
  }

  /**
   * A default instance of the `ContentRenderer` class.
   */
  export
  const defaultRenderer = new ContentRenderer();

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
    if (query[0] !== ':') {
      return { category: '', text: query };
    }
    let i = query.indexOf(':', 1);
    if (i === -1) {
      return { category: query.slice(1).trim(), text: '' };
    }
    let category = query.slice(1, i).trim();
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
      query = `:${category.trim()}: ${text.trim()}`;
    } else if (category) {
      query = `:${category.trim()}: `;
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
   *
   */
  export
  interface ISection {
    /**
     *
     */
    markup: string;

    /**
     *
     */
    items: Array<{ markup: string, item: CommandItem }>;
  }

  /**
   * Coerce a command item or options into a real command item.
   */
  export
  function asCommandItem(value: CommandItem | CommandItem.IOptions): CommandItem {
    return value instanceof CommandItem ? value : new CommandItem(value);
  }

  /**
   *
   */
  export
  function search(items: ISequence<CommandItem>, category: string, text: string): ISection[] {
    return [];
  }
}
