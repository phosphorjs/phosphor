/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * Create an array from the values in an iterable.
 */
export
function toArray<T>(iterable: IIterable<T>): T[] {
  var result: T[] = [];
  for (var iter = iterable.iterator(); iter.moveNext();) {
    result.push(iter.current);
  }
  return result;
}


/**
 * Invoke a function once for each element in an iterable.
 *
 * If the callback returns anything but `undefined`, iteration
 * will stop and that value will be returned from the function.
 */
export
function forEach<T, U>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => U): U {
  for (var i = 0, iter = iterable.iterator(); iter.moveNext(); ++i) {
    var result = callback(iter.current, i);
    if (result !== void 0) return result;
  }
  return void 0;
}


/**
 * Returns true if any element in the iterable passes the given test.
 */
export
function any<T>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => boolean): boolean {
  for (var i = 0, iter = iterable.iterator(); iter.moveNext(); ++i) {
    if (callback(iter.current, i)) return true;
  }
  return false;
}


/**
 * Returns true if all elements in the iterable pass the given test.
 */
export
function all<T>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => boolean): boolean {
  for (var i = 0, iter = iterable.iterator(); iter.moveNext(); ++i) {
    if (!callback(iter.current, i)) return false;
  }
  return true;
}


/**
 * Create an array of the iterable elements which pass the given test.
 */
export
function filter<T>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => boolean): T[] {
  var result: T[] = [];
  for (var i = 0, iter = iterable.iterator(); iter.moveNext(); ++i) {
    if (callback(iter.current, i)) result.push(iter.current);
  }
  return result;
}


/**
 * Create an array of callback results for each element in an iterable.
 */
export
function map<T, U>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => U): U[] {
  var result: U[] = [];
  for (var i = 0, iter = iterable.iterator(); iter.moveNext(); ++i) {
    result.push(callback(iter.current, i));
  }
  return result;
}


/**
 * Find the first element in the iterable which passes the given test.
 *
 * Returns `undefined` if no element passes the test.
 */
export
function find<T>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => boolean): T {
  for (var i = 0, iter = iterable.iterator(); iter.moveNext(); ++i) {
    if (callback(iter.current, i)) return iter.current;
  }
  return void 0;
}


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

} // module phosphor.collections
