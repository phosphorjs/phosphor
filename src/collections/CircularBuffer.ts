/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A circular buffer with a fixed maximum size.
 *
 * A circular buffer is a buffer with constant time access to its
 * elements and constant times inserts and deletes from the front
 * and back of the buffer. When the buffer reaches its maximum
 * size, newly added elements will overwrite existing elements.
 */
export
class CircularBuffer<T> implements IDeque<T>, IList<T>, IStack<T> {
  /**
   * Construct a new circular buffer.
   */
  constructor(maxSize: number, items?: IIterable<T> | T[]) {
    this._array = new Array<T>(Math.max(1, maxSize));
    if (items !== void 0) forEach(items, it => { this.pushBack(it) });
  }

  /**
   * The maximum size of the buffer.
   */
  get maxSize(): number {
    return this._array.length;
  }

  /**
   * True if the buffer has elements, false otherwise.
   */
  get empty(): boolean {
    return this._size === 0;
  }

  /**
   * The number of elements in the buffer.
   */
  get size(): number {
    return this._size;
  }

  /**
   * The value at the front of the buffer.
   */
  get front(): T {
    return this._size !== 0 ? this._get(0) : void 0;
  }

  /**
   * The value at the back of the buffer.
   */
  get back(): T {
    return this._size !== 0 ? this._get(this._size - 1) : void 0;
  }

  /**
   * Get an iterator for the elements in the buffer.
   */
  iterator(): IIterator<T> {
    return new ListIterator(this);
  }

  /**
   * Test whether the buffer contains the given value.
   */
  contains(value: T): boolean {
    return this.indexOf(value) !== -1;
  }

  /**
   * Get the index of the given value.
   *
   * Returns -1 if the value is not in the buffer.
   */
  indexOf(value: T): number {
    for (var i = 0, n = this._size; i < n; ++i) {
      if (this._get(i) === value) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Get the element at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  get(index: number): T {
    if (index < 0 || index >= this._size) {
      return void 0;
    }
    return this._get(index);
  }

  /**
   * Set the value at the given index.
   *
   * Returns false if the index is out of range.
   */
  set(index: number, value: T): boolean {
    if (index < 0 || index >= this._size) {
      return false;
    }
    this._set(index, value);
    return true;
  }

  /**
   * Push a value onto the back of the buffer.
   *
   * If the buffer is full, the front element will be overwritten.
   */
  pushBack(value: T): void {
    this._set(this._size, value);
    if (this._size === this._array.length) {
      this._increment();
    } else {
      this._size++;
    }
  }

  /**
   * Push a value onto the front of the buffer.
   *
   * If the buffer is full, the back element will be overwritten.
   */
  pushFront(value: T): void {
    this._decrement();
    this._set(0, value);
    if (this._size < this._array.length) {
      this._size++;
    }
  }

  /**
   * Pop and return the value at the back of the buffer.
   */
  popBack(): T {
    if (this._size === 0) {
      return void 0;
    }
    return this._del(--this._size);
  }

  /**
   * Pop and return the value at the front of the buffer.
   */
  popFront(): T {
    if (this._size === 0) {
      return void 0;
    }
    var value = this._del(0);
    this._increment();
    this._size--;
    return value;
  }

  /**
   * Add a value to the back of the buffer.
   *
   * This method always succeeds.
   */
  add(value: T): boolean {
    this.pushBack(value);
    return true;
  }

  /**
   * Insert a value at the given index.
   *
   * If the buffer is full, the first element will be overwritten.
   *
   * Returns false if the index is out of range.
   */
  insert(index: number, value: T): boolean {
    if (index < 0 || index > this._size) {
      return false;
    }
    this.pushBack(void 0);
    for (var i = this._size - 1; i > index; --i) {
      this._set(i, this._get(i - 1));
    }
    this._set(index, value);
    return true;
  }

  /**
   * Remove the first matching value from the buffer.
   *
   * Returns false if the value is not in the buffer.
   */
  remove(value: T): boolean {
    var index = this.indexOf(value);
    if (index !== -1) {
      this.removeAt(index);
      return true;
    }
    return false;
  }

  /**
   * Remove and return the value at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  removeAt(index: number): T {
    if (index < 0 || index >= this._size) {
      return void 0;
    }
    var value = this._get(index);
    for (var i = index + 1, n = this._size; i < n; ++i) {
      this._set(i - 1, this._get(i));
    }
    this.popBack();
    return value;
  }

  /**
   * Remove all elements from the buffer.
   */
  clear(): void {
    var max = this._array.length;
    this._array.length = 0;
    this._array.length = max;
    this._size = 0;
    this._offset = 0;
  }

  /**
   * Get the value for the apparent index.
   *
   * The index is assumed to be in-range.
   */
  private _get(index: number): T {
    return this._array[(index + this._offset) % this._array.length];
  }

  /**
   * Set the value for the apparent index.
   *
   * The index is assumed to be in-range.
   */
  private _set(index: number, value: T): void {
    this._array[(index + this._offset) % this._array.length] = value;
  }

  /**
   * Clear and return the value at the apparent index.
   *
   * The index is assumed to be in-range.
   */
  private _del(index: number): T {
    var i = (index + this._offset) % this._array.length;
    var value = this._array[i];
    this._array[i] = void 0;
    return value;
  }

  /**
   * Increment the offset by one.
   */
  private _increment(): void {
    if (this._offset === this._array.length - 1) {
      this._offset = 0;
    } else {
      this._offset++;
    }
  }

  /**
   * Decrement the offset by one.
   */
  private _decrement(): void {
    if (this._offset === 0) {
      this._offset = this._array.length - 1;
    } else {
      this._offset--;
    }
  }

  private _size = 0;
  private _offset = 0;
  private _array: T[];
}

} // module phosphor.collections
