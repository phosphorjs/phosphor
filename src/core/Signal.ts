/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IDisposable = require('./IDisposable');

export = Signal;


/**
 * An object which manages a collection of listeners.
 */
class Signal<T, U> implements IDisposable {
  /**
   * Construct a new signal.
   */
  constructor() { }

  /**
   * Dispose of the resources held by the signal.
   */
  dispose(): void {
    var link = this._m_link;
    while (link !== null) {
      var next = link.next;
      link.listener = null;
      link.thisArg = null;
      link.next = null;
      link = next;
    }
    this._m_link = null;
  }

  /**
   * Connect a listener to the signal.
   *
   * If the listener is already connected, this is a no-op.
   *
   * A listener is not invoked if it is connected during dispatch.
   */
  connect(listener: (sender: T, args: U) => void, thisArg?: any): void {
    var link = this._m_link;
    var prev: typeof link = null;
    while (link !== null) {
      if (link.listener === listener && link.thisArg === thisArg) {
        return;
      }
      prev = link;
      link = link.next;
    }
    link = { next: null, listener: listener, thisArg: thisArg };
    if (prev === null) {
      this._m_link = link;
    } else {
      prev.next = link;
    }
  }

  /**
   * Disconnect a listener from the signal.
   *
   * If the listener is not connected, this is a no-op.
   *
   * A listener is not invoked if it is removed during dispatch.
   */
  disconnect(listener: (sender: T, args: U) => void, thisArg?: any): void {
    var link = this._m_link;
    var prev: typeof link = null;
    while (link !== null) {
      if (link.listener === listener && link.thisArg === thisArg) {
        if (prev === null) {
          this._m_link = link.next;
        } else {
          prev.next = link.next;
        }
        link.listener = null;
        link.thisArg = null;
        link.next = null;
        return;
      }
      prev = link;
      link = link.next;
    }
  }

  /**
   * Emit the signal and invoke its connected listeners.
   *
   * Listeners are invoked in the order in which they are connected.
   */
  emit(sender: T, args: U): void {
    var link = this._m_link;
    if (link === null) {
      return;
    }
    if (link.next === null) {
      link.listener.call(link.thisArg, sender, args);
      return;
    }
    var links: typeof link[] = [];
    while (link !== null) {
      links.push(link);
      link = link.next;
    }
    for (var i = 0, n = links.length; i < n; ++i) {
      link = links[i];
      if (link.listener !== null) {
        link.listener.call(link.thisArg, sender, args);
      }
    }
  }

  private _m_link: IListenerLink<T, U> = null;
}


/**
 * A link in a signal listener chain.
 */
interface IListenerLink<T, U> {
  /**
   * The next link in the chain.
   */
  next: IListenerLink<T, U>;

  /**
   * The listener function.
   */
  listener: (sender: T, args: U) => void;

  /**
   * The listener function context.
   */
  thisArg: any;
}
