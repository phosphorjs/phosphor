/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import Menu = widgets.Menu;
import MenuBar = widgets.MenuBar;
import MenuItem = widgets.MenuItem;


/**
 * A region which manages a menu or menu bar.
 */
export
class MenuRegion extends Region<MenuItem> {
  /**
   * Construct a new menu region.
   */
  constructor(token: IRegionToken<MenuItem>, host: Menu | MenuBar) {
    super(token);
    this._host = host;
  }

  /**
   * A method invoked when a view is added to the region.
   */
  protected viewAdded(index: number, view: MenuItem): void {
    this._host.insertItem(index, view);
    super.viewAdded(index, view);
  }

  /**
   * A method invoked when a view is removed from the region.
   */
  protected viewRemoved(index: number, view: MenuItem): void {
    this._host.removeItem(view);
    super.viewRemoved(index, view);
  }

  private _host: Menu | MenuBar;
}

} // module phosphor.shell
