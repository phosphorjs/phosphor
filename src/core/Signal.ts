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
  connect(cb: (sender: T, args: U) => void, thisArg?: any): void {
    var wrapper = new CBWrapper(cb, thisArg);
    var current = this._m_callbacks;
    if (current === null) {
      this._m_callbacks = wrapper;
    } else if (current instanceof CBWrapper) {
      this._m_callbacks = [current, wrapper];
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
  disconnect(cb?: (sender: T, args: U) => void, thisArg?: any): void {
    var current = this._m_callbacks;
    if (current === null) {
      return;
    }
    if (current instanceof CBWrapper) {
      if (!cb || current.equals(cb, thisArg)) {
        current.clear();
        this._m_callbacks = null;
      }
    } else if (!cb) {
      var array = <CBWrapper<T, U>[]>current;
      for (var i = 0, n = array.length; i < n; ++i) {
        array[i].clear();
      }
      this._m_callbacks = null;
    } else {
      var rest: CBWrapper<T, U>[] = [];
      var array = <CBWrapper<T, U>[]>current;
      for (var i = 0, n = array.length; i < n; ++i) {
        var wrapper = array[i];
        if (wrapper.equals(cb, thisArg)) {
          wrapper.clear();
        } else {
          rest.push(wrapper);
        }
      }
      if (rest.length === 0) {
        this._m_callbacks = null;
      } else if (rest.length === 1) {
        this._m_callbacks = rest[0];
      } else {
        this._m_callbacks = rest;
      }
    }
  }

  /**
   * Test whether a callback is connected to the signal.
   */
  isConnected(cb: (sender: T, args: U) => void, thisArg?: any): boolean {
    var current = this._m_callbacks;
    if (current === null) {
      return false;
    }
    if (current instanceof CBWrapper) {
      return current.equals(cb, thisArg);
    }
    var array = <CBWrapper<T, U>[]>current;
    for (var i = 0, n = array.length; i < n; ++i) {
      if (array[i].equals(cb, thisArg)) {
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
    var current = this._m_callbacks;
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

  private _m_callbacks: CBWrapper<T, U> | CBWrapper<T, U>[] = null;
}


/**
 * A thin wrapper around a callback function and context.
 */
class CBWrapper<T, U> {
  /**
   * Construct a new callback wrapper.
   */
  constructor(cb: (sender: T, args: U) => void, thisArg: any) {
    this._m_cb = cb;
    this._m_thisArg = thisArg;
  }

  /**
   * Clear the contents of the callback wrapper.
   */
  clear(): void {
    this._m_cb = null;
    this._m_thisArg = null;
  }

  /**
   * Test whether the wrapper equals a callback and context.
   */
  equals(cb: (sender: T, args: U) => void, thisArg: any): boolean {
    return this._m_cb === cb && this._m_thisArg === thisArg;
  }

  /**
   * Invoke the wrapped callback with the given sender and args.
   *
   * This is a no-op if the wrapper has been cleared.
   */
  invoke(sender: T, args: U): void {
    if (this._m_cb) {
      this._m_cb.call(this._m_thisArg, sender, args);
    }
  }

  private _m_cb: (sender: T, args: U) => void;
  private _m_thisArg: any;
}

} // module phosphor.core
