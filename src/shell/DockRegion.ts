/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import DockMode = enums.DockMode;

import DockArea = widgets.DockArea;
import IDockableWidget = widgets.IDockableWidget;


/**
 * A region which manages a dock area.
 */
export
class DockRegion extends Region<IDockableWidget> {
  /**
   * Construct a new dock region.
   */
  constructor(token: IRegionToken<IDockableWidget>, host: DockArea) {
    super(token);
    this._host = host;
  }

  /**
   * A method invoked when a view is added to the region.
   */
  protected viewAdded(index: number, view: IDockableWidget): void {
    var ref = this.views.at(index - 1);
    var mode = ref ? DockMode.TabAfter : DockMode.Left;
    this._host.addWidget(view, mode, ref);
  }

  /**
   * A method invoked when a view is removed from the region.
   */
  protected viewRemoved(index: number, view: IDockableWidget): void {
    view.parent = null;
    super.viewRemoved(index, view);
  }

  private _host: DockArea;
}

} // module phosphor.shell
