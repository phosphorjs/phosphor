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

import {
  ISignal
} from '@phosphor/signaling';

import {
  IDBObject
} from './dbobject';


/**
 * A db object which maps string keys to values.
 */
export
interface IDBMap<T extends ReadonlyJSONValue = ReadonlyJSONValue> extends IDBObject, IIterable<[string, T]> {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<this, IDBMap.ChangedArgs<T>>;

  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'map';

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
   * @returns The value for the key or `undefined` if the key is not
   *   present in the map.
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
   * @param value - The value to set for the given key. A value of
   *   `undefined` will remove the key from the map.
   *
   * #### Complexity
   * Constant.
   */
  set(key: string, value: T | undefined): void;

  /**
   * Update several values in the map.
   *
   * @param items - The `{ key: value }` pairs to update in the map.
   *   A value of `undefined` will remove a key from the map.
   *
   * #### Complexity
   * Linear.
   */
  update(items: { [key: string]: T | undefined }): void;

  /**
   * Delete an item or items from the map.
   *
   * @param key - The key(s) of the item(s) to delete from the map.
   *
   * #### Complexity
   * Linear on # of deleted items.
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


/**
 * The namespace for the `IDBMap` interface statics.
 */
export
namespace IDBMap {
  /**
   * The type of the db map changed arguments.
   */
  export
  type ChangedArgs<T extends ReadonlyJSONValue = ReadonlyJSONValue> = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'map:changed';

    /**
     * The items that were removed from the map.
     */
    readonly removed: { readonly [key: string]: T };

    /**
     * The items that were added to the map.
     */
    readonly added: { readonly [key: string]: T };
  };
}
