/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike, empty, iter
} from '@phosphor/algorithm';

import {
  BPlusTree
} from './bplustree';


/**
 * A generic B+ tree list.
 *
 * #### Notes
 * A tree list is a B+ tree that behaves as a random access sequence.
 *
 * Most operations have `O(log32 n)` or better complexity.
 */
export
class TreeList<T> implements IIterable<T>, IRetroable<T> {
  /**
   * Construct a new tree list.
   */
  constructor() {
    this._root = this._first = this._last = new BPlusTree.ListLeaf<T>();
  }

  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get isEmpty(): boolean {
    return this._root.size === 0;
  }

  /**
   * The size of the list.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._root.size;
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
    let { size, values } = this._first;
    return size > 0 ? values[0] : undefined;
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
    let { size, values } = this._last;
    return size > 0 ? values[size - 1] : undefined;
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
    return BPlusTree.iterValues(this._first);
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
    return BPlusTree.retroValues(this._last);
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
    return BPlusTree.sliceValues(this._root, start, stop);
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
    return BPlusTree.retroSliceValues(this._root, start, stop);
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
   * Assign new values to the list, replacing all current values.
   *
   * @param values - The values to assign to the list.
   *
   * #### Complexity
   * `O(n)`
   */
  assign(values: IterableOrArrayLike<T>): void {
    // Clear the current tree.
    BPlusTree.clearTree(this._root);

    // Assign the values to a new tree.
    let { root, first, last } = BPlusTree.assignList(values);

    // Update the internal state.
    this._root = root;
    this._first = first;
    this._last = last;
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
    // Wrap and clamp the index.
    if (index < 0) {
      index = Math.max(0, index + this._root.size);
    } else {
      index = Math.min(index, this._root.size);
    }

    // Insert the value at the specified index.
    this._root = BPlusTree.insertAt(this._root, index, value);

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
    // Fetch the current size of the list.
    let size = this._root.size;

    // Wrap and clamp the index.
    if (index < 0) {
      index = Math.max(0, index + size);
    } else {
      index = Math.min(index, size);
    }

    // Clamp the count.
    count = Math.max(0, Math.min(count, size - index));

    // Use a simple assign or clear if possible.
    if (count === size) {
      if (values) {
        this.assign(values);
      } else {
        this.clear();
      }
      return;
    }

    // Set up an iterator for the values.
    let it = values ? iter(values) : empty<T>();

    // Set up the variable to hold the iterator value.
    let value: T | undefined = undefined;

    // Update as many values in-place as possible.
    while (count > 0 && (value = it.next()) !== undefined) {
      BPlusTree.setValueAt(this._root, index, value);
      index++;
      count--;
    }

    // Remove any extra values.
    while (count > 0) {
      this._root = BPlusTree.removeAt(this._root, index);
      count--;
    }

    // Insert any remaining values.
    while ((value = it.next()) !== undefined) {
      this._root, BPlusTree.insertAt(this._root, index, value);
      index++;
    }

    // Update the first and last leaves.
    this._first = BPlusTree.firstLeaf(this._root);
    this._last = BPlusTree.lastLeaf(this._root);
  }

  /**
   * Clear the contents of the list.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void {
    // Clear the current tree.
    BPlusTree.clearTree(this._root);

    // Point the nodes to a single leaf.
    this._root = this._first = this._last;
  }

  private _root: BPlusTree.ListNode<T>;
  private _first: BPlusTree.ListLeaf<T>;
  private _last: BPlusTree.ListLeaf<T>;
}


/**
 * The namespace for the `TreeList` class statics.
 */
export
namespace TreeList {
  /**
   * Create a new tree list populated with the given values.
   *
   * @param values - The values of interest.
   *
   * @returns A new tree list populated with the given values.
   *
   * #### Complexity
   * `O(n)`
   */
  export
  function from<T>(values: IterableOrArrayLike<T>): TreeList<T> {
    let list = new TreeList<T>();
    list.assign(values);
    return list;
  }
}
