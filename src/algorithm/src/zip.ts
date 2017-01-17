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
 * Iterate several iterables in lockstep.
 *
 * @param objects - The iterable or array-like objects of interest.
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
function zip<T>(...objects: IterableOrArrayLike<T>[]): IIterator<T[]> {
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
   * Get an iterator over the object's values.
   *
   * @returns An iterator which yields the object's values.
   */
  iter(): IIterator<T[]> {
    return this;
  }

  /**
   * Create an independent clone of the iterator.
   *
   * @returns A new independent clone of the iterator.
   */
  clone(): IIterator<T[]> {
    return new ZipIterator<T>(this._source.map(it => it.clone()));
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): T[] | undefined {
    let result = new Array<T>(this._source.length);
    for (let i = 0, n = this._source.length; i < n; ++i) {
      let value = this._source[i].next();
      if (value === undefined) {
        return undefined;
      }
      result[i] = value;
    }
    return result;
  }

  private _source: IIterator<T>[];
}
