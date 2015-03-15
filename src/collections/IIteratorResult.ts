/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export = IIteratorResult;


/**
 * The result of a call to `iterator.next()`.
 */
interface IIteratorResult<T> {
  /**
   * Whether the iterator is exhausted.
   */
  done: boolean;

  /**
   * The current value for the iterator.
   *
   * This is `undefined` if `done` is true.
   */
  value: T;
}
