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
    this.addClass(SHELL_VIEW_CLASS);

    var topPanel = new ShellPanel(Direction.TopToBottom);
    var leftPanel = new ShellPanel(Direction.LeftToRight);
    var rightPanel = new ShellPanel(Direction.RightToLeft);
    var bottomPanel = new ShellPanel(Direction.BottomToTop);
    var centerPanel = new ShellPanel(Direction.TopToBottom);

    this._topPanel = topPanel;
    this._leftPanel = leftPanel;
    this._rightPanel = rightPanel;
    this._bottomPanel = bottomPanel;
    this._centerPanel = centerPanel;

    topPanel.addClass(TOP_CLASS);
    leftPanel.addClass(LEFT_CLASS);
    rightPanel.addClass(RIGHT_CLASS);
    bottomPanel.addClass(BOTTOM_CLASS);
    centerPanel.addClass(CENTER_CLASS);

    topPanel.verticalSizePolicy = SizePolicy.Fixed;

    enableAutoHide(topPanel);
    enableAutoHide(leftPanel);
    enableAutoHide(rightPanel);
    enableAutoHide(bottomPanel);

    var hSplit = new SplitPanel(Orientation.Horizontal);
    var vSplit = new SplitPanel(Orientation.Vertical);

    hSplit.handleSize = 0;
    vSplit.handleSize = 0;

    hSplit.addWidget(leftPanel);
    hSplit.addWidget(centerPanel, 1);
    hSplit.addWidget(rightPanel);

    vSplit.addWidget(hSplit, 1);
    vSplit.addWidget(bottomPanel);

    var layout = new BoxLayout(Direction.TopToBottom, 0);
    layout.addWidget(topPanel);
    layout.addWidget(vSplit, 1);

    this.layout = layout;
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * The top content panel.
   */
  get topPanel(): ShellPanel {
    return this._topPanel;
  }

  /**
   * The left content panel.
   */
  get leftPanel(): ShellPanel {
    return this._leftPanel;
  }

  /**
   * The right content panel.
   */
  get rightPanel(): ShellPanel {
    return this._rightPanel;
  }

  /**
   * The bottom content panel.
   */
  get bottomPanel(): ShellPanel {
    return this._bottomPanel;
  }

  /**
   * The center content panel.
   */
  get centerPanel(): ShellPanel {
    return this._centerPanel;
  }

  private _topPanel: ShellPanel;
  private _leftPanel: ShellPanel;
  private _rightPanel: ShellPanel;
  private _bottomPanel: ShellPanel;
  private _centerPanel: ShellPanel;
}

} // module phosphor.shell
