/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import algo = collections.algorithm;

import Size = utility.Size;


/**
 * A layout which arranges widgets in resizable sections.
 */
export
class SplitLayout extends Layout {
  /**
   * Construct a new split layout.
   */
  constructor(orientation: Orientation) {
    super();
    this._orientation = orientation;
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._items = null;
    this._sizers = null;
    super.dispose();
  }

  /**
   * Get the orientation of the split layout.
   */
  get orientation(): Orientation {
    return this._orientation;
  }

  /**
   * Set the orientation of the split layout.
   */
  set orientation(orient: Orientation) {
    if (orient === this._orientation) {
      return;
    }
    this._orientation = orient;
    this.invalidate();
  }

  /**
   * Get the size of the split handles.
   */
  get handleSize(): number {
    return this._handleSize;
  }

  /**
   * Set the the size of the split handles.
   */
  set handleSize(size: number) {
    size = Math.max(0, size | 0);
    if (size === this._handleSize) {
      return;
    }
    this._handleSize = size;
    this.invalidate();
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._items.length;
  }

  /**
   * Get the normalized sizes of the items in the layout.
   */
  sizes(): number[] {
    return normalize(this._sizers.map(sizer => sizer.size));
  }

  /**
   * Set the relative sizes for the split items.
   *
   * Extra values are ignored, too few will yield an undefined layout.
   */
  setSizes(sizes: number[]): void {
    var parent = this.parent;
    if (!parent) {
      return;
    }
    var totalSize: number;
    var box = parent.boxSizing;
    if (this._orientation === Orientation.Horizontal) {
      totalSize = parent.width - box.horizontalSum - this._fixedSpace;
    } else {
      totalSize = parent.height - box.verticalSum - this._fixedSpace;
    }
    var sizers = this._sizers;
    var normed = normalize(sizes);
    var n = Math.min(sizers.length, normed.length);
    for (var i = 0; i < n; ++i) {
      var hint = Math.round(normed[i] * totalSize);
      var sizer = sizers[i];
      sizer.size = hint;
      sizer.sizeHint = hint;
    }
    if (parent.isVisible) {
      this.update();
    }
  }

  /**
   * Get the splitter handle at the given index.
   */
  handleAt(index: number): SplitHandle {
    var item = this._items[index];
    return item ? item.handle : void 0;
  }

  /**
   * Move the handle at the given index to the offset position.
   *
   * This will move the handle as close as possible to the given
   * offset position, without violating item size constraints.
   */
  moveHandle(index: number, pos: number): void {
    var item = this._items[index];
    if (!item || item.handle.hidden) {
      return;
    }
    var delta: number;
    if (this._orientation === Orientation.Horizontal) {
      delta = pos - item.handle.node.offsetLeft;
    } else {
      delta = pos - item.handle.node.offsetTop;
    }
    if (delta === 0) {
      return;
    }
    var sizers = this._sizers;
    storeSizes(sizers); // Prevent item resizing unless needed.
    if (delta > 0) {
      growSizer(sizers, index, delta);
    } else {
      sizers.reverse();
      growSizer(sizers, sizers.length - (index + 2), -delta);
      sizers.reverse();
    }
    this.update();
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
    algo.removeAt(this._sizers, index);
    if (item) {
      var hNode = item.handle.node;
      var pNode = hNode.parentNode;
      if (pNode) pNode.removeChild(hNode);
      this.invalidate();
    }
    return item;
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
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget, stretch = 0, alignment: Alignment = 0): number {
    this.remove(widget);
    this.ensureParent(widget);
    var handle = new SplitHandle(this._orientation);
    var item = new SplitItem(handle, widget, alignment);
    var sizer = new LayoutSizer();
    sizer.stretch = Math.max(0, stretch | 0);
    index = Math.max(0, Math.min(index | 0, this._items.length));
    algo.insert(this._items, index, item);
    algo.insert(this._sizers, index, sizer);
    this.invalidate();
    return index;
  }

  /**
   * Get the stretch factor for the given widget or index.
   *
   * Returns -1 if the given widget or index is invalid.
   */
  stretch(which: Widget | number): number {
    var index = typeof which === 'number' ? which : this.indexOf(which);
    var sizer = this._sizers[index];
    return sizer ? sizer.stretch : -1;
  }

  /**
   * Set the stretch factor for the given widget or index.
   *
   * Returns true if the stretch was updated, false otherwise.
   */
  setStretch(which: Widget | number, stretch: number): boolean {
    var index = typeof which === 'number' ? which : this.indexOf(which);
    var sizer = this._sizers[index];
    if (!sizer) {
      return false;
    }
    stretch = Math.max(0, stretch | 0);
    if (sizer.stretch !== stretch) {
      sizer.stretch = stretch;
      this.invalidate();
    }
    return true;
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
    // Bail early when no work needs to be done.
    var items = this._items;
    if (items.length === 0) {
      return;
    }

    // Refresh the layout items if needed.
    if (this._dirty) {
      this._setupGeometry();
    }

    // Commonly used variables.
    var orient = this._orientation;
    var sizers = this._sizers;

    // Distribute the layout space to the sizers.
    var mainSpace = orient === Orientation.Horizontal ? width : height;
    layoutCalc(sizers, Math.max(0, mainSpace - this._fixedSpace));

    // Update the geometry of the items according to the orientation.
    var hSize = this._handleSize;
    var count = items.length;
    if (orient === Orientation.Horizontal) {
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.isHidden) {
          continue;
        }
        var size = sizers[i].size;
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
        var item = items[i];
        if (item.isHidden) {
          continue;
        }
        var size = sizers[i].size;
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
      this._fixedSpace = 0;
      return;
    }

    // Invalidate the layout items and reset the handles for the current
    // orientation. Hide the handles associated with a hidden item and
    // ensure the handle node is attached to the parent node. Traverse
    // the items backwards and hide the first visible item handle.
    var hidFirst = false;
    var pNode = parent.node;
    var orient = this._orientation;
    var items = this._items;
    var count = items.length;
    for (var i = count - 1; i >= 0; --i) {
      var item = items[i];
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
    var handleSize = this._handleSize;
    var sizers = this._sizers;

    // Prevent item resizing unless needed.
    storeSizes(sizers);

    // Compute the size bounds according to the splitter orientation.
    //
    // A visible item with a zero size hint indicates a newly added
    // item. Its layout size hint is initialized to the item's hint.
    if (orient === Orientation.Horizontal) {
      maxH = Infinity;
      maxW = count > 0 ? 0 : Infinity;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        var sizer = sizers[i];
        if (item.isHidden) {
          sizer.minSize = 0;
          sizer.maxSize = 0;
          sizer.expansive = false;
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
        sizer.minSize = itemMin.width;
        sizer.maxSize = itemMax.width;
        sizer.expansive = item.expandHorizontal;
        if (sizer.sizeHint === 0) {
          sizer.sizeHint = itemHint.width;
        }
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
        var item = items[i];
        var sizer = sizers[i];
        if (item.isHidden) {
          sizer.minSize = 0;
          sizer.maxSize = 0;
          sizer.expansive = false;
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
        sizer.minSize = itemMin.height;
        sizer.maxSize = itemMax.height;
        sizer.expansive = item.expandVertical;
        if (sizer.sizeHint === 0) {
          sizer.sizeHint = itemHint.height;
        }
        if (!item.handle.hidden) {
          fixedSpace += handleSize;
        }
      }
      hintH += fixedSpace;
      minH += fixedSpace;
      maxH += fixedSpace;
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
    this._fixedSpace = fixedSpace;
  }

  private _dirty = true;
  private _handleSize = 3;
  private _fixedSpace = 0;
  private _sizeHint: Size = null;
  private _minSize: Size = null;
  private _maxSize: Size = null;
  private _orientation: Orientation;
  private _items: SplitItem[] = [];
  private _sizers: LayoutSizer[] = [];
}


/**
 * A custom widget item used by a split layout.
 */
export
class SplitItem extends WidgetItem {
  /**
   * Construct a new split item.
   */
  constructor(handle: SplitHandle, widget: Widget, alignment: Alignment = 0) {
    super(widget, alignment);
    this._handle = handle;
  }

  /**
   * Get the split handle for the item.
   */
  get handle(): SplitHandle {
    return this._handle;
  }

  private _handle: SplitHandle;
}


/**
 * Store the current layout sizes of the sizers.
 *
 * This will set the layout size hint to the current layout size for
 * every sizer with a current size greater than zero. This ensures
 * that an item will not be resized on the next layout unless its
 * size limits force a resize.
 */
function storeSizes(sizers: LayoutSizer[]): void {
  for (var i = 0, n = sizers.length; i < n; ++i) {
    var sizer = sizers[i];
    if (sizer.size > 0) {
      sizer.sizeHint = sizer.size;
    }
  }
}


/**
 * Grow a sizer to the right by a positive delta.
 *
 * This will adjust the sizer's neighbors if required.
 */
function growSizer(sizers: LayoutSizer[], index: number, delta: number): void {
  var growLimit = 0;
  for (var i = 0; i <= index; ++i) {
    var sizer = sizers[i];
    growLimit += sizer.maxSize - sizer.size;
  }
  var shrinkLimit = 0;
  for (var i = index + 1, n = sizers.length; i < n; ++i) {
    var sizer = sizers[i];
    shrinkLimit += sizer.size - sizer.minSize;
  }
  delta = Math.min(delta, growLimit, shrinkLimit);
  var grow = delta;
  for (var i = index; i >= 0 && grow > 0; --i) {
    var sizer = sizers[i];
    var limit = sizer.maxSize - sizer.size;
    if (limit >= grow) {
      sizer.sizeHint = sizer.size + grow;
      grow = 0;
    } else {
      sizer.sizeHint = sizer.size + limit;
      grow -= limit;
    }
  }
  var shrink = delta;
  for (var i = index + 1, n = sizers.length; i < n && shrink > 0; ++i) {
    var sizer = sizers[i];
    var limit = sizer.size - sizer.minSize;
    if (limit >= shrink) {
      sizer.sizeHint = sizer.size - shrink;
      shrink = 0;
    } else {
      sizer.sizeHint = sizer.size - limit;
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

} // module phosphor.widgets
