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
 * Invoke a function once for each element in an iterable.
 *
 * If the callback returns anything but `undefined`, iteration
 * will stop and that value will be returned from the function.
 */
export
function forEach<T, U>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => U): U {
  for (var i = 0, iter = iterable.iterator(); iter.hasNext(); ++i) {
    var result = callback(iter.next(), i);
    if (result !== void 0) return result;
  }
  return void 0;
}


/**
 * Returns true if some element in an iterable passes a given test.
 */
export
function some<T>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => boolean): boolean {
  for (var i = 0, iter = iterable.iterator(); iter.hasNext(); ++i) {
    if (callback(iter.next(), i)) return true;
  }
  return false;
}


/**
 * Returns true if all elements in an iterable pass a given test.
 */
export
function every<T>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => boolean): boolean {
  for (var i = 0, iter = iterable.iterator(); iter.hasNext(); ++i) {
    if (!callback(iter.next(), i)) return false;
  }
  return true;
}


/**
 * Create an array of the iterable elements which pass a test.
 */
export
function filter<T>(
  iterable: IIterable<T>,
  callback: (value: T, index: number) => boolean): T[] {
  var result: T[] = [];
  for (var i = 0, iter = iterable.iterator(); iter.hasNext(); ++i) {
    var value = iter.next();
    if (callback(value, i)) result.push(value);
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
  for (var i = 0, iter = iterable.iterator(); iter.hasNext(); ++i) {
    result.push(callback(iter.next(), i));
  }
  return result;
}

} // module phosphor.algorithm
