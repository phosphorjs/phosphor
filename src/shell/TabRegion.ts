/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import ITabbableWidget = widgets.ITabbableWidget;
import TabWidget = widgets.TabWidget;


/**
 * A region which manages a tab widget.
 */
export
class TabRegion extends Region<ITabbableWidget> {
  /**
   * Construct a new dock region.
   */
  constructor(token: IRegionToken<ITabbableWidget>, host: TabWidget) {
    super(token);
    this._host = host;
  }

  /**
   * A method invoked when a view is added to the region.
   */
  protected viewAdded(index: number, view: ITabbableWidget): void {
    var ref = this.views.at(index - 1);
    var viewIndex = this._host.widgetIndex(ref) + 1;
    this._host.insertWidget(viewIndex, view);
    super.viewAdded(index, view);
  }

  /**
   * A method invoked when a view is removed from the region.
   */
  protected viewRemoved(index: number, view: ITabbableWidget): void {
    view.parent = null;
    super.viewRemoved(index, view);
  }

  private _host: TabWidget;
}

} // module phosphor.shell
