/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import algo = collections.algorithm;

import Signal = core.Signal;
import emit = core.emit;

import Pair = utility.Pair;
import Size = utility.Size;


/**
 * A layout in which only one widget is visible at a time.
 *
 * User code is responsible for managing the current layout index. The
 * index defaults to -1, which means no widget will be shown. The index
 * must be set to a valid index in order for a widget to be displayed.
 *
 * If the current widget is removed, the current index is reset to -1.
 *
 * This layout will typically be used in conjunction with another
 * widget, such as a tab bar, which manipulates the layout index.
 */
export
class StackedLayout extends Layout {
  /**
   * A signal emitted when a widget is removed from the layout.
   */
  static widgetRemoved = new Signal<StackedLayout, Pair<number, Widget>>();

  /**
   * Construct a new stack layout.
   */
  constructor() { super(); }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._currentItem = null;
    this._items = null;
    super.dispose();
  }

  /**
   * Get the current index of the layout.
   */
  get currentIndex(): number {
    return algo.indexOf(this._items, this._currentItem);
  }

  /**
   * Set the current index of the layout.
   */
  set currentIndex(index: number) {
    var prev = this._currentItem;
    var next = this.itemAt(index) || null;
    if (prev === next) {
      return;
    }
    this._currentItem = next;
    if (prev) prev.widget.hide();
    if (next) next.widget.show();
    // IE repaints before firing the animation frame which processes
    // the layout update triggered by the show/hide calls above. This
    // causes a double paint flicker when changing the visible widget.
    // The workaround is to refresh the layout immediately.
    this.refresh();
  }

  /**
   * Get the current widget in the layout.
   */
  get currentWidget(): Widget {
    return this._currentItem.widget;
  }

  /**
   * Set the current widget in the layout.
   */
  set currentWidget(widget: Widget) {
    this.currentIndex = this.indexOf(widget);
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._items.length;
  }

  /**
   * Get the layout item at the specified index.
   */
  itemAt(index: number): ILayoutItem {
    return this._items[index];
  }

  /**
   * Remove and return the layout item at the specified index.
   */
  removeAt(index: number): ILayoutItem {
    var item = algo.removeAt(this._items, index);
    if (!item) {
      return void 0;
    }
    if (item === this._currentItem) {
      this._currentItem = null;
      item.widget.hide();
    }
    emit(this, StackedLayout.widgetRemoved, new Pair(index, item.widget));
    return item;
  }

  /**
   * Add a widget as the last item in the layout.
   *
   * If the widget already exists in the layout, it will be moved.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget, alignment?: Alignment): number {
    return this.insertWidget(this.count, widget, alignment);
  }

  /**
   * Insert a widget into the layout at the given index.
   *
   * If the widget already exists in the layout, it will be moved.
   *
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget, alignment: Alignment = 0): number {
    widget.hide();
    this.remove(widget);
    this.ensureParent(widget);
    return algo.insert(this._items, index, new WidgetItem(widget, alignment));
  }

  /**
   * Move a widget from one index to another.
   *
   * This method is more efficient for moving a widget than calling
   * `insertWidget` for an already added widget. It will not remove
   * the widget before moving it and will not emit `widgetRemoved`.
   *
   * Returns -1 if `fromIndex` is out of range.
   */
  moveWidget(fromIndex: number, toIndex: number): number {
    return algo.move(this._items, fromIndex, toIndex);
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
   */
  protected layout(x: number, y: number, width: number, height: number): void {
    if (this._dirty) {
      this._setupGeometry();
    }
    if (this._currentItem !== null) {
      this._currentItem.setGeometry(x, y, width, height);
    }
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
    var parent = this.parent;
    if (!parent) {
      this._sizeHint = Size.Zero;
      this._minSize = Size.Zero;
      this._maxSize = Size.Zero;
      return;
    }

    // Compute the size bounds based on the visible item.
    var hintW = 0;
    var hintH = 0;
    var minW = 0;
    var minH = 0;
    var maxW = Infinity;
    var maxH = Infinity;
    var item = this._currentItem;
    if (item !== null) {
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
    var box = parent.boxSizing;
    var boxW = box.horizontalSum;
    var boxH = box.verticalSum;
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
  private _sizeHint: Size = null;
  private _minSize: Size = null;
  private _maxSize: Size = null;
  private _items: ILayoutItem[] = [];
  private _currentItem: ILayoutItem = null;
}

} // module phosphor.widgets
