/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * An object which supports iteration over its elements.
 *
 * In general, it is not safe to modify the iterable while iterating.
 */
export
interface IIterable<T> {
  /**
   * Get an iterator for the elements in the iterable.
   */
  iterator(): IIterator<T>;
}

} // module phosphor.collections
