/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * Create an iterator for an iterable or array.
 */
export
function iter<T>(iterable: IIterable<T> | T[]): IIterator<T> {
  if (iterable instanceof Array) {
    return new ArrayIterator(<T[]>iterable);
  }
  return (<IIterable<T>>iterable).iterator();
}


/**
 * Create a reverse iterator for an reverse iterable or array.
 */
export
function reversed<T>(iterable: IReverseIterable<T> | T[]): IIterator<T> {
  if (iterable instanceof Array) {
    return new ArrayReverseIterator(<T[]>iterable);
  }
  return (<IReverseIterable<T>>iterable).reverseIterator();
}


/**
 * Create an array from the values in an iterable.
 */
export
function toArray<T>(iterable: IIterable<T> | T[]): T[] {
  var result: T[] = [];
  for (var it = iter(iterable); it.moveNext();) {
    result.push(it.current);
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
  iterable: IIterable<T> | T[],
  callback: (value: T, index: number) => U): U {
  for (var i = 0, it = iter(iterable); it.moveNext(); ++i) {
    var result = callback(it.current, i);
    if (result !== void 0) return result;
  }
  return void 0;
}


/**
 * Returns true if any element in the iterable passes the given test.
 */
export
function some<T>(
  iterable: IIterable<T> | T[],
  callback: (value: T, index: number) => boolean): boolean {
  for (var i = 0, it = iter(iterable); it.moveNext(); ++i) {
    if (callback(it.current, i)) return true;
  }
  return false;
}


/**
 * Returns true if all elements in the iterable pass the given test.
 */
export
function every<T>(
  iterable: IIterable<T> | T[],
  callback: (value: T, index: number) => boolean): boolean {
  for (var i = 0, it = iter(iterable); it.moveNext(); ++i) {
    if (!callback(it.current, i)) return false;
  }
  return true;
}


/**
 * Create an array of the iterable elements which pass the given test.
 */
export
function filter<T>(
  iterable: IIterable<T> | T[],
  callback: (value: T, index: number) => boolean): T[] {
  var result: T[] = [];
  for (var i = 0, it = iter(iterable); it.moveNext(); ++i) {
    if (callback(it.current, i)) result.push(it.current);
  }
  return result;
}


/**
 * Create an array of callback results for each element in an iterable.
 */
export
function map<T, U>(
  iterable: IIterable<T> | T[],
  callback: (value: T, index: number) => U): U[] {
  var result: U[] = [];
  for (var i = 0, it = iter(iterable); it.moveNext(); ++i) {
    result.push(callback(it.current, i));
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
  iterable: IIterable<T> | T[],
  callback: (value: T, index: number) => boolean): T {
  for (var i = 0, it = iter(iterable); it.moveNext(); ++i) {
    if (callback(it.current, i)) return it.current;
  }
  return void 0;
}


/**
 * Find the index of the first element which passes the given test.
 *
 * Returns -1 if no element passes the test.
 */
export
function findIndex<T>(
  iterable: IIterable<T> | T[],
  callback: (value: T, index: number) => boolean): number {
  for (var i = 0, it = iter(iterable); it.moveNext(); ++i) {
    if (callback(it.current, i)) return i;
  }
  return -1;
}


/**
 * Find the index of the first array element which passes the test.
 *
 * The `from` parameter controls the starting index of the search. If
 * the value is negative, it is offset from the end of the list. The
 * default index is `0`.
 *
 * The `wrap` parameter controls the search wrap-around. If true, the
 * search will wrap-around at the end of the list and continue until
 * reaching one before the starting element.
 *
 * Returns -1 if no element passes the test.
 */
export
function findFirstIndex<T>(
  array: T[],
  callback: (value: T, index: number) => boolean,
  from = 0, wrap = false): number {
  if (from < 0) {
    from += array.length;
    if (from < 0) from = 0;
  }
  if (wrap) {
    for (var i = 0; i < array.length; ++i) {
      var j = (i + from) % array.length;
      if (callback(array[j], j)) {
        return j;
      }
    }
  } else {
    for (var i = from; i < array.length; ++i) {
      if (callback(array[i], i)) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the index of the last array element which passes the test.
 *
 * The `from` parameter controls the starting index of the search. If
 * the value is negative, it is offset from the end of the list. The
 * default index is `-1`.
 *
 * The `wrap` parameter controls the search wrap-around. If true, the
 * search will wrap-around at the end of the list and continue until
 * reaching one before the starting element.
 *
 * Returns -1 if no element passes the test.
 */
export
function findLastIndex<T>(
  array: T[],
  callback: (value: T, index: number) => boolean,
  from = -1, wrap = false): number {
  if (from >= array.length) {
    from = array.length - 1;
  } else if (from < 0) {
    from += array.length;
    if (from < 0) return -1;
  }
  if (wrap) {
    for (var i = array.length; i > 0 && i <= array.length; --i) {
      var j = (i + from) % array.length;
      if (callback(array[j], j)) {
        return j;
      }
    }
  } else {
    for (var i = from; i >= 0 && i < array.length; --i) {
      if (callback(array[i], i)) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the index of the first element which compares `>=` to `value`.
 *
 * This uses a binary search algorithm which must be applied to a
 * sorted array in order for the results to be correct.
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
 * This uses a binary search algorithm which must be applied to a
 * sorted array in order for the results to be correct.
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
 * This uses a binary search algorithm which must be applied to a
 * sorted array in order for the results to be correct.
 *
 * Returns `-1` if no matching value is found.
 */
export
function lowerFind<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): number {
  var i = lowerBound(array, value, compare);
  if (i === array.length) {
    return -1;
  }
  if (compare(array[i], value) === 0) {
    return i;
  }
  return -1;
}


/**
 * Find the index of the last element which compares `==` to `value`.
 *
 * This uses a binary search algorithm which must be applied to a
 * sorted array in order for the results to be correct.
 *
 * Returns `-1` if no matching value is found.
 */
export
function upperFind<T, U>(
  array: T[],
  value: U,
  compare: (a: T, b: U) => number): number {
  var i = upperBound(array, value, compare);
  if (i === 0) {
    return -1;
  }
  if (compare(array[--i], value) === 0) {
    return i;
  }
  return -1;
}

} // module phosphor.collections
