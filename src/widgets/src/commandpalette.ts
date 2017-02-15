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
    this.addClass('p-CommandPalette');
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
    return this.node.getElementsByClassName('p-CommandPalette-search')[0] as HTMLDivElement;
  }

  /**
   * The command palette input node.
   *
   * #### Notes
   * This is the actual input node for the search area.
   */
  get inputNode(): HTMLInputElement {
    return this.node.getElementsByClassName('p-CommandPalette-input')[0] as HTMLInputElement;
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
    return this.node.getElementsByClassName('p-CommandPalette-content')[0] as HTMLUListElement;
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
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('click', this);
    this.node.addEventListener('keydown', this);
    this.node.addEventListener('input', this);
    this.node.addEventListener('focus', this, true);
    this.node.addEventListener('blur', this, true);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
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
        let indices = result.indices;
        let category = result.category;
        content[i] = renderer.renderHeader({ category, indices });
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

    // Update the search text if the item is a header.
    if (part.type === 'header') {
      let input = this.inputNode;
      input.value = `${part.category.toLowerCase()} `;
      input.focus();
      this._refresh();
      return;
    }

    // Bail if item is not enabled.
    if (!part.item.isEnabled) {
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
    this.toggleClass('p-mod-focused', focused);
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

    /**
     * The rank for the command item.
     *
     * The rank is used as a tie-breaker when ordering command items
     * for display. Items are sorted in the following order:
     *   1. Text match (lower is better)
     *   2. Category (locale order)
     *   3. Rank (lower is better)
     *   4. Label (locale order)
     *
     * The default rank is `Infinity`.
     */
    rank?: number;
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
     * The rank for the command item.
     */
    readonly rank: number;

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
     * The category of the header.
     */
    readonly category: string;

    /**
     * The indices of the matched characters in the category.
     */
    readonly indices: ReadonlyArray<number> | null;
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
     * The indices of the matched characters in the label.
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
      let content = this.formatHeader(data);
      return h.li({ className: 'p-CommandPalette-header' }, content);
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
      return h.li({ className: 'p-CommandPalette-emptyMessage' }, content);
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
      return h.div({ className: 'p-CommandPalette-itemShortcut' }, content);
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
      return h.div({ className: 'p-CommandPalette-itemLabel' }, content);
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
      return h.div({ className: 'p-CommandPalette-itemCaption' }, content);
    }

    /**
     * Create the class name for the command palette item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the command palette item.
     */
    createItemClass(data: IItemRenderData): string {
      // Set up the initial class name.
      let name = 'p-CommandPalette-item';

      // Add the boolean state classes.
      if (!data.item.isEnabled) {
        name += ' p-mod-disabled';
      }
      if (data.item.isToggled) {
        name += ' p-mod-toggled';
      }
      if (data.active) {
        name += ' p-mod-active';
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
     * Create the render content for the header node.
     *
     * @param data - The data to use for the header content.
     *
     * @returns The content to add to the header node.
     */
    formatHeader(data: IHeaderRenderData): h.Child {
      if (!data.indices || data.indices.length === 0) {
        return data.category;
      }
      return StringExt.highlight(data.category, data.indices, h.mark);
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
      return StringExt.highlight(data.item.label, data.indices, h.mark);
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
   * Create the DOM node for a command palette.
   */
  export
  function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let search = document.createElement('div');
    let wrapper = document.createElement('div');
    let input = document.createElement('input');
    let content = document.createElement('ul');
    search.className = 'p-CommandPalette-search';
    wrapper.className = 'p-CommandPalette-wrapper';
    input.className = 'p-CommandPalette-input';
    content.className = 'p-CommandPalette-content';
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
     * The category for the header.
     */
    readonly category: string;

    /**
     * The indices of the matched category characters.
     */
    readonly indices: ReadonlyArray<number> | null;
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
   * A text match score with associated command item.
   */
  interface IScore {
    /**
     * The numerical score for the text match.
     */
    score: number;

    /**
     * The indices of the matched category characters.
     */
    categoryIndices: number[] | null;

    /**
     * The indices of the matched label characters.
     */
    labelIndices: number[] | null;

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
        scores.push({
          score: 0, categoryIndices: null, labelIndices: null, item
        });
        continue;
      }

      // Run the fuzzy search for the item and query.
      let score = fuzzySearch(item, query);

      // Ignore the item if it is not a match.
      if (!score) {
        continue;
      }

      // Penalize disabled items.
      if (!item.isEnabled) {
        score.score += 1000;
      }

      // Add the score to the results.
      scores.push(score);
    }

    // Return the final array of scores.
    return scores;
  }

  /**
   * Perform a fuzzy search on a single command item.
   */
  function fuzzySearch(item: CommandPalette.IItem, query: string): IScore | null {
    // Normalize the case of the category and label.
    let category = item.category.toLowerCase();
    let label = item.label.toLowerCase();

    // Set up the result variables.
    let categoryIndices: number[] | null = null;
    let labelIndices: number[] | null = null;
    let score = Infinity;

    // Test for a full match in the category.
    let cMatch = StringExt.matchSumOfDeltas(category, query);
    if (cMatch && cMatch.score < score) {
      score = cMatch.score;
      categoryIndices = cMatch.indices;
      labelIndices = null;
    }

    // Test for a better full match in the label.
    let lMatch = StringExt.matchSumOfDeltas(label, query);
    if (lMatch && lMatch.score < score) {
      score = lMatch.score;
      labelIndices = lMatch.indices;
      categoryIndices = null;
    }

    // Test for a better split match.
    for (let i = 0, n = query.length - 1; i < n; ++i) {
      let cMatch = StringExt.matchSumOfDeltas(category, query.slice(0, i + 1));
      if (!cMatch) {
        continue;
      }
      let lMatch = StringExt.matchSumOfDeltas(label, query.slice(i + 1));
      if (!lMatch) {
        continue;
      }
      if (cMatch.score + lMatch.score < score) {
        score = cMatch.score + lMatch.score;
        categoryIndices = cMatch.indices;
        labelIndices = lMatch.indices;
      }
    }

    // Bail if there is no match.
    if (score === Infinity) {
      return null;
    }

    // Return the final score and matched indices.
    return { score, categoryIndices, labelIndices, item };
  }

  /**
   * A sort comparison function for a match score.
   */
  function scoreCmp(a: IScore, b: IScore): number {
    // First compare based on the match score.
    let d1 = a.score - b.score;
    if (d1 !== 0) {
      return d1;
    }

    // Otherwise, prefer a pure category match.
    let c1 = !!a.categoryIndices && !a.labelIndices;
    let c2 = !!b.categoryIndices && !b.labelIndices;
    if (c1 !== c2) {
      return c1 ? -1 : 1;
    }

    // Otherwise, prefer a pure label match.
    let l1 = !!a.labelIndices && !a.categoryIndices;
    let l2 = !!b.labelIndices && !b.categoryIndices;
    if (l1 !== l2) {
      return l1 ? -1 : 1;
    }

    // Otherwise, compare by category.
    let d2 = a.item.category.localeCompare(b.item.category);
    if (d2 !== 0) {
      return d2;
    }

    // Otherwise, compare by rank.
    let r1 = a.item.rank;
    let r2 = b.item.rank;
    if (r1 !== r2) {
      return r1 < r2 ? -1 : 1;  // Infinity safe
    }

    // Finally, compare by label.
    return a.item.label.localeCompare(b.item.label);
  }

  /**
   * Create the results from an array of sorted scores.
   */
  function createResults(scores: IScore[]): SearchResult[] {
    // Set up an array to track which scores have been visited.
    let visited = new Array(scores.length);
    ArrayExt.fill(visited, false);

    // Set up the search results array.
    let results: SearchResult[] = [];

    // Iterate over each score in the array.
    for (let i = 0, n = scores.length; i < n; ++i) {
      // Ignore a score which has already been processed.
      if (visited[i]) {
        continue;
      }

      // Extract the current item and indices.
      let { item, categoryIndices } = scores[i];

      // Extract the category for the current item.
      let category = item.category;

      // Add the header result for the category.
      results.push({ type: 'header', category, indices: categoryIndices });

      // Find the rest of the scores with the same category.
      for (let j = i; j < n; ++j) {
        // Ignore a score which has already been processed.
        if (visited[j]) {
          continue;
        }

        // Extract the data for the current score.
        let { item, labelIndices } = scores[j];

        // Ignore an item with a different category.
        if (item.category !== category) {
          continue;
        }

        // Create the item result for the score.
        results.push({ type: 'item', item, indices: labelIndices });

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
      this.rank = options.rank !== undefined ? options.rank : Infinity;
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
     * The rank for the command item.
     */
    readonly rank: number;

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
