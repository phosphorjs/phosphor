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
 * A generic last-in-first-out stack data structure.
 */
export
class Stack<T> implements IIterable<T> {
  /**
   * Construct a new stack.
   *
   * @param values - The initial values for the stack.
   */
  constructor(values?: IterableOrArrayLike<T>) {
    if (values) {
      each(values, value => { this.push(value); });
    }
  }

  /**
   * Test whether the stack is empty.
   *
   * @returns `true` if the stack is empty, `false` otherwise.
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
   * Get the value at the top of the stack.
   *
   * @returns The top value, or `undefined` if the stack is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get top(): T | undefined {
    return this._array[this._array.length - 1];
  }

  /**
   * Get the value at the bottom of the stack.
   *
   * @returns The bottom value, or `undefined` if the stack is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  get bottom(): T | undefined {
    return this._array[0];
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
    return new Private.StackIterator<T>(this._array);
  }

  /**
   * Push a value onto the top of the stack.
   *
   * @param value - The value to add to the top of the stack.
   *
   * @returns The new length of the stack.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * No changes.
   */
  push(value: T): number {
    return this._array.push(value);
  }

  /**
   * Remove and return the value at the top of the stack.
   *
   * @returns The top value, or `undefined` if the stack is empty.
   *
   * #### Complexity
   * Constant.
   *
   * #### Iterator Validity
   * Iterators pointing at the removed value are invalidated.
   */
  pop(): T | undefined {
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
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * An iterator for a stack.
   */
  export
  class StackIterator<T> implements IIterator<T> {
    /**
     * Construct a new stack iterator.
     *
     * @param array - The stack of values of interest.
     */
    constructor(array: T[]) {
      this._array = array;
      this._index = array.length - 1;
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
      let result = new StackIterator<T>(this._array);
      result._index = this._index;
      return result;
    }

    /**
     * Get the next value from the iterator.
     *
     * @returns The next value from the iterator, or `undefined`.
     */
    next(): T | undefined {
      if (this._index < 0 || this._index >= this._array.length) {
        return undefined;
      }
      return this._array[this._index--];
    }

    private _array: T[];
    private _index: number;
  }
}
