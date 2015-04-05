/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A double ended queue with constant time access to both ends.
 */
export
interface IDeque<T> extends IQueue<T>, IReverseIterable<T> {
  /**
   * Push a value onto the front of the queue.
   */
  pushFront(value: T): void;

  /**
   * Pop and return the value at the back of the queue.
   */
  popBack(): T;
}

} // module phosphor.collections
