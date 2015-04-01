/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

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


/**
 * The position and size of a 2-dimensional object.
 */
export
class Rect {
  /**
   * Construct a new rect.
   */
  constructor(x: number, y: number, width: number, height: number) {
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;
  }

  /**
   * The X coordinate of the rect.
   *
   * This is equivalent to `left`.
   */
  get x(): number {
    return this._x;
  }

  /**
   * The Y coordinate of the rect.
   *
   * This is equivalent to `top`.
   */
  get y(): number {
    return this._y;
  }

  /**
   * The width of the rect.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The height of the rect.
   */
  get height(): number {
    return this._height;
  }

  /**
   * The position of the rect.
   *
   * This is equivalent to `topLeft`.
   */
  get pos(): Point {
    return new Point(this._x, this._y);
  }

  /**
   * The size of the rect.
   */
  get size(): Size {
    return new Size(this._width, this._height);
  }

  /**
   * The top edge of the rect.
   *
   * This is equivalent to `y`.
   */
  get top(): number {
    return this._y;
  }

  /**
   * The left edge of the rect.
   *
   * This is equivalent to `x`.
   */
  get left(): number {
    return this._x;
  }

  /**
   * The right edge of the rect.
   *
   * This is equivalent to `x + width`.
   */
  get right(): number {
    return this._x + this._width;
  }

  /**
   * The bottom edge of the rect.
   *
   * This is equivalent to `y + height`.
   */
  get bottom(): number {
    return this._y + this._height;
  }

  /**
   * The position of the top left corner of the rect.
   *
   * This is equivalent to `pos`.
   */
  get topLeft(): Point {
    return new Point(this._x, this._y);
  }

  /**
   * The position of the top right corner of the rect.
   */
  get topRight(): Point {
    return new Point(this._x + this._width, this._y);
  }

  /**
   * The position bottom left corner of the rect.
   */
  get bottomLeft(): Point {
    return new Point(this._x, this._y + this._height);
  }

  /**
   * The position bottom right corner of the rect.
   */
  get bottomRight(): Point {
    return new Point(this._x + this._width, this._y + this._height);
  }

  /**
   * Test whether the rect is equivalent to another.
   */
  equals(other: Rect): boolean {
    return (
      this._x === other._x &&
      this._y === other._y &&
      this._width === other._width &&
      this._height === other._height
    );
  }

  private _x: number;
  private _y: number;
  private _width: number;
  private _height: number;
}

} // module phosphor.panels
