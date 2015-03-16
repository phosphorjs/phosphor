/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

import IDisposable = core.IDisposable;
import IEventFilter = core.IEventFilter;

import Size = geometry.Size;

import Widget = widgets.Widget;


/**
 * An object which manages the layout for its parent widget.
 *
 * The parent widget will automatically install the layout as an
 * event filter, allowing the layout to react to all widget events.
 */
export
interface ILayout extends IEventFilter, IDisposable {
  /**
   * The parent widget of the layout.
   *
   * This assigned automatically when the layout is installed on a
   * widget. The layout is single-use only and will be disposed of
   * by the parent widget when the widget's layout is changed. It
   * should not be set directly by user code.
   */
  parentWidget: Widget;

  /**
   * Invalidate the cached layout data and queue an update.
   */
  invalidate(): void;

  /**
   * Compute the preferred size of the layout.
   */
  sizeHint(): Size;

  /**
   * Compute the minimum allowed size of the layout.
   */
  minSize(): Size;

  /**
   * Compute the maximum allowed size of the layout.
   */
  maxSize(): Size;
}

} // module phosphor.layout
