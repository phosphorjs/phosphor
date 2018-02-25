/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';


/**
 * A data store object which maps keys to values.
 */
export
interface IMap<T extends ReadonlyJSONValue> extends IIterable<[string, T]> {
  /**
   * Whether the map is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The size of the map.
   *
   * #### Complexity
   * Constant.
   */
  readonly size: number;

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator over the keys in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  keys(): IIterator<string>;

  /**
   * Create an iterator over the values in the map.
   *
   * @returns A new iterator over the values in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  values(): IIterator<T>;

  /**
   * Test whether the map has a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns `true` if the map has the given key, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   */
  has(key: string): boolean;

  /**
   * Get the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @returns The key value or `undefined` if the key is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(key: string): T | undefined;

  /**
   * Set the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @param value - The value to set for the given key.
   *
   * #### Complexity
   * Constant.
   */
  set(key: string, value: T): void;

  /**
   * Assign new items to the map, replacing all current items.
   *
   * @param items - The items to add to the list.
   *
   * #### Complexity
   * Linear.
   */
  assign(items: { readonly [key: string]: T }): void;

  /**
   * Update the map with additional items.
   *
   * @param items - The items to add to the map.
   *
   * #### Complexity
   * Linear.
   */
  update(items: { readonly [key: string]: T }): void;

  /**
   * Delete one or more items from the map.
   *
   * @param key - The key(s) of the item(s) to delete from the map.
   *
   * #### Complexity
   * Constant.
   */
  delete(key: string | IterableOrArrayLike<string>): void;

  /**
   * Clear all items from the map.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}
