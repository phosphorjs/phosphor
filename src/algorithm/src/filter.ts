/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, Iterable, iter
} from './iterable';


/**
 * Filter an iterable for values which pass a test.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns An iterator which yields the values which pass the test.
 *
 * #### Example
 * ```typescript
 * import { filter, toArray } from '@phosphor/algorithm';
 *
 * let data = [1, 2, 3, 4, 5, 6];
 *
 * let stream = filter(data, value => value % 2 === 0);
 *
 * toArray(stream);  // [2, 4, 6]
 * ```
 */
export
function filter<T>(object: Iterable<T>, fn: (value: T, index: number) => boolean): FilterIterator<T> {
  return new FilterIterator<T>(iter(object), fn);
}


/**
 * An iterator which yields values which pass a test.
 */
export
class FilterIterator<T> implements IIterator<T> {
  /**
   * Construct a new filter iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param fn - The predicate function to invoke for each value.
   */
  constructor(source: IIterator<T>, fn: (value: T, index: number) => boolean) {
    this._source = source;
    this._fn = fn;
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
   * Create an independent clone of the current iterator.
   *
   * @returns A new independent clone of the current iterator.
   *
   * #### Notes
   * The source iterator must be cloneable.
   *
   * The predicate function is shared among clones.
   */
  clone(): FilterIterator<T> {
    let result = new FilterIterator<T>(this._source.clone(), this._fn);
    result._index = this._index;
    return result;
  }

  /**
   * Get the next value which passes the test.
   *
   * @returns The next value from the source iterator which passes
   *   the predicate, or `undefined` if the iterator is exhausted.
   */
  next(): T | undefined {
    let fn = this._fn;
    let it = this._source;
    let value: T | undefined;
    while ((value = it.next()) !== undefined) {
      if (fn(value, this._index++)) {
        return value;
      }
    }
    return undefined;
  }

  private _index = 0;
  private _source: IIterator<T>;
  private _fn: (value: T, index: number) => boolean;
}
