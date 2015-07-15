/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * An object used for type-safe inter-object communication.
 *
 * #### Example
 * ```typescript
 * class SomeClass {
 *
 *   @signal
 *   valueChanged: ISignal<number>;
 *
 * }
 * ```
 */
export
interface ISignal<T> {
  /**
   * Connect a callback to the signal.
   *
   * @param callback - The function to invoke when the signal is
   *   emitted. The args object emitted with the signal is passed
   *   as the first and only argument to the function.
   *
   * @param thisArg - The object to use as the `this` context in the
   *   callback. If provided, this must be a non-primitive object.
   *
   * @returns `true` if the connection succeeds, `false` otherwise.
   *
   * #### Notes
   * Connected callbacks are invoked synchronously, in the order in
   * which they are connected.
   *
   * Signal connections are unique. If a connection already exists for
   * the given `callback` and `thisArg`, this function returns `false`.
   *
   * A newly connected callback will not be invoked until the next time
   * the signal is emitted, even if it is connected while the signal is
   * being emitted.
   *
   * #### Example
   * ```typescript
   * // connect a method
   * someObject.valueChanged.connect(myObject.onValueChanged, myObject);
   *
   * // connect a plain function
   * someObject.valueChanged.connect(myCallback);
   * ```
   */
  connect(callback: (args: T) => void, thisArg?: any): boolean;

  /**
   * Disconnect a callback from the signal.
   *
   * @param callback - The callback connected to the signal.
   *
   * @param thisArg - The `this` context for the callback.
   *
   * @returns `true` if the connection is broken, `false` otherwise.
   *
   * #### Notes
   * A disconnected callback will no longer be invoked, even if it
   * is disconnected while the signal is being emitted.
   *
   * If no connection exists for the given `callback` and `thisArg`,
   * this function returns `false`.
   *
   * #### Example
   * ```typescript
   * // disconnect a method
   * someObject.valueChanged.disconnect(myObject.onValueChanged, myObject);
   *
   * // disconnect a plain function
   * someObject.valueChanged.disconnect(myCallback);
   * ```
   */
  disconnect(callback: (args: T) => void, thisArg?: any): boolean;

  /**
   * Emit the signal and invoke the connected callbacks.
   *
   * @param args - The args object to pass to the callbacks.
   *
   * #### Notes
   * If a connected callback throws an exception, dispatching of the
   * signal will terminate immediately and the exception will be
   * propagated to the call site of this function.
   *
   * #### Example
   * ```typescript
   * someObject.valueChanged.emit(42);
   * ```
   */
  emit(args: T): void;
}


/**
 * A decorator which defines a signal for an object.
 *
 * @param obj - The object on which to define the signal.
 *
 * @param name - The name of the signal to define.
 */
export
function signal(obj: any, name: string): void {
  Object.defineProperty(obj, name, {
    get: function() { return new BoundSignal<any>(this, name); },
  });
}


/**
 * Get the object which is emitting the curent signal.
 *
 * If a signal is not currently being emitted, this returns `null`.
 */
export
function sender(): any {
  return currentSender;
}


/**
 * Remove all signal connections where the given object is the sender.
 */
export
function disconnectSender(obj: any): void {
  var hash = senderMap.get(obj);
  if (!hash) {
    return;
  }
  for (var name in hash) {
    var conn = hash[name].first;
    while (conn !== null) {
      removeFromSendersList(conn);
      conn.callback = null;
      conn.thisArg = null;
      conn = conn.nextReceiver;
    }
  }
  senderMap.delete(obj);
}


/**
 * Remove all signal connections where the given object is the receiver.
 */
export
function disconnectReceiver(obj: any): void {
  var conn = receiverMap.get(obj);
  if (!conn) {
    return;
  }
  while (conn !== null) {
    var temp = conn.nextSender;
    conn.callback = null;
    conn.thisArg = null;
    conn.prevSender = null;
    conn.nextSender = null;
    conn = temp;
  }
  receiverMap.delete(obj);
}


/**
 * Clear all signal data associated with the given object.
 *
 * This removes all signal connections associated with the object.
 */
export
function clearSignalData(obj: any): void {
  disconnectSender(obj);
  disconnectReceiver(obj);
}


/**
 * A concrete implementation of ISignal.
 */
class BoundSignal<T> implements ISignal<T> {
  /**
   * Construct a new bound signal.
   */
  constructor(sender: any, name: string) {
    this._sender = sender;
    this._name = name;
  }

  /**
   * Connect a callback to the signal.
   */
  connect(callback: (args: T) => void, thisArg?: any): boolean {
    return connect(this._sender, this._name, callback, thisArg);
  }

  /**
   * Disconnect a callback from the signal.
   */
  disconnect(callback: (args: T) => void, thisArg?: any): boolean {
    return disconnect(this._sender, this._name, callback, thisArg);
  }

  /**
   * Emit the signal and invoke the connected callbacks.
   */
  emit(args: T): void {
    emit(this._sender, this._name, args);
  }

  private _sender: any;
  private _name: string;
}


/**
 * A simple struct which holds connection data.
 */
class Connection {
  /**
   * The callback connected to the signal.
   */
  callback: Function = null;

  /**
   * The `this` context for the callback.
   */
  thisArg: any = null;

  /**
   * The next connection in the singly linked receivers list.
   */
  nextReceiver: Connection = null;

  /**
   * The next connection in the doubly linked senders list.
   */
  nextSender: Connection = null;

  /**
   * The previous connection in the doubly linked senders list.
   */
  prevSender: Connection = null;
}


/**
 * The list of connections for a signal of a sender.
 */
class ConnectionList {
  /**
   * The ref count for the list.
   */
  refs = 0;

  /**
   * The first connection in the list.
   */
  first: Connection = null;

  /**
   * The last connection in the list.
   */
  last: Connection = null;
}


/**
 * The type alias for a sender connection map.
 */
type ConnectionMap = { [signal: string]: ConnectionList };


/**
 * The object emitting the current signal.
 */
var currentSender: any = null;


/**
 * A mapping of sender object to its connection map.
 */
var senderMap = new WeakMap<any, ConnectionMap>();


/**
 * A mapping of receiver object to its connection array.
 */
var receiverMap = new WeakMap<any, Connection>();


/**
 * Connect a signal to a callback.
 */
function connect(sender: any, name: string, callback: Function, thisArg: any): boolean {
  // Warn and bail if a required argument is null.
  if (!sender || !name || !callback) {
    console.warn('null argument passed to `connect()`');
    return false;
  }

  // Coerce a `null` thisArg to `undefined`.
  thisArg = thisArg || void 0;

  // Get the connection map for the sender or create one if necessary.
  var hash = senderMap.get(sender);
  if (!hash) {
    hash = Object.create(null);
    senderMap.set(sender, hash);
  }

  // Search for an equivalent connection and bail if one is found.
  var list = hash[name];
  if (list && findConnection(list, callback, thisArg)) {
    return false;
  }

  // Create a new connection.
  var conn = new Connection();
  conn.callback = callback;
  conn.thisArg = thisArg;

  // Add the connection to the senders list.
  if (!list) {
    list = new ConnectionList();
    list.first = conn;
    list.last = conn;
    hash[name] = list;
  } else {
    list.last.nextReceiver = conn;
    list.last = conn;
  }

  // Add the connection to the receivers list.
  var receiver = thisArg || callback;
  var front = receiverMap.get(receiver);
  if (front) {
    front.prevSender = conn;
    conn.nextSender = front;
  }
  receiverMap.set(receiver, conn);

  return true;
}


/**
 * Disconnect a signal from a callback.
 */
function disconnect(sender: any, name: string, callback: Function, thisArg: any): boolean {
  // Warn and bail if a required argument is null.
  if (!sender || !name || !callback) {
    console.warn('null argument passed to `disconnect()`');
    return false;
  }

  // Coerce a `null` thisArg to `undefined`.
  thisArg = thisArg || void 0;

  // Bail early if there is no equivalent connection.
  var hash = senderMap.get(sender);
  if (!hash) {
    return false;
  }
  var list = hash[name];
  if (!list) {
    return false;
  }
  var conn = findConnection(list, callback, thisArg);
  if (!conn) {
    return false;
  }

  // Remove the connection from the senders list. It will be removed
  // from the receivers list the next time the signal is emitted.
  removeFromSendersList(conn);

  // Clear the connection data so it becomes a dead connection.
  conn.callback = null;
  conn.thisArg = null;

  return true;
}


/**
 * Emit a signal and invoke its connected callbacks.
 */
function emit(sender: any, name: string, args: any): void {
  var hash = senderMap.get(sender);
  if (!hash) {
    return;
  }
  var list = hash[name];
  if (!list) {
    return;
  }
  var temp = currentSender;
  currentSender = sender;
  list.refs++;
  try {
    var dirty = invokeList(list, args);
  } finally {
    currentSender = temp;
    list.refs--;
  }
  if (dirty && list.refs === 0) {
    cleanList(list);
  }
}


/**
 * Find a matching connection in the given connection list.
 *
 * Returns undefined if a match is not found.
 */
function findConnection(list: ConnectionList, callback: Function, thisArg: any): Connection {
  var conn = list.first;
  while (conn !== null) {
    if (conn.callback === callback && conn.thisArg === thisArg) {
      return conn;
    }
    conn = conn.nextReceiver;
  }
  return void 0;
}


/**
 * Invoke the callbacks in the given connection list.
 *
 * Connections added during dispatch will not be invoked. This returns
 * `true` if there are dead connections in the list, `false` otherwise.
 */
function invokeList(list: ConnectionList, args: any): boolean {
  var dirty = false;
  var last = list.last;
  var conn = list.first;
  while (conn !== null) {
    if (conn.callback) {
      conn.callback.call(conn.thisArg, args);
    } else {
      dirty = true;
    }
    if (conn === last) {
      break;
    }
    conn = conn.nextReceiver;
  }
  return dirty;
}


/**
 * Remove the dead connections from the given connection list.
 */
function cleanList(list: ConnectionList): void {
  var prev: Connection;
  var conn = list.first;
  while (conn !== null) {
    var next = conn.nextReceiver;
    if (!conn.callback) {
      conn.nextReceiver = null;
    } else if (!prev) {
      list.first = conn;
      prev = conn;
    } else {
      prev.nextReceiver = conn;
      prev = conn;
    }
    conn = next;
  }
  if (!prev) {
    list.first = null;
    list.last = null;
  } else {
    prev.nextReceiver = null;
    list.last = prev;
  }
}


/**
 * Remove a connection from the doubly linked list of senders.
 */
function removeFromSendersList(conn: Connection): void {
  var receiver = conn.thisArg || conn.callback;
  var prev = conn.prevSender;
  var next = conn.nextSender;
  if (prev === null && next === null) {
    receiverMap.delete(receiver);
  } else if (prev === null) {
    receiverMap.set(receiver, next);
    next.prevSender = null;
  } else if (next === null) {
    prev.nextSender = null;
  } else {
    prev.nextSender = next;
    next.prevSender = prev;
  }
  conn.prevSender = null;
  conn.nextSender = null;
}

} // module phosphor.core
