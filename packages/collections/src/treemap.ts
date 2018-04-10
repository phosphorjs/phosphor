/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  BPlusTree
} from './bplustree';


/**
 * A generic B+ tree map.
 *
 * #### Notes
 * A tree map is a B+ tree that behaves as an ordered key:value map.
 *
 * Most operations have `O(log32 n)` or better complexity.
 */
export
class TreeMap<K, V> implements IIterable<[K, V]>, IRetroable<[K, V]> {
  /**
   * Construct a new tree map.
   *
   * @param cmp - The comparison function for the map.
   */
  constructor(cmp: (a: K, b: K) => number) {
    this._root = this._first = this._last = new BPlusTree.MapLeaf<K, V>();
    this._cmp = cmp;
  }

  /**
   * The comparison function for the map.
   *
   * #### Complexity
   * `O(1)`
   */
  get cmp(): (a: K, b: K) => number {
    return this._cmp;
  }

  /**
   * Whether the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get isEmpty(): boolean {
    return this._root.size === 0;
  }

  /**
   * The size of the map.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._root.size;
  }

  /**
   * The first item in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get first(): [K, V] | undefined {
    let { size, keys, values } = this._last;
    return size > 0 ? [keys[0], values[0]] : undefined;
  }

  /**
   * The last item in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get last(): [K, V] | undefined {
    let { size, keys, values } = this._last;
    return size > 0 ? [keys[size - 1], values[size - 1]] : undefined;
  }

  /**
   * The first key in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get firstKey(): K | undefined {
    let { size, keys } = this._first;
    return size > 0 ? keys[0] : undefined;
  }

  /**
   * The last key in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get lastKey(): K | undefined {
    let { size, keys } = this._last;
    return size > 0 ? keys[size - 1] : undefined;
  }

  /**
   * The first value in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get firstValue(): V | undefined {
    let { size, values } = this._first;
    return size > 0 ? values[0] : undefined;
  }

  /**
   * The last value in the map.
   *
   * This is `undefined` if the map is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get lastValue(): V | undefined {
    let { size, values } = this._last;
    return size > 0 ? values[size - 1] : undefined;
  }

  /**
   * Create an iterator over the items in the map.
   *
   * @returns A new iterator starting with the first item.
   *
   * #### Complexity
   * `O(1)`
   */
  iter(): IIterator<[K, V]> {
    return BPlusTree.iterItems(this._first);
  }

  /**
   * Create a reverse iterator over the items in the map.
   *
   * @returns A new iterator starting with the last item.
   *
   * #### Complexity
   * `O(1)`
   */
  retro(): IIterator<[K, V]> {
    return BPlusTree.retroItems(this._last);
  }

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator starting with the first key.
   *
   * #### Complexity
   * `O(1)`
   */
  keys(): IIterator<K> {
    return BPlusTree.iterKeys(this._first);
  }

  /**
   * Create a reverse iterator over the keys in the map.
   *
   * @returns A new iterator starting with the last key.
   *
   * #### Complexity
   * `O(1)`
   */
  retroKeys(): IIterator<K> {
    return BPlusTree.retroKeys(this._last);
  }

  /**
   * Create an iterator over the values in the map.
   *
   * @returns A new iterator starting with the first value.
   *
   * #### Complexity
   * `O(1)`
   */
  values(): IIterator<V> {
    return BPlusTree.iterValues(this._first);
  }

  /**
   * Create a reverse iterator over the values in the map.
   *
   * @returns A new iterator starting with the last value.
   *
   * #### Complexity
   * `O(1)`
   */
  retroValues(): IIterator<V> {
    return BPlusTree.retroValues(this._last);
  }

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
  slice(start?: number, stop?: number): IIterator<[K, V]> {
    return BPlusTree.sliceItems(this._root, start, stop);
  }

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
  retroSlice(start?: number, stop?: number): IIterator<[K, V]> {
    return BPlusTree.retroSliceItems(this._root, start, stop);
  }

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
  sliceKeys(start?: number, stop?: number): IIterator<K> {
    return BPlusTree.sliceKeys(this._root, start, stop);
  }

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
  retroSliceKeys(start?: number, stop?: number): IIterator<K> {
    return BPlusTree.retroSliceKeys(this._root, start, stop);
  }

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
  sliceValues(start?: number, stop?: number): IIterator<V> {
    return BPlusTree.sliceValues(this._root, start, stop);
  }

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
  retroSliceValues(start?: number, stop?: number): IIterator<V> {
    return BPlusTree.retroSliceValues(this._root, start, stop);
  }

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
  at(index: number): [K, V] | undefined {
    // Wrap negative indices.
    if (index < 0) {
      index += this._root.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._root.size) {
      return undefined;
    }

    // Return the item at the specified index.
    return BPlusTree.itemAt(this._root, index);
  }

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
  keyAt(index: number): K | undefined {
    // Wrap negative indices.
    if (index < 0) {
      index += this._root.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._root.size) {
      return undefined;
    }

    // Return the key at the specified index.
    return BPlusTree.keyAt(this._root, index);
  }

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
  valueAt(index: number): V | undefined {
    // Wrap negative indices.
    if (index < 0) {
      index += this._root.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._root.size) {
      return undefined;
    }

    // Return the value at the specified index.
    return BPlusTree.valueAt(this._root, index);
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
  has(key: K): boolean {
    return BPlusTree.hasKey(this._root, key, this._cmp);
  }

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
  indexOf(key: K): number {
    return BPlusTree.indexOf(this._root, key, this._cmp);
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
  get(key: K): V | undefined {
    return BPlusTree.getValue(this._root, key, this._cmp);
  }

  /**
   * Assign new items to the map, replacing all current items.
   *
   * @param items - The unique sorted items to assign to the map.
   *
   * #### Undefined Behavior
   * `items` which are not sorted according to the `cmp` function,
   * or which contains duplicate keys.
   *
   * #### Complexity
   * `O(n)`
   */
  assign(items: IterableOrArrayLike<[K, V]>): void {
    // Clear the current tree.
    BPlusTree.clearTree(this._root);

    // Assign the values to a new tree.
    let { root, first, last } = BPlusTree.assignMap(items);

    // Update the internal state.
    this._root = root;
    this._first = first;
    this._last = last;
  }

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
  set(key: K, value: V): void {
    // Set the value for the given key.
    this._root = BPlusTree.setValue(this._root, key, value, this._cmp);

    // Update the first leaf if needed.
    if (this._first.prev) {
      this._first = this._first.prev;
    }

    // Update the last leaf if needed.
    if (this._last.next) {
      this._last = this._last.next;
    }
  }

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
  setAt(index: number, value: V): void {
    // Wrap negative indices.
    if (index < 0) {
      index += this._root.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._root.size) {
      return;
    }

    // Set the value at the specified index.
    BPlusTree.setValueAt(this._root, index, value);
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
   * `O(log32 n)`
   */
  delete(key: K): void {
    // Delete the value from the map.
    this._root = BPlusTree.deleteKey(this._root, key, this._cmp);

    // Update the first leaf if needed.
    if (this._first.size === 0) {
      this._first = BPlusTree.firstLeaf(this._root);
    }

    // Update the last leaf if needed.
    if (this._last.size === 0) {
      this._last = BPlusTree.lastLeaf(this._root);
    }
  }

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
  remove(index: number): void {
    // Wrap negative indices.
    if (index < 0) {
      index += this._root.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._root.size) {
      return;
    }

    // Remove the value at the specified index.
    this._root = BPlusTree.removeAt(this._root, index);

    // Update the first leaf if needed.
    if (this._first.size === 0) {
      this._first = BPlusTree.firstLeaf(this._root);
    }

    // Update the last leaf if needed.
    if (this._last.size === 0) {
      this._last = BPlusTree.lastLeaf(this._root);
    }
  }

  /**
   * Clear the contents of the map.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void {
    // Clear the current tree.
    BPlusTree.clearTree(this._root);

    // Create a new empty tree.
    this._root = this._first = this._last = new BPlusTree.MapLeaf<K, V>();
  }

  private _root: BPlusTree.MapNode<K, V>;
  private _first: BPlusTree.MapLeaf<K, V>;
  private _last: BPlusTree.MapLeaf<K, V>;
  private _cmp: (a: K, b: K) => number;
}


/**
 * The namespace for the `TreeMap` class statics.
 */
export
namespace TreeMap {
  /**
   * Create a new tree map populated with the given items.
   *
   * @param items - The sorted unique items of interest.
   *
   * @returns A new tree map populated with the given items.
   *
   * #### Undefined Behavior
   * `items` which are not sorted or which contain duplicate keys.
   *
   * #### Complexity
   * `O(n)`
   */
  export
  function from<K, V>(items: IterableOrArrayLike<[K, V]>, cmp: (a: K, b: K) => number): TreeMap<K, V> {
    let map = new TreeMap<K, V>(cmp);
    map.assign(items);
    return map;
  }
}
