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


export
class Geometry {

  constructor(panel: Panel) {
    this._panel = panel;
  }

  get panel(): Panel {
    return this._panel;
  }

  /**
   * Get the X position of the panel.
   */
  get x(): number {
    return this._x;
  }

  /**
   * Set the X position of the panel.
   */
  set x(x: number) {
    this.move(x, this._y);
  }

  /**
   * Get the Y position of the panel.
   */
  get y(): number {
    return this._y;
  }

  /**
   * Set the Y position of the panel.
   */
  set y(y: number) {
    this.move(this._x, y);
  }

  /**
   * Get the width of the panel.
   */
  get width(): number {
    return this._width;
  }

  /**
   * Set the width of the panel.
   */
  set width(width: number) {
    this.resize(width, this._height);
  }

  /**
   * Get the height of the panel.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Set the height of the panel.
   */
  set height(height: number) {
    this.resize(this._width, height);
  }

  /**
   * Get the position of the panel.
   */
  get pos(): Point {
    return new Point(this._x, this._y);
  }

  /**
   * Set the position of the panel.
   */
  set pos(pos: Point) {
    this.move(pos.x, pos.y);
  }

  /**
   * Get the size of the panel.
   */
  get size(): Size {
    return new Size(this._width, this._height);
  }

  /**
   * Set the size of the panel.
   */
  set size(size: Size) {
    this.resize(size.width, size.height);
  }

  /**
   * Get the geometry of the panel.
   */
  get geometry(): Rect {
    return new Rect(this._x, this._y, this._width, this._height);
  }

  /**
   * Set the geometry of the panel.
   */
  set geometry(geo: Rect) {
    this.setGeometry(geo.x, geo.y, geo.width, geo.height);
  }

  /**
   * Get the minimum width of the panel.
   */
  get minWidth(): number {
    return this._minWidth;
  }

  /**
   * Set the minimum width of the panel.
   */
  set minWidth(width: number) {
    this.setMinSize(width, this._minHeight);
  }

  /**
   * Get the minimum height of the panel.
   */
  get minHeight(): number {
    return this._minHeight;
  }

  /**
   * Set the minimum height of the panel.
   */
  set minHeight(height: number) {
    this.setMinSize(this._minWidth, height);
  }

  /**
   * Get the maximum width of the panel.
   */
  get maxWidth(): number {
    return this._maxWidth;
  }

  /**
   * Set the maximum width of the panel.
   */
  set maxWidth(width: number) {
    this.setMaxSize(width, this._maxHeight);
  }

  /**
   * Get the maximum height of the panel.
   */
  get maxHeight(): number {
    return this._maxHeight;
  }

  /**
   * Set the maxmimum height of the panel.
   */
  set maxHeight(height: number) {
    this.setMaxSize(this._maxWidth, height);
  }

  /**
   * Get the minimum size of the panel.
   */
  get minSize(): Size {
    return new Size(this._minWidth, this._minHeight);
  }

  /**
   * Set the minimum size of the panel.
   */
  set minSize(size: Size) {
    this.setMinSize(size.width, size.height);
  }

  /**
   * Get the maximum size of the panel.
   */
  get maxSize(): Size {
    return new Size(this._maxWidth, this._maxHeight);
  }

  /**
   * Set the maximum size of the panel.
   */
  set maxSize(size: Size) {
    this.setMaxSize(size.width, size.height);
  }

  /**
   * Get the horizontal stretch factor for the panel.
   */
  get horizontalStretch(): number {
    return this._stretch >> 16;
  }

  /**
   * Set the horizontal stretch factor for the panel.
   */
  set horizontalStretch(stretch: number) {
    this.setStretch(stretch, this.verticalStretch);
  }

  /**
   * Get the vertical stretch factor for the panel.
   */
  get verticalStretch(): number {
    return this._stretch & 0xFFFF;
  }

  /**
   * Set the vertical stretch factor for the panel.
   */
  set verticalStretch(stretch: number) {
    this.setStretch(this.horizontalStretch, stretch);
  }

  /**
   * Get the horizontal size policy for the panel.
   */
  get horizontalSizePolicy(): SizePolicy {
    return this._sizePolicy >> 16;
  }

  /**
   * Set the horizontal size policy for the panel.
   */
  set horizontalSizePolicy(policy: SizePolicy) {
    this.setSizePolicy(policy, this.verticalSizePolicy);
  }

  /**
   * Get the vertical size policy for the panel.
   */
  get verticalSizePolicy(): SizePolicy {
    return this._sizePolicy & 0xFFFF;
  }

  /**
   * Set the vertical size policy for the panel.
   */
  set verticalSizePolicy(policy: SizePolicy) {
    this.setSizePolicy(this.horizontalSizePolicy, policy);
  }

  /**
   * Get the alignment flags for the panel.
   */
  get alignment(): Alignment {
    return this._alignment;
  }

  /**
   * Set the alignment flags for the panel.
   */
  set alignment(align: Alignment) {
    if (align !== this._alignment) {
      this._alignment = align;
      this.updateGeometry();
    }
  }

  private _panel: Panel;
  private _x = 0;
  private _y = 0;
  private _width = 0;
  private _height = 0;
  private _minWidth = 0;
  private _minHeight = 0;
  private _maxWidth = 0;
  private _maxHeight = 0;
  private _stretch = 0;
  private _alignment: Alignment = 0;
  private _sizePolicy = defaultPolicy;
}

} // module phosphor.panels
