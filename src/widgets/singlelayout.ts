/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * A layout in which positions a single child at time.
 *
 * This is useful for panels which hold a single content child.
 */
export
class SingleLayout extends Layout {
  /**
   * Construct a new single layout.
   */
  constructor(panel?: Panel) {
    super();
    if (panel) this.panel = panel;
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._item = null;
    super.dispose();
  }

  /**
   * Get the panel managed by the layout.
   */
  get panel(): Panel {
    var item = this._item;
    return item ? item.panel : null;
  }

  /**
   * Set the panel managed by the layout.
   */
  set panel(panel: Panel) {
    var item = this._item;
    if (item && item.panel === panel) {
      return;
    }
    if (panel) {
      this._item = new PanelItem(panel);
      this.ensureParent(panel);
    } else {
      this._item = null;
    }
    this.invalidate();
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._item ? 1 : 0;
  }

  /**
   * Get the layout item at the specified index.
   */
  itemAt(index: number): ILayoutItem {
    var item = this._item;
    if (item && index === 0) {
      return item;
    }
    return void 0;
  }

  /**
   * Remove and return the layout item at the specified index.
   */
  takeAt(index: number): ILayoutItem {
    var item = this._item;
    if (item && index === 0) {
      this._item = null;
      this.invalidate();
      return item;
    }
    return void 0;
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
    var item = this._item;
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

    // Compute the size bounds based on the panel item.
    var hintW = 0;
    var hintH = 0;
    var minW = 0;
    var minH = 0;
    var maxW = Infinity;
    var maxH = Infinity;
    var item = this._item;
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
  private _sizeHint: Size = null;
  private _minSize: Size = null;
  private _maxSize: Size = null;
  private _item: ILayoutItem = null;
}

} // module phosphor.panels
