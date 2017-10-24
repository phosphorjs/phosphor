/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';


/**
 * A data store object which holds a sequence of values.
 */
export
interface IList<T extends ReadonlyJSONValue> extends IIterable<T>, IRetroable<T> {
  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the list.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * The first value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Logarithmic.
   */
  first(): T | undefined;

  /**
   * The last value in the list or `undefined` if the list is empty.
   *
   * #### Complexity
   * Logarithmic.
   */
  last(): T | undefined;

  /**
   * Get the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @returns The value at the specified index or `undefined` if the
   *   index is out of range.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  get(index: number): T | undefined;

  /**
   * Get an array for a portion of the list.
   *
   * @param start - The index of the first element to slice, inclusive.
   *   The default value is `0`. Negative values are taken as an offset
   *   from the end of the list.
   *
   * @param stop - The index of the last element to slice, exclusive.
   *   The default value is `list.length`. Negative values are taken
   *   as an offset from the end of the list.
   *
   * @returns A new array for the specified portion of the list.
   *
   * #### Notes
   * If `start > stop`, the values will be in reverse order.
   *
   * #### Complexity
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  slice(start?: number, stop?: number): T[];

  /**
   * Get an iterator over a portion of the list.
   *
   * @param start - The index of the first element to slice, inclusive.
   *   The default value is `0`. Negative values are taken as an offset
   *   from the end of the list.
   *
   * @param stop - The index of the last element to slice, exclusive.
   *   The default value is `list.length`. Negative values are taken
   *   as an offset from the end of the list.
   *
   * #### Notes
   * If `start > stop`, the values will be in reverse order.
   *
   * @returns A new iterator over the specified portion of the list.
   *
   * #### Complexity
   * Constant.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  islice(start?: number, stop?: number): IIterator<T>;

  /**
   * Set the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the list.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Notes
   * This method is a no-op if `index` is out of range.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  set(index: number, value: T): void;

  /**
   * Assign new values to the list, replacing the current content.
   *
   * @param values - The values to assign to the list.
   *
   * #### Complexity
   * Linear.
   */
  assign(values: IterableOrArrayLike<T>): void;

  /**
   * Add a value to the end of the list.
   *
   * @param value - The value to add to the list.
   *
   * #### Complexity
   * Logarithmic.
   */
  push(value: T): void;

  /**
   * Insert a value into the list.
   *
   * @param index - The index at which to insert the value. Negative
   *   values are taken as an offset from the end of the list.
   *
   * @param value - The value to insert at the specified index.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  insert(index: number, value: T): void;

  /**
   * Remove a value from the list.
   *
   * @param index - The index of the value to remove. Negative
   *   values are taken as an offset from the end of the list.
   *
   * #### Notes
   * This method is a no-op if `index` is out of range.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  remove(index: number): void;

  /**
   * Replace a range of values in the list.
   *
   * @param index - The index of the first element to be removed.
   *   Negative values are taken as an offset from the end of the list.
   *
   * @param count - The number of elements to remove.
   *
   * @param values - The values to insert at the specified index.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, values?: IterableOrArrayLike<T>): void;

  /**
   * Clear all values from the list.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}


/**
 * A data store object which maps keys to values.
 */
export
interface IMap<T extends ReadonlyJSONValue> extends IIterable<[string, T]> {
  /**
   * Whether the map is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The size of the map.
   *
   * #### Complexity
   * Constant.
   */
  readonly size: number;

  /**
   * Create an iterator over the keys in the map.
   *
   * @returns A new iterator over the keys in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  keys(): IIterator<string>;

  /**
   * Create an iterator over the values in the map.
   *
   * @returns A new iterator over the values in the map.
   *
   * #### Notes
   * The order of iteration is undefined.
   *
   * #### Complexity
   * Constant.
   */
  values(): IIterator<T>;

  /**
   * Test whether the map has a particular key.
   *
   * @param key - The key of interest.
   *
   * @returns `true` if the map has the given key, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   */
  has(key: string): boolean;

  /**
   * Get the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @returns The key value or `undefined` if the key is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(key: string): T | undefined;

  /**
   * Set the value for a particular key in the map.
   *
   * @param key - The key of interest.
   *
   * @param value - The value to set for the given key.
   *
   * #### Complexity
   * Constant.
   */
  set(key: string, value: T): void;

  /**
   * Assign new items to the map, replacing the current content.
   *
   * @param items - The items to add to the list.
   *
   * #### Complexity
   * Linear.
   */
  assign(items: { readonly [key: string]: T }): void;

  /**
   * Update the map with items from an object.
   *
   * @param items - The items to add to the map.
   *
   * #### Complexity
   * Linear.
   */
  update(items: { readonly [key: string]: T }): void;

  /**
   * Delete one or more items from the map.
   *
   * @param key - The key(s) of the item(s) to delete from the map.
   *
   * #### Complexity
   * Constant.
   */
  delete(key: string | IterableOrArrayLike<string>): void;

  /**
   * Clear all items from the map.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}


/**
 * A data store object which holds text.
 */
export
interface IText {
  /**
   * Whether the text is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The length of the text.
   *
   * #### Complexity
   * Constant.
   */
  readonly length: number;

  /**
   * Get the character at a specific index.
   *
   * @param index - The index of the character of interest. Negative
   *   values are taken as an offset from the end of the text.
   *
   * @returns The character at the specified index.
   *
   * #### Complexity
   * Logarithmic.
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
   * Linear.
   *
   * #### Undefined Behavior
   * A `start` or `stop` which is non-integral.
   */
  slice(start?: number, stop?: number): string;

  /**
   * Assign a new value to the text, replacing the current content.
   *
   * @param value - The value to assign to the text.
   *
   * #### Complexity
   * Linear.
   */
  assign(value: string): void;

  /**
   * Append a value to the end of the text.
   *
   * @param value - The value(s) to append to the text.
   *
   * #### Complexity
   * Logarithmic.
   */
  append(value: string): void;

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
   * @param value - The value(s) to insert at the specified index.
   *
   * #### Complexity
   * Logarithmic.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   */
  splice(index: number, count: number, value?: string): void;

  /**
   * Clear the text value.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}
