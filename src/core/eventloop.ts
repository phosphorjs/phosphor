/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import ICoreEvent = require('./ICoreEvent');
import IEventFilter = require('./IEventFilter');
import IEventHandler = require('./IEventHandler');
import IQueue = require('../collections/IQueue');
import Queue = require('../collections/Queue');


/**
 * Send an event to the event handler to process immediately.
 */
export
function sendEvent(handler: IEventHandler, event: ICoreEvent): void {
  var filtered = runEventFilters(handler, event);
  if (!filtered) handler.processEvent(event);
}


/**
 * Post an event to the event handler to process in the future.
 */
export
function postEvent(handler: IEventHandler, event: ICoreEvent): void {
  var data = ensureData(handler);
  var postedEvents = data.postedEvents;
  if (postedEvents === null) {
    postedEvents = data.postedEvents = new Queue<ICoreEvent>();
  }
  if (postedEvents.length > 0 && handler.compressEvent !== void 0) {
    if (handler.compressEvent(event, postedEvents)) {
      return;
    }
  }
  postedEvents.push(event);
  handlerQueue.push(handler);
  wakeUpEventLoop();
}


/**
 * Send the first pending posted event to the event handler.
 */
export
function sendPendingEvent(handler: IEventHandler): void {
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    return;
  }
  var postedEvents = data.postedEvents;
  if (postedEvents !== null && postedEvents.length > 0) {
    sendEvent(handler, postedEvents.pop());
  }
}


/**
 * Test whether the event handler has pending posted events.
 */
export
function hasPendingEvents(handler: IEventHandler): boolean {
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    return false;
  }
  var postedEvents = data.postedEvents;
  return postedEvents !== null && postedEvents.length > 0;
}


/**
 * Install an event filter for an event handler.
 *
 * An event filter is invoked before the event handler's `processEvent`
 * method. If the filter returns true from its `filterEvent` method,
 * processing of the event will stop immediately.
 *
 * The most recently installed event filter is executed first.
 */
export
function installEventFilter(handler: IEventHandler, filter: IEventFilter): void {
  var wrapper = new EventFilterWrapper(filter);
  var data = ensureData(handler);
  var filters = data.eventFilters;
  if (filters === null) {
    data.eventFilters = wrapper;
  } else if (filters instanceof EventFilterWrapper) {
    data.eventFilters = [filters, wrapper];
  } else {
    (<EventFilterWrapper[]>filters).push(wrapper);
  }
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
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    return;
  }
  var filters = data.eventFilters;
  if (filters === null) {
    return;
  }
  if (filters instanceof EventFilterWrapper) {
    if (filters.equals(filter)) {
      filters.clear();
      data.eventFilters = null;
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
      data.eventFilters = null;
    } else if (rest.length === 1) {
      data.eventFilters = rest[0];
    } else {
      data.eventFilters = rest;
    }
  }
}


/**
 * Clear all data associated with the event handler.
 *
 * This removes all posted events and event filters for the handler.
 */
export
function clearEventData(handler: IEventHandler): void {
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    return;
  }
  if (data.postedEvents !== null) {
    data.postedEvents.clear();
  }
  var filters = data.eventFilters;
  if (filters !== null) {
    if (filters instanceof EventFilterWrapper) {
      filters.clear();
    } else {
      (<EventFilterWrapper[]>filters).forEach(wrapper => wrapper.clear());
    }
  }
  handlerDataMap.delete(handler);
}


/**
 * The internal map of event handler data.
 */
var handlerDataMap = new WeakMap<IEventHandler, IEventHandlerData>();


/**
 * The internal queue of posted event handlers.
 */
var handlerQueue = new Queue<IEventHandler>();


/**
 * The internal animation frame id for the event loop wake up call.
 */
var frameId = 0;


/**
 * A local reference to `requestAnimationFrame`.
 */
var raf = requestAnimationFrame;


/**
 * An object which holds data for an event handler.
 */
interface IEventHandlerData {
  /**
   * The queue of posted events for the handler.
   */
  postedEvents: IQueue<ICoreEvent>;

  /**
   * The event filters installed for the handler.
   */
  eventFilters: EventFilterWrapper | EventFilterWrapper[];
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
 * Get the data object for a handler, creating it if necessary.
 */
function ensureData(handler: IEventHandler): IEventHandlerData {
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    data = { postedEvents: null, eventFilters: null };
    handlerDataMap.set(handler, data);
  }
  return data;
}


/**
 * Run the event filters installed for the event handler.
 *
 * Returns true if the event should be filtered, false otherwise.
 */
function runEventFilters(handler: IEventHandler, event: ICoreEvent): boolean {
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    return false;
  }
  var filters = data.eventFilters;
  if (filters === null) {
    return false;
  }
  if (filters instanceof EventFilterWrapper) {
    return filters.invoke(handler, event);
  }
  var array = <EventFilterWrapper[]>filters;
  for (var i = array.length - 1; i >= 0; --i) {
    if (array[i].invoke(handler, event)) {
      return true;
    }
  }
  return false;
}


/**
 * Wake up the event loop to process the pending handlers.
 *
 * If a wake up is pending or if there are no handlers, this is a no-op.
 */
function wakeUpEventLoop(): void {
  if (frameId === 0 && handlerQueue.length > 0) {
    frameId = raf(runEventLoop);
  }
}


/**
 * The main event loop.
 *
 * This will process all pending handlers currently in the queue.
 * Event handlers which are added to the queue while the loop is
 * running will be processed on the next invocation of the loop.
 */
function runEventLoop(): void {
  // Clear the frame id so the next wake up call can be scheduled.
  frameId = 0;

  // If the queue is empty, there is nothing else to do.
  if (handlerQueue.length === 0) {
    return;
  }

  // Add a null sentinel value to the end of the queue. The queue
  // will only be processed up to the first null value. This means
  // that events posted during this cycle will execute on the next
  // cycle of the loop. If the last value in the array is null, it
  // means that an exception was thrown by an event handler and the
  // loop had to be restarted.
  if (handlerQueue.back !== null) {
    handlerQueue.push(null);
  }

  // The event dispatch loop. If the handler is the null sentinel,
  // the processing of the current section is complete and another
  // loop is scheduled. Otherwise, the handler is dispatched.
  while (handlerQueue.length > 0) {
    var handler = handlerQueue.pop();
    if (handler === null) {
      wakeUpEventLoop();
      return;
    }
    dispatchEvent(handler);
  }
}


/**
 * Safely process the pending handler event.
 *
 * If the event handler throws an exception, the event loop will
 * be restarted and the exception will be rethrown.
 */
function dispatchEvent(handler: IEventHandler): void {
  try {
    sendPendingEvent(handler);
  } catch (ex) {
    wakeUpEventLoop();
    throw ex;
  }
}
