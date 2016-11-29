/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayIterator, IIterable, IIterator
} from './iterable';


/**
 * A sequence of indexable values.
 */
export
interface ISequence<T> extends IIterable<T> {
  /**
   * The length of the sequence.
   */
  readonly length: number;

  /**
   * Get the value at a specific index.
   *
   * @param index - The index of interest.
   *
   * @returns The value at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is negative, non-integral, or out of range.
   */
  at(index: number): T;
}


/**
 * A sequence which allows mutation of the underlying values.
 */
export
interface IMutableSequence<T> extends ISequence<T> {
  /**
   * Set the value at a specific index.
   *
   * @param index - The index of interest.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Undefined Behavior
   *  An `index` which is negative, non-integral, or out of range.
   */
  set(index: number, value: T): void;
}


/**
 * A type alias for a sequence or builtin array-like object.
 */
export
type SequenceOrArrayLike<T> = ISequence<T> | ArrayLike<T>;


/**
 * A type alias for a mutable sequence or builtin array object.
 */
export
type MutableSequenceOrArray<T> = IMutableSequence<T> | Array<T>;


/**
 * Cast a sequence or array-like object to a sequence.
 *
 * @param object - The sequence or array-like object of interest.
 *
 * @returns A sequence for the given object.
 *
 * #### Notes
 * This function allows sequence algorithms to operate on user-defined
 * sequence types and builtin array-like objects in a uniform fashion.
 */
export
function sequence<T>(object: SequenceOrArrayLike<T>): ISequence<T> {
  let seq: ISequence<T>;
  if (typeof (object as any).at === 'function') {
    seq = object as ISequence<T>;
  } else {
    seq = new ArraySequence<T>(object as ArrayLike<T>);
  }
  return seq;
}


/**
 * Cast a mutable sequence or array object to a mutable sequence.
 *
 * @param object - The mutable sequence or array object of interest.
 *
 * @returns A mutable sequence for the given object.
 *
 * #### Notes
 * This function allows sequence algorithms to operate on user-defined
 * sequence types and builtin array objects in a uniform fashion.
 */
export
function mutableSequence<T>(object: MutableSequenceOrArray<T>): IMutableSequence<T> {
  let seq: IMutableSequence<T>;
  if (typeof (object as any).set === 'function') {
    seq = object as IMutableSequence<T>;
  } else {
    seq = new MutableArraySequence<T>(object as Array<T>);
  }
  return seq;
}


/**
 * A sequence for a builtin JS array-like object.
 */
export
class ArraySequence<T> implements ISequence<T> {
  /**
   * Construct a new array sequence.
   *
   * @param source - The array-like object of interest.
   */
  constructor(source: ArrayLike<T>) {
    this._source = source;
  }

  /**
   * The length of the sequence.
   */
  get length(): number {
    return this._source.length;
  }

  /**
   * Get an iterator over the object's values.
   *
   * @returns An iterator which yields the object's values.
   */
  iter(): IIterator<T> {
    return new ArrayIterator<T>(this._source);
  }

  /**
   * Get the value at the specified index.
   *
   * @param index - The index of interest.
   *
   * @returns The value at the specified index, or `undefined`
   *   if the index is negative, non-integral, or out of range.
   */
  at(index: number): T {
    return this._source[index];
  }

  protected _source: ArrayLike<T>;
}


/**
 * A mutable sequence for a builtin JS array object.
 */
export
class MutableArraySequence<T> extends ArraySequence<T> implements IMutableSequence<T> {
  /**
   * Construct a new mutable array sequence.
   *
   * @param source - The array object of interest.
   */
  constructor(source: Array<T>) {
    super(source);
  }

  /**
   * Set the value at the specified index.
   *
   * @param index - The positive integer index of interest.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is negative, non-integral, or out of range.
   */
  set(index: number, value: T): void {
    this._source[index] = value;
  }

  protected _source: Array<T>;
}


/**
 * An iterator for a generic sequence.
 */
export
class SequenceIterator<T> implements IIterator<T> {
  /**
   * Construct a new sequence iterator.
   *
   * @param source - The sequence of interest.
   */
  constructor(source: ISequence<T>) {
    this._source = source;
  }

  /**
   * Get an iterator over the object's values.
   *
   * @returns An iterator which yields the object's values.
   */
  iter(): IIterator<T> {
    return this;
  }

  /**
   * Create an independent clone of the iterator.
   *
   * @returns A new independent clone of the iterator.
   */
  clone(): IIterator<T> {
    let result = new SequenceIterator<T>(this._source);
    result._index = this._index;
    return result;
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined`.
   */
  next(): T | undefined {
    if (this._index >= this._source.length) {
      return undefined;
    }
    return this._source.at(this._index++);
  }

  private _index = 0;
  private _source: ISequence<T>;
}
