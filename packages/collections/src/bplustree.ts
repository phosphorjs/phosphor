/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, IIterable, IIterator, IRetroable, IterableOrArrayLike, each, empty
} from "@phosphor/algorithm";


/**
 * A generic B+ tree.
 *
 * #### Notes
 * Most operations have `O(log32 n)` or better complexity.
 */
export
class BPlusTree<T> implements IIterable<T>, IRetroable<T> {
  /**
   * Construct a new B+ tree.
   *
   * @param cmp - The item comparison function for the tree.
   */
  constructor(cmp: (a: T, b: T) => number) {
    this.cmp = cmp;
  }

  /**
   * The item comparison function for the tree.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly cmp: (a: T, b: T) => number;

  /**
   * Whether the tree is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get isEmpty(): boolean {
    return this._root.size === 0;
  }

  /**
   * The size of the tree.
   *
   * #### Complexity
   * `O(1)`
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
   * `O(log32 n)`
   */
  get first(): T | undefined {
    let node = Private.firstLeaf(this._root);
    return node.size > 0 ? node.items[0] : undefined;
  }

  /**
   * The last item in the tree.
   *
   * This is `undefined` if the tree is empty.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  get last(): T | undefined {
    let node = Private.lastLeaf(this._root);
    return node.size > 0 ? node.items[node.size - 1] : undefined;
  }

  /**
   * Create an iterator over the items in the tree.
   *
   * @returns A new iterator starting with the first item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  iter(): IIterator<T> {
    return Private.iterItems(this._root);
  }

  /**
   * Create a reverse iterator over the items in the tree.
   *
   * @returns A new iterator starting with the last item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  retro(): IIterator<T> {
    return Private.retroItems(this._root);
  }

  /**
   * Create an iterator for a slice of items in the tree.
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
  slice(start?: number, stop?: number): IIterator<T> {
    return Private.sliceItems(this._root, start, stop);
  }

  /**
   * Create a reverse iterator for a slice of items in the tree.
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
  retroSlice(start?: number, stop?: number): IIterator<T> {
    return Private.retroSliceItems(this._root, start, stop);
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
   * `O(log32 n)`
   */
  at(index: number): T | undefined {
    return Private.itemAt(this._root, index);
  }

  /**
   * Test whether the tree has an item which matches a key.
   *
   * @param key - The key of interest.
   *
   * @param cmp - A function which compares an item against the key.
   *
   * @returns `true` if the tree has an item which matches the given
   *   key, `false` otherwise.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  has<U>(key: U, cmp: (item: T, key: U) => number): boolean {
    return Private.hasItem(this._root, key, cmp);
  }

  /**
   * Get the index of an item which matches a key.
   *
   * @param key - The key of interest.
   *
   * @param cmp - A function which compares an item against the key.
   *
   * @returns The index of the item which matches the given key. A
   *   negative value means that a matching item does not exist in
   *   the tree, but if one did it would reside at `-index - 1`.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  indexOf<U>(key: U, cmp: (item: T, key: U) => number): number {
    return Private.indexOf(this._root, key, cmp);
  }

  /**
   * Get the item which matches a key.
   *
   * @param item - The key of interest.
   *
   * @param cmp - A function which compares an item against the key.
   *
   * @returns The item which matches the given key, or `undefined` if
   *   the tree does not have a matching item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  get<U>(key: U, cmp: (item: T, key: U) => number): T | undefined {
    return Private.getItem(this._root, key, cmp);
  }

  /**
   * Assign new items to the tree, replacing all current items.
   *
   * @param items - The items to assign to the tree.
   *
   * #### Complexity
   * `O(n log32 n)`
   */
  assign(items: IterableOrArrayLike<T>): void {
    this.clear();
    this.update(items);
  }

  /**
   * Insert an item into the tree.
   *
   * @param item - The item of interest.
   *
   * @returns If the given item matches an existing item in the tree,
   *   the given item will replace it, and the existing item will be
   *   returned. Otherwise, this method returns `undefined`.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  insert(item: T): T | undefined {
    let existing = Private.insertItem(this._root, item, this.cmp);
    this._root = Private.maybeSplitRoot(this._root);
    return existing;
  }

  /**
   * Update the tree with multiple items.
   *
   * @param items - The items to insert into the tree.
   *
   * #### Complexity
   * `O(k log32 n)`
   */
  update(items: IterableOrArrayLike<T>): void {
    each(items, item => { this.insert(item); });
  }

  /**
   * Delete an item which matches a particular key.
   *
   * @param key - The key of interest.
   *
   * @param cmp - A function which compares an item against the key.
   *
   * @returns The item removed from the tree, or `undefined` if no
   *   item matched the given key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  delete<U>(key: U, cmp: (item: T, key: U) => number): T | undefined {
    let item = Private.deleteItem(this._root, key, cmp);
    this._root = Private.maybeExtractRoot(this._root);
    return item;
  }

  /**
   * Remove an item at a particular index.
   *
   * @param index - The index of the item to remove. Negative
   *   values are taken as an offset from the end of the tree.
   *
   * @returns The item removed from the tree, or `undefined` if
   *   the given index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  remove(index: number): T | undefined {
    let item = Private.removeItem(this._root, index);
    this._root = Private.maybeExtractRoot(this._root);
    return item;
  }

  /**
   * Clear the contents of the tree.
   *
   * #### Complexity
   * `O(n)`
   */
  clear(): void {
    Private.clear(this._root);
    this._root = new Private.LeafNode<T>();
  }

  private _root: Private.Node<T> = new Private.LeafNode<T>();
}


/**
 * The namespace for the `BPlusTree` class statics.
 */
export
namespace BPlusTree {
  /**
   * Create a new B+ tree populated with the given items.
   *
   * @param items - The items to add to the tree.
   *
   * @param cmp - The item comparison function for the tree.
   *
   * @returns A new B+ tree populated with the given items.
   *
   * #### Complexity
   * `O(n log32 n)`
   */
  export
  function from<T>(items: IterableOrArrayLike<T>, cmp: (a: T, b: T) => number): BPlusTree<T> {
    let tree = new BPlusTree<T>(cmp);
    tree.assign(items);
    return tree;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A const enum of the B+ tree node types.
   */
  export
  const enum NodeType { Branch, Leaf }

  /**
   * A branch node in a B+ tree.
   */
  export
  class BranchNode<T> {
    /**
     * The left-most item of each child subtree.
     */
    readonly items: T[] = [];

    /**
     * The cumulative sizes of each child subtree.
     */
    readonly sizes: number[] = [];

    /**
     * The child nodes of this branch node.
     */
    readonly children: Node<T>[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.Branch {
      return NodeType.Branch;
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
   * A leaf node in a B+ tree.
   */
  export
  class LeafNode<T> {
    /**
     * The next sibling leaf node of this leaf node.
     */
    next: LeafNode<T> | null = null;

    /**
     * The previous sibling leaf node of this leaf node.
     */
    prev: LeafNode<T> | null = null;

    /**
     * The items of the leaf.
     */
    readonly items: T[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): NodeType.Leaf {
      return NodeType.Leaf;
    }

    /**
     * The total number of items in the leaf.
     */
    get size(): number {
      return this.items.length;
    }

    /**
     * The tree width of the node.
     */
    get width(): number {
      return this.items.length;
    }
  }

  /**
   * A type alias for the B+ tree nodes.
   */
  export
  type Node<T> = BranchNode<T> | LeafNode<T>;

  /**
   * Get the first leaf node in the tree.
   *
   * @param node - The root node of interest.
   *
   * @returns The first leaf node in the tree.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function firstLeaf<T>(node: Node<T>): LeafNode<T> {
    while (node.type === NodeType.Branch) {
      node = node.children[0];
    }
    return node;
  }

  /**
   * Get the last leaf node in the tree.
   *
   * @param node - The root node of interest.
   *
   * @returns The last leaf node in the tree.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function lastLeaf<T>(node: Node<T>): LeafNode<T> {
    while (node.type === NodeType.Branch) {
      node = node.children[node.children.length - 1];
    }
    return node;
  }

  /**
   * Create a forward iterator for the items in the tree.
   *
   * @param node - The root node of interest.
   *
   * @returns A new forward iterator starting with the first item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function iterItems<T>(node: Node<T>): IIterator<T> {
    let leaf = firstLeaf(node);
    return new ForwardIterator<T>(leaf, 0, -1);
  }

  /**
   * Create a reverse iterator for the items in the tree.
   *
   * @param node - The root node of interest.
   *
   * @returns A new reverse iterator starting with the last item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function retroItems<T>(node: Node<T>): IIterator<T> {
    let leaf = lastLeaf(node);
    return new RetroIterator<T>(leaf, leaf.size - 1, -1);
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
  function sliceItems<T>(node: Node<T>, start?: number, stop?: number): IIterator<T> {
    // Normalize the start index.
    if (start === undefined) {
      start = 0;
    } else if (start < 0) {
      start = Math.max(0, start + node.size);
    } else {
      start = Math.min(start, node.size);
    }

    // Normalize the stop index.
    if (stop === undefined) {
      stop = node.size;
    } else if (stop < 0) {
      stop = Math.max(0, stop + node.size);
    } else {
      stop = Math.min(stop, node.size);
    }

    // Compute effective count.
    let count = Math.max(0, stop - start);

    // Bail early if there is nothing to iterate.
    if (count === 0) {
      return empty<T>();
    }

    // Find the starting leaf node and local index.
    while (node.type === NodeType.Branch) {
      let i = findPivotIndexByIndex(node.sizes, start);
      if (i > 0) start -= node.sizes[i - 1];
      node = node.children[i];
    }

    // Return the forward iterator for the range.
    return new ForwardIterator<T>(node, start, count);
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
  function retroSliceItems<T>(node: Node<T>, start?: number, stop?: number): IIterator<T> {
    // Normalize the start index.
    if (start === undefined) {
      start = node.size - 1;
    } else if (start < 0) {
      start = Math.max(-1, start + node.size);
    } else {
      start = Math.min(start, node.size - 1);
    }

    // Normalize the stop index.
    if (stop === undefined) {
      stop = -1;
    } else if (stop < 0) {
      stop = Math.max(-1, stop + node.size);
    } else {
      stop = Math.min(stop, node.size - 1);
    }

    // Compute the effective count.
    let count = Math.max(0, start - stop);

    // Bail early if there is nothing to iterate.
    if (count === 0) {
      return empty<T>();
    }

    // Find the starting leaf node and local index.
    while (node.type === NodeType.Branch) {
      let i = findPivotIndexByIndex(node.sizes, start);
      if (i > 0) start -= node.sizes[i - 1];
      node = node.children[i];
    }

    // Return the retro iterator for the range.
    return new RetroIterator<T>(node, start, count);
  }

  /**
   * Get the item at the specified index.
   *
   * @param node - The root node of interest.
   *
   * @param index - The index of the item of interest. Negative
   *   values are taken as an offset from the end of the tree.
   *
   * @returns The item at the specified index, or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function itemAt<T>(node: Node<T>, index: number): T | undefined {
    // Wrap negative indices.
    if (index < 0) {
      index += node.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= node.size) {
      return undefined;
    }

    // Find the containing leaf node and local index.
    while (node.type === NodeType.Branch) {
      let i = findPivotIndexByIndex(node.sizes, index);
      if (i > 0) index -= node.sizes[i - 1];
      node = node.children[i];
    }

    // Return the item at the specified index.
    return node.items[index];
  }

  /**
   * Test whether the tree contains an item which matches a key.
   *
   * @param node - The root node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns Whether the tree contains a matching item.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function hasItem<T, U>(node: Node<T>, key: U, cmp: (item: T, key: U) => number): boolean {
    // Find the containing leaf node.
    while (node.type === NodeType.Branch) {
      let i = findPivotIndexByKey(node.items, key, cmp);
      node = node.children[i];
    }

    // Find the key index.
    let i = findKeyIndex(node.items, key, cmp);

    // Return whether or not the node contains a matching item.
    return i >= 0;
  }

  /**
   * Get the index of the item which matches a key.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The index of the item which matches the given key. A
   *   negative value means that a matching item does not exist in
   *   the tree, but if one did it would reside at `-index - 1`.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function indexOf<T, U>(node: Node<T>, key: U, cmp: (item: T, key: U) => number): number {
    // Set up the global index.
    let index = 0;

    // Find the containing leaf node and global index.
    while (node.type === NodeType.Branch) {
      let i = findPivotIndexByKey(node.items, key, cmp);
      if (i > 0) index += node.sizes[i - 1];
      node = node.children[i];
    }

    // Find the key index.
    let i = findKeyIndex(node.items, key, cmp);

    // Return the final computed index.
    return i >= 0 ? index + i : -index + i;
  }

  /**
   * Get the item for a particular key.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The item for the specified key, or `undefined` if
   *   the tree does not have a matching item for the key.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  export
  function getItem<T, U>(node: Node<T>, key: U, cmp: (item: T, key: U) => number): T | undefined {
    // Find the containing leaf node.
    while (node.type === NodeType.Branch) {
      let i = findPivotIndexByKey(node.items, key, cmp);
      node = node.children[i];
    }

    // Find the key index.
    let i = findKeyIndex(node.items, key, cmp);

    // Return the item for the given key.
    return i >= 0 ? node.items[i] : undefined;
  }

  /**
   * Insert an item into the tree.
   *
   * @param node - The root node of interest.
   *
   * @param item - The item of interest.
   *
   * @param cmp - The item comparison function.
   *
   * @returns If the given item matches an existing item in the tree,
   *   the given item will replace it, and the existing item will be
   *   returned. Otherwise, this function returns `undefined`.
   *
   * #### Complexity
   * `O(log32 n)`
   *
   * #### Notes
   * The root may be overfull after calling this function.
   */
  export
  function insertItem<T>(node: Node<T>, item: T, cmp: (a: T, b: T) => number): T | undefined {
    // Handle leaf nodes first.
    if (node.type === NodeType.Leaf) {
      // Find the index for the given item.
      let i = findKeyIndex(node.items, item, cmp);

      // Fetch the existing item and insert the new item.
      let existing: T | undefined;
      if (i >= 0) {
        existing = node.items[i];
        node.items[i] = item;
      } else {
        existing = undefined;
        ArrayExt.insert(node.items, -i - 1, item);
      }

      // Return the existing item.
      return existing;
    }

    // Find the pivot index for the insert.
    let i = findPivotIndexByKey(node.items, item, cmp);

    // Fetch the pivot child.
    let child = node.children[i];

    // Fetch the current size of the child.
    let prevSize = child.size;

    // Recursively insert the item into the child.
    let existing = insertItem(child, item, cmp);

    // Fetch the updated size of the child.
    let currSize = child.size;

    // Update the item state of the branch.
    node.items[i] = child.items[0];

    // Bail early if the child size did not change.
    if (prevSize === currSize) {
      return existing;
    }

    // Split the child if it's overfull.
    if (child.width > MAX_NODE_WIDTH) {
      let next = splitNode(child);
      ArrayExt.insert(node.children, i + 1, next);
      ArrayExt.insert(node.items, i + 1, next.items[0]);
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);

    // Return the existing item.
    return existing;
  }

  /**
   * Delete an item in the tree.
   *
   * @param node - The node of interest.
   *
   * @param key - The key of interest.
   *
   * @param cmp - The key comparison function.
   *
   * @returns The deleted item or `undefined`.
   *
   * #### Complexity
   * `O(log32 n)`
   *
   * #### Notes
   * The root may be underfull after calling this function.
   */
  export
  function deleteItem<T, U>(node: Node<T>, key: U, cmp: (item: T, key: U) => number): T | undefined {
    // Handle leaf nodes first.
    if (node.type === NodeType.Leaf) {
      // Find the index for the given key.
      let i = findKeyIndex(node.items, key, cmp);

      // Bail early if the item does not exist.
      if (i < 0) {
        return undefined;
      }

      // Remove the item at the computed index.
      return ArrayExt.removeAt(node.items, i);
    }

    // Find the pivot index for the delete.
    let i = findPivotIndexByKey(node.items, key, cmp);

    // Fetch the pivot child.
    let child = node.children[i];

    // Fetch the current size of the child.
    let prevSize = child.size;

    // Recursively remove the item from the child.
    let item = deleteItem(child, key, cmp);

    // Fetch the updated size of the child.
    let currSize = child.size;

    // Bail early if the child size did not change.
    if (prevSize === currSize) {
      return item;
    }

    // Update the item state of the branch.
    node.items[i] = child.items[0];

    // Join the child if it's underfull.
    if (child.width < MIN_NODE_WIDTH) {
      i = joinChild(node, i);
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);

    // Return the deleted item.
    return item;
  }

  /**
   * Remove an item from the tree.
   *
   * @param node - The node of interest.
   *
   * @param index - The index of interest.
   *
   * @returns The removed item or `undefined`.
   *
   * #### Complexity
   * `O(log32 n)`
   *
   * #### Notes
   * The root may be underfull after calling this function.
   */
  export
  function removeItem<T>(node: Node<T>, index: number): T | undefined {
    // Wrap negative indices.
    if (index < 0) {
      index += node.size;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= node.size) {
      return undefined;
    }

    // Handle leaf nodes first.
    if (node.type === NodeType.Leaf) {
      return ArrayExt.removeAt(node.items, index);
    }

    // Find the pivot index for the remove.
    let i = findPivotIndexByIndex(node.sizes, index);
    if (i > 0) index -= node.sizes[i];

    // Fetch the pivot child.
    let child = node.children[i];

    // Recursively remove the item from the child.
    let item = removeItem(child, index);

    // Update the item state of the branch.
    node.items[i] = child.items[0];

    // Join the child if it's underfull.
    if (child.width < MIN_NODE_WIDTH) {
      i = joinChild(node, i);
    }

    // Update the dirty sizes of the branch.
    updateSizes(node, i);

    // Return the removed item.
    return item;
  }

  /**
   * Recursively clear the contents of a node.
   *
   * @param node - The node of interest.
   *
   * #### Complexity
   * `O(n)`
   */
  export
  function clear<T>(node: Node<T>): void {
    if (node.type === NodeType.Branch) {
      each(node.children, clear);
      node.children.length = 0;
      node.sizes.length = 0;
      node.items.length = 0;
    } else {
      node.items.length = 0;
      node.next = null;
      node.prev = null;
    }
  }

  /**
   * Split a root node and create a new root, if needed.
   *
   * @param node - The root node of interest.
   *
   * @returns The new root node.
   */
  export
  function maybeSplitRoot<T>(node: Node<T>): Node<T> {
    // Bail early if the current root is not overfull.
    if (node.width <= MAX_NODE_WIDTH) {
      return node;
    }

    // Create a new root branch node.
    let root = new BranchNode<T>();

    // Split the node to the right and create a new sibling.
    let next = splitNode(node);

    // Add the sizes to the root.
    root.sizes[0] = node.size;
    root.sizes[1] = node.size + next.size;

    // Add the children to the root.
    root.children[0] = node;
    root.children[1] = next;

    // Add the items to the root.
    root.items[0] = node.items[0];
    root.items[1] = next.items[0];

    // Return the new root node.
    return root;
  }

  /**
   * Extract a single node child as a new root, if needed.
   *
   * @param node - The root node of interest.
   *
   * @returns The new root node.
   */
  export
  function maybeExtractRoot<T>(node: Node<T>): Node<T> {
    // Bail early if the node it already a leaf.
    if (node.type === NodeType.Leaf) {
      return node;
    }

    // Bail early if the branch has more than one child.
    if (node.children.length > 1) {
      return node;
    }

    // Extract the sole remaining child as the new root.
    let root = node.children.pop()!;

    // Clear the rest of the node state.
    clear(node);

    // Return the new root.
    return root;
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
   * A forward iterator for a B+ tree.
   */
  class ForwardIterator<T> implements IIterator<T> {
    /**
     * Construct a new forward iterator.
     *
     * @param node - The first leaf node in the chain.
     *
     * @param index - The local index of the first item.
     *
     * @param count - The number of items to iterate. A value `< 0`
     *   will iterate all available items.
     */
    constructor(node: LeafNode<T> | null, index: number, count: number) {
      this._node = node;
      this._index = index;
      this._count = count;
    }

    /**
     * Get an iterator over the object's values.
     *
     * @returns An iterator which yields the object's values.
     */
    iter(): IIterator<T> {
      return this;
    }

    /**
     * Create an independent clone of the iterator.
     *
     * @returns A new independent clone of the iterator.
     */
    clone(): IIterator<T> {
      return new ForwardIterator<T>(this._node, this._index, this._count);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): T | undefined {
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
      return this._node.items[this._index++];
    }

    private _index: number;
    private _count: number;
    private _node: LeafNode<T> | null;
  }

  /**
   * A reverse iterator for a B+ tree.
   */
  class RetroIterator<T> implements IIterator<T> {
    /**
     * Construct a new retro iterator.
     *
     * @param node - The last leaf node in the chain.
     *
     * @param index - The local index of the last item.
     *
     * @param count - The number of items to iterate. A value `< 0`
     *   will iterate all available items.
     */
    constructor(node: LeafNode<T> | null, index: number, count: number) {
      this._node = node;
      this._index = index;
      this._count = count;
    }

    /**
     * Get an iterator over the object's values.
     *
     * @returns An iterator which yields the object's values.
     */
    iter(): IIterator<T> {
      return this;
    }

    /**
     * Create an independent clone of the iterator.
     *
     * @returns A new independent clone of the iterator.
     */
    clone(): IIterator<T> {
      return new RetroIterator<T>(this._node, this._index, this._count);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): T | undefined {
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
      return this._node.items[this._index--];
    }

    private _index: number;
    private _count: number;
    private _node: LeafNode<T> | null;
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
  function findPivotIndexByKey<T, U>(items: T[], key: U, cmp: (item: T, key: U) => number): number {
    let n = items.length;
    for (let i = 1; i < n; ++i) {
      if (cmp(items[i], key) > 0) {
        return i - 1;
      }
    }
    return n - 1;
  }

  /**
   * Find the key index for a particular key.
   */
  function findKeyIndex<T, U>(items: T[], key: U, cmp: (item: T, key: U) => number): number {
    let n = items.length;
    for (let i = 0; i < n; ++i) {
      let c = cmp(items[i], key);
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
   * Update the sizes of a branch node starting at the given index.
   */
  function updateSizes<T>(node: BranchNode<T>, i: number): void {
    let { sizes, children } = node;
    let last = i > 0 ? sizes[i - 1] : 0;
    for (let n = children.length; i < n; ++i) {
      last = sizes[i] = last + children[i].size;
    }
    sizes.length = children.length;
  }

  /**
   * Split a node and return its new next sibling.
   *
   * @param node - The node of interest.
   *
   * @returns The new next sibling node.
   */
  function splitNode<T>(node: Node<T>): Node<T> {
    // Handle leaf nodes first.
    if (node.type === NodeType.Leaf) {
      // Create the new sibling leaf node.
      let next = new LeafNode<T>();

      // Move the items to the new sibling.
      let v1 = node.items;
      let v2 = next.items;
      for (let i = MIN_NODE_WIDTH, n = v1.length; i < n; ++i) {
        v2.push(v1[i]);
      }
      v1.length = MIN_NODE_WIDTH;

      // Patch up the sibling links.
      if (node.next) node.next.prev = next;
      next.next = node.next;
      next.prev = node;
      node.next = next;

      // Return the new next sibling.
      return next;
    }

    // Create the new sibling branch node.
    let next = new BranchNode<T>();

    // Move the children to the new sibling.
    let c1 = node.children;
    let c2 = next.children;
    for (let i = MIN_NODE_WIDTH, n = c1.length; i < n; ++i) {
      c2.push(c1[i]);
    }
    c1.length = MIN_NODE_WIDTH;

    // Move the items to the new sibling.
    let v1 = node.items;
    let v2 = next.items;
    for (let i = MIN_NODE_WIDTH, n = v1.length; i < n; ++i) {
      v2.push(v1[i]);
    }
    v1.length = MIN_NODE_WIDTH;

    // Update the dirty sizes of the nodes.
    updateSizes(node, MIN_NODE_WIDTH);
    updateSizes(next, 0);

    // Return the new next sibling.
    return next;
  }

  /**
   * Join a child node of a branch with one of its siblings.
   *
   * @param node - The branch node of interest.
   *
   * @param i - The index of the child node of interest.
   *
   * @returns The first modified index.
   *
   * #### Notes
   * This may cause the branch to become underfull.
   */
  function joinChild<T>(node: BranchNode<T>, i: number): number {
    // Fetch the child to be joined.
    let child = node.children[i];

    // Fetch the relevant sibling.
    let sibling = i === 0 ? node.children[i + 1] : node.children[i - 1];

    // Compute the flags which control the join behavior.
    let hasNext = i === 0;
    let isLeaf = child.type === NodeType.Leaf;
    let hasExtra = sibling.width > MIN_NODE_WIDTH;

    // Join case #1: steal from next sibling leaf
    if (isLeaf && hasExtra && hasNext) {
      // Cast the children as leaves.
      let c = child as LeafNode<T>;
      let s = sibling as LeafNode<T>;

      // Steal an item.
      c.items.push(s.items.shift()!);

      // Update the branch items.
      node.items[i + 1] = s.items[0];

      // Return the first modified index.
      return i;
    }

    // Join case #2: steal from previous sibling leaf
    if (isLeaf && hasExtra && !hasNext) {
      // Cast the children as leaves.
      let c = child as LeafNode<T>;
      let s = sibling as LeafNode<T>;

      // Steal an item.
      c.items.unshift(s.items.pop()!);

      // Update the branch items.
      node.items[i] = c.items[0];

      // Return the first modified index.
      return i - 1;
    }

    // Join case #3: merge with next sibling leaf
    if (isLeaf && !hasExtra && hasNext) {
      // Cast the children as leaves.
      let c = child as LeafNode<T>;
      let s = sibling as LeafNode<T>;

      // Merge items.
      s.items.unshift(...c.items);

      // Remove the old branch child.
      ArrayExt.removeAt(node.children, i);

      // Remove the stale branch item.
      ArrayExt.removeAt(node.items, i + 1);

      // Patch up the sibling links.
      if (c.prev) c.prev.next = s;
      s.prev = c.prev;

      // Clear the original child.
      clear(c);

      // Return the first modified index.
      return i;
    }

    // Join case #4: merge with previous sibling leaf
    if (isLeaf && !hasExtra && !hasNext) {
      // Cast the children as leaves.
      let c = child as LeafNode<T>;
      let s = sibling as LeafNode<T>;

      // Merge items.
      s.items.push(...c.items);

      // Remove the old branch child.
      ArrayExt.removeAt(node.children, i);

      // Remove the stale branch item.
      ArrayExt.removeAt(node.items, i);

      // Patch up the sibling links.
      if (c.next) c.next.prev = s;
      s.next = c.next;

      // Clear the original child.
      clear(c);

      // Return the first modified index.
      return i - 1;
    }

    // Join case #5: steal from next sibling branch
    if (!isLeaf && hasExtra && hasNext) {
      // Cast the children to branches.
      let c = child as BranchNode<T>;
      let s = sibling as BranchNode<T>;

      // Steal a child from the next sibling.
      c.children.push(s.children.shift()!);

      // Steal an item from the next sibling.
      c.items.push(s.items.shift()!);

      // Update the branch items.
      node.items[i + 1] = s.items[0];

      // Update the sibling sizes.
      updateSizes(c, c.width - 1);
      updateSizes(s, 0);

      // Return the first modified index.
      return i;
    }

    // Join case #6: steal from previous sibling branch
    if (!isLeaf && hasExtra && !hasNext) {
      // Cast the children to branches.
      let c = child as BranchNode<T>;
      let s = sibling as BranchNode<T>;

      // Steal a child from the previous sibling.
      c.children.unshift(s.children.pop()!);

      // Steal an item from the previous sibling.
      c.items.unshift(s.items.pop()!);

      // Update the branch items.
      node.items[i] = c.items[0];

      // Update the sibling sizes.
      updateSizes(c, 0);
      updateSizes(s, s.width - 1);

      // Return the first modified index.
      return i - 1;
    }

    // Join case #7: merge with next sibling branch
    if (!isLeaf && !hasExtra && hasNext) {
      // Cast the children to branches.
      let c = child as BranchNode<T>;
      let s = sibling as BranchNode<T>;

      // Merge the children with the next sibling.
      s.children.unshift(...c.children);

      // Merge the items with the next sibling.
      s.items.unshift(...c.items);

      // Remove the old branch child.
      ArrayExt.removeAt(node.children, i);

      // Remove the stale branch item.
      ArrayExt.removeAt(node.items, i + 1);

      // Update the sibling sizes.
      updateSizes(s, 0);

      // Clear the original child but, not its children.
      c.children.length = 0;
      clear(c);

      // Return the first modified index.
      return i;
    }

    // Join case #8: merge with previous sibling branch
    if (!isLeaf && !hasExtra && !hasNext) {
      // Cast the children to branches.
      let c = child as BranchNode<T>;
      let s = sibling as BranchNode<T>;

      // Merge the children with the previous sibling.
      s.children.push(...c.children);

      // Merge the items with the previous sibling.
      s.items.push(...c.items);

      // Remove the old branch child.
      ArrayExt.removeAt(node.children, i);

      // Remove the stale branch item.
      ArrayExt.removeAt(node.items, i);

      // Update the sibling sizes.
      updateSizes(s, 0);

      // Clear the original child, but not its children.
      c.children.length = 0;
      clear(c);

      // Return the first modified index.
      return i - 1;
    }

    // One of the above cases must match.
    throw 'unreachable';
  }
}
