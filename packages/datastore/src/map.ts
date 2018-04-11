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
 * A data store object which holds an ordered map of items.
 */
export
interface IMap<T extends ReadonlyJSONValue> extends IIterable<[string, T]>, IRetroable<[string, T]> {
  /**
   * Whether the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly isEmpty: boolean;

  /**
   * The size of the map.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly size: number;

  /**
   * The first item in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly first: [string, T] | undefined;

  /**
   * The last item in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly last: [string, T] | undefined;

  /**
   * The first key in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly firstKey: string | undefined;

  /**
   * The last key in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly lastKey: string | undefined;

  /**
   * The first value in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly firstValue: T | undefined;

  /**
   * The last value in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly lastValue: T | undefined;

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator starting with the first key.
   *
   * #### Complexity
   * `O(1)`
   */
  keys(): IIterator<string>;

  /**
   * Create a reverse iterator over the keys in the map.
   *
   * @returns A new iterator starting with the last key.
   *
   * #### Complexity
   * `O(1)`
   */
  retroKeys(): IIterator<string>;

  /**
   * Create an iterator over the values in the map.
   *
   * @returns A new iterator starting with the first value.
   *
   * #### Complexity
   * `O(1)`
   */
  values(): IIterator<T>;

  /**
   * Create a reverse iterator over the values in the map.
   *
   * @returns A new iterator starting with the last value.
   *
   * #### Complexity
   * `O(1)`
   */
  retroValues(): IIterator<T>;

  /**
   * Create an iterator for a slice of items in the map.
   *
   * @param start - The index of the first item, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the map. The default is `0`.
   *
   * @param stop - The index of the last item, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the map. The default is `size`.
   *
   * @returns A new iterator starting with the specified item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  slice(start?: number, stop?: number): IIterator<[string, T]>;

  /**
   * Create a reverse iterator for a slice of items in the map.
   *
   * @param start - The index of the first item, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the map. The default is `size - 1`.
   *
   * @param stop - The index of the last item, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the map. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  retroSlice(start?: number, stop?: number): IIterator<[string, T]>;

  /**
   * Create an iterator for a slice of keys in the map.
   *
   * @param start - The index of the first key, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the map. The default is `0`.
   *
   * @param stop - The index of the last key, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the map. The default is `size`.
   *
   * @returns A new iterator starting with the specified key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  sliceKeys(start?: number, stop?: number): IIterator<string>;

  /**
   * Create a reverse iterator for a slice of keys in the map.
   *
   * @param start - The index of the first key, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the map. The default is `size - 1`.
   *
   * @param stop - The index of the last key, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the map. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  retroSliceKeys(start?: number, stop?: number): IIterator<string>;

  /**
   * Create an iterator for a slice of values in the map.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the map. The default is `0`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the map. The default is `size`.
   *
   * @returns A new iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  sliceValues(start?: number, stop?: number): IIterator<T>;

  /**
   * Create a reverse iterator for a slice of values in the map.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the map. The default is `size - 1`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the map. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  retroSliceValues(start?: number, stop?: number): IIterator<T>;

  /**
   * Get the item at a particular index.
   *
   * @param index - The index of the item of interest. Negative
   *   values are taken as an offset from the end of the map.
   *
   * @returns The item at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  at(index: number): [string, T] | undefined;

  /**
   * Get the key at a particular index.
   *
   * @param index - The index of the key of interest. Negative
   *   values are taken as an offset from the end of the map.
   *
   * @returns The key at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  keyAt(index: number): T | undefined;

  /**
   * Get the value at a particular index.
   *
   * @param index - The index of the value of interest. Negative
   *   values are taken as an offset from the end of the map.
   *
   * @returns The value at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  valueAt(index: number): T | undefined;

  /**
   * Test whether the map has a value for a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns `true` if the map has the given key, `false` otherwise.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  has(key: string): boolean;

  /**
   * Get the index of a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns The index of the specified key. A negative value means
   *   that the key does not currently exist in the map, but if the
   *   key were inserted it would reside at the index `-index - 1`.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  indexOf(key: string): number;

  /**
   * Get the value for a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns The value for the specified key, or `undefined` if
   *   the map does not have a value for the key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  get(key: string): T | undefined;

  /**
   * Assign new items to the map, replacing all current items.
   *
   * @param items - The items to assign to the map.
   *
   * #### Complexity
   * `O(n log32 n)`
   */
  assign(items: IterableOrArrayLike<[string, T]> | { readonly [key: string]: T }): void;

  /**
   * Update the map with multiple new items.
   *
   * @param items - The items to add to the map.
   *
   * #### Complexity
   * `O(k log32 n)`
   */
  update(items: IterableOrArrayLike<[string, T]> | { readonly [key: string]: T }): void;

  /**
   * Set the value for a given key.
   *
   * @param key - The key of interest.
   *
   * @param value - The value to set for the given key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  set(key: string, value: T): void;

  /**
   * Set the value at a particular index.
   *
   * @param index - The index of the item of interest. Negative
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
  setAt(index: number, value: T): void;

  /**
   * Delete an item from the map.
   *
   * @param key - The key of the item to delete.
   *
   * #### Notes
   * This method is a no-op if the key does not exist in the map.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  delete(key: string): void;

  /**
   * Remove an item at a particular index.
   *
   * @param index - The index of the item to remove. Negative
   *   values are taken as an offset from the end of the map.
   *
   * #### Notes
   * This method is a no-op if the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  remove(index: number): void;

  /**
   * Clear the contents of the map.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void;
}
