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
