/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.geometry {

/**
 * The position and size of a 2-dimensional object.
 */
export
class Rect {
  /**
   * Construct a new rect.
   */
  constructor(x: number, y: number, width: number, height: number) {
    this._m_x = x;
    this._m_y = y;
    this._m_width = width;
    this._m_height = height;
  }

  /**
   * The X coordinate of the rect.
   *
   * This is equivalent to `left`.
   */
  get x(): number {
    return this._m_x;
  }

  /**
   * The Y coordinate of the rect.
   *
   * This is equivalent to `top`.
   */
  get y(): number {
    return this._m_y;
  }

  /**
   * The width of the rect.
   */
  get width(): number {
    return this._m_width;
  }

  /**
   * The height of the rect.
   */
  get height(): number {
    return this._m_height;
  }

  /**
   * The position of the rect.
   *
   * This is equivalent to `topLeft`.
   */
  get pos(): Point {
    return new Point(this._m_x, this._m_y);
  }

  /**
   * The size of the rect.
   */
  get size(): Size {
    return new Size(this._m_width, this._m_height);
  }

  /**
   * The top edge of the rect.
   *
   * This is equivalent to `y`.
   */
  get top(): number {
    return this._m_y;
  }

  /**
   * The left edge of the rect.
   *
   * This is equivalent to `x`.
   */
  get left(): number {
    return this._m_x;
  }

  /**
   * The right edge of the rect.
   *
   * This is equivalent to `x + width`.
   */
  get right(): number {
    return this._m_x + this._m_width;
  }

  /**
   * The bottom edge of the rect.
   *
   * This is equivalent to `y + height`.
   */
  get bottom(): number {
    return this._m_y + this._m_height;
  }

  /**
   * The position of the top left corner of the rect.
   *
   * This is equivalent to `pos`.
   */
  get topLeft(): Point {
    return new Point(this._m_x, this._m_y);
  }

  /**
   * The position of the top right corner of the rect.
   */
  get topRight(): Point {
    return new Point(this._m_x + this._m_width, this._m_y);
  }

  /**
   * The position bottom left corner of the rect.
   */
  get bottomLeft(): Point {
    return new Point(this._m_x, this._m_y + this._m_height);
  }

  /**
   * The position bottom right corner of the rect.
   */
  get bottomRight(): Point {
    return new Point(this._m_x + this._m_width, this._m_y + this._m_height);
  }

  /**
   * Test whether the rect is equivalent to another.
   */
  equals(other: Rect): boolean {
    return this._m_x === other._m_x &&
           this._m_y === other._m_y &&
           this._m_width === other._m_width &&
           this._m_height === other._m_height;
  }

  private _m_x: number;
  private _m_y: number;
  private _m_width: number;
  private _m_height: number;
}

} // module phosphor.geometry
