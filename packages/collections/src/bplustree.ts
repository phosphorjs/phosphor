/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, IIterator, IterableOrArrayLike, each, empty
} from '@phosphor/algorithm';


/**
 * The namespace for B+ tree utilities.
 *
 * #### Warning
 * This namespace is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
namespace BPlusTree {
  /**
   * A const enum of the B+ tree node types.
   */
  export
  const enum NodeType {
    ListBranch,
    SetBranch,
    MapBranch,
    ListLeaf,
    SetLeaf,
    MapLeaf
  }

  /**
   * A branch node in a B+ tree list.
   */
  export
  class ListBranch<V> {
    /**
     * The cumulative sizes of each child subtree.
     */
    readonly sizes: number[] = [];

    /**
     * The child nodes of this branch node.
     */
    readonly children: ListNode<V>[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.ListBranch {
      return NodeType.ListBranch
    }

    /**
     * The total number of values in the subtree.
     */
    get size(): number {
      return this.sizes[this.sizes.length - 1];
    }

    /**
     * The tree width of the node.
     */
    get width(): number {
      return this.children.length;
    }
  }

  /**
   * A leaf node in a B+ tree list.
   */
  export
  class ListLeaf<V> {
    /**
     * The next sibling leaf node of this leaf node.
     */
    next: ListLeaf<V> | null = null;

    /**
     * The previous sibling leaf node of this leaf node.
     */
    prev: ListLeaf<V> | null = null;

    /**
     * The values of the leaf.
     */
    readonly values: V[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.ListLeaf {
      return NodeType.ListLeaf
    }

    /**
     * The total number of values in the leaf.
     */
    get size(): number {
      return this.values.length;
    }

    /**
     * The tree width of the node.
     */
    get width(): number {
      return this.values.length;
    }
  }

  /**
   * A branch node in a B+ tree set.
   */
  export
  class SetBranch<K> {
    /**
     * The left-most key of each child subtree.
     */
    readonly keys: K[] = [];

    /**
     * The cumulative sizes of each child subtree.
     */
    readonly sizes: number[] = [];

    /**
     * The child nodes of this branch node.
     */
    readonly children: SetNode<K>[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.SetBranch {
      return NodeType.SetBranch
    }

    /**
     * The total number of keys in the subtree.
     */
    get size(): number {
      return this.sizes[this.sizes.length - 1];
    }

    /**
     * The tree width of the node.
     */
    get width(): number {
      return this.children.length;
    }
  }

  /**
   * A leaf node in a B+ tree set.
   */
  export
  class SetLeaf<K> {
    /**
     * The next sibling leaf node of this leaf node.
     */
    next: SetLeaf<K> | null = null;

    /**
     * The previous sibling leaf node of this leaf node.
     */
    prev: SetLeaf<K> | null = null;

    /**
     * The ordered keys of the leaf.
     */
    readonly keys: K[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.SetLeaf {
      return NodeType.SetLeaf
    }

    /**
     * The total number of keys in the leaf.
     */
    get size(): number {
      return this.keys.length;
    }

    /**
     * The tree width of the node.
     */
    get width(): number {
      return this.keys.length;
    }
  }

  /**
   * A branch node in a B+ tree map.
   */
  export
  class MapBranch<K, V> {
    /**
     * The left-most key of each child subtree.
     */
    readonly keys: K[] = [];

    /**
     * The cumulative sizes of each child subtree.
     */
    readonly sizes: number[] = [];

    /**
     * The child nodes of this branch node.
     */
    readonly children: MapNode<K, V>[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.MapBranch {
      return NodeType.MapBranch
    }

    /**
     * The total number of items in the subtree.
     */
    get size(): number {
      return this.sizes[this.sizes.length - 1];
    }

    /**
     * The tree width of the node.
     */
    get width(): number {
      return this.children.length;
    }
  }

  /**
   * A leaf node in a B+ tree map.
   */
  export
  class MapLeaf<K, V> {
    /**
     * The next sibling leaf node of this leaf node.
     */
    next: MapLeaf<K, V> | null = null;

    /**
     * The previous sibling leaf node of this leaf node.
     */
    prev: MapLeaf<K, V> | null = null;

    /**
     * The ordered keys of the leaf.
     */
    readonly keys: K[] = [];

    /**
     * The ordered values of the leaf.
     */
    readonly values: V[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.MapLeaf {
      return NodeType.MapLeaf
    }

    /**
     * The total number of items in the leaf.
     */
    get size(): number {
      return this.keys.length;
    }

    /**
     * The tree width of the node.
     */
    get width(): number {
      return this.keys.length;
    }
  }

  /**
   * A type alias for the list nodes.
   */
  export
  type ListNode<V> = ListBranch<V> | ListLeaf<V>;

  /**
   * A type alias for the set nodes.
   */
  export
  type SetNode<K> = SetBranch<K> | SetLeaf<K>;

  /**
   * A type alias for the map nodes.
   */
  export
  type MapNode<K, V> = MapBranch<K, V> | MapLeaf<K, V>;

  /**
   * A type alias for the keyed branch nodes.
   */
  export
  type KeyedBranch<K> = SetBranch<K> | MapBranch<K, any>;

  /**
   * A type alias for the keyed leaf nodes.
   */
  export
  type KeyedLeaf<K> = SetLeaf<K> | MapLeaf<K, any>;

  /**
   * A type alias for the keyed nodes.
   */
  export
  type KeyedNode<K> = KeyedBranch<K> | KeyedLeaf<K>;

  /**
   * A type alias for the valued branch nodes.
   */
  export
  type ValuedBranch<V> = ListBranch<V> | MapBranch<any, V>;

  /**
   * A type alias for the valued leaf nodes.
   */
  export
  type ValuedLeaf<V> = ListLeaf<V> | MapLeaf<any, V>;

  /**
   * A type alias for the valued nodes.
   */
  export
  type ValuedNode<V> = ValuedBranch<V> | ValuedLeaf<V>;

  /**
   * A type alias for all the branch nodes.
   */
  export
  type Branch<K, V> = ListBranch<V> | SetBranch<K> | MapBranch<K, V>;

  /**
   * A type alias for all the leaf nodes.
   */
  export
  type Leaf<K, V> = ListLeaf<V> | SetLeaf<K> | MapLeaf<K, V>;

  /**
   * A type alias for all the nodes.
   */
  export
  type Node<K, V> = ListNode<V> | SetNode<K> | MapNode<K, V>;

  /**
   * A type guard function for branch nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a branch node.
   *
   * #### Complexity
   * `O(1)`
   */
  export function isBranchNode<K>(node: SetNode<K>): node is SetBranch<K>;
  export function isBranchNode<V>(node: ListNode<V>): node is ListBranch<V>;
  export function isBranchNode<K, V>(node: MapNode<K, V>): node is MapBranch<K, V>;
  export function isBranchNode<K>(node: KeyedNode<K>): node is KeyedBranch<K>;
  export function isBranchNode<V>(node: ValuedNode<V>): node is ValuedBranch<V>;
  export function isBranchNode<K, V>(node: Node<K, V>): node is Branch<K, V>;
  export function isBranchNode<K, V>(node: Node<K, V>): node is Branch<K, V> {
    return node.type <= NodeType.MapBranch;
  }

  /**
   * A type guard function for leaf nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a leaf node.
   *
   * #### Complexity
   * `O(1)`
   */
  export function isLeafNode<K>(node: SetNode<K>): node is SetLeaf<K>;
  export function isLeafNode<V>(node: ListNode<V>): node is ListLeaf<V>;
  export function isLeafNode<K, V>(node: MapNode<K, V>): node is MapLeaf<K, V>;
  export function isLeafNode<K>(node: KeyedNode<K>): node is KeyedLeaf<K>;
  export function isLeafNode<V>(node: ValuedNode<V>): node is ValuedLeaf<V>;
  export function isLeafNode<K, V>(node: Node<K, V>): node is Leaf<K, V>;
  export function isLeafNode<K, V>(node: Node<K, V>): node is Leaf<K, V> {
    return node.type > NodeType.MapBranch;
  }

  /**
   * A type guard function for keyed nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a keyed node.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function isKeyedNode<K, V>(node: Node<K, V>): node is KeyedNode<K> {
    return node.type !== NodeType.ListBranch && node.type !== NodeType.ListLeaf;
  }

  /**
   * A type guard function for keyed branch nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a keyed branch node.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function isKeyedBranch<K, V>(node: Node<K, V>): node is KeyedBranch<K> {
    return node.type === NodeType.SetBranch || node.type === NodeType.MapBranch;
  }

  /**
   * A type guard function for keyed leaf nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a keyed leaf node.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function isKeyedLeaf<K, V>(node: Node<K, V>): node is KeyedLeaf<K> {
    return node.type === NodeType.SetLeaf || node.type === NodeType.MapLeaf;
  }

  /**
   * A type guard function for valued nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a valued node.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function isValuedNode<K, V>(node: Node<K, V>): node is ValuedNode<V> {
    return node.type !== NodeType.SetBranch && node.type !== NodeType.SetLeaf;
  }

  /**
   * A type guard function for valued branch nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a valued branch node.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function isValuedBranch<K, V>(node: Node<K, V>): node is ValuedBranch<V> {
    return node.type === NodeType.ListBranch || node.type === NodeType.MapBranch;
  }

  /**
   * A type guard function for valued leaf nodes.
   *
   * @param node - The node of interest.
   *
   * @returns Whether the node is a valued leaf node.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function isValuedLeaf<K, V>(node: Node<K, V>): node is ValuedLeaf<V> {
    return node.type === NodeType.ListLeaf || node.type === NodeType.MapLeaf;
  }

  /**
   * Create a forward iterator for the keys in the tree.
   *
   * @param node - The leaf node of interest.
   *
   * @returns A new forward iterator starting with the first key.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function iterKeys<K>(node: KeyedLeaf<K>): IIterator<K> {
    return new ForwardIterator<K, any, K>(node, 0, -1, keyMapper);
  }

  /**
   * Create a reverse iterator for the keys in the tree.
   *
   * @param node - The leaf node of interest.
   *
   * @returns A new reverse iterator starting with the last key.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function retroKeys<K>(node: KeyedLeaf<K>): IIterator<K> {
    return new RetroIterator<K, any, K>(node, node.size - 1, -1, keyMapper);
  }

  /**
   * Create a forward iterator for the values in the tree.
   *
   * @param node - The leaf node of interest.
   *
   * @returns A new forward iterator starting with the first value.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function iterValues<V>(node: ValuedLeaf<V>): IIterator<V> {
    return new ForwardIterator<any, V, V>(node, 0, -1, valueMapper);
  }

  /**
   * Create a reverse iterator for the values in the tree.
   *
   * @param node - The leaf node of interest.
   *
   * @returns A new reverse iterator starting with the last value.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function retroValues<V>(node: ValuedLeaf<V>): IIterator<V> {
    return new RetroIterator<any, V, V>(node, node.size - 1, -1, valueMapper);
  }

  /**
   * Create a forward iterator for the items in the tree.
   *
   * @param node - The leaf node of interest.
   *
   * @returns A new forward iterator starting with the first item.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function iterItems<K, V>(node: MapLeaf<K, V>): IIterator<[K, V]> {
    return new ForwardIterator<K, V, [K, V]>(node, 0, -1, itemMapper);
  }

  /**
   * Create a reverse iterator for the items in the tree.
   *
   * @param node - The leaf node of interest.
   *
   * @returns A new reverse iterator starting with the last item.
   *
   * #### Complexity
   * `O(1)`
   */
  export
  function retroItems<K, V>(node: MapLeaf<K, V>): IIterator<[K, V]> {
    return new RetroIterator<K, V, [K, V]>(node, node.size - 1, -1, itemMapper);
  }

  /**
   * Create an iterator for a slice of keys in the tree.
   *
   * @param node - The root node of interest.
   *
   * @param start - The index of the first key, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the tree. The default is `0`.
   *
   * @param stop - The index of the last key, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the tree. The default is `size`.
   *
   * @returns A new iterator starting with the specified key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function sliceKeys<K>(node: KeyedNode<K>, start?: number, stop?: number): IIterator<K> {
    let { index, count } = forwardSliceRange(node.size, start, stop);
    if (count === 0) {
      return empty<K>();
    }
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return new ForwardIterator<K, any, K>(node, index, count, keyMapper);
  }

  /**
   * Create a reverse iterator for a slice of keys in the tree.
   *
   * @param node - The root node of interest.
   *
   * @param start - The index of the first key, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the tree. The default is `size - 1`.
   *
   * @param stop - The index of the last key, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the tree. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function retroSliceKeys<K>(node: KeyedNode<K>, start?: number, stop?: number): IIterator<K> {
    let { index, count } = retroSliceRange(node.size, start, stop);
    if (count === 0) {
      return empty<K>();
    }
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return new RetroIterator<K, any, K>(node, index, count, keyMapper);
  }

  /**
   * Create an iterator for a slice of values in the tree.
   *
   * @param node - The root node of interest.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the tree. The default is `0`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the tree. The default is `size`.
   *
   * @returns A new iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function sliceValues<V>(node: ValuedNode<V>, start?: number, stop?: number): IIterator<V> {
    let { index, count } = forwardSliceRange(node.size, start, stop);
    if (count === 0) {
      return empty<V>();
    }
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return new ForwardIterator<any, V, V>(node, index, count, valueMapper);
  }

  /**
   * Create a reverse iterator for a slice of values in the tree.
   *
   * @param node - The root node of interest.
   *
   * @param start - The index of the first value, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the tree. The default is `size - 1`.
   *
   * @param stop - The index of the last value, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the tree. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified value.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function retroSliceValues<V>(node: ValuedNode<V>, start?: number, stop?: number): IIterator<V> {
    let { index, count } = retroSliceRange(node.size, start, stop);
    if (count === 0) {
      return empty<V>();
    }
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return new RetroIterator<any, V, V>(node, index, count, valueMapper);
  }

  /**
   * Create an iterator for a slice of items in the tree.
   *
   * @param node - The root node of interest.
   *
   * @param start - The index of the first item, inclusive. This
   *   should be `< stop`. Negative values are taken as an offset
   *   from the end of the tree. The default is `0`.
   *
   * @param stop - The index of the last item, exclusive. This
   *   should be `> start`. Negative values are taken as an offset
   *   from the end of the tree. The default is `size`.
   *
   * @returns A new iterator starting with the specified item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function sliceItems<K, V>(node: MapNode<K, V>, start?: number, stop?: number): IIterator<[K, V]> {
    let { index, count } = forwardSliceRange(node.size, start, stop);
    if (count === 0) {
      return empty<[K, V]>();
    }
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return new ForwardIterator<K, V, [K, V]>(node, index, count, itemMapper);
  }

  /**
   * Create a reverse iterator for a slice of items in the tree.
   *
   * @param node - The root node of interest.
   *
   * @param start - The index of the first item, inclusive. This
   *   should be `> stop`. Negative values are taken as an offset
   *   from the end of the tree. The default is `size - 1`.
   *
   * @param stop - The index of the last item, exclusive. This
   *   should be `< start`. Negative values are taken as an offset
   *   from the end of the tree. The default is `-size - 1`.
   *
   * @returns A new reverse iterator starting with the specified item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function retroSliceItems<K, V>(node: MapNode<K, V>, start?: number, stop?: number): IIterator<[K, V]> {
    let { index, count } = retroSliceRange(node.size, start, stop);
    if (count === 0) {
      return empty<[K, V]>();
    }
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return new RetroIterator<K, V, [K, V]>(node, index, count, itemMapper);
  }

  /**
   * Get the first leaf node in the subtree.
   *
   * @param node - The node of interest.
   *
   * @returns The first leaf node in the subtree.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export function firstLeaf<V>(node: ListNode<V>): ListLeaf<V>;
  export function firstLeaf<K>(node: SetNode<K>): SetLeaf<K>;
  export function firstLeaf<K, V>(node: MapNode<K, V>): MapLeaf<K, V>;
  export function firstLeaf<K, V>(node: Node<K, V>): Leaf<K, V> {
    while (isBranchNode(node)) {
      node = node.children[0];
    }
    return node;
  }

  /**
   * Get the last leaf node in the subtree.
   *
   * @param node - The node of interest.
   *
   * @returns The last leaf node in the subtree.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export function lastLeaf<V>(node: ListNode<V>): ListLeaf<V>;
  export function lastLeaf<K>(node: SetNode<K>): SetLeaf<K>;
  export function lastLeaf<K, V>(node: MapNode<K, V>): MapLeaf<K, V>;
  export function lastLeaf<K, V>(node: Node<K, V>): Leaf<K, V> {
    while (isBranchNode(node)) {
      node = node.children[node.children.length - 1];
    }
    return node;
  }

  /**
   * Get the key at the specified index.
   *
   * @param node - The keyed node of interest.
   *
   * @param index - The in-bounds index of the desired key.
   *
   * @returns The key at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is out-of-bounds.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function keyAt<K>(node: KeyedNode<K>, index: number): K {
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return node.keys[index];
  }

  /**
   * Get the value at the specified index.
   *
   * @param node - The valued node of interest.
   *
   * @param index - The in-bounds index of the desired value.
   *
   * @returns The value at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is out-of-bounds.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function valueAt<V>(node: ValuedNode<V>, index: number): V {
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return node.values[index];
  }

  /**
   * Get the item at the specified index.
   *
   * @param node - The node of interest.
   *
   * @param index - The in-bounds index of the desired value.
   *
   * @returns The item at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is out-of-bounds.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function itemAt<K, V>(node: MapNode<K, V>, index: number): [K, V] {
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    return [node.keys[index], node.values[index]];
  }

  /**
   * Test whether the tree contains a given key.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns Whether the tree contains the given key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function hasKey<K>(node: KeyedNode<K>, key: K, cmp: (a: K, b: K) => number): boolean {
    while (isBranchNode(node)) {
      let i = findPivotIndexByKey(node.keys, key, cmp);
      node = node.children[i];
    }
    return findKeyIndex(node.keys, key, cmp) >= 0;
  }

  /**
   * Get the index of a particular key.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The index of the specified key. A negative value means
   *   that the key does not currently exist in the tree, but if the
   *   key were inserted it would reside at the index `-index - 1`.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function indexOf<K>(node: KeyedNode<K>, key: K, cmp: (a: K, b: K) => number): number {
    let index = 0;
    while (isBranchNode(node)) {
      let i = findPivotIndexByKey(node.keys, key, cmp);
      index += sumFirstN(node.sizes, i);
      node = node.children[i];
    }
    let i = findKeyIndex(node.keys, key, cmp);
    return i >= 0 ? index + i : -index + i;
  }

  /**
   * Get the value for a particular key.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The value for the specified key, or `undefined` if
   *   the tree does not have a value for the key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function getValue<K, V>(node: MapNode<K, V>, key: K, cmp: (a: K, b: K) => number): V | undefined {
    while (isBranchNode(node)) {
      let i = findPivotIndexByKey(node.keys, key, cmp);
      node = node.children[i];
    }
    let i = findKeyIndex(node.keys, key, cmp);
    return i >= 0 ? node.values[i] : undefined;
  }

  /**
   * Create a new tree set populated with the given keys.
   *
   * @param keys - The sorted unique keys of interest.
   *
   * @returns A new tree set populated with the given keys.
   *
   * #### Undefined Behavior
   * `keys` which are not sorted or which contain duplicates.
   *
   * #### Complexity
   * `O(n)`
   */
  export
  function assignSet<K>(keys: IterableOrArrayLike<K>): { root: SetNode<K>, first: SetLeaf<K>, last: SetLeaf<K> } {
    return assignInternal(NodeType.SetLeaf, keys);
  }

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
  function assignList<V>(values: IterableOrArrayLike<V>): { root: ListNode<V>, first: ListLeaf<V>, last: ListLeaf<V> } {
    return assignInternal(NodeType.ListLeaf, values);
  }

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
  function assignMap<K, V>(items: IterableOrArrayLike<[K, V]>): { root: MapNode<K, V>, first: MapLeaf<K, V>, last: MapLeaf<K, V> } {
    return assignInternal(NodeType.MapLeaf, items);
  }

  /**
   * Set the value at a particular index.
   *
   * @param node - The node of interest.
   *
   * @param index - The in-bounds index of interest.
   *
   * @param value - The value to set at the index.
   *
   * #### Undefined Behavior
   * An `index` which is out-of-bounds.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function setValueAt<V>(node: ValuedNode<V>, index: number, value: V): void {
    while (isBranchNode(node)) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }
    node.values[index] = value;
  }

  /**
   * Insert a value at a particular index.
   *
   * @param node - The node of interest.
   *
   * @param index - The in-bounds index of interest.
   *
   * @param value - The value to insert at the index.
   *
   * @returns The new root node for the tree.
   *
   * #### Undefined Behavior
   * An `index` which is out-of-bounds.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function insertAt<V>(node: ListNode<V>, index: number, value: V): ListNode<V> {
    insertAtInternal(node, index, value);
    return maybeSplitRoot(node);
  }

  /**
   * Add a key to the tree.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The new root node for the tree.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function addKey<K>(node: SetNode<K>, key: K, cmp: (a: K, b: K) => number): SetNode<K> {
    addKeyInternal(node, key, cmp);
    return maybeSplitRoot(node);
  }

  /**
   * Set the value for a particular key.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param value - The value to set for the given key.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The new root node for the tree.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function setValue<K, V>(node: MapNode<K, V>, key: K, value: V, cmp: (a: K, b: K) => number): MapNode<K, V> {
    setValueInternal(node, key, value, cmp);
    return maybeSplitRoot(node);
  }

  /**
   * Delete a item from the tree.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The new root node for the tree.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export function deleteKey<K>(node: SetNode<K>, key: K, cmp: (a: K, b: K) => number): SetNode<K>;
  export function deleteKey<K, V>(node: MapNode<K, V>, key: K, cmp: (a: K, b: K) => number): MapNode<K, V>;
  export function deleteKey<K>(node: KeyedNode<K>, key: K, cmp: (a: K, b: K) => number): KeyedNode<K> {
    deleteKeyInternal(node, key, cmp);
    return maybeExtractRoot(node);
  }

  /**
   * Rempve a item from the tree.
   *
   * @param node - The node of interest.
   *
   * @param index - The in-bounds index of interest.
   *
   * @returns The new root node for the tree.
   *
   * #### Undefined Behavior
   * An `index` which is out-of-bounds.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export function removeAt<K>(node: SetNode<K>, index: number): SetNode<K>;
  export function removeAt<V>(node: ListNode<V>, index: number): ListNode<V>;
  export function removeAt<K, V>(node: MapNode<K, V>, index: number): MapNode<K, V>;
  export function removeAt<K, V>(node: Node<K, V>, index: number): Node<K, V> {
    removeAtInternal(node, index);
    return maybeExtractRoot(node);
  }

  /**
   * Recursively clear the tree starting at the given node.
   *
   * @param node - The node of interest.
   *
   * #### Complexity
   * `O(n)`
   */
  export
  function clearTree<K, V>(node: Node<K, V>): void {
    // Clear the common branch state.
    if (isBranchNode(node)) {
      each(node.children as Node<K, V>[], clearTree);
      node.children.length = 0;
      node.sizes.length = 0;
    }

    // Clear the leaf state.
    if (isLeafNode(node)) {
      node.next = null;
      node.prev = null;
    }

    // Clear the key state.
    if (isKeyedNode(node)) {
      node.keys.length = 0;
    }

    // Clear the value state.
    if (isValuedLeaf(node)) {
      node.values.length = 0;
    }
  }

  /**
   * The maximum width for a node in the tree.
   */
  const MAX_NODE_WIDTH = 32;

  /**
   * The minimum width for a node in the tree.
   */
  const MIN_NODE_WIDTH = MAX_NODE_WIDTH >> 1;

  /**
   * A type alias for a node mapper function.
   */
  type NodeMapper<K, V, R> = (node: Leaf<K, V>, index: number) => R;

  /**
   * A key mapper function for a leaf node.
   */
  function keyMapper<K>(node: KeyedLeaf<K>, index: number): K {
    return node.keys[index];
  }

  /**
   * A value mapper function for a leaf node.
   */
  function valueMapper<V>(node: ValuedLeaf<V>, index: number): V {
    return node.values[index];
  }

  /**
   * An item mapper function for a leaf node.
   */
  function itemMapper<K, V>(node: MapLeaf<K, V>, index: number): [K, V] {
    return [node.keys[index], node.values[index]];
  }

  /**
   * A forward iterator for a B+ tree.
   */
  class ForwardIterator<K, V, R> implements IIterator<R> {
    /**
     * Construct a new forward iterator.
     *
     * @param node - The first leaf node in the chain.
     *
     * @param index - The local index of the first item.
     *
     * @param count - The number of items to iterate.
     *
     * @param mapper - The node mapper for the iterator.
     */
    constructor(node: Leaf<K, V> | null, index: number, count: number, mapper: NodeMapper<K, V, R>) {
      this._node = node;
      this._index = index;
      this._count = count;
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
      return new ForwardIterator<K, V, R>(this._node, this._index, this._count, this._mapper);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): R | undefined {
      if (this._node === null || this._count === 0) {
        return undefined;
      }
      if (this._index >= this._node.size) {
        this._node = this._node.next;
        this._index = 0;
        return this.next();
      }
      if (this._count > 0) {
        this._count--;
      }
      return this._mapper.call(undefined, this._node, this._index++);
    }

    private _index: number;
    private _count: number;
    private _node: Leaf<K, V> | null;
    private _mapper: NodeMapper<K, V, R>;
  }

  /**
   * A reverse iterator for a B+ tree.
   */
  class RetroIterator<K, V, R> implements IIterator<R> {
    /**
     * Construct a new retro iterator.
     *
     * @param node - The last leaf node in the chain.
     *
     * @param index - The local index of the last item.
     *
     * @param count - The number of items to iterate.
     *
     * @param mapper - The node mapper for the iterator.
     */
    constructor(node: Leaf<K, V> | null, index: number, count: number, mapper: NodeMapper<K, V, R>) {
      this._node = node;
      this._index = index;
      this._count = count;
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
      return new RetroIterator<K, V, R>(this._node, this._index, this._count, this._mapper);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): R | undefined {
      if (this._node === null || this._count === 0) {
        return undefined;
      }
      if (this._index >= this._node.size) {
        this._index = this._node.size - 1;
      }
      if (this._index < 0) {
        this._node = this._node.prev;
        this._index = this._node ? this._node.size - 1 : -1;
        return this.next();
      }
      if (this._count > 0) {
        this._count--;
      }
      return this._mapper.call(undefined, this._node, this._index--);
    }

    private _index: number;
    private _count: number;
    private _node: Leaf<K, V> | null;
    private _mapper: NodeMapper<K, V, R>;
  }

  /**
   * Get the range for a forward slice.
   */
  function forwardSliceRange(size: number, start?: number, stop?: number): { index: number, count: number } {
    if (start === undefined) {
      start = 0;
    } else if (start < 0) {
      start = Math.max(0, start + size);
    } else {
      start = Math.min(start, size);
    }
    if (stop === undefined) {
      stop = size;
    } else if (stop < 0) {
      stop = Math.max(0, stop + size);
    } else {
      stop = Math.min(stop, size);
    }
    return { index: start, count: Math.max(0, stop - start) };
  }

  /**
   * Get the range for a retro slice.
   */
  function retroSliceRange(size: number, start?: number, stop?: number): { index: number, count: number } {
    if (start === undefined) {
      start = size - 1;
    } else if (start < 0) {
      start = Math.max(-1, start + size);
    } else {
      start = Math.min(start, size - 1);
    }
    if (stop === undefined) {
      stop = -1;
    } else if (stop < 0) {
      stop = Math.max(-1, stop + size);
    } else {
      stop = Math.min(stop, size - 1);
    }
    return { index: start, count: Math.max(0, start - stop) };
  }

  /**
   * Create a new branch node for the given node type.
   */
  function createBranch<K, V>(type: NodeType): Branch<K, V> {
    switch (type) {
    case NodeType.ListBranch:
    case NodeType.ListLeaf:
      return new ListBranch<V>();
    case NodeType.SetBranch:
    case NodeType.SetLeaf:
      return new SetBranch<K>();
    case NodeType.MapBranch:
    case NodeType.MapLeaf:
      return new MapBranch<K, V>();
    default:
      throw 'unreachable';
    }
  }

  /**
   * Create a new branch node for the given node type.
   */
  function createLeaf<K, V>(type: NodeType): Leaf<K, V> {
    switch (type) {
    case NodeType.ListBranch:
    case NodeType.ListLeaf:
      return new ListLeaf<V>();
    case NodeType.SetBranch:
    case NodeType.SetLeaf:
      return new SetLeaf<K>();
    case NodeType.MapBranch:
    case NodeType.MapLeaf:
      return new MapLeaf<K, V>();
    default:
      throw 'unreachable';
    }
  }

  /**
   * Split a root node and create a new root, if needed.
   */
  function maybeSplitRoot<K>(node: SetNode<K>): SetNode<K>;
  function maybeSplitRoot<V>(node: ListNode<V>): ListNode<V>;
  function maybeSplitRoot<K, V>(node: MapNode<K, V>): MapNode<K, V>;
  function maybeSplitRoot<K>(node: KeyedNode<K>): KeyedNode<K>;
  function maybeSplitRoot<V>(node: ValuedNode<V>): ValuedNode<V>;
  function maybeSplitRoot<K, V>(node: Node<K, V>): Node<K, V>;
  function maybeSplitRoot<K, V>(node: Node<K, V>): Node<K, V> {
    // Bail early if the current root is not overfull.
    if (node.width <= MAX_NODE_WIDTH) {
      return node;
    }

    // Create a root branch of the proper type.
    let root = createBranch<K, V>(node.type);

    // Split the node to the right and create a new sibling.
    let next = splitNode(node);

    // Add the sizes to the root.
    root.sizes[0] = node.size;
    root.sizes[1] = node.size + next.size;

    // Add the children to the root.
    let children = root.children as Node<K, V>[];
    children[0] = node;
    children[1] = next;

    // Add the keys to the root.
    if (isKeyedNode(root)) {
      let n1 = node as KeyedNode<K>;
      let n2 = next as KeyedNode<K>;
      root.keys[0] = n1.keys[0];
      root.keys[1] = n2.keys[0];
    }

    // Return the new root node.
    return root;
  }

  /**
   * Extract a single node child as a new root, if needed.
   */
  function maybeExtractRoot<K>(node: SetNode<K>): SetNode<K>;
  function maybeExtractRoot<V>(node: ListNode<V>): ListNode<V>;
  function maybeExtractRoot<K, V>(node: MapNode<K, V>): MapNode<K, V>;
  function maybeExtractRoot<K>(node: KeyedNode<K>): KeyedNode<K>;
  function maybeExtractRoot<V>(node: ValuedNode<V>): ValuedNode<V>;
  function maybeExtractRoot<K, V>(node: Node<K, V>): Node<K, V>;
  function maybeExtractRoot<K, V>(node: Node<K, V>): Node<K, V> {
    // Bail early if the root it already a leaf.
    if (isLeafNode(node)) {
      return node;
    }

    // Bail early if the branch has more than one child.
    if (node.children.length > 1) {
      return node;
    }

    // Extract the sole remaining child as the new root.
    let root = node.children.pop()!;

    // Clear the rest of the node state.
    clearTree(node);

    // Return the new root.
    return root;
  }

  /**
   * Find the pivot index for a particular local index.
   */
  function findPivotIndexByIndex(sizes: number[], index: number): number {
    let n = sizes.length;
    for (let i = 0; i < n; ++i) {
      if (sizes[i] > index) {
        return i;
      }
    }
    return n - 1;
  }

  /**
   * Find the pivot index for a particular key.
   */
  function findPivotIndexByKey<K>(keys: K[], key: K, cmp: (a: K, b: K) => number): number {
    let n = keys.length;
    for (let i = 1; i < n; ++i) {
      if (cmp(keys[i], key) > 0) {
        return i - 1;
      }
    }
    return n - 1;
  }

  /**
   * Find the key index for a particular key.
   */
  function findKeyIndex<K>(keys: K[], key: K, cmp: (a: K, b: K) => number): number {
    let n = keys.length;
    for (let i = 0; i < n; ++i) {
      let c = cmp(keys[i], key);
      if (c === 0) {
        return i;
      }
      if (c > 0) {
        return -i - 1;
      }
    }
    return -n - 1;
  }

  /**
   * Compute the sum of the first n values.
   */
  function sumFirstN(values: number[], n: number): number {
    let sum = 0;
    for (let i = 0; i < n; ++i) {
      sum += values[i];
    }
    return sum;
  }

  /**
   * Update the sizes of a branch node starting at the given index.
   */
  function updateSizes<K, V>(node: Branch<K, V>, i: number): void {
    let { sizes, children } = node;
    let last = i > 0 ? sizes[i - 1] : 0;
    for (let n = children.length; i < n; ++i) {
      last = sizes[i] = last + children[i].size;
    }
    sizes.length = children.length;
  }

  /**
   * Create a new tree populated with the given items.
   */
  function assignInternal<K>(type: NodeType.SetLeaf, items: IterableOrArrayLike<K>): { root: SetNode<K>, first: SetLeaf<K>, last: SetLeaf<K> };
  function assignInternal<V>(type: NodeType.ListLeaf, items: IterableOrArrayLike<V>): { root: ListNode<V>, first: ListLeaf<V>, last: ListLeaf<V> };
  function assignInternal<K, V>(type: NodeType.MapLeaf, items: IterableOrArrayLike<[K, V]>): { root: MapNode<K, V>, first: MapLeaf<K, V>, last: MapLeaf<K, V> };
  function assignInternal<K, V>(type: NodeType, items: IterableOrArrayLike<any>): { root: Node<K, V>, first: Leaf<K, V>, last: Leaf<K, V> } {
    // Set up the array to hold the leaf nodes.
    let leaves = [createLeaf<K, V>(type)];

    // Create and fill the leaf nodes with the items.
    each(items, item => {
      // Fetch the current leaf node.
      let leaf = leaves[leaves.length - 1];

      // If the current leaf is at capacity, create a new leaf.
      if (leaf.width === MAX_NODE_WIDTH) {
        let next = createLeaf<K, V>(type);
        next.prev = leaf;
        leaf.next = next;
        leaves.push(next);
        leaf = next;
      }

      // Add the item to the current leaf.
      if (type === NodeType.SetLeaf) {
        (leaf as KeyedLeaf<K>).keys.push(item);
      } else if (type === NodeType.ListLeaf) {
        (leaf as ValuedLeaf<V>).values.push(item);
      } else {
        (leaf as KeyedLeaf<K>).keys.push(item[0]);
        (leaf as ValuedLeaf<V>).values.push(item[1]);
      }
    });

    // Set up the variable to hold the working nodes.
    let nodes: Node<K, V>[] = leaves;

    // Aggregate the working nodes until there is a single root.
    while (nodes.length > 1) {
      // Set up the array to hold the generated branch nodes.
      let branches = [createBranch<K, V>(type)];

      // Create and fill the branches with the working nodes.
      for (let i = 0, n = nodes.length; i < n; ++i) {
        // Fetch the current working node.
        let node = nodes[i];

        // Fetch the current branch.
        let branch = branches[branches.length - 1];

        // If the current branch is at capacity, create a new branch.
        if (branch.width === MAX_NODE_WIDTH) {
          branch = createBranch<K, V>(type);
          branches.push(branch);
        }

        // Add the current node to the branch.
        (branch.children as Node<K, V>[]).push(node);
      }

      // Update the sizes of the branches.
      for (let i = 0, n = branches.length; i < n; ++i) {
        updateSizes(branches[i], 0);
      }

      // Update the working nodes with the generated branches.
      nodes = branches as Node<K, V>[];
    }

    // Fetch the result data.
    let root = nodes[0];
    let first = leaves[0];
    let last = leaves[leaves.length - 1];

    // Return the assignment result.
    return { root, first, last };
  }

  /**
   * Recursively insert a value into a list node.
   *
   * This may cause the node to become overfull.
   */
  function insertAtInternal<V>(node: ListNode<V>, index: number, value: V): void {
    if (isBranchNode(node)) {
      insertAtInternalBranch(node, index, value);
    } else {
      insertAtInternalLeaf(node, index, value);
    }
  }

  /**
   * Insert a value into a list branch node.
   */
  function insertAtInternalBranch<V>(node: ListBranch<V>, index: number, value: V): void {
    // Find the pivot index for the insert.
    let i = findPivotIndexByIndex(node.sizes, index);
    if (i > 0) index -= node.sizes[i - 1];

    // Fetch the pivot child.
    let child = node.children[i];

    // Insert the value into the child.
    insertAtInternal(child, index, value);

    // Split the child if it's overfull.
    if (child.width > MAX_NODE_WIDTH) {
      ArrayExt.insert(node.children, i + 1, splitNode(child));
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);
  }

  /**
   * Insert a value into a list leaf node.
   */
  function insertAtInternalLeaf<V>(node: ListLeaf<V>, index: number, value: V): void {
    ArrayExt.insert(node.values, index, value);
  }

  /**
   * Recursively add a key to a set node.
   *
   * This may cause the node to become overfull.
   */
  function addKeyInternal<K>(node: SetNode<K>, key: K, cmp: (a: K, b: K) => number): void {
    if (isBranchNode(node)) {
      addKeyInternalBranch(node, key, cmp);
    } else {
      addKeyInternalLeaf(node, key, cmp);
    }
  }

  /**
   * Add a key to a set branch node.
   */
  function addKeyInternalBranch<K>(node: SetBranch<K>, key: K, cmp: (a: K, b: K) => number): void {
    // Find the pivot index for the insert.
    let i = findPivotIndexByKey(node.keys, key, cmp);

    // Fetch the pivot child.
    let child = node.children[i];

    // Fetch the current size of the child.
    let prevSize = child.size;

    // Add the key to the child.
    addKeyInternal(child, key, cmp);

    // Fetch the updated size of the child.
    let currSize = child.size;

    // Bail early if the child size did not change.
    if (prevSize === currSize) {
      return;
    }

    // Update the key state of the branch.
    node.keys[i] = child.keys[0];

    // Split the child if it's overfull.
    if (child.width > MAX_NODE_WIDTH) {
      let next = splitNode(child);
      ArrayExt.insert(node.children, i + 1, next);
      ArrayExt.insert(node.keys, i + 1, next.keys[0]);
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);
  }

  /**
   * Add a key to a set leaf node.
   */
  function addKeyInternalLeaf<K>(node: SetLeaf<K>, key: K, cmp: (a: K, b: K) => number): void {
    // Find the index for the given key.
    let i = findKeyIndex(node.keys, key, cmp);

    // Bail early if the key already exists.
    if (i >= 0) {
      return;
    }

    // Otherwise, insert the new key at the proper location.
    ArrayExt.insert(node.keys, -i - 1, key);
  }

  /**
   * Recursively set the key value for a map node.
   *
   * This may cause the node to become overfull.
   */
  function setValueInternal<K, V>(node: MapNode<K, V>, key: K, value: V, cmp: (a: K, b: K) => number): void {
    if (isBranchNode(node)) {
      setValueInternalBranch(node, key, value, cmp);
    } else {
      setValueInternalLeaf(node, key, value, cmp);
    }
  }

  /**
   * Set the key value for a map branch node.
   */
  function setValueInternalBranch<K, V>(node: MapBranch<K, V>, key: K, value: V, cmp: (a: K, b: K) => number): void {
    // Find the pivot index for the insert.
    let i = findPivotIndexByKey(node.keys, key, cmp);

    // Fetch the pivot child.
    let child = node.children[i];

    // Fetch the current size of the child.
    let prevSize = child.size;

    // Set the value for the child.
    setValueInternal(child, key, value, cmp);

    // Fetch the updated size of the child.
    let currSize = child.size;

    // Bail early if the child size did not change.
    if (prevSize === currSize) {
      return;
    }

    // Update the key state of the branch.
    node.keys[i] = child.keys[0];

    // Split the child if it's overfull.
    if (child.width > MAX_NODE_WIDTH) {
      let next = splitNode(child);
      ArrayExt.insert(node.children, i + 1, next);
      ArrayExt.insert(node.keys, i + 1, next.keys[0]);
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);
  }

  /**
   * Set the key value for a map leaf node.
   */
  function setValueInternalLeaf<K, V>(node: MapLeaf<K, V>, key: K, value: V, cmp: (a: K, b: K) => number): void {
    // Find the index for the given key.
    let i = findKeyIndex(node.keys, key, cmp);

    // If the key already exists, update the value in-place.
    if (i >= 0) {
      node.values[i] = value;
      return;
    }

    // Otherwise, insert the new item at the proper location.
    ArrayExt.insert(node.keys, -i - 1, key);
    ArrayExt.insert(node.values, -i - 1, value);
  }

  /**
   * Recursively delete a key from a keyed node.
   *
   * This may cause the node to become underfull.
   */
  function deleteKeyInternal<K>(node: KeyedNode<K>, key: K, cmp: (a: K, b: K) => number): void {
    if (isBranchNode(node)) {
      deleteKeyInternalBranch(node, key, cmp);
    } else {
      deleteKeyInternalLeaf(node, key, cmp);
    }
  }

  /**
   * Delete a key from a keyed branch node.
   */
  function deleteKeyInternalBranch<K>(node: KeyedBranch<K>, key: K, cmp: (a: K, b: K) => number): void {
    // Find the pivot index for the delete.
    let i = findPivotIndexByKey(node.keys, key, cmp);

    // Fetch the pivot child.
    let child = node.children[i];

    // Fetch the current size of the child.
    let prevSize = child.size;

    // Remove the key from the child.
    deleteKeyInternal(child, key, cmp);

    // Fetch the updated size of the child.
    let currSize = child.size;

    // Bail early if the child size did not change.
    if (prevSize === currSize) {
      return;
    }

    // Update the key state of the branch.
    node.keys[i] = child.keys[0];

    // Join the child if it's underfull.
    if (child.width < MIN_NODE_WIDTH) {
      i = joinChild(node, i);
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);
  }

  /**
   * Delete a key from a keyed leaf node.
   */
  function deleteKeyInternalLeaf<K>(node: KeyedLeaf<K>, key: K, cmp: (a: K, b: K) => number): void {
    // Find the index for the given key.
    let i = findKeyIndex(node.keys, key, cmp);

    // Bail early if the key does not exist.
    if (i < 0) {
      return;
    }

    // Remove the key at the computed index.
    return removeAtInternalLeaf(node, i);
  }

  /**
   * Recursively remove an item from the subtree.
   *
   * This may cause the node to become underfull.
   */
  function removeAtInternal<K, V>(node: Node<K, V>, index: number): void {
    if (isBranchNode(node)) {
      removeAtInternalBranch(node, index);
    } else {
      removeAtInternalLeaf(node, index);
    }
  }

  /**
   * Remove an item from a branch node.
   */
  function removeAtInternalBranch<K, V>(node: Branch<K, V>, index: number): void {
    // Find the pivot index for the remove.
    let i = findPivotIndexByIndex(node.sizes, index);
    if (i > 0) index -= node.sizes[i];

    // Fetch the pivot child.
    let child = node.children[i];

    // Remove the item from the child.
    removeAtInternal(child, index);

    // Update the key state of the branch.
    if (isKeyedBranch(node)) {
      node.keys[i] = (child as KeyedNode<K>).keys[0];
    }

    // Join the child if it's underfull.
    if (child.width < MIN_NODE_WIDTH) {
      i = joinChild(node, i);
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);
  }

  /**
   * Remove an item from a leaf node.
   */
  function removeAtInternalLeaf<K, V>(node: Leaf<K, V>, index: number): void {
    // Remove the key from the node.
    if (isKeyedLeaf(node)) {
      ArrayExt.removeAt(node.keys, index);
    }

    // Remove the value from the node.
    if (isValuedLeaf(node)) {
      ArrayExt.removeAt(node.values, index);
    }
  }

  /**
   * Split a node and return its new next sibling.
   */
  function splitNode<V>(node: ListNode<V>): ListNode<V>;
  function splitNode<K>(node: SetNode<K>): SetNode<K>;
  function splitNode<K, V>(node: MapNode<K, V>): MapNode<K, V>;
  function splitNode<K, V>(node: Node<K, V>): Node<K, V>;
  function splitNode<K, V>(node: Node<K, V>): Node<K, V> {
    return isBranchNode(node) ? splitBranch(node) : splitLeaf(node);
  }

  /**
   * Split a branch node and return its new next sibling.
   */
  function splitBranch<V>(node: ListBranch<V>): ListBranch<V>;
  function splitBranch<K>(node: SetBranch<K>): SetBranch<K>;
  function splitBranch<K, V>(node: MapBranch<K, V>): MapBranch<K, V>;
  function splitBranch<K, V>(node: Branch<K, V>): Branch<K, V>;
  function splitBranch<K, V>(node: Branch<K, V>): Branch<K, V> {
    // Create the new sibling node.
    let next = createBranch<K, V>(node.type);

    // Move the children to the new sibling.
    let c1 = node.children as Node<K, V>[];
    let c2 = next.children as Node<K, V>[];
    for (let i = MIN_NODE_WIDTH, n = c1.length; i < n; ++i) {
      c2.push(c1[i]);
    }
    c1.length = MIN_NODE_WIDTH;

    // Move the keys to the new sibling.
    if (isKeyedBranch(node)) {
      let k1 = node.keys;
      let k2 = (next as KeyedBranch<K>).keys;
      for (let i = MIN_NODE_WIDTH, n = k1.length; i < n; ++i) {
        k2.push(k1[i]);
      }
      k1.length = MIN_NODE_WIDTH;
    }

    // Update the dirty sizes of the nodes.
    updateSizes(node, MIN_NODE_WIDTH);
    updateSizes(next, 0);

    // Return the new next sibling.
    return next;
  }

  /**
   * Split a leaf node and return its new next sibling.
   */
  function splitLeaf<V>(node: ListLeaf<V>): ListLeaf<V>;
  function splitLeaf<K>(node: SetLeaf<K>): SetLeaf<K>;
  function splitLeaf<K, V>(node: MapLeaf<K, V>): MapLeaf<K, V>;
  function splitLeaf<K, V>(node: Leaf<K, V>): Leaf<K, V>;
  function splitLeaf<K, V>(node: Leaf<K, V>): Leaf<K, V> {
    // Create the new sibling node.
    let next = createLeaf<K, V>(node.type);

    // Move the keys to the new sibling.
    if (isKeyedLeaf(node)) {
      let k1 = node.keys;
      let k2 = (next as KeyedLeaf<K>).keys;
      for (let i = MIN_NODE_WIDTH, n = k1.length; i < n; ++i) {
        k2.push(k1[i]);
      }
      k1.length = MIN_NODE_WIDTH;
    }

    // Move the values to the new sibling.
    if (isValuedLeaf(node)) {
      let v1 = node.values;
      let v2 = (next as ValuedLeaf<V>).values;
      for (let i = MIN_NODE_WIDTH, n = v1.length; i < n; ++i) {
        v2.push(v1[i]);
      }
      v1.length = MIN_NODE_WIDTH;
    }

    // Patch up the sibling links.
    if (node.next) node.next.prev = next;
    next.next = node.next;
    next.prev = node;
    node.next = next;

    // Return the new next sibling.
    return next;
  }

  /**
   * Join a child node of a branch with one of its siblings.
   *
   * This may cause the branch to become underfull.
   */
  function joinChild<K, V>(node: Branch<K, V>, i: number): number {
    // Fetch the child to be joined.
    let child = node.children[i];

    // Fetch the relevant sibling.
    let sibling = i === 0 ? node.children[i + 1] : node.children[i - 1];

    // Compute the flags which control the join behavior.
    let hasNext = i === 0;
    let isLeaf = isLeafNode(child);
    let hasExtra = sibling.width > MIN_NODE_WIDTH;

    // Join case #1: steal from next sibling leaf
    if (isLeaf && hasExtra && hasNext) {
      // Cast the children as leaves.
      let c = child as Leaf<K, V>;
      let s = sibling as Leaf<K, V>;

      // Steal a key.
      if (isKeyedLeaf(c)) {
        c.keys.push((s as KeyedLeaf<K>).keys.shift()!);
      }

      // Steal a value.
      if (isValuedLeaf(c)) {
        c.values.push((s as ValuedLeaf<V>).values.shift()!);
      }

      // Update the branch key.
      if (isKeyedBranch(node)) {
        node.keys[i + 1] = (s as KeyedLeaf<K>).keys[0];
      }

      // Return the first modified index.
      return i;
    }

    // Join case #2: steal from previous sibling leaf
    if (isLeaf && hasExtra && !hasNext) {
      // Cast the children as leaves.
      let c = child as Leaf<K, V>;
      let s = sibling as Leaf<K, V>;

      // Steal a key.
      if (isKeyedLeaf(c)) {
        c.keys.unshift((s as KeyedLeaf<K>).keys.pop()!);
      }

      // Steal a value.
      if (isValuedLeaf(c)) {
        c.values.unshift((s as ValuedLeaf<V>).values.pop()!);
      }

      // Update the branch key.
      if (isKeyedBranch(node)) {
        node.keys[i] = (c as KeyedLeaf<K>).keys[0];
      }

      // Return the first modified index.
      return i - 1;
    }

    // Join case #3: merge with next sibling leaf
    if (isLeaf && !hasExtra && hasNext) {
      // Cast the children as leaves.
      let c = child as Leaf<K, V>;
      let s = sibling as Leaf<K, V>;

      // Merge keys.
      if (isKeyedLeaf(s)) {
        s.keys.unshift(...(c as KeyedLeaf<K>).keys);
      }

      // Merge values.
      if (isValuedLeaf(s)) {
        s.values.unshift(...(c as ValuedLeaf<V>).values);
      }

      // Remove the old branch child.
      ArrayExt.removeAt(node.children as Node<K, V>[], i);

      // Remove the stale branch key.
      if (isKeyedBranch(node)) {
        ArrayExt.removeAt(node.keys, i + 1);
      }

      // Patch up the sibling links.
      if (c.prev) c.prev.next = s;
      s.prev = c.prev;

      // Clear the original child.
      clearTree(c);

      // Return the first modified index.
      return i;
    }

    // Join case #4: merge with previous sibling leaf
    if (isLeaf && !hasExtra && !hasNext) {
      // Cast the children as leaves.
      let c = child as Leaf<K, V>;
      let s = sibling as Leaf<K, V>;

      // Merge keys.
      if (isKeyedLeaf(s)) {
        s.keys.push(...(c as KeyedLeaf<K>).keys);
      }

      // Merge values.
      if (isValuedLeaf(s)) {
        s.values.push(...(c as ValuedLeaf<V>).values);
      }

      // Remove the old branch child.
      ArrayExt.removeAt(node.children as Node<K, V>[], i);

      // Remove the stale branch key.
      if (isKeyedBranch(node)) {
        ArrayExt.removeAt(node.keys, i);
      }

      // Patch up the sibling links.
      if (c.next) c.next.prev = s;
      s.next = c.next;

      // Clear the original child.
      clearTree(c);

      // Return the first modified index.
      return i - 1;
    }

    // Join case #5: steal from next sibling branch
    if (!isLeaf && hasExtra && hasNext) {
      // Cast the children to branches.
      let c = child as Branch<K, V>;
      let s = sibling as Branch<K, V>;

      // Steal a child from the next sibling.
      (c.children as Node<K, V>[]).push(s.children.shift()!);

      // Steal a key from the next sibling.
      if (isKeyedBranch(c)) {
        c.keys.push((s as KeyedBranch<K>).keys.shift()!);
      }

      // Update the branch key.
      if (isKeyedBranch(node)) {
        node.keys[i + 1] = (s as KeyedBranch<K>).keys[0];
      }

      // Update the sibling sizes.
      updateSizes(c, c.width - 1);
      updateSizes(s, 0);

      // Return the first modified index.
      return i;
    }

    // Join case #6: steal from previous sibling branch
    if (!isLeaf && hasExtra && !hasNext) {
      // Cast the children to branches.
      let c = child as Branch<K, V>;
      let s = sibling as Branch<K, V>;

      // Steal a child from the previous sibling.
      (c.children as Node<K, V>[]).unshift(s.children.pop()!);

      // Steal a key from the previous sibling.
      if (isKeyedBranch(c)) {
        c.keys.unshift((s as KeyedBranch<K>).keys.pop()!);
      }

      // Update the branch key.
      if (isKeyedBranch(node)) {
        node.keys[i] = (c as KeyedBranch<K>).keys[0];
      }

      // Update the sibling sizes.
      updateSizes(c, 0);
      updateSizes(s, s.width - 1);

      // Return the first modified index.
      return i - 1;
    }

    // Join case #7: merge with next sibling branch
    if (!isLeaf && !hasExtra && hasNext) {
      // Cast the children to branches.
      let c = child as Branch<K, V>;
      let s = sibling as Branch<K, V>;

      // Merge the children with the next sibling.
      (s.children as Node<K, V>[]).unshift(...c.children);

      // Merge the keys with the next sibling.
      if (isKeyedBranch(s)) {
        s.keys.unshift(...(c as KeyedBranch<K>).keys);
      }

      // Remove the old branch child.
      ArrayExt.removeAt(node.children as Node<K, V>[], i);

      // Remove the stale branch key.
      if (isKeyedBranch(node)) {
        ArrayExt.removeAt(node.keys, i + 1);
      }

      // Update the sibling sizes.
      updateSizes(s, 0);

      // Clear the original child.
      c.children.length = 0;
      clearTree(c);

      // The join is complete.
      return i;
    }

    // Join case #8: merge with previous sibling branch
    if (!isLeaf && !hasExtra && !hasNext) {
      // Cast the children to branches.
      let c = child as Branch<K, V>;
      let s = sibling as Branch<K, V>;

      // Merge the children with the previous sibling.
      (s.children as Node<K, V>[]).push(...c.children);

      // Merge the keys with the previous sibling.
      if (isKeyedBranch(s)) {
        s.keys.push(...(c as KeyedBranch<K>).keys);
      }

      // Remove the old branch child.
      ArrayExt.removeAt(node.children as Node<K, V>[], i);

      // Remove the stale branch key.
      if (isKeyedBranch(node)) {
        ArrayExt.removeAt(node.keys, i);
      }

      // Update the sibling sizes.
      updateSizes(s, 0);

      // Clear the original child.
      c.children.length = 0;
      clearTree(c);

      // The join is complete.
      return i - 1;
    }

    // One of the above cases must match.
    throw 'unreachable';
  }
}
