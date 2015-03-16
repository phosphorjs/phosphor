/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import Direction = enums.Direction;
import WidgetFlag = enums.WidgetFlag;

import BoxLayout = layout.BoxLayout;

import Widget = widgets.Widget;


/**
 * A region which manages a widget with a box layout.
 */
export
class BoxRegion extends Region<Widget> {
  /**
   * Construct a new box region.
   */
  constructor(token: IRegionToken<Widget>, host: Widget, direction: Direction, spacing = 0) {
    super(token);
    this._m_host = host;
    host.layout = new BoxLayout(direction, spacing);
    host.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * A method invoked when a view is added to the region.
   */
  protected viewAdded(index: number, view: Widget): void {
    (<BoxLayout>this._m_host.layout).insertWidget(index, view);
    super.viewAdded(index, view);
  }

  /**
   * A method invoked when a view is removed from the region.
   */
  protected viewRemoved(index: number, view: Widget): void {
    view.parent = null;
    super.viewRemoved(index, view);
  }

  private _m_host: Widget;
}

} // module phosphor.shell
