/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

export
module algorithm {

/**
 * Find the index of the first element which passes the test.
 *
 * The `from` parameter controls the starting index of the search. If
 * the value is negative, it is offset from the end of the array. The
 * default index is `0`.
 *
 * The `wrap` parameter controls the search wrap-around. If true, the
 * search will wrap-around at the end of the array and continue until
 * reaching the element just before the starting element. The default
 * wrap value is `false`.
 *
 * Returns `-1` if no element passes the test.
 */
export
function findIndex<T>(array: T[], pred: IPredicate<T>, from = 0, wrap = false): number {
  var len = array.length;
  if (len === 0) {
    return -1;
  }
  from = from | 0;
  if (from > len) {
    from = len;
  }
  if (from < 0) {
    from += len;
  }
  if (from < 0) {
    from = 0;
  }
  if (wrap) {
    for (var i = 0; i < len; ++i) {
      var j = (i + from) % len;
      if (pred(array[j], j)) {
        return j;
      }
    }
  } else {
    for (var i = from; i < len; ++i) {
      if (pred(array[i], i)) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the index of the last element which passes the test.
 *
 * The `from` parameter controls the starting index of the search. If
 * the value is negative, it is offset from the end of the array. The
 * default index is `-1`.
 *
 * The `wrap` parameter controls the search wrap-around. If true, the
 * search will wrap-around at the front of the array and continue until
 * reaching the element just after the starting element. The default
 * wrap value is `false`.
 *
 * Returns `-1` if no element passes the test.
 */
export
function findLastIndex<T>(array: T[], pred: IPredicate<T>, from = -1, wrap = false): number {
  var len = array.length;
  if (len === 0) {
    return -1;
  }
  from = from | 0;
  if (from >= len) {
    from = len - 1;
  }
  if (from < 0) {
    from += len;
  }
  if (wrap) {
    if (from < 0) from = len - 1;
    for (var i = len; i > 0; --i) {
      var j = (i + from) % len;
      if (pred(array[j], j)) {
        return j;
      }
    }
  } else {
    for (var i = from; i >= 0; --i) {
      if (pred(array[i], i)) {
        return i;
      }
    }
  }
  return -1;
}


/**
 * Find the first element in the array which passes the given test.
 *
 * The `from` parameter controls the starting index of the search. If
 * the value is negative, it is offset from the end of the array. The
 * default index is `0`.
 *
 * The `wrap` parameter controls the search wrap-around. If true, the
 * search will wrap-around at the end of the array and continue until
 * reaching the element just before the starting element. The default
 * wrap value is `false`.
 *
 * Returns `undefined` if no element passes the test.
 */
export
function find<T>(array: T[], pred: IPredicate<T>, from?: number, wrap?: boolean): T {
  var i = findIndex(array, pred, from, wrap);
  return i !== -1 ? array[i] : void 0;
}


/**
 * Find the last element in the array which passes the given test.
 *
 * The `from` parameter controls the starting index of the search. If
 * the value is negative, it is offset from the end of the array. The
 * default index is `-1`.
 *
 * The `wrap` parameter controls the search wrap-around. If true, the
 * search will wrap-around at the front of the array and continue until
 * reaching the element just after the starting element. The default
 * wrap value is `false`.
 *
 * Returns `undefined` if no element passes the test.
 */
export
function findLast<T>(array: T[], pred: IPredicate<T>, from?: number, wrap?: boolean): T {
  var i = findLastIndex(array, pred, from, wrap);
  return i !== -1 ? array[i] : void 0;
}


/**
 * Find the index of the first element which is not less than `value`.
 *
 * This function uses a binary search. It must be applied to a sorted
 * array in order for the results to be correct.
 *
 * Returns `array.length` if all elements are less than `value`.
 */
export
function lowerBound<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number {
  var begin = 0;
  var half: number;
  var middle: number;
  var n = array.length;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (cmp(array[middle], value) < 0) {
      begin = middle + 1;
      n -= half + 1;
    } else {
      n = half;
    }
  }
  return begin;
}


/**
 * Find the index of the first element which is greater than `value`.
 *
 * This function uses a binary search. It must be applied to a sorted
 * array in order for the results to be correct.
 *
 * Returns `array.length` if no element is greater than `value`.
 */
export
function upperBound<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number {
  var begin = 0;
  var half: number;
  var middle: number;
  var n = array.length;
  while (n > 0) {
    half = n >> 1;
    middle = begin + half;
    if (cmp(array[middle], value) > 0) {
      n = half;
    } else {
      begin = middle + 1;
      n -= half + 1;
    }
  }
  return begin;
}


/**
 * Find the index of the first element which is equal to `value`.
 *
 * This function uses a binary search. It must be applied to a sorted
 * array in order for the results to be correct.
 *
 * Returns `-1` if no matching value is found.
 */
export
function lowerFindIndex<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number {
  var i = lowerBound(array, value, cmp);
  if (i === array.length) {
    return -1;
  }
  if (cmp(array[i], value) === 0) {
    return i;
  }
  return -1;
}


/**
 * Find the index of the last element which is equal to `value`.
 *
 * This function uses a binary search. It must be applied to a sorted
 * array in order for the results to be correct.
 *
 * Returns `-1` if no matching value is found.
 */
export
function upperFindIndex<T, U>(array: T[], value: U, cmp: IComparator<T, U>): number {
  var i = upperBound(array, value, cmp);
  if (i === 0) {
    return -1;
  }
  if (cmp(array[i - 1], value) === 0) {
    return i - 1;
  }
  return -1;
}


/**
 * Find the first element which is equal to `value`.
 *
 * This function uses a binary search. It must be applied to a sorted
 * array in order for the results to be correct.
 *
 * Returns `undefined` if no matching value is found.
 */
export
function lowerFind<T, U>(array: T[], value: U, cmp: IComparator<T, U>): T {
  var i = lowerBound(array, value, cmp);
  if (i === array.length) {
    return void 0;
  }
  var item = array[i];
  if (cmp(item, value) === 0) {
    return item;
  }
  return void 0;
}


/**
 * Find the index of the last element which is equal to `value`.
 *
 * This uses a binary search algorithm which must be applied to a
 * sorted array in order for the results to be correct.
 *
 * Returns `-1` if no matching value is found.
 */
export
function upperFind<T, U>(array: T[], value: U, cmp: IComparator<T, U>): T {
  var i = upperBound(array, value, cmp);
  if (i === 0) {
    return void 0;
  }
  var item = array[i - 1];
  if (cmp(item, value) === 0) {
    return item;
  }
  return void 0;
}


/**
 * Insert an element at the given index.
 *
 * This is faster than `Array#splice` for inserting a single element
 * since it does not allocate an array return value.
 *
 * Returns the clamped index of the inserted element.
 */
export
function insert<T>(array: T[], index: number, value: T): number {
  index = index | 0;
  var len = array.length;
  if (index < 0) {
    index += len;
  }
  if (index < 0) {
    index = 0;
  }
  if (index > len) {
    index = len;
  }
  for (var i = len; i > index; --i) {
    array[i] = array[i - 1];
  }
  array[index] = value;
  return index;
}


/**
 * Remove and return the element at the given index.
 *
 * This is faster than `Array#splice` for removing a single element
 * since it does not allocate an array return value.
 *
 * Returns `undefined` if the index is out of range.
 */
export
function removeAt<T>(array: T[], index: number): T {
  index = index | 0;
  var len = array.length;
  if (index < 0 || index >= len) {
    return void 0;
  }
  var value = array[index];
  for (var i = index + 1; i < len; ++i) {
    array[i - 1] = array[i];
  }
  array.pop();
  return value;
}


/**
 * Remove the first matching element and return its index.
 *
 * Returns the `-1` if there is no matching element.
 */
export
function remove<T>(array: T[], value: T): number {
  var index = array.indexOf(value);
  if (index !== -1) removeAt(array, index);
  return index;
}

} // module algorithm

} // module phosphor.collections
