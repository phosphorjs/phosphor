/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

import Alignment = enums.Alignment;
import SizePolicy = enums.SizePolicy;

import Size = geometry.Size;

import Widget = widgets.Widget;


/**
 * A concrete implementation of ILayoutItem which manages empty space.
 *
 * User code will not typically create instances of this class directly.
 */
export
class SpacerItem implements ILayoutItem {
  /**
   * Construct a new spacer item.
   */
  constructor(width: number, height: number, hPolicy: SizePolicy, vPolicy: SizePolicy) {
    this.setSize(width, height, hPolicy, vPolicy);
  }

  /**
   * Test whether the item manages a widget.
   */
  get isWidget(): boolean {
    return false;
  }

  /**
   * Test whether the item manages empty space.
   */
  get isSpacer(): boolean {
    return true;
  }

  /**
   * Test whether the item should be treated as hidden.
   */
  get isHidden(): boolean {
    return false;
  }

  /**
   * The widget the item manages, if any.
   */
  get widget(): Widget {
    return null;
  }

  /**
   * Test whether the item should be expanded horizontally.
   */
  get expandHorizontal(): boolean {
    return (this._hPolicy & SizePolicy.ExpandFlag) !== 0;
  }

  /**
   * Test Whether the item should be expanded vertically.
   */
  get expandVertical(): boolean {
    return (this._vPolicy & SizePolicy.ExpandFlag) !== 0;
  }

  /**
   * The alignment of the item in its layout cell.
   */
  get alignment(): Alignment {
    return 0;
  }

  /**
   * Change the size of the spacer item.
   *
   * The owner layout must be invalidated to reflect the change.
   */
  setSize(width: number, height: number, hPolicy: SizePolicy, vPolicy: SizePolicy): void {
    var w = Math.max(0, width);
    var h = Math.max(0, height);
    this._size = new Size(w, h);
    this._hPolicy = hPolicy;
    this._vPolicy = vPolicy;
  }

  /**
   * Transpose the effective orientation of the spacer item.
   */
  transpose(): void {
    var size = this._size;
    var hPolicy = this._hPolicy;
    var vPolicy = this._vPolicy;
    this._size = new Size(size.height, size.width);
    this._vPolicy = hPolicy;
    this._hPolicy = vPolicy;
  }

  /**
   * Invalidate the cached data for the item.
   */
  invalidate(): void { }

  /**
   * Compute the preferred size of the item.
   */
  sizeHint(): Size {
    return this._size;
  }

  /**
   * Compute the minimum size of the item.
   */
  minSize(): Size {
    var size = this._size;
    var w = this._hPolicy & SizePolicy.ShrinkFlag ? 0 : size.width;
    var h = this._vPolicy & SizePolicy.ShrinkFlag ? 0 : size.height;
    return new Size(w, h);
  }

  /**
   * Compute the maximum size of the item.
   */
  maxSize(): Size {
    var size = this._size;
    var w = this._hPolicy & SizePolicy.GrowFlag ? Infinity : size.width;
    var h = this._vPolicy & SizePolicy.GrowFlag ? Infinity : size.height;
    return new Size(w, h);
  }

  /**
   * Set the geometry of the item.
   */
  setGeometry(x: number, y: number, width: number, height: number): void { }

  private _size: Size;
  private _hPolicy: SizePolicy;
  private _vPolicy: SizePolicy;
}

} // module phosphor.layout
