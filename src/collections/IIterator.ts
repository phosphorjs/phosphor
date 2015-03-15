/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IIteratorResult = require('./IIteratorResult');

export = IIterator;


/**
 * An object which iterates over values in a collection.
 */
interface IIterator<T> {
  /**
   * Get the next value in the collection.
   */
  next(): IIteratorResult<T>;
}
