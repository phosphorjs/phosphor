/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.algorithm {

/**
 * Find the index of the first element which compares `>=` to `value`.
 *
 * The array must be sorted.
 *
 * Returns `array.length` if all elements compare `<` than `value`.
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
 * Returns `0` if all elements compare `<=` than `value`.
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
 * Find the index of the first element which compares `==` to `value`.
 *
 * The array must be sorted.
 *
 * Returns `-1` if no matching value is found.
 */
export
function binaryFind<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): number {
  var i = lowerBound(array, value, compare);
  if (i === array.length) {
    return -1;
  }
  if (compare(array[i], value) === 0) {
    return i
  }
  return -1;
}


/**
 * Find the index of the last element which compares `==` to `value`.
 *
 * The array must be sorted.
 *
 * Returns `-1` if no matching value is found.
 */
export
function binaryFindLast<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): number {
  var i = upperBound(array, value, compare);
  if (i === 0) {
    return -1;
  }
  if (compare(array[i - 1], value) === 0) {
    return i - 1;
  }
  return -1;
}

} // module phosphor.algorithm
