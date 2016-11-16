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
 * Test whether all values in an iterable satisfy a predicate.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns `true` if all values pass the test, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first `false` predicate result.
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
function every<T>(object: Iterable<T>, fn: (value: T, index: number) => boolean): boolean {
  let value: T;
  let index = 0;
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    if (!fn(value, index++)) {
      return false;
    }
  }
  return true;
}
