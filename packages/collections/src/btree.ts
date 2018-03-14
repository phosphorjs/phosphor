/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 *
 */
export
class BTree<K, V> implements IIterable<[K, V]>, IRetroable<[K, V]> {
  /**
   * Construct a new B-tree.
   *
   * @param cmp - The key comparison function for the tree.
   */
  constructor(cmp: (a: K, b: K) => number) {
    this.cmp = cmp;
  }

  /**
   * The key comparison function for the tree.
   *
   * #### Complexity
   * Constant.
   */
  readonly cmp: (a: K, b: K) => number;

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
    return Private.iterItems(this._state.first);
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
    return Private.retroItems(this._state.last);
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
    return Private.iterKeys(this._state.first);
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
    return Private.retroKeys(this._state.last);
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
    return Private.iterValues(this._state.first);
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
    return Private.retroValues(this._state.last);
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
    return Private.itemAt(this._state.root, index);
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
    return Private.keyAt(this._state.root, index);
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
    return Private.valueAt(this._state.root, index);
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
    return Private.hasKey(this._state.root, key);
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
    return Private.getValue(this._state.root, key);
  }

  /**
   *
   * #### Complexity
   * Logarithmic.
   */
  indexOf(key: K): number {
    return Private.indexOf(this._state.root, key);
  }

  /**
   *
   * #### Complexity
   * Logarithmic.
   */
  insert(key: K, value: V): void {
    //
    Private.insertItem(this._state, key, value);

    //
    if (out === undefined) {
      return;
    }

    //
    out.index = Private.outIndex;
    out.value = Private.outValue;

    //
    Private.outIndex = -1;
    Private.outValue = undefined;
  }

  /**
   *
   * #### Complexity
   * Logarithmic.
   */
  delete(key: K): void {
    //
    Private.deleteItem(this._state, key);

    //
    if (out === undefined) {
      return;
    }

    //
    out.index = Private.outIndex;
    out.value = Private.outValue;

    //
    Private.outIndex = -1;
    Private.outValue = undefined;
  }

  /**
   *
   * #### Complexity
   * Logarithmic.
   */
  remove(index: number): void {
    //
    Private.removeItem(this._state, index);

    //
    if (out === undefined) {
      return;
    }

    //
    out.key = Private.outKey;
    out.value = Private.outValue;

    //
    Private.outKey = undefined;
    Private.outValue = undefined;
  }

  /**
   *
   * #### Complexity
   * Linear.
   */
  clear(): void {
    Private.clear(this._state);
  }

  private _state = Private.createState<K, V>();
}


/**
 *
 */
export
namespace BTree {
  /**
   *
   */
  export
  type InsertOutArg<V> = {
    /**
     *
     */
    index: number;

    /**
     *
     */
    value: V | undefined;
  };

  /**
   *
   */
  export
  type DeleteOutArg<V> = {
    /**
     *
     */
    index: number;

    /**
     *
     */
    value: V | undefined;
  };

  /**
   *
   */
  export
  type RemoveOutArg<K, V> = {
    /**
     *
     */
    key: K | undefined;

    /**
     *
     */
    value: V | undefined;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   *
   */
  export
  let outIndex: number = -1;

  /**
   *
   */
  export
  let outKey: any = undefined;

  /**
   *
   */
  export
  let outValue: any = undefined;

  /**
   * A type
   */
  export
  type Node<K, V> = BranchNode<K, V> | LeafNode<K, V>;

  /**
   *
   */
  export
  class BranchNode<K, V> {
    /**
     *
     */
    readonly type: 'branch' = 'branch';

    /**
     *
     */
    readonly keys: K[] = [];

    /**
     *
     */
    readonly nodes: Node<K, V>[] = [];

    /**
     *
     */
    size = 0;
  }

  /**
   *
   */
  export
  class LeafNode<K, V> {
    /**
     *
     */
    readonly type: 'leaf' = 'leaf';

    /**
     *
     */
    readonly keys: K[] = [];

    /**
     *
     */
    readonly values: T[] = [];

    /**
     *
     */
    size = 0;

    /**
     *
     */
    next: LeafNode<K, V> | null = null;

    /**
     *
     */
    prev: LeafNode<K, V> | null = null;
  }

  /**
   *
   */
  export
  type State<K, V> = {
    /**
     *
     */
    root: Node<K, V>;

    /**
     *
     */
    first: LeafNode<K, V>;

    /**
     *
     */
    last: LeafNode<K, V>;
  };

  /**
   *
   */
  export
  function createState<K, V>(): State<K, V> {
    let node = new LeafNode<K, V>();
    return { root: node, first: node, last: node };
  }

  /**
   *
   */
  export
  function iterItems<K, V>(node: LeafNode<K, V>): IIterator<[K, V]> {
    return new ForwardIterator<K, V, [K, V]>(node, pullItem);
  }

  /**
   *
   */
  export
  function retroItems<K, V>(node: LeafNode<K, V>): IIterator<[K, V]> {
    return new RetroIterator<K, V, [K, V]>(node, pullItem);
  }

  /**
   *
   */
  export
  function iterKeys<K, V>(node: LeafNode<K, V>): IIterator<K> {
    return new ForwardIterator<K, V, K>(node, pullKey);
  }

  /**
   *
   */
  export
  function retroKeys<K, V>(node: LeafNode<K, V>): IIterator<K> {
    return new RetroIterator<K, V, K>(node, pullKey);
  }

  /**
   *
   */
  export
  function iterValues<K, V>(node: LeafNode<K, V>): IIterator<V> {
    return new ForwardIterator<K, V, V>(node, pullValue);
  }

  /**
   *
   */
  export
  function retroValues<K, V>(node: LeafNode<K, V>): IIterator<V> {
    return new RetroIterator<K, V, V>(node, pullValue);
  }

  /**
   *
   */
  export
  function itemAt<K, V>(root: TreeNode<K, V>, index: number): [K, V] | undefined {

  }

  /**
   *
   */
  export
  function keyAt<K, V>(root: TreeNode<K, V>, index: number): K | undefined {

  }

  /**
   *
   */
  export
  function valueAt<K, V>(root: TreeNode<K, V>, index: number): V | undefined {

  }

  /**
   *
   */
  export
  function valueFor<K, V>(root: TreeNode<K, V>, key: K): V | undefined {

  }

  /**
   *
   */
  export
  function keyIndex<K, V>(root: TreeNode<K, V>, key: K): number {

  }

  /**
   *
   */
  function pullItem<K, V>(node: LeafNode<K, V>, index: number): [K, V] {
    return [node.keys[index], node.values[index]];
  }

  /**
   *
   */
  function pullKey<K, V>(node: LeafNode<K, V>, index: number): K {
    return node.keys[index];
  }

  /**
   *
   */
  function pullValue<K, V>(node: LeafNode<K, V>, index: number): V {
    return node.values[index];
  }

  /**
   *
   */
  type Puller<K, V, R> = (node: LeafNode<K, V>, index: number) => R;

  /**
   *
   */
  class ForwardIterator<K, V, R> implements IIterator<R> {
    /**
     *
     */
    constructor(node: LeafNode<K, V> | null, puller: Puller<K, V, R>) {
      this._node = node;
      this._puller = puller;
    }

    /**
     *
     */
    iter(): IIterator<R> {
      return this;
    }

    /**
     *
     */
    clone(): IIterator<R> {
      let clone = new ForwardIterator<K, V, R>(this._node, this._puller);
      clone._index  = this._index;
      return clone;
    }

    /**
     *
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
      return this._puller.call(undefined, node, this._index++);
    }

    private _index = 0;
    private _puller: Puller<K, V, R>;
    private _node: LeafNode<K, V> | null;
  }

  /**
   *
   */
  class RetroIterator<K, V, R> implements IIterator<R> {
    /**
     *
     */
    constructor(node: LeafNode<K, V> | null, puller: Puller<K, V, R>) {
      this._node = node;
      this._puller = puller;
    }

    /**
     *
     */
    iter(): IIterator<R> {
      return this;
    }

    /**
     *
     */
    clone(): IIterator<R> {
      let clone = new RetroIterator<K, V, R>(this._node, this._puller);
      clone._index  = this._index;
      return clone;
    }

    /**
     *
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
      return this._puller.call(undefined, node, this._node.size - this._index++ - 1);
    }

    private _index = 0;
    private _puller: Puller<K, V, R>;
    private _node: LeafNode<K, V> | null;
  }
}
