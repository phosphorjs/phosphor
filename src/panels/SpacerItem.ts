/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

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
  constructor(
    width: number,
    height: number,
    hPolicy: SizePolicy,
    vPolicy: SizePolicy) {
    this.setSize(width, height, hPolicy, vPolicy);
  }

  /**
   * Test whether the item manages a panel.
   */
  get isPanel(): boolean {
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
   * The panel the item manages, if any.
   */
  get panel(): Panel {
    return null;
  }

  /**
   * Test whether the item should be expanded horizontally.
   */
  get expandHorizontal(): boolean {
    var hPolicy = this._sizePolicy >> 4;
    return (hPolicy & SizePolicy.ExpandFlag) !== 0;
  }

  /**
   * Test Whether the item should be expanded vertically.
   */
  get expandVertical(): boolean {
    var vPolicy = this._sizePolicy & 0xF;
    return (vPolicy & SizePolicy.ExpandFlag) !== 0;
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
  setSize(
    width: number,
    height: number,
    hPolicy: SizePolicy,
    vPolicy: SizePolicy): void {
    var w = Math.max(0, width);
    var h = Math.max(0, height);
    this._size = new Size(w, h);
    this._sizePolicy = (hPolicy << 4) | vPolicy;
  }

  /**
   * Transpose the effective orientation of the spacer item.
   */
  transpose(): void {
    var size = this._size;
    var hPolicy = this._sizePolicy >> 4;
    var vPolicy = this._sizePolicy & 0xF;
    this._size = new Size(size.height, size.width);
    this._sizePolicy = (vPolicy << 4) | hPolicy;
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
    var hPolicy = this._sizePolicy >> 4;
    var vPolicy = this._sizePolicy & 0xF;
    var w = hPolicy & SizePolicy.ShrinkFlag ? 0 : size.width;
    var h = vPolicy & SizePolicy.ShrinkFlag ? 0 : size.height;
    return new Size(w, h);
  }

  /**
   * Compute the maximum size of the item.
   */
  maxSize(): Size {
    var size = this._size;
    var hPolicy = this._sizePolicy >> 4;
    var vPolicy = this._sizePolicy & 0xF;
    var w = hPolicy & SizePolicy.GrowFlag ? Infinity : size.width;
    var h = vPolicy & SizePolicy.GrowFlag ? Infinity : size.height;
    return new Size(w, h);
  }

  /**
   * Set the geometry of the item.
   */
  setGeometry(x: number, y: number, width: number, height: number): void { }

  private _size: Size;
  private _sizePolicy: SizePolicy;
}

} // module phosphor.panels
