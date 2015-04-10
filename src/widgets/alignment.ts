/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

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

} // module phosphor.widgets
