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
 * Iterate over an iterable using a stepped increment.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param step - The distance to step on each iteration. A value
 *   of less than `1` will behave the same as a value of `1`.
 *
 * @returns An iterator which traverses the iterable step-wise.
 *
 * #### Example
 * ```typescript
 * import { stride, toArray } from '@phosphor/algorithm';
 *
 * let data = [1, 2, 3, 4, 5, 6];
 *
 * let stream = stride(data, 2);
 *
 * toArray(stream);  // [1, 3, 5];
 * ```
 */
export
function stride<T>(object: IterableOrArrayLike<T>, step: number): IIterator<T> {
  return new StrideIterator<T>(iter(object), step);
}


/**
 * An iterator which traverses a source iterator step-wise.
 */
export
class StrideIterator<T> implements IIterator<T> {
  /**
   * Construct a new stride iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param step - The distance to step on each iteration. A value
   *   of less than `1` will behave the same as a value of `1`.
   */
  constructor(source: IIterator<T>, step: number) {
    this._source = source;
    this._step = step;
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
    return new StrideIterator<T>(this._source.clone(), this._step);
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): T | undefined {
    let value = this._source.next();
    for (let n = this._step - 1; n > 0; --n) {
      this._source.next();
    }
    return value;
  }

  private _source: IIterator<T>;
  private _step: number;
}
