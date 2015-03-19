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
    this._m_list = list;
  }

  /**
   * The current value of the iterable.
   *
   * Returns `undefined` if there is no current value.
   */
  get current(): T {
    return this._m_list.get(this._m_index);
  }

  /**
   * Move the iterator to the next value.
   *
   * Returns true on success, false when the iterator is exhausted.
   */
  moveNext(): boolean {
    return ++this._m_index < this._m_list.size;
  }

  /**
   * Returns `this` to make the iterator iterable.
   */
  iterator(): IIterator<T> {
    return this;
  }

  private _m_index = -1;
  private _m_list: IList<T>;
}

} // module phosphor.collections
