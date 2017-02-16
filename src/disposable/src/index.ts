/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike, each
} from '@phosphor/algorithm';


/**
 * An object which implements the disposable pattern.
 */
export
interface IDisposable {
  /**
   * Test whether the object has been disposed.
   *
   * #### Notes
   * This property is always safe to access.
   */
  readonly isDisposed: boolean;

  /**
   * Dispose of the resources held by the object.
   *
   * #### Notes
   * If the object's `dispose` method is called more than once, all
   * calls made after the first will be a no-op.
   *
   * #### Undefined Behavior
   * It is undefined behavior to use any functionality of the object
   * after it has been disposed unless otherwise explicitly noted.
   */
  dispose(): void;
}


/**
 * A disposable object which delegates to a callback function.
 */
export
class DisposableDelegate implements IDisposable {
  /**
   * Construct a new disposable delegate.
   *
   * @param fn - The callback function to invoke on dispose.
   */
  constructor(fn: () => void) {
    this._fn = fn;
  }

  /**
   * Test whether the delegate has been disposed.
   */
  get isDisposed(): boolean {
    return !this._fn;
  }

  /**
   * Dispose of the delegate and invoke the callback function.
   */
  dispose(): void {
    if (!this._fn) {
      return;
    }
    let fn = this._fn;
    this._fn = null;
    fn();
  }

  private _fn: (() => void) | null;
}


/**
 * An object which manages a collection of disposable items.
 */
export
class DisposableSet implements IDisposable {
  /**
   * Construct a new disposable set.
   */
  constructor() { }

  /**
   * Test whether the set has been disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose of the set and the items it contains.
   *
   * #### Notes
   * Items are disposed in the order they are added to the set.
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }
    this._disposed = true;
    this._items.forEach(item => { item.dispose(); });
    this._items.clear();
  }

  /**
   * Test whether the set contains a specific item.
   *
   * @param item - The item of interest.
   *
   * @returns `true` if the set contains the item, `false` otherwise.
   */
  contains(item: IDisposable): boolean {
    return this._items.has(item);
  }

  /**
   * Add a disposable item to the set.
   *
   * @param item - The item to add to the set.
   *
   * #### Notes
   * If the item is already contained in the set, this is a no-op.
   */
  add(item: IDisposable): void {
    this._items.add(item);
  }

  /**
   * Remove a disposable item from the set.
   *
   * @param item - The item to remove from the set.
   *
   * #### Notes
   * If the item is not contained in the set, this is a no-op.
   */
  remove(item: IDisposable): void {
    this._items.delete(item);
  }

  /**
   * Remove all items from the set.
   */
  clear(): void {
    this._items.clear();
  }

  private _disposed = false;
  private _items = new Set<IDisposable>();
}


/**
 * The namespace for the `DisposableSet` class statics.
 */
export
namespace DisposableSet {
  /**
   * Create a disposable set from an iterable of items.
   *
   * @param items - The iterable or array-like object of interest.
   *
   * @returns A new disposable initialized with the given items.
   */
  export
  function from(items: IterableOrArrayLike<IDisposable>): DisposableSet {
    let set = new DisposableSet();
    each(items, item => { set.add(item) });
    return set;
  }
}
