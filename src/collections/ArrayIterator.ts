/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * An iterator for a generic array.
 */
export
class ArrayIterator<T> implements IIterator<T> {
  /**
   * Construct a new array iterator.
   */
  constructor(array: T[]) {
    this._array = array || null;
    this._index = 0;
  }

  /**
   * The current value of the iterable.
   *
   * Returns `undefined` if there is no current value.
   */
  get current(): T {
    return this._current;
  }

  /**
   * Move the iterator to the next value.
   *
   * Returns true on success, false when the iterator is exhausted.
   */
  moveNext(): boolean {
    if (this._array === null) {
      return false;
    }
    if (this._index < this._array.length) {
      this._current = this._array[this._index++];
      return true;
    }
    this._array = null;
    this._current = void 0;
    return false;
  }

  /**
   * Returns `this` to make the iterator iterable.
   */
  iterator(): IIterator<T> {
    return this;
  }

  private _array: T[];
  private _index: number;
  private _current: T = void 0;
}


/**
 * A reverse iterator for a generic array.
 */
export
class ArrayReverseIterator<T> implements IIterator<T> {
  /**
   * Construct a new array reverse iterator.
   */
  constructor(array: T[]) {
    this._array = array || null;
    this._index = array ? array.length - 1 : -1;
  }

  /**
   * The current value of the iterable.
   *
   * Returns `undefined` if there is no current value.
   */
  get current(): T {
    return this._current;
  }

  /**
   * Move the iterator to the next value.
   *
   * Returns true on success, false when the iterator is exhausted.
   */
  moveNext(): boolean {
    if (this._array === null) {
      return false;
    }
    if (this._index >= 0 && this._index < this._array.length) {
      this._current = this._array[this._index--];
      return true;
    }
    this._array = null;
    this._current = void 0;
    return false;
  }

  /**
   * Returns `this` to make the iterator iterable.
   */
  iterator(): IIterator<T> {
    return this;
  }

  private _array: T[];
  private _index: number;
  private _current: T = void 0;
}

} // module phosphor.collections
