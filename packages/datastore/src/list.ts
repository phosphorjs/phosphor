/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IRetroable, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';


/**
 * A data store object which holds a sequence of values.
 */
export
interface IList<T extends ReadonlyJSONValue> extends IIterable<T>, IRetroable<T> {
  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the list.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * Get the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @returns The value at the specified index or `undefined` if the
   *   index is out of range.
   *
   * #### Complexity
   *
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  at(index: number): T | undefined;

  /**
   * Get an array for a portion of the list.
   *
   * @param start - The index of the first element to slice, inclusive.
   *   The default value is `0`. Negative values are taken as an offset
   *   from the end of the list.
   *
   * @param stop - The index of the last element to slice, exclusive.
   *   The default value is `list.length`. Negative values are taken
   *   as an offset from the end of the list.
   *
   * @returns A new array for the specified portion of the list.
   *
   * #### Notes
   * If `start > stop`, the values will be in reverse order.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  slice(start?: number, stop?: number): T[];

  /**
   * Set the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Notes
   * This method is a no-op if `index` is out of range.
   *
   * #### Complexity
   *
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  set(index: number, value: T): void;

  /**
   * Assign new values to the list, replacing all current values.
   *
   * @param values - The values to assign to the list.
   *
   * #### Complexity
   * Linear.
   */
  assign(values: IterableOrArrayLike<T>): void;

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the list.
   *
   * #### Complexity
   *
   */
  push(value: T): void;

  /**
   * Insert a value into the list.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @param value - The value to insert at the specified index.
   *
   * #### Complexity
   *
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  insert(index: number, value: T): void;

  /**
   * Remove a value from the list.
   *
   * @param index - The index of the value to remove. Negative
   *   values are taken as an offset from the end of the list.
   *
   * #### Notes
   * This method is a no-op if `index` is out of range.
   *
   * #### Complexity
   *
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  remove(index: number): void;

  /**
   * Replace a range of values in the list.
   *
   * @param index - The index of the first element to be removed.
   *   Negative values are taken as an offset from the end of the list.
   *
   * @param count - The number of elements to remove.
   *
   * @param values - The values to insert at the specified index.
   *
   * #### Complexity
   *
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, values?: IterableOrArrayLike<T>): void;

  /**
   * Clear all values from the list.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}
