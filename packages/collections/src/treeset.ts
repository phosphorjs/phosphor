/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike, each
} from '@phosphor/algorithm';

import {
  BPlusTree
} from './bplustree';


/**
 * A generic B+ tree set.
 *
 * #### Notes
 * A tree set is a B+ tree that behaves as an ordered set.
 *
 * Most operations have `O(log32 n)` or better complexity.
 */
export
class TreeSet<T> implements IIterable<T>, IRetroable<T> {
  /**
   * Construct a new tree set.
   *
   * @param cmp - The comparison function for the set.
   */
  constructor(cmp: (a: T, b: T) => number) {
    this._root = this._first = this._last = new BPlusTree.SetLeaf<T>();
    this._cmp = cmp;
  }

  /**
   * The comparison function for the set.
   *
   * #### Complexity
   * `O(1)`
   */
  get cmp(): (a: T, b: T) => number {
    return this._cmp;
  }

  /**
   * Whether the set is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get isEmpty(): boolean {
    return this._root.size === 0;
  }

  /**
   * The size of the set.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._root.size;
  }

  /**
   * The first value in the set.
   *
   * This is `undefined` if the set is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get first(): T | undefined {
    let { size, keys } = this._first;
    return size > 0 ? keys[0] : undefined;
  }

  /**
   * The last value in the set.
   *
   * This is `undefined` if the set is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get last(): T | undefined {
    let { size, keys } = this._last;
    return size > 0 ? keys[size - 1] : undefined;
  }

  /**
   * Create an iterator over the values in the set.
   *
   * @returns A new iterator starting with the first value.
   *
   * #### Complexity
   * `O(1)`
   */
  iter(): IIterator<T> {
    return BPlusTree.iterKeys(this._first);
  }

  /**
   * Create a reverse iterator over the values in the set.
   *
   * @returns A new iterator starting with the last value.
   *
   * #### Complexity
   * `O(1)`
   */
  retro(): IIterator<T> {
    return BPlusTree.retroKeys(this._last);
  }

  /**
   * Create an iterator for a slice of values in the set.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the set. The default is `0`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the set. The default is `size`.
   *
   * @returns A new iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  slice(start?: number, stop?: number): IIterator<T> {
    return BPlusTree.sliceKeys(this._root, start, stop);
  }

  /**
   * Create a reverse iterator for a slice of values in the set.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the set. The default is `size - 1`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the set. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  retroSlice(start?: number, stop?: number): IIterator<T> {
    return BPlusTree.retroSliceKeys(this._root, start, stop);
  }

  /**
   * Get the value at a particular index.
   *
   * @param index - The index of the value of interest. Negative
   *   values are taken as an offset from the end of the set.
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
    return BPlusTree.keyAt(this._root, index);
  }

  /**
   * Test whether the set has a particular value.
   *
   * @param value - The value of interest.
   *
   * @returns `true` if the set has the given value, `false` otherwise.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  has(value: T): boolean {
    return BPlusTree.hasKey(this._root, value, this._cmp);
  }

  /**
   * Get the index of a particular value.
   *
   * @param value - The value of interest.
   *
   * @returns The index of the specified value. A negative value means
   *   that the value does not currently exist in the set, but if the
   *   value were inserted it would reside at the index `-index - 1`.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  indexOf(value: T): number {
    return BPlusTree.indexOf(this._root, value, this._cmp);
  }

  /**
   * Assign new values to the set, replacing all current values.
   *
   * @param values - The values to assign to the set.
   *
   * @param normalized - Whether the given `values` have no duplicates
   *   and are sorted according to the `cmp` function. The default is
   *   `false`.
   *
   * #### Undefined Behavior
   * `values` which are not normalized when `normalized` is `true`.
   *
   * #### Complexity
   * `O(n log32 n)` or `O(n)` if `values` are normalized.
   */
  assign(values: IterableOrArrayLike<T>, normalized = false): void {
    // Take the slow path if the values aren't normalized.
    if (!normalized) {
      this.clear();
      this.update(values);
      return;
    }

    // Clear the current tree.
    BPlusTree.clearTree(this._root);

    // Assign the values to a new tree.
    let { root, first, last } = BPlusTree.assignSet(values);

    // Update the internal state.
    this._root = root;
    this._first = first;
    this._last = last;
  }

  /**
   * Update the set with multiple new values.
   *
   * @param values - The values to add to the set.
   *
   * #### Complexity
   * `O(k log32 n)`
   */
  update(values: IterableOrArrayLike<T>): void {
    each(values, value => { this.add(value); });
  }

  /**
   * Add a value to the set.
   *
   * @param value - The value to add to the set.
   *
   * #### Notes
   * This method is a no-op if the value already exists in the set.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  add(value: T): void {
    // Add the value to the set.
    this._root = BPlusTree.addKey(this._root, value, this._cmp);

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
   * Delete a value from the set.
   *
   * @param value - The value to delete.
   *
   * #### Notes
   * This method is a no-op if the value does not exist in the set.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  delete(value: T): void {
    // Delete the value from the set.
    this._root = BPlusTree.deleteKey(this._root, value, this._cmp);

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
   * Remove a value at a particular index.
   *
   * @param index - The index of the value to remove. Negative
   *   values are taken as an offset from the end of the set.
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
   * Clear the contents of the set.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void {
    // Clear the current tree.
    BPlusTree.clearTree(this._root);

    // Create a new empty tree.
    this._root = this._first = this._last;
  }

  private _root: BPlusTree.SetNode<T>;
  private _first: BPlusTree.SetLeaf<T>;
  private _last: BPlusTree.SetLeaf<T>;
  private _cmp: (a: T, b: T) => number;
}


/**
 * The namespace for the `TreeSet` class statics.
 */
export
namespace TreeSet {
  /**
   * Create a new tree set populated with the given values.
   *
   * @param values - The values to add to the set.
   *
   * @param cmp - The comparison function for the map.
   *
   * @returns A new tree set populated with the given values.
   *
   * #### Complexity
   * `O(n log32 n)`
   */
  export
  function from<T>(values: IterableOrArrayLike<T>, cmp: (a: T, b: T) => number): TreeSet<T> {
    let set = new TreeSet<T>(cmp);
    set.assign(values);
    return set;
  }
}
