/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

/**
 * An enum of docking modes for a dock area.
 */
export
enum DockMode {
  /**
   * Insert the widget at the top of the dock area.
   */
  Top,

  /**
   * Insert the widget at the left of the dock area.
   */
  Left,

  /**
   * Insert the widget at the right of the dock area.
   */
  Right,

  /**
   * Insert the widget at the bottom of the dock area.
   */
  Bottom,

  /**
   * Insert the widget as a new split item above the reference.
   */
  SplitTop,

  /**
   * Insert the widget as a new split item to the left of the reference.
   */
  SplitLeft,

  /**
   * Insert the widget as a new split item to the right of the reference.
   */
  SplitRight,

  /**
   * Insert the widget as a new split item below the reference.
   */
  SplitBottom,

  /**
   * Insert the widget as a new tab before the reference.
   */
  TabBefore,

  /**
   * Insert the widget as a new tab after the reference.
   */
  TabAfter,
}

} // module phosphor.widgets
