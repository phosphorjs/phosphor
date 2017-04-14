/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDisposable
} from '@phosphor/disposable';

import {
  Drag
} from '@phosphor/dragdrop';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Widget
} from './widget';


/**
 * A widget which implements a canonical scroll bar.
 */
export
class ScrollBar extends Widget {
  /**
   * Construct a new scroll bar.
   *
   * @param options - The options for initializing the scroll bar.
   */
  constructor(options: ScrollBar.IOptions = {}) {
    super({ node: Private.createNode() });
    this.addClass('p-ScrollBar');
    this.setFlag(Widget.Flag.DisallowLayout);
    this._orientation = options.orientation || 'vertical';
    this.dataset['orientation'] = this._orientation;
  }

  /**
   * A signal emitted when the user moves the scroll bar thumb.
   *
   * The signal payload is the current `value` of the scroll bar.
   *
   * #### Notes
   * This signal is not emitted when `value` is changed procedurally.
   */
  get scrolled(): ISignal<this, number> {
    return this._scrolled;
  }

  /**
   * Get the orientation of the scroll bar.
   */
  get orientation(): ScrollBar.Orientation {
    return this._orientation;
  }

  /**
   * Set the orientation of the scroll bar.
   */
  set orientation(value: ScrollBar.Orientation) {
    // Do nothing if the orientation does not change.
    if (this._orientation === value) {
      return;
    }

    // Release the mouse before making changes.
    this._releaseMouse();

    // Update the internal orientation.
    this._orientation = value;
    this.dataset['orientation'] = value;

    // Schedule an update the scroll bar.
    this.update();
  }

  /**
   * Get the current value of the scroll bar.
   *
   * #### Notes
   * The value is represented as a percentage between `0` and `1`.
   */
  get value(): number {
    return this._value;
  }

  /**
   * Set the current value of the scroll bar.
   *
   * #### Notes
   * The value is represented as a percentage between `0` and `1`.
   */
  set value(value: number) {
    // Clamp the value to the allowable range.
    value = Math.max(0, Math.min(value, 1));

    // Do nothing if the value does not change.
    if (this._value === value) {
      return;
    }

    // Update the internal value.
    this._value = value;

    // Schedule an update the scroll bar.
    this.update();
  }

  /**
   * Get the page size of the scroll bar.
   *
   * #### Notes
   * The page size controls the size of the scroll thumb. It should be
   * set to a value which represents a single "page" of content, as a
   * percentage between `0` and `1`.
   */
  get pageSize(): number {
    return this._pageSize;
  }

  /**
   * Set the page size of the scroll bar.
   *
   * #### Notes
   * The page size controls the size of the scroll thumb. It should be
   * set to a value which represents a single "page" of content, as a
   * percentage between `0` and `1`.
   */
  set pageSize(value: number) {
    // Clamp the page size to the allowable range.
    value = Math.max(0, Math.min(value, 1));

    // Do nothing if the value does not change.
    if (this._pageSize === value) {
      return;
    }

    // Update the internal page size.
    this._pageSize = value;

    // Schedule an update the scroll bar.
    this.update();
  }

  /**
   * The scroll bar increment button node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get incrementButtonNode(): HTMLDivElement {
    return this.node.getElementsByClassName('p-ScrollBar-button')[0] as HTMLDivElement;
  }

  /**
   * The scroll bar decrement button node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get decrementButtonNode(): HTMLDivElement {
    return this.node.getElementsByClassName('p-ScrollBar-button')[1] as HTMLDivElement;
  }

  /**
   * The scroll bar track node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get trackNode(): HTMLDivElement {
    return this.node.getElementsByClassName('p-ScrollBar-track')[0] as HTMLDivElement;
  }

  /**
   * The scroll bar thumb node.
   *
   * #### Notes
   * Modifying this node directly can lead to undefined behavior.
   */
  get thumbNode(): HTMLDivElement {
    return this.node.getElementsByClassName('p-ScrollBar-thumb')[0] as HTMLDivElement;
  }

  /**
   * Handle the DOM events for the scroll bar.
   *
   * @param event - The DOM event sent to the scroll bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
      break;
    }
  }

  /**
   * A method invoked on a 'before-attach' message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('mousedown', this);
    this.update();
  }

  /**
   * A method invoked on an 'after-detach' message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('mousedown', this);
  }

  /**
   * A method invoked on an 'update-request' message.
   */
  protected onUpdateRequest(msg: Message): void {
    let value = this._value;
    let pageSize = this._pageSize;
    let style = this.thumbNode.style;
    if (this._orientation === 'horizontal') {
      style.top = '';
      style.height = '';
      style.left = `${value * 100}%`;
      style.width = `${pageSize * 100}%`;
      style.transform = `translate(${-value * 100}%, 0%)`;
    } else {
      style.left = '';
      style.width = '';
      style.top = `${value * 100}%`;
      style.height = `${pageSize * 100}%`;
      style.transform = `translate(0%, ${-value * 100}%)`;
    }
  }

  /**
   * Handle the `'keydown'` event for the scroll bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop all input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) {
      this._releaseMouse();
    }
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0 || this._pressData) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._pressData) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Look up the thumb node.
    let thumbNode = this.thumbNode;

    // If the press was on the thumb node, start the drag.
    if (thumbNode.contains(event.target as HTMLElement)) {
      // Get the offset from the beginning of the thumb.
      let delta: number;
      if (this._orientation === 'horizontal') {
        delta = event.clientX - thumbNode.getBoundingClientRect().left;
      } else {
        delta = event.clientY - thumbNode.getBoundingClientRect().top;
      }

      // Set up the cursor override.
      let override = Drag.overrideCursor('default');

      // Set up the press data.
      this._pressData = { delta, override };

      // Add the active class to the scroll thumb.
      thumbNode.classList.add('p-mod-active');

      // Add the extra event listeners.
      document.addEventListener('mousemove', this, true);
      document.addEventListener('mouseup', this, true);
      document.addEventListener('keydown', this, true);
      document.addEventListener('contextmenu', this, true);

      // There is nothing left to do.
      return;
    }

    // Look up the track node.
    let trackNode = this.trackNode;

    // If the press was on the track node, page the scroll bar.
    if (trackNode.contains(event.target as HTMLElement)) {
      // Determine whether the press was before the thumb.
      let before: boolean;
      if (this._orientation === 'horizontal') {
        before = event.clientX < thumbNode.getBoundingClientRect().left;
      } else {
        before = event.clientY < thumbNode.getBoundingClientRect().top;
      }

      // Compute the new paged value.
      let value: number;
      if (before) {
        value = this._value - this._pageSize;
      } else {
        value = this._value + this._pageSize;
      }

      // Clamp the value to the allowable range.
      value = Math.max(0, Math.min(value, 1));

      // Bail if the value does not change.
      if (this._value === value) {
        return;
      }

      // Silently update the internal value.
      this._value = value;

      // Emit the `scrolled` signal and let the consumers update.
      this._scrolled.emit(value);

      // Immediately update the scroll thumb position.
      MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);

      // There is nothing left to do.
      return;
    }
  }

  /**
   * Handle the `'mousemove'` event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Do nothing if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Get the client rect for the track node.
    let trackRect = this.trackNode.getBoundingClientRect();

    // Compute the desired value for the thumb.
    let value: number;
    if (this._orientation === 'horizontal') {
      let edge = event.clientX - trackRect.left - this._pressData.delta;
      value = edge / (trackRect.width - trackRect.width * this._pageSize);
    } else {
      let edge = event.clientY - trackRect.top - this._pressData.delta;
      value = edge / (trackRect.height - trackRect.height * this._pageSize);
    }

    // Clamp the value to the allowable range.
    value = Math.max(0, Math.min(value, 1));

    // Bail if the value does not change.
    if (this._value === value) {
      return;
    }

    // Silently update the internal value.
    this._value = value;

    // Emit the `scrolled` signal and let the consumers update.
    this._scrolled.emit(value);

    // Immediately update the scroll thumb position.
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
  }

  /**
   * Handle the `'mouseup'` event for the tab bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if it's not a left mouse release.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse.
    this._releaseMouse();
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Do nothing if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Clear the press data.
    this._pressData.override.dispose();
    this._pressData = null;

    // Remove the extra event listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Remove the active class from the scroll thumb.
    this.thumbNode.classList.remove('p-mod-active');
  }

  private _value = 0;
  private _pageSize = 0;
  private _orientation: ScrollBar.Orientation;
  private _scrolled = new Signal<this, number>(this);
  private _pressData: Private.IPressData | null = null;
}


/**
 * The namespace for the `ScrollBar` class statics.
 */
export
namespace ScrollBar {
  /**
   * A type alias for a scroll bar orientation.
   */
  export
  type Orientation = 'horizontal' | 'vertical';

  /**
   * An options object for creating a scroll bar.
   */
  export
  interface IOptions {
    /**
     * The orientation of the scroll bar.
     *
     * The default is `'vertical'`.
     */
    orientation?: Orientation;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
   /**
   * Create the DOM node for a scroll bar.
   */
  export
  function createNode(): HTMLElement {
    let node = document.createElement('div');
    let decrement = document.createElement('div');
    let increment = document.createElement('div');
    let track = document.createElement('div');
    let thumb = document.createElement('div');
    decrement.className = 'p-ScrollBar-button';
    increment.className = 'p-ScrollBar-button';
    decrement.dataset['action'] = 'decrement';
    increment.dataset['action'] = 'increment';
    track.className = 'p-ScrollBar-track';
    thumb.className = 'p-ScrollBar-thumb';
    track.appendChild(thumb);
    node.appendChild(decrement);
    node.appendChild(track);
    node.appendChild(increment);
    return node;
  }

  /**
   * An object which holds mouse press data.
   */
  export
  interface IPressData {
    /**
     * The offset of the press in thumb coordinates.
     */
    delta: number;

    /**
     * The disposable which will clear the override cursor.
     */
    override: IDisposable;
  }
}
