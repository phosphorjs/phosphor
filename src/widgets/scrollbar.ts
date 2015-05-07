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

import IDisposable = utility.IDisposable;
import Size = utility.Size;
import overrideCursor = utility.overrideCursor;


/**
 * The class name added to ScrollBar instances.
 */
var SCROLLBAR_CLASS = 'p-ScrollBar';

/**
 * The class name assigned to a scroll bar slider.
 */
var SLIDER_CLASS = 'p-ScrollBar-slider';

/**
 * The class name added to an active scroll bar.
 */
var ACTIVE_CLASS = 'p-mod-active';

/**
 * The class name added to a horizontal scroll bar.
 */
var HORIZONTAL_CLASS = 'p-mod-horizontal';

/**
 * The class name added to a vertical scroll bar.
 */
var VERTICAL_CLASS = 'p-mod-vertical';


/**
 * A widget which provides a horizontal or vertical scroll bar.
 */
export
class ScrollBar extends Widget {
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
   * The signal parameter is the current `value` of the scroll bar.
   *
   * #### Notes
   * This signal is not emitted when `value` is changed from code.
   */
  sliderMoved = new Signal<ScrollBar, number>();

  /**
   * Construct a new scroll bar.
   *
   * @param orientation - The orientation of the scroll bar.
   */
  constructor(orientation = Orientation.Vertical) {
    super();
    this.addClass(SCROLLBAR_CLASS);
    this._orientation = orientation;
    if (orientation === Orientation.Horizontal) {
      this.addClass(HORIZONTAL_CLASS);
      this.setSizePolicy(SizePolicy.Expanding, SizePolicy.Fixed);
    } else {
      this.addClass(VERTICAL_CLASS);
      this.setSizePolicy(SizePolicy.Fixed, SizePolicy.Expanding);
    }
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
  set orientation(orientation: Orientation) {
    if (orientation === this._orientation) {
      return;
    }
    this._sliderMinSize = -1;
    this._orientation = orientation;
    if (orientation === Orientation.Horizontal) {
      this.removeClass(VERTICAL_CLASS);
      this.addClass(HORIZONTAL_CLASS);
      this.setSizePolicy(SizePolicy.Expanding, SizePolicy.Fixed);
    } else {
      this.removeClass(HORIZONTAL_CLASS);
      this.addClass(VERTICAL_CLASS);
      this.setSizePolicy(SizePolicy.Fixed, SizePolicy.Expanding);
    }
    this.invalidateBoxSizing();
    this.update();
  }

  /**
   * Get the minimum value of the scroll bar.
   */
  get minimum(): number {
    return this._minimum;
  }

  /**
   * Set the minimum value of the scroll bar.
   */
  set minimum(minimum: number) {
    if (minimum === this._minimum) {
      return;
    }
    this._minimum = minimum;
    this._maximum = Math.max(minimum, this._maximum);
    this._value = Math.max(minimum, Math.min(this._value, this._maximum));
    this.update();
  }

  /**
   * Get the maximum value of the scroll bar.
   */
  get maximum(): number {
    return this._maximum;
  }

  /**
   * Set the maximum value of the scroll bar.
   */
  set maximum(maximum: number) {
    if (maximum === this._maximum) {
      return;
    }
    this._maximum = maximum;
    this._minimum = Math.min(this._minimum, maximum);
    this._value = Math.max(this._minimum, Math.min(this._value, maximum));
    this.update();
  }

  /**
   * Get the current value of the scroll bar.
   */
  get value(): number {
    return this._value;
  }

  /**
   * Set the current value of the scroll bar.
   */
  set value(value: number) {
    value = Math.max(this._minimum, Math.min(value, this._maximum));
    if (value === this._value) {
      return;
    }
    this._value = value;
    this.update();
  }

  /**
   * Get the page size of the scroll bar.
   */
  get pageSize(): number {
    return this._pageSize;
  }

  /**
   * Set the page size of the scroll bar.
   *
   * The page size controls the size of the slider control in relation
   * to the current scroll bar range. It should be set to a value which
   * represents a single "page" of content. This is the amount that the
   * slider will move when the user clicks inside the scroll bar track.
   */
  set pageSize(size: number) {
    size = Math.max(0, size);
    if (size === this._pageSize) {
      return;
    }
    this._pageSize = size;
    this.update();
  }

  /**
   * Calculate the preferred size for the scroll bar.
   */
  sizeHint(): Size {
    var size: Size;
    if (this._orientation === Orientation.Horizontal) {
      size = new Size(0, this.boxSizing.minHeight);
    } else {
      size = new Size(this.boxSizing.minWidth, 0);
    }
    return size;
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
   * A method invoked on an 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    this.node.addEventListener('mousedown', <any>this);
    this._sliderMinSize = -1;
  }

  /**
   * A method invoked on an 'after-detach' message.
   */
  protected onAfterDetach(msg: IMessage): void {
    this.node.removeEventListener('mousedown', <any>this);
  }

  /**
   * A method invoked on a 'resize' message.
   */
  protected onResize(msg: ResizeMessage): void {
    this.update(true);
  }

  /**
   * A method invoked on an 'update-request' message.
   */
  protected onUpdateRequest(msg: IMessage): void {
    // Hide the slider if there is no room to scroll.
    var style = (<HTMLElement>this.node.firstChild).style;
    if (this._minimum === this._maximum) {
      style.display = 'none';
      return;
    }

    // Compute the effective geometry of the scroll bar track.
    var trackPos: number;
    var trackSize: number;
    var box = this.boxSizing;
    if (this._orientation === Orientation.Horizontal) {
      trackPos = box.paddingLeft;
      trackSize = this.width - box.horizontalSum;
    } else {
      trackPos = box.paddingTop;
      trackSize = this.height - box.verticalSum;
    }

    // Compute the ideal track position and size of the slider.
    var span = this._maximum - this._minimum;
    var size = (this._pageSize / span) * trackSize;
    var pos = (this._value / span) * (trackSize - size);

    // Ensure the size is at least the minimum slider size.
    var minSize = this._getSliderMinSize();
    if (size < minSize) {
      size = minSize;
    }

    // Ensure the slider does not extend past the track limit.
    if (size + pos > trackSize) {
      pos = trackSize - size;
    }

    // Hide the slider if it cannot fit the available space.
    if (pos < 0) {
      style.display = 'none';
      return;
    }

    // Update the position and size of the slider.
    style.display = '';
    if (this._orientation === Orientation.Horizontal) {
      style.top = '';
      style.left = trackPos + pos + 'px';
      style.width = size + 'px';
      style.height = '';
    } else {
      style.top = trackPos + pos + 'px';
      style.left = '';
      style.width = '';
      style.height = size + 'px';
    }
  }

  /**
   * Handle the 'mousedown' event for the scroll bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    // Compute the geometry of the slider track and slider. The mouse
    // and slider positions are normalized to local track coordinates.
    var mousePos: number;
    var trackSize: number;
    var sliderPos: number;
    var sliderEnd: number;
    var sliderSize: number;
    var box = this.boxSizing;
    var rect = this.node.getBoundingClientRect();
    var slider = <HTMLElement>this.node.firstChild;
    var sliderRect = slider.getBoundingClientRect();
    if (this._orientation === Orientation.Horizontal) {
      mousePos = event.clientX - rect.left - box.paddingLeft;
      trackSize = this.width - box.horizontalSum;
      sliderPos = sliderRect.left - rect.left - box.paddingLeft;
      sliderEnd = sliderRect.right - rect.left - box.paddingLeft;
      sliderSize = sliderRect.width;
    } else {
      mousePos = event.clientY - rect.top - box.paddingTop;
      trackSize = this.height - box.verticalSum;
      sliderPos = sliderRect.top - rect.top - box.paddingTop;
      sliderEnd = sliderRect.bottom - rect.top - box.paddingTop;
      sliderSize = sliderRect.height;
    }

    // If the shift key is pressed and the position of the mouse does
    // not not intersect the slider, scroll directly to the indicated
    // position such that the middle of the slider is located at the
    // mouse position.
    if (event.shiftKey && (mousePos < sliderPos || mousePos >= sliderEnd)) {
      var perc = (mousePos - sliderSize / 2) / (trackSize - sliderSize);
      this._scrollTo(perc * (this._maximum - this._minimum));
      return;
    }

    // If the mouse position is less than the slider, page down.
    if (mousePos < sliderPos) {
      this._scrollTo(this._value - this._pageSize);
      return;
    }

    // If the mouse position is greater than the slider, page up.
    if (mousePos >= sliderEnd) {
      this._scrollTo(this._value + this._pageSize);
      return;
    }

    // Otherwise, the mouse is over the slider and the drag is started.
    this.addClass(ACTIVE_CLASS);
    var pressOffset = mousePos - sliderPos;
    var cursorGrab = overrideCursor('default');
    this._dragData = { pressOffset: pressOffset, cursorGrab: cursorGrab };
    document.addEventListener('mousemove', <any>this, true);
    document.addEventListener('mouseup', <any>this, true);
  }

  /**
   * Handle the 'mousemove' event for the scroll bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    var mousePos: number;
    var trackSize: number;
    var sliderSize: number;
    var box = this.boxSizing;
    var rect = this.node.getBoundingClientRect();
    var slider = <HTMLElement>this.node.firstChild;
    var sliderRect = slider.getBoundingClientRect();
    if (this._orientation === Orientation.Horizontal) {
      mousePos = event.clientX - rect.left - box.paddingLeft;
      trackSize = this.width - box.horizontalSum;
      sliderSize = sliderRect.width;
    } else {
      mousePos = event.clientY - rect.top - box.paddingTop;
      trackSize = this.height - box.verticalSum;
      sliderSize = sliderRect.height;
    }
    var pressOffset = this._dragData.pressOffset;
    var perc = (mousePos - pressOffset) / (trackSize - sliderSize);
    this._scrollTo(perc * (this._maximum - this._minimum));
  }

  /**
   * Handle the 'mouseup' event for the scroll bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    document.removeEventListener('mousemove', <any>this, true);
    document.removeEventListener('mouseup', <any>this, true);
    this.removeClass(ACTIVE_CLASS);
    if (this._dragData) {
      this._dragData.cursorGrab.dispose();
      this._dragData = null;
    }
  }

  /**
   * Scroll to the given value expressed in scroll coordinates.
   *
   * The given value will be clamped to the scroll bar range. If the
   * adjusted value is different from the current value, the scroll
   * bar will be updated and the `sliderMoved` signal will be emitted.
   */
  private _scrollTo(value: number): void {
    value = Math.max(this._minimum, Math.min(value, this._maximum));
    if (value === this._value) {
      return;
    }
    this._value = value;
    this.update(true);
    this.sliderMoved.emit(this, value);
  }

  /**
   * Get the minimum size of the slider for the current orientation.
   *
   * This computes the value once and caches it, which ensures that
   * multiple calls to this method are quick. The cached value can
   * be cleared by setting the `_sliderMinSize` property to `-1`.
   */
  private _getSliderMinSize(): number {
    if (this._sliderMinSize === -1) {
      var style = window.getComputedStyle(<HTMLElement>this.node.firstChild);
      if (this._orientation === Orientation.Horizontal) {
        this._sliderMinSize = parseInt(style.minWidth, 10) || 0;
      } else {
        this._sliderMinSize = parseInt(style.minHeight, 10) || 0;
      }
    }
    return this._sliderMinSize;
  }

  private _value = 0;
  private _minimum = 0;
  private _maximum = 99;
  private _pageSize = 1;
  private _sliderMinSize = -1;
  private _dragData: IDragData = null;
  private _orientation: Orientation;
}


/**
 * An object which holds the drag data for a scroll bar.
 */
interface IDragData {
  /**
   * The offset of the mouse press from the leading edge of the slider.
   */
  pressOffset: number;

  /**
   * The disposable to clean up the cursor override.
   */
  cursorGrab: IDisposable;
}

} // module phosphor.widgets
