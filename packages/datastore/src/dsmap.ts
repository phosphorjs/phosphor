/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, each, iterItems
} from '@phosphor/algorithm';

import {
  TreeMap
} from '@phosphor/collections';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  DSHandler
} from './dshandler';

import {
  IMap
} from './map';


/**
 * A CRDT map for the datastore.
 *
 * #### Notes
 * This class is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
class DSMap<T extends ReadonlyJSONValue = ReadonlyJSONValue> implements IMap<T> {
  /**
   * Construct a new datastore map.
   *
   * @param handler - The datastore handler object.
   *
   * @param schemaId - The id of the containing table.
   *
   * @param recordId - The id of the containing record.
   *
   * @param fieldName - The name of the containing field.
   */
  constructor(handler: DSHandler, schemaId: string, recordId: string, fieldName: string) {
    this._handler = handler;
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
    return this._map.isEmpty;
  }

  /**
   * The size of the map.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._map.size;
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
    return this._map.iter();
  }

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator over the keys in the map.
   *
   * #### Complexity
   * `O(1)`
   */
  keys(): IIterator<string> {
    return this._map.keys();
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
    return this._map.values();
  }

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
  has(key: string): boolean {
    return this._map.has(key);
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
   * `O(log32 n)`
   */
  get(key: string): T | undefined {
    return this._map.get(key);
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
   * @param value - The value to set for the given key, or `undefined`
   *   to delete the item from the map.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  set(key: string, value: T | undefined): void {
    // Guard against disallowed mutations.
    this._handler.assertMutationsAllowed();

    // Bail early if deleting a non-existent item.
    if (value === undefined && !this._map.has(key)) {
      return;
    }

    // Fetch the current map entry.
    let entry = this._entries.get(key) || null;

    // Fetch the clock and store id.
    let clock = this._handler.clock;
    let storeId = this._handler.storeId;

    // Fetch the schema field.
    let table = this._handler.getTable(this._schemaId);
    let field = table.schema.fields[this._fieldName];

    // Create the new entry as appropriate.
    if (!field.undoable) {
      this._entries.set(key, { value, clock, storeId, next: null });
    } else if (entry && entry.clock === clock && entry.storeId === storeId) {
      this._entries.set(key, { value, clock, storeId, next: entry.next });
    } else {
      this._entries.set(key, { value, clock, storeId, next: entry });
    }

    // Update the item as appropriate.
    if (value === undefined) {
      this._map.delete(key);
    } else {
      this._map.set(key, value);
    }

    // Fetch the previous value.
    let previous = entry ? entry.value : undefined;

    // Broadcast the change to peers.
    this._handler.broadcastMapChange(
      this._schemaId, this._recordId, this._fieldName, key, value
    );

    // Notify the user of the change.
    this._handler.notifyMapChange(
      this._schemaId, this._recordId, this._fieldName, key, previous, value
    );
  }

  /**
   * Delete an item from the map.
   *
   * @param key - The key of the item to delete.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  delete(key: string): void {
    this.set(key, undefined);
  }

  /**
   * Clear the contents of the map.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void {
    each(this.keys(), k => { this.delete(k); });
  }

  private _schemaId: string;
  private _recordId: string;
  private _fieldName: string;
  private _handler: DSHandler;
  private _map = new TreeMap<string, T>(Private.strCmp);
  private _entries = new TreeMap<string, Private.IEntry<T>>(Private.strCmp);
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A three-way string comparison function.
   */
  export
  function strCmp(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /**
   * An object which represents an entry in a map.
   */
  export
  interface IEntry<T extends ReadonlyJSONValue> {
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
     * The next entry in the list.
     */
    next: IEntry<T> | null;
  }
}
