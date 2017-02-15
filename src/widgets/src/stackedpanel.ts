/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
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
    this.addClass(StackedPanel.STACKED_PANEL_CLASS);
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
    msg.child.addClass(StackedPanel.CHILD_CLASS);
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    msg.child.removeClass(StackedPanel.CHILD_CLASS);
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
   * The class name added to StackedPanel instances.
   */
  export
  const STACKED_PANEL_CLASS = 'p-StackedPanel';

  /**
   * The class name added to a StackedPanel child.
   */
  export
  const CHILD_CLASS = 'p-StackedPanel-child';

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
