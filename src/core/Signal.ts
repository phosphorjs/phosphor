/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {


/**
 * An object used for loosely coupled inter-object communication.
 *
 * A signal is emitted by an object in response to some event. User
 * code may connect listener functions (slots) to the signal to be
 * notified when that event occurs. This is a simple and efficient
 * form of the pub-sub pattern which promotes type-safe and loosely
 * coupled communication between objects.
 */
export
class Signal<T, U> {
  /**
   * Construct a new signal.
   */
  constructor() { }

  /**
   * Connect a slot to the signal.
   *
   * Slot connections are not de-duplicated. If the slot is connected
   * to the signal multiple times, it will be invoked multiple times
   * when the signal is emitted.
   *
   * It is safe to connect a slot while the signal is being emitted.
   * The slot will be invoked the next time the signal is emitted.
   */
  connect(slot: (sender: T, args: U) => void, thisArg?: any): void {
    var wrapper = new SlotWrapper(slot, thisArg);
    var slots = this._m_slots;
    if (slots === null) {
      this._m_slots = wrapper;
    } else if (slots instanceof SlotWrapper) {
      this._m_slots = [slots, wrapper];
    } else {
      (<SlotWrapper<T, U>[]>slots).push(wrapper);
    }
  }

  /**
   * Disconnect a slot from the signal.
   *
   * This will remove all connections to the slot, even if the slot
   * was connected multiple times. If no slot is provided, all slots
   * will be disconnected.
   *
   * It is safe to disconnect a slot while the signal is being emitted.
   * The slot is removed immediately and will not be invoked.
   */
  disconnect(slot?: (sender: T, args: U) => void, thisArg?: any): void {
    var slots = this._m_slots;
    if (slots === null) {
      return;
    }
    if (slots instanceof SlotWrapper) {
      if (!slot || slots.equals(slot, thisArg)) {
        slots.clear();
        this._m_slots = null;
      }
    } else if (!slot) {
      var array = <SlotWrapper<T, U>[]>slots;
      for (var i = 0, n = array.length; i < n; ++i) {
        array[i].clear();
      }
      this._m_slots = null;
    } else {
      var rest: SlotWrapper<T, U>[] = [];
      var array = <SlotWrapper<T, U>[]>slots;
      for (var i = 0, n = array.length; i < n; ++i) {
        var wrapper = array[i];
        if (wrapper.equals(slot, thisArg)) {
          wrapper.clear();
        } else {
          rest.push(wrapper);
        }
      }
      if (rest.length === 0) {
        this._m_slots = null;
      } else if (rest.length === 1) {
        this._m_slots = rest[0];
      } else {
        this._m_slots = rest;
      }
    }
  }

  /**
   * Test whether a slot is connected to the signal.
   */
  isConnected(slot: (sender: T, args: U) => void, thisArg?: any): boolean {
    var slots = this._m_slots;
    if (slots === null) {
      return false;
    }
    if (slots instanceof SlotWrapper) {
      return slots.equals(slot, thisArg);
    }
    var array = <SlotWrapper<T, U>[]>slots;
    for (var i = 0, n = array.length; i < n; ++i) {
      if (array[i].equals(slot, thisArg)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Emit the signal and invoke its connected slots.
   *
   * Slots are invoked in the order in which they are connected.
   */
  emit(sender: T, args: U): void {
    var slots = this._m_slots;
    if (slots === null) {
      return;
    }
    if (slots instanceof SlotWrapper) {
      slots.invoke(sender, args);
    } else {
      var array = <SlotWrapper<T, U>[]>slots;
      for (var i = 0, n = array.length; i < n; ++i) {
        array[i].invoke(sender, args);
      }
    }
  }

  private _m_slots: SlotWrapper<T, U> | SlotWrapper<T, U>[] = null;
}


/**
 * A thin wrapper around a slot function and context object.
 */
class SlotWrapper<T, U> {
  /**
   * Construct a new slot wrapper.
   */
  constructor(slot: (sender: T, args: U) => void, thisArg: any) {
    this._m_slot = slot;
    this._m_thisArg = thisArg;
  }

  /**
   * Clear the contents of the slot wrapper.
   */
  clear(): void {
    this._m_slot = null;
    this._m_thisArg = null;
  }

  /**
   * Test whether the wrapper equals a slot and context.
   */
  equals(slot: (sender: T, args: U) => void, thisArg: any): boolean {
    return this._m_slot === slot && this._m_thisArg === thisArg;
  }

  /**
   * Invoke the wrapper slot with the given sender and args.
   *
   * This is a no-op if the wrapper has been cleared.
   */
  invoke(sender: T, args: U): void {
    if (this._m_slot) {
      this._m_slot.call(this._m_thisArg, sender, args);
    }
  }

  private _m_slot: (sender: T, args: U) => void;
  private _m_thisArg: any;
}

} // module phosphor.core
