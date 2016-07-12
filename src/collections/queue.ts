/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IterableOrArrayLike, each
} from '../algorithm/iteration';


/**
 * A generic FIFO queue data structure.
 */
export
class Queue<T> implements IIterable<T> {
  /**
   * Construct a new queue.
   *
   * @param values - The initial values for the queue.
   */
  constructor(values?: IterableOrArrayLike<T>) {
    if (values) each(values, value => { this.pushBack(value); });
  }

  /**
   * Test whether the queue is empty.
   *
   * @returns `true` if the queue is empty, `false` otherwise.
   *
   * #### Notes
   * This is a read-only property.
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
   * #### Notes
   * This is a read-only property.
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
   * @returns The value at the front of the queue, or `undefined` if
   *   the queue is empty.
   *
   * #### Notes
   * This is a read-only property.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get front(): T {
    return this._front ? this._front.value : void 0;
  }

  /**
   * Get the value at the back of the queue.
   *
   * @returns The value at the back of the queue, or `undefined` if
   *   the queue is empty.
   *
   * #### Notes
   * This is a read-only property.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get back(): T {
    return this._back ? this._back.value : void 0;
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
    return new QueueIterator<T>(this._front);
  }

  /**
   * Add a value to the back of the queue.
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
  pushBack(value: T): number {
    let node = new QueueNode(value);
    if (this._length === 0) {
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
   * @returns The value at the front of the queue, or `undefined` if
   *   the queue is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * Iterators pointing at the removed value are invalidated.
   */
  popFront(): T {
    if (this._length === 0) {
      return void 0;
    }
    let node = this._front;
    if (this._length === 1) {
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
    this._length = 0;
    this._front = null;
    this._back = null;
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
  private _front: QueueNode<T> = null;
  private _back: QueueNode<T> = null;
}


/**
 * An iterator for a queue.
 */
class QueueIterator<T> implements IIterator<T> {
  /**
   * Construct a new queue iterator.
   *
   * @param node - The node at the front of range.
   */
  constructor(node: QueueNode<T>) {
    this._node = node;
  }

  /**
   * Create an iterator over the object's values.
   *
   * @returns A reference to `this` iterator.
   */
  iter(): this {
    return this;
  }

  /**
   * Create an independent clone of the queue iterator.
   *
   * @returns A new iterator starting with the current value.
   */
  clone(): QueueIterator<T> {
    return new QueueIterator<T>(this._node);
  }

  /**
   * Get the next value from the queue.
   *
   * @returns The next value from the queue, or `undefined` if the
   *   iterator is exhausted.
   */
  next(): T {
    if (!this._node) {
      return void 0;
    }
    let value = this._node.value;
    this._node = this._node.next;
    return value;
  }

  private _node: QueueNode<T>;
}


/**
 * The node type for a queue.
 */
class QueueNode<T> {
  /**
   * The next node the queue.
   */
  next: QueueNode<T> = null;

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
