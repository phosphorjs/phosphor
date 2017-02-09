/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, StringExt
} from '@phosphor/algorithm';

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  JSONObject
} from '@phosphor/json';

import {
  Message
} from '@phosphor/messaging';

import {
  IS_MAC
} from '@phosphor/platform';

import {
  ElementDataset, VirtualDOM, VirtualElement, h
} from '@phosphor/virtualdom';

import {
  DOMUtil
} from './domutil';

import {
  Widget
} from './widget';


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
    this.addClass(CommandPalette.COMMAND_PALETTE_CLASS);
    this.setFlag(Widget.Flag.DisallowLayout);
    this.commands = options.commands;
    this.renderer = options.renderer || CommandPalette.defaultRenderer;
    this.commands.commandChanged.connect(this._onGenericChange, this);
    this.commands.keyBindingChanged.connect(this._onGenericChange, this);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._items.length = 0;
    this._results = null;
    super.dispose();
  }

  /**
   * The command registry used by the command palette.
   */
  readonly commands: CommandRegistry;

  /**
   * The renderer used by the command palette.
   */
  readonly renderer: CommandPalette.IRenderer;

  /**
   * The command palette search node.
   *
   * #### Notes
   * This is the node which contains the search-related elements.
   */
  get searchNode(): HTMLDivElement {
    return this.node.getElementsByClassName(CommandPalette.SEARCH_CLASS)[0] as HTMLDivElement;
  }

  /**
   * The command palette input node.
   *
   * #### Notes
   * This is the actual input node for the search area.
   */
  get inputNode(): HTMLInputElement {
    return this.node.getElementsByClassName(CommandPalette.INPUT_CLASS)[0] as HTMLInputElement;
  }

  /**
   * The command palette content node.
   *
   * #### Notes
   * This is the node which holds the command item nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(CommandPalette.CONTENT_CLASS)[0] as HTMLUListElement;
  }

  /**
   * A read-only array of the command items in the palette.
   */
  get items(): ReadonlyArray<CommandPalette.IItem> {
    return this._items;
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
    let item = Private.createItem(this.commands, options);

    // Add the item to the array.
    this._items.push(item);

    // Refresh the search results.
    this._refresh();

    // Return the item added to the palette.
    return item;
  }

  /**
   * Remove an item from the command palette.
   *
   * @param item - The item to remove from the palette.
   *
   * #### Notes
   * This is a no-op if the item is not in the palette.
   */
  removeItem(item: CommandPalette.IItem): void {
    this.removeItemAt(this._items.indexOf(item));
  }

  /**
   * Remove the item at a given index from the command palette.
   *
   * @param index - The index of the item to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeItemAt(index: number): void {
    // Remove the item from the array.
    let item = ArrayExt.removeAt(this._items, index);

    // Bail if the index is out of range.
    if (!item) {
      return;
    }

    // Refresh the search results.
    this._refresh();
  }

  /**
   * Remove all items from the command palette.
   */
  clearItems(): void {
    // Bail if there is nothing to remove.
    if (this._items.length === 0) {
      return;
    }

    // Clear the array of items.
    this._items.length = 0;

    // Refresh the search results.
    this._refresh();
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
      this._refresh();
      break;
    case 'focus':
    case 'blur':
      this._toggleFocused();
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
    this.node.addEventListener('focus', this, true);
    this.node.addEventListener('blur', this, true);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('keydown', this);
    this.node.removeEventListener('input', this);
    this.node.removeEventListener('focus', this, true);
    this.node.removeEventListener('blur', this, true);
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
    // Fetch the current query text and content node.
    let query = this.inputNode.value;
    let contentNode = this.contentNode;

    // Ensure the search results are generated.
    let results = this._results;
    if (!results) {
      // Generate and store the new search results.
      results = this._results = Private.search(this._items, query);

      // Reset the active index.
      this._activeIndex = (
        query ? ArrayExt.findFirstIndex(results, Private.canActivate) : -1
      );
    }

    // If there is no query and no results, clear the content.
    if (!query && results.length === 0) {
      VirtualDOM.render(null, contentNode);
      return;
    }

    // If the is a query but no results, render the empty message.
    if (query && results.length === 0) {
      let content = this.renderer.renderEmptyMessage({ query });
      VirtualDOM.render(content, contentNode);
      return;
    }

    // Create the render content for the search results.
    let renderer = this.renderer;
    let activeIndex = this._activeIndex;
    let content = new Array<VirtualElement>(results.length);
    for (let i = 0, n = results.length; i < n; ++i) {
      let result = results[i];
      if (result.type === 'header') {
        content[i] = renderer.renderHeader({ label: result.label });
      } else {
        let item = result.item;
        let indices = result.indices;
        let active = i === activeIndex;
        content[i] = renderer.renderItem({ item, indices, active });
      }
    }

    // Render the search result content.
    VirtualDOM.render(content, contentNode);

    // Adjust the scroll position as needed.
    if (activeIndex < 0 || activeIndex >= results.length) {
      contentNode.scrollTop = 0;
    } else {
      let element = contentNode.children[activeIndex];
      DOMUtil.scrollIntoViewIfNeeded(contentNode, element);
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

    // Find the index of the item which was clicked.
    let index = ArrayExt.findFirstIndex(this.contentNode.children, node => {
      return node.contains(event.target as HTMLElement);
    });

    // Bail if the click was not on an item.
    if (index === -1) {
      return;
    }

    // Kill the event when a content item is clicked.
    event.preventDefault();
    event.stopPropagation();

    // Execute the item if possible.
    this._execute(index);
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
      this._execute(this._activeIndex);
      break;
    case 38:  // Up Arrow
      event.preventDefault();
      event.stopPropagation();
      this._activatePreviousItem();
      break;
    case 40:  // Down Arrow
      event.preventDefault();
      event.stopPropagation();
      this._activateNextItem();
      break;
    }
  }

  /**
   * Activate the next enabled command item.
   */
  private _activateNextItem(): void {
    // Bail if there are no search results.
    if (!this._results || this._results.length === 0) {
      return;
    }

    // Find the next enabled item index.
    let ai = this._activeIndex;
    let n = this._results.length;
    let start = ai < n - 1 ? ai + 1 : 0;
    let stop = start === 0 ? n - 1 : start - 1;
    this._activeIndex = ArrayExt.findFirstIndex(
      this._results, Private.canActivate, start, stop
    );

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Activate the previous enabled command item.
   */
  private _activatePreviousItem(): void {
    // Bail if there are no search results.
    if (!this._results || this._results.length === 0) {
      return;
    }

    // Find the previous enabled item index.
    let ai = this._activeIndex;
    let n = this._results.length;
    let start = ai <= 0 ? n - 1 : ai - 1;
    let stop = start === n - 1 ? 0 : start + 1;
    this._activeIndex = ArrayExt.findLastIndex(
      this._results, Private.canActivate, start, stop
    );

    // Schedule an update of the items.
    this.update();
  }

  /**
   * Execute the command item at the given index, if possible.
   */
  private _execute(index: number): void {
    // Bail if there are no search results.
    if (!this._results) {
      return;
    }

    // Bail if the index is out of range.
    let part = this._results[index];
    if (!part) {
      return;
    }

    // Bail if the part is not an enabled item.
    if (part.type !== 'item' || !part.item.isEnabled) {
      return;
    }

    // Execute the item.
    this.commands.execute(part.item.command, part.item.args);

    // Clear the query text.
    this.inputNode.value = '';

    // Refresh the search results.
    this._refresh();
  }

  /**
   * Toggle the focused modifier based on the input node focus state.
   */
  private _toggleFocused(): void {
    let focused = document.activeElement === this.inputNode;
    this.toggleClass(CommandPalette.FOCUSED_CLASS, focused);
  }

  /**
   * Clear the search results and schedule an item update.
   */
  private _refresh(): void {
    this._results = null;
    this.update();
  }

  /**
   * A signal handler for generic command changes.
   */
  private _onGenericChange(): void {
    this._refresh();
  }

  private _activeIndex = -1;
  private _items: CommandPalette.IItem[] = [];
  private _results: Private.SearchResult[] | null = null;
}


/**
 * The namespace for the `CommandPalette` class statics.
 */
export
namespace CommandPalette {
  /**
   * The class name added to `CommandPalette` instances.
   */
  export
  const COMMAND_PALETTE_CLASS = 'p-CommandPalette';

  /**
   * The class name added to the input wrapper in the search section.
   */
  export
  const WRAPPER_CLASS = 'p-CommandPalette-wrapper';

  /**
   * The class name added to the search section of the palette.
   */
  export
  const SEARCH_CLASS = 'p-CommandPalette-search';

  /**
   * The class name added to the input node in the search section.
   */
  export
  const INPUT_CLASS = 'p-CommandPalette-input';

  /**
   * The class name added to the content section of the palette.
   */
  export
  const CONTENT_CLASS = 'p-CommandPalette-content';

  /**
   * The class name added to a focused palette.
   */
  export
  const FOCUSED_CLASS = 'p-mod-focused';

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
     * The category for the item.
     */
    category: string;

    /**
     * The command to execute when the item is triggered.
     */
    command: string;

    /**
     * The arguments for the command.
     *
     * The default value is `null`.
     */
    args?: JSONObject | null;
  }

  /**
   * An object which represents an item in a command palette.
   *
   * #### Notes
   * Item objects are created automatically by a command palette.
   */
  export
  interface IItem {
    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: JSONObject | null;

    /**
     * The category for the command item.
     */
    readonly category: string;

    /**
     * The display label for the command item.
     */
    readonly label: string;

    /**
     * The display caption for the command item.
     */
    readonly caption: string;

    /**
     * The extra class name for the command item.
     */
    readonly className: string;

    /**
     * Whether the command item is enabled.
     */
    readonly isEnabled: boolean;

    /**
     * Whether the command item is toggled.
     */
    readonly isToggled: boolean;

    /**
     * Whether the command item is visible.
     */
    readonly isVisible: boolean;

    /**
     * The key binding for the command item.
     */
    readonly keyBinding: CommandRegistry.IKeyBinding | null;
  }

  /**
   * The render data for a command palette header.
   */
  export
  interface IHeaderRenderData {
    /**
     * The label for the header.
     */
    readonly label: string;
  }

  /**
   * The render data for a command palette item.
   */
  export
  interface IItemRenderData {
    /**
     * The command palette item to render.
     */
    readonly item: IItem;

    /**
     * The indices of the matched characters in the item label.
     */
    readonly indices: ReadonlyArray<number> | null;

    /**
     * Whether the item is the active item.
     */
    readonly active: boolean;
  }

  /**
   * The render data for a command palette empty message.
   */
  export
  interface IEmptyMessageRenderData {
    /**
     * The query which failed to match any commands.
     */
    query: string;
  }

  /**
   * A renderer for use with a command palette.
   */
  export
  interface IRenderer {
    /**
     * Render the virtual element for a command palette header.
     *
     * @param data - The data to use for rendering the header.
     *
     * @returns A virtual element representing the header.
     */
    renderHeader(data: IHeaderRenderData): VirtualElement;

    /**
     * Render the virtual element for a command palette item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     *
     * #### Notes
     * The command palette will not render invisible items.
     */
    renderItem(data: IItemRenderData): VirtualElement;

    /**
     * Render the empty results message for a command palette.
     *
     * @param data - The data to use for rendering the message.
     *
     * @returns A virtual element representing the message.
     */
    renderEmptyMessage(data: IEmptyMessageRenderData): VirtualElement;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Render the virtual element for a command palette header.
     *
     * @param data - The data to use for rendering the header.
     *
     * @returns A virtual element representing the header.
     */
    renderHeader(data: IHeaderRenderData): VirtualElement {
      let content = this.formatHeaderLabel(data);
      return h.li({ className: Renderer.HEADER_CLASS }, content);
    }

    /**
     * Render the virtual element for a command palette item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IItemRenderData): VirtualElement {
      let className = this.createItemClass(data);
      let dataset = this.createItemDataset(data);
      return (
        h.li({ className, dataset },
          this.renderItemShortcut(data),
          this.renderItemLabel(data),
          this.renderItemCaption(data)
        )
      );
    }

    /**
     * Render the empty results message for a command palette.
     *
     * @param data - The data to use for rendering the message.
     *
     * @returns A virtual element representing the message.
     */
    renderEmptyMessage(data: IEmptyMessageRenderData): VirtualElement {
      let content = this.formatEmptyMessage(data);
      return h.li({ className: Renderer.EMPTY_MESSAGE_CLASS }, content);
    }

    /**
     * Render the shortcut for a command palette item.
     *
     * @param data - The data to use for rendering the shortcut.
     *
     * @returns A virtual element representing the shortcut.
     */
    renderItemShortcut(data: IItemRenderData): VirtualElement {
      let content = this.formatItemShortcut(data);
      return h.div({ className: Renderer.SHORTCUT_CLASS }, content);
    }

    /**
     * Render the label for a command palette item.
     *
     * @param data - The data to use for rendering the label.
     *
     * @returns A virtual element representing the label.
     */
    renderItemLabel(data: IItemRenderData): VirtualElement {
      let content = this.formatItemLabel(data);
      return h.div({ className: Renderer.LABEL_CLASS }, content);
    }

    /**
     * Render the caption for a command palette item.
     *
     * @param data - The data to use for rendering the caption.
     *
     * @returns A virtual element representing the caption.
     */
    renderItemCaption(data: IItemRenderData): VirtualElement {
      let content = this.formatItemCaption(data);
      return h.div({ className: Renderer.CAPTION_CLASS }, content);
    }

    /**
     * Create the class name for the command palette item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the command palette item.
     */
    createItemClass(data: IItemRenderData): string {
      // Setup the initial class name.
      let name = Renderer.ITEM_CLASS;

      // Add the boolean state classes.
      if (!data.item.isEnabled) {
        name += ` ${Renderer.DISABLED_CLASS}`;
      }
      if (data.item.isToggled) {
        name += ` ${Renderer.TOGGLED_CLASS}`;
      }
      if (data.active) {
        name += ` ${Renderer.ACTIVE_CLASS}`;
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
     * Create the dataset for the command palette item.
     *
     * @param data - The data to use for creating the dataset.
     *
     * @returns The dataset for the command palette item.
     */
    createItemDataset(data: IItemRenderData): ElementDataset {
      return { command: data.item.command };
    }

    /**
     * Create the render content for the header label node.
     *
     * @param data - The data to use for the label content.
     *
     * @returns The content to add to the label node.
     */
    formatHeaderLabel(data: IHeaderRenderData): h.Child {
      return data.label;
    }

    /**
     * Create the render content for the empty message node.
     *
     * @param data - The data to use for the empty message content.
     *
     * @returns The content to add to the empty message node.
     */
    formatEmptyMessage(data: IEmptyMessageRenderData): h.Child {
      return `No commands found that match '${data.query}'`;
    }

    /**
     * Create the render content for the item shortcut node.
     *
     * @param data - The data to use for the shortcut content.
     *
     * @returns The content to add to the shortcut node.
     */
    formatItemShortcut(data: IItemRenderData): h.Child {
      let kb = data.item.keyBinding;
      return kb ? kb.keys.map(Private.formatKeystroke).join(', ') : null;
    }

    /**
     * Create the render content for the item label node.
     *
     * @param data - The data to use for the label content.
     *
     * @returns The content to add to the label node.
     */
    formatItemLabel(data: IItemRenderData): h.Child {
      if (!data.indices || data.indices.length === 0) {
        return data.item.label;
      }
      return this.highlight(data.item.label, data.indices, h.mark);
    }

    /**
     * Create the render content for the item caption node.
     *
     * @param data - The data to use for the caption content.
     *
     * @returns The content to add to the caption node.
     */
    formatItemCaption(data: IItemRenderData): h.Child {
      return data.item.caption;
    }

    /**
     * Highlight the matched characters of a source string.
     *
     * @param source - The text which should be highlighted.
     *
     * @param indices - The indices of the matched characters. They must
     *   appear in increasing order and must be in bounds of the source.
     *
     * @param fn - The function to apply to matched chunks.
     *
     * @returns An array of unmatched and highlighted chunks.
     */
    highlight<T>(source: string, indices: ReadonlyArray<number>, fn: (chunk: string) => T): Array<string | T> {
      // Setup the result array.
      let result: Array<string |T> = [];

      // Setup the counter variables.
      let k = 0;
      let last = 0;
      let n = indices.length;

      // Iterator over each index.
      while (k < n) {
        // Setup the chunk indices.
        let i = indices[k];
        let j = indices[k];

        // Advance the right chunk index until its non-contiguous.
        while (++k < n && indices[k] === j + 1) {
          j++;
        }

        // Extract the unmatched text.
        if (last < i) {
          result.push(source.slice(last, i));
        }

        // Extract and highlight the matched text.
        if (i < j + 1) {
          result.push(fn(source.slice(i, j + 1)));
        }

        // Update the last visited index.
        last = j + 1;
      }

      // Extract any remaining unmatched text.
      if (last < source.length) {
        result.push(source.slice(last));
      }

      // Return the highlighted result.
      return result;
    }
  }

  /**
   * The namespace for the `Renderer` class statics.
   */
  export
  namespace Renderer {
    /**
     * The class name added to a palette section header.
     */
    export
    const HEADER_CLASS = 'p-CommandPalette-header';

    /**
     * The class name added to a palette item node.
     */
    export
    const ITEM_CLASS = 'p-CommandPalette-item';

    /**
     * The class name added to a the empty message node.
     */
    export
    const EMPTY_MESSAGE_CLASS = 'p-CommandPalette-emptyMessage';

    /**
     * The class name added to a item label node.
     */
    export
    const LABEL_CLASS = 'p-CommandPalette-itemLabel';

    /**
     * The class name added to a item shortcut node.
     */
    export
    const SHORTCUT_CLASS = 'p-CommandPalette-itemShortcut';

    /**
     * The class name added to a item caption node.
     */
    export
    const CAPTION_CLASS = 'p-CommandPalette-itemCaption';

    /**
     * The class name added to a disabled command item.
     */
    export
    const DISABLED_CLASS = 'p-mod-disabled';

    /**
     * The class name added to a toggled command item.
     */
    export
    const TOGGLED_CLASS = 'p-mod-toggled';

    /**
     * The class name added to the active command item.
     */
    export
    const ACTIVE_CLASS = 'p-mod-active';
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
   * Create the DOM node for a command palette.
   */
  export
  function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let search = document.createElement('div');
    let wrapper = document.createElement('div');
    let input = document.createElement('input');
    let content = document.createElement('ul');
    search.className = CommandPalette.SEARCH_CLASS;
    wrapper.className = CommandPalette.WRAPPER_CLASS;
    input.className = CommandPalette.INPUT_CLASS;
    content.className = CommandPalette.CONTENT_CLASS;
    input.spellcheck = false;
    wrapper.appendChild(input);
    search.appendChild(wrapper);
    node.appendChild(search);
    node.appendChild(content);
    return node;
  }

  /**
   * Create a new command item from a command registry and options.
   */
  export
  function createItem(commands: CommandRegistry, options: CommandPalette.IItemOptions): CommandPalette.IItem {
    return new CommandItem(commands, options);
  }

  /**
   * Format a keystroke for display on the local system.
   */
  export
  function formatKeystroke(keystroke: string): string {
    let mods = '';
    let parts = CommandRegistry.parseKeystroke(keystroke);
    if (IS_MAC) {
      if (parts.ctrl) {
        mods += '\u2303 ';
      }
      if (parts.alt) {
        mods += '\u2325 ';
      }
      if (parts.shift) {
        mods += '\u21E7 ';
      }
      if (parts.cmd) {
        mods += '\u2318 ';
      }
    } else {
      if (parts.ctrl) {
        mods += 'Ctrl+';
      }
      if (parts.alt) {
        mods += 'Alt+';
      }
      if (parts.shift) {
        mods += 'Shift+';
      }
    }
    return mods + parts.key;
  }

  /**
   * A search result object for a header label.
   */
  export
  interface IHeaderResult {
    /**
     * The discriminated type of the object.
     */
    readonly type: 'header';

    /**
     * The category label for the header.
     */
    readonly label: string;
  }

  /**
   * A search result object for a command item.
   */
  export
  interface IItemResult {
    /**
     * The discriminated type of the object.
     */
    type: 'item';

    /**
     * The command item which was matched.
     */
    readonly item: CommandPalette.IItem;

    /**
     * The indices of the matched label characters.
     */
    readonly indices: ReadonlyArray<number> | null;
  }

  /**
   * A type alias for a search result item.
   */
  export
  type SearchResult = IHeaderResult | IItemResult;

  /**
   * Search an array of command items for fuzzy matches.
   */
  export
  function search(items: CommandPalette.IItem[], query: string): SearchResult[] {
    // Fuzzy match the items for the query.
    let scores = matchItems(items, query);

    // Sort the items based on their score.
    scores.sort(scoreCmp);

    // Create the results for the search.
    return createResults(scores);
  }

  /**
   * Test whether a result item can be activated.
   */
  export
  function canActivate(result: SearchResult): boolean {
    return result.type === 'item' && result.item.isEnabled;
  }

  /**
   * Normalize a category for a command item.
   */
  function normalizeCategory(category: string): string {
    return category.trim().replace(/\s+/g, ' ');
  }

  /**
   * Normalize the query text for a fuzzy search.
   */
  function normalizeQuery(text: string): string {
    return text.replace(/\s+/g, '').toLowerCase();
  }

  /**
   * Normalize the source text for a fuzzy search.
   */
  function normalizeSource(text: string): string {
    return text.toLowerCase();
  }

  /**
   * A text match score with associated command item.
   */
  interface IScore {
    /**
     * The numerical score for the text match.
     */
    score: number;

    /**
     * The indices of the matched label text.
     */
    indices: number[] | null;

    /**
     * The command item associated with the match.
     */
    item: CommandPalette.IItem;
  }

  /**
   * Perform a fuzzy match on an array of command items.
   */
  function matchItems(items: CommandPalette.IItem[], query: string): IScore[] {
    // Normalize the query text to lower case with no whitespace.
    query = normalizeQuery(query);

    // Create the array to hold the scores.
    let scores: IScore[] = [];

    // Iterate over the items and match against the query.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Ignore items which are not visible.
      let item = items[i];
      if (!item.isVisible) {
        continue;
      }

      // If the query is empty, all items are matched by default.
      if (!query) {
        scores.push({ score: 0, indices: null, item });
        continue;
      }

      // Create the source text to be searched.
      let source = normalizeSource(item.label);

      // Run the fuzzy search for the source and query.
      let match = StringExt.fuzzySearch(source, query);

      // Skip the item if there is no match.
      if (!match) {
        continue;
      }

      // Create the score for the matched item.
      scores.push({ score: match.score, indices: match.indices, item });
    }

    // Return the final array of scores.
    return scores;
  }

  /**
   * A sort comparison function for a match score.
   */
  function scoreCmp(a: IScore, b: IScore): number {
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
   * Create the results from an array of sorted scores.
   */
  function createResults(scores: IScore[]): SearchResult[] {
    // Setup an array to track which scores have been visited.
    let visited = new Array(scores.length);
    ArrayExt.fill(visited, false);

    // Setup the search results array.
    let results: SearchResult[] = [];

    // Iterate over each score in the array.
    for (let i = 0, n = scores.length; i < n; ++i) {
      // Ignore a score which has already been processed.
      if (visited[i]) {
        continue;
      }

      // Extract the category for the current score.
      let category = scores[i].item.category;

      // Add the header result for the category.
      results.push({ type: 'header', label: category });

      // Find the rest of the scores with the same category.
      for (let j = i; j < n; ++j) {
        // Ignore a score which has already been processed.
        if (visited[j]) {
          continue;
        }

        // Extract the data for the current score.
        let { item, indices } = scores[j];

        // Ignore an item with a different category.
        if (item.category !== category) {
          continue;
        }

        // Create the item result for the score.
        results.push({ type: 'item', item, indices });

        // Mark the score as processed.
        visited[j] = true;
      }
    }

    // Return the final results.
    return results;
  }

  /**
   * A concrete implementation of `CommandPalette.IItem`.
   */
  class CommandItem implements CommandPalette.IItem {
    /**
     * Construct a new command item.
     */
    constructor(commands: CommandRegistry, options: CommandPalette.IItemOptions) {
      this._commands = commands;
      this.category = normalizeCategory(options.category);
      this.command = options.command;
      this.args = options.args || null;
    }

    /**
     * The category for the command item.
     */
    readonly category: string;

    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: JSONObject | null;

    /**
     * The display label for the command item.
     */
    get label(): string {
      return this._commands.label(this.command, this.args);
    }

    /**
     * The display caption for the command item.
     */
    get caption(): string {
      return this._commands.caption(this.command, this.args);
    }

    /**
     * The extra class name for the command item.
     */
    get className(): string {
      return this._commands.className(this.command, this.args);
    }

    /**
     * Whether the command item is enabled.
     */
    get isEnabled(): boolean {
      return this._commands.isEnabled(this.command, this.args);
    }

    /**
     * Whether the command item is toggled.
     */
    get isToggled(): boolean {
      return this._commands.isToggled(this.command, this.args);
    }

    /**
     * Whether the command item is visible.
     */
    get isVisible(): boolean {
      return this._commands.isVisible(this.command, this.args);
    }

    /**
     * The key binding for the command item.
     */
    get keyBinding(): CommandRegistry.IKeyBinding | null {
      return this._commands.findKeyBinding(this.command, this.args) || null;
    }

    private _commands: CommandRegistry;
  }
}
