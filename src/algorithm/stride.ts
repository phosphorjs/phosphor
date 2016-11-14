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
 * Iterate over an iterable using a stepped increment.
 *
 * @param object - The iterable object of interest.
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
function stride<T>(object: Iterable<T>, step: number): StrideIterator<T> {
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
   * Create an iterator over the object's values.
   *
   * @returns A reference to `this` iterator.
   */
  iter(): this {
    return this;
  }

  /**
   * Create an independent clone of the stride iterator.
   *
   * @returns A new iterator starting with the current value.
   *
   * #### Notes
   * The source iterator must be cloneable.
   */
  clone(): StrideIterator<T> {
    return new StrideIterator<T>(this._source.clone(), this._step);
  }

  /**
   * Get the next stepped value from the iterator.
   *
   * @returns The next stepped value from the iterator, or `undefined`
   *   when the source iterator is exhausted.
   */
  next(): T {
    let value = this._source.next();
    if (value === void 0) {
      return void 0;
    }
    let step = this._step;
    while (--step > 0) {
      this._source.next();
    }
    return value;
  }

  private _source: IIterator<T>;
  private _step: number;
}
