/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IIterator = require('./IIterator');
import IList = require('./IList');

export = ListIterator;


/**
 * An iterator for a generic list collection.
 */
class ListIterator<T> implements IIterator<T> {
  /**
   * Construct a new list iterator.
   */
  constructor(list: IList<T>) {
    this._m_list = list;
  }

  /**
   * Test whether the iterable has more elements.
   */
  hasNext(): boolean {
    return this._m_index < this._m_list.size;
  }

  /**
   * Get the next element in the iterable.
   *
   * Returns `undefined` when `hasNext` returns false.
   */
  next(): T {
    return this._m_list.get(this._m_index++);
  }

  private _m_index = 0;
  private _m_list: IList<T>;
}
