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
 *
 */
export
interface IScrollBar extends Widget {
  /**
   *
   */
  sliderMoved: Signal<IScrollBar, number>;

  /**
   *
   */
  orientation: Orientation;

  /**
   *
   */
  contentSize: number;

  /**
   *
   */
  viewportSize: number;

  /**
   *
   */
  scrollPosition: number;
}

}
