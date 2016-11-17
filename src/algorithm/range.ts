/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISequence, SequenceIterator
} from './sequence';


/**
 * Create a range of evenly spaced values.
 *
 * @param start - The starting value for the range, inclusive.
 *
 * @param stop - The stopping value for the range, exclusive.
 *
 * @param step - The distance between each value.
 *
 * @returns A range object which produces evenly spaced values.
 *
 * #### Notes
 * In the single argument form of `range(stop)`, `start` defaults to
 * `0` and `step` defaults to `1`.
 *
 * In the two argument form of `range(start, stop)`, `step` defaults
 * to `1`.
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
    this.start = start;
    this.stop = stop;
    this.step = step;
    this.length = Private.rangeLength(start, stop, step);
  }

  /**
   * The starting value for the range, inclusive.
   */
  readonly start: number;

  /**
   * The stopping value for the range, exclusive.
   */
  readonly stop: number;

  /**
   * The distance between each value.
   */
  readonly step: number;

  /**
   * The number of values in the range.
   */
  readonly length: number;

  /**
   * Create an iterator over the range of values.
   *
   * @returns A new iterator for the range of values.
   */
  iter(): SequenceIterator<number> {
    return new SequenceIterator<number>(this);
  }

  /**
   * Get the value at the specified index.
   *
   * @param index - The index of interest.
   *
   * @returns The value at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is negative, non-integral, or out of range.
   */
  at(index: number): number {
    return this.start + this.step * index;
  }
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
