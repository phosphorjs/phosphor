/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import Alignment = widgets.Alignment;
import Direction = widgets.Direction;
import Widget = widgets.Widget;


/**
 * The class name added to shell panel instances.
 */
var SHELL_PANEL_CLASS = 'p-ShellPanel';


/**
 * An options object for adding a widget to a shell panel.
 */
export
interface IWidgetOptions {
  /**
   * The rank for the widget.
   *
   * Widgets are arranged in the panel from lowest to highest rank.
   */
  rank?: number;

  /**
   * The stretch factor for the widget in the panel.
   */
  stretch?: number;

  /**
   * The alignment for the widget in the panel.
   */
  alignment?: Alignment;
}


/**
 *
 */
export
class ShellPanel extends Widget {
  /**
   *
   */
  constructor(direction: Direction) {
    super();
    this.addClass(SHELL_PANEL_CLASS);
  }

}

} // module phosphor.shell
