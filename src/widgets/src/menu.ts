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
 * A widget which displays items as a canonical menu.
 */
export
class Menu extends Widget {
  /**
   * Construct a new menu.
   *
   * @param options - The options for initializing the menu.
   */
  constructor(options: Menu.IOptions) {
    super({ node: Private.createNode() });
    this.addClass(Menu.MENU_CLASS);
    this.setFlag(Widget.Flag.DisallowLayout);
    this.commands = options.commands;
    this.keymap = options.keymap || null;
    this.renderer = options.renderer || Menu.defaultRenderer;
    // TODO warn if keymap.commands !== commands.
  }

  /**
   * The command registry used by the menu.
   */
  readonly commands: CommandRegistry;

  /**
   * The keymap used by the menu.
   */
  readonly keymap: Keymap | null;

  /**
   * The renderer used by the menu.
   */
  readonly renderer: Menu.IRenderer;
}


/**
 * The namespace for the `Menu` class statics.
 */
export
namespace Menu {
  /**
   * The class name added to Menu instances.
   */
  export
  const MENU_CLASS = 'p-Menu';

  /**
   * The class name added to a menu content node.
   */
  export
  const CONTENT_CLASS = 'p-Menu-content';

  /**
   * An options object for creating a menu.
   */
  export
  interface IOptions {
    /**
     * The command registry for use with the menu.
     */
    commands: CommandRegistry;

    /**
     * The keymap for use with the menu.
     *
     * If a keymap is provided, it's `commands` registry should be the
     * same as the `commands` option, or the menu items may not render
     * the correct key bindings.
     */
    keymap?: Keymap;

    /**
     * A custom renderer for use with the menu.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * A type alias for a menu item type.
   */
  export
  type ItemType = 'command' | 'submenu' | 'separator';

  /**
   * An object which represents a menu item.
   *
   * #### Notes
   * Item objects are created automatically by a menu.
   */
  export
  interface IItem {
    /**
     * The type of the menu item.
     */
    readonly type: ItemType;

    /**
     * The command to execute when the item is triggered.
     */
    readonly command: string;

    /**
     * The arguments for the command.
     */
    readonly args: JSONObject | null;

    /**
     * The menu for a `'submenu'` type item.
     */
    readonly submenu: Menu | null;

    /**
     * The display label for the menu item.
     */
    readonly label: string;

    /**
     * The mnemonic index for the menu item.
     */
    readonly mnemonic: number;

    /**
     * The icon class for the menu item.
     */
    readonly icon: string;

    /**
     * The display caption for the menu item.
     */
    readonly caption: string;

    /**
     * The extra class name for the menu item.
     */
    readonly className: string;

    /**
     * Whether the menu item is enabled.
     */
    readonly isEnabled: boolean;

    /**
     * Whether the menu item is toggled.
     */
    readonly isToggled: boolean;

    /**
     * Whether the menu item is visible.
     */
    readonly isVisible: boolean;

    /**
     * The key binding for the menu item.
     */
    readonly keyBinding: Keymap.IBinding | null;
  }

  /**
   * An object which holds the data to render a menu item.
   */
  export
  interface IRenderData {
    /**
     * The item to be rendered.
     */
    readonly item: IItem;

    /**
     * Whether the item is the active item.
     */
    readonly active: boolean;

    /**
     * Whether the item should be collapsed.
     */
    readonly collapsed: boolean;
  }

  /**
   * A renderer for use with a menu.
   */
  export
  interface IRenderer {
    /**
     * Render the virtual element for a menu item.
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
     * Render the virtual element for a menu item.
     *
     * @param data - The data to use for rendering the item.
     *
     * @returns A virtual element representing the item.
     */
    renderItem(data: IRenderData): VirtualElement {
      let className = this.createItemClass(data);
      let dataset = this.createItemDataset(data);
      return (
        h.li({ className, dataset },
          this.renderIcon(data),
          this.renderLabel(data),
          this.renderShortcut(data),
          this.renderSubmenu(data)
        )
      );
    }

    /**
     * Render the icon element for a menu item.
     *
     * @param data - The data to use for rendering the icon.
     *
     * @returns A virtual element representing the item icon.
     */
    renderIcon(data: IRenderData): VirtualElement {
      return h.div({ className: this.createIconClass(data) });
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
      return h.div({ className: Renderer.LABEL_CLASS }, content);
    }

    /**
     * Render the shortcut element for a menu item.
     *
     * @param data - The data to use for rendering the shortcut.
     *
     * @returns A virtual element representing the item shortcut.
     */
    renderShortcut(data: IRenderData): VirtualElement {
      let content = this.formatShortcut(data);
      return h.div({ className: Renderer.SHORTCUT_CLASS }, content);
    }

    /**
     * Render the submenu icon element for a menu item.
     *
     * @param data - The data to use for rendering the submenu icon.
     *
     * @returns A virtual element representing the submenu icon.
     */
    renderSubmenu(data: IRenderData): VirtualElement {
      return h.div({ className: Renderer.SUBMENU_ICON_CLASS });
    }

    /**
     * Create the class name for the menu item.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the menu item.
     */
    createItemClass(data: IRenderData): string {
      // Setup the initial class name.
      let name = Renderer.ITEM_CLASS;

      // Add the type class.
      switch (data.item.type) {
      case 'command':
        name += ` ${Renderer.COMMAND_TYPE_CLASS}`;
        break;
      case 'submenu':
        name += ` ${Renderer.SUBMENU_TYPE_CLASS}`;
        break;
      case 'separator':
        name += ` ${Renderer.SEPARATOR_TYPE_CLASS}`;
        break;
      }

      // Add the boolean state classes.
      if (!data.item.isEnabled) {
        name += ` ${Renderer.DISABLED_CLASS}`;
      }
      if (data.item.isToggled) {
        name += ` ${Renderer.TOGGLED_CLASS}`;
      }
      if (!data.item.isVisible) {
        name += ` ${Renderer.HIDDEN_CLASS}`;
      }
      if (data.active) {
        name += ` ${Renderer.ACTIVE_CLASS}`;
      }
      if (data.collapsed) {
        name += ` ${Renderer.COLLAPSED_CLASS}`;
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
     * Create the dataset for the menu item.
     *
     * @param data - The data to use for creating the dataset.
     *
     * @returns The dataset for the menu item.
     */
    createItemDataset(data: IRenderData): ElementDataset {
      let { type, command } = data.item;
      return type === 'command' ? { command } : { };
    }

    /**
     * Create the class name for the menu item icon.
     *
     * @param data - The data to use for the class name.
     *
     * @returns The full class name for the item icon.
     */
    createIconClass(data: IRenderData): string {
      let name = Renderer.ICON_CLASS;
      let extra = data.item.icon;
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
      let label = data.item.label;
      let mnemonic = data.item.mnemonic;

      // If the index is out of range, do not modify the label.
      if (mnemonic < 0 || mnemonic >= label.length) {
        return label;
      }

      // Split the label into parts.
      let prefix = label.slice(0, mnemonic);
      let suffix = label.slice(mnemonic + 1);
      let char = label[mnemonic];

      // Wrap the mnemonic character in a span.
      let span = h.span({ className: Renderer.MNEMONIC_CLASS }, char);

      // Return the content parts.
      return [prefix, span, suffix];
    }

    /**
     * Create the render content for the shortcut node.
     *
     * @param data - The data to use for the shortcut content.
     *
     * @returns The content to add to the shortcut node.
     */
    formatShortcut(data: IRenderData): h.Child {
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
     * The class name added to a menu item node.
     */
    export
    const ITEM_CLASS = 'p-Menu-item';

    /**
     * The class name added to a menu item icon node.
     */
    export
    const ICON_CLASS = 'p-Menu-itemIcon';

    /**
     * The class name added to a menu item label node.
     */
    export
    const LABEL_CLASS = 'p-Menu-itemLabel';

    /**
     * The class name added to a menu item mnemonic node.
     */
    export
    const MNEMONIC_CLASS = 'p-Menu-itemMnemonic';

    /**
     * The class name added to a menu item shortcut node.
     */
    export
    const SHORTCUT_CLASS = 'p-Menu-itemShortcut';

    /**
     * The class name added to a menu item submenu icon node.
     */
    export
    const SUBMENU_ICON_CLASS = 'p-Menu-itemSubmenuIcon';

    /**
     * The class name added to a `'command'` type menu item.
     */
    export
    const COMMAND_TYPE_CLASS = 'p-type-command';

    /**
     * The class name added to a `'separator'` type menu item.
     */
    export
    const SEPARATOR_TYPE_CLASS = 'p-type-separator';

    /**
     * The class name added to a `'submenu'` type menu item.
     */
    export
    const SUBMENU_TYPE_CLASS = 'p-type-submenu';

    /**
     * The class name added to a disabled menu item.
     */
    export
    const DISABLED_CLASS = 'p-mod-disabled';

    /**
     * The class name added to a toggled menu item.
     */
    export
    const TOGGLED_CLASS = 'p-mod-toggled';

    /**
     * The class name added to a hidden menu item.
     */
    export
    const HIDDEN_CLASS = 'p-mod-hidden';

    /**
     * The class name added to active menu items.
     */
    export
    const ACTIVE_CLASS = 'p-mod-active';

    /**
     * The class name added to a collapsed menu item.
     */
    export
    const COLLAPSED_CLASS = 'p-mod-collapsed';
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
   * Create the DOM node for a menu.
   */
  export
  function createNode(): HTMLDivElement {
    let node = document.createElement('div');
    let content = document.createElement('ul');
    content.className = Menu.CONTENT_CLASS;
    node.appendChild(content);
    node.tabIndex = -1;
    return node;
  }
}
