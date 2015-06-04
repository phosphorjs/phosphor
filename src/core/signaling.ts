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
 *   static valueChanged = new Signal<SomeClass, number>();
 *
 *   // ...
 * }
 * ```
 */
export
class Signal<T, U> {
  private _signalStructuralPropertyT: T;
  private _signalStructuralPropertyU: U;
}


/**
 * Connect the signal of a sender to the method of a receiver.
 *
 * @param sender - The object which will emit the signal. This will
 *   be passed as the first argument to the receiver method when the
 *   signal is emitted. This must be a non-primitive object.
 *
 * @param signal - The signal which will be emitted by the sender.
 *
 * @param receiver - The object to connect to the signal. This will
 *   become the `this` context in the receiver method. This must be
 *   a non-primitive object.
 *
 * @param method - The receiver method to invoke when the signal is
 *   emitted. The sender is passed as the first argument followed by
 *   the args object emitted with the signal.
 *
 * @returns `true` if the connection succeeds, `false` otherwise.
 *
 * #### Notes
 * Receiver methods are invoked synchronously, in the order in which
 * they are connected.
 *
 * Signal connections are unique. If a connection already exists for
 * the given combination of arguments, this function is a no-op.
 *
 * A newly connected receiver method will not be invoked until the next
 * emission of the signal, even if it is connected during an emission.
 *
 * #### Example
 * ```typescript
 * connect(someObject, SomeClass.valueChanged, myObject, myObject.onValueChanged);
 * ```
 */
export
function connect<T, U>(sender: T, signal: Signal<T, U>, receiver: any, method: (sender: T, args: U) => void): boolean {
  // All arguments must be provided; warn if they are not.
  if (!sender || !signal || !receiver || !method) {
    console.warn('null argument passed to `connect()`');
    return false;
  }

  // Get the connection list for the sender or create one if necessary.
  var list = senderMap.get(sender);
  if (list === void 0) {
    list = new ConnectionList();
    senderMap.set(sender, list);
  }

  // Search for a matching connection and bail if one is found.
  var conn = list.first;
  while (conn !== null) {
    if (isMatch(conn, sender, signal, receiver, method)) {
      return false;
    }
    conn = conn.nextReceiver;
  }

  // Create and initialize a new connection.
  conn = new Connection();
  conn.sender = sender;
  conn.signal = signal;
  conn.receiver = receiver;
  conn.method = method;

  // Add the connection to the list of receivers.
  if (list.last === null) {
    list.first = conn;
    list.last = conn;
  } else {
    list.last.nextReceiver = conn;
    list.last = conn;
  }

  // Add the connection to the list of senders.
  var head = receiverMap.get(receiver);
  if (head !== void 0) {
    head.prevSender = conn;
    conn.nextSender = head;
  }
  receiverMap.set(receiver, conn);

  return true;
}


/**
 * Disconnect the signal of a sender from the method of a receiver.
 *
 * @param sender - The object which emits the signal.
 *
 * @param signal - The signal emitted by the sender.
 *
 * @param receiver - The object connected to the signal.
 *
 * @param method - The receiver method connected to the signal.
 *
 * @returns `true` if the connection is broken, `false` otherwise.
 *
 * #### Notes
 * Any argument to this function may be null, and it will be treated
 * as a wildcard when matching the connection. However, `sender` and
 * `receiver` cannot both be null; one or both must be provided.
 *
 * A disconnected receiver method will no longer be invoked, even if
 * it is disconnected during signal emission.
 *
 * If no connection exists for the given combination of arguments,
 * this function is a no-op.
 *
 * #### Example
 * ```typescript
 * // disconnect a specific signal from a specific handler
 * disconnect(someObject, SomeClass.valueChanged, myObject, myObject.onValueChanged);
 *
 * // disconnect all receivers from a specific sender
 * disconnect(someObject, null, null, null);
 *
 * // disconnect all receivers from a specific signal
 * disconnect(someObject, SomeClass.valueChanged, null, null);
 *
 * // disconnect a specific receiver from all senders
 * disconnect(null, null, myObject, null);
 *
 * // disconnect a specific handler from all senders
 * disconnect(null, null, myObject, myObject.onValueChanged);
 * ```
 */
export
function disconnect<T, U>(sender: T, signal: Signal<T, U>, receiver: any, method: (sender: T, args: U) => void): boolean {
  // If a sender is provided, the list of connected receivers is walked
  // and any matching connection is removed from *the list of senders*.
  // The receivers list is marked dirty and will be cleaned at the end
  // of the next signal emission.
  if (sender) {
    var list = senderMap.get(sender);
    if (list === void 0) {
      return false;
    }
    var success = false;
    var conn = list.first;
    while (conn !== null) {
      if (isMatch(conn, sender, signal, receiver, method)) {
        list.dirty = true;
        removeFromSendersList(conn);
        success = true;
      }
      conn = conn.nextReceiver;
    }
    return success;
  }

  // If only the receiver is provided, the list of connected senders
  // is walked and any matching connection is removed *from the list
  // of senders*. The receivers list for each sender is marked dirty
  // and will be cleaned at the end of the next signal emission.
  if (receiver) {
    var conn = receiverMap.get(receiver);
    if (conn === void 0) {
      return false;
    }
    var success = false;
    while (conn !== null) {
      var next = conn.nextSender; // store before removing conn
      if (isMatch(conn, sender, signal, receiver, method)) {
        senderMap.get(conn.sender).dirty = true;
        removeFromSendersList(conn);
        success = true;
      }
      conn = next;
    }
    return success;
  }

  // If the sender and receiver are both null, finding all matching
  // connections would require a full scan of all connection lists.
  // That would be expensive and is explicitly not supported.
  console.warn('null sender and receiver passed to `disconnect()`');
  return false;
}


/**
 * Emit the signal of a sender and invoke the connected receivers.
 *
 * @param sender - The object which is emitting the signal. This will
 *   be passed as the first argument to all connected receivers. This
 *   must be a non-primitive object.
 *
 * @param signal - The signal to be emitted by the sender.
 *
 * @param args - The args object for the signal. This will be passed
 *   as the second argument to all connected receivers.
 *
 * #### Notes
 * If a receiver throws an exception, dispatching of the signal will
 * terminate immediately and the exception will be propagated to the
 * call site of this function.
 *
 * #### Example
 * ```typescript
 * emit(someObject, SomeClass.valueChanged, 42);
 * ```
 */
export
function emit<T, U>(sender: T, signal: Signal<T, U>, args: U): void {
  var list = senderMap.get(sender);
  if (list === void 0) {
    return;
  }
  list.refs++;
  try {
    invokeReceivers(list, signal, args);
  } finally {
    list.refs--;
  }
  if (list.dirty && list.refs === 0) {
    cleanReceiversList(list);
    list.dirty = false;
  }
}


/**
 * An object which holds data for a list of connected receivers.
 */
class ConnectionList {
  /**
   * The ref count for the connection list.
   */
  refs = 0;

  /**
   * Whether or not the connection list has broken connections.
   */
  dirty = false;

  /**
   * The first link in the singly linked list of receivers.
   */
  first: Connection = null;

  /**
   * The last link in the singly linked list of receivers.
   */
  last: Connection = null;
}


/**
 * An object which holds data for a signal connection.
 */
class Connection {
  /**
   * The sender object for the connection.
   */
  sender: any = null;

  /**
   * The signal object for the connection.
   */
  signal: Signal<any, any> = null;

  /**
   * The receiver object for the connection.
   */
  receiver: any = null;

  /**
   * The receiver method for the connection.
   */
  method: Function = null;

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
 * A mapping of sender object to its connection list.
 */
var senderMap = new WeakMap<any, ConnectionList>();


/**
 * A mapping of receiver object to its first connected sender.
 */
var receiverMap = new WeakMap<any, Connection>();


/**
 * Invoke the receiver connections which match a specific signal.
 *
 * This walks the provided connection list and invokes each receiver
 * connection which has a matching signal. A connection added during
 * dispatch will not be invoked.
 */
function invokeReceivers(list: ConnectionList, signal: Signal<any, any>, args: any): void {
  var last = list.last;
  var conn = list.first;
  while (conn !== null) {
    if (conn.receiver !== null && conn.signal === signal) {
      conn.method.call(conn.receiver, conn.sender, args);
    }
    if (conn === last) {
      break;
    }
    conn = conn.nextReceiver;
  }
}


/**
 * Test whether a connection matches the given arguments.
 *
 * Null arguments are treated as wildcards which will match the
 * corresponding property of the connection.
 */
function isMatch(conn: Connection, sender: any, signal: Signal<any, any>, receiver: any, method: Function): boolean {
  return (
    (!sender || conn.sender === sender) &&
    (!signal || conn.signal === signal) &&
    (!receiver || conn.receiver === receiver) &&
    (!method || conn.method === method)
  );
}


/**
 * Remove a live connection from the doubly linked list of senders.
 */
function removeFromSendersList(conn: Connection): void {
  var prev = conn.prevSender;
  var next = conn.nextSender;
  if (prev === null) {
    if (next === null) {
      receiverMap.delete(conn.receiver);
    } else {
      receiverMap.set(conn.receiver, next);
      next.prevSender = null;
    }
  } else if (next === null) {
    prev.nextSender = null;
  } else {
    prev.nextSender = next;
    next.prevSender = prev;
  }
  conn.sender = null;
  conn.receiver = null;
  conn.prevSender = null;
  conn.nextSender = null;
}


/**
 * Cleanup the receivers list by removing dead connections.
 */
function cleanReceiversList(list: ConnectionList): void {
  var prev: Connection = null;
  var conn = list.first;
  while (conn !== null) {
    var next = conn.nextReceiver;
    if (conn.receiver === null) {
      conn.nextReceiver = null;
    } else if (prev === null) {
      list.first = conn;
      prev = conn;
    } else {
      prev.nextReceiver = conn;
      prev = conn;
    }
    conn = next;
  }
  if (prev === null) {
    list.first = null;
    list.last = null;
  } else {
    prev.nextReceiver = null;
    list.last = prev;
  }
}

} // module phosphor.core
