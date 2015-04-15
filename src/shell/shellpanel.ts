/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import algo = collections.algorithm;

import Pair = utility.Pair;

import Alignment = widgets.Alignment;
import BoxLayout = widgets.BoxLayout;
import ChildMessage = widgets.ChildMessage;
import Direction = widgets.Direction;
import Widget = widgets.Widget;
import WidgetFlag = widgets.WidgetFlag;


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
   * The layout rank for the widget.
   */
  rank?: number;

  /**
   * The layout stretch factor for the widget.
   */
  stretch?: number;

  /**
   * The layout alignment for the widget.
   */
  alignment?: Alignment;
}


/**
 * A content panel for a shell view.
 *
 * A shell panel used to host widgets which are ordered by rank. It
 * is typically used as a content area for plugin-provided widgets.
 */
export
class ShellPanel extends Widget {
  /**
   * Construct a new shell view.
   */
  constructor(direction: Direction) {
    super();
    this.addClass(SHELL_PANEL_CLASS);
    this.layout = new BoxLayout(direction, 0);
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._pairs = null;
    super.dispose();
  }

  /**
   * Add a widget to the panel.
   *
   * Widgets are ordered from lowest to highest rank in the direction
   * of the panel layout. The default rank for a widget is `100`.
   */
  addWidget(widget: Widget, options: IWidgetOptions = {}): void {
    widget.parent = null;
    var stretch = options.stretch;
    var alignment = options.alignment;
    var rank = options.rank !== void 0 ? options.rank : 100;
    var i = algo.findIndex(this._pairs, pair => pair.second > rank);
    if (i === -1) i = this._pairs.length;
    algo.insert(this._pairs, i, new Pair(widget, rank));
    (<BoxLayout>this.layout).insertWidget(i, widget, stretch, alignment);
  }

  /**
   * A method invoked when a 'child-removed' message is received.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    var widget = msg.child;
    var i = algo.findIndex(this._pairs, pair => pair.first === widget);
    if (i !== -1) algo.removeAt(this._pairs, i);
  }

  _pairs: Pair<Widget, number>[] = [];
}

} // module phosphor.shell
