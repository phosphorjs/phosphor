/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A generic index callback function.
 */
export
interface ICallback<T, U> {
  (value: T, index: number): U;
}


/**
 * A boolean predicate function.
 */
export
interface IPredicate<T> {
  (value: T, index: number): boolean;
}


/**
 * A three-way comparison function.
 */
export
interface IComparator<T, U> {
  (first: T, second: U): number;
}

} // module phosphor.collections
