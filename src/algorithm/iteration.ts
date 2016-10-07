/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * An object which can produce an iterator over its values.
 */
export
interface IIterable<T> {
  /**
   * Create an iterator over the object's values.
   *
   * @returns A new iterator which traverses the object's values.
   */
  iter(): IIterator<T>;
}


/**
 * An object which traverses a collection of values.
 *
 * #### Notes
 * For the convenience of API implementors, an iterator itself is an
 * iterable. Most concrete iterators will simply return `this` from
 * their `iter()` method.
 */
export
interface IIterator<T> extends IIterable<T> {
  /**
   * Create an independent clone of the iterator.
   *
   * @returns A new independent clone of the iterator.
   *
   * #### Notes
   * The cloned iterator can be consumed independently of the current
   * iterator. In essence, it is a copy of the iterator value stream
   * which starts at the current location. This can be useful for
   * lookahead and stream duplication.
   *
   * Most iterators can trivially support cloning. Those which cannot
   * should throw an exception and document the restriction.
   */
  clone(): IIterator<T>;

  /**
   * Get the next value in the collection.
   *
   * @returns The next value in the collection, or `undefined` if the
   *   iterator is exhausted.
   *
   * #### Notes
   * The `undefined` value is used to signal the end of iteration and
   * should therefore not be used as a value in a collection.
   *
   * The use of the `undefined` sentinel is an explicit design choice
   * which favors performance over purity. The ES6 iterator design of
   * returning a `{ value, done }` pair is suboptimal, as it requires
   * an object allocation on each iteration; and an `isDone()` method
   * increases implementation and runtime complexity.
   */
  next(): T;
}


/**
 * An object which behaves like an array for property access.
 *
 * #### Notes
 * This interface represents the builtin JS array-like objects.
 */
export
interface IArrayLike<T> {
  /**
   * The length of the object.
   */
  length: number;

  /**
   * The index-based property accessor.
   */
  [index: number]: T;
}


/**
 * A type alias for an iterable or builtin array-like object.
 *
 * #### Notes
 * The [[iter]] function can be used to produce an [[IIterator]] for
 * objects of this type. This allows iteration algorithms to operate
 * on these objects in a uniform fashion.
 */
export
type IterableOrArrayLike<T> = IIterable<T> | IArrayLike<T>;


/**
 * Create an iterator for an iterable or array-like object.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @returns A new iterator for the given object.
 *
 * #### Notes
 * This function allows iteration algorithms to operate on user-defined
 * iterable types and builtin array-like objects in a uniform fashion.
 */
export
function iter<T>(object: IterableOrArrayLike<T>): IIterator<T> {
  let it: IIterator<T>;
  if (typeof (object as any).iter === 'function') {
    it = (object as IIterable<T>).iter();
  } else {
    it = new ArrayIterator(object as IArrayLike<T>, 0);
  }
  return it;
}


/**
 * Create an array from an iterable of values.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @returns A new array of values from the given object.
 */
export
function toArray<T>(object: IterableOrArrayLike<T>): T[] {
  let value: T;
  let result: T[] = [];
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    result[result.length] = value;
  }
  return result;
}


/**
 * Create an empty iterator.
 *
 * @returns A new iterator which yields nothing.
 */
export
function empty<T>(): EmptyIterator<T> {
  return new EmptyIterator<T>();
}


/**
 * An iterator which is always empty.
 */
export
class EmptyIterator<T> implements IIterator<T> {
  /**
   * Construct a new empty iterator.
   */
  constructor() { }

  /**
   * Create an iterator over the object's values.
   *
   * @returns A reference to `this` iterator.
   */
  iter(): this {
    return this;
  }

  /**
   * Create an independent clone of the current iterator.
   *
   * @returns A new independent clone of the current iterator.
   */
  clone(): EmptyIterator<T> {
    return new EmptyIterator<T>();
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns Always `undefined`.
   */
  next(): T {
    return void 0;
  }
}


/**
 * An iterator for an array-like object.
 *
 * #### Notes
 * This iterator can be used for any builtin JS array-like object.
 */
export
class ArrayIterator<T> implements IIterator<T> {
  /**
   * Construct a new array iterator.
   *
   * @param source - The array-like object of interest.
   *
   * @param start - The starting index for iteration.
   */
  constructor(source: IArrayLike<T>, start: number) {
    this._source = source;
    this._index = start;
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
   * Create an independent clone of the current iterator.
   *
   * @returns A new independent clone of the current iterator.
   *
   * #### Notes
   * The source array is shared among clones.
   */
  clone(): ArrayIterator<T> {
    return new ArrayIterator<T>(this._source, this._index);
  }

  /**
   * Get the next value from the source array.
   *
   * @returns The next value from the source array, or `undefined`
   *   if the iterator is exhausted.
   */
  next(): T {
    if (this._index >= this._source.length) {
      return void 0;
    }
    return this._source[this._index++];
  }

  private _source: IArrayLike<T>;
  private _index: number;
}


/**
 * Invoke a function for each value in an iterable.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The callback function to invoke for each value.
 *
 * #### Notes
 * Iteration cannot be terminated early.
 */
export
function each<T>(object: IterableOrArrayLike<T>, fn: (value: T) => void): void {
  let value: T;
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    fn(value);
  }
}


/**
 * Test whether all values in an iterable satisfy a predicate.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns `true` if all values pass the test, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first `false` predicate result.
 */
export
function every<T>(object: IterableOrArrayLike<T>, fn: (value: T) => boolean): boolean {
  let value: T;
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    if (!fn(value)) return false;
  }
  return true;
}


/**
 * Test whether any value in an iterable satisfies a predicate.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns `true` if any value passes the test, `false` otherwise.
 *
 * #### Notes
 * Iteration terminates on the first `true` predicate result.
 */
export
function some<T>(object: IterableOrArrayLike<T>, fn: (value: T) => boolean): boolean {
  let value: T;
  let it = iter(object);
  while ((value = it.next()) !== void 0) {
    if (fn(value)) return true;
  }
  return false;
}


/**
 * Summarize all values in an iterable using a reducer function.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The reducer function to invoke for each value.
 *
 * @param initial - The initial value for the accumulator.
 *
 * @returns The final accumulated value.
 *
 * #### Notes
 * The `reduce` function follows the conventions of `Array#reduce`.
 *
 * If the iterator is empty, an initial value is required. That value
 * will be used as the return value. If no initial value is provided,
 * an error will be thrown.
 *
 * If the iterator contains a single item and no initial value is
 * provided, the single item is used as the return value.
 *
 * Otherwise, the reducer is invoked for each element in the iterable.
 * If an initial value is not provided, the first element will be used
 * as the initial accumulator value.
 */
export
function reduce<T>(object: IterableOrArrayLike<T>, fn: (accumulator: T, value: T) => T): T;
export
function reduce<T, U>(object: IterableOrArrayLike<T>, fn: (accumulator: U, value: T) => U, initial: U): U;
export
function reduce<T>(object: IterableOrArrayLike<T>, fn: (accumulator: any, value: T) => any, initial?: any): any {
  // Setup the iterator and fetch the first value.
  let it = iter(object);
  let first = it.next();

  // An empty iterator and no initial value is an error.
  if (first === void 0 && initial === void 0) {
    throw new TypeError('Reduce of empty iterable with no initial value.');
  }

  // If the iterator is empty, return the initial value.
  if (first === void 0) {
    return initial;
  }

  // If the iterator has a single item and no initial value, the
  // reducer is not invoked and the first item is the return value.
  let second = it.next();
  if (second === void 0 && initial === void 0) {
    return first;
  }

  // If iterator has a single item and an initial value is provided,
  // the reducer is invoked and that result is the return value.
  if (second === void 0) {
    return fn(initial, first);
  }

  // Setup the initial accumulator value.
  let accumulator: any;
  if (initial === void 0) {
    accumulator = fn(first, second);
  } else {
    accumulator = fn(fn(initial, first), second);
  }

  // Iterate the rest of the values, updating the accumulator.
  let next: T;
  while ((next = it.next()) !== void 0) {
    accumulator = fn(accumulator, next);
  }

  // Return the final accumulated value.
  return accumulator;
}


/**
 * Filter an iterable for values which pass a test.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The predicate function to invoke for each value.
 *
 * @returns An iterator which yields the values which pass the test.
 */
export
function filter<T>(object: IterableOrArrayLike<T>, fn: (value: T) => boolean): FilterIterator<T> {
  return new FilterIterator<T>(iter(object), fn);
}


/**
 * An iterator which yields values which pass a test.
 */
export
class FilterIterator<T> implements IIterator<T> {
  /**
   * Construct a new filter iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param fn - The predicate function to invoke for each value in
   *   the iterator. It returns whether the value passes the test.
   */
  constructor(source: IIterator<T>, fn: (value: T) => boolean) {
    this._source = source;
    this._fn = fn;
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
   * Create an independent clone of the current iterator.
   *
   * @returns A new independent clone of the current iterator.
   *
   * #### Notes
   * The source iterator must be cloneable.
   *
   * The predicate function is shared among clones.
   */
  clone(): FilterIterator<T> {
    return new FilterIterator<T>(this._source.clone(), this._fn);
  }

  /**
   * Get the next value which passes the test.
   *
   * @returns The next value from the source iterator which passes
   *   the predicate, or `undefined` if the iterator is exhausted.
   */
  next(): T {
    let value: T;
    let fn = this._fn;
    let it = this._source;
    while ((value = it.next()) !== void 0) {
      if (fn(value)) return value;
    }
    return void 0;
  }

  private _source: IIterator<T>;
  private _fn: (value: T) => boolean;
}


/**
 * Transform the values of an iterable with a mapping function.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param fn - The mapping function to invoke for each value.
 *
 * @returns An iterator which yields the transformed values.
 */
export
function map<T, U>(object: IterableOrArrayLike<T>, fn: (value: T) => U): MapIterator<T, U> {
  return new MapIterator<T, U>(iter(object), fn);
}


/**
 * An iterator which transforms values using a mapping function.
 */
export
class MapIterator<T, U> implements IIterator<U> {
  /**
   * Construct a new map iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param fn - The mapping function to invoke for each value in the
   *   iterator. It returns the transformed value.
   */
  constructor(source: IIterator<T>, fn: (value: T) => U) {
    this._source = source;
    this._fn = fn;
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
   * Create an independent clone of the current iterator.
   *
   * @returns A new independent clone of the current iterator.
   *
   * #### Notes
   * The source iterator must be cloneable.
   *
   * The mapping function is shared among clones.
   */
  clone(): MapIterator<T, U> {
    return new MapIterator<T, U>(this._source.clone(), this._fn);
  }

  /**
   * Get the next mapped value from the source iterator.
   *
   * @returns The next value from the source iterator transformed
   *   by the mapper, or `undefined` if the iterator is exhausted.
   */
  next(): U {
    let value = this._source.next();
    if (value === void 0) {
      return void 0;
    }
    return this._fn.call(void 0, value);
  }

  private _source: IIterator<T>;
  private _fn: (value: T) => U;
}


/**
 * Attach an incremental index to an iterable.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param start - The initial value of the index. The default is zero.
 *
 * @returns An iterator which yields `[index, value]` tuples.
 */
export
function enumerate<T>(object: IterableOrArrayLike<T>, start = 0): EnumerateIterator<T> {
  return new EnumerateIterator<T>(iter(object), start);
}


/**
 * An iterator which attaches an incremental index to a source.
 */
export
class EnumerateIterator<T> implements IIterator<[number, T]> {
  /**
   * Construct a new enumerate iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param start - The initial value of the index.
   */
  constructor(source: IIterator<T>, start: number) {
    this._source = source;
    this._index = start;
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
   * Create an independent clone of the enumerate iterator.
   *
   * @returns A new iterator starting with the current value.
   *
   * #### Notes
   * The source iterator must be cloneable.
   */
  clone(): EnumerateIterator<T> {
    return new EnumerateIterator<T>(this._source.clone(), this._index);
  }

  /**
   * Get the next value from the enumeration.
   *
   * @returns The next value from the enumeration, or `undefined` if
   *   the iterator is exhausted.
   */
  next(): [number, T] {
    let value = this._source.next();
    if (value === void 0) {
      return void 0;
    }
    return [this._index++, value];
  }

  private _source: IIterator<T>;
  private _index: number;
}


/**
 * Create an iterator which repeats a value a number of times.
 *
 * @param value - The value to repeat.
 *
 * @param count - The number of times to repeat the value.
 *
 * @returns A new iterator which repeats the specified value.
 */
export
function repeat<T>(value: T, count: number): RepeatIterator<T> {
  return new RepeatIterator<T>(value, count);
}


/**
 * An iterator which repeats a value a specified number of times.
 */
export
class RepeatIterator<T> implements IIterator<T> {
  /**
   * Construct a new repeat iterator.
   *
   * @param value - The value to repeat.
   *
   * @param count - The number of times to repeat the value.
   */
  constructor(value: T, count: number) {
    this._value = value;
    this._count = count;
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
   * Create an independent clone of the repeat iterator.
   *
   * @returns A new iterator starting with the current value.
   */
  clone(): RepeatIterator<T> {
    return new RepeatIterator(this._value, this._count);
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined` if
   *   the iterator is exhausted.
   */
  next(): T {
    if (this._count <= 0) {
      return void 0;
    }
    this._count--;
    return this._value;
  }

  private _value: T;
  private _count: number;
}


/**
 * Chain together several iterables.
 *
 * @param objects - The iterables or array-like objects of interest.
 *
 * @returns An iterator which yields the values of the given iterables
 *   in the order in which they are supplied.
 */
export
function chain<T>(...objects: IterableOrArrayLike<T>[]): ChainIterator<T> {
  return new ChainIterator<T>(map(objects, iter));
}


/**
 * An iterator which chains together several iterators.
 */
export
class ChainIterator<T> implements IIterator<T> {
  /**
   * Construct a new chain iterator.
   *
   * @param source - The iterator of iterators of interest.
   */
  constructor(source: IIterator<IIterator<T>>) {
    this._source = source;
    this._active = void 0;
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
   * Create an independent clone of the chain iterator.
   *
   * @returns A new iterator starting with the current value.
   *
   * #### Notes
   * The source iterators must be cloneable.
   */
  clone(): ChainIterator<T> {
    let result = new ChainIterator(this._source.clone());
    if (this._active) result._active = this._active.clone();
    return result;
  }

  /**
   * Get the next value from the iterator.
   *
   * @returns The next value from the iterator, or `undefined` when
   *   all source iterators are exhausted.
   */
  next(): T {
    if (this._active === void 0) {
      this._active = this._source.next();
      if (this._active === void 0) {
        return void 0;
      }
    }
    let value = this._active.next();
    if (value !== void 0) {
      return value;
    }
    this._active = void 0;
    return this.next();
  }

  private _source: IIterator<IIterator<T>>;
  private _active: IIterator<T>;
}


/**
 * Iterate several iterables in lockstep.
 *
 * @param objects - The iterables or array-like objects of interest.
 *
 * @returns An iterator which yields successive tuples of values where
 *   each value is taken in turn from the provided iterables. It will
 *   be as long as the shortest provided iterable.
 */
export
function zip<T>(...objects: IterableOrArrayLike<T>[]): ZipIterator<T> {
  return new ZipIterator<T>(objects.map(iter));
}


/**
 * An iterator which iterates several sources in lockstep.
 */
export
class ZipIterator<T> implements IIterator<T[]> {
  /**
   * Construct a new zip iterator.
   *
   * @param source - The iterators of interest.
   */
  constructor(source: IIterator<T>[]) {
    this._source = source;
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
   * Create an independent clone of the zip iterator.
   *
   * @returns A new iterator starting with the current value.
   *
   * #### Notes
   * The source iterators must be cloneable.
   */
  clone(): ZipIterator<T> {
    return new ZipIterator<T>(this._source.map(it => it.clone()));
  }

  /**
   * Get the next zipped value from the iterator.
   *
   * @returns The next zipped value from the iterator, or `undefined`
   *   when the first source iterator is exhausted.
   */
  next(): T[] {
    let iters = this._source;
    let result = new Array<T>(iters.length);
    for (let i = 0, n = iters.length; i < n; ++i) {
      let value = iters[i].next();
      if (value === void 0) {
        return void 0;
      }
      result[i] = value;
    }
    return result;
  }

  private _source: IIterator<T>[];
}


/**
 * Iterate over an iterable using a stepped increment.
 *
 * @param object - The iterable or array-like object of interest.
 *
 * @param step - The distance to step on each iteration. A value
 *   of less than `1` will behave the same as a value of `1`.
 *
 * @returns An iterator which traverses the iterable step-wise.
 */
export
function stride<T>(object: IterableOrArrayLike<T>, step: number): StrideIterator<T> {
  return new StrideIterator<T>(iter(object), step);
}


/**
 * An iterator which traverses a source iterator step-wise.
 */
export
class StrideIterator<T> implements IIterator<T> {
  /**
   * Construct a new stride iterator.
   *
   * @param source - The iterator of values of interest.
   *
   * @param step - The distance to step on each iteration. A value
   *   of less than `1` will behave the same as a value of `1`.
   */
  constructor(source: IIterator<T>, step: number) {
    this._source = source;
    this._step = step;
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
   * Create an independent clone of the stride iterator.
   *
   * @returns A new iterator starting with the current value.
   *
   * #### Notes
   * The source iterator must be cloneable.
   */
  clone(): StrideIterator<T> {
    return new StrideIterator<T>(this._source.clone(), this._step);
  }

  /**
   * Get the next stepped value from the iterator.
   *
   * @returns The next stepped value from the iterator, or `undefined`
   *   when the source iterator is exhausted.
   */
  next(): T {
    let value = this._source.next();
    if (value === void 0) {
      return void 0;
    }
    let step = this._step;
    while (--step > 0) {
      this._source.next();
    }
    return value;
  }

  private _source: IIterator<T>;
  private _step: number;
}
