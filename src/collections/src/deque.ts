/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IterableOrArrayLike, each
} from '@phosphor/algorithm';


/**
 * A generic double ended queue data structure.
 */
export
class Deque<T> implements IIterable<T> {
  /**
   * Construct a new deque.
   *
   * @param values - The initial values for the deque.
   */
  constructor(values?: IterableOrArrayLike<T>) {
    if (values) {
      each(values, value => { this.pushBack(value); });
    }
  }

  /**
   * Test whether the deque is empty.
   *
   * @returns `true` if the deque is empty, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get isEmpty(): boolean {
    return this._length === 0;
  }

  /**
   * Get the length of the deque.
   *
   * @return The number of values in the deque.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get length(): number {
    return this._length;
  }

  /**
   * Get the value at the front of the deque.
   *
   * @returns The front value, or `undefined` if the deque is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get front(): T | undefined {
    return this._front ? this._front.value : undefined;
  }

  /**
   * Get the value at the back of the deque.
   *
   * @returns The back value, or `undefined` if the deque is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get back(): T | undefined {
    return this._back ? this._back.value : undefined;
  }

  /**
   * Create an iterator over the values in the deque.
   *
   * @returns A new iterator starting at the front of the deque.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  iter(): IIterator<T> {
    return new Private.DequeIterator<T>(this._front);
  }

  /**
   * Push a value onto the front of the deque.
   *
   * @param value - The value to add to the front of the deque.
   *
   * @returns The new length of the deque.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  pushFront(value: T): number {
    let node = new Private.DequeNode<T>(value);
    if (!this._front) {
      this._front = node;
      this._back = node;
    } else {
      node.next = this._front;
      this._front.prev = node;
      this._front = node;
    }
    return ++this._length;
  }

  /**
   * Push a value onto the back of the deque.
   *
   * @param value - The value to add to the back of the deque.
   *
   * @returns The new length of the deque.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  pushBack(value: T): number {
    let node = new Private.DequeNode<T>(value);
    if (!this._back) {
      this._front = node;
      this._back = node;
    } else {
      node.prev = this._back;
      this._back.next = node;
      this._back = node;
    }
    return ++this._length;
  }

  /**
   * Remove and return the value at the front of the deque.
   *
   * @returns The front value, or `undefined` if the deque is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * Iterators pointing at the removed value are invalidated.
   */
  popFront(): T | undefined {
    let node = this._front;
    if (!node) {
      return undefined;
    }
    if (node === this._back) {
      this._front = null;
      this._back = null;
    } else {
      this._front = node.next;
      this._front!.prev = null;
      node.next = null;
    }
    this._length--;
    return node.value;
  }

  /**
   * Remove and return the value at the back of the deque.
   *
   * @returns The back value, or `undefined` if the deque is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * Iterators pointing at the removed value are invalidated.
   */
  popBack(): T | undefined {
    let node = this._back;
    if (!node) {
      return undefined;
    }
    if (node === this._front) {
      this._front = null;
      this._back = null;
    } else {
      this._back = node.prev;
      this._back!.next = null;
      node.prev = null;
    }
    this._length--;
    return node.value;
  }

  /**
   * Remove all values from the deque.
   *
   * #### Complexity
   * Linear.
   *
   * #### Iterator Validity
   * All current iterators are invalidated.
   */
  clear(): void {
    let node = this._front;
    while (node) {
      let next = node.next;
      node.prev = null;
      node.next = null;
      node = next;
    }
    this._front = null;
    this._back = null;
    this._length = 0;
  }

  /**
   * Swap the contents of the deque with the contents of another.
   *
   * @param other - The other deque holding the contents to swap.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * All current iterators remain valid, but will now point to the
   * contents of the other deque involved in the swap.
   */
  swap(other: Deque<T>): void {
    let length = other._length;
    let front = other._front;
    let back = other._back;
    other._length = this._length;
    other._front = this._front;
    other._back = this._back;
    this._length = length;
    this._front = front;
    this._back = back;
  }

  private _length = 0;
  private _front: Private.DequeNode<T> | null = null;
  private _back: Private.DequeNode<T> | null = null;
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * An iterator for a deque.
   */
  export
  class DequeIterator<T> implements IIterator<T> {
    /**
     * Construct a new deque iterator.
     *
     * @param node - The node at the front of the deque.
     */
    constructor(node: DequeNode<T> | null) {
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
      return new DequeIterator<T>(this._node);
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
      let value = this._node.value;
      this._node = this._node.next;
      return value;
    }

    private _node: DequeNode<T> | null;
  }

  /**
   * The node type for a deque.
   */
  export
  class DequeNode<T> {
    /**
     * The next node the deque.
     */
    next: DequeNode<T> | null = null;

    /**
     * The previous node in the deque.
     */
    prev: DequeNode<T> | null = null;

    /**
     * The value for the node.
     */
    value: T;

    /**
     * Construct a new deque node.
     *
     * @param value - The value for the node.
     */
    constructor(value: T) {
      this.value = value;
    }
  }
}
