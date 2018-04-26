/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, IterableOrArrayLike, each, empty, iter, iterItems, once, toObject
} from '@phosphor/algorithm';

import {
  TreeMap
} from '@phosphor/collections';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  DatastoreInternal
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
   * @param path - The path of the list in the data store.
   *
   * @param snapshot - The initial internal snapshot for the list.
   *
   * @returns A new internal list with the given initial state.
   */
  static create<U extends ReadonlyJSONValue>(store: DatastoreInternal, path: string, snapshot: DatastoreInternal.IListSnapshot<U>): ListInternal<U> {
    let list = new ListInternal<U>(store, path);
    list._map.update(iterItems(snapshot.values));
    list._clock = snapshot.clock;
    return list;
  }

  /**
   * Get an internal snapshot of the current list state.
   *
   * @param list - The internal list of interest.
   *
   * @returns A new internal snapshot of the list state.
   */
  static snapshot<U extends ReadonlyJSONValue>(list: ListInternal<U>): DatastoreInternal.IListSnapshot<U> {
    return { clock: list._clock, values: toObject(list._map) };
  }

  /**
   * Apply a broadcasted update to an internal list.
   *
   * @param list - The internal list to modify.
   *
   * @param update - The update to apply to the list.
   */
  static apply<U extends ReadonlyJSONValue>(list: ListInternal<U>, update: DatastoreInternal.IListUpdate<U>): void {
    // Fast-forward the list clock if necessary.
    list._clock = Math.max(list._clock, update.clock);

    // Remove the specified values.
    ListInternal._removeItems(list, update.removed);

    // Insert the specified values.
    ListInternal._insertItems(list, update.inserted);
  }

  /**
   *
   */
  static undo<U extends ReadonlyJSONValue>(list: ListInternal<U>, update: DatastoreInternal.IListUpdate<U>): void {
    // Remove the specified values.
    ListInternal._removeItems(list, update.inserted);

    // Insert the specified values.
    ListInternal._insertItems(list, update.removed);
  }

  /**
   *
   */
  static redo<U extends ReadonlyJSONValue>(list: ListInternal<U>, update: DatastoreInternal.IListUpdate<U>): void {
    // Remove the specified values.
    ListInternal._removeItems(list, update.removed);

    // Insert the specified values.
    ListInternal._insertItems(list, update.inserted);
  }

  /**
   * The path of the list in the datastore.
   *
   * #### Notes
   * The path has the form: `'<schemaId>/<recordId>/<fieldName>'`.
   *
   * #### Complexity
   * `O(1)`
   */
  get path(): string {
    return this._path;
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
    // Wrap negative indices.
    if (index < 0) {
      index += this.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this.size) {
      return;
    }

    // Set the value at the specified index.
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
    // Wrap negative indices.
    if (index < 0) {
      index += this.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this.size) {
      return;
    }

    // Remove the value at the specified index.
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
    this._store.assertMutationsAllowed();

    // Wrap and clamp the index.
    if (index < 0) {
      index = Math.max(0, index + this._map.size);
    } else {
      index = Math.min(index, this._map.size);
    }

    // Clamp the remove count.
    count = Math.max(0, Math.min(count, this._map.size - index));

    // Remove the specified values.
    while (count-- > 0) {
      // Get the id and value at the specified index.
      let [id, value] = this._map.at(index)!;

      // Remove the item at the specified index.
      this._map.remove(index);

      // Register the broadcast change.
      this._store.registerBroadcastListRemove(this._path, id, value);

      // Register the user change.
      this._store.registerUserListRemove(this._path, index, value);
    }

    // Cast the insert values to an iterator.
    let it = values ? iter(values) : empty<T>();

    // Set up the variable to hold the iterator value.
    let value: T | undefined;

    // Fetch the lower boundary identifier.
    let lower = this._map.keyAt(index - 1) || '';

    // Fetch the upper boundary identifier.
    let upper = this._map.keyAt(index) || '';

    // Add the specified values.
    while ((value = it.next()) !== undefined) {
      // Create an identifier between the boundaries.
      let id = Private.createId(lower, upper, ++this._clock, this._store.id);

      // Insert the value into the map.
      this._map.set(id, value);

      // Register the broadcast change.
      this._store.registerBroadcastListInsert(this._path, id, value);

      // Register the user change.
      this._store.registerUserListInsert(this._path, index, value);

      // Increment the insertion index.
      index++;

      // Update the lower boundary identifier.
      lower = id;
    }
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
   * @param path - The path of the list in the datastore.
   */
  private constructor(store: DatastoreInternal, path: string) {
    this._store = store;
    this._path = path;
  }

  /**
   *
   */
  private static _removeItems<U extends ReadonlyJSONValue>(list: ListInternal<U>, items: { readonly [id: string]: U }): void {
    // Iterate over the items.
    each(iterItems(items), ([id, value]) => {
      // Fetch the index of the id.
      let index = list._map.indexOf(id);

      // If the id does not exist, increment its tombstone count.
      if (index < 0) {
        let tombstones = list._cemetery.get(id);
        list._cemetery.set(id, tombstones + 1);
        return;
      }

      // Remove the item from the map.
      list._map.remove(index);

      // Register the user change.
      list._store.registerUserListRemove(list._path, index, value);
    });
  }

  /**
   *
   */
  private static _insertItems<U extends ReadonlyJSONValue>(list: ListInternal<U>, items: { readonly [id: string]: U }): void {
    // Iterate over the items.
    each(iterItems(items), ([id, value]) => {
      // If the id is in the cemetery, decrement its tombstone count.
      let tombstones = list._cemetery.get(id);
      if (tombstones > 0) {
        list._cemetery.set(id, tombstones - 1);
        return;
      }

      // Fetch the insert index of the id.
      let index = list._map.indexOf(id);

      // Bail early if the id already exists.
      if (index >= 0) {
        return;
      }

      // Add the item to the map.
      list._map.set(id, value);

      // Register the user change.
      list._store.registerUserListInsert(list._path, -index - 1, value);
    });
  }

  private _clock = 0;
  private _path: string;
  private _store: DatastoreInternal;
  private _cemetery = new Private.Cemetery();
  private _map = new TreeMap<string, T>(Private.compareIds);
}


/**
 * The namespace for the module implementation details.
 */
export
namespace Private {
  /**
   *
   */
  export
  class Cemetery {
    /**
     *
     */
    assign(data: { readonly [id: string]: number }): void {
      this._data = { ...data };
    }

    /**
     *
     */
    get(id: string): number {
      return this._data[id] || 0;
    }

    /**
     *
     */
    set(id: string, degree: number): void {
      if (degree === 0) {
        delete this._data[id];
      } else {
        this._data[id] = degree;
      }
    }

    private _data: { [id: string]: number } = {};
  }

  /**
   * Perform a three-way comparison for identifiers.
   *
   * @param a - The first identifier of interest.
   *
   * @param b - The second identifier of interest.
   *
   * @returns `-1` if `a < b`, `1` if `a > b`, or `0` if `a == b`.
   */
  export
  function compareIds(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /**
   * Create an identifier between two boundary identifiers.
   *
   * @param lower - The lower boundary identifier, exclusive, or an
   *   empty string if there is no lower boundary.
   *
   * @param upper - The upper boundary identifier, exclusive, or an
   *   empty string if there is no upper boundary.
   *
   * @param clock - The clock value for the identifier. This must
   *   be `0 <= clock <= MAX_CLOCK`.
   *
   * @param store - The datastore id for the identifier. This must
   *   be `0 <= store <= DatastoreInternal.MAX_STORE_ID`.
   *
   * @returns An identifier which sorts between the given boundaries.
   *
   * #### Undefined Behavior
   * A `lower` or `upper` boundary identifier which is malformed or
   * which is badly ordered.
   *
   * A `clock` or `store` which exceeds the allowed maximums.
   */
  export
  function createId(lower: string, upper: string, clock: number, store: number): string {
    // Set up the array to hold the numeric id.
    let id: number[] = [];

    // Fetch the triplet counts of the ids.
    let lowerCount = lower ? idTripletCount(lower) : 0;
    let upperCount = upper ? idTripletCount(upper) : 0;

    // Iterate over the id triplets.
    for (let i = 0, n = Math.max(lowerCount, upperCount); i < n; ++i) {
      // Fetch the lower identifier triplet, padding as needed.
      let lp: number;
      let lc: number;
      let ls: number;
      if (lowerCount === 0) {
        lp = 0;
        lc = 0;
        ls = 0;
      } else if (i < lowerCount) {
        lp = idPathAt(lower, i);
        lc = idClockAt(lower, i);
        ls = idStoreAt(lower, i);
      } else {
        lp = 0;
        lc = 0;
        ls = 0;
      }

      // Fetch the upper identifier triplet, padding as needed.
      let up: number;
      let uc: number;
      let us: number;
      if (upperCount === 0) {
        up = MAX_PATH;
        uc = MAX_CLOCK;
        us = MAX_STORE;
      } else if (i < upperCount) {
        up = idPathAt(upper, i);
        uc = idClockAt(upper, i);
        us = idStoreAt(upper, i);
      } else {
        up = 0;
        uc = 0;
        us = 0;
      }

      // If the triplets are the same, copy the triplet and continue.
      if (lp === up && lc === uc && ls === us) {
        idPushTriplet(id, lp, lc, ls);
        continue;
      }

      // If the triplets are different, the well-ordered identifiers
      // assumption means that the lower triplet compares less than
      // the upper triplet. The task now is to find the nearest free
      // path slot among the remaining triplets.

      // If there is free space between the path portions of the
      // triplets, select a new path which falls between them.
      if (up - lp > 1) {
        let np = randomPath(lp + 1, up - 1);
        idPushTriplet(id, np, clock, store);
        return String.fromCharCode(...id);
      }

      // Otherwise, copy the left triplet and reset the upper count
      // to zero so that the loop chooses the nearest available path
      // slot after the current lower triplet.
      idPushTriplet(id, lp, lc, ls);
      upperCount = 0;
    }

    // If this point is reached, the lower and upper identifiers share
    // the same path but diverge based on the clock or store id. It is
    // safe to insert anywhere after the lower path.
    let np = randomPath(1, MAX_PATH);
    idPushTriplet(id, np, clock, store);
    return String.fromCharCode(...id);
  }

  /**
   * The maximum allowed path value in an identifier.
   */
  const MAX_PATH = 0xFFFFFFFFFFFF;

  /**
   * The maximum allowed clock value in an identifier.
   */
  const MAX_CLOCK = 0xFFFFFFFFFFFF;

  /**
   * The maximum allowed store id in an identifier.
   */
  const MAX_STORE = 0xFFFFFFFF;

  /**
   * Get the total number of path triplets in an identifier.
   *
   * @param id - The identifier of interest.
   *
   * @returns The total number of triplets in the id.
   */
  function idTripletCount(id: string): number {
    return id.length >> 3;
  }

  /**
   * Get the path value for a particular triplet.
   *
   * @param id - The string id of interest.
   *
   * @param i - The index of the triplet.
   *
   * @returns The path value for the specified triplet.
   */
  function idPathAt(id: string, i: number): number {
    let j = i << 3;
    let a = id.charCodeAt(j + 0);
    let b = id.charCodeAt(j + 1);
    let c = id.charCodeAt(j + 2);
    return a * 0x100000000 + b * 0x10000 + c;
  }

  /**
   * Get the clock value for a particular triplet.
   *
   * @param id - The identifier of interest.
   *
   * @param i - The index of the triplet.
   *
   * @returns The clock value for the specified triplet.
   */
  function idClockAt(id: string, i: number): number {
    let j = i << 3;
    let a = id.charCodeAt(j + 3);
    let b = id.charCodeAt(j + 4);
    let c = id.charCodeAt(j + 5);
    return a * 0x100000000 + b * 0x10000 + c;
  }

  /**
   * Get the store id for a particular triplet.
   *
   * @param id - The identifier of interest.
   *
   * @param i - The index of the triplet.
   *
   * @returns The store id for the specified triplet.
   */
  function idStoreAt(id: string, i: number): number {
    let j = i << 3;
    let a = id.charCodeAt(j + 6);
    let b = id.charCodeAt(j + 7);
    return a * 0x10000 + b;
  }

  /**
   * Push a triplet onto the end of a numeric identifier.
   *
   * @param id - The numeric identifier of interest.
   *
   * @param path - The path value to push.
   *
   * @param clock - The clock value to push.
   *
   * @param store - The store id to push.
   */
  function idPushTriplet(id: number[], path: number, clock: number, store: number): void {
    // Split the path into 16-bit values.
    let pathC = path & 0xFFFF;
    let pathB = (((path - pathC) / 0x10000) | 0) & 0xFFFF;
    let pathA = (((path - pathB - pathC) / 0x100000000) | 0) & 0xFFFF;

    // Split the clock into 16-bit values.
    let clockC = clock & 0xFFFF;
    let clockB = (((clock - clockC) / 0x10000) | 0) & 0xFFFF;
    let clockA = (((clock - clockB - clockC) / 0x100000000) | 0) & 0xFFFF;

    // Split the store id into 16-bit values.
    let storeB = store & 0xFFFF;
    let storeA = (((store - storeB) / 0x10000) | 0) & 0xFFFF;

    // Push the parts onto the id.
    id.push(pathA, pathB, pathC, clockA, clockB, clockC, storeA, storeB);
  }

  /**
   * Pick a path in the leading bucket of an inclusive range.
   *
   * @param min - The minimum allowed path, inclusive.
   *
   * @param max - The maximum allowed path, inclusive.
   *
   * @returns A random path in the leading bucket of the range.
   */
  function randomPath(min: number, max: number): number {
    return min + Math.round(Math.random() * Math.sqrt(max - min));
  }
}
