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
import Orientation = widgets.Orientation;
import SizePolicy = widgets.SizePolicy;
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
    this.addClass(SHELL_VIEW_CLASS);

    var topPanel = this._topPanel = this.createPanel(ShellArea.Top);
    var leftPanel = this._leftPanel = this.createPanel(ShellArea.Left);
    var rightPanel = this._rightPanel = this.createPanel(ShellArea.Right);
    var bottomPanel = this._bottomPanel = this.createPanel(ShellArea.Bottom);
    var centerPanel = this._centerPanel = this.createPanel(ShellArea.Center);

    var hSplitter = this.createSplitter(Orientation.Horizontal);
    var vSplitter = this.createSplitter(Orientation.Vertical);

    hSplitter.addWidget(leftPanel);
    hSplitter.addWidget(centerPanel, 1);
    hSplitter.addWidget(rightPanel);

    vSplitter.addWidget(hSplitter, 1);
    vSplitter.addWidget(bottomPanel);

    var layout = new BoxLayout(Direction.TopToBottom, 0);
    layout.addWidget(topPanel);
    layout.addWidget(vSplitter, 1);

    this.layout = layout;
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * Add a widget to a specified shell view widget area.
   */
  addWidget(area: ShellArea, widget: Widget, options?: IWidgetOptions): void {
    switch(area) {
    case ShellArea.Top:
      this._topPanel.addWidget(widget, options);
      break;
    case ShellArea.Left:
      this._leftPanel.addWidget(widget, options);
      break;
    case ShellArea.Right:
      this._rightPanel.addWidget(widget, options);
      break;
    case ShellArea.Bottom:
      this._bottomPanel.addWidget(widget, options);
      break;
    case ShellArea.Center:
      this._centerPanel.addWidget(widget, options);
      break;
    default:
      throw new Error('invalid shell area');
    }
  }

  /**
   *
   */
  protected createSplitter(orientation: Orientation): Splitter {
    var splitter = new Splitter(orientation);
    splitter.handleSize = 0;
    return splitter;
  }

  /**
   *
   */
  protected createPanel(area: ShellArea): ShellPanel {
    var panel: ShellPanel;
    switch (area) {
    case ShellArea.Top:
      panel = new ShellPanel(Direction.TopToBottom);
      panel.addClass(TOP_CLASS);
      panel.verticalSizePolicy = SizePolicy.Fixed;
      enableAutoHide(panel);
      break;
    case ShellArea.Left:
      panel = new ShellPanel(Direction.LeftToRight);
      panel.addClass(LEFT_CLASS);
      enableAutoHide(panel);
      break;
    case ShellArea.Right:
      panel = new ShellPanel(Direction.RightToLeft);
      panel.addClass(RIGHT_CLASS);
      enableAutoHide(panel);
      break;
    case ShellArea.Bottom:
      panel = new ShellPanel(Direction.BottomToTop);
      panel.addClass(BOTTOM_CLASS);
      enableAutoHide(panel);
      break;
    case ShellArea.Center:
      panel = new ShellPanel(Direction.TopToBottom);
      panel.addClass(CENTER_CLASS);
      break;
    default:
      throw new Error('invalid shell area');
    }
    return panel;
  }

  private _topPanel: ShellPanel;
  private _leftPanel: ShellPanel;
  private _rightPanel: ShellPanel;
  private _bottomPanel: ShellPanel;
  private _centerPanel: ShellPanel;
}

} // module phosphor.shell
