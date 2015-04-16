/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import createToken = di.createToken;

import Alignment = widgets.Alignment;
import MenuItem = widgets.MenuItem;
import Widget = widgets.Widget;


/**
 * An options object for adding a widget to a shell view.
 */
export
interface IWidgetOptions {
  /**
   * The layout rank for the widget.
   *
   * Widgets are arranged in ordered from lowest to highest rank
   * along the direction of layout. The default rank is `100`.
   */
  rank?: number;

  /**
   * The layout stretch factor for the widget.
   *
   * The default stretch factor is determined by the layout.
   */
  stretch?: number;

  /**
   * The layout alignment for the widget.
   *
   * The default stretch factor is determined by the layout.
   */
  alignment?: Alignment;
}


/**
 * A widget which provides the top-level application shell.
 *
 * A shell view serves as the main UI container for an application. It
 * provides named areas to which plugins can add their content and it
 * also controls access to shared UI resources such as the menu bar.
 */
export
interface IShellView extends Widget {
  /**
   * Get the content areas names supported by the shell view.
   */
  areas(): string[];

  /**
   * Add a widget to the named content area.
   *
   * This method throws an exception if the named area is not supported.
   */
  addWidget(area: string, widget: Widget, options?: IWidgetOptions): void;

  /**
   * Add a menu item to the menu bar.
   *
   * Items are ordered from lowest to highest rank.
   *
   * If the item already exists, its position will be updated.
   */
  addMenuItem(item: MenuItem, rank?: number): void;

  /**
   * Remove a menu item from the menu bar.
   *
   * If the item does not exist, this is a no-op.
   */
  removeMenuItem(item: MenuItem): void;
}


/**
 * The interface token for IShellView.
 */
export
var IShellView = createToken<IShellView>('phosphor.shell.IShellView');

} // module phosphor.shell
