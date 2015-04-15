/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import createToken = di.createToken;


/**
 * An options object for adding a widget to a shell view.
 */
export
interface IWidgetOptions {
  /**
   * The layout rank for the widget.
   *
   * Widgets are added to the layout from lowest to highest rank.
   */
  rank?: number;

  /**
   * The stretch factor for the widget in the layout.
   */
  stretch?: number;

  /**
   * The alignment for the widget in the layout.
   */
  alignment?: Alignment;
}


/**
 * An object which provides a top-level application shell.
 *
 * A shell view serves as the main UI container for an application. It
 * provides a number of predefined layout areas into which plugins may
 * contribute their UI content. It also controls access to shared UI
 * resources such the menu bar and status bar.
 */
export
interface IShellView {
  /**
   * Add a widget to the specified shell area.
   */
  addWidget(area: ShellArea, widget: Widget, options?: IWidgetOptions): void;
}


/**
 * The interface token for IShellView.
 */
export
var IShellView = createToken<IShellView>('phosphor.shell.IShellView');

} // module phosphor.shell
