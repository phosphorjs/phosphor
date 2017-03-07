/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, each
} from '@phosphor/algorithm';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  AttachedProperty
} from '@phosphor/properties';

import {
  LayoutItem
} from './layoutitem';

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
    // Dispose of the layout items.
    each(this._items, item => { item.dispose(); });

    // Clear the layout state.
    this._box = null;
    this._items.length = 0;

    // Dispose of the rest of the layout.
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
    // Create and add a new layout item for the widget.
    ArrayExt.insert(this._items, index, new LayoutItem(widget));

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
    // Move the layout item for the widget.
    ArrayExt.move(this._items, fromIndex, toIndex);

    // Post an update request for the parent widget.
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
    // Remove the layout item for the widget.
    let item = ArrayExt.removeAt(this._items, index);

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

    // Reset the z-index for the widget.
    item!.widget.node.style.zIndex = '';

    // Dispose of the layout item.
    item!.dispose();

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
    // Set up the computed minimum size.
    let minW = 0;
    let minH = 0;

    // Update the computed minimum size.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      let item = this._items[i];

      // Ignore hidden items.
      if (item.isHidden) {
        continue;
      }

      // Update the size limits for the item.
      item.fit();

      // Update the computed minimum size.
      minW = Math.max(minW, item.minWidth);
      minH = Math.max(minH, item.minHeight);
    }

    // Update the box sizing and add it to the computed min size.
    let box = this._box = ElementExt.boxSizing(this.parent!.node);
    minW += box.horizontalSum;
    minH += box.verticalSum;

    // Update the parent's min size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;

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

    // Compute the visible item count.
    let nVisible = 0;
    for (let i = 0, n = this._items.length; i < n; ++i) {
      nVisible += +!this._items[i].isHidden;
    }

    // Bail early if there are no visible items to layout.
    if (nVisible === 0) {
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
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node);
    }

    // Compute the actual layout bounds adjusted for border and padding.
    let top = this._box.paddingTop;
    let left = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Update the widget stacking order and layout geometry.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      let item = this._items[i];

      // Ignore hidden items.
      if (item.isHidden) {
        continue;
      }

      // Fetch the alignment for the widget.
      let hAlign = StackedLayout.getHorizontalAlignment(item.widget);
      let vAlign = StackedLayout.getVerticalAlignment(item.widget);

      // Set the z-index for the widget.
      item.widget.node.style.zIndex = `${i}`;

      // Update the item geometry.
      item.update(left, top, width, height, hAlign, vAlign);
    }
  }

  private _dirty = false;
  private _items: LayoutItem[] = [];
  private _box: ElementExt.IBoxSizing | null = null;
}


/**
 * The namespace for the `StackedLayout` class statics.
 */
export
namespace StackedLayout {
  /**
   * A type alias for a widget horizontal alignment.
   */
  export
  type HorizontalAlignment = LayoutItem.HorizontalAlignment;

  /**
   * A type alias for a widget vertical alignment.
   */
  export
  type VerticalAlignment = LayoutItem.VerticalAlignment;

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
    return Private.horizontalAlignmentProperty.get(widget);
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
    Private.horizontalAlignmentProperty.set(widget, value);
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
    return Private.verticalAlignmentProperty.get(widget);
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
    Private.verticalAlignmentProperty.set(widget, value);
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The property descriptor for a widget horizontal alignment.
   */
  export
  const horizontalAlignmentProperty = new AttachedProperty<Widget, StackedLayout.HorizontalAlignment>({
    name: 'horizontalAlignment',
    create: () => 'center',
    changed: onChildAlignmentChanged
  });

  /**
   * The property descriptor for a widget vertical alignment.
   */
  export
  const verticalAlignmentProperty = new AttachedProperty<Widget, StackedLayout.VerticalAlignment>({
    name: 'verticalAlignment',
    create: () => 'top',
    changed: onChildAlignmentChanged
  });

  /**
   * The change handler for the attached alignment properties.
   */
  function onChildAlignmentChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof StackedLayout) {
      child.parent.update();
    }
  }
}
