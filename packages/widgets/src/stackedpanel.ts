/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  Panel
} from './panel';

import {
  StackedLayout
} from './stackedlayout';

import {
  Widget
} from './widget';


/**
 * A panel where visible widgets are stacked atop one another.
 *
 * #### Notes
 * This class provides a convenience wrapper around a [[StackedLayout]].
 */
export
class StackedPanel extends Panel {
  /**
   * Construct a new stacked panel.
   *
   * @param options - The options for initializing the panel.
   */
  constructor(options: StackedPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) });
    this.addClass('p-StackedPanel');
  }

  /**
   * A signal emitted when a widget is removed from a stacked panel.
   */
  get widgetRemoved(): ISignal<this, Widget> {
    return this._widgetRemoved;
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: Widget.ChildMessage): void {
    msg.child.addClass('p-StackedPanel-child');
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass('p-StackedPanel-child');
    this._widgetRemoved.emit(msg.child);
  }

  private _widgetRemoved = new Signal<this, Widget>(this);
}


/**
 * The namespace for the `StackedPanel` class statics.
 */
export
namespace StackedPanel {
  /**
   * A type alias for a widget horizontal alignment.
   */
  export
  type HorizontalAlignment = StackedLayout.HorizontalAlignment;

  /**
   * A type alias for a widget vertical alignment.
   */
  export
  type VerticalAlignment = StackedLayout.VerticalAlignment;

  /**
   * An options object for creating a stacked panel.
   */
  export
  interface IOptions {
    /**
     * The stacked layout to use for the stacked panel.
     *
     * The default is a new `StackedLayout`.
     */
    layout?: StackedLayout;
  }

  /**
   * Get the horizontal alignment for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The horizontal alignment for the widget.
   *
   * #### Notes
   * If the layout width allocated to a widget is larger than its max
   * width, the horizontal alignment controls how the widget is placed
   * within the extra horizontal space.
   *
   * If the allocated width is less than the widget's max width, the
   * horizontal alignment has no effect.
   */
  export
  function getHorizontalAlignment(widget: Widget): HorizontalAlignment {
    return StackedLayout.getHorizontalAlignment(widget);
  }

  /**
   * Set the horizontal alignment for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the alignment.
   *
   * #### Notes
   * If the layout width allocated to a widget is larger than its max
   * width, the horizontal alignment controls how the widget is placed
   * within the extra horizontal space.
   *
   * If the allocated width is less than the widget's max width, the
   * horizontal alignment has no effect.
   */
  export
  function setHorizontalAlignment(widget: Widget, value: HorizontalAlignment): void {
    StackedLayout.setHorizontalAlignment(widget, value);
  }

  /**
   * Get the vertical alignment for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The vertical alignment for the widget.
   *
   * #### Notes
   * If the layout height allocated to a widget is larger than its max
   * height, the vertical alignment controls how the widget is placed
   * within the extra vertical space.
   *
   * If the allocated height is less than the widget's max height, the
   * vertical alignment has no effect.
   */
  export
  function getVerticalAlignment(widget: Widget): VerticalAlignment {
    return StackedLayout.getVerticalAlignment(widget);
  }

  /**
   * Set the vertical alignment for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the alignment.
   *
   * #### Notes
   * If the layout height allocated to a widget is larger than its max
   * height, the vertical alignment controls how the widget is placed
   * within the extra vertical space.
   *
   * If the allocated height is less than the widget's max height, the
   * vertical alignment has no effect.
   */
  export
  function setVerticalAlignment(widget: Widget, value: VerticalAlignment): void {
    StackedLayout.setVerticalAlignment(widget, value);
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create a stacked layout for the given panel options.
   */
  export
  function createLayout(options: StackedPanel.IOptions): StackedLayout {
    return options.layout || new StackedLayout();
  }
}
