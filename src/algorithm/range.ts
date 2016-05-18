/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator
} from './iteration';

import {
  ISequence
} from './sequence';


/**
 * Create a range of evenly spaced values.
 *
 * @param start - The starting value for the range, inclusive.
 *
 * @param stop - The stopping value for the range, exclusive.
 *
 * @param step - The nonzero distance between each value.
 *
 * @returns A range object which produces evenly spaced values.
 *
 * #### Notes
 * In the single argument form of `range(stop)`, `start` defaults to
 * `0` and `step` defaults to `1`.
 *
 * In the two argument form of `range(start, stop)`, `step` defaults
 * to `1`.
 *
 * All values can be any real number, but `step` cannot be `0`.
 */
export
function range(start: number, stop?: number, step?: number): Range {
  if (stop === void 0) {
    return new Range(0, start, 1);
  }
  if (step === void 0) {
    return new Range(start, stop, 1);
  }
  return new Range(start, stop, step);
}


/**
 * An object which produces a range of evenly spaced values.
 */
export
class Range implements ISequence<number> {
  /**
   * Construct a new range.
   *
   * @param start - The starting value for the range, inclusive.
   *
   * @param stop - The stopping value for the range, exclusive.
   *
   * @param step - The nonzero distance between each value.
   */
  constructor(start: number, stop: number, step: number) {
    if (step === 0) throw new Error('Range(): Step cannot be zero');
    this._start = start;
    this._stop = stop;
    this._step = step;
    this._length = rangeLength(start, stop, step);
  }

  /**
   * The starting value for the range, inclusive.
   *
   * #### Notes
   * This is a read-only property.
   */
  get start(): number {
    return this._start;
  }

  /**
   * The stopping value for the range, exclusive.
   *
   * #### Notes
   * This is a read-only property.
   */
  get stop(): number {
    return this._stop;
  }

  /**
   * The distance between each value.
   *
   * #### Notes
   * This is a read-only property.
   */
  get step(): number {
    return this._step;
  }

  /**
   * The number of values in the range.
   *
   * #### Notes
   * This is a read-only property.
   */
  get length(): number {
    return this._length;
  }

  /**
   * Create an iterator over the range of values.
   *
   * @returns A new iterator for the range of values.
   */
  iter(): RangeIterator {
    return new RangeIterator(this._start, this._stop, this._step);
  }

  /**
   * Get the value at the specified index.
   *
   * @param index - The positive integer index of interest.
   *
   * @returns The value at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral or out of range.
   */
  at(index: number): number {
    return this._start + this._step * index;
  }

  private _start: number;
  private _stop: number;
  private _step: number;
  private _length: number;
}


/**
 * An iterator which generates evenly spaced values.
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
   * @param step - The non-zero distance between each value.
   */
  constructor(start: number, stop: number, step: number) {
    if (step === 0) throw new Error('RangeIterator(): Step cannot be zero');
    this._index = 0;
    this._step = step;
    this._start = start;
    this._length = rangeLength(start, stop, step);
  }

  /**
   * Create an iterator over the object's values.
   *
   * @returns A reference to `this` iterator.
   */
  iter(): this {
    return this;
  }

  /**
   * Create an independent clone of the range iterator.
   *
   * @returns A new iterator starting with the current value.
   */
  clone(): RangeIterator {
    let start = this._start + this._step * this._index;
    let stop = this._start + this._step * this._length;
    return new RangeIterator(start, stop, this._step);
  }

  /**
   * Get the next value from the range.
   *
   * @returns The next value from the range, or `undefined` if the
   *   iterator is exhausted.
   */
  next(): number {
    if (this._index >= this._length) {
      return void 0;
    }
    return this._start + this._step * this._index++;
  }

  private _start: number;
  private _step: number;
  private _index: number;
  private _length: number;
}


/**
 * Compute the effective length of a range.
 *
 * @param start - The starting value for the range, inclusive.
 *
 * @param stop - The stopping value for the range, exclusive.
 *
 * @param step - The non-zero distance between each value.
 *
 * @returns The number of steps need to traverse the range.
 */
function rangeLength(start: number, stop: number, step: number): number {
  if (start > stop && step > 0) {
    return 0;
  }
  if (start < stop && step < 0) {
    return 0;
  }
  return Math.ceil((stop - start) / step);
}
