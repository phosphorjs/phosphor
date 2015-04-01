/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

/**
 * An enum of alignment bit flags.
 */
export
enum Alignment {
  /**
   * Align with the left edge.
   */
  Left = 0x1,

  /**
   * Align with the right edge.
   */
  Right = 0x2,

  /**
   * Align with the horizontal center.
   */
  HorizontalCenter = 0x4,

  /**
   * Align with the top edge.
   */
  Top = 0x10,

  /**
   * Align with the bottom edge.
   */
  Bottom = 0x20,

  /**
   * Align with the vertical center.
   */
  VerticalCenter = 0x40,

  /**
   * Align with the horizontal and vertical center.
   */
  Center = HorizontalCenter | VerticalCenter,

  /**
   * A mask of horizontal alignment values.
   */
  Horizontal_Mask = Left | Right | HorizontalCenter,

  /**
   * A mask of vertical alignment values.
   */
  Vertical_Mask = Top | Bottom | VerticalCenter,
}


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


/**
 * An enum of widget bit flags.
 *
 * Widget flags are used to control various low-level behaviors of
 * a widget. They are typically not used directly by user code.
 */
export
enum WidgetFlag {
  /**
   * The panel is attached to the DOM.
   */
  IsAttached = 0x1,

  /**
   * The panel is explicitly hidden.
   */
  IsHidden = 0x2,

  /**
   * The panel is visible.
   */
  IsVisible = 0x4,

  /**
   * The panel has been disposed.
   */
  IsDisposed = 0x8,

  /**
   * Changing the panel layout is disallowed.
   */
  DisallowLayoutChange = 0x10,
}

} // module phosphor.panels
