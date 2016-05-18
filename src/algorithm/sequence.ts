/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayIterator, IArrayLike, IIterable
} from './iteration';


/**
 * A finite-length sequence of indexable values.
 */
export
interface ISequence<T> extends IIterable<T> {
  /**
   * The length of the sequence.
   *
   * #### Notes
   * This is a read-only property.
   */
  length: number;

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
  at(index: number): T;
}


/**
 * A sequence which allows mutation of the underlying values.
 */
export
interface IMutableSequence<T> extends ISequence<T> {
  /**
   * Set the value at the specified index.
   *
   * @param index - The positive integer index of interest.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral or out of range.
   */
  set(index: number, value: T): void;
}


/**
 * A type alias for a sequence or builtin array-like object.
 *
 * #### Notes
 * The [[seq]] function can be used to produce an [[ISequence]] for
 * objects of this type. This allows sequence algorithms to operate
 * on these objects in a uniform fashion.
 */
export
type SequenceOrArrayLike<T> = ISequence<T> | IArrayLike<T>;


/**
 * A type alias for a mutable sequence or builtin array-like object.
 *
 * #### Notes
 * The [[mseq]] function can be used to produce an [[IMutableSequence]]
 * for objects of this type. This allows sequence algorithms to operate
 * on these objects in a uniform fashion.
 */
export
type MutableSequenceOrArrayLike<T> = IMutableSequence<T> | IArrayLike<T>;


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
function asSequence<T>(object: SequenceOrArrayLike<T>): ISequence<T> {
  let seq: ISequence<T>;
  if (typeof (object as any).at === 'function') {
    seq = object as ISequence<T>;
  } else {
    seq = new ArraySequence(object as IArrayLike<T>);
  }
  return seq;
}


/**
 * Cast a mutable sequence or array-like object to a mutable sequence.
 *
 * @param object - The sequence or array-like object of interest.
 *
 * @returns A mutable sequence for the given object.
 *
 * #### Notes
 * This function allows sequence algorithms to operate on user-defined
 * sequence types and builtin array-like objects in a uniform fashion.
 */
export
function asMutableSequence<T>(object: MutableSequenceOrArrayLike<T>): IMutableSequence<T> {
  let seq: IMutableSequence<T>;
  if (typeof (object as any).set === 'function') {
    seq = object as IMutableSequence<T>;
  } else {
    seq = new MutableArraySequence(object as IArrayLike<T>);
  }
  return seq;
}


/**
 * A sequence for an array-like object.
 *
 * #### Notes
 * This sequence can be used for any builtin JS array-like object.
 */
export
class ArraySequence<T> implements ISequence<T> {
  /**
   * Construct a new array sequence.
   *
   * @param source - The array-like object of interest.
   */
  constructor(source: IArrayLike<T>) {
    this._source = source;
  }

  /**
   * The length of the sequence.
   *
   * #### Notes
   * This is a read-only property.
   */
  get length(): number {
    return this._source.length;
  }

  /**
   * Create an iterator over the object's values.
   *
   * @returns A new iterator which traverses the object's values.
   */
  iter(): ArrayIterator<T> {
    return new ArrayIterator(this._source, 0);
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
  at(index: number): T {
    return this._source[index];
  }

  protected _source: IArrayLike<T>;
}


/**
 * A sequence for a mutable array-like object.
 *
 * #### Notes
 * This sequence can be used for any builtin JS array-like object.
 */
export
class MutableArraySequence<T> extends ArraySequence<T> implements IMutableSequence<T> {
  /**
   * Set the value at the specified index.
   *
   * @param index - The positive integer index of interest.
   *
   * @param value - The value to set at the specified index.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral or out of range.
   */
  set(index: number, value: T): void {
    this._source[index] = value;
  }
}
