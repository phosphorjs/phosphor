/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import algo = collections.algorithm;

import Menu = widgets.Menu;
import MenuBar = widgets.MenuBar;
import MenuItem = widgets.MenuItem;


/**
 * An object which manages items in a menu or menu bar.
 */
export
class MenuManager {
  /**
   * Construct a new menu manager.
   *
   * The provided menu should be empty.
   */
  constructor(menu: Menu | MenuBar) {
    this._menu = menu;
  }

  /**
   * Add a menu item to the menu.
   *
   * Menu items are ordered from lowest to highest rank. The default
   * rank is `100`. If the item has already been added to the manager,
   * it will first be removed.
   */
  addItem(item: MenuItem, rank = 100): void {
    this.removeItem(item);
    var index = algo.upperBound(this._ranks, rank, rankCmp);
    algo.insert(this._ranks, index, rank);
    this._menu.insertItem(index, item);
  }

  /**
   * Remove a menu item from the menu.
   *
   * If the item has not been added to the manager, this is a no-op.
   */
  removeItem(item: MenuItem): void {
    var index = this._menu.removeItem(item);
    if (index !== -1) algo.removeAt(this._ranks, index);
  }

  private _menu: Menu | MenuBar;
  private _ranks: number[] = [];
}


/**
 * A comparison function for a ranked pair.
 */
function rankCmp(a: number, b: number): number {
  return a - b;
}

} // module phosphor.shell
