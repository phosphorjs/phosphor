/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {


/**
 * An enum of size policy values.
 *
 * A size policy controls how a layout interprets a widget's `sizeHint`.
 */
export
enum SizePolicy {
  /**
   * A policy indicating that the `sizeHint` is the only acceptable
   * size for the widget.
   */
  Fixed = 0,

  /**
   * A bit flag indicating the widget can grow beyond `sizeHint`.
   */
  GrowFlag = 0x1,

  /**
   * A bit flag indicating the widget can shrink below `sizeHint`.
   */
  ShrinkFlag = 0x2,

  /**
   * A bit flag indicating the widget should expand beyond `sizeHint`.
   */
  ExpandFlag = 0x4,

  /**
   * A bit flag indicating the `sizeHint` is ignored.
   */
  IgnoreFlag = 0x8,

  /**
   * A policy indicating that the `sizeHint` is a minimum, but the
   * widget can be expanded if needed and still be useful.
   */
  Minimum = GrowFlag,

  /**
   * A policy indicating that the `sizeHint` is a maximum, but the
   * widget can be shrunk if needed and still be useful.
   */
  Maximum = ShrinkFlag,

  /**
   * A policy indicating that the `sizeHint` is preferred, but the
   * widget can grow or shrink if needed and still be useful.
   *
   * This is the default size policy.
   */
  Preferred = GrowFlag | ShrinkFlag,

  /**
   * A policy indicating that `sizeHint` is reasonable, but the widget
   * can shrink if needed and still be useful. It can also make use of
   * extra space and should expand as much as possible.
   */
  Expanding = GrowFlag | ShrinkFlag | ExpandFlag,

  /**
   * A policy indicating that `sizeHint` is a minimum. The widget can
   * make use of extra space and should expand as much as possible.
   */
  MinimumExpanding = GrowFlag | ExpandFlag,

  /**
   * A policy indicating the `sizeHint` is ignored.
   */
  Ignored = GrowFlag | ShrinkFlag | IgnoreFlag,
}

} // module phosphor.widgets
