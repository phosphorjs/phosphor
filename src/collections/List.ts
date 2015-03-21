/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A collection of elements which can be accessed by index.
 */
export
class List<T> implements IList<T>, IStack<T> {
  /**
   * Construct a new list.
   */
  constructor(items?: IIterable<T> | T[]) {
    this._m_array = items !== void 0 ? toArray(items) : [];
  }

  /**
   * True if the list has elements, false otherwise.
   */
  get empty(): boolean {
    return this._m_array.length === 0;
  }

  /**
   * The number of elements in the list.
   */
  get size(): number {
    return this._m_array.length;
  }

  /**
   * The value at the back of the list.
   */
  get back(): T {
    return this._m_array[this._m_array.length - 1];
  }

  /**
   * Get an iterator for the elements in the list.
   */
  iterator(): IIterator<T> {
    return new ArrayIterator(this._m_array);
  }

  /**
   * Test whether the list contains the given value.
   */
  contains(value: T): boolean {
    return this.indexOf(value) !== -1;
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
   * Get the value at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  get(index: number): T {
    return this._m_array[index];
  }

  /**
   * Set the value at the given index.
   *
   * Returns false if the index is out of range.
   */
  set(index: number, value: T): boolean {
    var array = this._m_array;
    if (index < 0 || index >= array.length) {
      return false;
    }
    array[index] = value;
    return true;
  }

  /**
   * Add a value to the end of the list.
   *
   * This method always succeeds.
   */
  add(value: T): boolean {
    this._m_array.push(value);
    return true;
  }

  /**
   * Push a value onto the back of the list.
   */
  pushBack(value: T): void {
    this._m_array.push(value);
  }

  /**
   * Insert a value at the given index.
   *
   * Returns false if the index is out of range.
   */
  insert(index: number, value: T): boolean {
    var array = this._m_array;
    if (index < 0 || index > array.length) {
      return false;
    }
    for (var i = array.length; i > index; --i) {
      array[i] = array[i - 1];
    }
    array[index] = value;
    return true;
  }

  /**
   * Pop and return the value at the back of the list.
   */
  popBack(): T {
    return this._m_array.pop();
  }

  /**
   * Remove the first matching value from the list.
   *
   * Returns false if the value is not in the list.
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
    var array = this._m_array;
    if (index < 0 || index >= array.length) {
      return void 0;
    }
    var value = array[index];
    for (var i = index + 1, n = array.length; i < n; ++i) {
      array[i - 1] = array[i];
    }
    array.pop();
    return value;
  }

  /**
   * Remove all elements from the list.
   */
  clear(): void {
    this._m_array.length = 0;
  }

  private _m_array: T[];
}

} // module phosphor.collections
