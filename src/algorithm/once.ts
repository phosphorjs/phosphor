/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  RepeatIterator
} from './repeat';


/**
 * Create an iterator which yields a value a single time.
 *
 * @param value - The value to wrap in an iterator.
 *
 * @returns A new iterator which yields the value a single time.
 *
 * #### Example
 * ```typescript
 * import { once, toArray } from '@phosphor/algorithm';
 *
 * let stream = once(7);
 *
 * toArray(stream);  // [7]
 * ```
 */
export
function once<T>(value: T): RepeatIterator<T> {
  return new RepeatIterator<T>(value, 1);
}
