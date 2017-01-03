/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, IterableOrArrayLike, iter
} from './iterable';


/**
 * Drop a specific number of items from an iterator.
 *
 * @param it - The iterator of interest.
 *
 * @param n - The number of items to drop from the iterator.
 *
 * @returns The original iterator as a convenience.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { drop, iter, toArray } from '@phosphor/algorithm';
 *
 * let data = [5, 7, 0, -2, 9];
 *
 * let stream = drop(iter(data), 2);
 *
 * toArray(stream);  // [0, -2, 9];
 * ```
 */
export
function drop<T>(it: IIterator<T>, n: number): IIterator<T> {
  while (n-- > 0) {
    it.next();
  }
  return it;
}


/**
 * Invoke a function for each value in an iterable.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The callback function to invoke for each value.
 *
 * #### Notes
 * Iteration can be terminated early by returning `false` from the
 * callback function.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { each } from '@phosphor/algorithm';
 *
 * let data = [5, 7, 0, -2, 9];
 *
 * each(data, value => { console.log(value); });
 * ```
 */
export
function each<T>(object: IterableOrArrayLike<T>, fn: (value: T, index: number) => boolean | void): void {
  let index = 0;
  let it = iter(object);
  let value: T | undefined;
  while ((value = it.next()) !== undefined) {
    if (fn(value, index++) === false) {
      return;
    }
  }
}


/**
 * Test whether an iterable contains a specific value.
 *
 * @param object - The iterable or array-like object to search.
 *
 * @param value - The value to search for in the iterable. Values
 *   are compared using strict `===` equality.
 *
 * @returns `true` if the value is found, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first matching value.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { contains } from '@phosphor/algorithm';
 *
 * let data = [5, 7, 0, -2, 9];
 *
 * contains(data, -2);  // true
 * contains(data, 3);   // false
 * ```
 */
export
function contains<T>(object: IterableOrArrayLike<T>, value: T): boolean {
  let it = iter(object);
  let temp: T | undefined;
  while ((temp = it.next()) !== undefined) {
    if (temp === value) {
      return true;
    }
  }
  return false;
}


/**
 * Test whether all values in an iterable satisfy a predicate.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns `true` if all values pass the test, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first `false` predicate result.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { every } from '@phosphor/algorithm';
 *
 * let data = [5, 7, 1];
 *
 * every(data, value => value % 2 === 0);  // false
 * every(data, value => value % 2 === 1);  // true
 * ```
 */
export
function every<T>(object: IterableOrArrayLike<T>, fn: (value: T, index: number) => boolean): boolean {
  let index = 0;
  let it = iter(object);
  let value: T | undefined;
  while ((value = it.next()) !== undefined) {
    if (!fn(value, index++)) {
      return false;
    }
  }
  return true;
}


/**
 * Test whether any value in an iterable satisfies a predicate.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns `true` if any value passes the test, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first `true` predicate result.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { some } from '@phosphor/algorithm';
 *
 * let data = [5, 7, 1];
 *
 * some(data, value => value === 7);  // true
 * some(data, value => value === 3);  // false
 * ```
 */
export
function some<T>(object: IterableOrArrayLike<T>, fn: (value: T, index: number) => boolean): boolean {
  let index = 0;
  let it = iter(object);
  let value: T | undefined;
  while ((value = it.next()) !== undefined) {
    if (fn(value, index++)) {
      return true;
    }
  }
  return false;
}


/**
 * Summarize all values in an iterable using a reducer function.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The reducer function to invoke for each value.
 *
 * @param initial - The initial value to start accumulation.
 *
 * @returns The final accumulated value.
 *
 * #### Notes
 * The `reduce` function follows the conventions of `Array#reduce`.
 *
 * If the iterator is empty, an initial value is required. That value
 * will be used as the return value. If no initial value is provided,
 * an error will be thrown.
 *
 * If the iterator contains a single item and no initial value is
 * provided, the single item is used as the return value.
 *
 * Otherwise, the reducer is invoked for each element in the iterable.
 * If an initial value is not provided, the first element will be used
 * as the initial accumulated value.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { reduce } from '@phosphor/algorithm';
 *
 * let data = [1, 2, 3, 4, 5];
 *
 * let sum = reduce(data, (a, value) => a + value);  // 15
 * ```
 */
export
function reduce<T>(object: IterableOrArrayLike<T>, fn: (accumulator: T, value: T, index: number) => T): T;
export
function reduce<T, U>(object: IterableOrArrayLike<T>, fn: (accumulator: U, value: T, index: number) => U, initial: U): U;
export
function reduce<T>(object: IterableOrArrayLike<T>, fn: (accumulator: any, value: T, index: number) => any, initial?: any): any {
  // Setup the iterator and fetch the first value.
  let index = 0;
  let it = iter(object);
  let first = it.next();

  // An empty iterator and no initial value is an error.
  if (first === undefined && initial === undefined) {
    throw new TypeError('Reduce of empty iterable with no initial value.');
  }

  // If the iterator is empty, return the initial value.
  if (first === undefined) {
    return initial;
  }

  // If the iterator has a single item and no initial value, the
  // reducer is not invoked and the first item is the return value.
  let second = it.next();
  if (second === undefined && initial === undefined) {
    return first;
  }

  // If iterator has a single item and an initial value is provided,
  // the reducer is invoked and that result is the return value.
  if (second === undefined) {
    return fn(initial, first, index++);
  }

  // Setup the initial accumlated value.
  let accumulator: any;
  if (initial === undefined) {
    accumulator = fn(first, second, index++);
  } else {
    accumulator = fn(fn(initial, first, index++), second, index++);
  }

  // Iterate the rest of the values, updating the accumulator.
  let next: T | undefined;
  while ((next = it.next()) !== undefined) {
    accumulator = fn(accumulator, next, index++);
  }

  // Return the final accumulated value.
  return accumulator;
}
