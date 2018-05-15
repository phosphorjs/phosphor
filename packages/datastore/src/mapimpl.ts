/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, each, filter, iterKeys, map
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  DatastoreImpl
} from './datastoreimpl';

import {
  IMap
} from './map';


/**
 * The concrete implementation of the `IMap` data store object.
 *
 * #### Notes
 * This class is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
class MapImpl<T extends ReadonlyJSONValue> implements IMap<T> {
  /**
   *
   */
  constructor(store: DatastoreImpl, schemaId: string, recordId: string, fieldName: string, items: { readonly [key: string]: T }) {
    this._store = store;
    this._schemaId = schemaId;
    this._recordId = recordId;
    this._fieldName = fieldName;
  }

  /**
   * Whether the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * The size of the map.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._size;
  }

  /**
   * Create an iterator over the items in the map.
   *
   * @returns A new iterator over the map items.
   *
   * #### Complexity
   * `O(1)`
   */
  iter(): IIterator<[string, T]> {
    return map(this.keys(), k =>  k, this._map[k].value]);
  }

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator starting with the first key.
   *
   * #### Complexity
   * `O(1)`
   */
  keys(): IIterator<string> {
    return filter(iterKeys(this._map), k => this.has(k));
  }

  /**
   * Create an iterator over the values in the map.
   *
   * @returns A new iterator starting with the first value.
   *
   * #### Complexity
   * `O(1)`
   */
  values(): IIterator<T> {
    return map(this.keys(), k => this._map[k].value);
  }

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
  has(key: string): boolean {
    let entry = this._map[key];
    return !!entry && entry.value !== undefined;
  }

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
  get(key: string): T | undefined {
    let entry = this._map[key];
    return entry && entry.value;
  }

  /**
   * Assign new items to the map, replacing all current items.
   *
   * @param items - The items to assign to the map.
   *
   * #### Complexity
   * `O(n)`
   */
  assign(items: { readonly [key: string]: T } | IIterable<[string, T]>): void {
    this.clear();
    this.update(items);
  }

  /**
   * Update the map with multiple new items.
   *
   * @param items - The items to add to the map.
   *
   * #### Complexity
   * `O(n)`
   */
  update(items: { readonly [key: string]: T } | IIterable<[string, T]>): void {
    let it: IIterator<[string, T]>;
    if (typeof (items as any).iter === 'function') {
      it = (items as IIterable<[string, T]>).iter();
    } else {
      it = iterItems(items as { readonly [key: string]: T });
    }
    each(it, ([k, v]) => { this.set(k, v); });
  }

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
  set(key: string, value: T): void {
    // Guard against disallowed mutations.
    this._store.assertMutationsAllowed();

    // Fetch the map entry.
    let entry = this._map[key];

    // Bail early if there is no effective change.
    // TODO - do a deep compare here?
    if (entry && entry.value === value) {
      return;
    }


  }

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
  delete(key: string): void {
    // Guard against disallowed mutations.
    this._store.assertMutationsAllowed();

    // Fetch the current map entry.
    let entry = this._map[key] || null;

    // Add a deleted entry to the map.
    this._map[key] = {
      value: undefined,
      clock: this._store.clock,
      storeId: this._store.id,
      next: entry
    };

    // Broadcast the change to peers.
    this._store.broadcastMapDelete(
      this._schemaId, this._recordId, this._fieldName, key
    );

    //
    if (!entry || entry.value === undefined) {
      return;
    }

    // Notify the user of the change.
    this._store.notifyMapDelete(
      this._schemaId, this._recordId, this._fieldName, key, entry.value
    );
  }

  /**
   * Clear the contents of the map.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void {
    each(iterKeys(this._map), k => { this.delete(k); });
  }

  private _schemaId: string;
  private _recordId: string;
  private _fieldName: string;
  private _store: DatastoreImpl;
  private _map: { [key: string]: Private.IMapEntry<T> } = Object.create(null);
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which represents an entry in a map.
   */
  export
  interface IMapEntry<T extends ReadonlyJSONValue> {
    /**
     * The value for the entry.
     */
    readonly value: T | undefined;

    /**
     * The clock value when the entry was created.
     */
    readonly clock: number;

    /**
     * The id of the datastore which created the entry.
     */
    readonly storeId: number;

    /**
     * The next map entry in the list.
     */
    next: IMapEntry<T> | null;
  }
}
