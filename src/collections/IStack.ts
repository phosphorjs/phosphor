/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A collection with first-in-last-out semantics.
 */
export
interface IStack<T> extends ICollection<T> {
  /**
   * The value at the back of the stack.
   */
  back: T;

  /**
   * Push a value onto the back of the stack.
   */
  pushBack(value: T): void;

  /**
   * Pop and return the value at the back of the stack.
   */
  popBack(): T;
}

} // module phosphor.collections
