/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, IterableOrArrayLike, iter
} from './iter';


/**
 * Enumerate an iterable object.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param start - The starting enum value. The default is `0`.
 *
 * @returns An iterator which yields the enumerated values.
 *
 * #### Example
 * ```typescript
 * import { enumerate, toArray } from '@phosphor/algorithm';
 *
 * let data = ['foo', 'bar', 'baz'];
 *
 * let stream = enumerate(data, 1);
 *
 * toArray(stream);  // [[1, 'foo'], [2, 'bar'], [3, 'baz']]
 * ```
 */
export
function enumerate<T>(object: IterableOrArrayLike<T>, start = 0): IIterator<[number, T]> {
  return new EnumerateIterator<T>(iter(object), start);
}


/**
 * An iterator which enumerates the source values.
 */
export
class EnumerateIterator<T> implements IIterator<[number, T]> {
  /**
   * Construct a new enumerate iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param start - The starting enum value.
   */
  constructor(source: IIterator<T>, start: number) {
    this._source = source;
    this._index = start;
  }

  /**
   * Get an iterator over the object's values.
   *
   * @returns An iterator which yields the object's values.
   */
  iter(): IIterator<[number, T]> {
    return this;
  }

  /**
   * Create an independent clone of the iterator.
   *
   * @returns A new independent clone of the iterator.
   */
  clone(): IIterator<[number, T]> {
    return new EnumerateIterator<T>(this._source.clone(), this._index);
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): [number, T] | undefined {
    let value = this._source.next();
    if (value === undefined) {
      return undefined;
    }
    return [this._index++, value];
  }

  private _source: IIterator<T>;
  private _index: number;
}
