/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

/**
 * A sizing item for the `layoutCalc` function.
 */
export
class SizingItem {
  /**
   * The preferred size of the item.
   */
  sizeHint = 0;

  /**
   * The minimum size of the item.
   *
   * The item will never sized less than this value.
   *
   * Limits: [0, Infinity) && <= maxSize
   */
  minSize = 0;

  /**
   * The maximum size of the item.
   *
   * The item will never be sized greater than this value.
   *
   * Limits: [0, Infinity] && >= minSize
   */
  maxSize = Infinity;

  /**
   * The stretch factor for the item.
   *
   * This controls how much the item stretches relative to the other
   * items when layout space is distributed. An item with a stretch
   * factor of zero will only be resized after all stretch items
   * and expansive items have been sized to their limits.
   *
   * Limits: [0, Infinity)
   */
  stretch = 1;

  /**
   * Whether the item should consume extra space if available.
   *
   * Expansive items will absorb any remaining space after all
   * stretch items have been resized to their limits.
   */
  expansive = false;

  /**
   * The computed size of the item.
   *
   * This value is the output of the algorithm.
   */
  size = 0;

  /**
   * An internal storage property for the layout algorithm.
   */
  done = false;
}

} // module phosphor.layout
