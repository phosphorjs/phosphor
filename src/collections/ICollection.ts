/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A collection of elements with a definite size.
 */
export
interface ICollection<T> extends IIterable<T> {
  /**
   * True if the collection has elements, false otherwise.
   */
  empty: boolean;

  /**
   * The number of elements in the collection.
   */
  size: number;

  /**
   * Test whether the collection contains the given value.
   */
  contains(value: T): boolean;

  /**
   * Add a value to the collection.
   *
   * Returns true if the collection was changed, false otherwise.
   */
  add(value: T): boolean;

  /**
   * Remove a value from the collection.
   *
   * Returns true if the collection was changed, false otherwise.
   */
  remove(value: T): boolean;

  /**
   * Remove all elements from the collection.
   */
  clear(): void;
}

} // module phosphor.collections
