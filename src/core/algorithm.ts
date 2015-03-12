/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';


/**
 * A pair of index and value.
 */
export
interface IItem<T> {
  /**
   * The index of the value.
   */
  index: number;

  /**
   * The value of interest.
   */
  value: T;
}


/**
 * Find the first value which matches a predicate.
 *
 * The semantics of `fromIndex` are the same as in `Array#indexOf`.
 *
 * If `wrap` is true, the search will wrap at the end of the array.
 *
 * Returns `undefined` if no matching value is found.
 */
export
function findFirst<T>(
  array: T[],
  predicate: (v: T) => boolean,
  fromIndex = 0,
  wrap = false): IItem<T> {
  var n = array.length;
  var f = fromIndex | 0;
  if (f > n) f = n;
  if (f < 0) f += n;
  if (f < 0) f = 0;
  for (var i = f; i < n; ++i) {
    var value = array[i];
    if (predicate(value)) {
      return { index: i, value: value };
    }
  }
  if (!wrap) {
    return void 0;
  }
  for (var i = 0; i < f; ++i) {
    var value = array[i];
    if (predicate(value)) {
      return { index: i, value: value };
    }
  }
  return void 0;
}


/**
 * Find the last value which matches the predicate.
 *
 * The semantics of `fromIndex` are the same as in `Array#lastIndexOf`.
 *
 * If `wrap` is true, the search will wrap at the front of the array.
 *
 * Returns `undefined` if no matching value is found.
 */
export
function findLast<T>(
  array: T[],
  predicate: (v: T) => boolean,
  fromIndex = array.length,
  wrap = false): IItem<T> {
  var n = array.length;
  var f = fromIndex | 0;
  if (f >= n) f = n - 1;
  if (f < 0) f += n;
  if (f < 0) f = -1;
  for (var i = f; i >= 0; --i) {
    var value = array[i];
    if (predicate(value)) {
      return { index: i, value: value };
    }
  }
  if (!wrap) {
    return void 0;
  }
  for (var i = n - 1; i > f; --i) {
    var value = array[i];
    if (predicate(value)) {
      return { index: i, value: value };
    }
  }
  return void 0;
}


/**
 * Find the index of the first element which compares `>=` to `value`.
 *
 * The array must be sorted.
 *
 * Returns `array.length` if no matching value is found.
 */
export
function lowerBound<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): number {
  var begin = 0;
  var half: number;
  var middle: number;
  var n = array.length;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (compare(array[middle], value) < 0) {
      begin = middle + 1;
      n -= half + 1;
    } else {
      n = half;
    }
  }
  return begin;
}


/**
 * Find the index of the first element which compares `>` than `value`.
 *
 * The array must be sorted.
 *
 * Returns `array.length` if no matching value is found.
 */
export
function upperBound<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): number {
  var begin = 0;
  var half: number;
  var middle: number;
  var n = array.length;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (compare(array[middle], value) > 0) {
      n = half;
    } else {
      begin = middle + 1;
      n -= half + 1;
    }
  }
  return begin;
}


/**
 * Find the first matching value using a binary search.
 *
 * The array must be sorted.
 *
 * Returns `undefined` if no matching value is found.
 */
export
function binaryFindFirst<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): IItem<T> {
  if (array.length === 0) {
    return void 0;
  }
  var i = lowerBound(array, value, compare);
  if (i === array.length) {
    return void 0;
  }
  var item = array[i];
  if (compare(item, value) === 0) {
    return { index: i, value: item };
  }
  return void 0;
}


/**
 * Find the last matching value using a binary search.
 *
 * The array must be sorted.
 *
 * Returns `undefined` if no matching value is found.
 */
export
function binaryFindLast<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): IItem<T> {
  if (array.length === 0) {
    return void 0;
  }
  var i = upperBound(array, value, compare);
  if (i === 0) {
    return void 0;
  }
  var item = array[i - 1];
  if (compare(item, value) === 0) {
    return { index: i, value: item };
  }
  return void 0;
}


/**
 * Insert a value at the given index.
 *
 * A negative index is offset from the end of the array.
 *
 * Returns the index of the inserted value.
 */
export
function insertAt<T>(array: T[], value: T, index: number): number {
  var n = array.length;
  var i = index | 0;
  if (i > n) i = n;
  if (i < 0) i += n;
  if (i < 0) i = 0;
  for (var j = n; j >= i; --j) {
    array[j] = array[j - 1];
  }
  array[i] = value;
  return i;
}


/**
 * Insert a value at its lower bound index.
 *
 * The array must be sorted.
 *
 * Returns the index of the inserted value.
 */
export
function insortLower<T>(array: T[], value: T, cmp: ICompare<T, T>): number {
  var i = lowerBound(array, value, cmp);
  return insertAt(array, value, i);
}


/**
 * Insert a value at its upper bound index.
 *
 * The array must be sorted.
 *
 * Returns the index of the inserted value.
 */
export
function insortUpper<T>(array: T[], value: T, cmp: ICompare<T, T>): number {
  var i = upperBound(array, value, cmp);
  return insertAt(array, value, i);
}


/**
 * Remove and return the value at the given index.
 *
 * A negative index is offset from the end of the array.
 *
 * Returns `undefined` if the index is out of range.
 */
export
function takeAt<T>(array: T[], index: number): T {
  var n = array.length;
  var i = index | 0;
  if (i < 0) i += n;
  if (i < 0 || i >= n) {
    return void 0;
  }
  var value = array[i];
  for (var j = i + 1; j < n; ++j) {
    array[j - 1] = array[j];
  }
  array.pop();
  return value;
}


/**
 * Remove the first value which matches the predicate.
 *
 * The semantics of `fromIndex` are the same as in `Array#indexOf`.
 *
 * If `wrap` is true, the search will wrap at the end of the array.
 *
 * Returns `undefined` if no matching value is found.
 */
export
function removeFirst<T>(
  array: T[],
  predicate: (v: T) => boolean,
  fromIndex?: number,
  wrap?: boolean): IItem<T> {
  var found = findFirst(array, predicate, fromIndex, wrap);
  if (found !== void 0) takeAt(array, found.index);
  return found;
}


/**
 * Remove the last value which matches the predicate.
 *
 * Returns the value removed from the array.
 */
export
function removeLast<T>(
  array: T[],
  predicate: (v: T) => boolean,
  fromIndex?: number,
  wrap?: boolean): IItem<T> {
  var found = findLast(array, predicate, fromIndex, wrap);
  if (found !== void 0) takeAt(array, found.index);
  return found;
}


/**
 * Reverse a slice of an array in-place.
 *
 * The start index is clamped to zero, the end index is clamped
 * to `length - 1`. If `start >= end`, the array is not modified.
 *
 * Returns the input `array`.
 */
export
function reverseSlice<T>(array: T[], start = 0, end = array.length - 1): T[] {
  var l = array.length - 1;
  var s = start | 0;
  var e = end | 0;
  if (s < 0) s = 0;
  if (e > l) e = l;
  while (s < e) {
    var temp = array[s];
    array[s++] = array[e];
    array[e--] = temp;
  }
  return array;
}


/**
 * Create a new array with consecutive duplicate elements removed.
 *
 * If the array is sorted, the result will have all unique elements.
 */
export
function unique<T>(array: T[], compare: ICompare<T, T>): T[] {
  var n = array.length;
  if (n === 0) {
    return [];
  }
  var result: T[] = [array[0]];
  for (var i = 1, j = 0; i < n; ++i) {
    var item = array[i];
    if (compare(result[j], item) !== 0) {
      result[++j] = item;
    }
  }
  return result;
}


/**
 * Create a set from an array of values.
 *
 * A set is a sorted array of unique values.
 */
export
function makeSet<T>(array: T[], compare: (a: T, b: T) => number): T[] {
  var sorted = array.slice.sort(compare);
  return unique(sorted, compare);
}


/**
 * Test whether two sets are disjoint.
 *
 * A set is a sorted array of unique items.
 */
export
function setIsDisjoint<T>(
  first: T[],
  second: T[],
  compare: (a: T, b: T) => number): boolean {
  var i = 0, j = 0;
  var len1 = first.length;
  var len2 = second.length;
  while (i < len1 && j < len2) {
    var v = compare(first[i], second[j]);
    if (v < 0) {
      ++i;
    } else if (v > 0) {
      ++j;
    } else {
      return false;
    }
  }
  return true;
}


/**
 * Test whether one set is the subset of another.
 *
 * A set is a sorted array of unique items.
 */
export
function setIsSubset<T>(
  first: T[],
  second: T[],
  compare: (a: T, b: T) => number): boolean {
  var len1 = first.length;
  var len2 = second.length;
  if (len1 > len2) {
    return false;
  }
  var i = 0, j = 0;
  while (i < len1 && j < len2) {
    var v = compare(first[i], second[j]);
    if (v < 0) {
      return false;
    } else if (v > 0) {
      ++j;
    } else {
      ++i;
      ++j;
    }
  }
  return i == len1;
}


/**
 * Create the union of two sets.
 *
 * A set is a sorted array of unique items.
 */
export
function setUnion<T>(
  first: T[],
  second: T[],
  compare: (a: T, b: T) => number): T[] {
  var i = 0, j = 0;
  var len1 = first.length;
  var len2 = second.length;
  var merged: T[] = [];
  while (i < len1 && j < len2) {
    var a = first[i];
    var b = second[j];
    var v = compare(a, b);
    if (v < 0) {
      merged.push(a);
      ++i;
    } else if (v > 0) {
      merged.push(b);
      ++j;
    } else {
      merged.push(a);
      ++i;
      ++j;
    }
  }
  while (i < len1) {
    merged.push(first[i]);
    ++i;
  }
  while (j < len2) {
    merged.push(second[j]);
    ++j;
  }
  return merged;
}


/**
 * Create the intersection of two sets.
 *
 * A set is a sorted array of unique items.
 */
export
function setIntersection<T>(
  first: T[],
  second: T[],
  compare: (a: T, b: T) => number): T[] {
  var i = 0, j = 0;
  var len1 = first.length;
  var len2 = second.length;
  var merged: T[] = [];
  while (i < len1 && j < len2) {
    var a = first[i];
    var b = second[j];
    var v = compare(a, b);
    if (v < 0) {
      ++i;
    } else if (v > 0) {
      ++j;
    } else {
      merged.push(a);
      ++i;
      ++j;
    }
  }
  return merged;
}


/**
 * Create the difference of two sets.
 *
 * A set is a sorted array of unique items.
 */
export
function setDifference<T>(
  first: T[],
  second: T[],
  compare: (a: T, b: T) => number): T[] {
  var i = 0, j = 0;
  var len1 = first.length;
  var len2 = second.length;
  var merged: T[] = [];
  while (i < len1 && j < len2) {
    var a = first[i];
    var b = second[j];
    var v = compare(a, b);
    if (v < 0) {
      merged.push(a);
      ++i;
    } else if (v > 0) {
      ++j;
    } else {
      ++i;
      ++j;
    }
  }
  while (i < len1) {
    merged.push(first[i]);
    ++i;
  }
  return merged;
}


/**
 * Create the symmetric difference of two sets.
 *
 * A set is a sorted array of unique items.
 */
export
function setSymmetricDifference<T>(
  first: T[],
  second: T[],
  compare: (a: T, b: T) => number): T[] {
  var i = 0, j = 0;
  var len1 = first.length;
  var len2 = second.length;
  var merged: T[] = [];
  while (i < len1 && j < len2) {
    var a = first[i];
    var b = second[j];
    var v = compare(a, b);
    if (v < 0) {
      merged.push(a);
      ++i;
    } else if (v > 0) {
      merged.push(b);
      ++j;
    } else {
      ++i;
      ++j;
    }
  }
  while (i < len1) {
    merged.push(first[i]);
    ++i;
  }
  while (j < len2) {
    merged.push(second[j]);
    ++j;
  }
  return merged;
}
