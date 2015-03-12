/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IQueue = require('./IQueue');

export = RingBuffer;


/**
 * A generic ring buffer container.
 *
 * A ring buffer is a queue with a maximum size and constant time access
 * to its elements. Once the ring buffer reaches its maximum size, newly
 * added elements will overwrite the oldest elements.
 */
class RingBuffer<T> implements IQueue<T> {
  /**
   * Construct a new ring buffer.
   */
  constructor(maxLength: number) {
    this._m_maxLength = clipLength(maxLength);
  }

  /**
   * The maximum length of the buffer.
   */
  get maxLength(): number {
    return this._m_maxLength;
  }

  /**
   * The length of the buffer.
   */
  get length(): number {
    return this._m_count;
  }

  /**
   * The value at the front of the buffer.
   */
  get front(): T {
    if (this._m_count === 0) {
      return void 0;
    }
    return this._m_items[this._m_offset];
  }

  /**
   * The value at the back of the buffer.
   */
  get back(): T {
    if (this._m_count === 0) {
      return void 0;
    }
    var index = this._m_offset + this._m_count - 1;
    return this._m_items[index % this._m_maxLength];
  }

  /**
   * Get the value at the given index.
   */
  at(index: number): T {
    if (index < 0 || index >= this._m_count) {
      return void 0;
    }
    return this._m_items[(index + this._m_offset) % this._m_maxLength];
  }

  /**
   * Push a value onto the back of the buffer.
   */
  push(value: T): void {
    var index = (this._m_offset + this._m_count) % this._m_maxLength;
    if (this._m_count === this._m_maxLength) {
      this._m_offset = (this._m_offset + 1) % this._m_maxLength;
    } else {
      this._m_count++;
    }
    this._m_items[index] = value;
  }

  /**
   * Pop and return the first value in the buffer.
   */
  pop(): T {
    if (this._m_count === 0) {
      return void 0;
    }
    var value = this._m_items[this._m_offset];
    this._m_items[this._m_offset] = void 0;
    if (--this._m_count === 0) {
      this._m_offset = 0;
    } else {
      this._m_offset = (this._m_offset + 1) % this._m_maxLength;
    }
    return value;
  }

  /**
   * Remove all values from the buffer and release the buffer memory.
   */
  clear(): void {
    this._m_count = 0;
    this._m_offset = 0;
    this._m_items.length = 0;
  }

  /**
   * Execute a callback for each value in the queue.
   *
   * It is not safe to modify the queue while iterating.
   */
  forEach(callback: (value: T, index: number) => void): void {
    var items = this._m_items;
    var offset = this._m_offset;
    var maxLength = this._m_maxLength;
    for (var i = 0, n = this._m_count; i < n; ++i) {
      callback(items[(offset + i) % maxLength], i);
    }
  }

  /**
   * Returns true if all values pass the given test.
   *
   * It is not safe to modify the queue while iterating.
   */
  every(callback: (value: T, index: number) => boolean): boolean {
    var items = this._m_items;
    var offset = this._m_offset;
    var maxLength = this._m_maxLength;
    for (var i = 0, n = this._m_count; i < n; ++i) {
      if (!callback(items[(offset + i) % maxLength], i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns true if any value passes the given test.
   *
   * It is not safe to modify the queue while iterating.
   */
  some(callback: (value: T, index: number) => boolean): boolean {
    var items = this._m_items;
    var offset = this._m_offset;
    var maxLength = this._m_maxLength;
    for (var i = 0, n = this._m_count; i < n; ++i) {
      if (callback(items[(offset + i) % maxLength], i)) {
        return true;
      }
    }
    return false;
  }

  private _m_count = 0;
  private _m_offset = 0;
  private _m_items: T[] = [];
  private _m_maxLength: number;
}


/**
 * The maximum allowed length of a JS array.
 */
var MAX_ARRAY_LENGTH = 4294967295;


/**
 * Clip a length to the allowed bounds for a ring buffer.
 */
function clipLength(length: number) {
  return Math.max(1, Math.min(Math.floor(length), MAX_ARRAY_LENGTH));
}
