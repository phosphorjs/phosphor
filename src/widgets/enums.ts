/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * An enum of direction values.
 */
export
enum Direction {
  /**
   * Left to right direction.
   */
  LeftToRight,

  /**
   * Right to left direction.
   */
  RightToLeft,

  /**
   * Top to bottom direction.
   */
  TopToBottom,

  /**
   * Bottom to top direction.
   */
  BottomToTop,
}


/**
 * The available docking modes for a dock area.
 */
export
enum DockMode {
  /**
   * Insert the panel at the top of the dock area.
   */
  Top,

  /**
   * Insert the panel at the left of the dock area.
   */
  Left,

  /**
   * Insert the panel at the right of the dock area.
   */
  Right,

  /**
   * Insert the panel at the bottom of the dock area.
   */
  Bottom,

  /**
   * Insert the panel as a new split item above the reference.
   */
  SplitTop,

  /**
   * Insert the panel as a new split item to the left of the reference.
   */
  SplitLeft,

  /**
   * Insert the panel as a new split item to the right of the reference.
   */
  SplitRight,

  /**
   * Insert the panel as a new split item below the reference.
   */
  SplitBottom,

  /**
   * Insert the panel as a new tab before the reference.
   */
  TabBefore,

  /**
   * Insert the panel as a new tab after the reference.
   */
  TabAfter,
}


/**
 * An enum of orientation values.
 */
export
enum Orientation {
  /**
   * Horizontal orientation.
   */
  Horizontal,

  /**
   * Vertical orientation.
   */
  Vertical,
}

} // module phosphor.panels
