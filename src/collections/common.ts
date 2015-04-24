/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A sequence callback function.
 */
export
interface ICallback<T, U> {
  /**
   * @param value The current value in the sequence.
   * @param index The index of the value in the sequence.
   * @returns The result of the callback for the value.
   */
  (value: T, index: number): U;
}


/**
 * A three-way comparison function.
 */
export
interface IComparator<T, U> {
  /**
   * @param first The LHS of the comparison.
   * @param second The RHS of the comparison.
   * @returns
   *   - zero if `first === second`
   *   - a negative value if `first < second`
   *   - a positive value if `first > second`
   */
  (first: T, second: U): number;
}


/**
 * A boolean predicate function.
 */
export
interface IPredicate<T> {
  /**
   * @param value The current value in the sequence.
   * @param index The index of the value in the sequence.
   * @returns `true` if the value matches the predicate, `false` otherwise.
   */
  (value: T, index: number): boolean;
}

} // module phosphor.collections
