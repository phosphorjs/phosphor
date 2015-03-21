/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import StackWidget = widgets.StackWidget;
import Widget = widgets.Widget;


/**
 * A region which manages a stack widget.
 */
export
class StackRegion extends Region<Widget> {
  /**
   * Construct a new dock region.
   */
  constructor(token: IRegionToken<Widget>, host: StackWidget) {
    super(token);
    this._host = host;
  }

  /**
   * A method invoked when a view is added to the region.
   */
  protected viewAdded(index: number, view: Widget): void {
    this._host.insertWidget(index, view);
    super.viewAdded(index, view);
  }

  /**
   * A method invoked when a view is removed from the region.
   */
  protected viewRemoved(index: number, view: Widget): void {
    view.parent = null;
    super.viewRemoved(index, view);
  }

  private _host: StackWidget;
}

} // module phosphor.shell
