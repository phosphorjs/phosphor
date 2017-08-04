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

import {
  ISignal
} from '@phosphor/signaling';

import {
  IDBObject
} from './dbobject';


/**
 * A db object which holds an ordered collection of values.
 */
export
interface IDBList<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject, IIterable<T>, IRetroable<T> {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<this, IDBList.ChangedArgs<T>>;

  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'list';

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
   * The first value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly first: T | undefined;

  /**
   * The last value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly last: T | undefined;

  /**
   * Find the index of the first occurrence of a value in the list.
   *
   * @param value - The value to locate in the list. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the first occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  indexOf(value: T, start?: number, stop?: number): number;

  /**
   * Find the index of the last occurrence of a value in the list.
   *
   * @param value - The value to locate in the list. Values are
   *   compared using strict `===` equality.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the last occurrence of the value, or `-1`
   *   if the value is not found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  lastIndexOf(value: T, start?: number, stop?: number): number;

  /**
   * Find the index of the first value which matches a predicate.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the first matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `stop < start` the search will wrap at the end of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the list while searching.
   */
  findIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number;

  /**
   * Find the index of the last value which matches a predicate.
   *
   * @param fn - The predicate function to apply to the values.
   *
   * @param start - The index of the first element in the range to be
   *   searched, inclusive. The default value is `-1`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @param stop - The index of the last element in the range to be
   *   searched, inclusive. The default value is `0`. Negative values
   *   are taken as an offset from the end of the list.
   *
   * @returns The index of the last matching value, or `-1` if no
   *   matching value is found.
   *
   * #### Notes
   * If `start < stop` the search will wrap at the front of the list.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   *
   * Modifying the length of the list while searching.
   */
  findLastIndex(fn: (value: T, index: number) => boolean, start?: number, stop?: number): number;

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
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  get(index: number): T | undefined;

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
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  set(index: number, value: T): void;

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the list.
   *
   * #### Complexity
   * Constant.
   */
  push(value: T): void;

  /**
   * Insert a value into the list.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  insert(index: number, value: T): void;

  /**
   * Remove a value at a specific index in the list.
   *
   * @param index - The index of the value to remove. Negative values
   *   are taken as an offset from the end of the array.
   *
   * #### Complexity
   * Linear.
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
   * Linear.
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


/**
 * The namespace for the `IDBList` interface statics.
 */
export
namespace IDBList {
  /**
   * The type of the db list changed arguments.
   */
  export
  type ChangedArgs<T extends ReadonlyJSONValue = ReadonlyJSONValue> = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'list:changed';

    /**
     * The index of the modification.
     */
    readonly index: number;

    /**
     * The values that were removed from the given index.
     */
    readonly removed: ReadonlyArray<T>;

    /**
     * The values that were added at the given index.
     */
    readonly added: ReadonlyArray<T>;
  };
}
