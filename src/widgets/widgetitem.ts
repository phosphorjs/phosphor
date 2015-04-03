/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Size = utility.Size;


/**
 * A layout item which manages a widget.
 *
 * User code will not typically use this class directly.
 */
export
class WidgetItem implements ILayoutItem {
  /**
   * Construct a new widget item.
   */
  constructor(widget: Widget, alignment: Alignment = 0) {
    this._widget = widget;
    this._alignment = alignment;
  }

  /**
   * Test whether the item manages a widget.
   */
  get isWidget(): boolean {
    return true;
  }

  /**
   * Test whether the item manages empty space.
   */
  get isSpacer(): boolean {
    return false;
  }

  /**
   * Test whether the item should be treated as hidden.
   */
  get isHidden(): boolean {
    return this._widget.isHidden;
  }

  /**
   * The widget the item manages, if any.
   */
  get widget(): Widget {
    return this._widget;
  }

  /**
   * Get the alignment for the item in its layout cell.
   */
  get alignment(): Alignment {
    return this._alignment;
  }

  /**
   * Set the alignment for the item in its layout cell.
   */
  set alignment(alignment: Alignment) {
    this._alignment = alignment;
  }

  /**
   * Test whether the item should be expanded horizontally.
   */
  get expandHorizontal(): boolean {
    if (this._alignment & Alignment.Horizontal_Mask) {
      return false;
    }
    var horizontalPolicy = this._widget.horizontalSizePolicy;
    return (horizontalPolicy & SizePolicy.ExpandFlag) !== 0;
  }

  /**
   * Test Whether the item should be expanded vertically.
   */
  get expandVertical(): boolean {
    if (this._alignment & Alignment.Vertical_Mask) {
      return false;
    }
    var verticalPolicy = this._widget.verticalSizePolicy;
    return (verticalPolicy & SizePolicy.ExpandFlag) !== 0;
  }

  /**
   * Invalidate the cached data for the item.
   */
  invalidate(): void {
    this._origHint = null;
    this._sizeHint = null;
    this._minSize = null;
    this._maxSize = null;
  }

  /**
   * Compute the preferred size of the item.
   */
  sizeHint(): Size {
    if (!this._sizeHint) {
      this._updateSizes();
    }
    return this._sizeHint;
  }

  /**
   * Compute the minimum size of the item.
   */
  minSize(): Size {
    if (!this._minSize) {
      this._updateSizes();
    }
    return this._minSize;
  }

  /**
   * Compute the maximum size of the item.
   */
  maxSize(): Size {
    if (!this._maxSize) {
      this._updateSizes();
    }
    return this._maxSize;
  }

  /**
   * Set the geometry of the item using the given values.
   */
  setGeometry(x: number, y: number, width: number, height: number): void {
    var widget = this._widget;
    if (widget.isHidden) {
      return;
    }
    var w = width;
    var h = height;
    var alignment = this._alignment;
    if (alignment & Alignment.Horizontal_Mask) {
      var ignW = widget.horizontalSizePolicy === SizePolicy.Ignored;
      w = Math.min(w, ignW ? this._origHint.width : this._sizeHint.width);
    }
    if (alignment & Alignment.Vertical_Mask) {
      var ignH = widget.verticalSizePolicy === SizePolicy.Ignored;
      h = Math.min(h, ignH ? this._origHint.height : this._sizeHint.height);
    }
    var minSize = this._minSize;
    var maxSize = this._maxSize;
    w = Math.max(minSize.width, Math.min(w, maxSize.width));
    h = Math.max(minSize.height, Math.min(h, maxSize.height));
    if (alignment & Alignment.Right) {
      x += width - w;
    } else if (alignment & Alignment.HorizontalCenter) {
      x += (width - w) / 2;
    }
    if (alignment & Alignment.Bottom) {
      y += height - h;
    } else if (alignment & Alignment.VerticalCenter) {
      y += (height - h) / 2;
    }
    widget.setGeometry(x, y, w, h);
  }

  /**
   * Update the computed sizes for the widget item.
   */
  private _updateSizes(): void {
    var widget = this._widget;
    if (widget.isHidden) {
      this._origHint = Size.Zero;
      this._sizeHint = Size.Zero;
      this._minSize = Size.Zero;
      this._maxSize = Size.Zero;
      return;
    }
    var box = widget.boxSizing();
    var sizeHint = widget.sizeHint();
    var minHint = widget.minSizeHint();
    var maxHint = widget.maxSizeHint();
    var verticalPolicy = widget.verticalSizePolicy;
    var horizontalPolicy = widget.horizontalSizePolicy;

    // computed size hint
    var hintW = 0;
    var hintH = 0;
    if (horizontalPolicy !== SizePolicy.Ignored) {
      hintW = Math.max(minHint.width, sizeHint.width);
    }
    if (verticalPolicy !== SizePolicy.Ignored) {
      hintH = Math.max(minHint.height, sizeHint.height);
    }
    hintW = Math.max(box.minWidth, Math.min(hintW, box.maxWidth));
    hintH = Math.max(box.minHeight, Math.min(hintH, box.maxHeight));

    // computed min size
    var minW = 0;
    var minH = 0;
    if (horizontalPolicy !== SizePolicy.Ignored) {
      if (horizontalPolicy & SizePolicy.ShrinkFlag) {
        minW = minHint.width;
      } else {
        minW = Math.max(minHint.width, sizeHint.width);
      }
    }
    if (verticalPolicy !== SizePolicy.Ignored) {
      if (verticalPolicy & SizePolicy.ShrinkFlag) {
        minH = minHint.height;
      } else {
        minH = Math.max(minHint.height, sizeHint.height);
      }
    }
    minW = Math.max(box.minWidth, Math.min(minW, box.maxWidth));
    minH = Math.max(box.minHeight, Math.min(minH, box.maxHeight));

    // computed max size
    var maxW = Infinity;
    var maxH = Infinity;
    var alignment = this._alignment;
    if (!(alignment & Alignment.Horizontal_Mask)) {
      if (horizontalPolicy !== SizePolicy.Ignored) {
        if (horizontalPolicy & SizePolicy.GrowFlag) {
          maxW = Math.max(minHint.width, maxHint.width);
        } else {
          maxW = Math.max(minHint.width, sizeHint.width);
        }
      }
      maxW = Math.max(box.minWidth, Math.min(maxW, box.maxWidth));
    }
    if (!(alignment & Alignment.Vertical_Mask)) {
      if (verticalPolicy !== SizePolicy.Ignored) {
        if (verticalPolicy & SizePolicy.GrowFlag) {
          maxH = Math.max(minHint.height, maxHint.height);
        } else {
          maxH = Math.max(minHint.height, sizeHint.height);
        }
      }
      maxH = Math.max(box.minHeight, Math.min(maxH, box.maxHeight));
    }

    this._origHint = sizeHint;
    this._sizeHint = new Size(hintW, hintH);
    this._minSize = new Size(minW, minH);
    this._maxSize = new Size(maxW, maxH);
  }

  private _widget: Widget;
  private _alignment: Alignment;
  private _origHint: Size = null;
  private _sizeHint: Size = null;
  private _minSize: Size = null;
  private _maxSize: Size = null;
}

} // module phosphor.widgets
