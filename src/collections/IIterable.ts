/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IIterator = require('./IIterator');

export = IIterable;


/**
 * An object which supports iteration over its items.
 *
 * In general, it is not safe to modify the iterable while iterating.
 */
interface IIterable<T> {
  /**
   * Get an iterator for the items in the iterable.
   */
  $$iterator(): IIterator<T>;
}
