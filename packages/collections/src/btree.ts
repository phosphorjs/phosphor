/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike, each, toArray
} from '@phosphor/algorithm';


/**
 * A generic B+ tree.
 */
export
class BTree<K, V> implements IIterable<[K, V]>, IRetroable<[K, V]> {
  /**
   * Construct a new B-tree.
   *
   * @param options - The options for initializing the tree.
   */
  constructor(options: BTree.IOptions<K>) {
    this._state = new Private.State<K, V>(options);
  }

  /**
   * The key comparison function for the tree.
   *
   * #### Complexity
   * Constant.
   */
  get cmp(): (a: K, b: K) => number {
    return this._state.cmp;
  }

  /**
   * The arity of the tree.
   *
   * #### Complexity
   * Constant.
   */
  get arity(): number {
    return this._state.arity;
  }

  /**
   * Whether the tree is empty.
   *
   * #### Complexity
   * Constant.
   */
  get isEmpty(): boolean {
    return this._state.root.size === 0;
  }

  /**
   * The size of the tree.
   *
   * #### Complexity
   * Constant.
   */
  get size(): number {
    return this._state.root.size;
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
    let { size, keys, values } = this._state.first;
    return size > 0 ? [keys[0], values[0]] : undefined;
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
    let { size, keys, values } = this._state.last;
    return size > 0 ? [keys[size - 1], values[size - 1]] : undefined;
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
    let { size, keys } = this._state.first;
    return size > 0 ? keys[0] : undefined;
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
    let { size, keys } = this._state.last;
    return size > 0 ? keys[size - 1] : undefined;
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
    let { size, values } = this._state.first;
    return size > 0 ? values[0] : undefined;
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
    let { size, values } = this._state.last;
    return size > 0 ? values[size - 1] : undefined;
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
    return Private.iterItems(this._state);
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
    return Private.retroItems(this._state);
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
    return Private.iterKeys(this._state);
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
    return Private.retroKeys(this._state);
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
    return Private.iterValues(this._state);
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
    return Private.retroValues(this._state);
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
    return Private.itemAt(this._state, index);
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
    return Private.keyAt(this._state, index);
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
    return Private.valueAt(this._state, index);
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
    return Private.hasKey(this._state, key);
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
    return Private.getValue(this._state, key);
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
    return Private.indexOf(this._state, key);
  }

  /**
   * Assign new items to the tree, replacing all current items.
   *
   * @param items - The items to assign to the tree.
   *
   * #### Complexity
   *
   */
  assign(items: IterableOrArrayLike<[K, V]>): void {
    Private.assignItems(this._state, items);
  }

  /**
   * Insert an item into the tree.
   *
   * @param key - The key to insert.
   *
   * @param value - The value for the given key.
   *
   * @param out - This can be provided to obtain more information
   *   about the result of the insert operation. An out parameter
   *   is used for performance, to prevent the need to allocate a
   *   new return object on each insert.
   *
   * #### Complexity
   * Logarithmic.
   */
  insert(key: K, value: V, out?: BTree.IOutArgs<K, V>): void {
    Private.insertItem(this._state, key, value, out);
  }

  /**
   * Delete an item in the tree.
   *
   * @param key - The key of the item to delete.
   *
   * @param out - This can be provided to obtain more information
   *   about the result of the delete operation. An out parameter
   *   is used for performance, to prevent the need to allocate a
   *   new return object on each delete.
   *
   * #### Complexity
   * Logarithmic.
   */
  delete(key: K, out?: BTree.IOutArgs<K, V>): void {
    Private.deleteItem(this._state, key, out);
  }

  /**
   * Remove an item from the tree.
   *
   * @param index - The index of the item to remove.
   *
   * @param out - This can be provided to obtain more information
   *   about the result of the remove operation. An out parameter
   *   is used for performance, to prevent the need to allocate a
   *   new return object on each remove.
   *
   * #### Complexity
   * Logarithmic.
   */
  remove(index: number, out?: BTree.IOutArgs<K, V>): void {
    Private.removeItem(this._state, index, out);
  }

  /**
   * Clear the contents of the tree.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void {
    Private.clearItems(this._state);
  }

  private _state: Private.State<K, V>;
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

  /**
   * An object which holds the result of a B-Tree modification.
   */
  export
  interface IOutArgs<K, V> {
    /**
     * The index of the modification.
     *
     * On `insert()`, this is the index of the inserted item.
     *
     * On `delete()`, this is the index of the deleted item, or `-1` if
     * the specified key does not exist in the tree.
     *
     * On `remove()`, this is the index of the removed item, or `-1` if
     * the specified index is out of range.
     */
    index: number;

    /**
     * The relevant key for the modification.
     *
     * On `insert()`, this is the key that was inserted.
     *
     * On `delete()`, this is the deleted key, or `undefined` if the
     * specified key does not exist in the tree.
     *
     * On `remove()`, this is the removed key, or `undefined` if the
     * specified index is out of range.
     */
    key: K | undefined;

    /**
     * The relevant value for the modification.
     *
     * On `insert()`, this is the previous value for an existing key,
     * or `undefined` if the specified key is newly inserted.
     *
     * On `delete()`, this is the value for the deleted key, or
     * `undefined` if the specified key does not exist in the tree.
     *
     * On `remove()`, this is the value for the removed index, or
     * `undefined` if the specified index is out of range.
     */
    value: V | undefined;
  }

  /**
   * A convenience function for creating a new out args object.
   *
   * @returns A new default initialized out args object.
   */
  export
  function createOutArgs<K, V>(): IOutArgs<K, V> {
    return { index: -1, key: undefined, value: undefined };
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An enum of the B-Tree node types.
   */
  export
  const enum NodeType { Branch, Leaf }

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
     * The parent branch node of this branch node.
     */
    parent: BranchNode<K, V> | null = null;

    /**
     * The total number of items held in the branch subtree.
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
     * The discriminated type of the branch node.
     */
    readonly type: NodeType.Branch = NodeType.Branch;
  }

  /**
   * A class representing a leaf node in a B-tree.
   */
  export
  class LeafNode<K, V> {
    /**
     * The parent branch node of this leaf node.
     */
    parent: BranchNode<K, V> | null = null;

    /**
     * The next sibling leaf node of this leaf node.
     */
    next: LeafNode<K, V> | null = null;

    /**
     * The previous sibling leaf node of this leaf node.
     */
    prev: LeafNode<K, V> | null = null;

    /**
     * The total number of items held in the leaf node.
     */
    size = 0;

    /**
     * The ordered keys for the leaf node.
     */
    readonly keys: K[] = [];

    /**
     * The ordered values for the leaf node.
     */
    readonly values: V[] = [];

    /**
     * The discriminated type of the leaf node.
     */
    readonly type: NodeType.Leaf = NodeType.Leaf;
  }

  /**
   * A class which holds the state of a B-tree.
   */
  export
  class State<K, V> {
    /**
     * The root node of the B-tree.
     */
    root: Node<K, V>;

    /**
     * The first leaf node of the B-tree.
     */
    first: LeafNode<K, V>;

    /**
     * The last leaf node of the B-tree.
     */
    last: LeafNode<K, V>;

    /**
     * The arity for the tree.
     */
    readonly arity: number;

    /**
     * The key comparison function for the tree.
     */
    readonly cmp: (a: K, b: K) => number;

    /**
     * Construct a new state object.
     *
     * @param options - The options for initializing the state.
     */
    constructor(options: BTree.IOptions<K>) {
      let node = new LeafNode<K, V>();
      this.root = node;
      this.first = node;
      this.last = node;
      this.cmp = options.cmp;
      this.arity = parseArity(options);
    }
  }

  /**
   * Create a forward iterator for the items in the tree.
   */
  export
  function iterItems<K, V>(state: State<K, V>): IIterator<[K, V]> {
    return new ForwardIterator<K, V, [K, V]>(state.first, itemMapper);
  }

  /**
   * Create a reverse iterator for the items in the tree.
   */
  export
  function retroItems<K, V>(state: State<K, V>): IIterator<[K, V]> {
    return new RetroIterator<K, V, [K, V]>(state.last, itemMapper);
  }

  /**
   * Create a forward iterator for the keys in the tree.
   */
  export
  function iterKeys<K, V>(state: State<K, V>): IIterator<K> {
    return new ForwardIterator<K, V, K>(state.first, keyMapper);
  }

  /**
   * Create a reverse iterator for the keys in the tree.
   */
  export
  function retroKeys<K, V>(state: State<K, V>): IIterator<K> {
    return new RetroIterator<K, V, K>(state.last, keyMapper);
  }

  /**
   * Create a forward iterator for the values in the tree.
   */
  export
  function iterValues<K, V>(state: State<K, V>): IIterator<V> {
    return new ForwardIterator<K, V, V>(state.first, valueMapper);
  }

  /**
   * Create a reverse iterator for the values in the tree.
   */
  export
  function retroValues<K, V>(state: State<K, V>): IIterator<V> {
    return new RetroIterator<K, V, V>(state.last, valueMapper);
  }

  /**
   * Get the item at a specified index.
   */
  export
  function itemAt<K, V>(state: State<K, V>, index: number): [K, V] | undefined {
    return getAt(state, index, GetAtMode.Item);
  }

  /**
   * Get the key at a specified index.
   */
  export
  function keyAt<K, V>(state: State<K, V>, index: number): K | undefined {
    return getAt(state, index, GetAtMode.Key);
  }

  /**
   * Get the value at a specified index.
   */
  export
  function valueAt<K, V>(state: State<K, V>, index: number): V | undefined {
    return getAt(state, index, GetAtMode.Value);
  }

  /**
   * Test whether the tree contains a given key.
   */
  export
  function hasKey<K, V>(state: State<K, V>, key: K): boolean {
    // Extract the relevant node data.
    let node = state.root;
    let cmp = state.cmp;

    // Step down the tree to the correct leaf node.
    while (node.type === NodeType.Branch) {
      // Find the pivot index for the branch.
      let i = linearFindPivotIndex(node.keys, key, cmp);

      // Step down to the next node.
      node = node.children[i];
    }

    // Check whether the leaf contains the key.
    return linearFindKeyIndex(node.keys, key, cmp) >= 0;
  }

  /**
   * Get the value for a specified key.
   */
  export
  function getValue<K, V>(state: State<K, V>, key: K): V | undefined {
    // Extract the relevant node data.
    let node = state.root;
    let cmp = state.cmp;

    // Step down the tree to the correct leaf node.
    while (node.type === NodeType.Branch) {
      // Find the pivot index for the branch.
      let i = linearFindPivotIndex(node.keys, key, cmp);

      // Step down to the next node.
      node = node.children[i];
    }

    // Find the index for the specified key.
    let i = linearFindKeyIndex(node.keys, key, cmp);

    // Return the corresponding value for the key.
    return i >= 0 ? node.values[i] : undefined;
  }

  /**
   * Get the index of a specified key.
   */
  export
  function indexOf<K, V>(state: State<K, V>, key: K): number {
    // Extract the relevant node data.
    let node = state.root;
    let cmp = state.cmp;

    // Initialize the index accumulator.
    let index = 0;

    // Step down the tree to the correct leaf node.
    while (node.type === NodeType.Branch) {
      // Find the pivot index for the branch.
      let i = linearFindPivotIndex(node.keys, key, cmp);

      // Update the index accumulator.
      for (let j = 0; j < i; ++j) {
        index += node.sizes[j];
      }

      // Step down to the next node.
      node = node.children[i];
    }

    // Find the index for the key.
    let i = linearFindKeyIndex(node.keys, key, cmp);

    // Return the computed index for the key.
    return i >= 0 ? index + i : -index + i - 1;
  }

  /**
   *
   */
  export
  function assignItems<K, V>(state: State<K, V>, items: IterableOrArrayLike<[K, V]>): void {
    //
    clearItems(state);

    //
    let { cmp, arity } = state;

    //
    let array = toArray(items).sort((a, b) => cmp(a[0], b[0]));

    //
    let leaves = [];

    //
    let leaf = new LeafNode<K, V>();

    //
    for (let i = 0, n = array.length; i < n; ++i) {
      //
      let [key, value] = array[i];

      //
      let n = leaf.keys.length;

      //
      if (n > 0 && cmp(leaf.keys[n - 1], key) === 0) {
        leaf.keys[n - 1] = key;
        leaf.values[n - 1] = value;
        continue;
      }

      //
      if (n === arity) {
        leaves.push(leaf);
        leaf = new LeafNode<K, V>();
      }

      //
      leaf.size++;
      leaf.keys.push(key);
      leaf.values.push(value);
    }

    //
    leaves.push(leaf);

    //
    for (let i = 1, n = leaves.length; i < n; ++i) {
      let prev = leaves[i - 1];
      let curr = leaves[i];
      prev.next = curr;
      curr.prev = prev;
    }

    //
    if (leaves.length === 1) {
      state.root = leaf;
      state.first = leaf;
      state.last = leaf;
      return;
    }

    //
    let branches: BranchNode<K, V>[] = [];

    //
    let branch = new BranchNode<K, V>();

    //
    for (let i = 0, n = leaves.length; i < n; ++i) {
      //
      let leaf = leaves[i];

      //
      if (branch.children.length === arity) {
        branches.push(branch);
        branch = new BranchNode<K, V>();
      }

      //
      leaf.parent = branch;

      //
      branch.sizes.push(leaf.size);
      branch.keys.push(leaf.keys[0]);
      branch.children.push(leaf);

      //
      branch.size += leaf.size;
    }

    //
    branches.push(branch);

    //
    while (branches.length > 1) {
      //
      let source = branches;

      //
      branches = [];

      //
      branch = new BranchNode<K, V>();

      //
      for (let i = 0, n = source.length; i < n; ++i) {
        //
        let node = source[i];

        //
        if (branch.children.length === arity) {
          branches.push(branch);
          branch = new BranchNode<K, V>();
        }

        //
        node.parent = branch;

        //
        branch.sizes.push(node.size);
        branch.keys.push(node.keys[0]);
        branch.children.push(node);

        //
        branch.size += node.size;
      }

      //
      branches.push(branch);
    }

    state.root = branches[0];
    state.first = leaves[0];
    state.last = leaves[leaves.length - 1];
  }

  /**
   *
   */
  export
  function insertItem<K, V>(state: State<K, V>, key: K, value: V, out?: BTree.IOutArgs<K, V>): void {

  }

  /**
   *
   */
  export
  function deleteItem<K, V>(state: State<K, V>, key: K, out?: BTree.IOutArgs<K, V>): void {

  }

  /**
   *
   */
  export
  function removeItem<K, V>(state: State<K, V>, index: number, out?: BTree.IOutArgs<K, V>): void {

  }

  /**
   * Clear all the items from the B-Tree
   */
  export
  function clearItems<K, V>(state: State<K, V>): void {
    // Recursively clear the nodes in the tree.
    recursiveClear(state.root);

    // Reset the initial state.
    state.root = state.last = state.first;
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
   * Parse and normalize the arity option for a B-Tree.
   */
  function parseArity<K>(options: BTree.IOptions<K>): number {
    let arity = options.arity !== undefined ? options.arity: defaultArity;
    return Math.max(minimumArity, Math.floor(arity));
  }

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
   * An enum of the `getAt` mode types.
   */
  const enum GetAtMode { Key, Value, Item }

  /**
   * Get the data at a specified index.
   */
  function getAt<K, V>(state: State<K, V>, index: number, mode: GetAtMode.Key): K | undefined;
  function getAt<K, V>(state: State<K, V>, index: number, mode: GetAtMode.Value): V | undefined;
  function getAt<K, V>(state: State<K, V>, index: number, mode: GetAtMode.Item): [K, V] | undefined;
  function getAt<K, V>(state: State<K, V>, index: number, mode: GetAtMode): K | V | [K, V] | undefined {
    // Fetch the root node from the state.
    let node = state.root;

    // Wrap negative indices.
    if (index < 0) {
      index += node.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= node.size) {
      return undefined;
    }

    // Step down the tree to the correct leaf node.
    while (node.type === NodeType.Branch) {
      // Extract the relevant node data.
      let { sizes, children } = node;

      // Linear search for the next node.
      for (let i = 0, n = sizes.length; i < n; ++i) {
        // Update the target node.
        node = children[i];

        // Stop searching if the index is within bounds.
        if (index < sizes[i]) {
          break;
        }

        // Otherwise, update the index and continue searching.
        index -= sizes[i];
      }
    }

    // Bail if the index is out of range.
    if (index >= node.size) {
      return undefined;
    }

    // Set up the result.
    let result: K | V | [K, V];

    // Compute the result based on the mode type.
    switch (mode) {
    case GetAtMode.Key:
      result = node.keys[index];
      break;
    case GetAtMode.Value:
      result = node.values[index];
      break;
    case GetAtMode.Item:
      result = [node.keys[index], node.values[index]];
      break;
    default:
      throw 'unreachable';
    }

    // Return the result.
    return result;
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
        return -i;
      }
    }
    return -keys.length;
  }

  /**
   * Recursively clear a subtree starting at the given node.
   */
  function recursiveClear<K, V>(node: Node<K, V>): void {
    if (node.type === NodeType.Branch) {
      each(node.children, recursiveClear);
      node.size = 0;
      node.parent = null;
      node.keys.length = 0;
      node.sizes.length = 0;
      node.children.length = 0;
    } else {
      node.parent = null;
      node.next = null;
      node.prev = null;
      node.size = 0;
      node.keys.length = 0;
      node.values.length = 0;
    }
  }
}
