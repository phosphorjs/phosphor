/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * A data store object which holds text.
 */
export
interface IText {
  /**
   * Whether the text is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly isEmpty: boolean;

  /**
   * The size of the text.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly size: number;

  /**
   * Get the character at a specific index.
   *
   * @param index - The index of the character of interest. Negative
   *   values are taken as an offset from the end of the text.
   *
   * @returns The character at the specified index.
   *
   * #### Complexity
   *
   */
  charAt(index: number): string;

  /**
   * Get a portion of the text as a string.
   *
   * @param start - The index of the first character, inclusive. The
   *   default value is `0`. Negative values are taken as an offset
   *   from the end of the text.
   *
   * @param stop - The index of the last character, exclusive. The
   *   default value is `text.length`. Negative values are taken
   *   as an offset from the end of the text.
   *
   * @returns A new string for the requested portion of the text.
   *
   * #### Complexity
   *
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  slice(start?: number, stop?: number): string;

  /**
   * Assign a new value to the text, replacing all current text.
   *
   * @param value - The value to assign to the text.
   *
   * #### Complexity
   *
   */
  assign(value: string): void;

  /**
   * Insert a value into the text.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the text.
   *
   * @param value - The value(s) to insert into the text.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  insert(index: number, value: string): void;

  /**
   * Replace a range of the text.
   *
   * @param index - The index of the first character to be removed.
   *   Negative values are offset from the end of the text.
   *
   * @param count - The number of characters to remove.
   *
   * @param value - The text to insert at the specified index.
   *
   * #### Complexity
   *
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, value?: string): void;

  /**
   * Clear the text value.
   *
   * #### Complexity
   *
   */
  clear(): void;
}
