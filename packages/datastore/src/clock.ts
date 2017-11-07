/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * A class which implements a logical clock.
 *
 * #### Notes
 * This class is used internally by the datastore as part of uniquely
 * identifying and tracking changes to various data structures.
 */
export
class LogicalClock {
  /**
   * Create a logical clock from a big-endian byte string.
   *
   * @param bytes - The big-endian byte string value for the clock.
   *
   * @returns A new logical clock with the specified value.
   */
  static fromBytes(bytes: string): LogicalClock {
    return new LogicalClock(Private.bytesToClock(bytes));
  }

  /**
   * Construct a new logical clock.
   *
   * @param value - The initial value of the clock. It should be
   *   an integer `>= 0`. The default is `0`.
   */
  constructor(value = 0) {
    this._value = Math.max(0, Math.floor(value));
  }

  /**
   * The current value of the clock.
   */
  get value(): number {
    return this._value;
  }

  /**
   * Increment the value of the clock.
   */
  increment(): void {
    this._value++;
  }

  /**
   * Get the current value of the clock as a big-endian byte string.
   *
   * @returns The big-endian byte string value of the clock.
   */
  toBytes(): string {
    return Private.clockToBytes(this._value);
  }

  private _value = 0;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Convert a clock value into a big-endian byte string.
   */
  export
  function clockToBytes(value: number): string {
    return value <= 0x7FFFFFFF ? fastBytes(value) : slowBytes(value);
  }

  /**
   * Convert a big-endian byte string into a clock value.
   */
  export
  function bytesToClock(bytes: string): number {
    return bytes.length <= 3 ? fastClock(bytes) : slowClock(bytes);
  }

  /**
   * Convert a clock value <= 0x7FFFFFFF into a big-endian byte string.
   */
  function fastBytes(value: number): string {
    if (value <= 0xFF) {
      return String.fromCharCode(value);
    }
    if (value <= 0xFFFF) {
      let a = (value >> 8) & 0xFF;
      let b = (value >> 0) & 0xFF;
      return String.fromCharCode(a, b);
    }
    if (value <= 0xFFFFFF) {
      let a = (value >> 16) & 0xFF;
      let b = (value >> 8) & 0xFF;
      let c = (value >> 0) & 0xFF;
      return String.fromCharCode(a, b, c);
    }
    let a = (value >> 24) & 0xFF;
    let b = (value >> 16) & 0xFF;
    let c = (value >> 8) & 0xFF;
    let d = (value >> 0) & 0xFF;
    return String.fromCharCode(a, b, c, d);
  }

  /**
   * Convert a length <= 3 byte string into a clock value.
   */
  function fastClock(bytes: string): number {
    if (bytes.length === 0) {
      return 0;
    }
    if (bytes.length === 1) {
      return bytes.charCodeAt(0);
    }
    if (bytes.length === 2) {
      let a = bytes.charCodeAt(0);
      let b = bytes.charCodeAt(1);
      return (a << 8) | b;
    }
    let a = bytes.charCodeAt(0);
    let b = bytes.charCodeAt(1);
    let c = bytes.charCodeAt(2);
    return (a << 16) | (b << 8) | c;
  }

  /**
   * Convert any sized clock value into a big-endian byte string.
   */
  function slowBytes(value: number): string {
    let bytes: number[] = [];
    do {
      bytes.unshift(value & 0xFF);
      value = (value - (value & 0xFF)) / 256;
    } while (value > 0);
    return String.fromCharCode(...bytes);
  }

  /**
   * Convert any length byte string into a clock value.
   */
  function slowClock(bytes: string): number {
    let value = 0;
    for (let i = 0, n = bytes.length; i < n; ++i) {
      value += bytes[i] * Math.pow(2, 8 * (n - i - 1));
    }
    return value;
  }
}
