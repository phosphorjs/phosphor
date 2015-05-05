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
      this.setSizePolicy(SizePolicy.Preferred, SizePolicy.Fixed);
    } else {
      this.removeClass(HORIZONTAL_CLASS);
      this.addClass(VERTICAL_CLASS);
      this.setSizePolicy(SizePolicy.Fixed, SizePolicy.Preferred);
    }
    this._invalidateSliderMin();
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
    this._invalidateSliderMin();
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
    var geo = this._sliderGeometry();
    var style = (<HTMLElement>this.node.firstChild).style;
    if (geo === void 0) {
      style.display = 'none';
      style.top = '';
      style.left = '';
      style.width = '';
      style.height = '';
    } else if (this._orientation === Orientation.Horizontal) {
      style.display = '';
      style.top = '';
      style.left = geo.pos + 'px';
      style.width = geo.size + 'px';
      style.height = '';
    } else {
      style.display = '';
      style.top = geo.pos + 'px';
      style.left = '';
      style.width = '';
      style.height = geo.size + 'px';
    }
  }

  /**
   * Invalidate the cached minimum size of the scroll bar slider.
   */
  private _invalidateSliderMin(): void {
    this._sliderMinSize = -1;
  }

  /**
   * Get the minimum size of the scroll bar slider.
   *
   * The minimum size is computed once and then cached. The cached
   * value can be cleared by calling `_invalidateSliderMin`.
   */
  private _ensureSliderMin(): number {
    if (this._sliderMinSize === -1) {
      var slider = <HTMLElement>this.node.firstChild;
      var style = window.getComputedStyle(slider);
      if (this._orientation === Orientation.Horizontal) {
        this._sliderMinSize = parseInt(style.minWidth, 10) || 0;
      } else {
        this._sliderMinSize = parseInt(style.minHeight, 10) || 0;
      }
    }
    return this._sliderMinSize;
  }

  /**
   * Compute the position and size of the scroll bar slider.
   *
   * The computation takes into account the scroll bar padding.
   */
  private _sliderGeometry(): ISliderGeometry {
    // Hide the slider if the viewport is larger than the content.
    var contentSize = this._contentSize;
    var viewportSize = this._viewportSize;
    if (viewportSize >= contentSize) {
      return void 0;
    }

    // Compute the effective size of the scroll bar track.
    var padding: number;
    var trackSize: number;
    var box = this.boxSizing;
    if (this._orientation === Orientation.Horizontal) {
      padding = box.paddingLeft;
      trackSize = this.width - box.horizontalSum;
    } else {
      padding = box.paddingTop;
      trackSize = this.height - box.verticalSum;
    }

    // Compute the ideal position and size of the slider.
    var size = (viewportSize / contentSize) * trackSize;
    var pos = (this._scrollPosition / contentSize) * (trackSize - size);

    // Ensure the size is at least the minimum slider size.
    var minSize = this._ensureSliderMin();
    if (size < minSize) {
      size = minSize;
    }

    // Ensure the slider does not extend past the track limit.
    if (size + pos > trackSize) {
      pos = trackSize - size;
    }

    // Hide the slider if it cannot fit the available space.
    if (pos < 0) {
      return void 0;
    }

    return { pos: padding + pos, size: size };
  }

  private _contentSize = 0;
  private _viewportSize = 0;
  private _scrollPosition = 0;
  private _sliderMinSize = -1;
  private _orientation: Orientation;
}


/**
 * An object which holds the computed geometry of a scroll bar slider.
 */
interface ISliderGeometry {
  /**
   * The position of the slider along the scroll bar orientation.
   */
  pos: number;

  /**
   * The size of the slider along the scroll bar orientation.
   */
  size: number;
}

} // module phosphor.widgets
