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
    this._arity = Private.parseArity(options);
    this._cmp = options.cmp;
  }

  /**
   * The arity of the tree.
   *
   * #### Complexity
   * Constant.
   */
  get arity(): number {
    return this._arity;
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
    return this._root.firstLeaf.firstItem;
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
    return this._root.lastLeaf.lastItem;
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
    return this._root.firstLeaf.firstKey;
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
    return this._root.lastLeaf.lastKey;
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
    return this._root.firstLeaf.firstValue;
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
    return this._root.lastLeaf.lastValue;
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
    return this._root.firstLeaf.iterItems();
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
    return this._root.lastLeaf.retroItems();
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
    return this._root.firstLeaf.iterKeys();
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
    return this._root.lastLeaf.retroKeys();
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
    return this._root.firstLeaf.iterValues();
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
    return this._root.lastLeaf.retroValues();
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
   * An `items` which is not sorted or contains duplicate keys.
   *
   * #### Complexity
   * Linear.
   */
  assign(items: IterableOrArrayLike<[K, V]>): void {
    this._root.clear();
    this._root = Private.bulkLoad(items, this._arity);
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
    this._root = this._root.insert(key, value, this._cmp, this._arity, null, -1);
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
    //Private.deleteItem(this._state, key, out);
  }

  /**
   * Remove an item from the tree.
   *
   * @param index - The index of the item to remove.
   *
   * #### Complexity
   * Logarithmic.
   */
  remove(index: number): void {
    //Private.removeItem(this._state, index, out);
  }

  /**
   * Clear the contents of the tree.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void {
    this._root.clear();
    this._root = new Private.LeafNode<K, V>();
  }

  private _arity: number;
  private _cmp: (a: K, b: K) => number;
  private _root: Private.Node<K, V> = new Private.LeafNode<K, V>();
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
     * The arity of the tree.
     *
     * A larger arity creates a wider tree.
     *
     * This minimum is `4`, the default is `32`.
     */
    arity?: number;
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
     * The first leaf node in the subtree.
     */
    firstLeaf: LeafNode<K, V>;

    /**
     * The last leaf node in the subtree.
     */
    lastLeaf: LeafNode<K, V>;

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
    insert(key: K, value: V, cmp: (a: K, b: K) => number, arity: number, parent: BranchNode<K, V> | null, index: number): Node<K, V> {
      // Find the pivot index for the given key.
      let i = linearFindPivotIndex(this.keys, key, cmp);

      // Fetch the current size of the branch.
      let prevSize = this.size;

      // Step down the tree to perform the insert.
      this.children[i].insert(key, value, cmp, arity, this, i);

      // Fetch the updated size of the branch.
      let currSize = this.size;

      // Bail early if the size did not change.
      if (prevSize === currSize) {
        return this;
      }

      // Update the first and last leaves.
      this.firstLeaf = this.children[0].firstLeaf;
      this.lastLeaf = this.children[this.children.length - 1].lastLeaf;

      // If there is a parent branch node, update its state.
      if (parent !== null) {
        parent.size++;
        parent.sizes[index]++;
        parent.keys[index] = this.keys[0];
      }

      // Bail early if the branch does not need to be split.
      if (this.keys.length <= arity) {
        return this;
      }

      // Create a new branch node for the split.
      let next = new BranchNode<K, V>();

      // Compute the number of items for the split.
      let count = Math.floor(arity / 2);

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

      // Update the first and last leaves.
      this.firstLeaf = this.children[0].firstLeaf;
      this.lastLeaf = this.children[this.children.length - 1].lastLeaf;
      next.firstLeaf = next.children[0].firstLeaf;
      next.lastLeaf = next.children[next.children.length - 1].lastLeaf;

      // If there is a parent branch node, update its state.
      if (parent !== null) {
        parent.sizes[index] = this.size;
        ArrayExt.insert(parent.children, index + 1, next);
        ArrayExt.insert(parent.sizes, index + 1, next.size);
        ArrayExt.insert(parent.keys, index + 1, next.keys[0]);
        return this;
      }

      // Otherwise, create a new root node.
      return createRoot(this, next);
    }

    /**
     * Clear the contents of the subtree.
     */
    clear(): void {
      each(this.children, child => child.clear());
      this.firstLeaf = null!;
      this.lastLeaf = null!;
      this.size = 0;
      this.keys.length = 0;
      this.sizes.length = 0;
      this.children.length = 0;
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
     * The total number of items held in the leaf node.
     */
    get size(): number {
      return this.keys.length;
    }

    /**
     * The first leaf node in the subtree.
     */
    get firstLeaf(): LeafNode<K, V> {
      return this;
    }

    /**
     * The last leaf node in the subtree.
     */
    get lastLeaf(): LeafNode<K, V> {
      return this;
    }

    /**
     * The first item in the leaf node, or `undefined`.
     */
    get firstItem(): [K, V] | undefined {
      let { size, keys, values } = this;
      return size >= 0 ? [keys[0], values[0]] : undefined;
    }

    /**
     * The last item in the leaf node, or `undefined`.
     */
    get lastItem(): [K, V] | undefined {
      let { size, keys, values } = this;
      return size >= 0 ? [keys[size - 1], values[size - 1]] : undefined;
    }

    /**
     * The first key in the leaf node, or `undefined`.
     */
    get firstKey(): K | undefined {
      let { size, keys } = this;
      return size >= 0 ? keys[0] : undefined;
    }

    /**
     * The last key in the leaf node, or `undefined`.
     */
    get lastKey(): K | undefined {
      let { size, keys } = this;
      return size >= 0 ? keys[size - 1] : undefined;
    }

    /**
     * The first value in the leaf node, or `undefined`.
     */
    get firstValue(): V | undefined {
      let { size, values } = this;
      return size >= 0 ? values[0] : undefined;
    }

    /**
     * The last value in the leaf node, or `undefined`.
     */
    get lastValue(): V | undefined {
      let { size, values } = this;
      return size >= 0 ? values[size - 1] : undefined;
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
     * Insert an item into the leaf.
     */
    insert(key: K, value: V, cmp: (a: K, b: K) => number, arity: number, parent: BranchNode<K, V> | null, index: number): Node<K, V> {
      // Find the key index for the given key.
      let ki = linearFindKeyIndex(this.keys, key, cmp);

      // If the key already exists, update the value in place.
      if (ki >= 0) {
        this.values[ki] = value;
        return this;
      }

      // Adjust the key index to the insert index.
      ki = -ki - 1;

      // Insert the item into the leaf node.
      ArrayExt.insert(this.keys, ki, key);
      ArrayExt.insert(this.values, ki, value);

      // If there is a parent branch node, update its state.
      if (parent !== null) {
        parent.size++;
        parent.sizes[index]++;
        parent.keys[index] = this.keys[0];
      }

      // Bail early if the leaf does not need to be split.
      if (this.keys.length <= arity) {
        return this;
      }

      // Create a new leaf node for the split.
      let next = new LeafNode<K, V>();

      // Compute the number of items for the split.
      let count = Math.floor(this.size / 2);

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

      // If there is a parent branch node, update its state.
      if (parent !== null) {
        parent.sizes[index] = this.size;
        ArrayExt.insert(parent.children, index + 1, next);
        ArrayExt.insert(parent.sizes, index + 1, next.size);
        ArrayExt.insert(parent.keys, index + 1, next.keys[0]);
        return this;
      }

      // Otherwise, create a new root node.
      return createRoot(this, next);
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
  }

  /**
   * Parse and normalize the arity option for a B-Tree.
   */
  export
  function parseArity<K>(options: BTree.IOptions<K>): number {
    let arity = options.arity !== undefined ? options.arity: defaultArity;
    return Math.max(minimumArity, Math.floor(arity));
  }

  /**
   * Bulk load items into a new tree.
   */
  export
  function bulkLoad<K, V>(items: IterableOrArrayLike<[K, V]>, arity: number): Node<K, V> {
    // Set up the array to hold the leaf nodes.
    let leaves: LeafNode<K, V>[] = [new LeafNode<K, V>()];

    // Create and fill the leaf nodes with the items.
    each(items, ([key, value]) => {
      // Fetch the current leaf node.
      let leaf = leaves[leaves.length - 1];

      // If the current leaf is at capacity, create a new leaf.
      if (leaf.keys.length === arity) {
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
        if (branch.keys.length === arity) {
          branch = new BranchNode<K, V>();
          branches.push(branch);
        }

        // Add the current node to the branch.
        branch.size += node.size;
        branch.children.push(node);
        branch.sizes.push(node.size);
        branch.keys.push(node.keys[0]);
      }

      // Set the first and last leaves on the branches.
      for (let i = 0, n = branches.length; i < n; ++i) {
        let branch = branches[0];
        let children = branch.children;
        branch.firstLeaf = children[0].firstLeaf;
        branch.lastLeaf = children[children.length - 1].lastLeaf;
      }

      // Update the working nodes with the generated branches.
      nodes = branches;
    }

    // Return the root node.
    return nodes[0];
  }

  /**
   * The default arity for a B-Tree.
   */
  const defaultArity = 32;

  /**
   * The minimum allowed arity for a B-Tree.
   */
  const minimumArity = 4;

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
    root.firstLeaf = first.firstLeaf;
    root.lastLeaf = second.lastLeaf;
    return root;
  }
}
