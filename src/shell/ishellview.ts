/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import createToken = di.createToken;

import Widget = widgets.Widget;


/**
 * A widget which provides the top-level application shell.
 *
 * A shell view serves as the main UI container for an application. It
 * provides a number of panels into which plugins may contribute their
 * UI content. It also controls access to shared UI resources such the
 * menu bar and status bar.
 */
export
interface IShellView extends Widget {
  /**
   * The top content panel.
   */
  topPanel: ShellPanel;

  /**
   * The left content panel.
   */
  leftPanel: ShellPanel;

  /**
   * The right content panel.
   */
  rightPanel: ShellPanel;

  /**
   * The bottom content panel.
   */
  bottomPanel: ShellPanel;

  /**
   * The center content panel.
   */
  centerPanel: ShellPanel;
}


/**
 * The interface token for IShellView.
 */
export
var IShellView = createToken<IShellView>('phosphor.shell.IShellView');

} // module phosphor.shell
