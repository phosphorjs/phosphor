/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import ICollection = require('./ICollection');

export = IList;


/**
 * A collection of items which can be accessed by index.
 */
interface IList<T> extends ICollection<T> {
  /**
   * Get the value at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  at(index: number): T;

  /**
   * Get the index of the given value.
   *
   * Returns -1 if the value is not in the list.
   */
  indexOf(value: T): number;

  /**
   * Set the value at the given index.
   *
   * Returns true if the value was set, false otherwise.
   */
  set(index: number, value: T): boolean;

  /**
   * Add a value to the end of the list.
   *
   * Returns the new index of the value.
   */
  add(value: T): number;

  /**
   * Insert a value at the given index.
   *
   * An out of range index will be clamped.
   *
   * Returns the new index of the value.
   */
  insert(index: number, value: T): number;

  /**
   * Remove the first matching value from the list.
   *
   * Returns the index of the removed value, or -1.
   */
  remove(value: T): number;

  /**
   * Remove and return the value at the given index.
   *
   * Returns `undefined` if no matching value is found.
   */
  removeAt(index: number): T;
}
