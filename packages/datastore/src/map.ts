/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, each, filter, iterKeys, map
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  Record
} from './record';


/**
 * A data store object which holds a map of items.
 */
export
class Map<T extends ReadonlyJSONValue = ReadonlyJSONValue> implements IIterable<[string, T]> {
  /**
   * @internal
   *
   * Create a new data store map.
   *
   * @param parent - The parent record object.
   *
   * @param name - The name of the map.
   *
   * @returns A new data store map.
   *
   * #### Notes
   * This method is an internal implementation detail.
   */
  static create<U extends ReadonlyJSONValue = ReadonlyJSONValue>(parent: Record, name: string): Map<U> {
    return new Map<U>(parent, name);
  }

  /**
   * The parent of the map.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly parent: Record;

  /**
   * The name of the map.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly name: string;

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
    return map(this.keys(), k => [k, this._map[k].value] as [string, T]);
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
    return filter(iterKeys(this._map), k => this._map[k].value !== undefined);
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
   * `O(log32 n)`
   */
  has(key: string): boolean {
    let head = this._map[key];
    return head !== undefined && head.value !== undefined;
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
    let head = this._map[key];
    return head !== undefined ? head.value : undefined;
  }

  /**
   * Assign new items to the map, replacing all current items.
   *
   * @param items - The items to assign to the map.
   *
   * #### Complexity
   * `O(n)`
   */
  assign(items: { readonly [key: string]: T }): void {
    this.update({ ...Private.makeClearItems(this._map), ...items });
  }

  /**
   * Update the map with multiple new items.
   *
   * @param items - The items to add to the map. An item with a value
   *   of `undefined` will cause the item to be removed from the map.
   *
   * #### Complexity
   * `O(n)`
   */
  update(items: { readonly [key: string]: T | undefined }): void {
    // // Fetch the relevant ancestors
    // let table = this.parent.$parent;
    // let store = table.parent;

    // // Fetch the clock and store id.
    // let clock = store.clock;
    // let storeId = store.id;

    // // Fetch the schema field for the map.
    // let field = table.schema.fields[this.fieldName];

    // // Apply the mutation to the map.
    // store.withMapMutation(this, (previous, current) => {
    //   // Loop over the given items.
    //   for (let key in items) {
    //     // Fetch the value for the current key.
    //     let value = items[key];

    //     // Fetch the entry for the current key.
    //     let entry = this._entries.get(key) || null;

    //     // Determine the next entry in the chain.
    //     let next = field.undoable ? entry : null;

    //     // Replace the current entry if it's during the same mutation.
    //     next = (next && next.clock === clock) ? next.next : next;

    //     // Create the new entry for the key.
    //     this._entries.set(key, { value, clock, storeId, next });

    //     // Update the items map as appropriate.
    //     if (value === undefined) {
    //       this._items.delete(key);
    //     } else {
    //       this._items.set(key, value);
    //     }

    //     // Record the previous value if this is the first time the
    //     // item has been modified during the current transaction.
    //     if (!(key in previous)) {
    //       previous[key] = entry ? entry.value : undefined;
    //     }

    //     // Record the current value each time the item is modified
    //     // during the transaction.
    //     current[key] = value;
    //   }
    // });
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
    this.update({ [key]: value });
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
    this.update(Private.makeClearItems(this._map));
  }

  /**
   * Construct a new data store map.
   *
   * @param parent - The parent record object.
   *
   * @param name - The name of the map.
   */
  private constructor(parent: Record, name: string) {
    this.parent = parent;
    this.name = name;
  }

  private _size = 0;
  private _map: Private.ItemMap<T> = Object.create(null);
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which represents an entry in a map.
   */
  export
  interface IMapLink<T extends ReadonlyJSONValue> {
    /**
     * The value for the entry.
     */
    readonly value: T | undefined;

    /**
     * The data store version when the entry was created.
     */
    readonly version: number;

    /**
     * The id of the data store which created the entry.
     */
    readonly storeId: number;

    /**
     * The next entry in the list.
     */
    next: IMapLink<T> | null;
  }

  /**
   * A type alias for an item map.
   */
  export
  type ItemMap<T extends ReadonlyJSONValue> = { [key: string]: IMapLink<T> };

  /**
   * Create an object to clear the contents of a map.
   *
   * @param object - The map object of interest.
   *
   * @returns An object which will clear the map.
   */
  export
  function makeClearItems(map: ItemMap<any>): { [key: string]: undefined } {
    let result: { [key: string]: undefined } = {};
    for (let key in map) { result[key] = undefined; }
    return result;
  }
}
