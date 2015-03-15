/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import Queue = require('../collections/Queue');

import ICoreEvent = require('./ICoreEvent');
import IEventFilter = require('./IEventFilter');
import IEventHandler = require('./IEventHandler');


/**
 * Send an event to the event handler to process immediately.
 */
export
function sendEvent(handler: IEventHandler, event: ICoreEvent): void {
  getDispatcher(handler).sendEvent(event);
}


/**
 * Post an event to the event handler to process in the future.
 */
export
function postEvent(handler: IEventHandler, event: ICoreEvent): void {
  getDispatcher(handler).postEvent(event);
}


/**
 * Test whether the event handler has pending posted events.
 */
export
function hasPendingEvents(handler: IEventHandler): boolean {
  return getDispatcher(handler).hasPendingEvents();
}


/**
 * Send the first pending posted event to the event handler.
 */
export
function sendPendingEvent(handler: IEventHandler): void {
  getDispatcher(handler).sendPendingEvent();
}


/**
 * Install an event filter for an event handler.
 *
 * An event filter is invoked before the event handler's `processEvent`
 * method. If the filter returns true from its `filterEvent` method,
 * processing of the event will stop immediately and no other event
 * filters or the event handler will be invoked.
 *
 * The most recently installed event filter is executed first.
 */
export
function installEventFilter(handler: IEventHandler, filter: IEventFilter): void {
  getDispatcher(handler).installEventFilter(filter);
}


/**
 * Remove an event filter installed for an event handler.
 *
 * It is safe to call this function while the filter is executing.
 *
 * If the filter is not installed, this is a no-op.
 */
export
function removeEventFilter(handler: IEventHandler, filter: IEventFilter): void {
  getDispatcher(handler).removeEventFilter(filter);
}


/**
 * Clear all event data associated with the event handler.
 *
 * This removes all posted events and event filters for the handler.
 */
export
function clearEventData(handler: IEventHandler): void {
  var dispatcher = dispatcherMap.get(handler);
  if (dispatcher !== void 0) {
    dispatcherMap.delete(handler);
    dispatcher.clearPendingEvents();
    dispatcher.clearEventFilters();
  }
}


/**
 * The internal mapping of event handler to event dispatcher.
 */
var dispatcherMap = new WeakMap<IEventHandler, EventDispatcher>();


/**
 * The internal queue of posted event dispatchers.
 */
var dispatchQueue = new Queue<EventDispatcher>();


/**
 * The internal animation frame id for the event loop wake up call.
 */
var frameId = 0;


/**
 * A local reference to `requestAnimationFrame`.
 */
var raf = requestAnimationFrame;


/**
 * Get or create the event dispatcher for an event handler.
 */
function getDispatcher(handler: IEventHandler): EventDispatcher {
  var dispatcher = dispatcherMap.get(handler);
  if (dispatcher === void 0) {
    dispatcher = new EventDispatcher(handler);
    dispatcherMap.set(handler, dispatcher);
  }
  return dispatcher;
}


/**
 * Wake up the event loop to process any pending dispatchers.
 *
 * This is a no-op if a wake up is not needed or is already pending.
 */
function wakeUpEventLoop(): void {
  if (frameId === 0 && !dispatchQueue.empty) {
    frameId = raf(runEventLoop);
  }
}


/**
 * Run an iteration of the event loop.
 *
 * This will process all pending dispatchers in the queue.
 * Dispatchers which are added to the queue while the loop
 * is running will be processed on the next loop cycle.
 */
function runEventLoop(): void {
  // Clear the frame id so the next wake up call can be scheduled.
  frameId = 0;

  // If the queue is empty, there is nothing else to do.
  if (dispatchQueue.empty) {
    return;
  }

  // Add a null sentinel value to the end of the queue. The queue
  // will only be processed up to the first null value. This means
  // that events posted during this cycle will execute on the next
  // cycle of the loop. If the last value in the array is null, it
  // means that an exception was thrown by an event handler and the
  // loop had to be restarted.
  if (dispatchQueue.back !== null) {
    dispatchQueue.pushBack(null);
  }

  // The event dispatch loop. If the dispatcher is the null sentinel,
  // the processing of the current section is complete and another
  // loop is scheduled. Otherwise, the pending event is dispatched.
  while (!dispatchQueue.empty) {
    var dispatcher = dispatchQueue.popFront();
    if (dispatcher === null) {
      wakeUpEventLoop();
      return;
    }
    dispatchEvent(dispatcher);
  }
}


/**
 * Safely process the pending handler event.
 *
 * If the event handler throws an exception, the event loop will
 * be restarted and the exception will be rethrown.
 */
function dispatchEvent(dispatcher: EventDispatcher): void {
  try {
    dispatcher.sendPendingEvent();
  } catch (ex) {
    wakeUpEventLoop();
    throw ex;
  }
}


/**
 * A thin wrapper around an event filter.
 */
class EventFilterWrapper {
  /**
   * construct a new event filter wrapper.
   */
  constructor(filter: IEventFilter) {
    this._m_filter = filter;
  }

  /**
   * Clear the contents of the wrapper.
   */
  clear(): void {
    this._m_filter = null;
  }

  /**
   * Test whether the wrapper is equivalent to the given filter.
   */
  equals(filter: IEventFilter): boolean {
    return this._m_filter === filter;
  }

  /**
   * Invoke the filter with the given handler and event.
   *
   * Returns true if the event should be filtered, false otherwise.
   */
  invoke(handler: IEventHandler, event: ICoreEvent): boolean {
    return this._m_filter ? this._m_filter.filterEvent(handler, event) : false;
  }

  private _m_filter: IEventFilter;
}


/**
 * An object which manages events and filters for an event handler.
 */
class EventDispatcher {
  /**
   * Construct a new event dispatcher.
   */
  constructor(handler: IEventHandler) {
    this._m_handler = handler;
  }

  /**
   * Send an event to the event handler to process immediately.
   *
   * The event will first be sent through the installed filters.
   * If the event is filtered, it will not be sent to the handler.
   */
  sendEvent(event: ICoreEvent): void {
    if (!this._filterEvent(event)) {
      this._m_handler.processEvent(event);
    }
  }

  /**
   * Post an event to the event handler to process in the future.
   *
   * The event will first be compressed if possible. If the event
   * cannot be compressed, it will be posted to the event queue.
   */
  postEvent(event: ICoreEvent): void {
    if (!this._compressEvent(event)) {
      this._enqueueEvent(event);
    }
  }

  /**
   * Test whether the event handler has pending posted events.
   */
  hasPendingEvents(): boolean {
    return this._m_events !== null && !this._m_events.empty;
  }

  /**
   * Send the first pending posted event to the event handler.
   */
  sendPendingEvent(): void {
    if (this._m_events !== null && !this._m_events.empty) {
      this.sendEvent(this._m_events.popFront());
    }
  }

  /**
   * Clear the pending posted events for the event handler.
   */
  clearPendingEvents(): void {
    if (this._m_events !== null) {
      this._m_events.clear();
      this._m_events = null;
    }
  }

  /**
   * Install an event filter for the event handler.
   */
  installEventFilter(filter: IEventFilter): void {
    var wrapper = new EventFilterWrapper(filter);
    var filters = this._m_filters;
    if (filters === null) {
      this._m_filters = wrapper;
    } else if (filters instanceof EventFilterWrapper) {
      this._m_filters = [filters, wrapper];
    } else {
      (<EventFilterWrapper[]>filters).push(wrapper);
    }
  }

  /**
   * Remove an event filter installed for the event handler.
   */
  removeEventFilter(filter: IEventFilter): void {
    var filters = this._m_filters;
    if (filters === null) {
      return;
    }
    if (filters instanceof EventFilterWrapper) {
      if (filters.equals(filter)) {
        filters.clear();
        this._m_filters = null;
      }
    } else {
      var rest: EventFilterWrapper[] = [];
      var array = <EventFilterWrapper[]>filters;
      for (var i = 0, n = array.length; i < n; ++i) {
        var wrapper = array[i];
        if (wrapper.equals(filter)) {
          wrapper.clear();
        } else {
          rest.push(wrapper);
        }
      }
      if (rest.length === 0) {
        this._m_filters = null;
      } else if (rest.length === 1) {
        this._m_filters = rest[0];
      } else {
        this._m_filters = rest;
      }
    }
  }

  /**
   * Remove all event filters installed for the handler.
   */
  clearEventFilters(): void {
    var filters = this._m_filters;
    if (filters === null) {
      return;
    }
    this._m_filters = null;
    if (filters instanceof EventFilterWrapper) {
      filters.clear();
    } else {
      var array = <EventFilterWrapper[]>filters;
      for (var i = 0, n = array.length; i < n; ++i) {
        array[i].clear();
      }
    }
  }

  /**
   * Compress an event posted to the event handler, if possible.
   *
   * Returns true if the event was compressed, or false if the
   * event should be posted to the event queue as normal.
   */
  private _compressEvent(event: ICoreEvent): boolean {
    if (this._m_handler.compressEvent === void 0) {
      return false;
    }
    if (this._m_events === null || this._m_events.empty) {
      return false;
    }
    return this._m_handler.compressEvent(event, this._m_events);
  }

  /**
   * Send an event through the installed event filters.
   *
   * Returns true if the event should be filtered, false otherwise.
   */
  private _filterEvent(event: ICoreEvent): boolean {
    var filters = this._m_filters;
    if (filters === null) {
      return false;
    }
    if (filters instanceof EventFilterWrapper) {
      return filters.invoke(this._m_handler, event);
    }
    var handler = this._m_handler;
    var array = <EventFilterWrapper[]>filters;
    for (var i = array.length - 1; i >= 0; --i) {
      if (array[i].invoke(handler, event)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Add an event to the event queue and wake up the event loop.
   */
  private _enqueueEvent(event: ICoreEvent): void {
    if (this._m_events === null) {
      this._m_events = new Queue<ICoreEvent>();
    }
    this._m_events.pushBack(event);
    dispatchQueue.pushBack(this);
    wakeUpEventLoop();
  }

  private _m_handler: IEventHandler;
  private _m_events: Queue<ICoreEvent> = null;
  private _m_filters: EventFilterWrapper | EventFilterWrapper[] = null;
}
