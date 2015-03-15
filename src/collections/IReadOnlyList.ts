/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IReadOnlyCollection = require('./IReadOnlyCollection');

export = IReadOnlyList;


/**
 * A read only collection of items which can be accessed by index.
 */
interface IReadOnlyList<T> extends IReadOnlyCollection<T> {
  /**
   * Get the value at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  at(index: number): T;

  /**
   * Get the index of the given value.
   *
   * Returns -1 if the value is not in the list.
   */
  indexOf(value: T): number;
}
