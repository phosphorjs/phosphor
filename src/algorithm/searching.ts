/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike, iter
} from './iteration';

import {
  SequenceOrArrayLike, asSequence
} from './sequence';


/**
 * Find the first value in an iterable which matches a predicate.
 *
 * @param object - The iterable or array-like object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @returns The first matching value, or `undefined` if no matching
 *   value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { find } from 'phosphor/lib/algorithm/searching';
 *
 * interface IAnimal { species: string, name: string };
 *
 * function isCat(value: IAnimal): boolean {
 *   return value.species === 'cat';
 * }
 *
 * let data: IAnimal[] = [
 *   { species: 'dog', name: 'spot' },
 *   { species: 'cat', name: 'fluffy' },
 *   { species: 'alligator', name: 'pocho' },
 * ];
 *
 * find(data, isCat).name;  // 'fluffy'
 * ```
 */
export
function find<T>(object: IterableOrArrayLike<T>, fn: (value: T) => boolean): T {
  let value: T;
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    if (fn(value)) {
      return value;
    }
  }
  return void 0;
}


/**
 * Find the minimum value in an iterable.
 *
 * @param object - The iterable or array-like object to search.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if the first value is less than the second.
 *   `0` if the values are equivalent, or `> 0` if the first value is
 *   greater than the second.
 *
 * @returns The minimum value in the iterable. If multiple values are
 *   equivalent to the minimum, the left-most value is returned. If
 *   the iterable is empty, this returns `undefined`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { min } from 'phosphor/lib/algorithm/searching';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * min([7, 4, 0, 3, 9, 4], numberCmp);  // 0
 * ```
 */
export
function min<T>(object: IterableOrArrayLike<T>, fn: (first: T, second: T) => number): T {
  let it = iter(object);
  let result = it.next();
  if (result === void 0) {
    return void 0;
  }
  let value: T;
  while ((value = it.next()) !== void 0) {
    if (fn(value, result) < 0) {
      result = value;
    }
  }
  return result;
}


/**
 * Find the maximum value in an iterable.
 *
 * @param object - The iterable or array-like object to search.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if the first value is less than the second.
 *   `0` if the values are equivalent, or `> 0` if the first value is
 *   greater than the second.
 *
 * @returns The maximum value in the iterable. If multiple values are
 *   equivalent to the maximum, the left-most value is returned. If
 *   the iterable is empty, this returns `undefined`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { max } from 'phosphor/lib/algorithm/searching';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * max([7, 4, 0, 3, 9, 4], numberCmp);  // 9
 * ```
 */
export
function max<T>(object: IterableOrArrayLike<T>, fn: (first: T, second: T) => number): T {
  let it = iter(object);
  let result = it.next();
  if (result === void 0) {
    return void 0;
  }
  let value: T;
  while ((value = it.next()) !== void 0) {
    if (fn(value, result) > 0) {
      result = value;
    }
  }
  return result;
}


/**
 * Find the index of the first occurrence of a value in a sequence.
 *
 * @param object - The sequence or array-like object to search.
 *
 * @param value - The value to locate in the sequence. Values are
 *   compared using strict `===` equality.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `0`.
 *
 * @returns The index of the first occurrence of the value, or `-1`
 *   if the value is not found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral or `< 0`.
 *
 * #### Example
 * ```typescript
 * import { indexOf } from 'phosphor/lib/algorithm/searching';
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
  let length = object.length;
  if (length === 0) {
    return -1;
  }
  let start: number;
  if (fromIndex === void 0) {
    start = 0;
  } else {
    start = fromIndex;
  }
  let seq = asSequence(object);
  for (let i = start; i < length; ++i) {
    if (seq.at(i) === value) {
      return i;
    }
  }
  return -1;
}


/**
 * Find the index of the last occurrence of a value in a sequence.
 *
 * @param object - The sequence or array-like object to search.
 *
 * @param value - The value to locate in the sequence. Values are
 *   compared using strict `===` equality.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `length - 1`.
 *
 * @returns The index of the last occurrence of the value, or `-1`
 *   if the value is not found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral or `>= length`.
 *
 * #### Example
 * ```typescript
 * import { lastIndexOf } from 'phosphor/lib/algorithm/searching';
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
  let length = object.length;
  if (length === 0) {
    return -1;
  }
  let start: number;
  if (fromIndex === void 0) {
    start = length - 1;
  } else {
    start = fromIndex;
  }
  let seq = asSequence(object);
  for (let i = start; i >= 0; --i) {
    if (seq.at(i) === value) {
      return i;
    }
  }
  return -1;
}


/**
 * Find the index of the first value which matches a predicate.
 *
 * @param object - The sequence or array-like object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `0`.
 *
 * @returns The index of the first matching value, or `-1` if no
 *   matching value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral or `< 0`.
 *
 * Modifying the length of the sequence while searching.
 *
 * #### Example
 * ```typescript
 * import { findIndex } from 'phosphor/lib/algorithm/searching';
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
  let length = object.length;
  if (length === 0) {
    return -1;
  }
  let start: number;
  if (fromIndex === void 0) {
    start = 0;
  } else {
    start = fromIndex;
  }
  let seq = asSequence(object);
  for (let i = start; i < length; ++i) {
    if (fn(seq.at(i), i)) {
      return i;
    }
  }
  return -1;
}


/**
 * Find the index of the last value which matches a predicate.
 *
 * @param object - The sequence or array-like object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `length - 1`.
 *
 * @returns The index of the last matching value, or `-1` if no
 *   matching value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral or `>= length`.
 *
 * Modifying the length of the sequence while searching.
 *
 * #### Example
 * ```typescript
 * import { findLastIndex } from 'phosphor/lib/algorithm/searching';
 *
 * function isEven(value: number): boolean {
 *   return value % 2 === 0;
 * }
 *
 * let data = [1, 2, 3, 4, 3, 2, 1];
 * findLastIndex(data, isEven);     // 5
 * findLastIndex(data, isEven, 4);  // 3
 * findLastIndex(data, isEven, 0);  // -1
 * ```
 */
export
function findLastIndex<T>(object: SequenceOrArrayLike<T>, fn: (value: T, index: number) => boolean, fromIndex?: number): number {
  let length = object.length;
  if (length === 0) {
    return -1;
  }
  let start: number;
  if (fromIndex === void 0) {
    start = length - 1;
  } else {
    start = fromIndex;
  }
  let seq = asSequence(object);
  for (let i = start; i >= 0; --i) {
    if (fn(seq.at(i), i)) {
      return i;
    }
  }
  return -1;
}


/**
 * Find the index of the first element which compares `>=` to a value.
 *
 * @param sequence - The sequence or array-like object to search.
 *   It must be sorted in ascending order.
 *
 * @param value - The value to locate in the sequence.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if an element is less than a value, `0` if
 *   an element is equal to a value, or `> 0` if an element is greater
 *   than a value.
 *
 * @returns The index of the first element which compares `>=` to the
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
 * import { lowerBound } from 'phosphor/lib/algorithm/searching';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * let data = [0, 3, 4, 7, 7, 9];
 * lowerBound(data, 0, numberCmp);   // 0
 * lowerBound(data, 6, numberCmp);   // 3
 * lowerBound(data, 7, numberCmp);   // 3
 * lowerBound(data, -1, numberCmp);  // 0
 * lowerBound(data, 10, numberCmp);  // 6
 * ```
 */
export
function lowerBound<T, U>(object: SequenceOrArrayLike<T>, value: U, fn: (element: T, value: U) => number): number {
  let n = object.length;
  if (n === 0) {
    return 0;
  }
  let begin = 0;
  let half: number;
  let middle: number;
  let seq = asSequence(object);
  while (n > 0) {
    half = n / 2 | 0;
    middle = begin + half;
    if (fn(seq.at(middle), value) < 0) {
      begin = middle + 1;
      n -= half + 1;
    } else {
      n = half;
    }
  }
  return begin;
}


/**
 * Find the index of the first element which compares `>` than a value.
 *
 * @param sequence - The sequence or array-like object to search.
 *   It must be sorted in ascending order.
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
 * import { upperBound } from 'phosphor/lib/algorithm/searching';
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
function upperBound<T, U>(object: SequenceOrArrayLike<T>, value: U, fn: (element: T, value: U) => number): number {
  let n = object.length;
  if (n === 0) {
    return 0;
  }
  let begin = 0;
  let half: number;
  let middle: number;
  let seq = asSequence(object);
  while (n > 0) {
    half = n / 2 | 0;
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


/**
 * A namespace which holds string searching functionality.
 */
export
namespace StringSearch {
  /**
   * The result of a sum-of-squares string search.
   */
  export
  interface ISumOfSquaresResult {
    /**
     * A score which indicates the strength of the match.
     *
     * A lower score is better. Zero is the best possible score.
     */
    score: number;

    /**
     * The indices of the matched characters in the source text.
     *
     * The indices will appear in increasing order.
     */
    indices: number[];
  }

  /**
   * Compute the sum-of-squares match for the given search text.
   *
   * @param sourceText - The text which should be searched.
   *
   * @param queryText - The query text to locate in the source text.
   *
   * @returns The match result object, or `null` if there is no match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   *
   * #### Notes
   * This scoring algorithm uses a sum-of-squares approach to determine
   * the score. In order for there to be a match, all of the characters
   * in `queryText` **must** appear in `sourceText` in order. The index
   * of each matching character is squared and added to the score. This
   * means that early and consecutive character matches are preferred.
   *
   * The character match is performed with strict equality. It is case
   * sensitive and does not ignore whitespace. If those behaviors are
   * required, the text should be transformed before scoring.
   */
  export
  function sumOfSquares(sourceText: string, queryText: string): ISumOfSquaresResult {
    let score = 0;
    let indices = new Array<number>(queryText.length);
    for (let i = 0, j = 0, n = queryText.length; i < n; ++i, ++j) {
      j = sourceText.indexOf(queryText[i], j);
      if (j === -1) {
        return null;
      }
      indices[i] = j;
      score += j * j;
    }
    return { score, indices };
  }

  /**
   * Highlight the matched characters of a source string.
   *
   * @param source - The text which should be highlighted.
   *
   * @param indices - The indices of the matched characters. They must
   *   appear in increasing order and must be in bounds of the source.
   *
   * @returns A string with interpolated `<mark>` tags.
   */
  export
  function highlight(sourceText: string, indices: number[]): string {
    let k = 0;
    let last = 0;
    let result = '';
    let n = indices.length;
    while (k < n) {
      let i = indices[k];
      let j = indices[k];
      while (++k < n && indices[k] === j + 1) {
        j++;
      }
      let head = sourceText.slice(last, i);
      let chunk = sourceText.slice(i, j + 1);
      result += `${head}<mark>${chunk}</mark>`;
      last = j + 1;
    }
    return result + sourceText.slice(last);
  }
}
