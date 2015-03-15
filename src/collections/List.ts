/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IIterator = require('./IIterator');
import IIteratorResult = require('./IIteratorResult');
import IList = require('./IList');

export = List;


/**
 * An array-based implementation of IList.
 */
class List<T> implements IList<T> {
  /**
   * Construct a new list.
   */
  constructor() { }

  /**
   * The number of items in the collection.
   */
  get length(): number {
    return this._m_array.length;
  }

  /**
   * Get an iterator for the items in the iterable.
   */
  $$iterator(): IIterator<T> {
    return new ListIterator(this._m_array);
  }

  /**
   * Get the value at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  at(index: number): T {
    return this._m_array[index];
  }

  /**
   * Get the index of the given value.
   *
   * Returns -1 if the value is not in the list.
   */
  indexOf(value: T): number {
    var array = this._m_array;
    for (var i = 0, n = array.length; i < n; ++i) {
      if (array[i] === value) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Test whether the collection contains a value.
   */
  contains(value: T): boolean {
    return this.indexOf(value) !== -1;
  }

  /**
   * Create a new array filled with the items in the collection.
   */
  asArray(): T[] {
    var result: T[] = [];
    var array = this._m_array;
    for (var i = 0, n = array.length; i < n; ++i) {
      result.push(array[i]);
    }
    return result;
  }

  /**
   * Add a value to the end of the list.
   *
   * Returns the new index of the value.
   */
  add(value: T): number {
    return this._m_array.push(value) - 1;
  }

  /**
   * Insert a value at the given index.
   *
   * An out of range index will be clamped.
   *
   * Returns the new index of the value.
   */
  insert(index: number, value: T): number {
    var array = this._m_array;
    var n = array.length;
    var i = index | 0;
    i = i > n ? n : i < 0 ? 0 : i;
    for (var j = n; j >= i; --j) {
      array[j] = array[j - 1];
    }
    array[i] = value;
    return i;
  }

  /**
   * Remove the first matching value from the list.
   *
   * Returns the index of the removed value, or -1.
   */
  remove(value: T): number {
    var i = this._m_array.indexOf(value);
    if (i !== -1) this.removeAt(i);
    return i;
  }

  /**
   * Remove and return the value at the given index.
   *
   * Returns `undefined` if no matching value is found.
   */
  removeAt(index: number): T {
    var array = this._m_array;
    var n = array.length;
    var i = index | 0;
    if (i < 0 || i >= n) {
      return void 0;
    }
    var value = array[i];
    for (var j = i + 1; j < n; ++j) {
      array[j - 1] = array[j];
    }
    array.pop();
    return value;
  }

  /**
   * Remove all items from the collection.
   */
  clear(): void {
    this._m_array.length = 0;
  }

  private _m_array: T[] = [];
}


/**
 * An iterator for a List collection.
 */
class ListIterator<T> implements IIterator<T> {
  /**
   * Construct a new list iterator.
   */
  constructor(array: T[]) {
    this._m_array = array;
  }

  /**
   * Get the next value for the iterator.
   */
  next(): IIteratorResult<T> {
    if (this._m_index >= this._m_array.length) {
      return { done: true, value: void 0 };
    }
    return { done: false, value: this._m_array[this._m_index++] };
  }

  private _m_index = 0;
  private _m_array: T[];
}
