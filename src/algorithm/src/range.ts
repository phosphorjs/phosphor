/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator
} from './iter';


/**
 * Create an iterator of evenly spaced values.
 *
 * @param start - The starting value for the range, inclusive.
 *
 * @param stop - The stopping value for the range, exclusive.
 *
 * @param step - The distance between each value.
 *
 * @returns An iterator which produces evenly spaced values.
 *
 * #### Notes
 * In the single argument form of `range(stop)`, `start` defaults to
 * `0` and `step` defaults to `1`.
 *
 * In the two argument form of `range(start, stop)`, `step` defaults
 * to `1`.
 */
export
function range(start: number, stop?: number, step?: number): IIterator<number> {
  if (stop === undefined) {
    return new RangeIterator(0, start, 1);
  }
  if (step === undefined) {
    return new RangeIterator(start, stop, 1);
  }
  return new RangeIterator(start, stop, step);
}


/**
 * An iterator which produces a range of evenly spaced values.
 */
export
class RangeIterator implements IIterator<number> {
  /**
   * Construct a new range iterator.
   *
   * @param start - The starting value for the range, inclusive.
   *
   * @param stop - The stopping value for the range, exclusive.
   *
   * @param step - The distance between each value.
   */
  constructor(start: number, stop: number, step: number) {
    this._start = start;
    this._stop = stop;
    this._step = step;
    this._length = Private.rangeLength(start, stop, step);
  }

  /**
   * Get an iterator over the object's values.
   *
   * @returns An iterator which yields the object's values.
   */
  iter(): IIterator<number> {
    return this;
  }

  /**
   * Create an independent clone of the iterator.
   *
   * @returns A new independent clone of the iterator.
   */
  clone(): IIterator<number> {
    let result = new RangeIterator(this._start, this._stop, this._step);
    result._index = this._index;
    return result;
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): number | undefined {
    if (this._index >= this._length) {
      return undefined;
    }
    return this._start + this._step * this._index++;
  }

  private _index = 0;
  private _length: number;
  private _start: number;
  private _stop: number;
  private _step: number;
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Compute the effective length of a range.
   *
   * @param start - The starting value for the range, inclusive.
   *
   * @param stop - The stopping value for the range, exclusive.
   *
   * @param step - The distance between each value.
   *
   * @returns The number of steps need to traverse the range.
   */
  export
  function rangeLength(start: number, stop: number, step: number): number {
    if (step === 0) {
      return Infinity;
    }
    if (start > stop && step > 0) {
      return 0;
    }
    if (start < stop && step < 0) {
      return 0;
    }
    return Math.ceil((stop - start) / step);
  }
}
