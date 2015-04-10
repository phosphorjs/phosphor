/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * An object used for loosely coupled inter-object communication.
 *
 * A signal is emitted by an object in response to some event. User
 * code may connect callback functions to the signal to be notified
 * when that event occurs.
 */
export
class Signal<T, U> {
  /**
   * Construct a new signal.
   */
  constructor() { }

  /**
   * Connect a callback to the signal.
   *
   * If the callback is connected to the signal multiple times, it
   * will be invoked that many times when the signal is emitted.
   *
   * It is safe to connect the callback to the signal while the signal
   * is being emitted. The callback will not be invoked until the next
   * time the signal is emitted.
   */
  connect(callback: (sender: T, args: U) => void, thisArg?: any): void {
    var wrapper = new CBWrapper(callback, thisArg);
    var current = this._callbacks;
    if (current === null) {
      this._callbacks = wrapper;
    } else if (current instanceof CBWrapper) {
      this._callbacks = [current, wrapper];
    } else {
      (<CBWrapper<T, U>[]>current).push(wrapper);
    }
  }

  /**
   * Disconnect a callback from the signal.
   *
   * This will remove all instances of the callback from the signal.
   * If no callback is provided, all callbacks will be disconnected.
   *
   * It is safe to disconnect a callback from the signal while the
   * signal is being emitted. The callback will not be invoked.
   */
  disconnect(callback?: (sender: T, args: U) => void, thisArg?: any): void {
    var current = this._callbacks;
    if (current === null) {
      return;
    }
    if (current instanceof CBWrapper) {
      if (!callback || current.equals(callback, thisArg)) {
        current.clear();
        this._callbacks = null;
      }
    } else if (!callback) {
      var array = <CBWrapper<T, U>[]>current;
      for (var i = 0, n = array.length; i < n; ++i) {
        array[i].clear();
      }
      this._callbacks = null;
    } else {
      var rest: CBWrapper<T, U>[] = [];
      var array = <CBWrapper<T, U>[]>current;
      for (var i = 0, n = array.length; i < n; ++i) {
        var wrapper = array[i];
        if (wrapper.equals(callback, thisArg)) {
          wrapper.clear();
        } else {
          rest.push(wrapper);
        }
      }
      if (rest.length === 0) {
        this._callbacks = null;
      } else if (rest.length === 1) {
        this._callbacks = rest[0];
      } else {
        this._callbacks = rest;
      }
    }
  }

  /**
   * Test whether a callback is connected to the signal.
   */
  isConnected(callback: (sender: T, args: U) => void, thisArg?: any): boolean {
    var current = this._callbacks;
    if (current === null) {
      return false;
    }
    if (current instanceof CBWrapper) {
      return current.equals(callback, thisArg);
    }
    var array = <CBWrapper<T, U>[]>current;
    for (var i = 0, n = array.length; i < n; ++i) {
      if (array[i].equals(callback, thisArg)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Emit the signal and invoke its connected callbacks.
   *
   * Callbacks are invoked in the order in which they are connected.
   */
  emit(sender: T, args: U): void {
    var current = this._callbacks;
    if (current === null) {
      return;
    }
    if (current instanceof CBWrapper) {
      current.invoke(sender, args);
    } else {
      var array = <CBWrapper<T, U>[]>current;
      for (var i = 0, n = array.length; i < n; ++i) {
        array[i].invoke(sender, args);
      }
    }
  }

  private _callbacks: CBWrapper<T, U> | CBWrapper<T, U>[] = null;
}


/**
 * A thin wrapper around a callback function and context.
 */
class CBWrapper<T, U> {
  /**
   * Construct a new callback wrapper.
   */
  constructor(callback: (sender: T, args: U) => void, thisArg: any) {
    this._callback = callback;
    this._thisArg = thisArg;
  }

  /**
   * Clear the contents of the callback wrapper.
   */
  clear(): void {
    this._callback = null;
    this._thisArg = null;
  }

  /**
   * Test whether the wrapper equals a callback and context.
   */
  equals(callback: (sender: T, args: U) => void, thisArg: any): boolean {
    return this._callback === callback && this._thisArg === thisArg;
  }

  /**
   * Invoke the wrapped callback with the given sender and args.
   *
   * This is a no-op if the wrapper has been cleared.
   */
  invoke(sender: T, args: U): void {
    if (this._callback) {
      this._callback.call(this._thisArg, sender, args);
    }
  }

  private _callback: (sender: T, args: U) => void;
  private _thisArg: any;
}

} // module phosphor.core
