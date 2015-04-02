/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * The size of a 2-dimensional object.
 */
export
class Size {
  /**
   * A static zero size.
   */
  static Zero = new Size(0, 0);

  /**
   * A static infinite size.
   */
  static Infinite = new Size(Infinity, Infinity);

  /**
   * Construct a new size.
   */
  constructor(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  /**
   * The width of the size.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The height of the size.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Test whether the size is equivalent to another.
   */
  equals(other: Size): boolean {
    return this._width === other._width && this._height === other._height;
  }

  private _width: number;
  private _height: number;
}

} // module phosphor.utility
