/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

import Signal = core.Signal;

import Size = geometry.Size;

import Widget = widgets.Widget;


/**
 * The arguments object for stack layout signals.
 */
export
interface IStackIndexArgs {
  /**
   * The stack layout index of interest.
   */
  index: number;

  /**
   * The widget associated with the index.
   */
  widget: Widget;
}


/**
 * A layout in which only one child widget is visible at a time.
 */
export
class StackLayout extends Layout {
  /**
   * A signal emitted when the current index is changed.
   */
  currentChanged = new Signal<StackLayout, IStackIndexArgs>();

  /**
   * A signal emitted when a widget is removed from the layout.
   */
  widgetRemoved = new Signal<StackLayout, IStackIndexArgs>();

  /**
   * Construct a new stack layout.
   */
  constructor() { super(); }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._layoutItems = null;
    this.currentChanged.disconnect();
    this.widgetRemoved.disconnect();
    super.dispose();
  }

  /**
   * Get the current index of the stack.
   */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /**
   * Set the current index of the stack.
   */
  set currentIndex(index: number) {
    var prev = this.currentWidget;
    var next = this.widgetAt(index);
    if (prev === next) {
      return;
    }
    index = next ? index : -1;
    this._currentIndex = index;
    if (prev) prev.hide();
    if (next) next.show();
    // IE repaints before firing the animation frame which processes
    // the layout event triggered by the show/hide calls above. This
    // causes unsightly flicker when changing the visible widget. To
    // avoid this, the layout is updated immediately.
    this.updateLayout();
    this.currentChanged.emit(this, { index: index, widget: next });
  }

  /**
   * Get the current widget in the stack.
   */
  get currentWidget(): Widget {
    return this.widgetAt(this.currentIndex);
  }

  /**
   * Set the current widget in the stack.
   */
  set currentWidget(widget: Widget) {
    this.currentIndex = this.widgetIndex(widget);
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._layoutItems.length;
  }

  /**
   * Get the layout item at the specified index.
   */
  itemAt(index: number): ILayoutItem {
    return this._layoutItems[index];
  }

  /**
   * Remove and return the layout item at the specified index.
   */
  takeAt(index: number): ILayoutItem {
    index = index | 0;
    if (index < 0 || index >= this._layoutItems.length) {
      return void 0;
    }
    var item = this._layoutItems.splice(index, 1)[0];
    if (index === this._currentIndex) {
      this._currentIndex = -1;
      this.invalidate();
      this.currentChanged.emit(this, { index: -1, widget: void 0 });
    } else if (index < this._currentIndex) {
      this._currentIndex--;
    }
    this.widgetRemoved.emit(this, { index: index, widget: item.widget });
    return item;
  }

  /**
   * Move a layout item from one index to another.
   *
   * Returns the new index of the item.
   */
  moveItem(fromIndex: number, toIndex: number): number {
    fromIndex = fromIndex | 0;
    var n = this._layoutItems.length;
    if (fromIndex < 0 || fromIndex >= n) {
      return -1;
    }
    toIndex = Math.max(0, Math.min(toIndex | 0, n - 1));
    if (fromIndex === toIndex) {
      return toIndex;
    }
    var item = this._layoutItems.splice(fromIndex, 1)[0];
    this._layoutItems.splice(toIndex, 0, item);
    var current = this._currentIndex;
    if (fromIndex === current) {
      current = toIndex;
    } else {
      if (fromIndex < current) current--;
      if (toIndex <= current) current++;
    }
    this._currentIndex = current;
    return toIndex;
  }

  /**
   * Add a widget as the last item in the layout.
   *
   * If the widget already exists in the layout, it will be moved.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget): number {
    return this.insertWidget(this._layoutItems.length, widget);
  }

  /**
   * Insert a widget into the layout at the given index.
   *
   * If the widget already exists in the layout, it will be moved.
   *
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget): number {
    var i = this.widgetIndex(widget);
    if (i >= 0) {
      return this.moveItem(i, index);
    }
    widget.hide();
    this.addChildWidget(widget);
    index = Math.max(0, Math.min(index | 0, this._layoutItems.length));
    this._layoutItems.splice(index, 0, new WidgetItem(widget));
    if (index <= this._currentIndex) {
      this._currentIndex++;
    }
    return index;
  }

  /**
   * Invalidate the cached layout data and enqueue an update.
   */
  invalidate(): void {
    this._dirty = true;
    super.invalidate();
  }

  /**
   * Compute the preferred size of the layout.
   */
  sizeHint(): Size {
    if (this._dirty) {
      this._setupGeometry();
    }
    return this._sizeHint;
  }

  /**
   * Compute the minimum size of the layout.
   */
  minSize(): Size {
    if (this._dirty) {
      this._setupGeometry();
    }
    return this._minSize;
  }

  /**
   * Compute the maximum size of the layout.
   */
  maxSize(): Size {
    if (this._dirty) {
      this._setupGeometry();
    }
    return this._maxSize;
  }

  /**
   * Update the geometry of the child layout items.
   *
   * This is called automatically when the parent widget is resized
   * or when it receives a posted 'layout-request' event. It should
   * not normally be invoked directly.
   */
  protected updateLayout(): void {
    // Bail early when no work needs to be done.
    var parent = this.parentWidget;
    if (!parent) {
      return;
    }
    var item = this._layoutItems[this._currentIndex];
    if (!item) {
      return;
    }

    // Refresh the layout items if needed.
    if (this._dirty) {
      this._setupGeometry();
    }

    // Update the geometry of the visible item.
    var boxD = parent.boxData;
    var x = boxD.paddingLeft;
    var y = boxD.paddingTop;
    var w = parent.width - boxD.horizontalSum;
    var h = parent.height - boxD.verticalSum;
    item.setGeometry(x, y, w, h);
  }

  /**
   * Initialize the layout items and internal sizes for the layout.
   */
  private _setupGeometry(): void {
    // Bail early when no work needs to be done.
    if (!this._dirty) {
      return;
    }
    this._dirty = false;

    // No parent means the layout is not yet attached.
    var parent = this.parentWidget;
    if (!parent) {
      var zero = new Size(0, 0);
      this._sizeHint = zero;
      this._minSize = zero;
      this._maxSize = zero;
      return;
    }

    // Compute the size bounds based on the visible item.
    var hintW = 0;
    var hintH = 0;
    var minW = 0;
    var minH = 0;
    var maxW = Infinity;
    var maxH = Infinity;
    var item = this._layoutItems[this._currentIndex];
    if (item) {
      item.invalidate();
      var itemHint = item.sizeHint();
      var itemMin = item.minSize();
      var itemMax = item.maxSize();
      hintW = Math.max(hintW, itemHint.width);
      hintH = Math.max(hintH, itemHint.height);
      minW = Math.max(minW, itemMin.width);
      minH = Math.max(minH, itemMin.height);
      maxW = Math.min(maxW, itemMax.width);
      maxH = Math.min(maxH, itemMax.height);
    }

    // Account for padding and border on the parent.
    var boxD = parent.boxData;
    var boxW = boxD.horizontalSum;
    var boxH = boxD.verticalSum;
    hintW += boxW;
    hintH += boxH;
    minW += boxW;
    minH += boxH;
    maxW += boxW;
    maxH += boxH;

    // Update the internal sizes.
    this._sizeHint = new Size(hintW, hintH);
    this._minSize = new Size(minW, minH);
    this._maxSize = new Size(maxW, maxH);
  }

  private _dirty = true;
  private _currentIndex = -1;
  private _sizeHint: Size = null;
  private _minSize: Size = null;
  private _maxSize: Size = null;
  private _layoutItems: ILayoutItem[] = [];
}

} // module phosphor.layout
