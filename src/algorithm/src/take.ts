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
 * Take a fixed number of items from an iterable.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param count - The number of items to take from the iterable.
 *
 * @returns An iterator which yields the specified number of items
 *   from the source iterable.
 *
 * #### Notes
 * The returned iterator will exhaust early if the source iterable
 * contains an insufficient number of items.
 */
export
function take<T>(object: IterableOrArrayLike<T>, count: number): IIterator<T> {
  return new TakeIterator<T>(iter(object), count);
}


/**
 * An iterator which takes a fixed number of items from a source.
 */
export
class TakeIterator<T> implements IIterator<T> {
  /**
   * Construct a new take iterator.
   *
   * @param source - The iterator of interest.
   *
   * @param count - The number of items to take from the source.
   */
  constructor(source: IIterator<T>, count: number) {
    this._source = source;
    this._count = count;
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
    return new TakeIterator<T>(this._source.clone(), this._count);
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): T | undefined {
    if (this._count <= 0) {
      return undefined;
    }
    let value = this._source.next();
    if (value === undefined) {
      return undefined;
    }
    this._count--;
    return value;
  }

  private _count: number;
  private _source: IIterator<T>;
}
