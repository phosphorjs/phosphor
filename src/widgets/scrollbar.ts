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
   */
  sliderMoved = new Signal<ScrollBar, number>();

  /**
   * Construct a new scroll bar.
   */
  constructor(orientation = Orientation.Vertical) {
    super();
    this.addClass(SCROLLBAR_CLASS);
    this._setOrientation(orientation);
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
    this._setOrientation(orientation);
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
   * Get the page step of the scroll bar.
   */
  get pageStep(): number {
    return this._pageStep;
  }

  /**
   * Set the page step of the scroll bar.
   */
  set pageStep(step: number) {
    step = Math.max(0, step);
    if (step === this._pageStep) {
      return;
    }
    this._pageStep = step;
    this.update();
  }

  /**
   * Get the single step of the scroll bar.
   */
  get singleStep(): number {
    return this._singleStep;
  }

  /**
   * Set the single step of the scroll bar.
   */
  set singleStep(step: number) {
    step = Math.max(0, step);
    if (step === this._singleStep) {
      return;
    }
    this._singleStep = step;
  }

  /**
   * Scroll up by a page step.
   *
   * This can be called to implement the behavior for a user action.
   * The `sliderMoved` signal is emitted if the `value` changes.
   */
  pageUp(): void {
    this.scrollTo(this._value - this._pageStep);
  }

  /**
   * Scroll down by a page step.
   *
   * This can be called to implement the behavior for a user action.
   * The `sliderMoved` signal is emitted if the `value` changes.
   */
  pageDown(): void {
    this.scrollTo(this._value + this._pageStep);
  }

  /**
   * Scroll up by a single step.
   *
   * This can be called to implement the behavior for a user action.
   * The `sliderMoved` signal is emitted if the `value` changes.
   */
  stepUp(): void {
    this.scrollTo(this._value - this._singleStep);
  }

  /**
   * Scroll down by a single step.
   *
   * This can be called to implement the behavior for a user action.
   * The `sliderMoved` signal is emitted if the `value` changes.
   */
  stepDown(): void {
    this.scrollTo(this._value + this._singleStep);
  }

  /**
   * Scroll to the given value.
   *
   * This can be called to implement the behavior for a user action.
   * The `sliderMoved` signal is emitted if the `value` changes.
   */
  scrollTo(value: number): void {
    value = Math.max(this._minimum, Math.min(value, this._maximum));
    if (value === this._value) {
      return;
    }
    this._value = value;
    this.update();
    this.sliderMoved.emit(this, value);
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
    var size = (this._pageStep / span) * trackSize;
    var pos = (this._value / span) * (trackSize - size);

    // Ensure the size is at least the minimum slider size.
    //var minSize = this._ensureSliderMinSize();
    var minSize = 20;
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
      style.display = '';
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
    // if (event.button !== 0) {
    //   return;
    // }

    // var geo = this._sliderGeometry();
    // if (!geo) {
    //   return;
    // }

    // var localPos: number;
    // var trackSize: number;
    // var box = this.boxSizing;
    // var rect = this.node.getBoundingClientRect();
    // if (this._orientation === Orientation.Horizontal) {
    //   localPos = event.clientX - rect.left - box.borderLeft;
    //   trackSize = this.width - box.horizontalSum;
    // } else {
    //   localPos = event.clientY - rect.top - box.borderTop;
    //   trackSize = this.height - box.verticalSum;
    // }

    // if (localPos < geo.pos) {
    //   if (event.shiftKey) {
    //     var spread = trackSize - geo.size;
    //     var leading = Math.max(0, localPos - geo.size / 2);
    //     var pos = this._contentSize * leading / spread;
    //     if (pos !== this._scrollPosition) {
    //       this._scrollPosition = pos;
    //       this._updateSlider();
    //       this.sliderMoved.emit(this, pos);
    //     }
    //   } else {
    //     this._pageUp();
    //   }
    // } else if (localPos > geo.pos + geo.size) {
    //   if (event.shiftKey) {
    //     var spread = trackSize - geo.size;
    //     var leading = Math.min(spread, localPos - geo.size / 2);
    //     var pos = this._contentSize * leading / spread;
    //     if (pos !== this._scrollPosition) {
    //       this._scrollPosition = pos;
    //       this._updateSlider();
    //       this.sliderMoved.emit(this, pos);
    //     }
    //   } else {
    //     this._pageDown();
    //   }
    // } else {
    //   //document.addEventListener('mousemove', <any>this, true);
    //   //document.addEventListener('mouseup', <any>this, true);
    // }
  }

  /**
   * Handle the 'mousemove' event for the scroll bar.
   */
  private _evtMouseMove(event: MouseEvent): void { }

  /**
   * Handle the 'mouseup' event for the scroll bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // if (event.button !== 0) {
    //   return;
    // }
    // event.preventDefault();
    // event.stopPropagation();
    // document.removeEventListener('mousemove', <any>this, true);
    // document.removeEventListener('mouseup', <any>this, true);
    // if (this._dragData) {
    //   this._dragData.cursorGrab.dispose();
    //   this._dragData = null;
    // }
  }

  /**
   * Set the orientation of the scroll bar.
   */
  private _setOrientation(orientation: Orientation): void {
    this._orientation = orientation;
    if (orientation === Orientation.Horizontal) {
      this.removeClass(VERTICAL_CLASS);
      this.addClass(HORIZONTAL_CLASS);
      this.setSizePolicy(SizePolicy.Preferred, SizePolicy.Fixed);
    } else {
      this.removeClass(HORIZONTAL_CLASS);
      this.addClass(VERTICAL_CLASS);
      this.setSizePolicy(SizePolicy.Fixed, SizePolicy.Preferred);
    }
  }

  private _value = 0;
  private _minimum = 0;
  private _maximum = 99;
  private _pageStep = 1;
  private _singleStep = 10;
  private _sliderMinSize = -1;
  private _orientation: Orientation;
  private _dragData: IDragData = null;
}


/**
 *
 */
interface IDragData {
  /**
   *
   */
  cursorGrab: IDisposable;
}

} // module phosphor.widgets
