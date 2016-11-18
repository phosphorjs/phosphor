/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  SequenceOrArrayLike, asSequence
} from './sequence';


/**
 * Find the index of the last occurrence of a value in a sequence.
 *
 * @param object - The sequence or array-like object to search.
 *
 * @param value - The value to locate in the sequence. Values are
 *   compared using strict `===` equality.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `length - 1`. Negative values are taken as an offset
 *   from the end of the sequence.
 *
 * @returns The index of the last occurrence of the value, or `-1`
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
 * import { lastIndexOf } from '@phosphor/algorithm';
 *
 * let data = ['one', 'two', 'three', 'four', 'one'];
 * lastIndexOf(data, 'red');     // -1
 * lastIndexOf(data, 'one');     // 4
 * lastIndexOf(data, 'one', 1);  // 0
 * lastIndexOf(data, 'two', 2);  // 1
 * ```
 */
export
function lastIndexOf<T>(object: SequenceOrArrayLike<T>, value: T, fromIndex?: number): number {
  let n = object.length;
  if (n === 0) {
    return -1;
  }
  if (fromIndex === undefined || fromIndex >= n) {
    fromIndex = n - 1;
  } else if (fromIndex < 0) {
    fromIndex += n;
  }
  if (fromIndex < 0) {
    return -1;
  }
  let seq = asSequence(object);
  for (let i = fromIndex; i >= 0; --i) {
    if (seq.at(i) === value) {
      return i;
    }
  }
  return -1;
}
