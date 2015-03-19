/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * A canonical singly linked FIFO queue.
 */
export
class Queue<T> implements IQueue<T> {
  /**
   * Construct a new queue.
   */
  constructor(items?: IIterable<T>) {
    if (items !== void 0) {
      for (var iter = items.iterator(); iter.moveNext();) {
        this.pushBack(iter.current);
      }
    }
  }

  /**
   * True if the queue has elements, false otherwise.
   */
  get empty(): boolean {
    return this._m_size === 0;
  }

  /**
   * The number of elements in the queue.
   */
  get size(): number {
    return this._m_size;
  }

  /**
   * The value at the front of the queue.
   */
  get front(): T {
    return this._m_front !== null ? this._m_front.value : void 0;
  }

  /**
   * The value at the back of the queue.
   */
  get back(): T {
    return this._m_back !== null ? this._m_back.value : void 0;
  }

  /**
   * Get an iterator for the elements in the queue.
   */
  iterator(): IIterator<T> {
    return new QueueIterator(this._m_front);
  }

  /**
   * Test whether the queue contains the given value.
   */
  contains(value: T): boolean {
    var link = this._m_front;
    while (link !== null) {
      if (link.value === value) {
        return true;
      }
      link = link.next;
    }
    return false;
  }

  /**
   * Add a value to the end of the queue.
   *
   * This method always succeeds.
   */
  add(value: T): boolean {
    this.pushBack(value);
    return true;
  }

  /**
   * Push a value onto the back of the queue.
   */
  pushBack(value: T): void {
    var link = createLink(value);
    if (this._m_back === null) {
      this._m_front = link;
      this._m_back = link;
    } else {
      this._m_back.next = link;
      this._m_back = link;
    }
    this._m_size++;
  }

  /**
   * Pop and return the value at the front of the queue.
   */
  popFront(): T {
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
    this._m_size--;
    var value = link.value;
    releaseLink(link);
    return value;
  }

  /**
   * Remove the first matching value from the queue.
   *
   * Returns false if the value is not in the queue.
   */
  remove(value: T): boolean {
    var link = this._m_front;
    var prev: typeof link = null;
    while (link !== null) {
      if (link.value === value) {
        if (prev === null) {
          this._m_front = link.next;
        } else {
          prev.next = link.next;
        }
        if (link.next === null) {
          this._m_back = prev;
        }
        this._m_size--;
        releaseLink(link);
        return true;
      }
      prev = link;
      link = link.next;
    }
    return false;
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
    this._m_size = 0;
    this._m_front = null;
    this._m_back = null;
  }

  /**
   * Returns an array containing all elements in the queue.
   */
  toArray(): T[] {
    var result: T[] = [];
    var link = this._m_front;
    while (link !== null) {
      result.push(link.value);
      link = link.next;
    }
    return result;
  }

  private _m_size = 0;
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


/**
 * An iterator for a Queue.
 */
class QueueIterator<T> implements IIterator<T> {
  /**
   * Construct a new queue iterator.
   */
  constructor(link: IQueueLink<T>) {
    this._m_link = { next: link, value: void 0 };
  }

  /**
   * The current value of the iterable.
   *
   * Returns `undefined` if there is no current value.
   */
  get current(): T {
    return this._m_current;
  }

  /**
   * Move the iterator to the next value.
   *
   * Returns true on success, false when the iterator is exhausted.
   */
  moveNext(): boolean {
    var link = this._m_link;
    if (link === null) {
      return false;
    }
    var next = link.next;
    if (next === null) {
      this._m_link = null;
      this._m_current = void 0;
      return false;
    }
    this._m_link = next;
    this._m_current = next.value;
    return true;
  }

  /**
   * Returns `this` to make the iterator iterable.
   */
  iterator(): IIterator<T> {
    return this;
  }

  private _m_link: IQueueLink<T>;
  private _m_current: T = void 0;
}

} // module phosphor.collections
