/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.algorithm {

import IIterable = collections.IIterable;


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

} // module phosphor.algorithm
