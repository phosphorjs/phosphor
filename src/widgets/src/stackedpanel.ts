/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message, sendMessage
} from '../core/messaging';

import {
  ISignal, defineSignal
} from '../core/signaling';

import {
  IS_EDGE, IS_IE
} from '../dom/platform';

import {
  IBoxSizing, boxSizing, sizeLimits
} from '../dom/sizing';

import {
  Panel, PanelLayout
} from './panel';

import {
  ChildMessage, ResizeMessage, Widget, WidgetMessage
} from './widget';


/**
 * The class name added to StackedPanel instances.
 */
const STACKED_PANEL_CLASS = 'p-StackedPanel';

/**
 * The class name added to a StackedPanel child.
 */
const CHILD_CLASS = 'p-StackedPanel-child';


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
    this.addClass(STACKED_PANEL_CLASS);
  }

  /**
   * A signal emitted when a widget is removed from a stacked panel.
   */
  widgetRemoved: ISignal<StackedPanel, Widget>;

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: ChildMessage): void {
    msg.child.addClass(CHILD_CLASS);
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    msg.child.removeClass(CHILD_CLASS);
    this.widgetRemoved.emit(msg.child);
  }
}


// Define the signals for the `StackedPanel` class.
defineSignal(StackedPanel.prototype, 'widgetRemoved');


/**
 * The namespace for the `StackedPanel` class statics.
 */
export
namespace StackedPanel {
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
 * A layout where visible widgets are stacked atop one another.
 *
 * #### Notes
 * The Z-order of the visible widgets follows their layout order.
 */
export
class StackedLayout extends PanelLayout {
  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected attachWidget(index: number, widget: Widget): void {
    // Prepare the layout geometry for the widget.
    Widget.prepareGeometry(widget);

    // Add the widget's node to the parent.
    this.parent.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.AfterAttach);

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * Move a widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected moveWidget(fromIndex: number, toIndex: number, widget: Widget): void {
    // Post an update request for the parent widget.
    this.parent.update();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a reimplementation of the superclass method.
   */
  protected detachWidget(index: number, widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.BeforeDetach);

    // Remove the widget's node from the parent.
    this.parent.node.removeChild(widget.node);

    // Reset the layout geometry for the widget.
    Widget.resetGeometry(widget);

    // Reset the z-index for the widget.
    widget.node.style.zIndex = '';

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   */
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.parent.update();
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.parent.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: ChildMessage): void {
    if (IS_IE || IS_EDGE) { // prevent flicker on IE/Edge
      sendMessage(this.parent, WidgetMessage.FitRequest);
    } else {
      this.parent.fit();
    }
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: ChildMessage): void {
    if (IS_IE || IS_EDGE) { // prevent flicker on IE/Edge
      sendMessage(this.parent, WidgetMessage.FitRequest);
    } else {
      this.parent.fit();
    }
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: ResizeMessage): void {
    if (this.parent.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent.isAttached) {
      this._fit();
    }
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Setup the initial size limits.
    let minW = 0;
    let minH = 0;
    let maxW = Infinity;
    let maxH = Infinity;

    // Update the computed size limits.
    let widgets = this.widgets;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets.at(i);
      if (widget.isHidden) {
        continue;
      }
      let limits = sizeLimits(widget.node);
      minW = Math.max(minW, limits.minWidth);
      minH = Math.max(minH, limits.minHeight);
      maxW = Math.min(maxW, limits.maxWidth);
      maxH = Math.min(maxH, limits.maxHeight);
    }

    // Ensure max limits >= min limits.
    maxW = Math.max(minW, maxW);
    maxH = Math.max(minH, maxH);

    // Update the box sizing and add it to the size constraints.
    let box = this._box = boxSizing(this.parent.node);
    minW += box.horizontalSum;
    minH += box.verticalSum;
    maxW += box.horizontalSum;
    maxH += box.verticalSum;

    // Update the parent's size constraints.
    let style = this.parent.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;
    style.maxWidth = maxW === Infinity ? 'none' : `${maxW}px`;
    style.maxHeight = maxH === Infinity ? 'none' : `${maxH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    let ancestor = this.parent.parent;
    if (ancestor) sendMessage(ancestor, WidgetMessage.FitRequest);

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) sendMessage(this.parent, WidgetMessage.UpdateRequest);
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(offsetWidth: number, offsetHeight: number): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Bail early if there are no widgets to layout.
    let widgets = this.widgets;
    if (widgets.length === 0) {
      return;
    }

    // Measure the parent if the offset dimensions are unknown.
    if (offsetWidth < 0) {
      offsetWidth = this.parent.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    let box = this._box || (this._box = boxSizing(this.parent.node));

    // Compute the actual layout bounds adjusted for border and padding.
    let top = box.paddingTop;
    let left = box.paddingLeft;
    let width = offsetWidth - box.horizontalSum;
    let height = offsetHeight - box.verticalSum;

    // Update the widget stacking order and layout geometry.
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets.at(i);
      if (widget.isHidden) {
        continue;
      }
      widget.node.style.zIndex = `${i}`;
      Widget.setGeometry(widget, left, top, width, height);
    }
  }

  private _dirty = false;
  private _box: IBoxSizing = null;
}


/**
 * The namespace for the private module data.
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
