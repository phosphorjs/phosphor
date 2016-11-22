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
 * Create an iterator which repeats a value a number of times.
 *
 * @param value - The value to repeat.
 *
 * @param count - The number of times to repeat the value.
 *
 * @returns A new iterator which repeats the specified value.
 *
 * #### Example
 * ```typescript
 * import { repeat, toArray } from '@phosphor/algorithm';
 *
 * let stream = repeat(7, 3);
 *
 * toArray(stream);  // [7, 7, 7]
 * ```
 */
export
function repeat<T>(value: T, count: number): RepeatIterator<T> {
  return new RepeatIterator<T>(value, count);
}


/**
 * An iterator which repeats a value a specified number of times.
 */
export
class RepeatIterator<T> implements IIterator<T> {
  /**
   * Construct a new repeat iterator.
   *
   * @param value - The value to repeat.
   *
   * @param count - The number of times to repeat the value.
   */
  constructor(value: T, count: number) {
    this._value = value;
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
    return new RepeatIterator<T>(this._value, this._count);
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
    this._count--;
    return this._value;
  }

  private _value: T;
  private _count: number;
}
