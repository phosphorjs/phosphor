/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import ArrayIterator = collections.ArrayIterator;
import IIterator = collections.IIterator;
import findIndex = collections.findIndex;

import Signal = core.Signal;


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
   * The panel associated with the index.
   */
  panel: Panel;
}


/**
 * A layout in which only one child panel is visible at a time.
 */
export
class StackLayout extends Layout {
  /**
   * A signal emitted when the current index is changed.
   */
  currentChanged = new Signal<StackLayout, IStackIndexArgs>();

  /**
   * A signal emitted when a panel is removed from the layout.
   */
  panelRemoved = new Signal<StackLayout, IStackIndexArgs>();

  /**
   * Construct a new stack layout.
   */
  constructor() { super(); }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._items = null;
    this.currentChanged.disconnect();
    this.panelRemoved.disconnect();
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
    var prev = this.currentPanel;
    var item = this._items[index];
    var next = item ? item.panel : void 0;
    if (prev === next) {
      return;
    }
    index = next ? index : -1;
    this._currentIndex = index;
    if (prev) prev.hide();
    if (next) next.show();
    // IE repaints before firing the animation frame which processes
    // the layout event triggered by the show/hide calls above. This
    // causes unsightly flicker when changing the visible panel. To
    // avoid this, the layout is updated immediately.
    this.layout();
    this.currentChanged.emit(this, { index: index, panel: next });
  }

  /**
   * Get the current panel in the stack.
   */
  get currentPanel(): Panel {
    var item = this._items[this._currentIndex];
    return item ? item.panel : void 0;
  }

  /**
   * Set the current panel in the stack.
   */
  set currentPanel(panel: Panel) {
    this.currentIndex = this.indexOf(panel);
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._items.length;
  }

  /**
   * Returns an iterator over the layout items in the layout.
   */
  items(): IIterator<ILayoutItem> {
    return new ArrayIterator(this._items);
  }

  /**
   * Get the index of the given panel.
   *
   * Returns -1 if the panel does not exist in the layout.
   */
  indexOf(panel: Panel): number {
    return findIndex(this._items, item => item.panel === panel);
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
  takeAt(index: number): ILayoutItem {
    index = index | 0;
    if (index < 0 || index >= this._items.length) {
      return void 0;
    }
    var item = this._items.splice(index, 1)[0];
    if (index === this._currentIndex) {
      this._currentIndex = -1;
      this.invalidate();
      this.currentChanged.emit(this, { index: -1, panel: void 0 });
    } else if (index < this._currentIndex) {
      this._currentIndex--;
    }
    this.panelRemoved.emit(this, { index: index, panel: item.panel });
    return item;
  }

  /**
   * Add a panel as the last item in the layout.
   *
   * If the panel already exists in the layout, it will be moved.
   *
   * Returns the index of the added panel.
   */
  add(panel: Panel): number {
    return this.insert(this._items.length, panel);
  }

  /**
   * Insert a panel into the layout at the given index.
   *
   * If the panel already exists in the layout, it will be moved.
   *
   * Returns the index of the added panel.
   */
  insert(index: number, panel: Panel): number {
    var i = this.indexOf(panel);
    if (i !== -1) {
      return this.move(i, index);
    }
    panel.hide();
    this.ensureParent(panel);
    index = Math.max(0, Math.min(index, this._items.length));
    this._items.splice(index, 0, new PanelItem(panel));
    if (index <= this._currentIndex) {
      this._currentIndex++;
    }
    return index;
  }

  /**
   * Remove the given panel from the layout.
   *
   * This is a no-op if the panel does not exist in the layout.
   */
  remove(panel: Panel): void {
    var i = this.indexOf(panel);
    if (i !== -1) this.takeAt(i);
  }

  /**
   * Move a layout item from one index to another.
   *
   * Returns the new index of the item.
   */
  move(fromIndex: number, toIndex: number): number {
    fromIndex = fromIndex | 0;
    var n = this._items.length;
    if (fromIndex < 0 || fromIndex >= n) {
      return -1;
    }
    toIndex = Math.max(0, Math.min(toIndex | 0, n - 1));
    if (fromIndex === toIndex) {
      return toIndex;
    }
    var item = this._items.splice(fromIndex, 1)[0];
    this._items.splice(toIndex, 0, item);
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
  protected layout(): void {
    // Bail early when no work needs to be done.
    var parent = this.parent;
    var item = this._items[this._currentIndex];
    if (!parent || !item) {
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
    var parent = this.parent;
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
    var item = this._items[this._currentIndex];
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
  private _items: ILayoutItem[] = [];
}

} // module phosphor.panels
