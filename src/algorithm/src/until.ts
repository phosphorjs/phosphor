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
 * Invoke a function for an iterable until it returns `true`.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The callback function to invoke for each value.
 *
 * #### Notes
 * Iteration is terminated when the callback returns `true`.
 *
 * #### Example
 * ```typescript
 * import { until } from '@phosphor/algorithm';
 *
 * let data = [5, 7, 0, -2, 9];
 *
 * let total = 0;
 * until(data, (value, i) => {
 *   total += value;
 *   return i >= 3;
 * });
 *
 * console.log(total);  // 12
 * ```
 */
export
function until<T>(object: IterableOrArrayLike<T>, fn: (value: T, index: number) => boolean): void {
  let index = 0;
  let it = iter(object);
  let value: T | undefined;
  while ((value = it.next()) !== undefined) {
    if (fn(value, index++)) {
      return;
    }
  }
}
