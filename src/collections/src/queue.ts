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
 * A generic first-in-first-out queue data structure.
 */
export
class Queue<T> implements IIterable<T> {
  /**
   * Construct a new queue.
   *
   * @param values - The initial values for the queue.
   */
  constructor(values?: IterableOrArrayLike<T>) {
    if (values) {
      each(values, value => { this.push(value); });
    }
  }

  /**
   * Test whether the queue is empty.
   *
   * @returns `true` if the queue is empty, `false` otherwise.
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
   * Get the length of the queue.
   *
   * @return The number of values in the queue.
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
   * Get the value at the front of the queue.
   *
   * @returns The front value, or `undefined` if the queue is empty.
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
   * Get the value at the back of the queue.
   *
   * @returns The back value, or `undefined` if the queue is empty.
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
   * Create an iterator over the values in the queue.
   *
   * @returns A new iterator starting at the front of the queue.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  iter(): IIterator<T> {
    return new Private.QueueIterator<T>(this._front);
  }

  /**
   * Push a value onto the back of the queue.
   *
   * @param value - The value to add to the back of the queue.
   *
   * @returns The new length of the queue.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  push(value: T): number {
    let node = new Private.QueueNode<T>(value);
    if (!this._back) {
      this._front = node;
      this._back = node;
    } else {
      this._back.next = node;
      this._back = node;
    }
    return ++this._length;
  }

  /**
   * Remove and return the value at the front of the queue.
   *
   * @returns The front value, or `undefined` if the queue is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * Iterators pointing at the removed value are invalidated.
   */
  pop(): T | undefined {
    let node = this._front;
    if (!node) {
      return undefined;
    }
    if (node === this._back) {
      this._front = null;
      this._back = null;
    } else {
      this._front = node.next;
      node.next = null;
    }
    this._length--;
    return node.value;
  }

  /**
   * Remove all values from the queue.
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
      node.next = null;
      node = next;
    }
    this._front = null;
    this._back = null;
    this._length = 0;
  }

  /**
   * Swap the contents of the queue with the contents of another.
   *
   * @param other - The other queue holding the contents to swap.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * All current iterators remain valid, but will now point to the
   * contents of the other queue involved in the swap.
   */
  swap(other: Queue<T>): void {
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
  private _front: Private.QueueNode<T> | null = null;
  private _back: Private.QueueNode<T> | null = null;
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * An iterator for a queue.
   */
  export
  class QueueIterator<T> implements IIterator<T> {
    /**
     * Construct a new queue iterator.
     *
     * @param node - The node at the front of the queue.
     */
    constructor(node: QueueNode<T> | null) {
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
      return new QueueIterator<T>(this._node);
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

    private _node: QueueNode<T> | null;
  }

  /**
   * The node type for a queue.
   */
  export
  class QueueNode<T> {
    /**
     * The next node the queue.
     */
    next: QueueNode<T> | null = null;

    /**
     * The value for the node.
     */
    value: T;

    /**
     * Construct a new queue node.
     *
     * @param value - The value for the node.
     */
    constructor(value: T) {
      this.value = value;
    }
  }
}
