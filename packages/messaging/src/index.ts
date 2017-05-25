/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, each, every, retro, some
} from '@phosphor/algorithm';

import {
  LinkedList
} from '@phosphor/collections';


/**
 * A message which can be delivered to a message handler.
 *
 * #### Notes
 * This class may be subclassed to create complex message types.
 */
export
class Message {
  /**
   * Construct a new message.
   *
   * @param type - The type of the message.
   */
  constructor(type: string) {
    this.type = type;
  }

  /**
   * The type of the message.
   *
   * #### Notes
   * The `type` of a message should be related directly to its actual
   * runtime type. This means that `type` can and will be used to cast
   * the message to the relevant derived `Message` subtype.
   */
  readonly type: string;

  /**
   * Test whether the message is conflatable.
   *
   * #### Notes
   * Message conflation is an advanced topic. Most message types will
   * not make use of this feature.
   *
   * If a conflatable message is posted to a handler while another
   * conflatable message of the same `type` has already been posted
   * to the handler, the `conflate()` method of the existing message
   * will be invoked. If that method returns `true`, the new message
   * will not be enqueued. This allows messages to be compressed, so
   * that only a single instance of the message type is processed per
   * cycle, no matter how many times messages of that type are posted.
   *
   * Custom message types may reimplement this property.
   *
   * The default implementation is always `false`.
   */
  get isConflatable(): boolean {
    return false;
  }

  /**
   * Conflate this message with another message of the same `type`.
   *
   * @param other - A conflatable message of the same `type`.
   *
   * @returns `true` if the message was successfully conflated, or
   *   `false` otherwise.
   *
   * #### Notes
   * Message conflation is an advanced topic. Most message types will
   * not make use of this feature.
   *
   * This method is called automatically by the message loop when the
   * given message is posted to the handler paired with this message.
   * This message will already be enqueued and conflatable, and the
   * given message will have the same `type` and also be conflatable.
   *
   * This method should merge the state of the other message into this
   * message as needed so that when this message is finally delivered
   * to the handler, it receives the most up-to-date information.
   *
   * If this method returns `true`, it signals that the other message
   * was successfully conflated and that message will not be enqueued.
   *
   * If this method returns `false`, the other message will be enqueued
   * for normal delivery.
   *
   * Custom message types may reimplement this method.
   *
   * The default implementation always returns `false`.
   */
  conflate(other: Message): boolean {
    return false;
  }
}


/**
 * A convenience message class which conflates automatically.
 *
 * #### Notes
 * Message conflation is an advanced topic. Most user code will not
 * make use of this class.
 *
 * This message class is useful for creating message instances which
 * should be conflated, but which have no state other than `type`.
 *
 * If conflation of stateful messages is required, a custom `Message`
 * subclass should be created.
 */
export
class ConflatableMessage extends Message {
  /**
   * Test whether the message is conflatable.
   *
   * #### Notes
   * This property is always `true`.
   */
  get isConflatable(): boolean {
    return true;
  }

  /**
   * Conflate this message with another message of the same `type`.
   *
   * #### Notes
   * This method always returns `true`.
   */
  conflate(other: ConflatableMessage): boolean {
    return true;
  }
}


/**
 * An object which handles messages.
 *
 * #### Notes
 * A message handler is a simple way of defining a type which can act
 * upon on a large variety of external input without requiring a large
 * abstract API surface. This is particularly useful in the context of
 * widget frameworks where the number of distinct message types can be
 * unbounded.
 */
export
interface IMessageHandler {
  /**
   * Process a message sent to the handler.
   *
   * @param msg - The message to be processed.
   */
  processMessage(msg: Message): void | Promise<void>;
}


/**
 * An object which intercepts messages sent to a message handler.
 *
 * #### Notes
 * A message hook is useful for intercepting or spying on messages
 * sent to message handlers which were either not created by the
 * consumer, or when subclassing the handler is not feasible.
 *
 * If `messageHook` returns `false`, no other message hooks will be
 * invoked and the message will not be delivered to the handler.
 *
 * If all installed message hooks return `true`, the message will
 * be delivered to the handler for processing.
 *
 * **See also:** [[installMessageHook]] and [[removeMessageHook]]
 */
export
interface IMessageHook {
  /**
   * Intercept a message sent to a message handler.
   *
   * @param handler - The target handler of the message.
   *
   * @param msg - The message to be sent to the handler.
   *
   * @returns `true` if the message should continue to be processed
   *   as normal, or `false` if processing should cease immediately.
   */
  messageHook(handler: IMessageHandler, msg: Message): boolean;
}


/**
 * A type alias for message hook object or function.
 *
 * #### Notes
 * The signature and semantics of a message hook function are the same
 * as the `messageHook` method of [[IMessageHook]].
 */
export
type MessageHook = IMessageHook | ((handler: IMessageHandler, msg: Message) => boolean);


/**
 * The namespace for the global singleton message loop.
 */
export
namespace MessageLoop {
  /**
   * Send a message to a message handler to process immediately.
   *
   * @param handler - The handler which should process the message.
   *
   * @param msg - The message to deliver to the handler.
   *
   * #### Notes
   * The message will first be sent through any installed message hooks
   * for the handler. If the message passes all hooks, it will then be
   * delivered to the `processMessage` method of the handler.
   *
   * The message will not be conflated with pending posted messages.
   *
   * Exceptions in hooks and handlers will be caught and logged.
   */
  export
  function sendMessage(handler: IMessageHandler, msg: Message): Promise<void> {
    // Lookup the message hooks for the handler.
    let hooks = messageHooks.get(handler);

    // Handle the common case of no installed hooks.
    if (!hooks || hooks.length === 0) {
      return invokeHandler(handler, msg);
    }

    // Invoke the message hooks starting with the newest first.
    let passed = every(retro(hooks), hook => {
      return hook ? invokeHook(hook, handler, msg) : true;
    });

    // Invoke the handler if the message passes all hooks.
    if (passed) {
      return invokeHandler(handler, msg);
    }
    return Promise.reject("sendMessage - not invoked.");
  }

  /**
   * Post a message to a message handler to process in the future.
   *
   * @param handler - The handler which should process the message.
   *
   * @param msg - The message to post to the handler.
   *
   * #### Notes
   * The message will be conflated with the pending posted messages for
   * the handler, if possible. If the message is not conflated, it will
   * be queued for normal delivery on the next cycle of the event loop.
   *
   * Exceptions in hooks and handlers will be caught and logged.
   */
  export
  function postMessage(handler: IMessageHandler, msg: Message): Promise<any> {
    // Handle the common case of a non-conflatable message.
    if (!msg.isConflatable) {
      return enqueueMessage(handler, msg);
    }

    // Conflate the message with an existing message if possible.
    let conflated = some(messageQueue, posted => {
      if (posted.handler !== handler) {
        return false;
      }
      if (!posted.msg) {
        return false;
      }
      if (posted.msg.type !== msg.type) {
        return false;
      }
      if (!posted.msg.isConflatable) {
        return false;
      }
      return posted.msg.conflate(msg);
    });

    // Enqueue the message if it was not conflated.
    if (!conflated) {
      return enqueueMessage(handler, msg);
    }
    return Promise.resolve();
  }

  /**
   * Install a message hook for a message handler.
   *
   * @param handler - The message handler of interest.
   *
   * @param hook - The message hook to install.
   *
   * #### Notes
   * A message hook is invoked before a message is delivered to the
   * handler. If the hook returns `false`, no other hooks will be
   * invoked and the message will not be delivered to the handler.
   *
   * The most recently installed message hook is executed first.
   *
   * If the hook is already installed, this is a no-op.
   */
  export
  function installMessageHook(handler: IMessageHandler, hook: MessageHook): void {
    // Lookup the hooks for the handler.
    let hooks = messageHooks.get(handler);

    // Bail early if the hook is already installed.
    if (hooks && hooks.indexOf(hook) !== -1) {
      return;
    }

    // Add the hook to the end, so it will be the first to execute.
    if (!hooks) {
      messageHooks.set(handler, [hook]);
    } else {
      hooks.push(hook);
    }
  }

  /**
   * Remove an installed message hook for a message handler.
   *
   * @param handler - The message handler of interest.
   *
   * @param hook - The message hook to remove.
   *
   * #### Notes
   * It is safe to call this function while the hook is executing.
   *
   * If the hook is not installed, this is a no-op.
   */
  export
  function removeMessageHook(handler: IMessageHandler, hook: MessageHook): void {
    // Lookup the hooks for the handler.
    let hooks = messageHooks.get(handler);

    // Bail early if the hooks do not exist.
    if (!hooks) {
      return;
    }

    // Lookup the index of the hook and bail if not found.
    let i = hooks.indexOf(hook);
    if (i === -1) {
      return;
    }

    // Clear the hook and schedule a cleanup of the array.
    hooks[i] = null;
    scheduleCleanup(hooks);
  }

  /**
   * Clear all message data associated with a message handler.
   *
   * @param handler - The message handler of interest.
   *
   * #### Notes
   * This will clear all posted messages and hooks for the handler.
   */
  export
  function clearData(handler: IMessageHandler): void {
    // Lookup the hooks for the handler.
    let hooks = messageHooks.get(handler);

    // Clear all messsage hooks for the handler.
    if (hooks && hooks.length > 0) {
      ArrayExt.fill(hooks, null);
      scheduleCleanup(hooks);
    }

    // Clear all posted messages for the handler.
    each(messageQueue, posted => {
      if (posted.handler === handler) {
        posted.handler = null;
        posted.msg = null;
      }
    });
  }

  /**
   * Process the pending posted messages in the queue immediately.
   *
   * #### Notes
   * This function is useful when posted messages must be processed
   * immediately, instead of on the next animation frame.
   *
   * This function should normally not be needed, but it may be
   * required to work around certain browser idiosyncrasies.
   *
   * Recursing into this function is a no-op.
   */
  export
  function flush(): void {
    // Bail if recursion is detected or if there is no pending task.
    if (flushGuard || loopTaskID === 0) {
      return;
    }

    // Unschedule the pending loop task.
    unschedule(loopTaskID);

    // Run the message loop within the recursion guard.
    flushGuard = true;
    runMessageLoop();
    flushGuard = false;
  }

  /**
   * A type alias for the exception handler function.
   */
  export
  type ExceptionHandler = (err: Error) => void;

  /**
   * Get the message loop exception handler.
   *
   * @returns The current exception handler.
   *
   * #### Notes
   * The default exception handler is `console.error`.
   */
  export
  function getExceptionHandler(): ExceptionHandler {
    return exceptionHandler;
  }

  /**
   * Set the message loop exception handler.
   *
   * @param handler - The function to use as the exception handler.
   *
   * @returns The old exception handler.
   *
   * #### Notes
   * The exception handler is invoked when a message handler or a
   * message hook throws an exception.
   */
  export
  function setExceptionHandler(handler: ExceptionHandler): ExceptionHandler {
    let old = exceptionHandler;
    exceptionHandler = handler;
    return old;
  }

  /**
   * A type alias for a posted message pair.
   */
  type PostedMessage = { handler: IMessageHandler | null, msg: Message | null, resolve?: () => void, reject?: () => void };

  /**
   * The queue of posted message pairs.
   */
  const messageQueue = new LinkedList<PostedMessage>();

  /**
   * A mapping of handler to array of installed message hooks.
   */
  const messageHooks = new WeakMap<IMessageHandler, Array<MessageHook | null>>();

  /**
   * A set of message hook arrays which are pending cleanup.
   */
  const dirtySet = new Set<Array<MessageHook | null>>();

  /**
   * The message loop exception handler.
   */
  let exceptionHandler: ExceptionHandler = console.error;

  /**
   * The id of the pending loop task animation frame.
   */
  let loopTaskID = 0;

  /**
   * A guard flag to prevent flush recursion.
   */
  let flushGuard = false;

  /**
   * A function to schedule an event loop callback.
   */
  const schedule = (() => {
    let ok = typeof requestAnimationFrame === 'function';
    return ok ? requestAnimationFrame : setImmediate;
  })();

  /**
   * A function to unschedule an event loop callback.
   */
  const unschedule = (() => {
    let ok = typeof cancelAnimationFrame === 'function';
    return ok ? cancelAnimationFrame : clearImmediate;
  })();

  /**
   * Invoke a message hook with the specified handler and message.
   *
   * Returns the result of the hook, or `true` if the hook throws.
   *
   * Exceptions in the hook will be caught and logged.
   */
  function invokeHook(hook: MessageHook, handler: IMessageHandler, msg: Message): boolean {
    let result = true;
    try {
      if (typeof hook === 'function') {
        result = hook(handler, msg);
      } else {
        result = hook.messageHook(handler, msg);
      }
    } catch (err) {
      exceptionHandler(err);
    }
    return result;
  }

  /**
   * Invoke a message handler with the specified message.
   *
   * Exceptions in the handler will be caught and logged.
   */
  function invokeHandler(handler: IMessageHandler, msg: Message): Promise<void> {
    try {
      const retVal = handler.processMessage(msg);
      if (!retVal) {
        return Promise.resolve();
      }
      return retVal;
    } catch (err) {
      exceptionHandler(err);
    }
    return Promise.reject("invokeHandler Exception");
  }

  /**
   * Add a message to the end of the message queue.
   *
   * This will automatically schedule a run of the message loop.
   */
  function enqueueMessage(handler: IMessageHandler, msg: Message): Promise<any> {
    return new Promise((resolve, reject) => {
      // Add the posted message to the queue.
      messageQueue.addLast({ handler, msg, resolve, reject });

      // Bail if a loop task is already pending.
      if (loopTaskID !== 0) {
        return;
      }

      // Schedule a run of the message loop.
      loopTaskID = schedule(runMessageLoop);
    });
  }

  /**
   * Run an iteration of the message loop.
   *
   * This will process all pending messages in the queue. If a message
   * is added to the queue while the message loop is running, it will
   * be processed on the next cycle of the loop.
   */
  function runMessageLoop(): void {
    // Clear the task ID so the next loop can be scheduled.
    loopTaskID = 0;

    // If the message queue is empty, there is nothing else to do.
    if (messageQueue.isEmpty) {
      return;
    }

    // Add a sentinel value to the end of the queue. The queue will
    // only be processed up to the sentinel. Messages posted during
    // this cycle will execute on the next cycle.
    let sentinel: PostedMessage = { handler: null, msg: null };
    messageQueue.addLast(sentinel);

    // Enter the message loop.
    while (true) {
      // Remove the first posted message in the queue.
      let posted = messageQueue.removeFirst()!;

      // If the value is the sentinel, exit the loop.
      if (posted === sentinel) {
        return;
      }

      // Dispatch the message if it has not been cleared.
      if (posted.handler && posted.msg) {
        sendMessage(posted.handler, posted.msg).then(() => {
          if (posted.resolve) {
            posted.resolve();
          }
        }).catch((e) => {
          if (posted.reject) {
            posted.reject();
          }
        });
      }
    }
  }

  /**
   * Schedule a cleanup of a message hooks array.
   *
   * This will add the array to the dirty set and schedule a deferred
   * cleanup of the array contents. On cleanup, any `null` hook will
   * be removed from the array.
   */
  function scheduleCleanup(hooks: Array<MessageHook | null>): void {
    if (dirtySet.size === 0) {
      schedule(cleanupDirtySet);
    }
    dirtySet.add(hooks);
  }

  /**
   * Cleanup the message hook arrays in the dirty set.
   *
   * This function should only be invoked asynchronously, when the
   * stack frame is guaranteed to not be on the path of user code.
   */
  function cleanupDirtySet(): void {
    dirtySet.forEach(cleanupHooks);
    dirtySet.clear();
  }

  /**
   * Cleanup the dirty hooks in a message hooks array.
   *
   * This will remove any `null` hook from the array.
   *
   * This function should only be invoked asynchronously, when the
   * stack frame is guaranteed to not be on the path of user code.
   */
  function cleanupHooks(hooks: Array<MessageHook | null>): void {
    ArrayExt.removeAllWhere(hooks, isNull);
  }

  /**
   * Test whether a value is `null`.
   */
  function isNull<T>(value: T | null): boolean {
    return value === null;
  }
}
