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
    this._m_array = array || null;
  }

  /**
   * The current value of the iterable.
   *
   * Returns `undefined` if there is no current value.
   */
  get current(): T {
    return this._m_current;
  }

  /**
   * Move the iterator to the next value.
   *
   * Returns true on success, false when the iterator is exhausted.
   */
  moveNext(): boolean {
    var array = this._m_array;
    if (array === null) {
      return false;
    }
    var index = this._m_index + 1;
    if (index >= array.length) {
      this._m_array = null;
      this._m_current = void 0;
      return false;
    }
    this._m_index = index;
    this._m_current = array[index];
    return true;
  }

  /**
   * Returns `this` to make the iterator iterable.
   */
  iterator(): IIterator<T> {
    return this;
  }

  private _m_array: T[];
  private _m_index = -1;
  private _m_current: T = void 0;
}

} // module phosphor.collections
