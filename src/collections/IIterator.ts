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
 *
 * The `moveNext` method must be called after creating the iterator to
 * advance it to the first element or `current` will return `undefined`.
 */
export
interface IIterator<T> extends IIterable<T> {
  /**
   * The current value of the iterable.
   *
   * Returns `undefined` if there is no current value.
   */
  current: T;

  /**
   * Move the iterator to the next value.
   *
   * Returns true on success, false when the iterator is exhausted.
   */
  moveNext(): boolean;
}

} // module phosphor.collections
