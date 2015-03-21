/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Signal = core.Signal;

import Direction = enums.Direction;
import WidgetFlag = enums.WidgetFlag;

import BoxLayout = layout.BoxLayout;


/**
 * The class name added to tab widget instances.
 */
var TAB_WIDGET_CLASS = 'p-TabWidget';


/**
 * An arguments object for the tab widget signals.
 */
export
interface IWidgetIndexArgs {
  /**
   * The index of the widget of interest.
   */
  index: number;

  /**
   * The widget at the specified index.
   */
  widget: Widget;
}


/**
 * A widget which can be added to a tab widget.
 */
export
interface ITabbableWidget extends Widget {
  /**
   * The tab to associate with the widget.
   */
  tab: ITab;
}


/**
 * A container which provides a stack of tabbed widgets.
 *
 * The TabWidget provides a convenient combination of a tab bar and
 * a stack widget which allows the user to toggle between widgets
 * by selecting the tab associated with a widget.
 */
export
class TabWidget extends Widget {
  /**
   * A signal emitted when the current widget is changed.
   */
  currentChanged = new Signal<TabWidget, IWidgetIndexArgs>();

  /**
   * Construct a new tab widget.
   */
  constructor() {
    super();
    this.classList.add(TAB_WIDGET_CLASS);
    this.layout = new BoxLayout(Direction.TopToBottom, 0);
    this.setFlag(WidgetFlag.DisallowLayoutChange);
    this.tabBar = new TabBar();
    this.stackWidget = new StackWidget();
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._tabBar = null;
    this._stackWidget = null;
    this.currentChanged.disconnect();
    super.dispose();
  }

  /**
   * Get the index of the currently selected widget.
   */
  get currentIndex(): number {
    return this._stackWidget.currentIndex;
  }

  /**
   * Set the index of the currently selected widget.
   */
  set currentIndex(index: number) {
    this._tabBar.currentIndex = index;
  }

  /**
   * Get the currently selected widget.
   */
  get currentWidget(): Widget {
    return this._stackWidget.currentWidget;
  }

  /**
   * Set the currently selected widget.
   */
  set currentWidget(widget: Widget) {
    this._tabBar.currentIndex = this.widgetIndex(widget);
  }

  /**
   * Get the number of widgets in the tab widget.
   */
  get count(): number {
    return this._tabBar.count;
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabBar.tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(movable: boolean) {
    this._tabBar.tabsMovable = movable;
  }

  /**
   * Get the tab bar used by the tab widget.
   */
  get tabBar(): TabBar {
    return this._tabBar;
  }

  /**
   * Set the tab bar used by the tab widget.
   *
   * This allows for the use of a custom tab bar. This should be set
   * before any tabs are added to the widget.
   *
   * The old tab bar will be disposed.
   */
  set tabBar(bar: TabBar) {
    var old = this._tabBar;
    if (!bar || bar === old) {
      return;
    }
    if (old) old.dispose();
    this._tabBar = bar;
    bar.tabMoved.connect(this._tb_tabMoved, this);
    bar.currentChanged.connect(this._tb_currentChanged, this);
    bar.tabCloseRequested.connect(this._tb_tabCloseRequested, this);
    (<BoxLayout>this.layout).insertWidget(0, bar);
  }

  /**
   * Get the stack widget used by the tab widget.
   */
  get stackWidget(): StackWidget {
    return this._stackWidget;
  }

  /**
   * Set the stack widget used by the tab widget.
   *
   * This allows for the use of a custom stack widget. This should be
   * set before any tabs are added to the widget.
   *
   * The old stack widget will be disposed.
   */
  set stackWidget(stack: StackWidget) {
    var old = this._stackWidget;
    if (!stack || stack === old) {
      return;
    }
    if (old) old.dispose();
    this._stackWidget = stack;
    stack.widgetRemoved.connect(this._sw_widgetRemoved, this);
    (<BoxLayout>this.layout).insertWidget(1, stack);
  }

  /**
   * Get the widget at the given index.
   */
  widgetAt(index: number): Widget {
    return this._stackWidget.widgetAt(index);
  }

  /**
   * Get the index of the given widget.
   */
  widgetIndex(widget: Widget): number {
    return this._stackWidget.widgetIndex(widget);
  }

  /**
   * Add a widget to the end of the tab widget.
   *
   * If the widget has already been added, this is a no-op.
   *
   * Returns the new index of the widget.
   */
  addWidget(widget: ITabbableWidget): number {
    return this.insertWidget(this.count, widget);
  }

  /**
   * Insert a widget into the tab widget at the given index.
   *
   * If the widget has already been added, this is a no-op.
   *
   * Returns the new index of the widget.
   */
  insertWidget(index: number, widget: ITabbableWidget): number {
    var i = this.widgetIndex(widget);
    if (i >= 0) {
      return i;
    }
    index = this._stackWidget.insertWidget(index, widget);
    return this._tabBar.insertTab(index, widget.tab);
  }

  /**
   * Move a widget from one index to another.
   *
   * Returns the new index of the widget.
   */
  moveWidget(fromIndex: number, toIndex: number): number {
    return this._tabBar.moveTab(fromIndex, toIndex);
  }

  /**
   * Remove a widget from the tab widget and set its parent to null.
   *
   * This is equivalent to simply setting the widget parent to null,
   * except that it returns the index that the widget occupied.
   *
   * If the widget is not a child, this returns -1.
   */
  removeWidget(widget: Widget): number {
    return this._stackWidget.removeWidget(widget);
  }

  /**
   * Handle the `tabMoved` signal from the tab bar.
   */
  private _tb_tabMoved(sender: TabBar, args: ITabMoveArgs): void {
    this._stackWidget.moveWidget(args.fromIndex, args.toIndex);
  }

  /**
   * Handle the `currentChanged` signal from the tab bar.
   */
  private _tb_currentChanged(sender: TabBar, args: ITabIndexArgs): void {
    this._stackWidget.currentIndex = args.index;
    var widget = this._stackWidget.currentWidget;
    this.currentChanged.emit(this, { index: args.index, widget: widget });
  }

  /**
   * Handle the `tabCloseRequested` signal from the tab bar.
   */
  private _tb_tabCloseRequested(sender: TabBar, args: ITabIndexArgs): void {
    this._stackWidget.widgetAt(args.index).close();
  }

  /**
   * Handle the `widgetRemoved` signal from the stack widget.
   */
  private _sw_widgetRemoved(sender: StackWidget, args: IStackIndexArgs): void {
    this._tabBar.takeAt(args.index);
  }

  private _tabBar: TabBar = null;
  private _stackWidget: StackWidget = null;
}

} // module phosphor.widgets
