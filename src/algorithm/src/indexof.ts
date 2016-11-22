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
 * Find the index of the first occurrence of a value in a sequence.
 *
 * @param object - The sequence or array-like to search.
 *
 * @param value - The value to locate in the sequence. Values are
 *   compared using strict `===` equality.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `0`. Negative values are taken as an offset from the
 *   end of the sequence.
 *
 * @returns The index of the first occurrence of the value, or `-1`
 *   if the value is not found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral.
 *
 * #### Example
 * ```typescript
 * import { indexOf } from '@phosphor/algorithm';
 *
 * let data = ['one', 'two', 'three', 'four', 'one'];
 * indexOf(data, 'red');     // -1
 * indexOf(data, 'one');     // 0
 * indexOf(data, 'one', 1);  // 4
 * indexOf(data, 'two', 2);  // -1
 * ```
 */
export
function indexOf<T>(object: SequenceOrArrayLike<T>, value: T, fromIndex?: number): number {
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
    if (seq.at(i) === value) {
      return i;
    }
  }
  return -1;
}
