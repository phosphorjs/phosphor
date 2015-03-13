/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import ICoreEvent = require('./ICoreEvent');
import IEventHandler = require('./IEventHandler');
import IEventHook = require('./IEventHook');
import IQueue = require('../collections/IQueue');
import Queue = require('../collections/Queue');


/**
 * Send an event to the event handler to process immediately.
 */
export
function sendEvent(handler: IEventHandler, event: ICoreEvent): void {
  var filtered = runEventHooks(handler, event);
  if (!filtered) handler.processEvent(event);
}


/**
 * Post an event to the event handler to process in the future.
 */
export
function postEvent(handler: IEventHandler, event: ICoreEvent): void {
  var postedEvents = ensureEventQueue(handler);
  if (!compressEvent(handler, event, postedEvents)) {
    postedEvents.push(event);
    handlerQueue.push(handler);
    wakeUpEventLoop();
  }
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
 * Clear the pending posted events for the event handler.
 */
export
function clearPendingEvents(handler: IEventHandler): void {
  var data = handlerDataMap.get(handler);
  if (data !== void 0 && data.postedEvents !== null) {
    data.postedEvents.clear();
  }
}


/**
 * Install an event hook for an event handler.
 *
 * An event hook is invoked before the event handler's `processEvent`
 * method. If any installed event hook returns true from `hookEvent`,
 * the event will not be delivered to the handler.
 *
 * The most recently installed event hook is executed first. If the
 * hook is already installed, it is moved to the front of the list.
 */
export
function installEventHook(handler: IEventHandler, hook: IEventHook): void {
  removeEventHook(handler, hook);
  var data = ensureData(handler);
  data.eventHooks = { next: data.eventHooks, hook: hook };
}


/**
 * Remove an event hook installed for an event handler.
 *
 * It is safe to call this function while the event hook is executing.
 *
 * If the given hook is not installed, this is a no-op.
 */
export
function removeEventHook(handler: IEventHandler, hook: IEventHook): void {
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    return;
  }
  var link = data.eventHooks;
  var prev: typeof link = null;
  while (link !== null) {
    if (link.hook === hook) {
      if (prev === null) {
        data.eventHooks = link.next;
      } else {
        prev.next = link.next;
      }
      link.hook = null;
      link.next = null;
      return;
    }
    prev = link;
    link = link.next;
  }
}


/**
 * Clear all data associated with the event handler.
 *
 * This removes all posted events and event hooks for the handler.
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
  var link = data.eventHooks;
  while (link !== null) {
    var next = link.next;
    link.hook = null;
    link.next = null;
    link = next;
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
 * A node in a singly-linked event hook list.
 */
interface IEventHookLink {
  /**
   * The next link in the list.
   */
  next: IEventHookLink;

  /**
   * Construct a new event hook link.
   */
  hook: IEventHook;
}


/**
 * An object which holds data for an event handler.
 */
interface IEventHandlerData {
  /**
   * The queue of posted events for the handler.
   */
  postedEvents: IQueue<ICoreEvent>;

  /**
   * The event hooks installed for the handler.
   */
  eventHooks: IEventHookLink;
}


/**
 * Get the data object for an event handler, creating it if necessary.
 */
function ensureData(handler: IEventHandler): IEventHandlerData {
  var data = handlerDataMap.get(handler);
  if (data === void 0) {
    data = { postedEvents: null, eventHooks: null };
    handlerDataMap.set(handler, data);
  }
  return data;
}


/**
 * Get the posted events queue for a handler, creating it if necessary.
 */
function ensureEventQueue(handler: IEventHandler): IQueue<ICoreEvent> {
  var data = ensureData(handler);
  if (data.postedEvents === null) {
    data.postedEvents = new Queue<ICoreEvent>();
  }
  return data.postedEvents;
}


/**
 * Run the event hooks installed for the event handler.
 *
 * Returns true if the event should be filtered, false otherwise.
 */
function runEventHooks(handler: IEventHandler, event: ICoreEvent): boolean {
  var data = handlerDataMap.get(handler);
  if (data === void 0 || data.eventHooks === null) {
    return false;
  }
  var link = data.eventHooks;
  if (link.next === null) {
    return link.hook.hookEvent(handler, event);
  }
  var links: typeof link[] = [];
  while (link !== null) {
    links.push(link);
    link = link.next;
  }
  var filter = false;
  for (var i = 0, n = links.length; i < n; ++i) {
    link = links[i];
    if (link.hook !== null && link.hook.hookEvent(handler, event)) {
      filter = true;
    }
  }
  return filter;
}


/**
 * Compress an event posted to the handler, if appropriate.
 *
 * Returns true if the event was compressed, false otherwise.
 */
function compressEvent(
  handler: IEventHandler,
  event: ICoreEvent,
  postedEvents: IQueue<ICoreEvent>): boolean {
  if (postedEvents.length > 0 || handler.compressEvent === void 0) {
    return false;
  }
  return handler.compressEvent(event, postedEvents);
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
