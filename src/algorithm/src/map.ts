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
 * Transform the values of an iterable with a mapping function.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The mapping function to invoke for each value.
 *
 * @returns An iterator which yields the transformed values.
 *
 * #### Example
 * ```typescript
 * import { map, toArray } from '@phosphor/algorithm';
 *
 * let data = [1, 2, 3];
 *
 * let stream = map(data, value => value * 2);
 *
 * toArray(stream);  // [2, 4, 6]
 * ```
 */
export
function map<T, U>(object: IterableOrArrayLike<T>, fn: (value: T, index: number) => U): IIterator<U> {
  return new MapIterator<T, U>(iter(object), fn);
}


/**
 * An iterator which transforms values using a mapping function.
 */
export
class MapIterator<T, U> implements IIterator<U> {
  /**
   * Construct a new map iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param fn - The mapping function to invoke for each value.
   */
  constructor(source: IIterator<T>, fn: (value: T, index: number) => U) {
    this._source = source;
    this._fn = fn;
  }

  /**
   * Get an iterator over the object's values.
   *
   * @returns An iterator which yields the object's values.
   */
  iter(): IIterator<U> {
    return this;
  }

  /**
   * Create an independent clone of the iterator.
   *
   * @returns A new independent clone of the iterator.
   */
  clone(): IIterator<U> {
    let result = new MapIterator<T, U>(this._source.clone(), this._fn);
    result._index = this._index;
    return result;
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): U | undefined {
    let value = this._source.next();
    if (value === undefined) {
      return undefined;
    }
    return this._fn.call(undefined, value, this._index++);
  }

  private _index = 0;
  private _source: IIterator<T>;
  private _fn: (value: T, index: number) => U;
}
