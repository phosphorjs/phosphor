/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.algorithm {

import IList = collections.IList;


/**
 * Find the index of the first element which compares `>=` to `value`.
 *
 * This uses a binary search algorithm which must be applied to a
 * sorted list in order for the results to be correct.
 *
 * Returns `list.size` if all elements compare `<` than `value`.
 */
export
function lowerBound<T, U>(
  list: IList<T>,
  value: U,
  compare: (a: T, b: U) => number): number {
  var begin = 0;
  var half: number;
  var middle: number;
  var n = list.size;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (compare(list.get(middle), value) < 0) {
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
 * This uses a binary search algorithm which must be applied to a
 * sorted list in order for the results to be correct.
 *
 * Returns `0` if all elements compare `<=` than `value`.
 */
export
function upperBound<T, U>(
  list: IList<T>,
  value: U,
  compare: (a: T, b: U) => number): number {
  var begin = 0;
  var half: number;
  var middle: number;
  var n = list.size;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (compare(list.get(middle), value) > 0) {
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
 * This uses a binary search algorithm which must be applied to a
 * sorted list in order for the results to be correct.
 *
 * Returns `-1` if no matching value is found.
 */
export
function lowerFind<T, U>(
  list: IList<T>,
  value: U,
  compare: (a: T, b: U) => number): number {
  var i = lowerBound(list, value, compare);
  if (i === list.size) {
    return -1;
  }
  if (compare(list.get(i), value) === 0) {
    return i;
  }
  return -1;
}


/**
 * Find the index of the last element which compares `==` to `value`.
 *
 * This uses a binary search algorithm which must be applied to a
 * sorted list in order for the results to be correct.
 *
 * Returns `-1` if no matching value is found.
 */
export
function upperFind<T, U>(
  list: IList<T>,
  value: U,
  compare: (a: T, b: U) => number): number {
  var i = upperBound(list, value, compare);
  if (i === 0) {
    return -1;
  }
  if (compare(list.get(--i), value) === 0) {
    return i;
  }
  return -1;
}

} // module phosphor.algorithm
