/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Size = utility.Size;


/**
 * An object which manages an item in a layout.
 */
export
interface ILayoutItem {
  /**
   * Test whether the item manages a widget.
   */
  isWidget: boolean;

  /**
   * Test whether the item manages empty space.
   */
  isSpacer: boolean;

  /**
   * Test whether the item should be treated as hidden.
   */
  isHidden: boolean;

  /**
   * The widget the item manages, if any.
   */
  widget: Widget;

  /**
   * The size basis for the item.
   *
   * This is used as the initial size for the item in the direction
   * of layout before the item is sized to account for its siblings.
   *
   * A basis of -1 means the basis should be chosen automatically.
   */
  basis: number;

  /**
   * The stretch factor for the item.
   */
  stretch: number;

  /**
   * Test whether the item is expansive.
   *
   * If this is true, this item will get as much space as possible in
   * the direction of layout, but only after all other sibling items
   * with a stretch factor > 0 have been sized to their maximum.
   */
  expansive: boolean;

  /**
   * The alignment for the item within its layout cell.
   */
  alignment: Alignment;

  /**
   * Invalidate the cached data for the item.
   */
  invalidate(): void;

  /**
   * Compute the minimum allowed size of the item.
   */
  minSize(): Size;

  /**
   * Compute the maximum allowed size of the item.
   */
  maxSize(): Size;

  /**
   * Set the geometry rect of the item using the given values.
   */
  setRect(x: number, y: number, width: number, height: number): void;
}

} // module phosphor.widgets
