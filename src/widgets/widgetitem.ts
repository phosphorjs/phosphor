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
  constructor(widget: Widget) {
    this._widget = widget;
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
   * Get the size basis for the item.
   */
  get basis(): number {
    return this._basis;
  }

  /**
   * Set the size basis for the item.
   */
  set basis(basis: number) {
    this._basis = Math.max(-1, basis | 0);
  }

  /**
   * Get the stretch factor for the item.
   */
  get stretch(): number {
    return this._stretch;
  }

  /**
   * Set the stretch factor for the item.
   */
  set stretch(stretch: number) {
    this._stretch = Math.max(0, stretch | 0);
  }

  /**
   * Test whether the item is expansive.
   */
  get expansive(): boolean {
    return this._expansive;
  }

  /**
   * Set whether the item is expansive.
   */
  set expansive(expansive: boolean) {
    this._expansive = expansive;
  }

  /**
   * Get the alignment for the item.
   */
  get alignment(): Alignment {
    return this._alignment;
  }

  /**
   * Set the alignment for the item.
   */
  set alignment(alignment: Alignment) {
    this._alignment = alignment;
  }

  /**
   * Invalidate the cached data for the item.
   */
  invalidate(): void {
    this._minSize = null;
    this._maxSize = null;
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
   * Set the geometry rect of the item using the given values.
   */
  setRect(x: number, y: number, width: number, height: number): void {
    var widget = this._widget;
    if (widget.isHidden) {
      return;
    }
    var w = width;
    var h = height;
    var alignment = this._alignment;
    if (alignment & Alignment.Horizontal_Mask) {
      var igW = panel.horizontalSizePolicy === SizePolicy.Ignored;
      w = Math.min(w, igW ? this._origHint.width : this._sizeHint.width);
    }
    if (alignment & Alignment.Vertical_Mask) {
      var igH = panel.verticalSizePolicy === SizePolicy.Ignored;
      h = Math.min(h, igH ? this._origHint.height : this._sizeHint.height);
    }
    var minSize = this._minSize;
    var maxSize = this._maxSize;
    var w = Math.max(minSize.width, Math.min(w, maxSize.width));
    var h = Math.max(minSize.height, Math.min(h, maxSize.height));
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
   * Update the computed sizes for the panel item.
   */
  private _updateSizes(): void {
    var widget = this._widget;
    if (widget.isHidden) {
      this._minSize = Size.Zero;
      this._maxSize = Size.Zero;
      return;
    }
    var box = widget.boxData();
    var minHint = widget.minSizeHint();
    var maxHint = widget.maxSizeHint();

    var minWidth = Math.max(box.minWidth, Math.min(minHint.width, box.maxWidth));
    var minHeight = Math.max(box.minHeight, Math.min(minHint.height, box.maxHeight));

    var maxWidth = Infinity;
    var maxHeight = Infinity;
    var alignment = this._alignment;
    if ((alignment & Alignment.Horizontal_Mask) === 0) {
      maxWidth = Math.max(box.minWidth, Math.min(maxHint.width, box.maxWidth));
    }
    if ((alignment & Alignment.Vertical_Mask) === 0) {
      maxHeight = Math.max(box.minHeight, Math.min(maxHint.height, box.maxHeight));
    }

    this._minSize = new Size(minWidth, minHeight);
    this._maxSize = new Size(maxWidth, maxHeight);
  }

  private _widget: Widget;
  private _basis = -1;
  private _stretch = 0;
  private _expansive = false;
  private _alignment: Alignment = 0;
  private _minSize: Size = null;
  private _maxSize: Size = null;
}

} // module phosphor.widgets
