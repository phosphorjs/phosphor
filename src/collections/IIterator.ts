/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {


/**
 * An object which iterates over elements in an iterable.
 */
export
interface IIterator<T> {
  /**
   * Test whether the iterable has more elements.
   */
  hasNext(): boolean;

  /**
   * Get the next element in the iterable.
   *
   * Returns `undefined` when `hasNext` returns false.
   */
  next(): T;

  /**
   * Returns `this` so that the iterator is iterable.
   */
  iterator(): IIterator<T>;
}

} // module phosphor.collections
