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
 * Move an element in a sequence from one index to another.
 *
 * @param object - The sequence or array-like object to mutate.
 *
 * @param fromIndex - The index of the element to move.
 *
 * @param toIndex - The target index of the element.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral or out of range.
 *
 * A `toIndex` which is non-integral or out of range.
 *
 * #### Example
 * ```typescript
 * import { move } from 'phosphor-core/lib/mutation';
 *
 * let data = [0, 1, 2, 3, 4];
 * move(data, 1, 2);  // [0, 2, 1, 3, 4]
 * move(data, 4, 2);  // [0, 2, 4, 1, 3]
 * ```
 */
export
function move<T>(object: MutableSequenceOrArrayLike<T>, fromIndex: number, toIndex: number): void {
  if (object.length <= 1 || fromIndex === toIndex) {
    return;
  }
  let d = fromIndex < toIndex ? 1 : -1;
  let seq = asMutableSequence(object);
  let value = seq.at(fromIndex);
  for (let i = fromIndex; i !== toIndex; i += d) {
    seq.set(i, seq.at(i + d));
  }
  seq.set(toIndex, value);
}


/**
 * Reverse a sequence in-place subject to an optional range.
 *
 * @param object - The sequence or array-like object to mutate.
 *
 * @param first - The index of the first element of the range. This
 *   should be `<=` the `last` index. The default is `0`.
 *
 * @param last - The index of the last element of the range. This
 *   should be `>=` the `first` index. The default is `length - 1`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `first` index which is non-integral or out of range.
 *
 * A `last` index which is non-integral or out of range.
 *
 * #### Example
 * ```typescript
 * import { reverse } from 'phosphor-core/lib/mutation';
 *
 * let data = [0, 1, 2, 3, 4];
 * reverse(data, 1, 3);  // [0, 3, 2, 1, 4]
 * reverse(data, 3);     // [0, 3, 2, 4, 1]
 * reverse(data);        // [1, 4, 2, 3, 0]
 * ```
 */
export
function reverse<T>(object: MutableSequenceOrArrayLike<T>, first?: number, last?: number): void {
  let length = object.length;
  if (length <= 1) {
    return;
  }
  if (first === void 0) {
    first = 0;
  }
  if (last === void 0) {
    last = length - 1;
  }
  if (first >= last) {
    return;
  }
  let seq = asMutableSequence(object);
  while (first < last) {
    let front = seq.at(first);
    let back = seq.at(last);
    seq.set(first++, back);
    seq.set(last--, front);
  }
}


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
 * import { rotate } from 'phosphor-core/lib/mutation';
 *
 * let data = [0, 1, 2, 3, 4];
 * rotate(data, 2);   // [2, 3, 4, 0, 1]
 * rotate(data, -2);  // [0, 1, 2, 3, 4]
 * rotate(data, 10);  // [0, 1, 2, 3, 4]
 * rotate(data, 9);   // [4, 0, 1, 2, 3]
 * ```
 */
export
function rotate<T>(object: MutableSequenceOrArrayLike<T>, delta: number): void {
  let length = object.length;
  if (length <= 1) {
    return;
  }
  if (delta > 0) {
    delta = delta % length;
  } else if (delta < 0) {
    delta = ((delta % length) + length) % length;
  }
  if (delta === 0) {
    return;
  }
  let seq = asMutableSequence(object);
  reverse(seq, 0, delta - 1);
  reverse(seq, delta, length - 1);
  reverse(seq, 0, length - 1);
}
