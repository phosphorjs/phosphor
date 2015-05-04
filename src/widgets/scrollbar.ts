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
 * The class name added to horizontal scroll bars.
 */
var HORIZONTAL_CLASS = 'p-mod-horizontal';

/**
 * The class name added to vertical scroll bars.
 */
var VERTICAL_CLASS = 'p-mod-vertical';


/**
 * A widget which provides a vertical or horizontal scroll bar.
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
   * It is not emitted when changing the scroll position from code.
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
    this._sliderMinSize = null;
    this._orientation = value;
    if (value === Orientation.Vertical) {
      this.removeClass(HORIZONTAL_CLASS);
      this.addClass(VERTICAL_CLASS);
    } else {
      this.removeClass(VERTICAL_CLASS);
      this.addClass(HORIZONTAL_CLASS);
    }
    this.updateSlider();
  }

  /**
   * Get the content size of the scroll bar.
   */
  get contentSize(): number {
    return this._contentSize;
  }

  /**
   * Set the content size of the scroll bar.
   */
  set contentSize(size: number) {
    size = Math.max(0, size);
    if (size === this._contentSize) {
      return;
    }
    this._scrollPosition = Math.min(this._scrollPosition, size);
    this._contentSize = size;
    this.updateSlider();
  }

  /**
   * Get the viewport size of the scroll bar.
   */
  get viewportSize(): number {
    return this._viewportSize;
  }

  /**
   * Set the viewport size of the scroll bar.
   */
  set viewportSize(size: number) {
    size = Math.max(0, size);
    if (size === this._viewportSize) {
      return;
    }
    this._viewportSize = size;
    this.updateSlider();
  }

  /**
   * Get the scroll position of the scroll bar.
   */
  get scrollPosition(): number {
    return this._scrollPosition;
  }

  /**
   * Set the scroll position of the scroll bar.
   */
  set scrollPosition(position: number) {
    position = Math.max(0, Math.min(position, this._contentSize));
    if (position === this._scrollPosition) {
      return;
    }
    this._scrollPosition = position;
    this.updateSlider();
  }

  /**
   *
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
   * Get the DOM node for the scrollbar thumb.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected get sliderNode(): HTMLElement {
    return <HTMLElement>this.node.firstChild;
  }

  /**
   *
   */
  protected get sliderMinSize(): Size {
    if (this._sliderMinSize === null) {
      var style = window.getComputedStyle(this.thumbNode);
      var width = parseInt(style.minWidth, 10) || 0;
      var height = parseInt(style.minHeight, 10) || 0;
      this._sliderMinSize = new Size(width, height);
    }
    return this._sliderMinSize;
  }

  /**
   *
   */
  protected sliderLayoutSize(): number {

  }

  /**
   * Refresh the current position and size of the scroll bar thumb.
   */
  protected updateSlider(): void {
    var thumb = this.thumbNode;
    var style = thumb.style;
    if (this._contentSize === 0) {
      style.display = 'none';
      return;
    }

    var minThumb: number;
    var scrollSize: number;
    var box = this.boxSizing;
    var cstyle = window.getComputedStyle(thumb);
    if (this._orientation === Orientation.Vertical) {
      minThumb = parseInt(cstyle.minHeight, 10) || 0;
      scrollSize = this.height - box.verticalSum;
    } else {
      minThumb = parseInt(cstyle.minWidth, 10) || 0;
      scrollSize = this.width - box.horizontalSum;
    }

    var percentSize = Math.min(this._viewportSize / this._contentSize, 1.0);
    var thumbSize = percentSize * scrollSize;

    var percentPos = this._scrollPosition / this._contentSize;
    var thumbPos = percentPos * (scrollSize - thumbSize);

    if (minThumb > thumbSize) {
      thumbSize = minThumb;
      if (thumbSize + thumbPos > scrollSize) {
        thumbPos = scrollSize - thumbSize;
        if (thumbPos < 0) {
          style.display = 'none';
          return;
        }
      }
    }

    if (this._orientation === Orientation.Vertical) {
      style.display = '';
      style.left = '';
      style.width = '';
      style.top = box.paddingTop + thumbPos + 'px';
      style.height = thumbSize + 'px';
    } else {
      style.display = '';
      style.top = '';
      style.height = '';
      style.left = box.paddingLeft + thumbPos + 'px';
      style.width = thumbSize + 'px';
    }
  }

  /**
   *
   */
  protected onResize(msg: ResizeMessage): void {
    this.updateSlider();
  }

  /**
   *
   */
  protected onAfterAttach(msg: IMessage): void {
    this._sliderMinSize = null;
    this.node.addEventListener('mousedown', <any>this);
  }

  /**
   *
   */
  protected onAfterDetach(msg: IMessage): void {
    this.node.removeEventListener('mousedown', <any>this);
  }

  /**
   *
   */
  private _evtMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    var clientX = event.clientX;
    var clientY = event.clientY;
    if (!hitTest(this.thumbNode, clientX, clientY)) {
      var position: number;
      var rect = this.node.getBoundingClientRect();
      if (this._orientation === Orientation.Vertical) {

        position = this._mapToScrollPosition(clientY);
      } else {
        position = this._mapToScrollPosition(clientX);
      }
      this.scrollPosition = position;
      this.sliderMoved.emit(this, this.scrollPosition);
    }

    document.addEventListener('mousemove', <any>this, true);
    document.addEventListener('mouseup', <any>this, true);
  }

  /**
   *
   */
  private _evtMouseMouse(event: MouseEvent): void {

  }

  /**
   *
   */
  private _evtMouseUp(event: MouseEvent): void {

    document.removeEventListener('mousemove', <any>this, true);
    document.removeEventListener('mouseup', <any>this, true);
  }


  private _orientation: Orientation;
  private _sliderMinSize: Size = null;
  private _scrollPosition = 0;
  private _viewportSize = 0;
  private _contentSize = 0;
}

} // module phosphor.widgets
