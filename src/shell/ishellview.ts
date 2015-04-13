/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import createToken = di.createToken;


// /**
//  * An options object for adding a menu to a shell view menu bar.
//  */
// export
// interface IMenuOptions {
//   /**
//    * The rank of the menu.
//    *
//   * Menus are ordered from lowest to highest rank.
//    */
//  rank?: number;
// }


/**
 * An options object for adding a widget to a shell view.
 */
export
interface IWidgetOptions {
  /**
   * The rank of the widget.
   *
   * Widgets are ordered from lowest to highest rank.
   */
  rank?: number;

  /**
   * The stretch factor to use for the widget in the layout.
   */
  stretch?: number;

  /**
   * The alignment to use for the widget in the layout.
   */
  alignment?: Alignment;
}


/**
 * An object which manages the top-level application layout.
 */
export
interface IShellView {
  /**
   *
   */
  // addMenu(menu: Menu, options?: IMenuOptions): void;

  /**
   * Add a widget to a specified shell view widget area.
   */
  addWidget(area: ShellArea, widget: Widget, options?: IWidgetOptions): void;
}


/**
 * The interface token for IShellView.
 */
export
var IShellView = createToken<IShellView>('phosphor.shell.IShellView');

} // module phosphor.shell
