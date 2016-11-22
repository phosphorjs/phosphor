/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  SequenceOrArrayLike, sequence
} from './sequence';


/**
 * Find the index of the first value which matches a predicate.
 *
 * @param object - The sequence or array-like object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `0`. Negative values are taken as an offset from the
 *   end of the sequence.
 *
 * @returns The index of the first matching value, or `-1` if no
 *   matching value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral.
 *
 * Modifying the length of the sequence while searching.
 *
 * #### Example
 * ```typescript
 * import { findIndex } from '@phosphor/algorithm';
 *
 * function isEven(value: number): boolean {
 *   return value % 2 === 0;
 * }
 *
 * let data = [1, 2, 3, 4, 3, 2, 1];
 * findIndex(data, isEven);     // 1
 * findIndex(data, isEven, 4);  // 5
 * findIndex(data, isEven, 6);  // -1
 * ```
 */
export
function findIndex<T>(object: SequenceOrArrayLike<T>, fn: (value: T, index: number) => boolean, fromIndex?: number): number {
  let n = object.length;
  if (n === 0) {
    return -1;
  }
  if (fromIndex === undefined) {
    fromIndex = 0;
  } else if (fromIndex < 0) {
    fromIndex = Math.max(0, fromIndex + n);
  }
  if (fromIndex >= n) {
    return -1;
  }
  let seq = sequence(object);
  for (let i = fromIndex; i < n; ++i) {
    if (fn(seq.at(i), i)) {
      return i;
    }
  }
  return -1;
}
