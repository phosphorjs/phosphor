/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export = Size;


/**
 * The size of a 2-dimensional object.
 */
class Size {
  /**
   * Construct a new size.
   */
  constructor(width: number, height: number) {
    this._m_width = width;
    this._m_height = height;
  }

  /**
   * The width of the size.
   */
  get width(): number {
    return this._m_width;
  }

  /**
   * The height of the size.
   */
  get height(): number {
    return this._m_height;
  }

  /**
   * Test whether the size is equivalent to another.
   */
  equals(other: Size): boolean {
    return this._m_width === other._m_width &&
           this._m_height === other._m_height;
  }

  private _m_width: number;
  private _m_height: number;
}
