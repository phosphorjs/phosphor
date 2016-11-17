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
 * Iterate several iterables in lockstep.
 *
 * @param objects - The iterable objects of interest.
 *
 * @returns An iterator which yields successive tuples of values where
 *   each value is taken in turn from the provided iterables. It will
 *   be as long as the shortest provided iterable.
 *
 * #### Example
 * ```typescript
 * import { zip, toArray } from '@phosphor/algorithm';
 *
 * let data1 = [1, 2, 3];
 * let data2 = [4, 5, 6];
 *
 * let stream = zip(data1, data2);
 *
 * toArray(stream);  // [[1, 4], [2, 5], [3, 6]]
 * ```
 */
export
function zip<T>(...objects: Iterable<T>[]): ZipIterator<T> {
  return new ZipIterator<T>(objects.map(iter));
}


/**
 * An iterator which iterates several sources in lockstep.
 */
export
class ZipIterator<T> implements IIterator<T[]> {
  /**
   * Construct a new zip iterator.
   *
   * @param source - The iterators of interest.
   */
  constructor(source: IIterator<T>[]) {
    this._source = source;
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
   * Create an independent clone of the zip iterator.
   *
   * @returns A new iterator starting with the current value.
   *
   * #### Notes
   * The source iterators must be cloneable.
   */
  clone(): ZipIterator<T> {
    return new ZipIterator<T>(this._source.map(it => it.clone()));
  }

  /**
   * Get the next zipped value from the iterator.
   *
   * @returns The next zipped value from the iterator, or `undefined`
   *   when the first source iterator is exhausted.
   */
  next(): T[] {
    let result = new Array<T>(this._source.length);
    for (let i = 0, n = this._source.length; i < n; ++i) {
      if ((result[i] = this._source[i].next()) === void 0) {
        return void 0;
      }
    }
    return result;
  }

  private _source: IIterator<T>[];
}
