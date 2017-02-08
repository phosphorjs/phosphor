/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
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
  IS_EDGE, IS_IE
} from '@phosphor/platform';

import {
  AttachedProperty
} from '@phosphor/properties';

import {
  BoxEngine, BoxSizer
} from './boxengine';

import {
  DOMUtil
} from './domutil';

import {
  PanelLayout
} from './panellayout';

import {
  Widget
} from './widget';


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
    this.renderer = options.renderer;
    if (options.orientation !== undefined) {
      this._orientation = options.orientation;
    }
    if (options.spacing !== undefined) {
      this._spacing = Private.clampSpacing(options.spacing);
    }
  }

  /**
   * The renderer used by the split layout.
   */
  readonly renderer: SplitLayout.IRenderer;

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
   * A read-only array of the split handles in the layout.
   */
  get handles(): ReadonlyArray<HTMLDivElement> {
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
    return Private.normalize(this._sizers.map(sizer => sizer.size));
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
    while (temp.length < n) {
      temp.push(0);
    }

    // Normalize the padded sizes.
    let normed = Private.normalize(temp);

    // Apply the normalized sizes to the sizers.
    for (let i = 0; i < n; ++i) {
      let sizer = this._sizers[i];
      sizer.sizeHint = normed[i];
      sizer.size = normed[i];
    }

    // Set the flag indicating the sizes are normalized.
    this._hasNormedSizes = true;

    // Trigger an update of the parent widget.
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Move the offset position of a split handle.
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
   */
  moveHandle(index: number, position: number): void {
    // Bail if the index is invalid or the handle is hidden.
    let handle = this._handles[index];
    if (!handle || handle.classList.contains(SplitLayout.HIDDEN_CLASS)) {
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
    for (let sizer of this._sizers) {
      if (sizer.size > 0) {
        sizer.sizeHint = sizer.size;
      }
    }

    // Adjust the sizers to reflect the handle movement.
    BoxEngine.adjust(this._sizers, index, delta);

    // Update the layout of the widgets.
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    Private.toggleOrientation(this.parent!, this.orientation);
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
    // Create the handle and sizer for the new widget.
    let handle = Private.createHandle(this.renderer);
    let average = Private.averageSize(this._sizers);
    let sizer = Private.createSizer(average);

    // Insert the handle and sizer into the internal arrays.
    ArrayExt.insert(this._sizers, index, sizer);
    ArrayExt.insert(this._handles, index, handle);

    // Prepare the layout geometry for the widget.
    Widget.prepareGeometry(widget);

    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget and handle nodes to the parent.
    this.parent!.node.appendChild(widget.node);
    this.parent!.node.appendChild(handle);

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
    // Move the sizer and handle for the widget.
    ArrayExt.move(this._sizers, fromIndex, toIndex);
    ArrayExt.move(this._handles, fromIndex, toIndex);

    // Post a fit request to the parent to show/hide last handle.
    this.parent!.fit();
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
    let handle = ArrayExt.removeAt(this._handles, index);

    // Remove the sizer for the widget.
    ArrayExt.removeAt(this._sizers, index);

    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget and handle nodes from the parent.
    this.parent!.node.removeChild(widget.node);
    this.parent!.node.removeChild(handle!);

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
    if (IS_IE || IS_EDGE) { // prevent flicker on IE/Edge - TODO fix this
      MessageLoop.sendMessage(this.parent!, Widget.Msg.FitRequest);
    } else {
      this.parent!.fit();
    }
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    if (IS_IE || IS_EDGE) { // prevent flicker on IE/Edge - TODO fix this
      MessageLoop.sendMessage(this.parent!, Widget.Msg.FitRequest);
    } else {
      this.parent!.fit();
    }
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
    // Update the handles and track the visible widget count.
    let nVisible = 0;
    let widgets = this.widgets;
    let lastHandle: HTMLDivElement | null = null;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      if (widgets[i].isHidden) {
        this._handles[i].classList.add(SplitLayout.HIDDEN_CLASS);
      } else {
        this._handles[i].classList.remove(SplitLayout.HIDDEN_CLASS);
        lastHandle = this._handles[i];
        nVisible++;
      }
    }

    // Hide the handle for the last visible widget.
    if (lastHandle) {
      lastHandle.classList.add(SplitLayout.HIDDEN_CLASS);
    }

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
      let widget = widgets[i];
      let sizer = this._sizers[i];
      if (sizer.size > 0) {
        sizer.sizeHint = sizer.size;
      }
      if (widget.isHidden) {
        sizer.minSize = 0;
        sizer.maxSize = 0;
        continue;
      }
      let limits = DOMUtil.sizeLimits(widget.node);
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
    let box = this._box = DOMUtil.boxSizing(this.parent!.node);
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
    let box = this._box || (this._box = DOMUtil.boxSizing(this.parent!.node));

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
      for (let sizer of this._sizers) {
        sizer.sizeHint *= space;
      }
      this._hasNormedSizes = false;
    }

    // Distribute the layout space to the box sizers.
    BoxEngine.calc(this._sizers, space);

    // Layout the widgets using the computed box sizes.
    let spacing = this._spacing;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let widget = widgets[i];
      if (widget.isHidden) {
        continue;
      }
      let size = this._sizers[i].size;
      let handleStyle = this._handles[i].style;
      if (horz) {
        Widget.setGeometry(widget, left, top, size, height);
        left += size;
        handleStyle.top = `${top}px`;
        handleStyle.left = `${left}px`;
        handleStyle.width = `${spacing}px`;
        handleStyle.height = `${height}px`;
        left += spacing;
      } else {
        Widget.setGeometry(widget, left, top, width, size);
        top += size;
        handleStyle.top = `${top}px`;
        handleStyle.left = `${left}px`;
        handleStyle.width = `${width}px`;
        handleStyle.height = `${spacing}px`;
        top += spacing;
      }
    }
  }

  private _fixed = 0;
  private _spacing = 4;
  private _dirty = false;
  private _hasNormedSizes = false;
  private _sizers: BoxSizer[] = [];
  private _handles: HTMLDivElement[] = [];
  private _box: DOMUtil.IBoxSizing | null = null;
  private _orientation: SplitLayout.Orientation = 'horizontal';
}


/**
 * The namespace for the `SplitLayout` class statics.
 */
export
namespace SplitLayout {
  /**
   * The class name added to horizontal split layout parents.
   */
  export
  const HORIZONTAL_CLASS = 'p-mod-horizontal';

  /**
   * The class name added to vertical split layout parents.
   */
  export
  const VERTICAL_CLASS = 'p-mod-vertical';

  /**
   * The class name added to hidden split layout handles.
   */
  export
  const HIDDEN_CLASS = 'p-mod-hidden';

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
     * Create a new handle for use with a split layout.
     *
     * @returns A new handle element.
     */
    createHandle(): HTMLDivElement;
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
    let handle = renderer.createHandle();
    handle.style.position = 'absolute';
    return handle;
  }

  /**
   * Toggle the CSS orientation class for the given widget.
   */
  export
  function toggleOrientation(widget: Widget, orient: SplitLayout.Orientation): void {
    widget.toggleClass(SplitLayout.HORIZONTAL_CLASS, orient === 'horizontal');
    widget.toggleClass(SplitLayout.VERTICAL_CLASS, orient === 'vertical');
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * Compute the average size of an array of box sizers.
   */
  export
  function averageSize(sizers: BoxSizer[]): number {
    return sizers.reduce((v, s) => v + s.size, 0) / sizers.length || 0;
  }

  /**
   * Normalize an array of values.
   */
  export
  function normalize(values: number[]): number[] {
    let n = values.length;
    if (n === 0) {
      return [];
    }
    let sum = values.reduce((a, b) => a + Math.abs(b), 0);
    return sum === 0 ? values.map(v => 1 / n) : values.map(v => v / sum);
  }

  /**
   * The change handler for the attached child properties.
   */
  function onChildPropertyChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof SplitLayout) {
      child.parent.fit();
    }
  }
}
