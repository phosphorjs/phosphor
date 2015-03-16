/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.geometry {


/**
 * The position of a two dimensional object.
 */
export
class Point {
  /**
   * Construct a new point.
   */
  constructor(x: number, y: number) {
    this._m_x = x;
    this._m_y = y;
  }

  /**
   * The X coordinate of the point.
   */
  get x(): number {
    return this._m_x;
  }

  /**
   * The Y coordinate of the point.
   */
  get y(): number {
    return this._m_y;
  }

  /**
   * Test whether the point is equivalent to another.
   */
  equals(other: Point): boolean {
    return this._m_x === other._m_x && this._m_y === other._m_y;
  }

  private _m_x: number;
  private _m_y: number;
}

} // module phosphor.geometry
