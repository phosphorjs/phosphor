/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import IMessage = core.IMessage;
import Signal = core.Signal;


/**
 * The class name added to a scroll bar widget.
 */
var SCROLLBAR_CLASS = 'p-ScrollBar';

/**
 * The class name assigned to a scroll bar slider.
 */
var SLIDER_CLASS = 'p-ScrollBar-slider';

/**
 * The class name added to a horizontal scroll bar.
 */
var HORIZONTAL_CLASS = 'p-mod-horizontal';

/**
 * The class name added to a vertical scroll bar.
 */
var VERTICAL_CLASS = 'p-mod-vertical';


/**
 * A concrete implementation of IScrollBar.
 */
export
class ScrollBar extends Widget implements IScrollBar {
  /**
   * Create the DOM node for a scroll bar.
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    var slider = document.createElement('div');
    slider.className = SLIDER_CLASS;
    node.appendChild(slider);
    return node;
  }

  /**
   * A signal emitted when the user moves the scroll bar slider.
   *
   * The parameter is the current scroll position. The signal is
   * not emitted when the scroll position is changed from code.
   */
  sliderMoved = new Signal<ScrollBar, number>();

  /**
   * Construct a new scroll bar.
   *
   * @param orientation - The orientation of the scroll bar.
   */
  constructor(orientation: Orientation) {
    super();
    this.addClass(SCROLLBAR_CLASS);
    this.orientation = orientation;
  }

  /**
   * Get the orientation of the scroll bar.
   */
  get orientation(): Orientation {
    return this._orientation;
  }

  /**
   * Set the orientation of the scroll bar.
   */
  set orientation(value: Orientation) {
    if (value === this._orientation) {
      return;
    }
    this._orientation = value;
    if (value === Orientation.Horizontal) {
      this.removeClass(VERTICAL_CLASS);
      this.addClass(HORIZONTAL_CLASS);
    } else {
      this.removeClass(HORIZONTAL_CLASS);
      this.addClass(VERTICAL_CLASS);
    }
    this._updateSlider();
  }

  /**
   * Get the size of the scrolled content.
   */
  get contentSize(): number {
    return this._contentSize;
  }

  /**
   * Set the size of the scrolled content.
   *
   * This should be set to the size required to display the entirety of
   * the content. It is used in conjunction with `viewportSize` to set
   * the size of the scrollbar slider. The units are irrelevant, but
   * must be consistent with `viewportSize` and `scrollPosition`.
   */
  set contentSize(size: number) {
    size = Math.max(0, size);
    if (size === this._contentSize) {
      return;
    }
    this._scrollPosition = Math.min(this._scrollPosition, size);
    this._contentSize = size;
    this._updateSlider();
  }

  /**
   * Get the size of the visible portion of the scrolled content.
   */
  get viewportSize(): number {
    return this._viewportSize;
  }

  /**
   * Set the size of the visible portion of the scrolled content.
   *
   * This should be set to the size of the currently visible portion of
   * the content. It is used in conjunction with `contentSize` to set
   * the size of the scrollbar slider. The units are irrelevant, but
   * must be consistent with `contentSize` and `scrollPosition`.
   */
  set viewportSize(size: number) {
    size = Math.max(0, size);
    if (size === this._viewportSize) {
      return;
    }
    this._viewportSize = size;
    this._updateSlider();
  }

  /**
   * Get the position of the scrollbar slider.
   */
  get scrollPosition(): number {
    return this._scrollPosition;
  }

  /**
   * Set the position of the scrollbar slider.
   *
   * This should be set to reflect the position of the viewport relative
   * to the content. It is updated automatically when the user interacts
   * with the slider. The units are irrelevant, but must be consistent
   * with `viewportSize` and `contentSize`.
   */
  set scrollPosition(position: number) {
    position = Math.max(0, Math.min(position, this._contentSize));
    if (position === this._scrollPosition) {
      return;
    }
    this._scrollPosition = position;
    this._updateSlider();
  }

  /**
   * Handle the DOM events for the scroll bar.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(<MouseEvent>event);
      break;
    case 'mousemove':
      this._evtMouseMove(<MouseEvent>event);
      break;
    case 'mouseup':
      this._evtMouseUp(<MouseEvent>event);
      break;
    }
  }

  /**
   * A method invoked on a 'resize' message.
   */
  protected onResize(msg: ResizeMessage): void {
    this._updateSlider();
  }

  /**
   * A method invoked on an 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    this.node.addEventListener('mousedown', <any>this);
  }

  /**
   * A method invoked on an 'after-detach' message.
   */
  protected onAfterDetach(msg: IMessage): void {
    this.node.removeEventListener('mousedown', <any>this);
  }

  /**
   * Handle the 'mousedown' event for the scroll bar.
   */
  private _evtMouseDown(event: MouseEvent): void {

  }

  /**
   * Handle the 'mousemove' event for the scroll bar.
   */
  private _evtMouseMove(event: MouseEvent): void {

  }

  /**
   * Handle the 'mouseup' event for the scroll bar.
   */
  private _evtMouseUp(event: MouseEvent): void {

  }

  /**
   * Update the position and size of the slider.
   */
  private _updateSlider(): void {

  }

  private _contentSize = 0;
  private _viewportSize = 0;
  private _scrollPosition = 0;
  private _orientation: Orientation;
}

} // module phosphor.widgets
