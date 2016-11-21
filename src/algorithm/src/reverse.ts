/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  MutableSequenceOrArrayLike, asMutableSequence
} from './sequence';


/**
 * Reverse a sequence in-place subject to an optional range.
 *
 * @param object - The sequence or array-like object to mutate.
 *
 * @param start - The index of the starting element of the range to
 *   reverse. The default is `0`. Negative values are taken as an
 *   offset from the end of the sequence.
 *
 * @param end - The index of the ending element of the range to
 *   reverse. The default is `length - 1`. Negative values are taken
 *   as an offset from the end of the sequence.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `start` or  `end` index which is non-integral.
 *
 * #### Example
 * ```typescript
 * import { reverse } from '@phosphor/algorithm';
 *
 * let data = [0, 1, 2, 3, 4];
 * reverse(data, 1, 3);  // [0, 3, 2, 1, 4]
 * reverse(data, 3);     // [0, 3, 2, 4, 1]
 * reverse(data);        // [1, 4, 2, 3, 0]
 * ```
 */
export
function reverse<T>(object: MutableSequenceOrArrayLike<T>, start?: number, end?: number): void {
  let n = object.length;
  if (n <= 1) {
    return;
  }
  if (start === undefined) {
    start = 0;
  } else if (start < 0) {
    start = Math.max(0, start + n);
  } else {
    start = Math.min(start, n - 1);
  }
  if (end === undefined) {
    end = n - 1;
  } else if (end < 0) {
    end = Math.max(0, end + n);
  } else {
    end = Math.min(end, n - 1);
  }
  if (start >= end) {
    return;
  }
  let seq = asMutableSequence(object);
  while (start < end) {
    let front = seq.at(start);
    let back = seq.at(end);
    seq.set(start++, back);
    seq.set(end--, front);
  }
}
