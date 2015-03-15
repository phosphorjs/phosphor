/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import ICollection = require('./ICollection');

export = IQueue;


/**
 * A collection with first-in-first-out semantics.
 */
interface IQueue<T> extends ICollection<T> {
  /**
   * The value at the front of the queue.
   */
  front: T;

  /**
   * The value at the back of the queue.
   */
  back: T;

  /**
   * Push a value onto the back of the queue.
   */
  pushBack(value: T): void;

  /**
   * Pop and return the value at the front of the queue.
   */
  popFront(): T;
}
