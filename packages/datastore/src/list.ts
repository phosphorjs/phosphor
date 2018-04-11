/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike
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
   * The globally unique identifier for the list.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly id: string;

  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly isEmpty: boolean;

  /**
   * The size of the list.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly size: number;

  /**
   * The first value in the list.
   *
   * This is `undefined` if the list is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly first: T | undefined;

  /**
   * The last value in the list.
   *
   * This is `undefined` if the list is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly last: T | undefined;

  /**
   * Create an iterator for a slice of values in the list.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the list. The default is `0`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the list. The default is `size`.
   *
   * @returns A new iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  slice(start?: number, stop?: number): IIterator<T>;

  /**
   * Create a reverse iterator for a slice of values in the list.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the list. The default is `size - 1`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the list. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  retroSlice(start?: number, stop?: number): IIterator<T>;

  /**
   * Get the value at a particular index.
   *
   * @param index - The index of the value of interest. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @returns The value at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  at(index: number): T | undefined;

  /**
   * Assign new values to the list, replacing all current values.
   *
   * @param values - The values to assign to the list.
   *
   * #### Complexity
   * `O(n)`
   */
  assign(values: IterableOrArrayLike<T>): void;

  /**
   * Set the value at a particular index.
   *
   * @param index - The index of the value of interest. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Notes
   * This method is a no-op if the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  set(index: number, value: T): void;

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the end of the list.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  push(value: T): void;

  /**
   * Remove and return the value at the end of the list.
   *
   * @returns The value at the end of the list, or `undefined`
   *   if the list is empty.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  pop(): T | undefined;

  /**
   * Remove and return the value at the front of the list.
   *
   * @returns The value at the front of the list, or `undefined`
   *   if the list is empty.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  shift(): T | undefined;

  /**
   * Add a value to the front of the list.
   *
   * @param value - The value to add to the front of the list.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  unshift(value: T): void;

  /**
   * Insert a value into the list.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @param value - The value to insert at the specified index.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  insert(index: number, value: T): void;

  /**
   * Remove a value at a particular index.
   *
   * @param index - The index of the value to remove. Negative
   *   values are taken as an offset from the end of the list.
   *
   * #### Notes
   * This method is a no-op if the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  remove(index: number): void;

  /**
   * Remove and/or insert multiple values from/into the list.
   *
   * @param index - The index of the splice. Negative values are taken
   *   as an offset from the end of the list.
   *
   * @param count - The number of values to remove from the list.
   *
   * @param values - The values to insert into the list.
   *
   * #### Complexity
   * `O(k log32 n)`
   */
  splice(index: number, count: number, values?: IterableOrArrayLike<T>): void;

  /**
   * Clear the contents of the list.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void;
}
