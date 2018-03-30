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
 * A generic B+ list.
 */
export
class BList<T> implements IIterable<T>, IRetroable<T> {
  /**
   * Construct a new B+ list.
   *
   * @param options - The options for initializing the list.
   */
  constructor(options: BList.IOptions = {}) {
    this._root = this._first = this._last = new Private.LeafNode<T>();
    this._order = Private.parseOrder(options);
  }

  /**
   * The order of the list.
   *
   * #### Complexity
   * Constant.
   */
  get order(): number {
    return this._order;
  }

  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  get isEmpty(): boolean {
    return this._root.size === 0;
  }

  /**
   * The length of the list.
   *
   * #### Complexity
   * Constant.
   */
  get length(): number {
    return this._root.size;
  }

  /**
   * The first value in the list.
   *
   * This is `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  get first(): T | undefined {
    return this._first.firstValue;
  }

  /**
   * The last value in the list.
   *
   * This is `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  get last(): T | undefined {
    return this._last.lastValue;
  }

  /**
   * Create an iterator over the values in the list.
   *
   * @returns A new iterator starting with the first value.
   *
   * #### Complexity
   * Constant.
   */
  iter(): IIterator<T> {
    return this._first.iterValues();
  }

  /**
   * Create a reverse iterator over the values in the list.
   *
   * @returns A new iterator starting with the last value.
   *
   * #### Complexity
   * Constant.
   */
  retro(): IIterator<T> {
    return this._last.retroValues();
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
   * Logarithmic.
   */
  at(index: number): T | undefined {
    if (index < 0) {
      index += this._root.size;
    }
    if (index < 0 || index >= this._root.size) {
      return undefined;
    }
    return this._root.valueAt(index);
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
   * Logarithmic.
   */
  set(index: number, value: T): void {
    if (index < 0) {
      index += this._root.size;
    }
    if (index < 0 || index >= this._root.size) {
      return;
    }
    this._root.setAt(index, value);
  }

  /**
   * Assign new values to the list, replacing all current values.
   *
   * @param values - The values to assign to the list.
   *
   * #### Complexity
   * Linear.
   */
  assign(values: IterableOrArrayLike<T>): void {
    this._root = this._root.assign(values, this._order);
    this._first = this._root.firstLeaf();
    this._last = this._root.lastLeaf();
  }

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the end of the list.
   *
   * #### Complexity
   * Logarithmic.
   */
  push(value: T): void {
    this.insert(this.length, value);
  }

  /**
   * Remove and return the value at the end of the list.
   *
   * @returns The value at the end of the list, or `undefined`
   *   if the list is empty.
   *
   * #### Complexity
   * Logarithmic.
   */
  pop(): T | undefined {
    let value = this.at(-1);
    this.removeAt(-1);
    return value;
  }

  /**
   * Remove and return the value at the front of the list.
   *
   * @returns The value at the front of the list, or `undefined`
   *   if the list is empty.
   *
   * #### Complexity
   * Logarithmic.
   */
  shift(): T | undefined {
    let value = this.at(0);
    this.removeAt(0);
    return value;
  }

  /**
   * Add a value to the front of the list.
   *
   * @param value - The value to add to the front of the list.
   *
   * #### Complexity
   * Logarithmic.
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
   * Logarithmic.
   */
  insert(index: number, value: T): void {
    if (index < 0) {
      index = Math.max(0, index + this._root.size);
    } else {
      index = Math.min(index, this._root.size);
    }
    this._root = this._root.insert(index, value, this._order);
    this._first = this._root.firstLeaf();
    this._last = this._root.lastLeaf();
  }

  /**
   * Remove a value at a particular index.
   *
   * @param index - The index of the value to remove.
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
   * Clear the contents of the list.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void {
    this._root = this._root.clear();
  }

  /**
   * Dump the contents of the list into a simple object tree.
   *
   * @returns A tree dump starting at the root node of the list.
   *
   * #### Notes
   * The structure of the dump tree reflects the internal structure
   * of the list. This can be useful for debugging and optimization.
   */
  dump(): BList.TreeDump<T> {
    return this._root.dump();
  }

  private _order: number;
  private _root: Private.Node<T>;
  private _first: Private.LeafNode<T>;
  private _last: Private.LeafNode<T>;
}


/**
 * The namespace for the `BList` class statics.
 */
export
namespace BList {
  /**
   * An options object for initializing a B-List.
   */
  export
  interface IOptions {
    /**
     * The order of the list.
     *
     * A larger order creates a wider internal tree.
     *
     * The minimum is `4`, the default is `32`.
     */
    order?: number;
  }

  /**
   * A type alias for A B-List tree dump.
   */
  export
  type TreeDump<T> = IBranchDump<T> | ILeafDump<T>;

  /**
   * A dump tree for a B-List branch node.
   */
  export
  interface IBranchDump<T> {
    /**
     * The discriminated type of the object.
     */
    type: 'branch';

    /**
     * The total number of values in the subtree.
     */
    size: number;

    /**
     * The size of each child.
     */
    sizes: number[];

    /**
     * The children of the node.
     */
    children: TreeDump<T>[];
  }

  /**
   * A dump tree for a B-List leaf node.
   */
  export
  interface ILeafDump<T> {
    /**
     * The discriminated type of the object.
     */
    type: 'leaf';

    /**
     * The total number of values in the leaf.
     */
    size: number;

    /**
     * The values in the leaf.
     */
    values: T[];
  }
}

declare var console: any;
/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the nodes in a B-List.
   */
  export
  type Node<T> = BranchNode<T> | LeafNode<T>;

  /**
   * A class representing a branch node in a B-List.
   */
  export
  class BranchNode<T> {
    /**
     * The total number of values held in the subtree.
     */
    size = 0;

    /**
     * The size of each child subtree.
     */
    readonly sizes: number[] = [];

    /**
     * The child nodes of this branch node.
     */
    readonly children: Node<T>[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): 'branch' {
      return 'branch';
    }

    /**
     * The current width of the branch.
     */
    get width(): number {
      return this.children.length;
    }

    /**
     * Get the first leaf node in the subtree.
     */
    firstLeaf(): LeafNode<T> {
      return this.children[0].firstLeaf();
    }

    /**
     * Get the last leaf node in the subtree.
     */
    lastLeaf(): LeafNode<T> {
      return this.children[this.children.length - 1].firstLeaf();
    }

    /**
     * Get the value at the specified local index.
     */
    valueAt(index: number): T {
      let { i, local } = linearFindLocalIndex(this.sizes, index);
      return this.children[i].valueAt(local);
    }

    /**
     * Set the value at the specified local index.
     */
    setAt(index: number, value: T): void {
      let { i, local } = linearFindLocalIndex(this.sizes, index);
      return this.children[i].setAt(local, value);
    }

    /**
     * Assign new values to the list, replacing all current values.
     */
    assign(values: IterableOrArrayLike<T>, order: number): Node<T> {
      // Clear the branch.
      this.clearInternal();

      // Bulk load a new tree.
      return bulkLoad(values, order);
    }

    /**
     * Insert a value into the subtree.
     */
    insert(index: number, value: T, order: number): Node<T> {
      // Perform the actual insert.
      this.insertInternal(index, value, order);

      // Bail early if there is still room in the branch.
      if (this.width <= order) {
        return this;
      }

      // Split the node to the right and create a new sibling.
      let next = this.split(order);

      // Return a new root which holds the two branches.
      return createRoot(this, next);
    }

    /**
     * Remove a value from the subtree.
     */
    removeAt(index: number, order: number): Node<T> {
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
    clear(): Node<T> {
      this.clearInternal();
      return new LeafNode<T>();
    }

    /**
     * Dump the contents of the list into a simple object tree.
     */
    dump(): BList.IBranchDump<T> {
      let type = this.type;
      let size = this.size;
      let sizes = this.sizes;
      let children = this.children.map(child => child.dump());
      return { type, size, sizes, children };
    }

    /**
     * Perform an actual insert in the branch node.
     *
     * This may cause the node to become overfull.
     */
    insertInternal(index: number, value: T, order: number): void {
      // Find the local index for the given value.
      let { i, local } = linearFindLocalIndex(this.sizes, index);

      console.log('requested', index, i, local);

      // Fetch the pivot child.
      let child = this.children[i];

      // Perform the actual insert on the child.
      child.insertInternal(local, value, order);

      // Update the state of the branch.
      this.size++;
      this.sizes[i] = child.size;

      // Bail early if the child is not overfull.
      if (child.width <= order) {
        return;
      }

      // Split the node to the right and create a new sibling.
      let next = child.split(order);

      // Update the size record of the original child.
      this.sizes[i] = child.size;

      // Add the new sibling to the branch.
      ArrayExt.insert(this.children, i + 1, next);
      ArrayExt.insert(this.sizes, i + 1, next.size);
    }

    /**
     * Perform an actual remove from the branch node.
     */
    removeAtInternal(index: number, order: number): void {
      // Find the local index for the given index.
      let { i, local } = linearFindLocalIndex(this.sizes, index);

      // Fetch the pivot child.
      let child = this.children[i];

      // Perform the actual remove on the child.
      child.removeAtInternal(local, order);

      // Update the state of the branch.
      this.size--;
      this.sizes[i] = child.size;

      // Bail early if the child is not underfull.
      if (child.width >= Math.floor(order / 2)) {
        return;
      }

      // Join the child with one of its siblings.
      this.join(i, order);
    }

    /**
     * Perform the actual clearing of the branch node.
     */
    clearInternal(): void {
      each(this.children, child => child.clearInternal());
      this.size = 0;
      this.sizes.length = 0;
      this.children.length = 0;
    }

    /**
     * Split the node to the right and return the new sibling.
     *
     * This method assumes that the node is already overfull.
     */
    split(order: number): BranchNode<T> {
      // Create a new branch node for the split.
      let next = new BranchNode<T>();

      // Compute the number of items for the split.
      let count = Math.floor(order / 2);

      // Copy the relevant data to the new branch.
      for (let i = count, n = this.children.length; i < n; ++i) {
        this.size -= this.sizes[i];
        next.size += this.sizes[i];
        next.sizes[i - count] = this.sizes[i];
        next.children[i - count] = this.children[i];
      }

      // Remove the copied items from this branch.
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
      // Compute the minimum number of values.
      let count = Math.floor(order / 2);

      // Fetch the child to be joined.
      let child = this.children[i];

      // Fetch the relevant sibling.
      let sibling = i === 0 ? this.children[i + 1] : this.children[i - 1];

      // Compute the flags which control the join behavior.
      let hasNext = i === 0;
      let isLeaf = child.type === 'leaf';
      let hasExtra = sibling.width > count;

      // Join case #1:
      if (isLeaf && hasExtra && hasNext) {
        // Cast the children to leaves.
        let c = child as LeafNode<T>;
        let s = sibling as LeafNode<T>;

        // Steal a value from the next sibling.
        c.values.push(s.values.shift()!);

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.sizes[i + 1] = s.size;
        return;
      }

      // Join case #2:
      if (isLeaf && hasExtra && !hasNext) {
        // Cast the children to leaves.
        let c = child as LeafNode<T>;
        let s = sibling as LeafNode<T>;

        // Steal a value from the previous sibling.
        c.values.unshift(s.values.pop()!);

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.sizes[i - 1] = s.size;
        return;
      }

      // Join case #3:
      if (isLeaf && !hasExtra && hasNext) {
        // Cast the children to leaves.
        let c = child as LeafNode<T>;
        let s = sibling as LeafNode<T>;

        // Merge all the values with the next sibling.
        s.values.unshift(...c.values);

        // Update the branch data for the sibling.
        this.sizes[i + 1] = s.size;

        // Remove the original child from the branch.
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
        let c = child as LeafNode<T>;
        let s = sibling as LeafNode<T>;

        // Merge all the values with the previous sibling.
        s.values.push(...c.values);

        // Update the branch data for the sibiling.
        this.sizes[i - 1] = s.size;

        // Remove the original child from the branch.
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
        let c = child as BranchNode<T>;
        let s = sibling as BranchNode<T>;

        // Steal a record from the next sibling.
        c.sizes.push(s.sizes.shift()!);
        c.children.push(s.children.shift()!);

        // Update the sizes of the siblings.
        c.size += c.sizes[c.sizes.length - 1];
        s.size -= c.sizes[c.sizes.length - 1];

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.sizes[i + 1] = s.size;
        return;
      }

      // Join case #6:
      if (!isLeaf && hasExtra && !hasNext) {
        // Cast the children to branches.
        let c = child as BranchNode<T>;
        let s = sibling as BranchNode<T>;

        // Steal a record from the previous sibling.
        c.sizes.unshift(s.sizes.pop()!);
        c.children.unshift(s.children.pop()!);

        // Update the sizes of the siblings.
        c.size += c.sizes[0];
        s.size -= c.sizes[0];

        // Update the branch data for the children.
        this.sizes[i] = c.size;
        this.sizes[i - 1] = s.size;
        return;
      }

      // Join case #7:
      if (!isLeaf && !hasExtra && hasNext) {
        // Cast the children to branches.
        let c = child as BranchNode<T>;
        let s = sibling as BranchNode<T>;

        // Merge all the values with the next sibling.
        s.sizes.unshift(...c.sizes);
        s.children.unshift(...c.children);

        // Update the size of the sibling.
        s.size += c.size;

        // Update the branch data for the sibling.
        this.sizes[i + 1] = s.size;

        // Remove the original child from the branch.
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
        let c = child as BranchNode<T>;
        let s = sibling as BranchNode<T>;

        // Merge all the values with the previous sibling.
        s.sizes.push(...c.sizes);
        s.children.push(...c.children);

        // Update the size of the sibling.
        s.size += c.size;

        // Update the branch data for the sibling.
        this.sizes[i - 1] = s.size;

        // Remove the original child from the branch.
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
   * A class representing a leaf node in a B-List.
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
     * The values for the leaf node.
     */
    readonly values: T[] = [];

    /**
     * The discriminated type of the node.
     */
    get type(): 'leaf' {
      return 'leaf';
    }

    /**
     * The current width of the leaf.
     */
    get width(): number {
      return this.values.length;
    }

    /**
     * The total number of values held in the leaf node.
     */
    get size(): number {
      return this.values.length;
    }

    /**
     * The first value in the leaf node, or `undefined`.
     */
    get firstValue(): T | undefined {
      let { size, values } = this;
      return size > 0 ? values[0] : undefined;
    }

    /**
     * The last value in the leaf node, or `undefined`.
     */
    get lastValue(): T | undefined {
      let { size, values } = this;
      return size > 0 ? values[size - 1] : undefined;
    }

    /**
     * Get the first leaf node in the subtree.
     */
    firstLeaf(): LeafNode<T> {
      return this;
    }

    /**
     * Get the last leaf node in the subtree.
     */
    lastLeaf(): LeafNode<T> {
      return this;
    }

    /**
     * Create a forward iterator for the values in the list.
     */
    iterValues(): IIterator<T> {
      return new ForwardIterator<T>(this);
    }

    /**
     * Create a reverse iterator for the values in the list.
     */
    retroValues(): IIterator<T> {
      return new RetroIterator<T>(this);
    }

    /**
     * Get the value at the specified local index.
     */
    valueAt(index: number): T {
      return this.values[index];
    }

    /**
     * Set the value at the specified local index.
     */
    setAt(index: number, value: T): void {
      this.values[index] = value;
    }

    /**
     * Assign new values to the list, replacing all current values.
     */
    assign(values: IterableOrArrayLike<T>, order: number): Node<T> {
      // Clear the leaf.
      this.clearInternal();

      // Bulk load a new tree.
      return bulkLoad(values, order);
    }

    /**
     * Insert a value into the leaf node.
     */
    insert(index: number, value: T, order: number): Node<T> {
      // Perform the actual insert.
      this.insertInternal(index, value, order);

      // Bail early if the node is not overfull.
      if (this.width <= order) {
        return this;
      }

      // Split the node to the right and create a new sibling.
      let next = this.split(order);

      // Return a new root which holds the two leaves.
      return createRoot(this, next);
    }

    /**
     * Remove a value from the leaf node.
     */
    removeAt(index: number, order: number): Node<T> {
      this.removeAtInternal(index, order);
      return this;
    }

    /**
     * Clear the contents of the list.
     */
    clear(): Node<T> {
      this.clearInternal();
      return this;
    }

    /**
     * Dump the contents of the list into a simple object tree.
     */
    dump(): BList.ILeafDump<T> {
      let type = this.type;
      let size = this.size;
      let values = this.values.slice();
      return { type, size, values };
    }

    /**
     * Perform an actual insert in the leaf node.
     *
     * This may cause the node to become overfull.
     */
    insertInternal(index: number, value: T, order: number): void {
      ArrayExt.insert(this.values, index, value);
    }

    /**
     * Perform an actual remove from the leaf node.
     */
    removeAtInternal(index: number, order: number): void {
      ArrayExt.removeAt(this.values, index);
    }

    /**
     * Perform the actual clearing of the leaf node.
     */
    clearInternal(): void {
      this.next = null;
      this.prev = null;
      this.values.length = 0;
    }

    /**
     * Split the node to the right and return the new sibling.
     *
     * This method assumes that the node is already overfull.
     */
    split(order: number): LeafNode<T> {
      // Create a new leaf node for the split.
      let next = new LeafNode<T>();

      // Compute the number of values for the split.
      let count = Math.floor(order / 2);

      // Copy the relevant values to the new leaf.
      for (let i = count, n = this.width; i < n; ++i) {
        next.values[i - count] = this.values[i];
      }

      // Remove the copied values from this leaf.
      this.values.length = count;

      // Patch up the sibling links.
      if (this.next) this.next.prev = next;
      next.next = this.next;
      next.prev = this;
      this.next = next;

      // Return the new sibling.
      return next;
    }
  }

  /**
   * Parse and normalize the order option for a B-List.
   */
  export
  function parseOrder(options: BList.IOptions): number {
    let order = options.order !== undefined ? options.order : defaultOrder;
    return Math.max(minimumOrder, Math.floor(order));
  }

  /**
   * Bulk load values into a new list.
   */
  export
  function bulkLoad<T>(values: IterableOrArrayLike<T>, order: number): Node<T> {
    // Set up the array to hold the leaf nodes.
    let leaves: LeafNode<T>[] = [new LeafNode<T>()];

    // Create and fill the leaf nodes with the values.
    each(values, value => {
      // Fetch the current leaf node.
      let leaf = leaves[leaves.length - 1];

      // If the current leaf is at capacity, create a new leaf.
      if (leaf.width === order) {
        let next = new LeafNode<T>();
        next.prev = leaf;
        leaf.next = next;
        leaves.push(next);
        leaf = next;
      }

      // Add the value to the current leaf.
      leaf.values.push(value);
    });

    // Set up the variable to hold the working nodes.
    let nodes: Node<T>[] = leaves;

    // Aggregate the working nodes until there is a single root.
    while (nodes.length > 1) {
      // Set up the array to hold the generated branch nodes.
      let branches: BranchNode<T>[] = [new BranchNode<T>()];

      // Create and fill the branches with the working nodes.
      for (let i = 0, n = nodes.length; i < n; ++i) {
        // Fetch the current working node.
        let node = nodes[i];

        // Fetch the current branch.
        let branch = branches[branches.length - 1];

        // If the current branch is at capacity, create a new branch.
        if (branch.width === order) {
          branch = new BranchNode<T>();
          branches.push(branch);
        }

        // Add the current node to the branch.
        branch.size += node.size;
        branch.children.push(node);
        branch.sizes.push(node.size);
      }

      // Update the working nodes with the generated branches.
      nodes = branches;
    }

    // Return the root node.
    return nodes[0];
  }

  /**
   * The default order for a B-List.
   */
  const defaultOrder = 32;

  /**
   * The minimum order for a B-List.
   */
  const minimumOrder = 4;

  /**
   * A forward iterator for B-List nodes.
   */
  class ForwardIterator<T> implements IIterator<T> {
    /**
     * Construct a new forward iterator.
     *
     * @param node - The first node in the chain.
     */
    constructor(node: LeafNode<T> | null) {
      this._node = node;
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
      let clone = new ForwardIterator<T>(this._node);
      clone._index = this._index;
      return clone;
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): T | undefined {
      if (this._node === null) {
        return undefined;
      }
      if (this._index >= this._node.size) {
        this._index = 0;
        this._node = this._node.next;
        return this.next();
      }
      return this._node.values[this._index++];
    }

    private _index = 0;
    private _node: LeafNode<T> | null;
  }

  /**
   * A reverse iterator for B-List nodes.
   */
  class RetroIterator<T> implements IIterator<T> {
    /**
     * Construct a new retro iterator.
     *
     * @param node - The last node in the chain.
     */
    constructor(node: LeafNode<T> | null) {
      this._node = node;
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
      let clone = new RetroIterator<T>(this._node);
      clone._index  = this._index;
      return clone;
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): T | undefined {
      if (this._node === null) {
        return undefined;
      }
      if (this._index >= this._node.size) {
        this._index = 0;
        this._node = this._node.prev;
        return this.next();
      }
      return this._node.values[this._node.size - this._index++ - 1];
    }

    private _index = 0;
    private _node: LeafNode<T> | null;
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
    return { i: sizes.length - 1, local: sizes[sizes.length - 1] };
  }

  /**
   * Create a root node which holds two children.
   */
  function createRoot<T>(first: Node<T>, second: Node<T>): BranchNode<T> {
    let root = new BranchNode<T>();
    root.size = first.size + second.size;
    root.sizes[0] = first.size;
    root.sizes[1] = second.size;
    root.children[0] = first;
    root.children[1] = second;
    return root;
  }
}
