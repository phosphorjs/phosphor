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
class Queue<T> {
  /**
   * Construct a new queue.
   */
  constructor(items?: T[]) {
    if (items) items.forEach(it => { this.pushBack(it) });
  }

  /**
   * The number of elements in the queue.
   */
  get size(): number {
    return this._size;
  }

  /**
   * True if the queue has elements, false otherwise.
   */
  get empty(): boolean {
    return this._size === 0;
  }

  /**
   * The value at the front of the queue.
   */
  get front(): T {
    return this._front !== null ? this._front.value : void 0;
  }

  /**
   * The value at the back of the queue.
   */
  get back(): T {
    return this._back !== null ? this._back.value : void 0;
  }

  /**
   * Push a value onto the back of the queue.
   */
  pushBack(value: T): void {
    var link: IQueueLink<T> = { next: null, value: value };
    if (this._back === null) {
      this._front = link;
      this._back = link;
    } else {
      this._back.next = link;
      this._back = link;
    }
    this._size++;
  }

  /**
   * Pop and return the value at the front of the queue.
   */
  popFront(): T {
    var link = this._front;
    if (link === null) {
      return void 0;
    }
    if (link.next === null) {
      this._front = null;
      this._back = null;
    } else {
      this._front = link.next;
    }
    this._size--;
    return link.value;
  }

  /**
   * Remove all values from the queue.
   */
  clear(): void {
    this._size = 0;
    this._front = null;
    this._back = null;
  }

  /**
   * Create an array from the values in the queue.
   */
  toArray(): T[] {
    var result: T[] = [];
    var link = this._front;
    while (link !== null) {
      result.push(link.value);
      link = link.next;
    }
    return result;
  }

  /**
   * Returns true if any value in the queue passes the given test.
   */
  some(pred: IPredicate<T>): boolean {
    var i = 0;
    var link = this._front;
    while (link !== null) {
      if (pred(link.value, i++)) return true;
      link = link.next;
    }
    return false;
  }

  /**
   * Returns true if all values in the queue pass the given test.
   */
  every(pred: IPredicate<T>): boolean {
    var i = 0;
    var link = this._front;
    while (link !== null) {
      if (!pred(link.value, i++)) return false;
      link = link.next;
    }
    return true;
  }

  /**
   * Create an array of the values which pass the given test.
   */
  filter(pred: IPredicate<T>): T[] {
    var i = 0;
    var result: T[];
    var link = this._front;
    while (link !== null) {
      var value = link.value;
      if (pred(value, i++)) result.push(value);
      link = link.next;
    }
    return result;
  }

  /**
   * Create an array of callback results for each value in the queue.
   */
  map<U>(callback: ICallback<T, U>): U[] {
    var i = 0;
    var result: U[];
    var link = this._front;
    while (link !== null) {
      result.push(callback(link.value, i++));
      link = link.next;
    }
    return result;
  }

  /**
   * Execute a callback for each element in queue.
   *
   * Iteration will terminate if the callbacks returns a value other
   * than `undefined`. That value will be returned from this method.
   */
  forEach<U>(callback: ICallback<T, U>): U {
    var i = 0;
    var link = this._front;
    while (link !== null) {
      var result = callback(link.value, i++);
      if (result !== void 0) return result;
      link = link.next;
    }
    return void 0;
  }

  private _size = 0;
  private _front: IQueueLink<T> = null;
  private _back: IQueueLink<T> = null;
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

} // module phosphor.collections
