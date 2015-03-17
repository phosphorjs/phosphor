/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * An iterator for an array.
 */
export
class ArrayIterator<T> implements IIterator<T> {
  /**
   * Construct a new array iterator.
   */
  constructor(array: T[]) {
    this._m_array = array;
  }

  /**
   * Test whether the iterable has more elements.
   */
  hasNext(): boolean {
    return this._m_index < this._m_array.length;
  }

  /**
   * Get the next element in the iterable.
   *
   * Returns `undefined` when `hasNext` returns false.
   */
  next(): T {
    return this._m_array[this._m_index++];
  }

  private _m_index = 0;
  private _m_array: T[] = [];
}

} // module phosphor.collections
