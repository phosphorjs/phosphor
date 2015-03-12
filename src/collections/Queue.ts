/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IQueue = require('./IQueue');

export = Queue;


/**
 * A concrete implementation of IQueue.
 */
class Queue<T> implements IQueue<T> {
  /**
   * Construct a new queue.
   */
  constructor() { }

  /**
   * The length of the queue.
   */
  get length(): number {
    return this._m_length;
  }

  /**
   * The value at the front of the queue.
   */
  get front(): T {
    var front = this._m_front;
    return front !== null ? front.value : void 0;
  }

  /**
   * The value at the back of the queue.
   */
  get back(): T {
    var back = this._m_back;
    return back !== null ? back.value : void 0;
  }

  /**
   * Push a value onto the back of the queue.
   */
  push(value: T): void {
    var link = createLink(value);
    if (this._m_back === null) {
      this._m_front = link;
      this._m_back = link;
    } else {
      this._m_back.next = link;
      this._m_back = link;
    }
    this._m_length++;
  }

  /**
   * Pop and return the first value in the queue.
   */
  pop(): T {
    var link = this._m_front;
    if (link === null) {
      return void 0;
    }
    if (link.next === null) {
      this._m_front = null;
      this._m_back = null;
    } else {
      this._m_front = link.next;
    }
    this._m_length--;
    var value = link.value;
    releaseLink(link);
    return value;
  }

  /**
   * Remove all values from the queue.
   */
  clear(): void {
    var link = this._m_front;
    while (link !== null) {
      var next = link.next;
      releaseLink(link);
      link = next;
    }
    this._m_length = 0;
    this._m_front = null;
    this._m_back = null;
  }

  /**
   * Execute a callback for each value in the queue.
   *
   * It is not safe to modify the queue while iterating.
   */
  forEach(callback: (value: T, index: number) => void): void {
    var i = 0;
    var link = this._m_front;
    while (link !== null) {
      callback(link.value, i++);
      link = link.next;
    }
  }

  /**
   * Returns true if all values pass the given test.
   *
   * It is not safe to modify the queue while iterating.
   */
  every(callback: (value: T, index: number) => boolean): boolean {
    var i = 0;
    var link = this._m_front;
    while (link !== null) {
      if (!callback(link.value, i++)) {
        return false;
      }
      link = link.next;
    }
    return true;
  }

  /**
   * Returns true if any value passes the given test.
   *
   * It is not safe to modify the queue while iterating.
   */
  some(callback: (value: T, index: number) => boolean): boolean {
    var i = 0;
    var link = this._m_front;
    while (link !== null) {
      if (callback(link.value, i++)) {
        return true;
      }
      link = link.next;
    }
    return false;
  }

  private _m_length = 0;
  private _m_front: IQueueLink<T> = null;
  private _m_back: IQueueLink<T> = null;
}


/**
 * A link node in a queue.
 */
interface IQueueLink<T> {
  /**
   * The next link in the chain.
   */
  next: IQueueLink<T>;

  /**
   * The value for the link.
   */
  value: T;
}


/**
 * The maximum size of the queue link pool.
 */
var MAX_POOL_SIZE = 10000;


/**
 * A shared pool of queue links.
 */
var linkPool: IQueueLink<any>[] = [];


/**
 * Create a new link with the given value.
 *
 * This will use a link from the pool if available.
 */
function createLink<T>(value: T): IQueueLink<T> {
  if (linkPool.length > 0) {
    var link = linkPool.pop();
    link.value = value;
    return link;
  }
  return { next: null, value: value };
}


/**
 * Release a link back to the pool.
 */
function releaseLink(link: IQueueLink<any>): void {
  link.next = null;
  link.value = void 0;
  if (linkPool.length < MAX_POOL_SIZE) {
    linkPool.push(link);
  }
}
