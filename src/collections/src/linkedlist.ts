/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike, each
} from '@phosphor/algorithm';


/**
 * A generic doubly-linked list.
 */
export
class LinkedList<T> implements IIterable<T>, IRetroable<T> {
  /**
   * Construct a new linked list.
   */
  constructor() { }

  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  get isEmpty(): boolean {
    return this._length === 0;
  }

  /**
   * The length of the list.
   *
   * #### Complexity
   * Constant.
   */
  get length(): number {
    return this._length;
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
    return this._first ? this._first.value : undefined;
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
    return this._last ? this._last.value : undefined;
  }

  /**
   * The first node in the list.
   *
   * This is `null` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  get firstNode(): LinkedList.INode<T> | null {
    return this._first;
  }

  /**
   * The last node in the list.
   *
   * This is `null` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  get lastNode(): LinkedList.INode<T> | null {
    return this._last;
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
    return new LinkedList.ForwardValueIterator<T>(this._first);
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
    return new LinkedList.RetroValueIterator<T>(this._last);
  }

  /**
   * Create an iterator over the nodes in the list.
   *
   * @returns A new iterator starting with the first node.
   *
   * #### Complexity
   * Constant.
   */
  nodes(): IIterator<LinkedList.INode<T>> {
    return new LinkedList.ForwardNodeIterator<T>(this._first);
  }

  /**
   * Create a reverse iterator over the nodes in the list.
   *
   * @returns A new iterator starting with the last node.
   *
   * #### Complexity
   * Constant.
   */
  retroNodes(): IIterator<LinkedList.INode<T>> {
    return new LinkedList.RetroNodeIterator<T>(this._last);
  }

  /**
   * Add a value to the beginning of the list.
   *
   * @param value - The value to add to the beginning of the list.
   *
   * @returns The list node which holds the value.
   *
   * #### Complexity
   * Constant.
   */
  addFirst(value: T): LinkedList.INode<T> {
    let node = new Private.LinkedListNode<T>(this, value);
    if (!this._first) {
      this._first = node;
      this._last = node;
    } else {
      node.next = this._first;
      this._first.prev = node;
      this._first = node;
    }
    this._length++;
    return node;
  }

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the end of the list.
   *
   * @returns The list node which holds the value.
   *
   * #### Complexity
   * Constant.
   */
  addLast(value: T): LinkedList.INode<T> {
    let node = new Private.LinkedListNode<T>(this, value);
    if (!this._last) {
      this._first = node;
      this._last = node;
    } else {
      node.prev = this._last;
      this._last.next = node;
      this._last = node;
    }
    this._length++;
    return node;
  }

  /**
   * Insert a value before a specific node in the list.
   *
   * @param value - The value to insert before the reference node.
   *
   * @param ref - The reference node of interest. If this is `null`,
   *   the value will be added to the beginning of the list.
   *
   * @returns The list node which holds the value.
   *
   * #### Notes
   * The reference node must be owned by the list.
   *
   * #### Complexity
   * Constant.
   */
  insertBefore(value: T, ref: LinkedList.INode<T> | null): LinkedList.INode<T> {
    if (!ref || ref === this._first) {
      return this.addFirst(value);
    }
    if (!(ref instanceof Private.LinkedListNode) || ref.list !== this) {
      throw new Error('Reference node is not owned by the list.');
    }
    let node = new Private.LinkedListNode<T>(this, value);
    let _ref = ref as Private.LinkedListNode<T>;
    let prev = _ref.prev!;
    node.next = _ref;
    node.prev = prev;
    _ref.prev = node;
    prev.next = node;
    this._length++;
    return node;
  }

  /**
   * Insert a value after a specific node in the list.
   *
   * @param value - The value to insert after the reference node.
   *
   * @param ref - The reference node of interest. If this is `null`,
   *   the value will be added to the end of the list.
   *
   * @returns The list node which holds the value.
   *
   * #### Notes
   * The reference node must be owned by the list.
   *
   * #### Complexity
   * Constant.
   */
  insertAfter(value: T, ref: LinkedList.INode<T> | null): LinkedList.INode<T> {
    if (!ref || ref === this._last) {
      return this.addLast(value);
    }
    if (!(ref instanceof Private.LinkedListNode) || ref.list !== this) {
      throw new Error('Reference node is not owned by the list.');
    }
    let node = new Private.LinkedListNode<T>(this, value);
    let _ref = ref as Private.LinkedListNode<T>;
    let next = _ref.next!;
    node.next = next;
    node.prev = _ref;
    _ref.next = node;
    next.prev = node;
    this._length++;
    return node;
  }

  /**
   * Remove and return the value at the beginning of the list.
   *
   * @returns The removed value, or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  removeFirst(): T | undefined {
    let node = this._first;
    if (!node) {
      return undefined;
    }
    if (node === this._last) {
      this._first = null;
      this._last = null;
    } else {
      this._first = node.next;
      this._first!.prev = null;
    }
    node.list = null;
    node.next = null;
    node.prev = null;
    this._length--;
    return node.value;
  }

  /**
   * Remove and return the value at the end of the list.
   *
   * @returns The removed value, or `undefined` if the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  removeLast(): T | undefined {
    let node = this._last;
    if (!node) {
      return undefined;
    }
    if (node === this._first) {
      this._first = null;
      this._last = null;
    } else {
      this._last = node.prev;
      this._last!.next = null;
    }
    node.list = null;
    node.next = null;
    node.prev = null;
    this._length--;
    return node.value;
  }

  /**
   * Remove a specific node from the list.
   *
   * @param node - The node to remove from the list.
   *
   * #### Complexity
   * Constant.
   *
   * #### Notes
   * The node must be owned by the list.
   */
  removeNode(node: LinkedList.INode<T>): void {
    if (!(node instanceof Private.LinkedListNode) || node.list !== this) {
      throw new Error('Node is not owned by the list.');
    }
    let _node = node as Private.LinkedListNode<T>;
    if (_node === this._first && _node === this._last) {
      this._first = null;
      this._last = null;
    } else if (_node === this._first) {
      this._first = _node.next;
      this._first!.prev = null;
    } else if (_node === this._last) {
      this._last = _node.prev;
      this._last!.next = null;
    } else {
      _node.next!.prev = _node.prev;
      _node.prev!.next = _node.next;
    }
    _node.list = null;
    _node.next = null;
    _node.prev = null;
    this._length--;
  }

  /**
   * Remove all values from the list.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void {
    let node = this._first;
    while (node) {
      let next = node.next;
      node.list = null;
      node.prev = null;
      node.next = null;
      node = next;
    }
    this._first = null;
    this._last = null;
    this._length = 0;
  }

  private _first: Private.LinkedListNode<T> | null = null;
  private _last: Private.LinkedListNode<T> | null = null;
  private _length = 0;
}


/**
 * The namespace for the `LinkedList` class statics.
 */
export
namespace LinkedList {
  /**
   * An object which represents a node in a linked list.
   *
   * #### Notes
   * User code will not create linked list nodes directly. Nodes
   * are created automatically when values are added to a list.
   */
  export
  interface INode<T> {
    /**
     * The linked list which created and owns the node.
     *
     * This will be `null` when the node is removed from the list.
     */
    readonly list: LinkedList<T> | null;

    /**
     * The next node in the list.
     *
     * This will be `null` when the node is the last node in the list
     * or when the node is removed from the list.
     */
    readonly next: INode<T> | null;

    /**
     * The previous node in the list.
     *
     * This will be `null` when the node is the first node in the list
     * or when the node is removed from the list.
     */
    readonly prev: INode<T> | null;

    /**
     * The user value stored in the node.
     */
    readonly value: T;
  }

  /**
   * Create a linked list from an iterable of values.
   *
   * @param values - The iterable or array-like object of interest.
   *
   * @returns A new linked list initialized with the given values.
   */
  export
  function from<T>(values: IterableOrArrayLike<T>): LinkedList<T> {
    let list = new LinkedList<T>();
    each(values, value => { list.addLast(value); });
    return list;
  }

  /**
   * A forward iterator for values in a linked list.
   */
  export
  class ForwardValueIterator<T> implements IIterator<T> {
    /**
     * Construct a forward value iterator.
     *
     * @param node - The first node in the list.
     */
    constructor(node: INode<T> | null) {
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
      return new ForwardValueIterator<T>(this._node);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): T | undefined {
      if (!this._node) {
        return undefined;
      }
      let node = this._node;
      this._node = node.next;
      return node.value;
    }

    private _node: INode<T> | null;
  }

  /**
   * A reverse iterator for values in a linked list.
   */
  export
  class RetroValueIterator<T> implements IIterator<T> {
    /**
     * Construct a retro value iterator.
     *
     * @param node - The last node in the list.
     */
    constructor(node: INode<T> | null) {
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
      return new RetroValueIterator<T>(this._node);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): T | undefined {
      if (!this._node) {
        return undefined;
      }
      let node = this._node;
      this._node = node.prev;
      return node.value;
    }

    private _node: INode<T> | null;
  }

  /**
   * A forward iterator for nodes in a linked list.
   */
  export
  class ForwardNodeIterator<T> implements IIterator<INode<T>> {
    /**
     * Construct a forward node iterator.
     *
     * @param node - The first node in the list.
     */
    constructor(node: INode<T> | null) {
      this._node = node;
    }

    /**
     * Get an iterator over the object's values.
     *
     * @returns An iterator which yields the object's values.
     */
    iter(): IIterator<INode<T>> {
      return this;
    }

    /**
     * Create an independent clone of the iterator.
     *
     * @returns A new independent clone of the iterator.
     */
    clone(): IIterator<INode<T>> {
      return new ForwardNodeIterator<T>(this._node);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): INode<T> | undefined {
      if (!this._node) {
        return undefined;
      }
      let node = this._node;
      this._node = node.next;
      return node;
    }

    private _node: INode<T> | null;
  }

  /**
   * A reverse iterator for nodes in a linked list.
   */
  export
  class RetroNodeIterator<T> implements IIterator<INode<T>> {
    /**
     * Construct a retro node iterator.
     *
     * @param node - The last node in the list.
     */
    constructor(node: INode<T> | null) {
      this._node = node;
    }

    /**
     * Get an iterator over the object's values.
     *
     * @returns An iterator which yields the object's values.
     */
    iter(): IIterator<INode<T>> {
      return this;
    }

    /**
     * Create an independent clone of the iterator.
     *
     * @returns A new independent clone of the iterator.
     */
    clone(): IIterator<INode<T>> {
      return new RetroNodeIterator<T>(this._node);
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): INode<T> | undefined {
      if (!this._node) {
        return undefined;
      }
      let node = this._node;
      this._node = node.prev;
      return node;
    }

    private _node: INode<T> | null;
  }
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * The internal linked list node implementation.
   */
  export
  class LinkedListNode<T> {
    /**
     * The linked list which created and owns the node.
     */
    list: LinkedList<T> | null = null;

    /**
     * The next node in the list.
     */
    next: LinkedListNode<T> | null = null;

    /**
     * The previous node in the list.
     */
    prev: LinkedListNode<T> | null = null;

    /**
     * The user value stored in the node.
     */
    readonly value: T;

    /**
     * Construct a new linked list node.
     *
     * @param list - The list which owns the node.
     *
     * @param value - The value for the link.
     */
    constructor(list: LinkedList<T>, value: T) {
      this.list = list;
      this.value = value;
    }
  }
}
