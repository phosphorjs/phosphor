/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * A layout which arranges panels in a row or column.
 */
export
class BoxLayout extends Layout {
  /**
   * Construct a new box layout.
   */
  constructor(direction: Direction, spacing = 8) {
    super();
    this._direction = direction;
    this._spacing = Math.max(0, spacing);
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
   * Get the layout direction for the box layout.
   */
  get direction(): Direction {
    return this._direction;
  }

  /**
   * Set the layout direction for the box layout.
   */
  set direction(direction: Direction) {
    if (direction === this._direction) {
      return;
    }
    if (isHorizontal(this._direction) !== isHorizontal(direction)) {
      this._items.forEach(item => {
        if (item instanceof SpacerItem) item.transpose();
      });
    }
    this._direction = direction;
    this.invalidate();
  }

  /**
   * Get the inter-element fixed spacing for the box layout.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the inter-element fixed spacing for the box layout.
   */
  set spacing(spacing: number) {
    spacing = Math.max(0, spacing);
    if (spacing === this._spacing) {
      return;
    }
    this._spacing = spacing;
    this.invalidate();
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
  takeAt(index: number): ILayoutItem {
    index = index | 0;
    if (index < 0 || index >= this._items.length) {
      return void 0;
    }
    var item = this._items.splice(index, 1)[0];
    this._sizers.splice(index, 1);
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
  addPanel(panel: Panel): number {
    return this.insertPanel(this.count, panel);
  }

  /**
   * Insert a panel into the layout at the given index.
   *
   * If the panel already exists in the layout, it will be moved.
   *
   * Returns the index of the added panel.
   */
  insertPanel(index: number, panel: Panel): number {
    this.remove(panel);
    this.ensureParent(panel);
    return this._insert(index, new PanelItem(panel));
  }

  /**
   * Add a fixed amount of spacing to the end of the layout.
   *
   * Returns the index of the added space.
   */
  addSpacing(size: number): number {
    return this.insertSpacing(this.count, size);
  }

  /**
   * Insert a fixed amount of spacing at the given index.
   *
   * Returns the index of the added space.
   */
  insertSpacing(index: number, size: number): number {
    var item: ILayoutItem;
    var fixed = SizePolicy.Fixed;
    var minimum = SizePolicy.Minimum;
    if (isHorizontal(this._direction)) {
      item = new SpacerItem(size, 0, 0, 0, fixed, minimum);
    } else {
      item = new SpacerItem(0, size, 0, 0, minimum, fixed);
    }
    return this._insert(index, item);
  }

  /**
   * Add stretchable space to the end of the layout.
   *
   * Returns the index of the added space.
   */
  addStretch(stretch = 0): number {
    return this.insertStretch(this.count, stretch);
  }

  /**
   * Insert stretchable space at the given index.
   */
  insertStretch(index: number, stretch = 0): number {
    var item: ILayoutItem;
    var expanding = SizePolicy.Expanding;
    var minimum = SizePolicy.Minimum;
    if (isHorizontal(this._direction)) {
      item = new SpacerItem(0, 0, stretch, stretch, expanding, minimum);
    } else {
      item = new SpacerItem(0, 0, stretch, stretch, minimum, expanding);
    }
    return this._insert(index, item);
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
    var dir = this._direction;
    var sizers = this._sizers;
    var lastSpaceIndex = this._lastSpaceIndex;

    // Distribute the layout space to the sizers.
    var mainSpace = isHorizontal(dir) ? width : height;
    layoutCalc(sizers, mainSpace - this._fixedSpace);

    // Update the geometry of the items according to the layout
    // direction. Fixed spacing is added before each item which
    // immediately follows a non-hidden panel item. This has the
    // effect of of collapsing all sibling spacers and ensuring
    // that only one fixed spacing increment occurs between any
    // two panels. It also prevents fixed spacing from being
    // added before the first item or after the last item.
    var y = boxD.paddingTop;
    var x = boxD.paddingLeft;
    var lastWasPanel = false;
    var spacing = this._spacing;
    var count = items.length;
    if (dir === Direction.LeftToRight) {
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasPanel && i <= lastSpaceIndex) {
          x += spacing;
        }
        var size = sizers[i].size;
        item.setGeometry(x, y, size, height);
        lastWasPanel = item.isPanel;
        x += size;
      }
    } else if (dir === Direction.TopToBottom) {
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasPanel && i <= lastSpaceIndex) {
          y += spacing;
        }
        var size = sizers[i].size;
        item.setGeometry(x, y, width, size);
        lastWasPanel = item.isPanel;
        y += size;
      }
    } else if (dir === Direction.RightToLeft) {
      x += width;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasPanel && i <= lastSpaceIndex) {
          x -= spacing;
        }
        var size = sizers[i].size;
        item.setGeometry(x - size, y, size, height);
        lastWasPanel = item.isPanel;
        x -= size;
      }
    } else {
      y += height;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasPanel && i <= lastSpaceIndex) {
          y -= spacing;
        }
        var size = sizers[i].size;
        item.setGeometry(x, y - size, width, size);
        lastWasPanel = item.isPanel;
        y -= size;
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

    // Invalidate the layout items. This is done here instead of the
    // `invalidate` method as this method is invoked only when needed,
    // typically on a collapsed event. It also finds the last visible
    // panel item index, which is needed for fixed spacing allocation.
    var lastSpaceIndex = -1;
    var items = this._items;
    var count = items.length;
    for (var i = 0; i < count; ++i) {
      var item = items[i];
      item.invalidate();
      if (item.isPanel && !item.isHidden) {
        lastSpaceIndex = i;
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
    var lastWasPanel = false;
    var dir = this._direction;
    var spacing = this._spacing;
    var sizers = this._sizers;

    // Compute the size bounds according to the layout orientation.
    // Empty layout items behave as if they don't exist and fixed
    // spacing is before items which immediately follow a non-hidden
    // panel item. This prevents leading and trailing fixed spacing
    // as well as fixed spacing after spacers. Sizers are initialized
    // according to their corresponding layout item.
    if (isHorizontal(dir)) {
      maxH = Infinity;
      maxW = count > 0 ? 0 : Infinity;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        var sizer = sizers[i];
        if (item.isHidden) {
          sizer.expansive = false;
          sizer.stretch = 0;
          sizer.sizeHint = 0;
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
        sizer.sizeHint = itemHint.width;
        sizer.minSize = itemMin.width;
        sizer.maxSize = itemMax.width;
        if (lastWasPanel && i <= lastSpaceIndex) {
          fixedSpace += spacing;
        }
        lastWasPanel = item.isPanel;
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
          sizer.stretch = 0;
          sizer.sizeHint = 0;
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
        sizer.sizeHint = itemHint.height;
        sizer.minSize = itemMin.height;
        sizer.maxSize = itemMax.height;
        if (lastWasPanel && i <= lastSpaceIndex) {
          fixedSpace += spacing;
        }
        lastWasPanel = item.isPanel;
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
    this._lastSpaceIndex = lastSpaceIndex;
  }

  /**
   * Insert a layout item at the given index.
   *
   * Returns the index of the added item.
   */
  private _insert(index: number, item: ILayoutItem): number {
    index = Math.max(0, Math.min(index, this._items.length));
    this._items.splice(index, 0, item);
    this._sizers.splice(index, 0, new LayoutSizer());
    this.invalidate();
    return index;
  }

  private _dirty = true;
  private _fixedSpace = 0;
  private _spacing: number;
  private _lastSpaceIndex = -1;
  private _direction: Direction;
  private _sizeHint: Size = null;
  private _minSize: Size = null;
  private _maxSize: Size = null;
  private _items: ILayoutItem[] = [];
  private _sizers: LayoutSizer[] = [];
}


/**
 * Test whether the given direction is horizontal.
 */
function isHorizontal(dir: Direction): boolean {
  return dir === Direction.LeftToRight || dir === Direction.RightToLeft;
}

} // module phosphor.panels
