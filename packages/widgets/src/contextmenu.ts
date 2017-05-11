/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, each
} from '@phosphor/algorithm';

import {
  CommandRegistry
} from '@phosphor/commands';

import {
  DisposableDelegate, IDisposable
} from '@phosphor/disposable';

import {
  Selector
} from '@phosphor/domutils';

import {
  Menu
} from './menu';


/**
 * An object which implements a universal context menu.
 *
 * #### Notes
 * The items shown in the context menu are determined by CSS selector
 * matching against the DOM hierarchy at the site of the mouse click.
 * This is similar in concept to how keyboard shortcuts are matched
 * in the command registry.
 */
export
class ContextMenu {
  /**
   * Construct a new context menu.
   *
   * @param options - The options for initializing the menu.
   */
  constructor(options: ContextMenu.IOptions) {
    this.menu = new Menu(options);
  }

  /**
   * The menu widget which displays the matched context items.
   */
  readonly menu: Menu;

  /**
   * Add an item to the context menu.
   *
   * @param options - The options for creating the item.
   *
   * @returns A disposable which will remove the item from the menu.
   */
  addItem(options: ContextMenu.IItemOptions): IDisposable {
    // Create an item from the given options.
    let item = Private.createItem(options, this._idTick++);

    // Add the item to the internal array.
    this._items.push(item);

    // Return a disposable which will remove the item.
    return new DisposableDelegate(() => {
      ArrayExt.removeFirstOf(this._items, item);
    });
  }

  /**
   * Open the context menu in response to a `'contextmenu'` event.
   *
   * @param event - The `'contextmenu'` event of interest.
   *
   * @returns `true` if the menu was opened, or `false` if no items
   *   matched the event and the menu was not opened.
   *
   * #### Notes
   * This method will populate the context menu with items which match
   * the propagation path of the event, then open the menu at the mouse
   * position indicated by the event.
   */
  open(event: MouseEvent): boolean {
    // Clear the current contents of the context menu.
    this.menu.clearItems();

    // Bail early if there are no items to match.
    if (this._items.length === 0) {
      return false;
    }

    // Find the matching items for the event.
    let items = Private.matchItems(this._items, event);

    // Bail if there are no matching items.
    if (!items || items.length === 0) {
      return false;
    }

    // Add the filtered items to the menu.
    each(items, item => { this.menu.addItem(item); });

    // Open the context menu at the current mouse position.
    this.menu.open(event.clientX, event.clientY);

    // Indicate success.
    return true;
  }

  private _idTick = 0;
  private _items: Private.IItem[] = [];
}


/**
 * The namespace for the `ContextMenu` class statics.
 */
export
namespace ContextMenu {
  /**
   * An options object for initializing a context menu.
   */
  export
  interface IOptions {
    /**
     * The command registry to use with the context menu.
     */
    commands: CommandRegistry;

    /**
     * A custom renderer for use with the context menu.
     */
    renderer?: Menu.IRenderer;
  }

  /**
   * An options object for creating a context menu item.
   */
  export
  interface IItemOptions extends Menu.IItemOptions {
    /**
     * The CSS selector for the context menu item.
     *
     * The context menu item will only be displayed in the context menu
     * when the selector matches a node on the propagation path of the
     * contextmenu event. This allows the menu item to be restricted to
     * user-defined contexts.
     *
     * The selector must not contain commas.
     */
    selector: string;

    /**
     * The rank for the item.
     *
     * The rank is used as a tie-breaker when ordering context menu
     * items for display. Items are sorted in the following order:
     *   1. Depth in the DOM tree (deeper is better)
     *   2. Selector specificity (higher is better)
     *   3. Rank (lower is better)
     *   4. Insertion order
     *
     * The default rank is `Infinity`.
     */
    rank?: number;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A normalized item for a context menu.
   */
  export
  interface IItem extends Menu.IItemOptions {
    /**
     * The selector for the item.
     */
    selector: string;

    /**
     * The rank for the item.
     */
    rank: number;

    /**
     * The tie-breaking id for the item.
     */
    id: number;
  }

  /**
   * Create a normalized context menu item from an options object.
   */
  export
  function createItem(options: ContextMenu.IItemOptions, id: number): IItem {
    let selector = validateSelector(options.selector);
    let rank = options.rank !== undefined ? options.rank : Infinity;
    return { ...options, selector, rank, id };
  }

  /**
   * Find the items which match a context menu event.
   *
   * The results are sorted by DOM level, specificity, and rank.
   */
  export
  function matchItems(items: IItem[], event: MouseEvent): IItem[] | null {
    // Look up the target of the event.
    let target = event.target as (Element | null);

    // Bail if there is no target.
    if (!target) {
      return null;
    }

    // Look up the current target of the event.
    let currentTarget = event.currentTarget as (Element | null);

    // Bail if there is no current target.
    if (!currentTarget) {
      return null;
    }

    // CodeMirror has some dark edge cases where right clicking on the
    // caret will cause the `target` to be removed from the DOM before
    // other event handlers process the context menu event. That means
    // the `target` will be a dangling node and the matching may fail.
    // In that case, search for the new target node by point. If that
    // node is still dangling, bail.
    if (!currentTarget.contains(target)) {
      target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target || !currentTarget.contains(target)) {
        return null;
      }
    }

    // Set up the result array.
    let result: IItem[] = [];

    // Copy the items array to allow in-place modification.
    let availableItems: Array<IItem | null> = items.slice();

    // Walk up the DOM hierarchy searching for matches.
    while (target !== null) {
      // Set up the match array for this DOM level.
      let matches: IItem[] = [];

      // Search the remaining items for matches.
      for (let i = 0, n = availableItems.length; i < n; ++i) {
        // Fetch the item.
        let item = availableItems[i];

        // Skip items which are already consumed.
        if (!item) {
          continue;
        }

        // Skip items which do not match the element.
        if (!Selector.matches(target, item.selector)) {
          continue;
        }

        // Add the matched item to the result for this DOM level.
        matches.push(item);

        // Mark the item as consumed.
        availableItems[i] = null;
      }

      // Sort the matches for this level and add them to the results.
      if (matches.length !== 0) {
        matches.sort(itemCmp);
        result.push(...matches);
      }

      // Stop searching at the limits of the DOM range.
      if (target === currentTarget) {
        break;
      }

      // Step to the parent DOM level.
      target = target.parentElement;
    }

    // Return the matched and sorted results.
    return result;
  }

  /**
   * Validate the selector for a menu item.
   *
   * This returns the validated selector, or throws if the selector is
   * invalid or contains commas.
   */
  function validateSelector(selector: string): string {
    if (selector.indexOf(',') !== -1) {
      throw new Error(`Selector cannot contain commas: ${selector}`);
    }
    if (!Selector.isValid(selector)) {
      throw new Error(`Invalid selector: ${selector}`);
    }
    return selector;
  }

  /**
   * A sort comparison function for a context menu item.
   */
  function itemCmp(a: IItem, b: IItem): number {
    // Sort first based on selector specificity.
    let s1 = Selector.calculateSpecificity(a.selector);
    let s2 = Selector.calculateSpecificity(b.selector);
    if (s1 !== s2) {
      return s2 - s1;
    }

    // If specificities are equal, sort based on rank.
    let r1 = a.rank;
    let r2 = b.rank;
    if (r1 !== r2) {
      return r1 < r2 ? -1 : 1;  // Infinity-safe
    }

    // When all else fails, sort by item id.
    return a.id - b.id;
  }
}
