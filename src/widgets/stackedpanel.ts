/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Signal = core.Signal;
import connect = core.connect;
import emit = core.emit;

import Pair = utility.Pair;


/**
 * The class name added to StackedPanel instances.
 */
var STACKED_PANEL_CLASS = 'p-StackedPanel';


/**
 * A panel where only one child widget is visible at a time.
 */
export
class StackedPanel extends Panel {
  /**
   * A signal emitted when a widget is removed from the panel.
   */
  static widgetRemoved = new Signal<StackedPanel, Pair<number, Widget>>();

  /**
   * Construct a new stacked panel.
   */
  constructor() {
    super(new StackedLayout());
    this.addClass(STACKED_PANEL_CLASS);
    var layout = <StackedLayout>this.layout;
    connect(layout, StackedLayout.widgetRemoved, this, this._sl_widgetRemoved);
  }

  /**
   * Get the current index of the panel.
   */
  get currentIndex(): number {
    return (<StackedLayout>this.layout).currentIndex;
  }

  /**
   * Set the current index of the panel.
   */
  set currentIndex(index: number) {
    (<StackedLayout>this.layout).currentIndex = index;
  }

  /**
   * Get the current widget of the panel.
   */
  get currentWidget(): Widget {
    return (<StackedLayout>this.layout).currentWidget;
  }

  /**
   * Set the current widget of the panel.
   */
  set currentWidget(widget: Widget) {
    (<StackedLayout>this.layout).currentWidget = widget;
  }

  /**
   * Add a child widget to the end of the panel.
   *
   * If the widget already exists in the panel, it will be moved.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget, alignment?: Alignment): number {
    return (<StackedLayout>this.layout).addWidget(widget, alignment);
  }

  /**
   * Insert a child widget into the panel at the given index.
   *
   * If the widget already exists in the panel, it will be moved.
   *
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget, alignment?: Alignment): number {
    return (<StackedLayout>this.layout).insertWidget(index, widget, alignment);
  }

  /**
   * Move a child widget from one index to another.
   *
   * This method is more efficient for moving a widget than calling
   * `insertWidget` for an already added widget. It will not remove
   * the widget before moving it and will not emit `widgetRemoved`.
   *
   * Returns -1 if `fromIndex` is out of range.
   */
  moveWidget(fromIndex: number, toIndex: number): number {
    return (<StackedLayout>this.layout).moveWidget(fromIndex, toIndex);
  }

  /**
   * Handle the `widgetRemoved` signal for the stacked layout.
   */
  private _sl_widgetRemoved(sender: StackedLayout, args: Pair<number, Widget>): void {
    emit(this, StackedPanel.widgetRemoved, args);
  }
}

} // module phosphor.widgets
