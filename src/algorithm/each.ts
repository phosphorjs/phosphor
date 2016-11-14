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
 * Invoke a function for each value in an iterable.
 *
 * @param object - The iterable object of interest.
 *
 * @param fn - The callback function to invoke for each value.
 *
 * #### Notes
 * Iteration cannot be terminated early. If early termination is
 * required, the [[every]] function can be used to that effect.
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
function each<T>(object: Iterable<T>, fn: (value: T, index: number) => void): void {
  let value: T;
  let index = 0;
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    fn(value, index++);
  }
}
