/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

import Alignment = enums.Alignment;
import Orientation = enums.Orientation;

import Size = geometry.Size;

import Widget = widgets.Widget;


/**
 * The layout class used by the Splitter widget.
 *
 * This will not typically be used directly by user code.
 */
export
class SplitterLayout extends Layout {
  /**
   * Construct a new splitter layout.
   */
  constructor(orientation: Orientation) {
    super();
    this._m_orientation = orientation;
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._m_sizingItems = null;
    this._m_splitterItems = null;
    super.dispose();
  }

  /**
   * Get the orientation of the splitter layout.
   */
  get orientation(): Orientation {
    return this._m_orientation;
  }

  /**
   * Set the orientation of the splitter layout.
   */
  set orientation(value: Orientation) {
    if (value === this._m_orientation) {
      return;
    }
    this._m_orientation = value;
    this.invalidate();
  }

  /**
   * Get the size of the splitter handles.
   */
  get handleSize(): number {
    return this._m_handleSize;
  }

  /**
   * Set the the size of the splitter handles.
   */
  set handleSize(size: number) {
    size = Math.max(0, size | 0);
    if (size === this._m_handleSize) {
      return;
    }
    this._m_handleSize = size;
    this.invalidate();
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._m_splitterItems.length;
  }

  /**
   * Get the normalized sizes of the items in the layout.
   */
  sizes(): number[] {
    return normalize(this._m_sizingItems.map(it => it.size));
  }

  /**
   * Set the relative sizes for the splitter items.
   *
   * Extra values are ignored, too few will yield an undefined layout.
   */
  setSizes(sizes: number[]): void {
    var parent = this.parentWidget;
    if (!parent) {
      return;
    }
    var totalSize: number;
    var boxD = parent.boxData;
    if (this._m_orientation === Orientation.Horizontal) {
      totalSize = parent.width - boxD.horizontalSum - this._m_fixedSpace;
    } else {
      totalSize = parent.height - boxD.verticalSum - this._m_fixedSpace;
    }
    var normed = normalize(sizes);
    var items = this._m_sizingItems;
    var n = Math.min(items.length, normed.length);
    for (var i = 0; i < n; ++i) {
      items[i].sizeHint = Math.round(normed[i] * totalSize);
    }
    if (parent.isVisible) {
      this.updateLayout();
    }
  }

  /**
   * Get the splitter handle at the given index.
   */
  handleAt(index: number): SplitterHandle {
    var item = this._m_splitterItems[index];
    return (item && item.handle) || void 0;
  }

  /**
   * Get the layout item at the specified index.
   */
  itemAt(index: number): ILayoutItem {
    return this._m_splitterItems[index];
  }

  /**
   * Remove and return the layout item at the specified index.
   */
  takeAt(index: number): ILayoutItem {
    index = index | 0;
    if (index < 0 || index >= this._m_splitterItems.length) {
      return void 0;
    }
    var item = this._m_splitterItems.splice(index, 1)[0];
    this._m_sizingItems.splice(index, 1);
    var hNode = item.handle.node;
    var pNode = hNode.parentNode;
    if (pNode) pNode.removeChild(hNode);
    this.invalidate();
    return item;
  }

  /**
   * Move a layout item from one index to another.
   *
   * Returns the new index of the item.
   */
  moveItem(fromIndex: number, toIndex: number): number {
    fromIndex = fromIndex | 0;
    var n = this._m_splitterItems.length;
    if (fromIndex < 0 || fromIndex >= n) {
      return -1;
    }
    toIndex = Math.max(0, Math.min(toIndex | 0, n - 1));
    if (fromIndex === toIndex) {
      return toIndex;
    }
    var item = this._m_splitterItems.splice(fromIndex, 1)[0];
    this._m_splitterItems.splice(toIndex, 0, item);
    var sizeItem = this._m_sizingItems.splice(fromIndex, 1)[0];
    this._m_sizingItems.splice(toIndex, 0, sizeItem);
    this.invalidate();
    return toIndex;
  }

  /**
   * Add a widget as the last item in the layout.
   *
   * If the widget already exists in the layout, it will be moved.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget, stretch = 0, alignment: Alignment = 0): number {
    return this.insertWidget(this.count, widget, stretch, alignment);
  }

  /**
   * Insert a widget into the layout at the given index.
   *
   * If the widget already exists in the layout, it will be moved.
   *
   * Returns the index of the added item.
   */
  insertWidget(index: number, widget: Widget, stretch = 0, alignment: Alignment = 0): number {
    var i = this.widgetIndex(widget);
    if (i >= 0) {
      return this.moveItem(i, index);
    }
    this.addChildWidget(widget);
    var orient = this._m_orientation;
    var handle = new SplitterHandle(orient);
    var item = new SplitterItem(widget, handle, alignment);
    return this._insertItem(index, item, stretch);
  }

  /**
   * Get the stretch factor for the item at the given index.
   *
   * Returns -1 if the index is out of range.
   */
  stretchAt(index: number): number {
    var item = this._m_sizingItems[index];
    return item ? item.stretch : - 1;
  }

  /**
   * Set the stretch factor for the item at the given index.
   */
  setStretch(index: number, stretch: number): void {
    stretch = Math.max(0, stretch | 0);
    var item = this._m_sizingItems[index];
    if (item && item.stretch !== stretch) {
      item.stretch = stretch;
      this.invalidate();
    }
  }

  /**
   * Move the handle at the given index to the offset position.
   *
   * This will move the handle as close as possible to the given
   * offset position, without violating item size constraints.
   */
  moveHandle(index: number, pos: number): void {
    var item = this._m_splitterItems[index];
    if (!item || item.handle.hidden) {
      return;
    }
    var delta: number;
    if (this._m_orientation === Orientation.Horizontal) {
      delta = pos - item.handle.node.offsetLeft;
    } else {
      delta = pos - item.handle.node.offsetTop;
    }
    if (delta === 0) {
      return;
    }
    var sizingItems = this._m_sizingItems;
    if (delta > 0) {
      growItem(sizingItems, index, delta);
    } else {
      sizingItems.reverse();
      growItem(sizingItems, sizingItems.length - (index + 2), -delta);
      sizingItems.reverse();
    }
    this.updateLayout();
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
    var splitterItems = this._m_splitterItems;
    if (splitterItems.length === 0) {
      return;
    }

    // Refresh the layout items if needed.
    if (this._m_dirty) {
      this._setupGeometry();
    }

    // Setup commonly used variables.
    var boxD = parent.boxData;
    var width = parent.width - boxD.horizontalSum;
    var height = parent.height - boxD.verticalSum;
    var orient = this._m_orientation;
    var sizingItems = this._m_sizingItems;

    // Distribute the layout space to the sizing items.
    var mainSpace = orient === Orientation.Horizontal ? width : height;
    layoutCalc(sizingItems, mainSpace - this._m_fixedSpace);

    // Update the geometry of the items according to the orientation.
    var y = boxD.paddingTop;
    var x = boxD.paddingLeft;
    var hSize = this._m_handleSize;
    var count = splitterItems.length;
    if (orient === Orientation.Horizontal) {
      for (var i = 0; i < count; ++i) {
        var item = splitterItems[i];
        if (item.isHidden) {
          continue;
        }
        var size = sizingItems[i].size;
        var hStyle = item.handle.node.style;
        item.setGeometry(x, y, size, height);
        hStyle.top = y + 'px';
        hStyle.left = x + size + 'px';
        hStyle.width = hSize + 'px';
        hStyle.height = height + 'px';
        x += size + hSize;
      }
    } else {
      for (var i = 0; i < count; ++i) {
        var item = splitterItems[i];
        if (item.isHidden) {
          continue;
        }
        var size = sizingItems[i].size;
        var hStyle = item.handle.node.style;
        item.setGeometry(x, y, width, size);
        hStyle.top = y + size + 'px';
        hStyle.left = x + 'px';
        hStyle.width = width + 'px';
        hStyle.height = hSize + 'px';
        y += size + hSize;
      }
    }
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
      this._m_fixedSpace = 0;
      return;
    }

    // Invalidate the layout items and reset the handles for the current
    // orientation. Hide the handles associated with a hidden item and
    // the handle node is attached to the parent node. Traverse the
    // items backwards and hide the first visible item handle.
    var hidFirst = false;
    var pNode = parent.node;
    var orient = this._m_orientation;
    var splitterItems = this._m_splitterItems;
    var count = splitterItems.length;
    for (var i = count - 1; i >= 0; --i) {
      var item = splitterItems[i];
      var handle = item.handle;
      var hNode = handle.node;
      item.invalidate();
      handle.orientation = orient;
      handle.hidden = item.isHidden;
      if (hNode.parentNode !== pNode) {
        pNode.appendChild(hNode);
      }
      if (!hidFirst && !item.isHidden) {
        item.handle.hidden = true;
        hidFirst = true;
      }
    }

    // Setup commonly used variables.
    var hintW = 0;
    var hintH = 0;
    var minW = 0;
    var minH = 0;
    var maxW: number;
    var maxH: number;
    var fixedSpace = 0;
    var handleSize = this._m_handleSize;
    var sizingItems = this._m_sizingItems;

    // Compute the size bounds according to the splitter orientation.
    // The size hints for the sizing items are explicitly not updated.
    // The hint is only adjusted when the user moves a handle. This
    // allows the sections to remain well-sized when siblings are
    // added/removed or shown/hidden (see the growItem function).
    if (orient === Orientation.Horizontal) {
      maxH = Infinity;
      maxW = count > 0 ? 0 : Infinity;
      for (var i = 0; i < count; ++i) {
        var item = splitterItems[i];
        var sizingItem = sizingItems[i];
        if (item.isHidden) {
          sizingItem.expansive = false;
          sizingItem.minSize = 0;
          sizingItem.maxSize = 0;
          continue;
        }
        var itemHint = item.sizeHint();
        var itemMin = item.minSize();
        var itemMax = item.maxSize();
        hintH = Math.max(hintH, itemHint.height);
        minH = Math.max(minH, itemMin.height);
        maxH = Math.min(maxH, itemMax.height);
        hintW += itemHint.width;
        minW += itemMin.width;
        maxW += itemMax.width;
        sizingItem.expansive = item.expandHorizontal;
        sizingItem.minSize = itemMin.width;
        sizingItem.maxSize = itemMax.width;
        if (!item.handle.hidden) {
          fixedSpace += handleSize;
        }
      }
      hintW += fixedSpace;
      minW += fixedSpace;
      maxW += fixedSpace;
    } else {
      maxW = Infinity;
      maxH = count > 0 ? 0 : Infinity;
      for (var i = 0; i < count; ++i) {
        var item = splitterItems[i];
        var sizingItem = sizingItems[i];
        if (item.isHidden) {
          sizingItem.expansive = false;
          sizingItem.minSize = 0;
          sizingItem.maxSize = 0;
          continue;
        }
        var itemHint = item.sizeHint();
        var itemMin = item.minSize();
        var itemMax = item.maxSize();
        hintW = Math.max(hintW, itemHint.width);
        minW = Math.max(minW, itemMin.width);
        maxW = Math.min(maxW, itemMax.width);
        hintH += itemHint.height;
        minH += itemMin.height;
        maxH += itemMax.height;
        sizingItem.expansive = item.expandVertical;
        sizingItem.minSize = itemMin.height;
        sizingItem.maxSize = itemMax.height;
        if (!item.handle.hidden) {
          fixedSpace += handleSize;
        }
      }
      hintH += fixedSpace;
      minH += fixedSpace;
      maxH += fixedSpace;
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
    this._m_fixedSpace = fixedSpace;
  }

  /**
   * Insert a splitter item with the specified stretch factor.
   *
   * Returns the index of the added item.
   */
  private _insertItem(index: number, item: SplitterItem, stretch: number): number {
    var sizingItem = createSizingItem(Math.max(0, stretch | 0));
    index = Math.max(0, Math.min(index | 0, this._m_splitterItems.length));
    this._m_splitterItems.splice(index, 0, item);
    this._m_sizingItems.splice(index, 0, sizingItem);
    this.invalidate();
    return index;
  }

  private _m_dirty = true;
  private _m_handleSize = 3;
  private _m_fixedSpace = 0;
  private _m_sizeHint: Size = null;
  private _m_minSize: Size = null;
  private _m_maxSize: Size = null;
  private _m_orientation: Orientation;
  private _m_sizingItems: SizingItem[] = [];
  private _m_splitterItems: SplitterItem[] = [];
}


/**
 * A custom widget item class used by the splitter layout.
 */
class SplitterItem extends WidgetItem {
  /**
   * Construct a new splitter item.
   */
  constructor(widget: Widget, handle: SplitterHandle, alignment: Alignment = 0) {
    super(widget, alignment);
    this._m_handle = handle;
  }

  /**
   * Get the splitter handle for the item.
   */
  get handle(): SplitterHandle {
    return this._m_handle;
  }

  private _m_handle: SplitterHandle;
}


/**
 * Create a sizing item with the given stretch factor.
 */
function createSizingItem(stretch: number): SizingItem {
  var item = new SizingItem();
  item.stretch = stretch;
  return item;
}


/**
 * Grow an item to the right by a positive delta.
 *
 * This will adjust the items neighbors if required.
 *
 * Before adjusting the item, the size hints of all items will be
 * updated to their current size. This allows the sections to remain
 * well sized on the subsequent layout since the size hint is the
 * effective input to the `layoutCalc` function.
 */
function growItem(items: SizingItem[], index: number, delta: number): void {
  // TODO - the size hint of hidden items gets forced to zero here. It
  // would be nice to preserve it so it's a reasonable size when shown.
  for (var i = 0, n = items.length; i < n; ++i) {
    var item = items[i];
    item.sizeHint = item.size;
  }
  var growLimit = 0;
  for (var i = 0; i <= index; ++i) {
    var item = items[i];
    growLimit += item.maxSize - item.size;
  }
  var shrinkLimit = 0;
  for (var i = index + 1, n = items.length; i < n; ++i) {
    var item = items[i];
    shrinkLimit += item.size - item.minSize;
  }
  delta = Math.min(delta, growLimit, shrinkLimit);
  var grow = delta;
  for (var i = index; i >= 0 && grow > 0; --i) {
    var item = items[i];
    var limit = item.maxSize - item.size;
    if (limit >= grow) {
      item.sizeHint = item.size + grow;
      grow = 0;
    } else {
      item.sizeHint = item.size + limit;
      grow -= limit;
    }
  }
  var shrink = delta;
  for (var i = index + 1, n = items.length; i < n && shrink > 0; ++i) {
    var item = items[i];
    var limit = item.size - item.minSize;
    if (limit >= shrink) {
      item.sizeHint = item.size - shrink;
      shrink = 0;
    } else {
      item.sizeHint = item.size - limit;
      shrink -= limit;
    }
  }
}


/**
 * Normalize an array of positive values.
 */
function normalize(values: number[]): number[] {
  var n = values.length;
  if (n === 0) {
    return [];
  }
  var sum = 0;
  for (var i = 0; i < n; ++i) {
    sum += values[i];
  }
  var result = new Array<number>(n);
  if (sum === 0) {
    for (var i = 0; i < n; ++i) {
      result[i] = 1 / n;
    }
  } else {
    for (var i = 0; i < n; ++i) {
      result[i] = values[i] / sum;
    }
  }
  return result;
}

} // module phosphor.layout
