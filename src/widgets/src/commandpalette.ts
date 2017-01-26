/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  CommandRegistry
} from '@phosphor/commands';

import {
  JSONObject
} from '@phosphor/json';

import {
  Keymap
} from '@phosphor/keymap';

import {
  ElementDataset, VirtualElement, h
} from '@phosphor/virtualdom';

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
    this.keymap = options.keymap || null;
    this.renderer = options.renderer || CommandPalette.defaultRenderer;
    this.commands.commandChanged.connect(this._onGenericChange, this);
    if (this.keymap) {
      this.keymap.bindingChanged.connect(this._onGenericChange, this);
    }
    Private.sanityCheckCommands(this);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._items.length = 0;
    this._result = null;
    super.dispose();
  }

  /**
   * The command registry used by the command palette.
   */
  readonly commands: CommandRegistry;

  /**
   * The keymap used by the command palette.
   */
  readonly keymap: Keymap | null;

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
   * A signal handler for commands and keymap changes.
   */
  private _onGenericChange(): void {
    this.update();
  }

  private _items: CommandPalette.IItem[] = [];
  private _result: Private.ISearchResult | null = null;
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
     *
     * If a keymap is not supplied, shortcuts will not be rendered.
     */
    keymap?: Keymap;

    /**
     * A custom renderer for use with the command palette.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
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
    readonly keyBinding: Keymap.IBinding | null;
  }

  /**
   *
   */
  export
  interface IHeaderRenderData {
    /**
     *
     */
    readonly label: string;

    /**
     *
     */
    readonly indices: ReadonlyArray<number>;
  }

  /**
   *
   */
  export
  interface IItemRenderData {
    /**
     *
     */
    readonly item: IItem;

    /**
     *
     */
    readonly indices: ReadonlyArray<number>;

    /**
     *
     */
    readonly active: boolean;
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
     */
    renderItem(data: IItemRenderData): VirtualElement;
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
     *
     */
    renderItemShortcut(data: IItemRenderData): VirtualElement {
      let content = this.formatItemShortcut(data);
      return h.div({ className: Renderer.SHORTCUT_CLASS }, content);
    }

    /**
     *
     */
    renderItemLabel(data: IItemRenderData): VirtualElement {
      let content = this.formatItemLabel(data);
      return h.div({ className: Renderer.LABEL_CLASS }, content);
    }

    /**
     *
     */
    renderItemCaption(data: IItemRenderData): VirtualElement {
      return h.div({ className: Renderer.CAPTION_CLASS }, data.item.caption);
    }

    /**
     *
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

      // TODO visibility? palette simply not render hidden items?

      // Add the extra class.
      let extra = data.item.className;
      if (extra) {
        name += ` ${extra}`;
      }

      // Return the complete class name.
      return name;
    }

    /**
     *
     */
    createItemDataset(data: IItemRenderData): ElementDataset {
      return { command: data.item.command };
    }

    /**
     *
     */
    formatHeaderLabel(data: IHeaderRenderData): h.Child {
      return this.formatLabelCommon(data.label, data.indices);
    }

    /**
     *
     */
    formatItemLabel(data: IItemRenderData): h.Child {
      return this.formatLabelCommon(data.item.label, data.indices);
    }

    /**
     *
     */
    formatLabelCommon(label: string, indices: ReadonlyArray<number>): h.Child {

    }

    /**
     * Create the render content for the shortcut node.
     *
     * @param data - The data to use for the shortcut content.
     *
     * @returns The content to add to the shortcut node.
     */
    formatItemShortcut(data: IItemRenderData): h.Child {
      let kb = data.item.keyBinding;
      return kb ? kb.keys.map(Keymap.formatKeystroke).join(' ') : null;
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
   * Ensure that the palette commands and keymap commands match.
   *
   * This throws an error if the objects are incompatible.
   */
  export
  function sanityCheckCommands(palette: CommandPalette): void {
    if (!palette.keymap || palette.commands === palette.keymap.commands) {
      return;
    }
    throw new Error('`palette.commands` !== `palette.keymap.commands`');
  }
}
