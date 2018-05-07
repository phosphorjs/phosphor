/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';


/**
 * A data store object which holds a map of items.
 */
export
interface IMap<T extends ReadonlyJSONValue> extends IIterable<[string, T]> {
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
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator starting with the first key.
   *
   * #### Complexity
   * `O(1)`
   */
  keys(): IIterator<string>;

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
   * Test whether the map has a value for a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns `true` if the map has the given key, `false` otherwise.
   *
   * #### Complexity
   * `O(1)`
   */
  has(key: string): boolean;

  /**
   * Get the value for a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns The value for the specified key, or `undefined` if
   *   the map does not have a value for the key.
   *
   * #### Complexity
   * `O(1)`
   */
  get(key: string): T | undefined;

  /**
   * Assign new items to the map, replacing all current items.
   *
   * @param items - The items to assign to the map.
   *
   * #### Complexity
   * `O(n)`
   */
  assign(items: { readonly [key: string]: T } | IIterable<[string, T]>): void;

  /**
   * Update the map with multiple new items.
   *
   * @param items - The items to add to the map.
   *
   * #### Complexity
   * `O(n)`
   */
  update(items: { readonly [key: string]: T } | IIterable<[string, T]>): void;

  /**
   * Set the value for a given key.
   *
   * @param key - The key of interest.
   *
   * @param value - The value to set for the given key.
   *
   * #### Complexity
   * `O(1)`
   */
  set(key: string, value: T): void;

  /**
   * Delete an item from the map.
   *
   * @param key - The key of the item to delete.
   *
   * #### Notes
   * This method is a no-op if the key does not exist in the map.
   *
   * #### Complexity
   * `O(1)`
   */
  delete(key: string): void;

  /**
   * Clear the contents of the map.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void;
}
