/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  AttachedProperty
} from '@phosphor/properties';

import {
  DOM
} from '@phosphor/utilities';

import {
  BoxEngine, BoxSizer
} from './boxengine';

import {
  PanelLayout
} from './panellayout';

import {
  Widget
} from './widget';


/**
 * A layout which arranges its widgets in a single row or column.
 */
export
class BoxLayout extends PanelLayout {
  /**
   * Construct a new box layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: BoxLayout.IOptions = {}) {
    super();
    if (options.direction !== undefined) {
      this._direction = options.direction;
    }
    if (options.spacing !== undefined) {
      this._spacing = Private.clampSpacing(options.spacing);
    }
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._box = null;
    this._sizers.length = 0;
    super.dispose();
  }

  /**
   * Get the layout direction for the box layout.
   */
  get direction(): BoxLayout.Direction {
    return this._direction;
  }

  /**
   * Set the layout direction for the box layout.
   */
  set direction(value: BoxLayout.Direction) {
    if (this._direction === value) {
      return;
    }
    this._direction = value;
    if (!this.parent) {
      return;
    }
    Private.toggleDirection(this.parent, value);
    this.parent.fit();
  }

  /**
   * Get the inter-element spacing for the box layout.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the inter-element spacing for the box layout.
   */
  set spacing(value: number) {
    value = Private.clampSpacing(value);
    if (this._spacing === value) {
      return;
    }
    this._spacing = value;
    if (!this.parent) {
      return;
    }
    this.parent.fit();
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    Private.toggleDirection(this.parent!, this.direction);
    super.init();
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
    // Create and add a new sizer for the widget.
    ArrayExt.insert(this._sizers, index, new BoxSizer());

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
    // Move the sizer for the widget.
    ArrayExt.move(this._sizers, fromIndex, toIndex);

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
    // Remove the sizer for the widget.
    ArrayExt.removeAt(this._sizers, index);

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
    // Compute the visible item count.
    let nVisible = 0;
    let widgets = this.widgets;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      nVisible += +!widgets[i].isHidden;
    }

    // Update the fixed space for the visible items.
    this._fixed = this._spacing * Math.max(0, nVisible - 1);

    // Setup the initial size limits.
    let minW = 0;
    let minH = 0;
    let maxW = Infinity;
    let maxH = Infinity;
    let horz = Private.isHorizontal(this._direction);
    if (horz) {
      minW = this._fixed;
      maxW = nVisible > 0 ? minW : maxW;
    } else {
      minH = this._fixed;
      maxH = nVisible > 0 ? minH : maxH;
    }

    // Update the sizers and computed size limits.
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets[i];
      let sizer = this._sizers[i];
      if (widget.isHidden) {
        sizer.minSize = 0;
        sizer.maxSize = 0;
        continue;
      }
      let limits = DOM.sizeLimits(widget.node);
      sizer.sizeHint = BoxLayout.getSizeBasis(widget);
      sizer.stretch = BoxLayout.getStretch(widget);
      if (horz) {
        sizer.minSize = limits.minWidth;
        sizer.maxSize = limits.maxWidth;
        minW += limits.minWidth;
        maxW += limits.maxWidth;
        minH = Math.max(minH, limits.minHeight);
        maxH = Math.min(maxH, limits.maxHeight);
      } else {
        sizer.minSize = limits.minHeight;
        sizer.maxSize = limits.maxHeight;
        minH += limits.minHeight;
        maxH += limits.maxHeight;
        minW = Math.max(minW, limits.minWidth);
        maxW = Math.min(maxW, limits.maxWidth);
      }
    }

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

    // Compute the layout area adjusted for border and padding.
    let top = box.paddingTop;
    let left = box.paddingLeft;
    let width = offsetWidth - box.horizontalSum;
    let height = offsetHeight - box.verticalSum;

    // Distribute the layout space and adjust the start position.
    switch (this._direction) {
    case 'left-to-right':
      BoxEngine.calc(this._sizers, Math.max(0, width - this._fixed));
      break;
    case 'top-to-bottom':
      BoxEngine.calc(this._sizers, Math.max(0, height - this._fixed));
      break;
    case 'right-to-left':
      BoxEngine.calc(this._sizers, Math.max(0, width - this._fixed));
      left += width;
      break;
    case 'bottom-to-top':
      BoxEngine.calc(this._sizers, Math.max(0, height - this._fixed));
      top += height;
      break;
    }

    // Layout the widgets using the computed box sizes.
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets[i];
      if (widget.isHidden) {
        continue;
      }
      let size = this._sizers[i].size;
      switch (this._direction) {
      case 'left-to-right':
        Widget.setGeometry(widget, left, top, size, height);
        left += size + this._spacing;
        break;
      case 'top-to-bottom':
        Widget.setGeometry(widget, left, top, width, size);
        top += size + this._spacing;
        break;
      case 'right-to-left':
        Widget.setGeometry(widget, left - size, top, size, height);
        left -= size + this._spacing;
        break;
      case 'bottom-to-top':
        Widget.setGeometry(widget, left, top - size, width, size);
        top -= size + this._spacing;
        break;
      }
    }
  }

  private _fixed = 0;
  private _spacing = 4;
  private _dirty = false;
  private _sizers: BoxSizer[] = [];
  private _box: DOM.IBoxSizing | null = null;
  private _direction: BoxLayout.Direction = 'top-to-bottom';
}


/**
 * The namespace for the `BoxLayout` class statics.
 */
export
namespace BoxLayout {
  /**
   * A type alias for a box layout direction.
   */
  export
  type Direction = (
    'left-to-right' | 'right-to-left' | 'top-to-bottom' | 'bottom-to-top'
  );

  /**
   * An options object for initializing a box layout.
   */
  export
  interface IOptions {
    /**
     * The direction of the layout.
     *
     * The default is `'top-to-bottom'`.
     */
    direction?: Direction;

    /**
     * The spacing between items in the layout.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * Get the box layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The box layout stretch factor for the widget.
   */
  export
  function getStretch(widget: Widget): number {
    return Private.stretchProperty.get(widget);
  }

  /**
   * Set the box layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export
  function setStretch(widget: Widget, value: number): void {
    Private.stretchProperty.set(widget, value);
  }

  /**
   * Get the box layout size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The box layout size basis for the widget.
   */
  export
  function getSizeBasis(widget: Widget): number {
    return Private.sizeBasisProperty.get(widget);
  }

  /**
   * Set the box layout size basis for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the size basis.
   */
  export
  function setSizeBasis(widget: Widget, value: number): void {
    Private.sizeBasisProperty.set(widget, value);
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The property descriptor for a widget stretch factor.
   */
  export
  const stretchProperty = new AttachedProperty<Widget, number>({
    name: 'stretch',
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildPropertyChanged
  });

  /**
   * The property descriptor for a widget size basis.
   */
  export
  const sizeBasisProperty = new AttachedProperty<Widget, number>({
    name: 'sizeBasis',
    create: () => 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildPropertyChanged
  });

  /**
   * Test whether a direction has horizontal orientation.
   */
  export
  function isHorizontal(dir: BoxLayout.Direction): boolean {
    return dir === 'left-to-right' || dir === 'right-to-left';
  }

  /**
   * Toggle the CSS direction class for the given widget.
   */
  export
  function toggleDirection(widget: Widget, dir: BoxLayout.Direction): void {
    widget.toggleClass('p-mod-left-to-right', dir === 'left-to-right');
    widget.toggleClass('p-mod-right-to-left', dir === 'right-to-left');
    widget.toggleClass('p-mod-top-to-bottom', dir === 'top-to-bottom');
    widget.toggleClass('p-mod-bottom-to-top', dir === 'bottom-to-top');
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * The change handler for the attached child properties.
   */
  function onChildPropertyChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof BoxLayout) {
      child.parent.fit();
    }
  }
}
