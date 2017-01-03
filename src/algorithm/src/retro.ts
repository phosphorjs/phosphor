/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator
} from './iterable';


/**
 * Create a retro iterator for an array-like object.
 *
 * @param object - The array-like object of interest.
 *
 * @returns An iterator which traverses the array in reverse.
 *
 * #### Example
 * ```typescript
 * import { retro, toArray } from '@phosphor/algorithm';
 *
 * let data = [1, 2, 3, 4, 5, 6];
 *
 * let stream = retro(data);
 *
 * toArray(stream);  // [6, 5, 4, 3, 2, 1]
 * ```
 */
export
function retro<T>(object: ArrayLike<T>): IIterator<T> {
  return new RetroArrayIterator<T>(object);
}


/**
 * An iterator which traverses an array in reverse.
 *
 * #### Notes
 * This iterator can be used for any builtin JS array-like object.
 */
export
class RetroArrayIterator<T> implements IIterator<T> {
  /**
   * Construct a new retro iterator.
   *
   * @param source - The array-like object of interest.
   */
  constructor(source: ArrayLike<T>) {
    this._source = source;
    this._index = source.length - 1;
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
    let result = new RetroArrayIterator<T>(this._source);
    result._index = this._index;
    return result;
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): T | undefined {
    if (this._index < 0 || this._index >= this._source.length) {
      return undefined;
    }
    return this._source[this._index--];
  }

  private _index: number;
  private _source: ArrayLike<T>;
}
