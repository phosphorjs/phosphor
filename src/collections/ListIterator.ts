/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert and Phosphor Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * An iterator for a generic list.
 */
export
class ListIterator<T> implements IIterator<T> {
  /**
   * Construct a new list iterator.
   */
  constructor(list: IList<T>) {
    this._list = list || null;
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
    if (this._list === null) {
      return false;
    }
    if (this._index < this._list.size) {
      this._current = this._list.get(this._index++);
      return true;
    }
    this._list = null;
    this._current = void 0;
    return false;
  }

  /**
   * Returns `this` to make the iterator iterable.
   */
  iterator(): IIterator<T> {
    return this;
  }

  private _list: IList<T>;
  private _index: number;
  private _current: T = void 0;
}


/**
 * A reverse iterator for a generic list.
 */
export
class ListReverseIterator<T> implements IIterator<T> {
  /**
   * Construct a new list reverse iterator.
   */
  constructor(list: IList<T>) {
    this._list = list || null;
    this._index = list ? list.size - 1 : -1;
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
    if (this._list === null) {
      return false;
    }
    if (this._index >= 0 && this._index < this._list.size) {
      this._current = this._list.get(this._index--);
      return true;
    }
    this._list = null;
    this._current = void 0;
    return false;
  }

  /**
   * Returns `this` to make the iterator iterable.
   */
  iterator(): IIterator<T> {
    return this;
  }

  private _list: IList<T>;
  private _index: number;
  private _current: T = void 0;
}

} // module phosphor.collections
