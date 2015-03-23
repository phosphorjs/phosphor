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


/**
 * The layout class used by a SplitPanel.
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
    return normalize(this._sizers.map(it => it.size));
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
    var boxD = parent.boxData;
    if (this._orientation === Orientation.Horizontal) {
      totalSize = parent.width - boxD.horizontalSum - this._fixedSpace;
    } else {
      totalSize = parent.height - boxD.verticalSum - this._fixedSpace;
    }
    var sizers = this._sizers;
    var normed = normalize(sizes);
    var n = Math.min(sizers.length, normed.length);
    for (var i = 0; i < n; ++i) {
      sizers[i].sizeHint = Math.round(normed[i] * totalSize);
    }
    if (parent.isVisible) {
      this.layout();
    }
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
   * Get the splitter handle at the given index.
   */
  handleAt(index: number): SplitHandle {
    var item = this._items[index];
    return item ? item.handle : void 0;
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
    this._sizers.splice(index, 1);
    var hNode = item.handle.node;
    var pNode = hNode.parentNode;
    if (pNode) pNode.removeChild(hNode);
    this.invalidate();
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
    return this.insert(this.count, panel);
  }

  /**
   * Insert a panel into the layout at the given index.
   *
   * If the panel already exists in the layout, it will be moved.
   *
   * Returns the index of the added panel.
   */
  insert(index: number, panel: Panel): number {
    this.remove(panel);
    this.ensureParent(panel);
    var handle = new SplitHandle(this._orientation);
    var item = new SplitItem(panel, handle);
    var sizer = new LayoutSizer();
    index = Math.max(0, Math.min(index, this._items.length));
    this._items.splice(index, 0, item);
    this._sizers.splice(index, 0, sizer);
    this.invalidate();
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
    if (delta > 0) {
      growSizer(sizers, index, delta);
    } else {
      sizers.reverse();
      growSizer(sizers, sizers.length - (index + 2), -delta);
      sizers.reverse();
    }
    this.layout();
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
    var items = this._items;
    if (!parent || items.length === 0) {
      return;
    }

    // Refresh the layout items if needed.
    if (this._dirty) {
      this._setupGeometry();
    }

    // Setup commonly used variables.
    var boxD = parent.boxData;
    var width = parent.width - boxD.horizontalSum;
    var height = parent.height - boxD.verticalSum;
    var orient = this._orientation;
    var sizers = this._sizers;

    // Distribute the layout space to the sizers.
    var mainSpace = orient === Orientation.Horizontal ? width : height;
    layoutCalc(sizers, mainSpace - this._fixedSpace);

    // Update the geometry of the items according to the orientation.
    var y = boxD.paddingTop;
    var x = boxD.paddingLeft;
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
      var zero = new Size(0, 0);
      this._sizeHint = zero;
      this._minSize = zero;
      this._maxSize = zero;
      this._fixedSpace = 0;
      return;
    }

    // Invalidate the layout items and reset the handles for the current
    // orientation. Hide the handles associated with a hidden item and
    // the handle node is attached to the parent node. Traverse the
    // items backwards and hide the first visible item handle.
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

    // Compute the size bounds according to the splitter orientation.
    // The size hints for the sizers are explicitly not updated. The
    // size hint for a panel is only adjusted when the user moves a
    // handle. This allows the panels to remain well-sized when their
    // siblings panels are added of removed or when the panel is shown
    // or hidden (see the growItem function).
    if (orient === Orientation.Horizontal) {
      maxH = Infinity;
      maxW = count > 0 ? 0 : Infinity;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        var sizer = sizers[i];
        if (item.isHidden) {
          sizer.expansive = false;
          sizer.minSize = 0;
          sizer.maxSize = 0;
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
        sizer.expansive = item.expandHorizontal;
        sizer.stretch = item.horizontalStretch;
        sizer.minSize = itemMin.width;
        sizer.maxSize = itemMax.width;
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
          sizer.expansive = false;
          sizer.minSize = 0;
          sizer.maxSize = 0;
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
        sizer.expansive = item.expandVertical;
        sizer.stretch = item.verticalStretch;
        sizer.minSize = itemMin.height;
        sizer.maxSize = itemMax.height;
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
 * A custom panel item used by a split layout.
 */
export
class SplitItem extends PanelItem {
  /**
   * Construct a new split item.
   */
  constructor(panel: Panel, handle: SplitHandle) {
    super(panel);
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
 * Grow a sizer to the right by a positive delta.
 *
 * This will adjust the sizer's neighbors if required.
 *
 * Before adjusting the sizer, the size hints of all sizers will be
 * updated to their current size. This allows the sections to remain
 * well sized on the subsequent layout since the size hint is the
 * effective input to the `layoutCalc` function.
 */
function growSizer(sizers: LayoutSizer[], index: number, delta: number): void {
  // TODO - the size hint of hidden sizers gets forced to zero here. It
  // would be nice to preserve it so it's a reasonable size when shown.
  for (var i = 0, n = sizers.length; i < n; ++i) {
    var sizer = sizers[i];
    sizer.sizeHint = sizer.size;
  }
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

} // module phosphor.panels
