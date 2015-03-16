/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Signal = core.Signal;

import WidgetFlag = enums.WidgetFlag;

import StackLayout = layout.StackLayout;
export import IStackIndexArgs = layout.IStackIndexArgs;



/**
 * The class name added to StackWidget instances.
 */
var STACK_WIDGET_CLASS = 'p-StackWidget';


/**
 * A container widget where only one child is visible at a time.
 *
 * This widget delegates to a permanently installed stack layout and
 * can be used as a more convenient interface to a stack layout.
 */
export
class StackWidget extends Widget {
  /**
   * A signal emitted when the current index changes.
   */
  currentChanged = new Signal<StackWidget, IStackIndexArgs>();

  /**
   * A signal emitted when a widget is removed from the stack.
   */
  widgetRemoved = new Signal<StackWidget, IStackIndexArgs>();

  /**
   * Construct a new stack widget.
   */
  constructor() {
    super();
    this.classList.add(STACK_WIDGET_CLASS);
    var layout = this.layout = new StackLayout();
    this.setFlag(WidgetFlag.DisallowLayoutChange);
    layout.currentChanged.connect(this._sl_currentChanged, this);
    layout.widgetRemoved.connect(this._sl_widgetRemoved, this);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this.currentChanged.disconnect();
    this.widgetRemoved.disconnect();
    super.dispose();
  }

  /**
   * Get the current index of the stack.
   */
  get currentIndex(): number {
    return (<StackLayout>this.layout).currentIndex;
  }

  /**
   * Set the current index of the stack.
   */
  set currentIndex(index: number) {
    (<StackLayout>this.layout).currentIndex = index;
  }

  /**
   * Get the current stack widget.
   */
  get currentWidget(): Widget {
    return (<StackLayout>this.layout).currentWidget;
  }

  /**
   * Set the current stack widget.
   */
  set currentWidget(widget: Widget) {
    (<StackLayout>this.layout).currentWidget = widget;
  }

  /**
   * Get the number of widgets in the stack.
   */
  get count(): number {
    return (<StackLayout>this.layout).count;
  }

  /**
   * Get the widget at the given index.
   */
  widgetAt(index: number): Widget {
    return (<StackLayout>this.layout).widgetAt(index);
  }

  /**
   * Get the index of the given widget.
   */
  widgetIndex(widget: Widget): number {
    return (<StackLayout>this.layout).widgetIndex(widget);
  }

  /**
   * Add a child widget to the end of the stack.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget): number {
    return (<StackLayout>this.layout).addWidget(widget);
  }

  /**
   * Insert a child widget into the stack at the given index.
   *
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget): number {
    return (<StackLayout>this.layout).insertWidget(index, widget);
  }

  /**
   * Move a child widget from one index to another.
   *
   * Returns the new index of the widget.
   */
  moveWidget(fromIndex: number, toIndex: number): number {
    return (<StackLayout>this.layout).moveItem(fromIndex, toIndex);
  }

  /**
   * Remove a widget from the stack and set its parent to null.
   *
   * This is equivalent to simply setting the widget parent to null,
   * except that it returns the index that the widget occupied.
   *
   * If the widget is not a child of the stack, this returns -1.
   */
  removeWidget(widget: Widget): number {
    if (widget.parent !== this) {
      return -1;
    }
    var index = this.widgetIndex(widget);
    widget.parent = null;
    return index;
  }

  /**
   * Handle the `currentChanged` signal for the stack layout.
   */
  private _sl_currentChanged(sender: StackLayout, args: IStackIndexArgs): void {
    this.currentChanged.emit(this, args);
  }

  /**
   * Handle the `widgetChanged` signal for the stack layout.
   */
  private _sl_widgetRemoved(sender: StackLayout, args: IStackIndexArgs): void {
    this.widgetRemoved.emit(this, args);
  }
}

} // module phosphor.widgets
