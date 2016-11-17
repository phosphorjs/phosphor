/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Sequence, asSequence
} from './sequence';


/**
 * Find the index of the first element which compares `>` than a value.
 *
 * @param sequence - The sorted sequence to search.
 *
 * @param value - The value to locate in the sequence.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if an element is less than a value, `0` if
 *   an element is equal to a value, or `> 0` if an element is greater
 *   than a value.
 *
 * @returns The index of the first element which compares `>` than the
 *   value, or `length` if there is no such element.
 *
 * #### Complexity
 * Logarithmic.
 *
 * #### Undefined Behavior
 * A sequence which is not sorted in ascending order.
 *
 * Modifying the length of the sequence while searching.
 *
 * #### Example
 * ```typescript
 * import { upperBound } from '@phosphor/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * let data = [0, 3, 4, 7, 7, 9];
 * upperBound(data, 0, numberCmp);   // 1
 * upperBound(data, 6, numberCmp);   // 3
 * upperBound(data, 7, numberCmp);   // 5
 * upperBound(data, -1, numberCmp);  // 0
 * upperBound(data, 10, numberCmp);  // 6
 * ```
 */
export
function upperBound<T, U>(object: Sequence<T>, value: U, fn: (element: T, value: U) => number): number {
  let n = object.length;
  if (n === 0) {
    return 0;
  }
  let begin = 0;
  let half: number;
  let middle: number;
  let seq = asSequence(object);
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (fn(seq.at(middle), value) > 0) {
      n = half;
    } else {
      begin = middle + 1;
      n -= half + 1;
    }
  }
  return begin;
}
