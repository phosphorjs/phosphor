/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Signal = core.Signal;


/**
 * The class name added to a scroll bar widget.
 */
var SCROLLBAR_CLASS = 'p-ScrollBar';

/**
 * The class name assigned to a scroll bar thumb.
 */
var THUMB_CLASS = 'p-ScrollBar-thumb';

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
    var thumb = document.createElement('div');
    thumb.className = THUMB_CLASS;
    node.appendChild(thumb);
    return node;
  }

  /**
   * A signal emitted when a user moves the scroll bar thumb.
   *
   * It is not emitted when changing the scroll position from code.
   */
  scrolled = new Signal<number>();

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
    this.updateThumb();
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
  set contentSize(size: number): number {
    size = Math.max(0, size);
    if (size === this._contentSize) {
      return;
    }
    this._contentSize = size;
    this._clampPosition();
    this.updateThumb();
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
    this.updateThumb();
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
    position = Math.max(0, position);
    if (position === this._scrollPosition) {
      return;
    }
    this._scrollPosition = position;
    this._clampPosition();
    this.updateThumb();
  }

  /**
   * Get the DOM node for the scrollbar thumb.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected get thumbNode(): HTMLElement {
    return <HTMLElement>this.node.firstChild;
  }

  /**
   * Refresh the current position and size of the scroll bar thumb.
   */
  protected updateThumb(): void {
    var thumb = this.thumbNode;
    var style = thumb.style;
    if (this._contentSize === 0) {
      style.display = 'none';
      return;
    }

    var minThumb: number;
    var scrollSize: number;
    var cstyle = window.getComputedStyle(thumb);
    if (this._orientation === Orientation.Horizontal) {
      minThumb = parseInt(cstyle.minWidth, 10) || 0;
      scrollSize = this.width - this.boxSizing.horizontalSum;
    } else {
      minThumb = parseInt(cstyle.minHeight, 10) || 0;
      scrollSize = this.height - this.boxSizing.verticalSum;
    }

    var percentSize = Math.min(this._viewportSize / this._contentSize, 1.0);
    var percentPos = Math.min(this._scrollPosition / this._contentSize, 1.0);
    var thumbSize = percentSize * scrollSize;
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

    if (this._orientation === Orientation.Horizontal) {
      style.display = ''
      style.top = '';
      style.height = '';
      style.left = thumbPos + 'px';
      style.width = thumbSize + 'px';
    } else {
      style.display = ''
      style.left = '';
      style.width = '';
      style.top = thumbPos + 'px';
      style.height = thumbSize + 'px';
    }
  }

  /**
   *
   */
  protected onResize(msg: ResizeMessage): void {
    this.updateThumb();
  }

  /**
   *
   */
  private _clampPosition(): void {
    this._scrollPosition = Math.min(this._scrollPosition, this._contentSize);
  }

  private _contentSize = 0;
  private _viewportSize = 0;
  private _scrollPosition = 0;
  private _orientation: Orientation;
}

} // module phosphor.widgets
