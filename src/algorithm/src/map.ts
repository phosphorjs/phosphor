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
 * Transform the values of an iterable with a mapping function.
 *
 * @param object - The iterable object of interest.
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
function map<T, U>(object: Iterable<T>, fn: (value: T, index: number) => U): MapIterator<T, U> {
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
   * The mapping function is shared among clones.
   */
  clone(): MapIterator<T, U> {
    let result = new MapIterator<T, U>(this._source.clone(), this._fn);
    result._index = this._index;
    return result;
  }

  /**
   * Get the next mapped value from the source iterator.
   *
   * @returns The next value from the source iterator transformed
   *   by the mapper, or `undefined` if the iterator is exhausted.
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
