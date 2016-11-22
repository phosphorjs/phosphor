/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  MutableSequenceOrArrayLike, mutableSequence
} from './sequence';


/**
 * Move an element in a sequence from one index to another.
 *
 * @param object - The sequence to mutate.
 *
 * @param fromIndex - The index of the element to move.
 *
 * @param toIndex - The target index of the element.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` or `toIndex` which is non-integral.
 *
 * #### Example
 * ```typescript
 * import { move } from from '@phosphor/algorithm';
 *
 * let data = [0, 1, 2, 3, 4];
 * move(data, 1, 2);  // [0, 2, 1, 3, 4]
 * move(data, 4, 2);  // [0, 2, 4, 1, 3]
 * ```
 */
export
function move<T>(object: MutableSequenceOrArrayLike<T>, fromIndex: number, toIndex: number): void {
  let n = object.length;
  if (n <= 1) {
    return;
  }
  if (fromIndex < 0) {
    fromIndex = Math.max(0, fromIndex + n);
  } else {
    fromIndex = Math.min(fromIndex, n - 1);
  }
  if (toIndex < 0) {
    toIndex = Math.max(0, toIndex + n);
  } else {
    toIndex = Math.min(toIndex, n - 1);
  }
  if (fromIndex === toIndex) {
    return;
  }
  let d = fromIndex < toIndex ? 1 : -1;
  let seq = mutableSequence(object);
  let value = seq.at(fromIndex);
  for (let i = fromIndex; i !== toIndex; i += d) {
    seq.set(i, seq.at(i + d));
  }
  seq.set(toIndex, value);
}
