/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {


/**
 * A read only view of a list.
 */
export
class ReadOnlyList<T> extends ReadOnlyCollection<T> implements IList<T> {
  /**
   * Construct a new read only list.
   */
  constructor(list: IList<T>) { super(list); }

  /**
   * Get the index of the given value.
   *
   * Returns -1 if the value is not in the list.
   */
  indexOf(value: T): number {
    return (<IList<T>>this._m_collection).indexOf(value);
  }

  /**
   * Get the value at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  get(index: number): T {
    return (<IList<T>>this._m_collection).get(index);
  }

  /**
   * Set the value at the given index.
   *
   * This method always throws.
   */
  set(index: number, value: T): boolean {
    throw new Error('list is read only');
  }

  /**
   * Insert a value at the given index.
   *
   * This method always throws.
   */
  insert(index: number, value: T): boolean {
    throw new Error('list is read only');
  }

  /**
   * Remove and return the value at the given index.
   *
   * This method always throws.
   */
  removeAt(index: number): T {
    throw new Error('list is read only');
  }
}

} // module phosphor.collections
