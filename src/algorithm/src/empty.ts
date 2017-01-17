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
 * Create an empty iterator.
 *
 * @returns A new iterator which yields nothing.
 *
 * #### Example
 * ```typescript
 * import { empty, toArray } from '@phosphor/algorithm';
 *
 * let stream = empty<number>();
 *
 * toArray(stream);  // []
 * ```
 */
export
function empty<T>(): IIterator<T> {
  return new EmptyIterator<T>();
}


/**
 * An iterator which is always empty.
 */
export
class EmptyIterator<T> implements IIterator<T> {
  /**
   * Construct a new empty iterator.
   */
  constructor() { }

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
    return new EmptyIterator<T>();
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): T | undefined {
    return undefined;
  }
}
