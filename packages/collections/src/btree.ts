/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, IIterable, IIterator, IRetroable, IterableOrArrayLike, each
} from '@phosphor/algorithm';


/**
 * A generic B+ tree.
 */
export
class BTree<K, V> implements IIterable<[K, V]>, IRetroable<[K, V]> {
  /**
   * Construct a new B+ tree.
   *
   * @param options - The options for initializing the tree.
   */
  constructor(options: BTree.IOptions<K>) {
    this._root = this._first = this._last = new Private.LeafNode<K, V>();
    this._order = Private.parseOrder(options);
    this._cmp = options.cmp;
  }

  /**
   * The order of the tree.
   *
   * #### Complexity
   * Constant.
   */
  get order(): number {
    return this._order;
  }

  /**
   * The key comparison function for the tree.
   *
   * #### Complexity
   * Constant.
   */
  get cmp(): (a: K, b: K) => number {
    return this._cmp;
  }

  /**
   * Whether the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get isEmpty(): boolean {
    return this._root.size === 0;
  }

  /**
   * The size of the tree.
   *
   * #### Complexity
   * Constant.
   */
  get size(): number {
    return this._root.size;
  }

  /**
   * The first item in the tree.
   *
   * This is `undefined` if the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get first(): [K, V] | undefined {
    return this._first.firstItem;
  }

  /**
   * The last item in the tree.
   *
   * This is `undefined` if the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get last(): [K, V] | undefined {
    return this._last.lastItem;
  }

  /**
   * The first key in the tree.
   *
   * This is `undefined` if the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get firstKey(): K | undefined {
    return this._first.firstKey;
  }

  /**
   * The last key in the tree.
   *
   * This is `undefined` if the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get lastKey(): K | undefined {
    return this._last.lastKey;
  }

  /**
   * The first value in the tree.
   *
   * This is `undefined` if the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get firstValue(): V | undefined {
    return this._first.firstValue;
  }

  /**
   * The last value in the tree.
   *
   * This is `undefined` if the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get lastValue(): V | undefined {
    return this._last.lastValue;
  }

  /**
   * Create an iterator over the items in the tree.
   *
   * @returns A new iterator starting with the first item.
   *
   * #### Complexity
   * Constant.
   */
  iter(): IIterator<[K, V]> {
    return this._first.iterItems();
  }

  /**
   * Create a reverse iterator over the items in the tree.
   *
   * @returns A new iterator starting with the last item.
   *
   * #### Complexity
   * Constant.
   */
  retro(): IIterator<[K, V]> {
    return this._last.retroItems();
  }

  /**
   * Create an iterator over the keys in the tree.
   *
   * @returns A new iterator starting with the first key.
   *
   * #### Complexity
   * Constant.
   */
  keys(): IIterator<K> {
    return this._first.iterKeys();
  }

  /**
   * Create a reverse iterator over the keys in the tree.
   *
   * @returns A new iterator starting with the last key.
   *
   * #### Complexity
   * Constant.
   */
  retroKeys(): IIterator<K> {
    return this._last.retroKeys();
  }

  /**
   * Create an iterator over the values in the tree.
   *
   * @returns A new iterator starting with the first value.
   *
   * #### Complexity
   * Constant.
   */
  values(): IIterator<V> {
    return this._first.iterValues();
  }

  /**
   * Create a reverse iterator over the values in the tree.
   *
   * @returns A new iterator starting with the last value.
   *
   * #### Complexity
   * Constant.
   */
  retroValues(): IIterator<V> {
    return this._last.retroValues();
  }

  /**
   * Get the item at a particular index.
   *
   * @param index - The index of the item of interest. Negative
   *   values are taken as an offset from the end of the tree.
   *
   * @returns The item at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * Logarithmic.
   */
  at(index: number): [K, V] | undefined {
    if (index < 0) {
      index += this._root.size;
    }
    if (index < 0 || index >= this._root.size) {
      return undefined;
    }
    return this._root.itemAt(index);
  }

  /**
   * Get the key at a particular index.
   *
   * @param index - The index of the key of interest. Negative
   *   values are taken as an offset from the end of the tree.
   *
   * @returns The key at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * Logarithmic.
   */
  keyAt(index: number): K | undefined {
    if (index < 0) {
      index += this._root.size;
    }
    if (index < 0 || index >= this._root.size) {
      return undefined;
    }
    return this._root.keyAt(index);
  }

  /**
   * Get the value at a particular index.
   *
   * @param index - The index of the value of interest. Negative
   *   values are taken as an offset from the end of the tree.
   *
   * @returns The value at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * Logarithmic.
   */
  valueAt(index: number): V | undefined {
    if (index < 0) {
      index += this._root.size;
    }
    if (index < 0 || index >= this._root.size) {
      return undefined;
    }
    return this._root.valueAt(index);
  }

  /**
   * Test whether the tree has a value for a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns `true` if the tree has a value for the specified
   *   key, `false` otherwise.
   *
   * #### Complexity
   * Logarithmic.
   */
  has(key: K): boolean {
    return this._root.hasKey(key, this._cmp);
  }

  /**
   * Get the value for a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns The value for the specified key, or `undefined` if
   *   the tree does not have a value for the key.
   *
   * #### Complexity
   * Logarithmic.
   */
  get(key: K): V | undefined {
    return this._root.getValue(key, this._cmp);
  }

  /**
   * Get the index of a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns The index of the specified key. A negative value means
   *   that the key does not currently exist in the tree, but if the
   *   key were inserted it would reside at the index `-index - 1`.
   *
   * #### Complexity
   * Logarithmic.
   */
  indexOf(key: K): number {
    return this._root.indexOf(key, this._cmp);
  }

  /**
   * Assign new items to the tree, replacing all current items.
   *
   * @param items - The unique sorted items to assign to the tree.
   *
   * #### Notes
   * The given `items` must not contain duplicate keys and must be
   * sorted according to the `cmp` function.
   *
   * #### Undefined Behavior
   * An `items` which is not sorted or which contains duplicate keys.
   *
   * #### Complexity
   * Linear.
   */
  assign(items: IterableOrArrayLike<[K, V]>): void {
    this._root.clear();
    this._root = Private.bulkLoad(items, this._order);
    this._first = this._root.firstLeaf();
    this._last = this._root.lastLeaf();
  }

  /**
   * Insert an item into the tree.
   *
   * @param key - The key to insert.
   *
   * @param value - The value for the given key.
   *
   * #### Complexity
   * Logarithmic.
   */
  insert(key: K, value: V): void {
    this._root = this._root.insert(key, value, this._cmp, this._order);
    this._first = this._root.firstLeaf();
    this._last = this._root.lastLeaf();
  }

  /**
   * Delete an item in the tree.
   *
   * @param key - The key of the item to delete.
   *
   * #### Complexity
   * Logarithmic.
   */
  delete(key: K): void {
    this._root = this._root.delete(key, this._cmp, this._order);
    this._first = this._root.firstLeaf();
    this._last = this._root.lastLeaf();
  }

  /**
   * Remove an item at a particular index.
   *
   * @param index - The index of the item to remove.
   *
   * #### Complexity
   * Logarithmic.
   */
  removeAt(index: number): void {
    if (index < 0) {
      index += this._root.size;
    }
    if (index < 0 || index >= this._root.size) {
      return;
    }
    this._root = this._root.removeAt(index, this._order);
    this._first = this._root.firstLeaf();
    this._last = this._root.lastLeaf();
  }

  /**
   * Clear the contents of the tree.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void {
    this._root.clear();
    this._root = this._first = this._last = new Private.LeafNode<K, V>();
  }

  /**
   * Dump the contents of the tree into a simple tree representation.
   *
   * @returns A new tree repr starting at the root node of the tree.
   *
   * #### Notes
   * The structure of the return value reflects the internal structure
   * of the tree. This can be useful for debugging and optimization.
   */
  dump(): BTree.NodeRepr<K, V> {
    return this._root.dump();
  }

  private _order: number;
  private _cmp: (a: K, b: K) => number;
  private _root: Private.Node<K, V>;
  private _first: Private.LeafNode<K, V>;
  private _last: Private.LeafNode<K, V>;
}


/**
 * The namespace for the `BTree` class statics.
 */
export
namespace BTree {
  /**
   * An options object for initializing a B-Tree.
   */
  export
  interface IOptions<K> {
    /**
     * The key comparison function for the tree.
     */
    cmp: (a: K, b: K) => number;

    /**
     * The order of the tree.
     *
     * A larger order creates a wider tree.
     *
     * The minimum is `4`, the default is `32`.
     */
    order?: number;
  }

  /**
   * A type alias for a branch or leaf node representation.
   */
  export
  type NodeRepr<K, V> = IBranchRepr<K, V> | ILeafRepr<K, V>;

  /**
   * A object which holds the representation of a branch node.
   */
  export
  interface IBranchRepr<K, V> {
    /**
     * The discriminated type of the node repr.
     */
    type: 'branch';

    /**
     * The total number of items in the subtree.
     */
    size: number;

    /**
     * The left-most key of each child.
     */
    keys: K[];

    /**
     * The size of each child.
     */
    sizes: number[];

    /**
     * The children of the node.
     */
    children: NodeRepr<K, V>[];
  }

  /**
   * A object which holds the representation of a leaf node.
   */
  export
  interface ILeafRepr<K, V> {
    /**
     * The discriminated type of the node repr.
     */
    type: 'leaf';

    /**
     * The total number of items in the leaf.
     */
    size: number;

    /**
     * The keys in the leaf.
     */
    keys: K[];

    /**
     * The values in the leaf.
     */
    values: V[];
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the nodes in a B-tree.
   */
  export
  type Node<K, V> = BranchNode<K, V> | LeafNode<K, V>;

  /**
   * A class representing a branch node in a B-tree.
   */
  export
  class BranchNode<K, V> {
    /**
     * The total number of items held in the subtree.
     */
    size = 0;

    /**
     * The left-most key of each child subtree.
     */
    readonly keys: K[] = [];

    /**
     * The size of each child subtree.
     */
    readonly sizes: number[] = [];

    /**
     * The child nodes of this branch node.
     */
    readonly children: Node<K, V>[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): 'branch' {
      return 'branch';
    }

    /**
     * Get the first leaf node in the subtree.
     */
    firstLeaf(): LeafNode<K, V> {
      return this.children[0].firstLeaf();
    }

    /**
     * Get the last leaf node in the subtree.
     */
    lastLeaf(): LeafNode<K, V> {
      return this.children[this.children.length - 1].firstLeaf();
    }

    /**
     * Get the item at the specified local index.
     */
    itemAt(index: number): [K, V] {
      let { i, local } = linearFindLocalIndex(this.sizes, index);
      return this.children[i].itemAt(local);
    }

    /**
     * Get the key at the specified local index.
     */
    keyAt(index: number): K {
      let { i, local } = linearFindLocalIndex(this.sizes, index);
      return this.children[i].keyAt(local);
    }

    /**
     * Get the value at the specified local index.
     */
    valueAt(index: number): V {
      let { i, local } = linearFindLocalIndex(this.sizes, index);
      return this.children[i].valueAt(local);
    }

    /**
     * Test whether the subtree contains the specified key.
     */
    hasKey(key: K, cmp: (a: K, b: K) => number): boolean {
      let i = linearFindPivotIndex(this.keys, key, cmp);
      return this.children[i].hasKey(key, cmp);
    }

    /**
     * Get the value for the specified key.
     */
    getValue(key: K, cmp: (a: K, b: K) => number): V | undefined {
      let i = linearFindPivotIndex(this.keys, key, cmp);
      return this.children[i].getValue(key, cmp);
    }

    /**
     * Get the local index of the specified key.
     */
    indexOf(key: K, cmp: (a: K, b: K) => number): number {
      let i = linearFindPivotIndex(this.keys, key, cmp);
      let j = this.children[i].indexOf(key, cmp);
      let s = linearComputeSum(this.sizes, i);
      return j >= 0 ? s + j : -s + j;
    }

    /**
     * Insert an item into the subtree.
     */
    insert(key: K, value: V, cmp: (a: K, b: K) => number, order: number): Node<K, V> {
      // Perform the actual insert.
      this.insertInternal(key, value, cmp, order);

      // Bail early if there is still room in the branch.
      if (this.keys.length <= order) {
        return this;
      }

      // Split the node to the right and create a new sibling.
      let next = this.split(order);

      // Return a new root which holds the two branches.
      return createRoot(this, next);
    }

    /**
     * Delete an item from the subtree.
     */
    delete(key: K, cmp: (a: K, b: K) => number, order: number): Node<K, V> {
      // Perform the actual delete.
      this.deleteInternal(key, cmp, order);

      // Bail early if there is more than one child.
      if (this.children.length > 1) {
        return this;
      }

      // Extract the sole remaining child as the new root.
      let root = this.children.pop()!;

      // Clear the rest of the node state.
      this.clear();

      // Return the new root.
      return root;
    }

    /**
     * Remove an item from the subtree.
     */
    removeAt(index: number, order: number): Node<K, V> {
      // Perform the actual remove.
      this.removeAtInternal(index, order);

      // Bail early if there is more than one child.
      if (this.children.length > 1) {
        return this;
      }

      // Extract the sole remaining child as the new root.
      let root = this.children.pop()!;

      // Clear the rest of the node state.
      this.clear();

      // Return the new root.
      return root;
    }

    /**
     * Clear the contents of the subtree.
     */
    clear(): void {
      each(this.children, child => child.clear());
      this.size = 0;
      this.keys.length = 0;
      this.sizes.length = 0;
      this.children.length = 0;
    }

    /**
     * Dump the contents of the tree into a simple tree representation.
     */
    dump(): BTree.IBranchRepr<K, V> {
      let type = this.type;
      let size = this.size;
      let keys = this.keys.slice();
      let sizes = this.sizes.slice();
      let children = this.children.map(child => child.dump());
      return { type, size, keys, sizes, children };
    }

    /**
     * Perform an actual insert in the branch node.
     *
     * This may cause the node to become overfull.
     */
    insertInternal(key: K, value: V, cmp: (a: K, b: K) => number, order: number): void {
      // Find the pivot index for the given key.
      let i = linearFindPivotIndex(this.keys, key, cmp);

      // Fetch the pivot child.
      let child = this.children[i];

      // Fetch the current size of the child.
      let prevSize = child.size;

      // Perform the actual insert on the child.
      child.insertInternal(key, value, cmp, order);

      // Fetch the updated size of the child.
      let currSize = child.size;

      // Bail early if the child size did not change.
      if (prevSize === currSize) {
        return;
      }

      // Update the state of the branch.
      this.size++;
      this.sizes[i] = currSize;
      this.keys[i] = child.keys[0];

      // Bail early if the child is not overfull.
      if (child.keys.length <= order) {
        return;
      }

      // Split the node to the right and create a new sibling.
      let next = child.split(order);

      // Update the size record of the original child.
      this.sizes[i] = child.size;

      // Add the new sibling to the branch.
      ArrayExt.insert(this.children, i + 1, next);
      ArrayExt.insert(this.sizes, i + 1, next.size);
      ArrayExt.insert(this.keys, i + 1, next.keys[0]);
    }

    /**
     * Perform an actual delete from the branch node.
     */
    deleteInternal(key: K, cmp: (a: K, b: K) => number, order: number): void {
      // Find the pivot index for the given key.
      let i = linearFindPivotIndex(this.keys, key, cmp);

      // Fetch the pivot child.
      let child = this.children[i];

      // Fetch the current size of the child.
      let prevSize = child.size;

      // Perform the actual delete on the child.
      child.deleteInternal(key, cmp, order);

      // Fetch the updated size of the child.
      let currSize = child.size;

      // Bail early if the child size did not change.
      if (prevSize === currSize) {
        return;
      }

      // Update the state of the branch.
      this.size--;
      this.sizes[i] = currSize;
      this.keys[i] = child.keys[0];

      // Bail early if the child is not underfull.
      if (child.keys.length >= Math.floor(order / 2)) {
        return;
      }

      // Join the child with one of its siblings.
      this.join(i, order);
    }

    /**
     * Perform an actual remove from the branch node.
     */
    removeAtInternal(index: number, order: number): void {
      // Find the local index for the given index.
      let { i, local } = linearFindLocalIndex(this.sizes, index);

      // Fetch the pivot child.
      let child = this.children[i];

      // Fetch the current size of the child.
      let prevSize = child.size;

      // Perform the actual remove on the child.
      child.removeAtInternal(local, order);

      // Fetch the updated size of the child.
      let currSize = child.size;

      // Bail early if the child size did not change.
      if (prevSize === currSize) {
        return;
      }

      // Update the state of the branch.
      this.size--;
      this.sizes[i] = currSize;
      this.keys[i] = child.keys[0];

      // Bail early if the child is not underfull.
      if (child.keys.length >= Math.floor(order / 2)) {
        return;
      }

      // Join the child with one of its siblings.
      this.join(i, order);
    }

    /**
     * Split the node to the right and return the new sibling.
     *
     * This method assumes that the node is already overfull.
     */
    split(order: number): BranchNode<K, V> {
      // Create a new branch node for the split.
      let next = new BranchNode<K, V>();

      // Compute the number of items for the split.
      let count = Math.floor(order / 2);

      // Copy the relevant data to the new branch.
      for (let i = count, n = this.keys.length; i < n; ++i) {
        this.size -= this.sizes[i];
        next.size += this.sizes[i];
        next.keys[i - count] = this.keys[i];
        next.sizes[i - count] = this.sizes[i];
        next.children[i - count] = this.children[i];
      }

      // Remove the copied items from this branch.
      this.keys.length = count;
      this.sizes.length = count;
      this.children.length = count;

      // Return the new sibling.
      return next;
    }

    /**
     * Join the child node with one of its siblings.
     *
     * This method assumes that the child is already underfull.
     */
    join(i: number, order: number): void {
      // Compute the minimum number of items.
      let count = Math.floor(order / 2);

      // Fetch the child to be joined.
      let child = this.children[i];

      // Fetch the relevant sibling.
      let sibling = i === 0 ? this.children[i + 1] : this.children[i - 1];

      // Compute the flags which control the join behavior.
      let hasNext = i === 0;
      let isLeaf = child.type === 'leaf';
      let hasExtra = sibling.keys.length > count;

      // Join case #1:
      if (isLeaf && hasExtra && hasNext) {
        // Cast the children to leaves.
        let c = child as LeafNode<K, V>;
        let s = sibling as LeafNode<K, V>;

        // Steal an item from the next sibling.
        c.keys.push(s.keys.shift()!);
        c.values.push(s.values.shift()!);

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.sizes[i + 1] = s.size;
        this.keys[i + 1] = s.keys[0];
        return;
      }

      // Join case #2:
      if (isLeaf && hasExtra && !hasNext) {
        // Cast the children to leaves.
        let c = child as LeafNode<K, V>;
        let s = sibling as LeafNode<K, V>;

        // Steal an item from the previous sibling.
        c.keys.unshift(s.keys.pop()!);
        c.values.unshift(s.values.pop()!);

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.keys[i] = c.keys[0];
        this.sizes[i - 1] = s.size;
        return;
      }

      // Join case #3:
      if (isLeaf && !hasExtra && hasNext) {
        // Cast the children to leaves.
        let c = child as LeafNode<K, V>;
        let s = sibling as LeafNode<K, V>;

        // Merge all the items with the next sibling.
        s.keys.unshift(...c.keys);
        s.values.unshift(...c.values);

        // Update the branch data for the sibling.
        this.sizes[i + 1] = s.size;
        this.keys[i + 1] = s.keys[0];

        // Remove the original child from the branch.
        ArrayExt.removeAt(this.keys, i);
        ArrayExt.removeAt(this.sizes, i);
        ArrayExt.removeAt(this.children, i);

        // Patch up the sibling links.
        if (c.prev) c.prev.next = s;
        s.prev = c.prev;

        // Clear the original child.
        c.clear();
        return;
      }

      // Join case #4:
      if (isLeaf && !hasExtra && !hasNext) {
        // Cast the children to leaves.
        let c = child as LeafNode<K, V>;
        let s = sibling as LeafNode<K, V>;

        // Merge all the items with the previous sibling.
        s.keys.push(...c.keys);
        s.values.push(...c.values);

        // Update the branch data for the sibiling.
        this.sizes[i - 1] = s.size;

        // Remove the original child from the branch.
        ArrayExt.removeAt(this.keys, i);
        ArrayExt.removeAt(this.sizes, i);
        ArrayExt.removeAt(this.children, i);

        // Patch up the sibling links.
        if (c.next) c.next.prev = s;
        s.next = c.next;

        // Clear the original child.
        c.clear();
        return;
      }

      // Join case #5:
      if (!isLeaf && hasExtra && hasNext) {
        // Cast the children to branches.
        let c = child as BranchNode<K, V>;
        let s = sibling as BranchNode<K, V>;

        // Steal a record from the next sibling.
        c.keys.push(s.keys.shift()!);
        c.sizes.push(s.sizes.shift()!);
        c.children.push(s.children.shift()!);

        // Update the sizes of the siblings.
        c.size += c.sizes[c.sizes.length - 1];
        s.size -= c.sizes[c.sizes.length - 1];

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.sizes[i + 1] = s.size;
        this.keys[i + 1] = s.keys[0];
        return;
      }

      // Join case #6:
      if (!isLeaf && hasExtra && !hasNext) {
        // Cast the children to branches.
        let c = child as BranchNode<K, V>;
        let s = sibling as BranchNode<K, V>;

        // Steal a record from the previous sibling.
        c.keys.unshift(s.keys.pop()!);
        c.sizes.unshift(s.sizes.pop()!);
        c.children.unshift(s.children.pop()!);

        // Update the sizes of the siblings.
        c.size += c.sizes[0];
        s.size -= c.sizes[0];

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.keys[i] = c.keys[0];
        this.sizes[i - 1] = s.size;
        return;
      }

      // Join case #7:
      if (!isLeaf && !hasExtra && hasNext) {
        // Cast the children to branches.
        let c = child as BranchNode<K, V>;
        let s = sibling as BranchNode<K, V>;

        // Merge all the items with the next sibling.
        s.keys.unshift(...c.keys);
        s.sizes.unshift(...c.sizes);
        s.children.unshift(...c.children);

        // Update the size of the sibling.
        s.size += c.size;

        // Update the branch data for the sibling.
        this.sizes[i + 1] = s.size;
        this.keys[i + 1] = s.keys[0];

        // Remove the original child from the branch.
        ArrayExt.removeAt(this.keys, i);
        ArrayExt.removeAt(this.sizes, i);
        ArrayExt.removeAt(this.children, i);

        // Clear the original child.
        c.children.length = 0;
        c.clear();
        return;
      }

      // Join case #8:
      if (!isLeaf && !hasExtra && !hasNext) {
        // Cast the children to branches.
        let c = child as BranchNode<K, V>;
        let s = sibling as BranchNode<K, V>;

        // Merge all the items with the previous sibling.
        s.keys.push(...c.keys);
        s.sizes.push(...c.sizes);
        s.children.push(...c.children);

        // Update the size of the sibling.
        s.size += c.size;

        // Update the branch data for the sibling.
        this.sizes[i - 1] = s.size;

        // Remove the original child from the branch.
        ArrayExt.removeAt(this.keys, i);
        ArrayExt.removeAt(this.sizes, i);
        ArrayExt.removeAt(this.children, i);

        // Clear the original child.
        c.children.length = 0;
        c.clear();
        return;
      }

      // One of the above cases must match.
      throw 'unreachable';
    }
  }

  /**
   * A class representing a leaf node in a B-tree.
   */
  export
  class LeafNode<K, V> {
    /**
     * The next sibling leaf node of this leaf node.
     */
    next: LeafNode<K, V> | null = null;

    /**
     * The previous sibling leaf node of this leaf node.
     */
    prev: LeafNode<K, V> | null = null;

    /**
     * The ordered keys for the leaf node.
     */
    readonly keys: K[] = [];

    /**
     * The ordered values for the leaf node.
     */
    readonly values: V[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): 'leaf' {
      return 'leaf';
    }

    /**
     * The total number of items held in the leaf node.
     */
    get size(): number {
      return this.keys.length;
    }

    /**
     * The first item in the leaf node, or `undefined`.
     */
    get firstItem(): [K, V] | undefined {
      let { size, keys, values } = this;
      return size > 0 ? [keys[0], values[0]] : undefined;
    }

    /**
     * The last item in the leaf node, or `undefined`.
     */
    get lastItem(): [K, V] | undefined {
      let { size, keys, values } = this;
      return size > 0 ? [keys[size - 1], values[size - 1]] : undefined;
    }

    /**
     * The first key in the leaf node, or `undefined`.
     */
    get firstKey(): K | undefined {
      let { size, keys } = this;
      return size > 0 ? keys[0] : undefined;
    }

    /**
     * The last key in the leaf node, or `undefined`.
     */
    get lastKey(): K | undefined {
      let { size, keys } = this;
      return size > 0 ? keys[size - 1] : undefined;
    }

    /**
     * The first value in the leaf node, or `undefined`.
     */
    get firstValue(): V | undefined {
      let { size, values } = this;
      return size > 0 ? values[0] : undefined;
    }

    /**
     * The last value in the leaf node, or `undefined`.
     */
    get lastValue(): V | undefined {
      let { size, values } = this;
      return size > 0 ? values[size - 1] : undefined;
    }

    /**
     * Get the first leaf node in the subtree.
     */
    firstLeaf(): LeafNode<K, V> {
      return this;
    }

    /**
     * Get the last leaf node in the subtree.
     */
    lastLeaf(): LeafNode<K, V> {
      return this;
    }

    /**
     * Create a forward iterator for the items in the tree.
     */
    iterItems(): IIterator<[K, V]> {
      return new ForwardIterator<K, V, [K, V]>(this, itemMapper);
    }

    /**
     * Create a reverse iterator for the items in the tree.
     */
    retroItems(): IIterator<[K, V]> {
      return new RetroIterator<K, V, [K, V]>(this, itemMapper);
    }

    /**
     * Create a forward iterator for the keys in the tree.
     */
    iterKeys(): IIterator<K> {
      return new ForwardIterator<K, V, K>(this, keyMapper);
    }

    /**
     * Create a reverse iterator for the keys in the tree.
     */
    retroKeys(): IIterator<K> {
      return new RetroIterator<K, V, K>(this, keyMapper);
    }

    /**
     * Create a forward iterator for the values in the tree.
     */
    iterValues(): IIterator<V> {
      return new ForwardIterator<K, V, V>(this, valueMapper);
    }

    /**
     * Create a reverse iterator for the values in the tree.
     */
    retroValues(): IIterator<V> {
      return new RetroIterator<K, V, V>(this, valueMapper);
    }

    /**
     * Get the item at the specified local index.
     */
    itemAt(index: number): [K, V] {
      return [this.keys[index], this.values[index]];
    }

    /**
     * Get the key at the specified local index.
     */
    keyAt(index: number): K {
      return this.keys[index];
    }

    /**
     * Get the value at the specified local index.
     */
    valueAt(index: number): V {
      return this.values[index];
    }

    /**
     * Test whether the leaf contains the specified key.
     */
    hasKey(key: K, cmp: (a: K, b: K) => number): boolean {
      return linearFindKeyIndex(this.keys, key, cmp) >= 0;
    }

    /**
     * Get the value for the specified key.
     */
    getValue(key: K, cmp: (a: K, b: K) => number): V | undefined {
      let i = linearFindKeyIndex(this.keys, key, cmp);
      return i >= 0 ? this.values[i] : undefined;
    }

    /**
     * Get the local index of the specified key.
     */
    indexOf(key: K, cmp: (a: K, b: K) => number): number {
      return linearFindKeyIndex(this.keys, key, cmp);
    }

    /**
     * Insert an item into the leaf node.
     */
    insert(key: K, value: V, cmp: (a: K, b: K) => number, order: number): Node<K, V> {
      // Perform the actual insert.
      this.insertInternal(key, value, cmp, order);

      // Bail early if the node is not overfull.
      if (this.keys.length <= order) {
        return this;
      }

      // Split the node to the right and create a new sibling.
      let next = this.split(order);

      // Return a new root which holds the two leaves.
      return createRoot(this, next);
    }

    /**
     * Delete an item from the leaf node.
     */
    delete(key: K, cmp: (a: K, b: K) => number, order: number): Node<K, V> {
      this.deleteInternal(key, cmp, order);
      return this;
    }

    /**
     * Remove an item from the leaf node.
     */
    removeAt(index: number, order: number): Node<K, V> {
      this.removeAtInternal(index, order);
      return this;
    }

    /**
     * Clear the contents of the leaf node.
     */
    clear(): void {
      this.next = null;
      this.prev = null;
      this.keys.length = 0;
      this.values.length = 0;
    }

    /**
     * Dump the contents of the tree into a simple tree representation.
     */
    dump(): BTree.ILeafRepr<K, V> {
      let type = this.type;
      let size = this.size;
      let keys = this.keys.slice();
      let values = this.values.slice();
      return { type, size, keys, values };
    }

    /**
     * Perform an actual insert in the leaf node.
     *
     * This may cause the node to become overfull.
     */
    insertInternal(key: K, value: V, cmp: (a: K, b: K) => number, order: number): void {
      // Find the key index for the given key.
      let i = linearFindKeyIndex(this.keys, key, cmp);

      // If the key already exists, simply update the value in-place.
      if (i >= 0) {
        this.values[i] = value;
        return;
      }

      // Otherwise, insert the new item at the proper location.
      ArrayExt.insert(this.keys, -i - 1, key);
      ArrayExt.insert(this.values, -i - 1, value);
    }

    /**
     * Perform an actual delete from the leaf node.
     */
    deleteInternal(key: K, cmp: (a: K, b: K) => number, order: number): void {
      // Find the key index for the given key.
      let i = linearFindKeyIndex(this.keys, key, cmp);

      // Bail early if the key does not exist.
      if (i < 0) {
        return;
      }

      // Remove the item at the computed index.
      return this.removeAtInternal(i, order);
    }

    /**
     * Perform an actual remove from the leaf node.
     */
    removeAtInternal(index: number, order: number): void {
      ArrayExt.removeAt(this.keys, index);
      ArrayExt.removeAt(this.values, index);
    }

    /**
     * Split the node to the right and return the new sibling.
     *
     * This method assumes that the node is already overfull.
     */
    split(order: number): LeafNode<K, V> {
      // Create a new leaf node for the split.
      let next = new LeafNode<K, V>();

      // Compute the number of items for the split.
      let count = Math.floor(order / 2);

      // Copy the relevant items to the new leaf.
      for (let i = count, n = this.keys.length; i < n; ++i) {
        next.keys[i - count] = this.keys[i];
        next.values[i - count] = this.values[i];
      }

      // Remove the copied items from this leaf.
      this.keys.length = count;
      this.values.length = count;

      // Update the sibling links.
      next.next = this.next;
      next.prev = this;
      this.next = next;

      // Return the new sibling.
      return next;
    }
  }

  /**
   * Parse and normalize the order option for a B-Tree.
   */
  export
  function parseOrder<K>(options: BTree.IOptions<K>): number {
    let order = options.order !== undefined ? options.order: defaultOrder;
    return Math.max(minimumOrder, Math.floor(order));
  }

  /**
   * Bulk load items into a new tree.
   */
  export
  function bulkLoad<K, V>(items: IterableOrArrayLike<[K, V]>, order: number): Node<K, V> {
    // Set up the array to hold the leaf nodes.
    let leaves: LeafNode<K, V>[] = [new LeafNode<K, V>()];

    // Create and fill the leaf nodes with the items.
    each(items, ([key, value]) => {
      // Fetch the current leaf node.
      let leaf = leaves[leaves.length - 1];

      // If the current leaf is at capacity, create a new leaf.
      if (leaf.keys.length === order) {
        let next = new LeafNode<K, V>();
        next.prev = leaf;
        leaf.next = next;
        leaves.push(next);
        leaf = next;
      }

      // Add the item to the current leaf.
      leaf.keys.push(key);
      leaf.values.push(value);
    });

    // Set up the variable to hold the working nodes.
    let nodes: Node<K, V>[] = leaves;

    // Aggregate the working nodes until there is a single root.
    while (nodes.length > 1) {
      // Set up the array to hold the generated branch nodes.
      let branches: BranchNode<K, V>[] = [new BranchNode<K, V>()];

      // Create and fill the branches with the working nodes.
      for (let i = 0, n = nodes.length; i < n; ++i) {
        // Fetch the current working node.
        let node = nodes[i];

        // Fetch the current branch.
        let branch = branches[branches.length - 1];

        // If the current branch is at capacity, create a new branch.
        if (branch.keys.length === order) {
          branch = new BranchNode<K, V>();
          branches.push(branch);
        }

        // Add the current node to the branch.
        branch.size += node.size;
        branch.children.push(node);
        branch.sizes.push(node.size);
        branch.keys.push(node.keys[0]);
      }

      // Update the working nodes with the generated branches.
      nodes = branches;
    }

    // Return the root node.
    return nodes[0];
  }

  /**
   * The default order for a B-Tree.
   */
  const defaultOrder = 32;

  /**
   * The minimum order for a B-Tree.
   */
  const minimumOrder = 4;

  /**
   * A type alias for a node mapper function.
   */
  type NodeMapper<K, V, R> = (node: LeafNode<K, V>, index: number) => R;

  /**
   * An iterator mapper for items.
   */
  function itemMapper<K, V>(node: LeafNode<K, V>, index: number): [K, V] {
    return [node.keys[index], node.values[index]];
  }

  /**
   * An iterator mapper for keys.
   */
  function keyMapper<K, V>(node: LeafNode<K, V>, index: number): K {
    return node.keys[index];
  }

  /**
   * An iterator mapper for values.
   */
  function valueMapper<K, V>(node: LeafNode<K, V>, index: number): V {
    return node.values[index];
  }

  /**
   * A forward iterator for B-Tree nodes.
   */
  class ForwardIterator<K, V, R> implements IIterator<R> {
    /**
     * Construct a new forward iterator.
     *
     * @param node - The first node in the chain.
     *
     * @param mapper - The mapper to extract data from the node.
     */
    constructor(node: LeafNode<K, V> | null, mapper: NodeMapper<K, V, R>) {
      this._node = node;
      this._mapper = mapper;
    }

    /**
     * Get an iterator over the object's values.
     *
     * @returns An iterator which yields the object's values.
     */
    iter(): IIterator<R> {
      return this;
    }

    /**
     * Create an independent clone of the iterator.
     *
     * @returns A new independent clone of the iterator.
     */
    clone(): IIterator<R> {
      let clone = new ForwardIterator<K, V, R>(this._node, this._mapper);
      clone._index = this._index;
      return clone;
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): R | undefined {
      if (this._node === null) {
        return undefined;
      }
      if (this._index >= this._node.size) {
        this._index = 0;
        this._node = this._node.next;
        return this.next();
      }
      return this._mapper.call(undefined, this._node, this._index++);
    }

    private _index = 0;
    private _node: LeafNode<K, V> | null;
    private _mapper: NodeMapper<K, V, R>;
  }

  /**
   * A reverse iterator for B-Tree nodes.
   */
  class RetroIterator<K, V, R> implements IIterator<R> {
    /**
     * Construct a new retro iterator.
     *
     * @param node - The last node in the chain.
     *
     * @param mapper - The mapper to extract data from the node.
     */
    constructor(node: LeafNode<K, V> | null, mapper: NodeMapper<K, V, R>) {
      this._node = node;
      this._mapper = mapper;
    }

    /**
     * Get an iterator over the object's values.
     *
     * @returns An iterator which yields the object's values.
     */
    iter(): IIterator<R> {
      return this;
    }

    /**
     * Create an independent clone of the iterator.
     *
     * @returns A new independent clone of the iterator.
     */
    clone(): IIterator<R> {
      let clone = new RetroIterator<K, V, R>(this._node, this._mapper);
      clone._index  = this._index;
      return clone;
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): R | undefined {
      if (this._node === null) {
        return undefined;
      }
      if (this._index >= this._node.size) {
        this._index = 0;
        this._node = this._node.prev;
        return this.next();
      }
      return this._mapper.call(undefined, this._node, this._node.size - this._index++ - 1);
    }

    private _index = 0;
    private _node: LeafNode<K, V> | null;
    private _mapper: NodeMapper<K, V, R>;
  }

  /**
   * Find the pivot index for a key using a linear search.
   */
  function linearFindPivotIndex<K>(keys: K[], key: K, cmp: (a: K, b: K) => number): number {
    for (let i = 1, n = keys.length; i < n; ++i) {
      if (cmp(keys[i], key) > 0) {
        return i - 1;
      }
    }
    return keys.length - 1;
  }

  /**
   * Find the key index using a linear search.
   */
  function linearFindKeyIndex<K>(keys: K[], key: K, cmp: (a: K, b: K) => number): number {
    for (let i = 0, n = keys.length; i < n; ++i) {
      let c = cmp(keys[i], key);
      if (c === 0) {
        return i;
      }
      if (c > 0) {
        return -i - 1;
      }
    }
    return -keys.length - 1;
  }

  /**
   * Find the local index using a linear search.
   */
  function linearFindLocalIndex(sizes: number[], index: number): { i: number, local: number } {
    for (let i = 0, n = sizes.length; i < n; ++i) {
      if (index < sizes[i]) {
        return { i, local: index };
      }
      index -= sizes[i];
    }
    throw 'unreachable';
  }

  /**
   * Compute the sum of the first `n` sizes.
   */
  function linearComputeSum(sizes: number[], n: number): number {
    let sum = 0;
    for (let i = 0; i < n; ++i) {
      sum += sizes[i];
    }
    return sum;
  }

  /**
   * Create a root node which holds two children.
   */
  function createRoot<K, V>(first: Node<K, V>, second: Node<K, V>): BranchNode<K, V> {
    let root = new BranchNode<K, V>();
    root.size = first.size + second.size;
    root.keys[0] = first.keys[0];
    root.keys[1] = second.keys[0];
    root.sizes[0] = first.size;
    root.sizes[1] = second.size;
    root.children[0] = first;
    root.children[1] = second;
    return root;
  }
}
