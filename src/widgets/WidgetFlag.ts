/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {


/**
 * An enum of widget bit flags.
 *
 * Widget flags are used to control various low-level behaviors of
 * a widget. They are typcially not used directly by user code.
 */
export
enum WidgetFlag {
  /**
   * The widget is attached to the DOM.
   */
  IsAttached = 0x1,

  /**
   * The widget is explicitly hidden.
   */
  IsHidden = 0x2,

  /**
   * The widget is visible.
   */
  IsVisible = 0x4,

  /**
   * The widget has been disposed.
   */
  IsDisposed = 0x8,

  /**
   * Changing the widget layout is disallowed.
   */
  DisallowLayoutChange = 0x10,
}

} // module phosphor.widgets
