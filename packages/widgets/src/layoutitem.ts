/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDisposable
} from '@phosphor/disposable';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  MessageLoop
} from '@phosphor/messaging';

import {
  AttachedProperty
} from '@phosphor/properties';

import {
  Widget
} from './widget';


/**
 * An object which assists in the absolute layout of widgets.
 *
 * #### Notes
 * This class is useful when implementing a layout which arranges its
 * widgets using absolute positioning.
 *
 * This class is used by nearly all of the built-in Phosphor layouts.
 */
export
class LayoutItem implements IDisposable {
  /**
   * Construct a new layout item.
   *
   * @param widget - The widget to be managed by the item.
   */
  constructor(widget: Widget) {
    this.widget = widget;
    this.widget.node.style.position = 'absolute';
  }

  /**
   * Dispose of the resources held by the layout item.
   */
  dispose(): void {
    // Do nothing if the item is already disposed.
    if (this._disposed) {
      return;
    }

    // Mark the item as disposed.
    this._disposed = true;

    // Reset the widget style.
    let style = this.widget.node.style;
    style.position = '';
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
  }

  /**
   * The widget managed by the layout item.
   */
  readonly widget: Widget;

  /**
   * The computed minimum width of the widget.
   *
   * #### Notes
   * This value can be updated by calling `.fit()`.
   */
  minWidth = 0;

  /**
   * The computed minimum height of the widget.
   *
   * #### Notes
   * This value can be updated by calling `.fit()`.
   */
  minHeight = 0;

  /**
   * The computed maximum width of the widget.
   *
   * #### Notes
   * This value can be updated by calling `.fit()`.
   */
  maxWidth = Infinity;

  /**
   * The computed maximum height of the widget.
   *
   * #### Notes
   * This value can be updated by calling `.fit()`.
   */
  maxHeight = Infinity;

  /**
   * Whether the layout item is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Whether the managed widget is hidden.
   */
  get isHidden(): boolean {
    return this.widget.isHidden;
  }

  /**
   * Whether the managed widget is visible.
   */
  get isVisible(): boolean {
    return this.widget.isVisible;
  }

  /**
   * Whether the managed widget is attached.
   */
  get isAttached(): boolean {
    return this.widget.isAttached;
  }

  /**
   * Compute the size limits of the managed widget.
   *
   * #### Notes
   * This updates the item size limit values in-place.
   */
  fit(): void {
    let limits = ElementExt.sizeLimits(this.widget.node);
    this.minWidth = limits.minWidth;
    this.minHeight = limits.minHeight;
    this.maxWidth = limits.maxWidth;
    this.maxHeight = limits.maxHeight;
  }

  /**
   * Update the position and size of the managed item.
   *
   * @param left - The left edge position of the layout box.
   *
   * @param top - The top edge position of the layout box.
   *
   * @param width - The width of the layout box.
   *
   * @param height - The height of the layout box.
   */
  update(left: number, top: number, width: number, height: number): void {
    // Clamp the size to the widget's size limits.
    let clampW = Math.max(this.minWidth, Math.min(width, this.maxWidth));
    let clampH = Math.max(this.minHeight, Math.min(height, this.maxHeight));

    // Ajdust the left edge position if needed.
    switch (LayoutItem.getHorizontalAlignment(this.widget)) {
    case 'left':
      break;
    case 'center':
      if (clampW < width) {
        left += (width - clampW) / 2;
      }
      break;
    case 'right':
      if (clampW < width) {
        left += width - clampW;
      }
      break;
    default:
      throw 'unreachable';
    }

    // Ajdust the top edge position if needed.
    switch (LayoutItem.getVerticalAlignment(this.widget)) {
    case 'top':
      break;
    case 'center':
      if (clampH < height) {
        top += (height - clampH) / 2;
      }
      break;
    case 'bottom':
      if (clampH < height) {
        top += height - clampH;
      }
      break;
    default:
      throw 'unreachable';
    }

    // Set up the resize variables.
    let resized = false;
    let style = this.widget.node.style;

    // Update the top edge of the widget if needed.
    if (this._top !== top) {
      this._top = top;
      style.top = `${top}px`;
    }

    // Update the left edge of the widget if needed.
    if (this._left !== left) {
      this._left = left;
      style.left = `${left}px`;
    }

    // Update the width of the widget if needed.
    if (this._width !== clampW) {
      resized = true;
      this._width = clampW;
      style.width = `${clampW}px`;
    }

    // Update the height of the widget if needed.
    if (this._height !== clampH) {
      resized = true;
      this._height = clampH;
      style.height = `${clampH}px`;
    }

    // Send a resize message to the widget if needed.
    if (resized) {
      let msg = new Widget.ResizeMessage(clampW, clampH);
      MessageLoop.sendMessage(this.widget, msg);
    }
  }

  private _top = NaN;
  private _left = NaN;
  private _width = NaN;
  private _height = NaN;
  private _disposed = false;
}


/**
 * The namespace for the `LayoutItem` class statics.
 */
export
namespace LayoutItem {
  /**
   * A type alias for the supported horizontal alignments.
   */
  export
  type HorizontalAlignment = 'left' | 'center' | 'right';

  /**
   * A type alias for the supported vertical alignments.
   */
  export
  type VerticalAlignment = 'top' | 'center' | 'bottom';

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
  const horizontalAlignmentProperty = new AttachedProperty<Widget, LayoutItem.HorizontalAlignment>({
    name: 'horizontalAlignment',
    create: () => 'center',
    changed: onAlignmentChanged
  });

  /**
   * The property descriptor for a widget vertical alignment.
   */
  export
  const verticalAlignmentProperty = new AttachedProperty<Widget, LayoutItem.VerticalAlignment>({
    name: 'verticalAlignment',
    create: () => 'top',
    changed: onAlignmentChanged
  });

  /**
   * The change handler for the alignment properties.
   */
  function onAlignmentChanged(child: Widget): void {
    if (child.parent && child.parent.layout) {
      child.parent.update();
    }
  }
}
