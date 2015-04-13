/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import Direction = widgets.Direction;
import Widget = widgets.Widget;


/**
 * The class name added to shell panel instances.
 */
var SHELL_PANEL_CLASS = 'p-ShellPanel';


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
