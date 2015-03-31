/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

import Queue = collections.Queue;


/**
 * Send a message to the message handler to process immediately.
 */
export
function sendMessage(handler: IMessageHandler, msg: IMessage): void {
  getDispatcher(handler).sendMessage(msg);
}


/**
 * Post a message to the message handler to process in the future.
 */
export
function postMessage(handler: IMessageHandler, msg: IMessage): void {
  getDispatcher(handler).postMessage(msg);
}


/**
 * Test whether the message handler has pending messages.
 */
export
function hasPendingMessages(handler: IMessageHandler): boolean {
  return getDispatcher(handler).hasPendingMessages();
}


/**
 * Send the first pending message to the message handler.
 */
export
function sendPendingMessage(handler: IMessageHandler): void {
  getDispatcher(handler).sendPendingMessage();
}


/**
 * Install a message filter for a message handler.
 *
 * A message filter is invoked before the message handler processes
 * the message. If the filter returns true from its `filterMessage`
 * method, processing of the message will stop immediately and no
 * other filters or the message handler will be invoked.
 *
 * The most recently installed filter is executed first.
 */
export
function installMessageFilter(handler: IMessageHandler, filter: IMessageFilter): void {
  getDispatcher(handler).installMessageFilter(filter);
}


/**
 * Remove a message filter added for a message handler.
 *
 * It is safe to call this function while the filter is executing.
 *
 * If the filter is not installed, this is a no-op.
 */
export
function removeMessageFilter(handler: IMessageHandler, filter: IMessageFilter): void {
  getDispatcher(handler).removeMessageFilter(filter);
}


/**
 * Clear all message data associated with the message handler.
 *
 * This removes all pending messages and filters for the handler.
 */
export
function clearMessageData(handler: IMessageHandler): void {
  var dispatcher = dispatcherMap.get(handler);
  if (dispatcher !== void 0) {
    dispatcherMap.delete(handler);
    dispatcher.clearPendingMessages();
    dispatcher.clearMessageFilters();
  }
}


/**
 * The internal mapping of message handler to message dispatcher.
 */
var dispatcherMap = new WeakMap<IMessageHandler, MessageDispatcher>();


/**
 * The internal queue of posted message dispatchers.
 */
var dispatchQueue = new Queue<MessageDispatcher>();


/**
 * The internal animation frame id for the message loop wake up call.
 */
var frameId = 0;


/**
 * A local reference to `requestAnimationFrame`.
 */
var raf = requestAnimationFrame;


/**
 * Get or create the message dispatcher for an message handler.
 */
function getDispatcher(handler: IMessageHandler): MessageDispatcher {
  var dispatcher = dispatcherMap.get(handler);
  if (dispatcher === void 0) {
    dispatcher = new MessageDispatcher(handler);
    dispatcherMap.set(handler, dispatcher);
  }
  return dispatcher;
}


/**
 * Wake up the message loop to process any pending dispatchers.
 *
 * This is a no-op if a wake up is not needed or is already pending.
 */
function wakeUpMessageLoop(): void {
  if (frameId === 0 && !dispatchQueue.empty) {
    frameId = raf(runMessageLoop);
  }
}


/**
 * Run an iteration of the message loop.
 *
 * This will process all pending dispatchers in the queue. Dispatchers
 * which are added to the queue while the message loop is running will
 * be processed on the next message loop cycle.
 */
function runMessageLoop(): void {
  // Clear the frame id so the next wake up call can be scheduled.
  frameId = 0;

  // If the queue is empty, there is nothing else to do.
  if (dispatchQueue.empty) {
    return;
  }

  // Add a null sentinel value to the end of the queue. The queue
  // will only be processed up to the first null value. This means
  // that messages posted during this cycle will execute on the next
  // cycle of the loop. If the last value in the array is null, it
  // means that an exception was thrown by a message handler and the
  // loop had to be restarted.
  if (dispatchQueue.back !== null) {
    dispatchQueue.pushBack(null);
  }

  // The message dispatch loop. If the dispatcher is the null sentinel,
  // the processing of the current block of messages is complete and
  // another loop is scheduled. Otherwise, the pending message is
  // dispatched to the message handler.
  while (!dispatchQueue.empty) {
    var dispatcher = dispatchQueue.popFront();
    if (dispatcher === null) {
      wakeUpMessageLoop();
      return;
    }
    dispatchMessage(dispatcher);
  }
}


/**
 * Safely process the pending handler message.
 *
 * If the message handler throws an exception, the message loop will
 * be restarted and the exception will be rethrown.
 */
function dispatchMessage(dispatcher: MessageDispatcher): void {
  try {
    dispatcher.sendPendingMessage();
  } catch (ex) {
    wakeUpMessageLoop();
    throw ex;
  }
}


/**
 * A thin wrapper around a message filter.
 */
class FilterWrapper {
  /**
   * construct a new filter wrapper.
   */
  constructor(filter: IMessageFilter) {
    this._filter = filter;
  }

  /**
   * Clear the contents of the wrapper.
   */
  clear(): void {
    this._filter = null;
  }

  /**
   * Test whether the wrapper is equivalent to the given filter.
   */
  equals(filter: IMessageFilter): boolean {
    return this._filter === filter;
  }

  /**
   * Invoke the filter with the given handler and message.
   *
   * Returns true if the message should be filtered, false otherwise.
   */
  invoke(handler: IMessageHandler, msg: IMessage): boolean {
    return this._filter ? this._filter.filterMessage(handler, msg) : false;
  }

  private _filter: IMessageFilter;
}


/**
 * An object which manages message dispatch for a message handler.
 */
class MessageDispatcher {
  /**
   * Construct a new message dispatcher.
   */
  constructor(handler: IMessageHandler) {
    this._handler = handler;
  }

  /**
   * Send an message to the message handler to process immediately.
   *
   * The message will first be sent through the installed filters.
   * If the message is filtered, it will not be sent to the handler.
   */
  sendMessage(msg: IMessage): void {
    if (!this._filterMessage(msg)) {
      this._handler.processMessage(msg);
    }
  }

  /**
   * Post a message to the message handler to process in the future.
   *
   * The message will first be compressed if possible. If the message
   * cannot be compressed, it will be added to the message queue.
   */
  postMessage(msg: IMessage): void {
    if (!this._compressMessage(msg)) {
      this._enqueueMessage(msg);
    }
  }

  /**
   * Test whether the message handler has pending messages.
   */
  hasPendingMessages(): boolean {
    return this._messages !== null && !this._messages.empty;
  }

  /**
   * Send the first pending message to the message handler.
   */
  sendPendingMessage(): void {
    if (this._messages !== null && !this._messages.empty) {
      this.sendMessage(this._messages.popFront());
    }
  }

  /**
   * Clear the pending messages for the message handler.
   */
  clearPendingMessages(): void {
    if (this._messages !== null) {
      this._messages.clear();
      this._messages = null;
    }
  }

  /**
   * Install an message filter for the message handler.
   */
  installMessageFilter(filter: IMessageFilter): void {
    var wrapper = new FilterWrapper(filter);
    var current = this._filters;
    if (current === null) {
      this._filters = wrapper;
    } else if (current instanceof FilterWrapper) {
      this._filters = [current, wrapper];
    } else {
      (<FilterWrapper[]>current).push(wrapper);
    }
  }

  /**
   * Remove an message filter installed for the message handler.
   */
  removeMessageFilter(filter: IMessageFilter): void {
    var current = this._filters;
    if (current === null) {
      return;
    }
    if (current instanceof FilterWrapper) {
      if (current.equals(filter)) {
        current.clear();
        this._filters = null;
      }
    } else {
      var rest: FilterWrapper[] = [];
      var array = <FilterWrapper[]>current;
      for (var i = 0, n = array.length; i < n; ++i) {
        var wrapper = array[i];
        if (wrapper.equals(filter)) {
          wrapper.clear();
        } else {
          rest.push(wrapper);
        }
      }
      if (rest.length === 0) {
        this._filters = null;
      } else if (rest.length === 1) {
        this._filters = rest[0];
      } else {
        this._filters = rest;
      }
    }
  }

  /**
   * Remove all message filters installed for the message handler.
   */
  clearMessageFilters(): void {
    var current = this._filters;
    if (current === null) {
      return;
    }
    this._filters = null;
    if (current instanceof FilterWrapper) {
      current.clear();
    } else {
      var array = <FilterWrapper[]>current;
      for (var i = 0, n = array.length; i < n; ++i) {
        array[i].clear();
      }
    }
  }

  /**
   * Compress an message posted to the message handler, if possible.
   *
   * Returns true if the message was compressed, or false if the
   * message should be posted to the message queue as normal.
   */
  private _compressMessage(msg: IMessage): boolean {
    if (this._handler.compressMessage === void 0) {
      return false;
    }
    if (this._messages === null || this._messages.empty) {
      return false;
    }
    return this._handler.compressMessage(msg, this._messages);
  }

  /**
   * Send an message through the installed message filters.
   *
   * Returns true if the message should be filtered, false otherwise.
   */
  private _filterMessage(msg: IMessage): boolean {
    var current = this._filters;
    if (current === null) {
      return false;
    }
    if (current instanceof FilterWrapper) {
      return current.invoke(this._handler, msg);
    }
    var handler = this._handler;
    var array = <FilterWrapper[]>current;
    for (var i = array.length - 1; i >= 0; --i) {
      if (array[i].invoke(handler, msg)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add a message to the message queue and wake up the message loop.
   */
  private _enqueueMessage(msg: IMessage): void {
    if (this._messages === null) {
      this._messages = new Queue<IMessage>();
    }
    this._messages.pushBack(msg);
    dispatchQueue.pushBack(this);
    wakeUpMessageLoop();
  }

  private _handler: IMessageHandler;
  private _messages: Queue<IMessage> = null;
  private _filters: FilterWrapper | FilterWrapper[] = null;
}

} // module phosphor.core
