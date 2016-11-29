/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  reverse
} from './reverse';

import {
  MutableSequenceOrArray, mutableSequence
} from './sequence';


/**
 * Rotate the elements of a sequence by a positive or negative amount.
 *
 * @param object - The sequence or array-like object to mutate.
 *
 * @param delta - The amount of rotation to apply to the elements. A
 *   positive value will rotate the elements to the left. A negative
 *   value will rotate the elements to the right.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `delta` amount which is non-integral.
 *
 * #### Example
 * ```typescript
 * import { rotate } from '@phosphor/algorithm';
 *
 * let data = [0, 1, 2, 3, 4];
 * rotate(data, 2);   // [2, 3, 4, 0, 1]
 * rotate(data, -2);  // [0, 1, 2, 3, 4]
 * rotate(data, 10);  // [0, 1, 2, 3, 4]
 * rotate(data, 9);   // [4, 0, 1, 2, 3]
 * ```
 */
export
function rotate<T>(object: MutableSequenceOrArray<T>, delta: number): void {
  let n = object.length;
  if (n <= 1) {
    return;
  }
  if (delta > 0) {
    delta = delta % n;
  } else if (delta < 0) {
    delta = ((delta % n) + n) % n;
  }
  if (delta === 0) {
    return;
  }
  let seq = mutableSequence(object);
  reverse(seq, 0, delta - 1);
  reverse(seq, delta, n - 1);
  reverse(seq, 0, n - 1);
}
