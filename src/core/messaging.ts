/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each, some
} from '../algorithm/iteration';

import {
  Queue
} from '../collections/queue';


/**
 * A message which can be delivered to a message handler.
 *
 * #### Notes
 * This class may be subclassed to create complex message types.
 *
 * **See also:** [[postMessage]] and [[sendMessage]].
 */
export
class Message {
  /**
   * Construct a new message.
   *
   * @param type - The type of the message.
   */
  constructor(type: string) {
    this._type = type;
  }

  /**
   * The type of the message.
   *
   * #### Notes
   * This value can be used to cast the message to a derived type.
   *
   * This is a read-only property.
   */
  get type(): string {
    return this._type;
  }

  /**
   * Test whether the message is conflatable.
   *
   * #### Notes
   * Message conflation is an advanced topic. Most message types will
   * not make use of this feature.
   *
   * If a conflatable message is posted to the event queue when another
   * conflatable message of the same type and handler has already been
   * posted, the `conflate()` method of the existing message will be
   * invoked. If that method returns `true`, the new message will not
   * be enqueued. This allows messages to be compressed, so that only
   * a single instance of the message type is processed per cycle, no
   * matter how many times messages of that type are posted.
   *
   * Custom message types may reimplement this property. The default
   * implementation is always `false`.
   *
   * This is a read-only property.
   *
   * **See also:** [[conflateMessage]]
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
   * was successfully conflated and it will not be enqueued.
   *
   * If this method returns `false`, the other message will be enqueued
   * for normal delivery.
   *
   * Custom message types may reimplement this method. The default
   * implementation always returns `false`.
   *
   * **See also:** [[isConflatable]]
   */
  conflate(other: Message): boolean {
    return false;
  }

  private _type: string;
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
   *
   * This is a read-only property.
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
 *
 * **See also:** [[postMessage]] and [[sendMessage]].
 */
export
interface IMessageHandler {
  /**
   * Process a message sent to the handler.
   *
   * @param msg - The message to be processed.
   */
  processMessage(msg: Message): void;
}


/**
 * A function which intercepts messages sent to a message handler.
 *
 * @param handler - The target handler of the message.
 *
 * @param msg - The message to be sent to the handler.
 *
 * @returns `true` if the message should continue to be processed
 *   as normal, or `false` if processing should cease immediately.
 *
 * #### Notes
 * A message hook is useful for intercepting or spying on messages
 * sent to message handlers which were either not created by the
 * consumer, or when subclassing the handler is not feasible.
 *
 * If the function returns `false`, no other message hooks will be
 * invoked and the message will not be delivered to the handler.
 *
 * If all installed message hooks return `true`, the message will
 * be delivered to the handler for processing.
 *
 * **See also:** [[installMessageHook]] and [[removeMessageHook]]
 */
export
type MessageHook = (handler: IMessageHandler, msg: Message) => boolean;


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
function sendMessage(handler: IMessageHandler, msg: Message): void {
  MessageLoop.sendMessage(handler, msg);
}


/**
 * Post a message to the message handler to process in the future.
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
function postMessage(handler: IMessageHandler, msg: Message): void {
  MessageLoop.postMessage(handler, msg);
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
 * If the hook is already installed, it will be moved to the front.
 *
 * **See also:** [[removeMessageHook]]
 */
export
function installMessageHook(handler: IMessageHandler, hook: MessageHook): void {
  MessageLoop.installMessageHook(handler, hook);
}


/**
 * Remove an installed message hook for a message handler.
 *
 * @param handler - The message handler of interest.
 *
 * @param hook - The message hook to remove.
 *
 * #### Notes
 * If the hook is not installed, this is a no-op.
 *
 * It is safe to call this function while the hook is executing.
 */
export
function removeMessageHook(handler: IMessageHandler, hook: MessageHook): void {
  MessageLoop.removeMessageHook(handler, hook);
}


/**
 * Clear all message data associated with a message handler.
 *
 * @param handler - The message handler of interest.
 *
 * #### Notes
 * This will clear all pending messages and hooks for the handler.
 */
export
function clearMessageData(handler: IMessageHandler): void {
  MessageLoop.clearMessageData(handler);
}


/**
 * The namespace for the global singleton message loop.
 */
namespace MessageLoop {
  /**
   * Send a message to a handler for immediate processing.
   *
   * This will first call all message hooks for the handler. If any
   * hook rejects the message, the message will not be delivered.
   */
  export
  function sendMessage(handler: IMessageHandler, msg: Message): void {
    // Handle the common case of no message hooks.
    let node = hooks.get(handler);
    if (node === void 0) {
      invokeHandler(handler, msg);
      return;
    }

    // Run the message hooks and bail early if any hook returns false.
    // A null hook indicates the hook was removed during dispatch.
    for (; node !== null; node = node.next) {
      if (node.hook !== null && !invokeHook(node.hook, handler, msg)) {
        return;
      }
    }

    // All message hooks returned true, so invoke the handler.
    invokeHandler(handler, msg);
  }

  /**
   * Post a message to a handler for processing in the future.
   *
   * This will first conflate the message, if possible. If it cannot
   * be conflated, it will be queued for delivery on the next cycle
   * of the event loop.
   */
  export
  function postMessage(handler: IMessageHandler, msg: Message): void {
    // Handle the common case a non-conflatable message first.
    if (!msg.isConflatable) {
      enqueueMessage(handler, msg);
      return;
    }

    // Conflate message if possible.
    let conflated = some(queue, posted => {
      if (posted.handler !== handler) {
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

    // If the message was not conflated, enqueue the message.
    if (!conflated) enqueueMessage(handler, msg);
  }

  /**
   * Install a message hook for a handler.
   *
   * This will first remove the hook if it exists, then install the
   * hook in front of other hooks for the handler.
   */
  export
  function installMessageHook(handler: IMessageHandler, hook: MessageHook): void {
    // Remove the message hook if it's already installed.
    removeMessageHook(handler, hook);

    // Install the hook at the front of the list.
    let next = hooks.get(handler) || null;
    hooks.set(handler, { next, hook });
  }

  /**
   * Remove a message hook for a handler, if it exists.
   */
  export
  function removeMessageHook(handler: IMessageHandler, hook: MessageHook): void {
    // Traverse the list and find the matching hook. If found, clear
    // the reference to the hook and remove the node from the list.
    // The node's next reference is *not* cleared so that dispatch
    // may continue when the hook is removed during dispatch.
    let prev: HookNode | null = null;
    let node = hooks.get(handler) || null;
    for (; node !== null; prev = node, node = node.next) {
      if (node.hook === hook) {
        if (prev === null && node.next === null) {
          hooks.delete(handler);
        } else if (prev === null) {
          hooks.set(handler, node.next);
        } else {
          prev.next = node.next;
        }
        node.hook = null;
        return;
      }
    }
  }

  /**
   * Clear all message data for a handler.
   *
   * This will remove all message hooks and clear pending messages.
   */
  export
  function clearMessageData(handler: IMessageHandler): void {
    // Clear all message hooks.
    let node = hooks.get(handler) || null;
    for (; node !== null; node = node.next) {
      node.hook = null;
    }

    // Remove the handler from the hooks map.
    hooks.delete(handler);

    // Clear all pending messages.
    each(queue, posted => {
      if (posted.handler === handler) {
        posted.handler = null;
      }
    });
  }

  /**
   * A type alias for a posted message pair.
   */
  type PostedMessage = { handler: IMessageHandler, msg: Message };

  /**
   * A type alias for a node in a message hook list.
   */
  type HookNode = { next: HookNode, hook: MessageHook | null };

  /**
   * The queue of posted message pairs.
   */
  const queue = new Queue<PostedMessage>();

  /**
   * A mapping of handler to list of installed message hooks.
   */
  const hooks = new WeakMap<IMessageHandler, HookNode>();

  /**
   * A local reference to an event loop callback.
   */
  const defer = (() => {
    let ok = typeof requestAnimationFrame === 'function';
    return ok ? requestAnimationFrame : setImmediate;
  })();

  /**
   * Whether a message loop cycle is pending.
   */
  let cyclePending = false;

  /**
   * Invoke a message hook with the specified handler and message.
   *
   * Returns the result of the hook, or `true` if the hook throws.
   *
   * Exceptions in the hook will be caught and logged.
   */
  function invokeHook(hook: MessageHook, handler: IMessageHandler, msg: Message): boolean {
    let result: boolean;
    try {
      result = hook(handler, msg);
    } catch (err) {
      result = true;
      console.error(err);
    }
    return result;
  }

  /**
   * Invoke a message handler with the specified message.
   *
   * Exceptions in the handler will be caught and logged.
   */
  function invokeHandler(handler: IMessageHandler, msg: Message): void {
    try {
      handler.processMessage(msg);
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add a message to the end of the message queue.
   *
   * This will automatically schedule a cycle of the loop.
   */
  function enqueueMessage(handler: IMessageHandler, msg: Message): void {
    queue.pushBack({ handler, msg });
    scheduleMessageLoop();
  }

  /**
   * Schedule a message loop cycle to process any pending messages.
   *
   * This is a no-op if a loop cycle is already pending.
   */
  function scheduleMessageLoop(): void {
    if (!cyclePending) {
      defer(runMessageLoop);
      cyclePending = true;
    }
  }

  /**
   * Run an iteration of the message loop.
   *
   * This will process all pending messages in the queue. If a message
   * is added to the queue while the message loop is running, it will
   * be processed on the next cycle of the loop.
   */
  function runMessageLoop(): void {
    // Clear the pending flag so the next loop can be scheduled.
    cyclePending = false;

    // If the queue is empty, there is nothing else to do.
    if (queue.isEmpty) {
      return;
    }

    // Add a sentinel value to the end of the queue. The queue will
    // only be processed up to the sentinel. Messages posted during
    // this cycle will execute on the next cycle.
    let sentinel: PostedMessage = { handler: null, msg: null };
    queue.pushBack(sentinel);

    // Enter the message loop.
    while (!queue.isEmpty) {
      // Remove the first posted message in the queue.
      let posted = queue.popFront()!;

      // If the value is the sentinel, exit the loop.
      if (posted === sentinel) {
        return;
      }

      // Dispatch the message if the handler has not been cleared.
      if (posted.handler !== null) {
        sendMessage(posted.handler, posted.msg);
      }
    }
  }
}
