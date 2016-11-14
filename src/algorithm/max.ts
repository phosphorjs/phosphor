/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Iterable, iter
} from './iterable';


/**
 * Find the maximum value in an iterable.
 *
 * @param object - The iterable object to search.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if the first value is less than the second.
 *   `0` if the values are equivalent, or `> 0` if the first value is
 *   greater than the second.
 *
 * @returns The maximum value in the iterable. If multiple values are
 *   equivalent to the maximum, the left-most value is returned. If
 *   the iterable is empty, this returns `undefined`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { max } from '@phosphor/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * max([7, 4, 0, 3, 9, 4], numberCmp);  // 9
 * ```
 */
export
function max<T>(object: Iterable<T>, fn: (first: T, second: T) => number): T {
  let it = iter(object);
  let result = it.next();
  if (result === void 0) {
    return void 0;
  }
  let value: T;
  while ((value = it.next()) !== void 0) {
    if (fn(value, result) > 0) {
      result = value;
    }
  }
  return result;
}
