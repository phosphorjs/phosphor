/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike, iter
} from './iterable';


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
 * import { find } from '@phosphor/algorithm';
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
 *   { species: 'alligator', name: 'pocho' }
 * ];
 *
 * find(data, isCat).name;  // 'fluffy'
 * ```
 */
export
function find<T>(object: IterableOrArrayLike<T>, fn: (value: T, index: number) => boolean): T | undefined {
  let index = 0;
  let it = iter(object);
  let value: T | undefined;
  while ((value = it.next()) !== undefined) {
    if (fn(value, index++)) {
      return value;
    }
  }
  return undefined;
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
 * import { min } from '@phosphor/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * min([7, 4, 0, 3, 9, 4], numberCmp);  // 0
 * ```
 */
export
function min<T>(object: IterableOrArrayLike<T>, fn: (first: T, second: T) => number): T | undefined {
  let it = iter(object);
  let value = it.next();
  if (value === undefined) {
    return undefined;
  }
  let result = value;
  while ((value = it.next()) !== undefined) {
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
 * import { max } from '@phosphor/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * max([7, 4, 0, 3, 9, 4], numberCmp);  // 9
 * ```
 */
export
function max<T>(object: IterableOrArrayLike<T>, fn: (first: T, second: T) => number): T | undefined {
  let it = iter(object);
  let value = it.next();
  if (value === undefined) {
    return undefined;
  }
  let result = value;
  while ((value = it.next()) !== undefined) {
    if (fn(value, result) > 0) {
      result = value;
    }
  }
  return result;
}


/**
 * Find the minimum and maximum values in an iterable.
 *
 * @param object - The iterable or array-like object to search.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if the first value is less than the second.
 *   `0` if the values are equivalent, or `> 0` if the first value is
 *   greater than the second.
 *
 * @returns A 2-tuple of the `[min, max]` values in the iterable. If
 *   multiple values are equivalent, the left-most values are returned.
 *   If the iterable is empty, this returns `undefined`.
 *
 * #### Complexity
 * Linear.
 *
 * #### Example
 * ```typescript
 * import { minmax } from '@phosphor/algorithm';
 *
 * function numberCmp(a: number, b: number): number {
 *   return a - b;
 * }
 *
 * minmax([7, 4, 0, 3, 9, 4], numberCmp);  // [0, 9]
 * ```
 */
export
function minmax<T>(object: IterableOrArrayLike<T>, fn: (first: T, second: T) => number): [T, T] | undefined {
  let it = iter(object);
  let value = it.next();
  if (value === undefined) {
    return undefined;
  }
  let rmin = value;
  let rmax = value;
  while ((value = it.next()) !== undefined) {
    if (fn(value, rmin) < 0) {
      rmin = value;
    } else if (fn(value, rmax) > 0) {
      rmax = value;
    }
  }
  return [rmin, rmax];
}


/**
 * Find the index of the first occurrence of a value in an array.
 *
 * @param array - The array-like object to search.
 *
 * @param value - The value to locate in the array. Values are
 *   compared using strict `===` equality.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `0`. Negative values are taken as an offset from the
 *   end of the array.
 *
 * @param wrap - Whether to wraparound at the end of the array so
 *   that all elements can be searched when `fromIndex !== 0`. The
 *   default is `false`.
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
 * indexOf(data, 'red');           // -1
 * indexOf(data, 'one');           // 0
 * indexOf(data, 'one', 1);        // 4
 * indexOf(data, 'two', 2);        // -1
 * indexOf(data, 'two', 2, true);  // 1
 * ```
 */
export
function indexOf<T>(array: ArrayLike<T>, value: T, fromIndex = 0, wrap = false): number {
  let n = array.length;
  if (n === 0) {
    return -1;
  }
  if (fromIndex < 0) {
    fromIndex = Math.max(0, fromIndex + n);
  } else {
    fromIndex = Math.min(fromIndex, n);
  }
  if (wrap) {
    for (let i = 0; i < n; ++i) {
      let j = (i + fromIndex) % n;
      if (array[j] === value) {
        return j;
      }
    }
  } else {
    for (let i = fromIndex; i < n; ++i) {
      if (array[i] === value) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the index of the last occurrence of a value in an array.
 *
 * @param array - The array-like object to search.
 *
 * @param value - The value to locate in the array. Values are
 *   compared using strict `===` equality.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `-1`. Negative values are taken as an offset from the
 *   end of the array.
 *
 * @param wrap - Whether to wraparound at the front of the array so
 *   that all elements can be searched when `fromIndex !== -1`. The
 *   default is `false`.
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
 * lastIndexOf(data, 'red');           // -1
 * lastIndexOf(data, 'one');           // 4
 * lastIndexOf(data, 'one', 1);        // 0
 * lastIndexOf(data, 'two', 0);        // -1
 * lastIndexOf(data, 'two', 0, true);  // 1
 * ```
 */
export
function lastIndexOf<T>(array: ArrayLike<T>, value: T, fromIndex = -1, wrap = false): number {
  let n = array.length;
  if (n === 0) {
    return -1;
  }
  if (fromIndex < 0) {
    fromIndex = Math.max(-1, fromIndex + n);
  } else {
    fromIndex = Math.min(fromIndex, n - 1);
  }
  if (wrap) {
    for (let i = n; i > 0; --i) {
      let j = (i + fromIndex) % n;
      if (array[j] === value) {
        return j;
      }
    }
  } else {
    for (let i = fromIndex; i >= 0; --i) {
      if (array[i] === value) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the index of the first value which matches a predicate.
 *
 * @param array - The array-like object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `0`. Negative values are taken as an offset from the
 *   end of the array.
 *
 * @param wrap - Whether to wraparound at the end of the array so
 *   that all elements can be searched when `fromIndex !== 0`. The
 *   default is `false`.
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
 * Modifying the length of the array while searching.
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
 * findIndex(data, isEven);           // 1
 * findIndex(data, isEven, 4);        // 5
 * findIndex(data, isEven, 6);        // -1
 * findIndex(data, isEven, 6, true);  // 1
 * ```
 */
export
function findIndex<T>(array: ArrayLike<T>, fn: (value: T, index: number) => boolean, fromIndex = 0, wrap = false): number {
  let n = array.length;
  if (n === 0) {
    return -1;
  }
  if (fromIndex < 0) {
    fromIndex = Math.max(0, fromIndex + n);
  } else {
    fromIndex = Math.min(fromIndex, n);
  }
  if (wrap) {
    for (let i = 0; i < n; ++i) {
      let j = (i + fromIndex) % n;
      if (fn(array[j], j)) {
        return j;
      }
    }
  } else {
    for (let i = fromIndex; i < n; ++i) {
      if (fn(array[i], i)) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the index of the last value which matches a predicate.
 *
 * @param object - The array-like object to search.
 *
 * @param fn - The predicate function to apply to the values.
 *
 * @param fromIndex - The starting index of the search. The default
 *   value is `-1`. Negative values are taken as an offset from the
 *   end of the array.
 *
 * @param wrap - Whether to wraparound at the front of the array so
 *   that all elements can be searched when `fromIndex !== -1`. The
 *   default is `false`.
 *
 * @returns The index of the last matching value, or `-1` if no
 *   matching value is found.
 *
 * #### Complexity
 * Linear.
 *
 * #### Undefined Behavior
 * A `fromIndex` which is non-integral.
 *
 * Modifying the length of the array while searching.
 *
 * #### Example
 * ```typescript
 * import { findLastIndex } from '@phosphor/algorithm';
 *
 * function isEven(value: number): boolean {
 *   return value % 2 === 0;
 * }
 *
 * let data = [1, 2, 3, 4, 3, 2, 1];
 * findLastIndex(data, isEven);           // 5
 * findLastIndex(data, isEven, 4);        // 3
 * findLastIndex(data, isEven, 0);        // -1
 * findLastIndex(data, isEven, 0, true);  // 5
 * ```
 */
export
function findLastIndex<T>(array: ArrayLike<T>, fn: (value: T, index: number) => boolean, fromIndex = -1, wrap = false): number {
  let n = array.length;
  if (n === 0) {
    return -1;
  }
  if (fromIndex < 0) {
    fromIndex = Math.max(-1, fromIndex + n);
  } else {
    fromIndex = Math.min(fromIndex, n - 1);
  }
  if (wrap) {
    for (let i = n; i > 0; --i) {
      let j = (i + fromIndex) % n;
      if (fn(array[j], j)) {
        return j;
      }
    }
  } else {
    for (let i = fromIndex; i >= 0; --i) {
      if (fn(array[i], i)) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the index of the first element which compares `>=` to a value.
 *
 * @param array - The sorted array-like object to search.
 *
 * @param value - The value to locate in the array.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if an element is less than a value, `0` if
 *   an element is equal to a value, or `> 0` if an element is greater
 *   than a value.
 *
 * @returns The index of the first element which compares `>=` to the
 *   value, or `length` if there is no such element.
 *
 * #### Notes
 * The array must already be sorted in ascending order according to
 * the comparison function.
 *
 * #### Complexity
 * Logarithmic.
 *
 * #### Undefined Behavior
 * Searching an array which is not sorted in ascending order.
 *
 * Modifying the length of the array while searching.
 *
 * #### Example
 * ```typescript
 * import { lowerBound } from '@phosphor/algorithm';
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
function lowerBound<T, U>(array: ArrayLike<T>, value: U, fn: (element: T, value: U) => number): number {
  let begin = 0;
  let half: number;
  let middle: number;
  let n = array.length;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (fn(array[middle], value) < 0) {
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
 * @param array - The sorted array-like object to search.
 *
 * @param value - The value to locate in the array.
 *
 * @param fn - The 3-way comparison function to apply to the values.
 *   It should return `< 0` if an element is less than a value, `0` if
 *   an element is equal to a value, or `> 0` if an element is greater
 *   than a value.
 *
 * @returns The index of the first element which compares `>` than the
 *   value, or `length` if there is no such element.
 *
 * #### Notes
 * The array must already be sorted in ascending order according to
 * the comparison function.
 *
 * #### Complexity
 * Logarithmic.
 *
 * #### Undefined Behavior
 * Searching an array which is not sorted in ascending order.
 *
 * Modifying the length of the array while searching.
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
function upperBound<T, U>(array: ArrayLike<T>, value: U, fn: (element: T, value: U) => number): number {
  let begin = 0;
  let half: number;
  let middle: number;
  let n = array.length;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (fn(array[middle], value) > 0) {
      n = half;
    } else {
      begin = middle + 1;
      n -= half + 1;
    }
  }
  return begin;
}


/**
 * Compute a fuzzy match for the given search text.
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
function fuzzySearch(sourceText: string, queryText: string): fuzzySearch.IResult | null {
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
 * The namespace for the `fuzzySearch` statics.
 */
export
namespace fuzzySearch {
  /**
   * The result of a fuzzy search.
   */
  export
  interface IResult {
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
}
