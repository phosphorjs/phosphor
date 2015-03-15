/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IIterable = require('./IIterable');

export = ICollection;


/**
 * An iterable collection of items with a definite size.
 */
interface ICollection<T> extends IIterable<T> {
  /**
   * The number of items in the collection.
   */
  length: number;

  /**
   * Create a new array filled with the items in the collection.
   */
  asArray(): T[];

  /**
   * Test whether the collection contains a value.
   */
  contains(value: T): boolean;

  /**
   * Remove all items from the collection.
   */
  clear(): void;
}
