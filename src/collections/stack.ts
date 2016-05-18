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
 * A generic LIFO stack data structure.
 */
export
class Stack<T> implements IIterable<T> {
  /**
   * Construct a new stack.
   *
   * @param values - The initial values for the stack.
   */
  constructor(values?: IterableOrArrayLike<T>) {
    if (values) each(values, value => { this.pushBack(value); });
  }

  /**
   * Test whether the stack is empty.
   *
   * @returns `true` if the stack is empty, `false` otherwise.
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
    return this._array.length === 0;
  }

  /**
   * Get the length of the stack.
   *
   * @return The number of values in the stack.
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
    return this._array.length;
  }

  /**
   * Get the value at the back of the stack.
   *
   * @returns The value at the back of the stack, or `undefined` if
   *   the stack is empty.
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
    return this._array[this._array.length - 1];
  }

  /**
   * Create an iterator over the values in the stack.
   *
   * @returns A new iterator starting at the top of the stack.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  iter(): IIterator<T> {
    return new StackIterator<T>(this._array, this._array.length - 1);
  }

  /**
   * Add a value to the back of the stack.
   *
   * @param value - The value to add to the back of the stack.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  pushBack(value: T): void {
    this._array.push(value);
  }

  /**
   * Remove and return the value at the back of the stack.
   *
   * @returns The value at the back of the stack, or `undefined` if
   *   the stack is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * Iterators pointing at the removed value are invalidated.
   */
  popBack(): T {
    return this._array.pop();
  }

  /**
   * Remove all values from the stack.
   *
   * #### Complexity
   * Linear.
   *
   * #### Iterator Validity
   * All current iterators are invalidated.
   */
  clear(): void {
    this._array.length = 0;
  }

  /**
   * Swap the contents of the stack with the contents of another.
   *
   * @param other - The other stack holding the contents to swap.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * All current iterators remain valid, but will now point to the
   * contents of the other stack involved in the swap.
   */
  swap(other: Stack<T>): void {
    let array = other._array;
    other._array = this._array;
    this._array = array;
  }

  private _array: T[] = [];
}


/**
 * An iterator for a stack.
 */
class StackIterator<T> implements IIterator<T> {
  /**
   * Construct a new stack iterator.
   *
   * @param array - The stack of values of interest.
   *
   * @param index - The index of the top of the stack.
   */
  constructor(array: T[], index: number) {
    this._array = array;
    this._index = index;
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
   * Create an independent clone of the stack iterator.
   *
   * @returns A new iterator starting with the current value.
   */
  clone(): StackIterator<T> {
    return new StackIterator<T>(this._array, this._index);
  }

  /**
   * Get the next value from the stack.
   *
   * @returns The next value from the stack, or `undefined` if the
   *   iterator is exhausted.
   */
  next(): T {
    if (this._index < 0 || this._index >= this._array.length) {
      return void 0;
    }
    return this._array[this._index--];
  }

  private _array: T[];
  private _index: number;
}
