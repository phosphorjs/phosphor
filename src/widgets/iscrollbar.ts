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
 * A widget which provides a vertical or horizontal scroll bar.
 */
export
interface IScrollBar extends Widget {
  /**
   * A signal emitted when the user moves the scroll bar slider.
   *
   * The parameter is the current scroll position. The signal is
   * not emitted when the scroll position is changed from code.
   */
  sliderMoved: Signal<IScrollBar, number>;

  /**
   * Get and set the orientation of the scroll bar.
   */
  orientation: Orientation;

  /**
   * Get and set the size of the scrolled content.
   *
   * This should be set to the size required to display the entirety of
   * the content. It is used in conjunction with `viewportSize` to set
   * the size of the scrollbar slider. The units are irrelevant, but
   * must be consistent with `viewportSize` and `scrollPosition`.
   */
  contentSize: number;

  /**
   * Get and set the size of the visible portion of the scrolled content.
   *
   * This should be set to the size of the currently visible portion of
   * the content. It is used in conjunction with `contentSize` to set
   * the size of the scrollbar slider. The units are irrelevant, but
   * must be consistent with `contentSize` and `scrollPosition`.
   */
  viewportSize: number;

  /**
   * Get and set the position of the scrollbar slider.
   *
   * This should be set to reflect the position of the viewport relative
   * to the content. It is updated automatically when the user interacts
   * with the slider. The units are irrelevant, but must be consistent
   * with `viewportSize` and `contentSize`.
   */
  scrollPosition: number;
}

} // module phosphor.widgets
