/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike, each
} from '../algorithm/iteration';


/**
 * An object which implements the disposable pattern.
 */
export
interface IDisposable {
  /**
   * Test whether the object has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  isDisposed: boolean;

  /**
   * Dispose of the resources held by the object.
   *
   * #### Notes
   * It is generally unsafe to use the object after it is disposed.
   *
   * If the object's `dispose` method is called more than once, all
   * calls made after the first will be a no-op.
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
   * @param callback - The function to invoke on dispose.
   */
  constructor(callback: () => void) {
    this._callback = callback || null;
  }

  /**
   * Test whether the delegate has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return this._callback === null;
  }

  /**
   * Dispose of the delegate and invoke the callback function.
   *
   * #### Notes
   * All calls to this method after the first will be a no-op.
   */
  dispose(): void {
    if (this._callback === null) {
      return;
    }
    let callback = this._callback;
    this._callback = null;
    callback();
  }

  private _callback: () => void;
}


/**
 * An object which manages a collection of disposable items.
 */
export
class DisposableSet implements IDisposable {
  /**
   * Construct a new disposable set.
   *
   * @param items - The initial disposable items.
   */
  constructor(items?: IterableOrArrayLike<IDisposable>) {
    if (items) each(items, item => { this._set.add(item); });
  }

  /**
   * Test whether the set has been disposed.
   *
   * #### Notes
   * This is a read-only property which is always safe to access.
   */
  get isDisposed(): boolean {
    return this._set === null;
  }

  /**
   * Dispose of the set and the disposable items it contains.
   *
   * #### Notes
   * Items are disposed in the order they are added to the set.
   *
   * It is unsafe to use the set after it has been disposed.
   *
   * All calls to this method after the first will be a no-op.
   */
  dispose(): void {
    if (this._set === null) {
      return;
    }
    let set = this._set;
    this._set = null;
    set.forEach(item => { item.dispose(); });
  }

  /**
   * Add a disposable item to the set.
   *
   * @param item - The disposable item to add to the set. If the item
   *   is already contained in the set, this is a no-op.
   *
   * @throws An error if the set has been disposed.
   */
  add(item: IDisposable): void {
    if (this._set === null) {
      throw new Error('Object is disposed');
    }
    this._set.add(item);
  }

  /**
   * Remove a disposable item from the set.
   *
   * @param item - The disposable item to remove from the set. If the
   *   item does not exist in the set, this is a no-op.
   *
   * @throws An error if the set has been disposed.
   */
  remove(item: IDisposable): void {
    if (this._set === null) {
      throw new Error('Object is disposed');
    }
    this._set.delete(item);
  }

  /**
   * Remove all disposable items from the set.
   *
   * @throws An error if the set has been disposed.
   */
  clear(): void {
    if (this._set === null) {
      throw new Error('Object is disposed');
    }
    this._set.clear();
  }

  private _set = new Set<IDisposable>();
}
