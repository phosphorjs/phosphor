/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

import Alignment = enums.Alignment;
import Direction = enums.Direction;
import SizePolicy = enums.SizePolicy;

import Size = geometry.Size;

import Widget = widgets.Widget;


/**
 * A layout which arranges widgets in a row or column.
 */
export
class BoxLayout extends Layout {
  /**
   * Construct a new box layout.
   */
  constructor(direction: Direction, spacing = 8) {
    super();
    this._m_direction = direction;
    this._m_spacing = Math.max(0, spacing);
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._m_sizingItems = null;
    this._m_layoutItems = null;
    super.dispose();
  }

  /**
   * Get the layout direction for the box layout.
   */
  get direction(): Direction {
    return this._m_direction;
  }

  /**
   * Set the layout direction for the box layout.
   */
  set direction(direction: Direction) {
    if (direction === this._m_direction) {
      return;
    }
    var wasHoriz = isHorizontal(this._m_direction);
    var nowHoriz = isHorizontal(direction);
    if (wasHoriz !== nowHoriz) {
      this._m_layoutItems.forEach(item => {
        if (item instanceof SpacerItem) {
          (<SpacerItem>item).transpose();
        }
      });
    }
    this._m_direction = direction;
    this.invalidate();
  }

  /**
   * Get the inter-element fixed spacing for the box layout.
   */
  get spacing(): number {
    return this._m_spacing;
  }

  /**
   * Set the inter-element fixed spacing for the box layout.
   */
  set spacing(spacing: number) {
    spacing = Math.max(0, spacing);
    if (spacing === this._m_spacing) {
      return;
    }
    this._m_spacing = spacing;
    this.invalidate();
  }

  /**
   * Get the number of layout items in the layout.
   */
  get count(): number {
    return this._m_layoutItems.length;
  }

  /**
   * Get the layout item at the specified index.
   */
  itemAt(index: number): ILayoutItem {
    return this._m_layoutItems[index];
  }

  /**
   * Remove and return the layout item at the specified index.
   */
  takeAt(index: number): ILayoutItem {
    index = index | 0;
    if (index < 0 || index >= this._m_layoutItems.length) {
      return void 0;
    }
    var item = this._m_layoutItems.splice(index, 1)[0];
    this._m_sizingItems.splice(index, 1);
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
    var n = this._m_layoutItems.length;
    if (fromIndex < 0 || fromIndex >= n) {
      return -1;
    }
    toIndex = Math.max(0, Math.min(toIndex | 0, n - 1));
    if (fromIndex === toIndex) {
      return toIndex;
    }
    var item = this._m_layoutItems.splice(fromIndex, 1)[0];
    this._m_layoutItems.splice(toIndex, 0, item);
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
    var item = new WidgetItem(widget, alignment);
    return this._insertItem(index, item, stretch);
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
    var item = createFixedSpacer(this._m_direction, size);
    return this._insertItem(index, item, 0);
  }

  /**
   * Add stretchable space to the end of the layout.
   *
   * Returns the index of the added spac.
   */
  addStretch(stretch = 0): number {
    return this.insertStretch(this.count, stretch);
  }

  /**
   * Insert stretchable space at the given index.
   */
  insertStretch(index: number, stretch = 0): number {
    var item = createStretchSpacer(this._m_direction);
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
    var layoutItems = this._m_layoutItems;
    if (layoutItems.length === 0) {
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
    var dir = this._m_direction;
    var sizingItems = this._m_sizingItems;
    var lastSpaceIndex = this._m_lastSpaceIndex;

    // Distribute the layout space to the sizing items.
    var mainSpace = isHorizontal(dir) ? width : height;
    layoutCalc(sizingItems, mainSpace - this._m_fixedSpace);

    // Update the geometry of the items according to the layout
    // direction. Fixed spacing is added before each item which
    // immediately follows a non-hidden widget item. This has the
    // effect of of collapsing all sibling spacers and ensuring
    // that only one fixed spacing increment occurs between any
    // two widgets. It also prevents fixed spacing from being
    // added before the first item or after the last item.
    var y = boxD.paddingTop;
    var x = boxD.paddingLeft;
    var lastWasWidget = false;
    var spacing = this._m_spacing;
    var count = layoutItems.length;
    if (dir === Direction.LeftToRight) {
      for (var i = 0; i < count; ++i) {
        var item = layoutItems[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasWidget && i <= lastSpaceIndex) {
          x += spacing;
        }
        var size = sizingItems[i].size;
        item.setGeometry(x, y, size, height);
        lastWasWidget = item.isWidget;
        x += size;
      }
    } else if (dir === Direction.TopToBottom) {
      for (var i = 0; i < count; ++i) {
        var item = layoutItems[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasWidget && i <= lastSpaceIndex) {
          y += spacing;
        }
        var size = sizingItems[i].size;
        item.setGeometry(x, y, width, size);
        lastWasWidget = item.isWidget;
        y += size;
      }
    } else if (dir === Direction.RightToLeft) {
      x += width;
      for (var i = 0; i < count; ++i) {
        var item = layoutItems[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasWidget && i <= lastSpaceIndex) {
          x -= spacing;
        }
        var size = sizingItems[i].size;
        item.setGeometry(x - size, y, size, height);
        lastWasWidget = item.isWidget;
        x -= size;
      }
    } else {
      y += height;
      for (var i = 0; i < count; ++i) {
        var item = layoutItems[i];
        if (item.isHidden) {
          continue;
        }
        if (lastWasWidget && i <= lastSpaceIndex) {
          y -= spacing;
        }
        var size = sizingItems[i].size;
        item.setGeometry(x, y - size, width, size);
        lastWasWidget = item.isWidget;
        y -= size;
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

    // Invalidate the layout items. This is done here instead of the
    // `invalidate` method as this method is invoked only when needed,
    // typically on a collapsed event. It also finds the last visible
    // widget item index, which is needed for fixed spacing allocation.
    var lastSpaceIndex = -1;
    var layoutItems = this._m_layoutItems;
    var count = layoutItems.length;
    for (var i = 0; i < count; ++i) {
      var item = layoutItems[i];
      item.invalidate();
      if (item.isWidget && !item.isHidden) {
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
    var lastWasWidget = false;
    var dir = this._m_direction;
    var spacing = this._m_spacing;
    var sizingItems = this._m_sizingItems;

    // Compute the size bounds according to the layout orientation.
    // Empty layout items behave as if they don't exist and fixed
    // spacing is before items which immediately follow a non-hidden
    // widget item. This prevents leading and trailing fixed spacing
    // as well as fixed spacing after spacers. The sizing items are
    // initialized according to their corresponding layout item.
    // The stretch factor of the sizing item was set when it was
    // constructed and does not need to be updated.
    if (isHorizontal(dir)) {
      maxH = Infinity;
      maxW = count > 0 ? 0 : Infinity;
      for (var i = 0; i < count; ++i) {
        var item = layoutItems[i];
        var sizingItem = sizingItems[i];
        if (item.isHidden) {
          sizingItem.expansive = false;
          sizingItem.sizeHint = 0;
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
        sizingItem.sizeHint = itemHint.width;
        sizingItem.minSize = itemMin.width;
        sizingItem.maxSize = itemMax.width;
        if (lastWasWidget && i <= lastSpaceIndex) {
          fixedSpace += spacing;
        }
        lastWasWidget = item.isWidget;
      }
      hintW += fixedSpace;
      minW += fixedSpace;
      maxW += fixedSpace;
    } else {
      maxW = Infinity;
      maxH = count > 0 ? 0 : Infinity;
      for (var i = 0; i < count; ++i) {
        var item = layoutItems[i];
        var sizingItem = sizingItems[i];
        if (item.isHidden) {
          sizingItem.expansive = false;
          sizingItem.sizeHint = 0;
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
        sizingItem.sizeHint = itemHint.height;
        sizingItem.minSize = itemMin.height;
        sizingItem.maxSize = itemMax.height;
        if (lastWasWidget && i <= lastSpaceIndex) {
          fixedSpace += spacing;
        }
        lastWasWidget = item.isWidget;
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
    this._m_lastSpaceIndex = lastSpaceIndex;
  }

  /**
   * Insert a layout item with the specified stretch factor.
   *
   * Returns the index of the added item.
   */
  private _insertItem(index: number, item: ILayoutItem, stretch: number): number {
    var sizingItem = createSizingItem(Math.max(0, stretch | 0));
    index = Math.max(0, Math.min(index | 0, this._m_layoutItems.length));
    this._m_layoutItems.splice(index, 0, item);
    this._m_sizingItems.splice(index, 0, sizingItem);
    this.invalidate();
    return index;
  }

  private _m_dirty = true;
  private _m_fixedSpace = 0;
  private _m_spacing: number;
  private _m_lastSpaceIndex = -1;
  private _m_direction: Direction;
  private _m_sizeHint: Size = null;
  private _m_minSize: Size = null;
  private _m_maxSize: Size = null;
  private _m_sizingItems: SizingItem[] = [];
  private _m_layoutItems: ILayoutItem[] = [];
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
 * Create a spacer item for the given fixed size.
 */
function createFixedSpacer(dir: Direction, size: number): ILayoutItem {
  if (isHorizontal(dir)) {
    return new SpacerItem(size, 0, SizePolicy.Fixed, SizePolicy.Minimum);
  }
  return new SpacerItem(0, size, SizePolicy.Minimum, SizePolicy.Fixed);
}


/**
 * Create a stretch spacer item.
 */
function createStretchSpacer(dir: Direction): ILayoutItem {
  if (isHorizontal(dir)) {
    return new SpacerItem(0, 0, SizePolicy.Expanding, SizePolicy.Minimum);
  }
  return new SpacerItem(0, 0, SizePolicy.Minimum, SizePolicy.Expanding);
}


/**
 * Test whether the given direction is horizontal.
 */
function isHorizontal(dir: Direction): boolean {
  return dir === Direction.LeftToRight || dir === Direction.RightToLeft;
}

} // module phosphor.layout
