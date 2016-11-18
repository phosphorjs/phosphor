/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike, iter
} from './iterable';


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
