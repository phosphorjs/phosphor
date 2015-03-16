/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import Size = require('../geometry/Size');

import Alignment = require('./Alignment');
import ILayoutItem = require('./ILayoutItem');
import SizePolicy = require('./SizePolicy');
import Widget = require('./Widget');

export = WidgetItem;


/**
 * A concrete implementation of ILayoutItem which manages a widget.
 *
 * User code will not typically create instances of this class directly.
 */
class WidgetItem implements ILayoutItem {
  /**
   * Construct a new widget item.
   */
  constructor(widget: Widget, alignment: Alignment = 0) {
    this._m_widget = widget;
    this._m_alignment = alignment;
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
    return this._m_widget.isHidden;
  }

  /**
   * The widget the item manages, if any.
   */
  get widget(): Widget {
    return this._m_widget;
  }

  /**
   * Test whether the item should be expanded horizontally.
   */
  get expandHorizontal(): boolean {
    if (this._m_alignment & Alignment.H_Mask) {
      return false;
    }
    if (this._m_widget.horizontalSizePolicy & SizePolicy.ExpandFlag) {
      return true;
    }
    return false;
  }

  /**
   * Test Whether the item should be expanded vertically.
   */
  get expandVertical(): boolean {
    if (this._m_alignment & Alignment.V_Mask) {
      return false;
    }
    if (this._m_widget.verticalSizePolicy & SizePolicy.ExpandFlag) {
      return true;
    }
    return false;
  }

  /**
   * Get the alignment of the item in its layout cell.
   */
  get alignment(): Alignment {
    return this._m_alignment;
  }

  /**
   * Set the alignment of the item in its layout cell.
   */
  set alignment(alignment: Alignment) {
    this._m_alignment = alignment;
  }

  /**
   * Invalidate the cached data for the item.
   */
  invalidate(): void {
    this._m_origHint = null;
    this._m_sizeHint = null;
    this._m_minSize = null;
    this._m_maxSize = null;
  }

  /**
   * Compute the preferred size of the item.
   */
  sizeHint(): Size {
    if (this._m_sizeHint === null) {
      this._updateSizes();
    }
    return this._m_sizeHint;
  }

  /**
   * Compute the minimum size of the item.
   */
  minSize(): Size {
    if (this._m_minSize === null) {
      this._updateSizes();
    }
    return this._m_minSize;
  }

  /**
   * Compute the maximum size of the item.
   */
  maxSize(): Size {
    if (this._m_maxSize === null) {
      this._updateSizes();
    }
    return this._m_maxSize;
  }

  /**
   * Set the geometry of the item.
   */
  setGeometry(x: number, y: number, width: number, height: number): void {
    var widget = this._m_widget;
    if (widget.isHidden) {
      return;
    }
    var w = width;
    var h = height;
    var alignment = this._m_alignment;
    if (alignment & Alignment.H_Mask) {
      var igW = widget.horizontalSizePolicy === SizePolicy.Ignored;
      w = Math.min(w, igW ? this._m_origHint.width : this._m_sizeHint.width);
    }
    if (alignment & Alignment.V_Mask) {
      var igH = widget.verticalSizePolicy === SizePolicy.Ignored;
      h = Math.min(h, igH ? this._m_origHint.height : this._m_sizeHint.height);
    }
    var minSize = this._m_minSize;
    var maxSize = this._m_maxSize;
    var w = Math.max(minSize.width, Math.min(w, maxSize.width));
    var h = Math.max(minSize.height, Math.min(h, maxSize.height));
    if (alignment & Alignment.Right) {
      x += width - w;
    } else if (alignment & Alignment.HCenter) {
      x += (width - w) / 2;
    }
    if (alignment & Alignment.Bottom) {
      y += height - h;
    } else if (alignment & Alignment.VCenter) {
      y += (height - h) / 2;
    }
    widget.setGeometry(x, y, w, h);
  }

  /**
   * Update the computed sizes for the widget item.
   */
  private _updateSizes(): void {
    var widget = this._m_widget;
    if (widget.isHidden) {
      var zero = new Size(0, 0);
      this._m_origHint = zero;
      this._m_sizeHint = zero;
      this._m_minSize = zero;
      this._m_maxSize = zero;
      return;
    }
    var min = widget.minSize;
    var max = widget.maxSize;
    var sHint = widget.sizeHint();
    var mHint = widget.minSizeHint();
    var xHint = widget.maxSizeHint();
    var vsp = widget.verticalSizePolicy;
    var hsp = widget.horizontalSizePolicy;
    var al = this._m_alignment;
    this._m_origHint = sHint;
    this._m_sizeHint = makeSizeHint(sHint, mHint, min, max, hsp, vsp);
    this._m_minSize = makeMinSize(sHint, mHint, min, max, hsp, vsp);
    this._m_maxSize = makeMaxSize(sHint, mHint, xHint, min, max, hsp, vsp, al);
  }

  private _m_widget: Widget;
  private _m_alignment: Alignment;
  private _m_origHint: Size = null;
  private _m_sizeHint: Size = null;
  private _m_minSize: Size = null;
  private _m_maxSize: Size = null;
}


/**
 * Make the effective size hint for the given sizing values.
 */
function makeSizeHint(
    sizeHint: Size,
    minHint: Size,
    minSize: Size,
    maxSize: Size,
    hPolicy: SizePolicy,
    vPolicy: SizePolicy): Size {
  var w = 0;
  var h = 0;
  if (hPolicy !== SizePolicy.Ignored) {
    w = Math.max(minHint.width, sizeHint.width);
  }
  if (vPolicy !== SizePolicy.Ignored) {
    h = Math.max(minHint.height, sizeHint.height);
  }
  w = Math.max(minSize.width, Math.min(w, maxSize.width));
  h = Math.max(minSize.height, Math.min(h, maxSize.height));
  return new Size(w, h);
}


/**
 * Make the effective minimum size for the given sizing values.
 */
function makeMinSize(
    sizeHint: Size,
    minHint: Size,
    minSize: Size,
    maxSize: Size,
    hPolicy: SizePolicy,
    vPolicy: SizePolicy): Size {
  var w = 0;
  var h = 0;
  if (hPolicy !== SizePolicy.Ignored) {
    if (hPolicy & SizePolicy.ShrinkFlag) {
      w = minHint.width;
    } else {
      w = Math.max(minHint.width, sizeHint.width);
    }
  }
  if (vPolicy !== SizePolicy.Ignored) {
    if (vPolicy & SizePolicy.ShrinkFlag) {
      h = minHint.height;
    } else {
      h = Math.max(minHint.height, sizeHint.height);
    }
  }
  w = Math.max(minSize.width, Math.min(w, maxSize.width));
  h = Math.max(minSize.height, Math.min(h, maxSize.height));
  return new Size(w, h);
}


/**
 * Make the effective maximum size for the given sizing values.
 */
function makeMaxSize(
    sizeHint: Size,
    minHint: Size,
    maxHint: Size,
    minSize: Size,
    maxSize: Size,
    hPolicy: SizePolicy,
    vPolicy: SizePolicy,
    alignment: Alignment): Size {
  var w = Infinity;
  var h = Infinity;
  if ((alignment & Alignment.H_Mask) === 0) {
    if (hPolicy !== SizePolicy.Ignored) {
      if (hPolicy & SizePolicy.GrowFlag) {
        w = Math.max(minHint.width, maxHint.width);
      } else {
        w = Math.max(minHint.width, sizeHint.width);
      }
    }
    w = Math.max(minSize.width, Math.min(w, maxSize.width));
  }
  if ((alignment & Alignment.V_Mask) === 0) {
    if (vPolicy !== SizePolicy.Ignored) {
      if (vPolicy & SizePolicy.GrowFlag) {
        h = Math.max(minHint.height, maxHint.height);
      } else {
        h = Math.max(minHint.height, sizeHint.height);
      }
    }
    h = Math.max(minSize.height, Math.min(h, maxSize.height));
  }
  return new Size(w, h);
}
