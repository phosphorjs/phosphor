/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator
} from './iter';


/**
 * An object which can produce a reverse iterator over its values.
 */
export
interface IRetroable<T> {
  /**
   * Get a reverse iterator over the object's values.
   *
   * @returns An iterator which yields the object's values in reverse.
   */
  retro(): IIterator<T>;
}


/**
 * A type alias for a retroable or builtin array-like object.
 */
export
type RetroableOrArrayLike<T> = IRetroable<T> | ArrayLike<T>;


/**
 * Create an iterator for a retroable object.
 *
 * @param object - The retroable or array-like object of interest.
 *
 * @returns An iterator which traverses the object's values in reverse.
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
function retro<T>(object: RetroableOrArrayLike<T>): IIterator<T> {
  let it: IIterator<T>;
  if (typeof (object as any).retro === 'function') {
    it = (object as IRetroable<T>).retro();
  } else {
    it = new RetroArrayIterator<T>(object as ArrayLike<T>);
  }
  return it;
}


/**
 * An iterator which traverses an array-like object in reverse.
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
