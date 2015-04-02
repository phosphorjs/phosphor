/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * The position of a two dimensional object.
 */
export
class Point {
  /**
   * A static zero point.
   */
  static Zero = new Point(0, 0);

  /**
   * A static infinite point.
   */
  static Infinite = new Point(Infinity, Infinity);

  /**
   * Construct a new point.
   */
  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  /**
   * The X coordinate of the point.
   */
  get x(): number {
    return this._x;
  }

  /**
   * The Y coordinate of the point.
   */
  get y(): number {
    return this._y;
  }

  /**
   * Test whether the point is equivalent to another.
   */
  equals(other: Point): boolean {
    return this._x === other._x && this._y === other._y;
  }

  private _x: number;
  private _y: number;
}

} // module phosphor.utility
