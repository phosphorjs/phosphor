/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, IterableOrArrayLike, iter
} from './iter';


/**
 * Filter an iterable for values which pass a test.
 *
 * @param object - The iterable or array-like object of interest.
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
function filter<T>(object: IterableOrArrayLike<T>, fn: (value: T, index: number) => boolean): IIterator<T> {
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
    let result = new FilterIterator<T>(this._source.clone(), this._fn);
    result._index = this._index;
    return result;
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
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
