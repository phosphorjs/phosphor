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
class CircularBuffer<T> {
  /**
   * Construct a new circular buffer.
   */
  constructor(maxSize: number, items?: T[]) {
    this._array = new Array<T>(Math.max(1, maxSize));
    if (items) items.forEach(it => { this.pushBack(it) });
  }

  /**
   * The maximum size of the buffer.
   */
  get maxSize(): number {
    return this._array.length;
  }

  /**
   * The number of elements in the buffer.
   */
  get size(): number {
    return this._size;
  }

  /**
   * True if the buffer has elements, false otherwise.
   */
  get empty(): boolean {
    return this._size === 0;
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
   * Get the value at the given index.
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
    return this._rem(--this._size);
  }

  /**
   * Pop and return the value at the front of the buffer.
   */
  popFront(): T {
    if (this._size === 0) {
      return void 0;
    }
    var value = this._rem(0);
    this._increment();
    this._size--;
    return value;
  }

  /**
   * Remove all values from the buffer.
   */
  clear(): void {
    for (var i = 0, n = this._size; i < n; ++i) {
      this._set(i, void 0);
    }
    this._size = 0;
    this._offset = 0;
  }

  /**
   * Create an array from the values in the buffer.
   */
  toArray(): T[] {
    var result = new Array<T>(this._size);
    for (var i = 0, n = this._size; i < n; ++i) {
      result[i] = this._get(i);
    }
    return result;
  }

  /**
   * Returns true if any value in the buffer passes the given test.
   */
  some(pred: IPredicate<T>): boolean {
    for (var i = 0; i < this._size; ++i) {
      if (pred(this._get(i), i)) return true;
    }
    return false;
  }

  /**
   * Returns true if all values in the buffer pass the given test.
   */
  every(pred: IPredicate<T>): boolean {
    for (var i = 0; i < this._size; ++i) {
      if (!pred(this._get(i), i)) return false;
    }
    return true;
  }

  /**
   * Create an array of the values which pass the given test.
   */
  filter(pred: IPredicate<T>): T[] {
    var result: T[];
    for (var i = 0; i < this._size; ++i) {
      var value = this._get(i);
      if (pred(value, i)) result.push(value);
    }
    return result;
  }

  /**
   * Create an array of callback results for each value in the buffer.
   */
  map<U>(callback: ICallback<T, U>): U[] {
    var result = new Array<U>(this._size);
    for (var i = 0; i < this._size; ++i) {
      result[i] = callback(this._get(i), i);
    }
    return result;
  }

  /**
   * Execute a callback for each element in buffer.
   *
   * Iteration will terminate if the callbacks returns a value other
   * than `undefined`. That value will be returned from this method.
   */
  forEach<U>(callback: ICallback<T, U>): U {
    for (var i = 0; i < this._size; ++i) {
      var result = callback(this._get(i), i);
      if (result !== void 0) return result;
    }
    return void 0;
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
  private _rem(index: number): T {
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
