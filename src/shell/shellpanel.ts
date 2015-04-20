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
 * A content panel for a shell view.
 */
export
class ShellPanel extends Widget {
  /**
   * Construct a new shell view.
   */
  constructor(direction: Direction) {
    super();
    this.node.classList.add(SHELL_PANEL_CLASS);
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
   */
  addWidget(widget: Widget, options: IWidgetOptions = {}): void {
    widget.parent = null;
    var stretch = options.stretch;
    var alignment = options.alignment;
    var rank = options.rank !== void 0 ? options.rank : 100;
    var index = algo.upperBound(this._pairs, rank, pairCmp);
    algo.insert(this._pairs, index, new Pair(widget, rank));
    (<BoxLayout>this.layout).insertWidget(index, widget, stretch, alignment);
  }

  /**
   * A method invoked when a 'child-removed' message is received.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    super.onChildRemoved(msg);
    var index = algo.findIndex(this._pairs, pair => pair.first === msg.child);
    if (index !== -1) algo.removeAt(this._pairs, index);
  }

  private _pairs: Pair<Widget, number>[] = [];
}


/**
 * A comparator for a rank pair.
 */
function pairCmp(pair: Pair<Widget, number>, rank: number): number {
  return pair.second - rank;
}

} // module phosphor.shell
