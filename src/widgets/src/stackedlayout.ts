/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  DOM
} from '@phosphor/utilities';

import {
  PanelLayout
} from './panellayout';

import {
  Widget
} from './widget';


/**
 * A layout where visible widgets are stacked atop one another.
 *
 * #### Notes
 * The Z-order of the visible widgets follows their layout order.
 */
export
class StackedLayout extends PanelLayout {
  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._box = null;
    super.dispose();
  }

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

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
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
    // No logic is needed other than an update.
    this.parent!.update();
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
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Reset the layout geometry for the widget.
    Widget.resetGeometry(widget);

    // Reset the z-index for the widget.
    widget.node.style.zIndex = '';

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this.parent!.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
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
      let widget = widgets[i];
      if (widget.isHidden) {
        continue;
      }
      let limits = DOM.sizeLimits(widget.node);
      minW = Math.max(minW, limits.minWidth);
      minH = Math.max(minH, limits.minHeight);
      maxW = Math.min(maxW, limits.maxWidth);
      maxH = Math.min(maxH, limits.maxHeight);
    }

    // Ensure max limits >= min limits.
    maxW = Math.max(minW, maxW);
    maxH = Math.max(minH, maxH);

    // Update the box sizing and add it to the size constraints.
    let box = this._box = DOM.boxSizing(this.parent!.node);
    minW += box.horizontalSum;
    minH += box.verticalSum;
    maxW += box.horizontalSum;
    maxH += box.verticalSum;

    // Update the parent's size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;
    style.maxWidth = maxW === Infinity ? 'none' : `${maxW}px`;
    style.maxHeight = maxH === Infinity ? 'none' : `${maxH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
    }
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
      offsetWidth = this.parent!.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    let box = this._box || (this._box = DOM.boxSizing(this.parent!.node));

    // Compute the actual layout bounds adjusted for border and padding.
    let top = box.paddingTop;
    let left = box.paddingLeft;
    let width = offsetWidth - box.horizontalSum;
    let height = offsetHeight - box.verticalSum;

    // Update the widget stacking order and layout geometry.
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets[i];
      if (widget.isHidden) {
        continue;
      }
      widget.node.style.zIndex = `${i}`;
      Widget.setGeometry(widget, left, top, width, height);
    }
  }

  private _dirty = false;
  private _box: DOM.IBoxSizing | null = null;
}
