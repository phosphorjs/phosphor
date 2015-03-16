/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
export = Alignment;


/**
 * An enum of alignment bit flags.
 */
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
  HCenter = 0x4,

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
  VCenter = 0x40,

  /**
   * Align with the horizontal and vertical center.
   */
  Center = HCenter | VCenter,

  /**
   * A mask of horizontal alignment values.
   */
  H_Mask = Left | Right | HCenter,

  /**
   * A mask of vertical alignment values.
   */
  V_Mask = Top | Bottom | VCenter,
}
