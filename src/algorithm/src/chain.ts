/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, IterableOrArrayLike, iter
} from './iterable';


/**
 * Chain together several iterables.
 *
 * @param objects - The iterable or array-like objects of interest.
 *
 * @returns An iterator which yields the values of the iterables
 *   in the order in which they are supplied.
 *
 * #### Example
 * ```typescript
 * import { chain, toArray } from '@phosphor/algorithm';
 *
 * let data1 = [1, 2, 3];
 * let data2 = [4, 5, 6];
 *
 * let stream = chain(data1, data2);
 *
 * toArray(stream);  // [1, 2, 3, 4, 5, 6]
 * ```
 */
export
function chain<T>(...objects: IterableOrArrayLike<T>[]): ChainIterator<T> {
  return new ChainIterator<T>(iter(objects.map(iter)));
}


/**
 * An iterator which chains together several iterators.
 */
export
class ChainIterator<T> implements IIterator<T> {
  /**
   * Construct a new chain iterator.
   *
   * @param source - The iterator of iterators of interest.
   */
  constructor(source: IIterator<IIterator<T>>) {
    this._source = source;
    this._active = undefined;
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
   * Create an independent clone of the chain iterator.
   *
   * @returns A new iterator starting with the current value.
   *
   * #### Notes
   * The source iterators must be cloneable.
   */
  clone(): ChainIterator<T> {
    let result = new ChainIterator<T>(this._source.clone());
    result._active = this._active && this._active.clone();
    result._cloned = true;
    this._cloned = true;
    return result;
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`
   *   when all source iterators are exhausted.
   */
  next(): T | undefined {
    if (this._active === undefined) {
      this._active = this._source.next();
      if (this._active === undefined) {
        return undefined;
      }
      if (this._cloned) {
        this._active = this._active.clone();
      }
    }
    let value = this._active.next();
    if (value !== undefined) {
      return value;
    }
    this._active = undefined;
    return this.next();
  }

  private _source: IIterator<IIterator<T>>;
  private _active: IIterator<T> | undefined;
  private _cloned = false;
}
