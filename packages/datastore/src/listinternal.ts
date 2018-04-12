/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, IterableOrArrayLike, iterItems, once, toArray, toObject
} from '@phosphor/algorithm';

import {
  TreeMap
} from '@phosphor/collections';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  CRDTUtils
} from './crdtutils';

import {
  DataStoreInternal
} from './datastoreinternal';

import {
  IList
} from './list'


/**
 * The concrete implementation of the `IList` data store object.
 *
 * #### Notes
 * This class is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
class ListInternal<T extends ReadonlyJSONValue> implements IList<T> {
  /**
   * Create a new internal list.
   *
   * @param store - The internal data store which owns the list.
   *
   * @param id - The globally unique identifier for the list.
   *
   * @param snapshot - The initial internal snapshot for the list.
   *
   * @returns A new internal list with the given initial state.
   */
  static create<U extends ReadonlyJSONValue>(store: DataStoreInternal, id: string, snapshot: DataStoreInternal.ListSnapshot<U>): ListInternal<U> {
    let list = new ListInternal<U>(store, id);
    list._map.update(iterItems(snapshot));
    return list;
  }

  /**
   * Get an internal snapshot of the current list state.
   *
   * @param list - The internal list of interest.
   *
   * @returns A new internal snapshot of the list state.
   */
  static snapshot<U extends ReadonlyJSONValue>(list: ListInternal<U>): DataStoreInternal.ListSnapshot<U> {
    return toObject(list._map);
  }

  /**
   * Apply a broadcasted change to an internal list.
   *
   * @param list - The internal list to modify.
   *
   * @param change - The broadcasted change to apply to the list.
   */
  static update<U extends ReadonlyJSONValue>(list: ListInternal<U>, change: DataStoreInternal.BroadcastListChange<U>): void {
    // TODO
  }

  /**
   * The globally unique identifier for the list.
   *
   * #### Complexity
   * `O(1)`
   */
  get id(): string {
    return this._id;
  }

  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get isEmpty(): boolean {
    return this._map.isEmpty;
  }

  /**
   * The size of the list.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._map.size;
  }

  /**
   * The first value in the list.
   *
   * This is `undefined` if the list is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get first(): T | undefined {
    return this._map.firstValue;
  }

  /**
   * The last value in the list.
   *
   * This is `undefined` if the list is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get last(): T | undefined {
    return this._map.lastValue;
  }

  /**
   * Create an iterator over the values in the list.
   *
   * @returns A new iterator starting with the first value.
   *
   * #### Complexity
   * `O(1)`
   */
  iter(): IIterator<T> {
    return this._map.values();
  }

  /**
   * Create a reverse iterator over the values in the list.
   *
   * @returns A new iterator starting with the last value.
   *
   * #### Complexity
   * `O(1)`
   */
  retro(): IIterator<T> {
    return this._map.retroValues();
  }

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
  slice(start?: number, stop?: number): IIterator<T> {
    return this._map.sliceValues(start, stop);
  }

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
  retroSlice(start?: number, stop?: number): IIterator<T> {
    return this._map.retroSliceValues(start, stop);
  }

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
  at(index: number): T | undefined {
    return this._map.valueAt(index);
  }

  /**
   * Assign new values to the list, replacing all current values.
   *
   * @param values - The values to assign to the list.
   *
   * #### Complexity
   * `O(n)`
   */
  assign(values: IterableOrArrayLike<T>): void {
    this.splice(0, this.size, values);
  }

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
  set(index: number, value: T): void {
    this.splice(index, 1, once(value));
  }

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the end of the list.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  push(value: T): void {
    this.insert(this.size, value);
  }

  /**
   * Remove and return the value at the end of the list.
   *
   * @returns The value at the end of the list, or `undefined`
   *   if the list is empty.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  pop(): T | undefined {
    let value = this.at(-1);
    this.remove(-1);
    return value;
  }

  /**
   * Remove and return the value at the front of the list.
   *
   * @returns The value at the front of the list, or `undefined`
   *   if the list is empty.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  shift(): T | undefined {
    let value = this.at(0);
    this.remove(0);
    return value;
  }

  /**
   * Add a value to the front of the list.
   *
   * @param value - The value to add to the front of the list.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  unshift(value: T): void {
    this.insert(0, value);
  }

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
  insert(index: number, value: T): void {
    this.splice(index, 0, once(value));
  }

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
  remove(index: number): void {
    this.splice(index, 1);
  }

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
  splice(index: number, count: number, values?: IterableOrArrayLike<T>): void {
    // Guard against disallowed mutations.
    this._store.mutationGuard();

    // Wrap and clamp the index.
    if (index < 0) {
      index = Math.max(0, index + this.size);
    } else {
      index = Math.min(index, this.size);
    }

    // Clamp the remove count.
    count = Math.max(0, Math.min(count, this.size - index));

    // Collect the array of values to be removed.
    let remArr = toArray(this.slice(index, index + count));

    // Collect the array of values to be inserted.
    let insArr = values ? toArray(values) : [];

    // Set up the map to hold the removed id:value pairs.
    let remMap: { [key: string]: T } = {};

    // Set up the map to hold the inserted id:value pairs.
    let insMap: { [key: string]: T } = {};

    // Remove the specified values from the internal map.
    for (let i = 0; i < count; ++i) {
      let id = this._map.keyAt(index)!;
      this._map.remove(index);
      remMap[id] = remArr[i];
    }

    // Setup the parameters for the id generation.
    let n = insArr.length;
    let site = this._store.site;
    let clock = this._store.tick();
    let lower = index === 0 ? undefined : this._map.keyAt(index - 1);
    let upper = index === this.size ? undefined : this._map.keyAt(index);

    // Create the identifier generator.
    let idIterator = CRDTUtils.createIds({ n, site, clock, lower, upper });

    // Insert the values into the internal map.
    for (let i = 0; i < n; ++i) {
      let id = idIterator.next()!;
      this._map.set(id, insArr[i]);
      insMap[id] = insArr[i];
    }

    // Register the user change for the list.
    this._store.registerUserListChange(this._id, index, remArr, insArr);

    // Register the broadcast change for the list.
    this._store.registerBroadcastListChange(this._id, remMap, insMap);
  }

  /**
   * Clear the contents of the list.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void {
    this.splice(0, this.size);
  }

  /**
   * Construct a new internal list.
   *
   * @param store - The internal data store which owns the list.
   *
   * @param id - The globally unique id of the list.
   */
  private constructor(store: DataStoreInternal, id: string) {
    this._store = store;
    this._id = id;
  }

  private _id: string;
  private _store: DataStoreInternal;
  private _map = new TreeMap<string, T>(CRDTUtils.compareIds);
}
