/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each, map, reduce, toArray
} from '../algorithm/iteration';

import {
  move
} from '../algorithm/mutation';

import {
  findIndex
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

import {
  Vector
} from '../collections/vector';

import {
  IDisposable
} from '../core/disposable';

import {
  Message, sendMessage
} from '../core/messaging';

import {
  AttachedProperty
} from '../core/properties';

import {
  overrideCursor
} from '../dom/cursor';

import {
  IS_EDGE, IS_IE
} from '../dom/platform';

import {
  IBoxSizing, boxSizing, sizeLimits
} from '../dom/sizing';

import {
  BoxSizer, adjustSizer, boxCalc
} from './boxengine';

import {
  Panel, PanelLayout
} from './panel';

import {
  ChildMessage, ResizeMessage, Widget, WidgetMessage
} from './widget';


/**
 * The class name added to SplitPanel instances.
 */
const SPLIT_PANEL_CLASS = 'p-SplitPanel';

/**
 * The class name added to split panel children.
 */
const CHILD_CLASS = 'p-SplitPanel-child';

/**
 * The class name added to split panel handles.
 */
const HANDLE_CLASS = 'p-SplitPanel-handle';

/**
 * The class name added to hidden split handles.
 */
const HIDDEN_CLASS = 'p-mod-hidden';

/**
 * The class name added to horizontal split panels.
 */
const HORIZONTAL_CLASS = 'p-mod-horizontal';

/**
 * The class name added to vertical split panels.
 */
const VERTICAL_CLASS = 'p-mod-vertical';


/**
 * A panel which arranges its widgets into resizable sections.
 *
 * #### Notes
 * This class provides a convenience wrapper around a [[SplitLayout]].
 */
export
class SplitPanel extends Panel {
  /**
   * Construct a new split panel.
   *
   * @param options - The options for initializing the split panel.
   */
  constructor(options: SplitPanel.IOptions = {}) {
    super({ layout: Private.createLayout(options) });
    this.addClass(SPLIT_PANEL_CLASS);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this._releaseMouse();
    super.dispose();
  }

  /**
   * Get the layout orientation for the split panel.
   */
  get orientation(): SplitPanel.Orientation {
    return (this.layout as SplitLayout).orientation;
  }

  /**
   * Set the layout orientation for the split panel.
   */
  set orientation(value: SplitPanel.Orientation) {
    (this.layout as SplitLayout).orientation = value;
  }

  /**
   * Get the inter-element spacing for the split panel.
   */
  get spacing(): number {
    return (this.layout as SplitLayout).spacing;
  }

  /**
   * Set the inter-element spacing for the split panel.
   */
  set spacing(value: number) {
    (this.layout as SplitLayout).spacing = value;
  }

  /**
   * The renderer used by the split panel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get renderer(): SplitPanel.IRenderer {
    return (this.layout as SplitLayout).renderer;
  }

  /**
   * A read-only sequence of the split handles in the panel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get handles(): ISequence<HTMLDivElement> {
    return (this.layout as SplitLayout).handles;
  }

  /**
   * Get the relative sizes of the widgets in the panel.
   *
   * @returns A new array of the relative sizes of the widgets.
   *
   * #### Notes
   * The returned sizes reflect the sizes of the widgets normalized
   * relative to their siblings.
   *
   * This method **does not** measure the DOM nodes.
   */
  relativeSizes(): number[] {
    return (this.layout as SplitLayout).relativeSizes();
  }

  /**
   * Set the relative sizes for the widgets in the panel.
   *
   * @param sizes - The relative sizes for the widgets in the panel.
   *
   * #### Notes
   * Extra values are ignored, too few will yield an undefined layout.
   *
   * The actual geometry of the DOM nodes is updated asynchronously.
   */
  setRelativeSizes(sizes: number[]): void {
    (this.layout as SplitLayout).setRelativeSizes(sizes);
  }

  /**
   * Handle the DOM events for the split panel.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the panel's DOM node. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
      break;
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('mousedown', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: ChildMessage): void {
    msg.child.addClass(CHILD_CLASS);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    msg.child.removeClass(CHILD_CLASS);
    this._releaseMouse();
  }

  /**
   * Handle the `'keydown'` event for the split panel.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) this._releaseMouse();
  }

  /**
   * Handle the `'mousedown'` event for the split panel.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if the left mouse button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Find the handle which contains the mouse target, if any.
    let layout = this.layout as SplitLayout;
    let target = event.target as HTMLElement;
    let index = findIndex(layout.handles, handle => handle.contains(target));
    if (index === -1) {
      return;
    }

    // Stop the event when a split handle is pressed.
    event.preventDefault();
    event.stopPropagation();

    // Add the extra document listeners.
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('keydown', this, true);
    document.addEventListener('contextmenu', this, true);

    // Compute the offset delta for the handle press.
    let delta: number;
    let handle = layout.handles.at(index);
    let rect = handle.getBoundingClientRect();
    if (layout.orientation === 'horizontal') {
      delta = event.clientX - rect.left;
    } else {
      delta = event.clientY - rect.top;
    }

    // Override the cursor and store the press data.
    let style = window.getComputedStyle(handle);
    let override = overrideCursor(style.cursor);
    this._pressData = { index, delta, override };
  }

  /**
   * Handle the `'mousemove'` event for the split panel.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Stop the event when dragging a split handle.
    event.preventDefault();
    event.stopPropagation();

    // Compute the desired offset position for the handle.
    let pos: number;
    let layout = this.layout as SplitLayout;
    let rect = this.node.getBoundingClientRect();
    if (layout.orientation === 'horizontal') {
      pos = event.clientX - rect.left - this._pressData.delta;
    } else {
      pos = event.clientY - rect.top - this._pressData.delta;
    }

    // Set the handle as close to the desired position as possible.
    layout.setHandlePosition(this._pressData.index, pos);
  }

  /**
   * Handle the `'mouseup'` event for the split panel.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if the left mouse button is not released.
    if (event.button !== 0) {
      return;
    }

    // Stop the event when releasing a handle.
    event.preventDefault();
    event.stopPropagation();

    // Finalize the mouse release.
    this._releaseMouse();
  }

  /**
   * Release the mouse grab for the split panel.
   */
  private _releaseMouse(): void {
    // Bail early if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Clear the override cursor.
    this._pressData.override.dispose();
    this._pressData = null;

    // Remove the extra document listeners.
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  private _pressData: Private.IPressData = null;
}


/**
 * The namespace for the `SplitPanel` class statics.
 */
export
namespace SplitPanel {
  /**
   * A type alias for a split panel orientation.
   */
  export
  type Orientation = SplitLayout.Orientation;

  /**
   * A type alias for a split panel renderer;
   */
  export
  type IRenderer = SplitLayout.IRenderer;

  /**
   * An options object for initializing a split panel.
   */
  export
  interface IOptions {
    /**
     * The renderer to use for the split panel.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;

    /**
     * The layout orientation of the panel.
     *
     * The default is `'horizontal'`.
     */
    orientation?: Orientation;

    /**
     * The spacing between items in the panel.
     *
     * The default is `4`.
     */
    spacing?: number;

    /**
     * The split layout to use for the split panel.
     *
     * If this is provided, the other options are ignored.
     *
     * The default is a new `SplitLayout`.
     */
    layout?: SplitLayout;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Create a new handle node for use with a split panel.
     *
     * @returns A new handle node for a split panel.
     */
    createHandleNode(): HTMLDivElement {
      let node = document.createElement('div');
      node.className = HANDLE_CLASS;
      return node;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();

  /**
   * Get the split panel stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The split panel stretch factor for the widget.
   */
  export
  function getStretch(widget: Widget): number {
    return SplitLayout.getStretch(widget);
  }

  /**
   * Set the split panel stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export
  function setStretch(widget: Widget, value: number): void {
    SplitLayout.setStretch(widget, value);
  }
}


/**
 * A layout which arranges its widgets into resizable sections.
 */
export
class SplitLayout extends PanelLayout {
  /**
   * Construct a new split layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: SplitLayout.IOptions) {
    super();
    this._renderer = options.renderer;
    if (options.orientation !== void 0) {
      this._orientation = options.orientation;
    }
    if (options.spacing !== void 0) {
      this._spacing = Private.clampSpacing(options.spacing);
    }
  }

  /**
   * Get the layout orientation for the split layout.
   */
  get orientation(): SplitLayout.Orientation {
    return this._orientation;
  }

  /**
   * Set the layout orientation for the split layout.
   */
  set orientation(value: SplitLayout.Orientation) {
    if (this._orientation === value) {
      return;
    }
    this._orientation = value;
    if (!this.parent) {
      return;
    }
    Private.toggleOrientation(this.parent, value);
    this.parent.fit();
  }

  /**
   * Get the inter-element spacing for the split layout.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the inter-element spacing for the split layout.
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
   * The renderer used by the split layout.
   *
   * #### Notes
   * This is a read-only property.
   */
  get renderer(): SplitLayout.IRenderer {
    return this._renderer;
  }

  /**
   * A read-only sequence of the split handles in the layout.
   *
   * #### Notes
   * This is a read-only property.
   */
  get handles(): ISequence<HTMLDivElement> {
    return this._handles;
  }

  /**
   * Get the relative sizes of the widgets in the layout.
   *
   * @returns A new array of the relative sizes of the widgets.
   *
   * #### Notes
   * The returned sizes reflect the sizes of the widgets normalized
   * relative to their siblings.
   *
   * This method **does not** measure the DOM nodes.
   */
  relativeSizes(): number[] {
    return Private.normalize(toArray(map(this._sizers, sizer => sizer.size)));
  }

  /**
   * Set the relative sizes for the widgets in the layout.
   *
   * @param sizes - The relative sizes for the widgets in the panel.
   *
   * #### Notes
   * Extra values are ignored, too few will yield an undefined layout.
   *
   * The actual geometry of the DOM nodes is updated asynchronously.
   */
  setRelativeSizes(sizes: number[]): void {
    // Copy the sizes and pad with zeros as needed.
    let n = this._sizers.length;
    let temp = sizes.slice(0, n);
    while (temp.length < n) temp.push(0);

    // Normalize the padded sizes.
    let normed = Private.normalize(temp);

    // Apply the normalized sizes to the sizers.
    for (let i = 0; i < n; ++i) {
      let sizer = this._sizers.at(i);
      sizer.sizeHint = sizer.size = normed[i];
    }

    // Set the flag indicating the sizes are normalized.
    this._hasNormedSizes = true;

    // Trigger an update of the parent widget.
    if (this.parent) this.parent.update();
  }

  // TODO rename this to `moveHandle`
  /**
   * Set the offset position of a split handle.
   *
   * @param index - The index of the handle of the interest.
   *
   * @param position - The desired offset position of the handle.
   *
   * #### Notes
   * The position is relative to the offset parent.
   *
   * This will move the handle as close as possible to the desired
   * position. The sibling widgets will be adjusted as necessary.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral or out of range.
   */
  setHandlePosition(index: number, position: number): void {
    // Bail if the index is invalid or the handle is hidden.
    let handle = this._handles.at(index);
    if (!handle || handle.classList.contains(HIDDEN_CLASS)) {
      return;
    }

    // Compute the desired delta movement for the handle.
    let delta: number;
    if (this._orientation === 'horizontal') {
      delta = position - handle.offsetLeft;
    } else {
      delta = position - handle.offsetTop;
    }

    // Bail if there is no handle movement.
    if (delta === 0) {
      return;
    }

    // Prevent widget resizing unless needed.
    each(this._sizers, sizer => {
      // TODO is this check actually necessary?
      if (sizer.size > 0) sizer.sizeHint = sizer.size;
    });

    // Adjust the sizers to reflect the handle movement.
    adjustSizer(this._sizers, index, delta);

    // Update the layout of the widgets.
    if (this.parent) this.parent.update();
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    Private.toggleOrientation(this.parent, this.orientation);
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
    // Create and add the handle and sizer for the new widget.
    let handle = Private.createHandle(this._renderer);
    let average = Private.averageSize(this._sizers);
    let sizer = Private.createSizer(average);
    this._sizers.insert(index, sizer);
    this._handles.insert(index, handle);

    // Prepare the layout geometry for the widget.
    Widget.prepareGeometry(widget);

    // Add the widget and handle nodes to the parent.
    this.parent.node.appendChild(widget.node);
    this.parent.node.appendChild(handle);

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
    // Move the sizer and handle for the widget.
    move(this._sizers, fromIndex, toIndex);
    move(this._handles, fromIndex, toIndex);

    // Post a fit request to the parent to show/hide last handle.
    this.parent.fit();
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
    // Remove the handle for the widget.
    let handle = this._handles.removeAt(index);

    // Remove the sizer for the widget.
    this._sizers.removeAt(index);

    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.BeforeDetach);

    // Remove the widget and handle nodes from the parent.
    this.parent.node.removeChild(widget.node);
    this.parent.node.removeChild(handle);

    // Reset the layout geometry for the widget.
    Widget.resetGeometry(widget);

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
    // Update the handles and track the visible widget count.
    let nVisible = 0;
    let widgets = this.widgets;
    let lastHandle: HTMLDivElement = null;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let handle = this._handles.at(i);
      if (widgets.at(i).isHidden) {
        handle.classList.add(HIDDEN_CLASS);
      } else {
        handle.classList.remove(HIDDEN_CLASS);
        lastHandle = handle;
        nVisible++;
      }
    }

    // Hide the handle for the last visible widget.
    if (lastHandle) lastHandle.classList.add(HIDDEN_CLASS);

    // Update the fixed space for the visible items.
    this._fixed = this._spacing * Math.max(0, nVisible - 1);

    // Setup the initial size limits.
    let minW = 0;
    let minH = 0;
    let maxW = Infinity;
    let maxH = Infinity;
    let horz = this._orientation === 'horizontal';
    if (horz) {
      minW = this._fixed;
      maxW = nVisible > 0 ? minW : maxW;
    } else {
      minH = this._fixed;
      maxH = nVisible > 0 ? minH : maxH;
    }

    // Update the sizers and computed size limits.
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets.at(i);
      let sizer = this._sizers.at(i);
      if (sizer.size > 0) {
        sizer.sizeHint = sizer.size;
      }
      if (widget.isHidden) {
        sizer.minSize = 0;
        sizer.maxSize = 0;
        continue;
      }
      let limits = sizeLimits(widget.node);
      sizer.stretch = SplitLayout.getStretch(widget);
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

    // Compute the adjusted layout space.
    let space: number;
    let horz = this._orientation === 'horizontal';
    if (horz) {
      space = Math.max(0, width - this._fixed);
    } else {
      space = Math.max(0, height - this._fixed);
    }

    // Scale the size hints if they are normalized.
    if (this._hasNormedSizes) {
      each(this._sizers, sizer => { sizer.sizeHint *= space; });
      this._hasNormedSizes = false;
    }

    // Distribute the layout space to the box sizers.
    boxCalc(this._sizers, space);

    // Layout the widgets using the computed box sizes.
    let spacing = this._spacing;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets.at(i);
      if (widget.isHidden) {
        continue;
      }
      let size = this._sizers.at(i).size;
      let hstyle = this._handles.at(i).style;
      if (horz) {
        Widget.setGeometry(widget, left, top, size, height);
        left += size;
        hstyle.top = `${top}px`;
        hstyle.left = `${left}px`;
        hstyle.width = `${spacing}px`;
        hstyle.height = `${height}px`;
        left += spacing;
      } else {
        Widget.setGeometry(widget, left, top, width, size);
        top += size;
        hstyle.top = `${top}px`;
        hstyle.left = `${left}px`;
        hstyle.width = `${width}px`;
        hstyle.height = `${spacing}px`;
        top += spacing;
      }
    }
  }

  private _fixed = 0;
  private _spacing = 4;
  private _dirty = false;
  private _hasNormedSizes = false;
  private _box: IBoxSizing = null;
  private _renderer: SplitLayout.IRenderer;
  private _sizers = new Vector<BoxSizer>();
  private _handles = new Vector<HTMLDivElement>();
  private _orientation: SplitLayout.Orientation = 'horizontal';
}


/**
 * The namespace for the `SplitLayout` class statics.
 */
export
namespace SplitLayout {
  /**
   * A type alias for a split layout orientation.
   */
  export
  type Orientation = 'horizontal' | 'vertical';

  /**
   * An options object for initializing a split layout.
   */
  export
  interface IOptions {
    /**
     * The renderer to use for the split layout.
     */
    renderer: IRenderer;

    /**
     * The orientation of the layout.
     *
     * The default is `'horizontal'`.
     */
    orientation?: Orientation;

    /**
     * The spacing between items in the layout.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * A renderer for use with a split layout.
   */
  export
  interface IRenderer {
    /**
     * Create a new handle node for use with a split layout.
     *
     * @returns A new handle node.
     */
    createHandleNode(): HTMLDivElement;
  }

  /**
   * Get the split layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The split layout stretch factor for the widget.
   */
  export
  function getStretch(widget: Widget): number {
    return Private.stretchProperty.get(widget);
  }

  /**
   * Set the split layout stretch factor for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the stretch factor.
   */
  export
  function setStretch(widget: Widget, value: number): void {
    Private.stretchProperty.set(widget, value);
  }
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * An object which holds mouse press data.
   */
  export
  interface IPressData {
    /**
     * The index of the pressed handle.
     */
    index: number;

    /**
     * The offset of the press in handle coordinates.
     */
    delta: number;

    /**
     * The disposable which will clear the override cursor.
     */
    override: IDisposable;
  }

  /**
   * The property descriptor for a widget stretch factor.
   */
  export
  const stretchProperty = new AttachedProperty<Widget, number>({
    name: 'stretch',
    value: 0,
    coerce: (owner, value) => Math.max(0, Math.floor(value)),
    changed: onChildPropertyChanged
  });

  /**
   * Create a split layout for the given panel options.
   */
  export
  function createLayout(options: SplitPanel.IOptions): SplitLayout {
    return options.layout || new SplitLayout({
      renderer: options.renderer || SplitPanel.defaultRenderer,
      orientation: options.orientation,
      spacing: options.spacing
    });
  }

  /**
   * Create a new box sizer with the given size hint.
   */
  export
  function createSizer(size: number): BoxSizer {
    let sizer = new BoxSizer();
    sizer.sizeHint = Math.floor(size);
    return sizer;
  }

  /**
   * Create a new split handle node using the given renderer.
   */
  export
  function createHandle(renderer: SplitLayout.IRenderer): HTMLDivElement {
    let node = renderer.createHandleNode();
    node.style.position = 'absolute';
    return node;
  }

  /**
   * Toggle the CSS orientation class for the given widget.
   */
  export
  function toggleOrientation(widget: Widget, orient: SplitLayout.Orientation): void {
    widget.toggleClass(HORIZONTAL_CLASS, orient === 'horizontal');
    widget.toggleClass(VERTICAL_CLASS, orient === 'vertical');
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * Compute the average size of a vector of box sizers.
   */
  export
  function averageSize(sizers: Vector<BoxSizer>): number {
    return reduce(sizers, (v, s) => v + s.size, 0) / sizers.length || 0;
  }

  /**
   * Normalize an array of values.
   */
  export
  function normalize(values: number[]): number[] {
    let n = values.length;
    if (n === 0) return [];
    let sum = values.reduce((a, b) => a + Math.abs(b), 0);
    return sum === 0 ? values.map(v => 1 / n) : values.map(v => v / sum);
  }

  /**
   * The change handler for the attached child properties.
   */
  function onChildPropertyChanged(child: Widget): void {
    let parent = child.parent;
    let layout = parent && parent.layout;
    if (layout instanceof SplitLayout) parent.fit();
  }
}
