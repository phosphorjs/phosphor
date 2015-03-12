/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export = IQueue;


/**
 * A FIFO queue.
 */
interface IQueue<T> {
  /**
   * The length of the queue.
   */
  length: number;

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
  push(value: T): void;

  /**
   * Pop and return the first value in the queue.
   */
  pop(): T;

  /**
   * Remove all values from the queue.
   */
  clear(): void;

  /**
   * Execute a callback for each value in the queue.
   *
   * It is not safe to modify the queue while iterating.
   */
  forEach(callback: (value: T, index: number) => void): void;

  /**
   * Returns true if all values pass the given test.
   *
   * It is not safe to modify the queue while iterating.
   */
  every(callback: (value: T, index: number) => boolean): boolean;

  /**
   * Returns true if any value passes the given test.
   *
   * It is not safe to modify the queue while iterating.
   */
  some(callback: (value: T, index: number) => boolean): boolean;
}
