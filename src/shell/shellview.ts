/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import BoxLayout = widgets.BoxLayout;
import Direction = widgets.Direction;
import MenuBar = widgets.MenuBar;
import MenuItem = widgets.MenuItem;
import Orientation = widgets.Orientation;
import SizePolicy = widgets.SizePolicy;
import SplitPanel = widgets.SplitPanel;
import Widget = widgets.Widget;
import WidgetFlag = widgets.WidgetFlag;


/**
 * The class name added to shell view instances.
 */
var SHELL_VIEW_CLASS = 'p-ShellView';

/**
 * The class name added to the top shell panel.
 */
var TOP_CLASS = 'p-mod-top';

/**
 * The class name added to the left shell panel.
 */
var LEFT_CLASS = 'p-mod-left';

/**
 * The class name added to the right shell panel.
 */
var RIGHT_CLASS = 'p-mod-right';

/**
 * The class name added to the bottom shell panel.
 */
var BOTTOM_CLASS = 'p-mod-bottom';

/**
 * The class name added to the center shell panel.
 */
var CENTER_CLASS = 'p-mod-center';


/**
 * A concrete implementation of IShellView.
 */
export
class ShellView extends Widget implements IShellView {
  /**
   * Construct a new shell view.
   */
  constructor() {
    super();
    this.node.classList.add(SHELL_VIEW_CLASS);

    this._menuBar = new MenuBar();
    this._topPanel = new ShellPanel(Direction.TopToBottom);
    this._leftPanel = new ShellPanel(Direction.LeftToRight);
    this._rightPanel = new ShellPanel(Direction.RightToLeft);
    this._bottomPanel = new ShellPanel(Direction.BottomToTop);
    this._centerPanel = new ShellPanel(Direction.TopToBottom);
    this._menuManager = new MenuManager(this._menuBar);

    this._topPanel.node.classList.add(TOP_CLASS);
    this._leftPanel.node.classList.add(LEFT_CLASS);
    this._rightPanel.node.classList.add(RIGHT_CLASS);
    this._bottomPanel.node.classList.add(BOTTOM_CLASS);
    this._centerPanel.node.classList.add(CENTER_CLASS);

    this._menuBar.hide();
    this._topPanel.verticalSizePolicy = SizePolicy.Fixed;

    enableAutoHide(this._topPanel);
    enableAutoHide(this._leftPanel);
    enableAutoHide(this._rightPanel);
    enableAutoHide(this._bottomPanel);

    var hSplitter = new SplitPanel(Orientation.Horizontal);
    var vSplitter = new SplitPanel(Orientation.Vertical);

    hSplitter.handleSize = 0;
    vSplitter.handleSize = 0;

    hSplitter.addWidget(this._leftPanel);
    hSplitter.addWidget(this._centerPanel, 1);
    hSplitter.addWidget(this._rightPanel);

    vSplitter.addWidget(hSplitter, 1);
    vSplitter.addWidget(this._bottomPanel);

    var layout = new BoxLayout(Direction.TopToBottom, 0);
    layout.addWidget(this._menuBar);
    layout.addWidget(this._topPanel);
    layout.addWidget(vSplitter, 1);

    this.layout = layout;
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * Get the content areas names supported by the shell view.
   */
  areas(): string[] {
    return ['top', 'left', 'right', 'bottom', 'center'];
  }

  /**
   * Add a widget to the named content area.
   *
   * This method throws an exception if the named area is not supported.
   */
  addWidget(area: string, widget: Widget, options?: IWidgetOptions): void {
    switch (area) {
    case 'top':
      this._topPanel.addWidget(widget, options);
      break;
    case 'left':
      this._leftPanel.addWidget(widget, options);
      break;
    case 'right':
      this._rightPanel.addWidget(widget, options);
      break;
    case 'bottom':
      this._bottomPanel.addWidget(widget, options);
      break;
    case 'center':
      this._centerPanel.addWidget(widget, options);
      break;
    default:
      throw new Error('invalid content area: ' + area);
    }
  }

  /**
   * Add a menu item to the menu bar.
   *
   * Items are ordered from lowest to highest rank.
   *
   * If the item already exists, its position will be updated.
   */
  addMenuItem(item: MenuItem, rank?: number): void {
    this._menuManager.addItem(item, rank);
    this._menuBar.setVisible(this._menuBar.count > 0);
  }

  /**
   * Remove a menu item from the menu bar.
   *
   * If the item does not exist, this is a no-op.
   */
  removeMenuItem(item: MenuItem): void {
    this._menuManager.removeItem(item);
    this._menuBar.setVisible(this._menuBar.count > 0);
  }

  private _menuBar: MenuBar;
  private _topPanel: ShellPanel;
  private _leftPanel: ShellPanel;
  private _rightPanel: ShellPanel;
  private _bottomPanel: ShellPanel;
  private _centerPanel: ShellPanel;
  private _menuManager: MenuManager;
}

} // module phosphor.shell
