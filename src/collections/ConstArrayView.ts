/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export = ConstArrayView;


/**
 * A class which provides a read-only view into an array.
 */
class ConstArrayView<T> {
  /**
   * Construct a new const array view.
   */
  constructor(array: T[]) {
    this._m_array = array;
  }

  /**
   * The length of the array.
   */
  get length(): number {
    return this._m_array.length;
  }

  /**
   * Get the value at the given index.
   */
  at(index: number): T {
    return this._m_array[index];
  }

  /**
   * Find the index of the given value.
   */
  indexOf(value: T): number {
    return this._m_array.indexOf(value);
  }

  /**
   * Create a new array from an optional subrange of the array.
   */
  slice(begin?: number, end?: number): T[] {
    return this._m_array.slice(begin, end);
  }

  /**
   * Invoke a callback for each element in the array.
   */
  forEach(callback: (value: T, index: number) => void): void {
    this._m_array.forEach((v, i) => callback(v, i));
  }

  /**
   * Test whether every value passes the given test.
   */
  every(callback: (value: T, index: number) => boolean): boolean {
    return this._m_array.every((v, i) => callback(v, i));
  }

  /**
   * Test whether some value passes the given test.
   */
  some(callback: (value: T, index: number) => boolean): boolean {
    return this._m_array.some((v, i) => callback(v, i));
  }

  /**
   * Filter the values in the array according to the given test.
   */
  filter(callback: (value: T, index: number) => boolean): T[] {
    return this._m_array.filter((v, i) => callback(v, i));
  }

  /**
   * Map a function across the values in the array.
   */
  map<U>(callback: (value: T, index: number) => U): U[] {
    return this._m_array.map((v, i) => callback(v, i));
  }

  private _m_array: T[];
}
