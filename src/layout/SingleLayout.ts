/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

import Size = geometry.Size;

import Widget = widgets.Widget;


/**
 * A layout in which positions a single child at time.
 *
 * This is useful for widgets which hold a single content child.
 */
export
class SingleLayout extends Layout {
  /**
   * Construct a new single layout.
   */
  constructor(widget?: Widget) {
    super();
    if (widget) this.widget = widget;
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._m_widgetItem = null;
    super.dispose();
  }

  /**
   * Get the widget managed by the layout.
   */
  get widget(): Widget {
    var item = this._m_widgetItem;
    return item ? item.widget : null;
  }

  /**
   * Set the widget managed by the layout.
   */
  set widget(widget: Widget) {
    var item = this._m_widgetItem;
    if (item && item.widget === widget) {
      return;
    }
    this._m_widgetItem = new WidgetItem(widget);
    this.addChildWidget(widget);
    this.invalidate();
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._m_widgetItem ? 1 : 0;
  }

  /**
   * Get the layout item at the specified index.
   */
  itemAt(index: number): ILayoutItem {
    var item = this._m_widgetItem;
    if (item && index === 0) {
      return item;
    }
    return void 0;
  }

  /**
   * Remove and return the layout item at the specified index.
   */
  takeAt(index: number): ILayoutItem {
    var item = this._m_widgetItem;
    if (item && index === 0) {
      this._m_widgetItem = null;
      this.invalidate();
      return item;
    }
    return void 0;
  }

  /**
   * Invalidate the cached layout data and enqueue an update.
   */
  invalidate(): void {
    this._m_dirty = true;
    super.invalidate();
  }

  /**
   * Compute the preferred size of the layout.
   */
  sizeHint(): Size {
    if (this._m_dirty) {
      this._setupGeometry();
    }
    return this._m_sizeHint;
  }

  /**
   * Compute the minimum size of the layout.
   */
  minSize(): Size {
    if (this._m_dirty) {
      this._setupGeometry();
    }
    return this._m_minSize;
  }

  /**
   * Compute the maximum size of the layout.
   */
  maxSize(): Size {
    if (this._m_dirty) {
      this._setupGeometry();
    }
    return this._m_maxSize;
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
    var item = this._m_widgetItem;
    if (!item) {
      return;
    }

    // Refresh the layout items if needed.
    if (this._m_dirty) {
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
    if (!this._m_dirty) {
      return;
    }
    this._m_dirty = false;

    // No parent means the layout is not yet attached.
    var parent = this.parentWidget;
    if (!parent) {
      var zero = new Size(0, 0);
      this._m_sizeHint = zero;
      this._m_minSize = zero;
      this._m_maxSize = zero;
      return;
    }

    // Compute the size bounds based on the widget item.
    var hintW = 0;
    var hintH = 0;
    var minW = 0;
    var minH = 0;
    var maxW = Infinity;
    var maxH = Infinity;
    var item = this._m_widgetItem;
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
    this._m_sizeHint = new Size(hintW, hintH);
    this._m_minSize = new Size(minW, minH);
    this._m_maxSize = new Size(maxW, maxH);
  }

  private _m_dirty = true;
  private _m_sizeHint: Size = null;
  private _m_minSize: Size = null;
  private _m_maxSize: Size = null;
  private _m_widgetItem: WidgetItem = null;
}

} // module phosphor.layout
