/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ChainIterator, EmptyIterator, IIterator, chain, each, iter, map, repeat
} from '../algorithm/iteration';

import {
  indexOf
} from '../algorithm/searching';

import {
  Vector
} from '../collections/vector';

import {
  Message, sendMessage
} from '../core/messaging';

import {
  IS_IE
} from '../dom/platform';

import {
  IBoxSizing, ISizeLimits, boxSizing, sizeLimits
} from '../dom/sizing';

import {
  BoxSizer, boxCalc
} from './boxengine';

import {
  TabBar
} from './tabbar';

import {
  ChildMessage, Layout, ResizeMessage, Widget, WidgetMessage
} from './widget';


/**
 * The class name added to a DockPanel instance.
 */
const DOCK_PANEL_CLASS = 'p-DockPanel';

/**
 * The class name added to a DockPanel overlay.
 */
const OVERLAY_CLASS = 'p-DockPanel-overlay';

/**
 * The class name added to hidden entities.
 */
const HIDDEN_CLASS = 'p-mod-hidden';

/**
 * The factory MIME type supported by the dock panel.
 */
const FACTORY_MIME = 'application/vnd.phosphor.widget-factory';

/**
 * The size of the edge dock zone for the root panel, in pixels.
 */
const EDGE_SIZE = 30;


/**
 * A widget which provides a flexible docking area for widgets.
 */
export
class DockPanel extends Widget {
  /**
   * Construct a new dock panel.
   *
   * @param options - The options for initializing the panel.
   */
  constructor(options: DockPanel.IOptions = {}) {
    super();
    this.addClass(DOCK_PANEL_CLASS);

    // Install the layout on the panel.
    this.layout = new DockLayout();

    // Parse the spacing option.
    // if (options.spacing !== void 0) {
    //   this._spacing = Private.clampSpacing(options.spacing);
    // }

    // Setup the overlay indicator.
    // if (options.overlay !== void 0) {
    //   this._overlay = options.overlay;
    // } else {
    //   this._overlay = new DockPanel.Overlay();
    // }

    // Connect the focus tracker changed signal.
    // this._tracker.currentChanged.connect(this._onCurrentChanged, this);

    // Add the overlay node to the panel.
    // this.node.appendChild(this._overlay.node);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    // // Hide the overlay.
    // this._overlay.hide(0);

    // // Cancel a drag if one is in progress.
    // if (this._drag) this._drag.dispose();

    // // Dispose of the focus tracker.
    // this._tracker.dispose();

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * Get the spacing between the widgets.
   */
  get spacing(): number {
    return (this.layout as DockLayout).spacing;
  }

  /**
   * Set the spacing between the widgets.
   */
  set spacing(value: number) {
    (this.layout as DockLayout).spacing = value;
  }

  /**
   * Add a widget to the dock panel.
   *
   * @param widget - The widget to add to the dock panel.
   *
   * @param options - The additional options for adding the widget.
   */
  addWidget(widget: Widget, options: DockPanel.IAddOptions = {}): void {
    (this.layout as DockLayout).addWidget(widget, options);
  }
}


/**
 * The namespace for the `DockPanel` class statics.
 */
export
namespace DockPanel {
  /**
   * An options object for creating a dock panel.
   */
  export
  interface IOptions {
    /**
     * The spacing between the items in the panel.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * A type alias for the supported insertion modes.
   */
  export
  type Mode = DockLayout.Mode;

  /**
   * An options object for adding a widget to the dock panel.
   */
  export
  interface IAddOptions {
    /**
     * The insertion mode for adding the widget.
     *
     * The default is `'tab-after'`.
     */
    mode?: Mode;

    /**
     * The reference widget for the insert location.
     *
     * The default is `null`.
     */
    ref?: Widget;

    /**
     * Whether to activate the new widget.
     *
     * The default is `true`.
     */
    activate?: boolean;
  }
}


/**
 * A layout which provides a flexible docking arrangement.
 */
export
class DockLayout extends Layout {
  /**
   * Construct a new dock layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: DockLayout.IOptions = {}) {
    super();
    if (options.spacing !== void 0) {
      this._spacing = Private.clampSpacing(options.spacing);
    }
  }

  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This will clear and dispose all widgets in the layout.
   */
  dispose(): void {
    // while (this._widgets.length > 0) {
    //   this._widgets.popBack().dispose();
    // }
    // TODO audit this method
    super.dispose();
  }

  /**
   * Get the inter-element spacing for the dock layout.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the inter-element spacing for the dock layout.
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
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   */
  iter(): IIterator<Widget> {
    return iter(this._root || EmptyIterator.instance);
  }

  /**
   * Add a widget to the dock layout.
   *
   * @param widget - The widget to add to the dock layout.
   *
   * @param options - The additional options for adding the widget.
   */
  addWidget(widget: Widget, options: DockLayout.IAddOptions = {}): void {
    // Extract the insert options.
    let ref: Widget = null;
    let mode: DockLayout.Mode = 'tab-after';
    if (options.ref !== void 0) {
      ref = options.ref;
    }
    if (options.mode !== void 0) {
      mode = options.mode;
    }

    // Warn if the reference widget is invalid.
    if (ref && widget === ref) {
      ref = null;
      console.warn('Reference widget is same as target widget.');
    }

    // Lookup the layout node for the reference widget.
    let refNode: Private.TabLayoutNode = null;
    if (this._root && ref) {
      refNode = this._root.findTabNode(ref);
    }

    // Warn if the reference widget is not found.
    if (ref && !refNode) {
      ref = null;
      console.warn('Reference widget not in the dock layout.');
    }

    // Reparent the widget to the current layout parent.
    widget.parent = this.parent;

    // Remove the widget from its current location.
    let contained = this._removeFromLayout(widget);

    // Insert the widget into the new location.
    this._insertIntoLayout(widget, mode, ref, refNode);

    // Do nothing further if there is no layout parent.
    if (!this.parent) {
      return;
    }

    // Fit the parent if the new widget has already been added.
    // Otherwise, attach the new widget to the parent widget.
    if (contained) {
      this.parent.fit();
    } else {
      this._attachWidget(widget);
    }
  }

  /**
   *
   */
  removeWidget(widget: Widget): void {
    // TODO implement this method
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    super.init();
    each(this, widget => { this._attachWidget(widget); });
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   */
  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.parent.update();
    // TODO audit this method
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    super.onAfterAttach(msg);
    this.parent.fit();
    // TODO audit this method
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: ChildMessage): void {
    if (IS_IE) { // prevent flicker on IE
      sendMessage(this.parent, WidgetMessage.FitRequest);
    } else {
      this.parent.fit();
    }
    // TODO audit this method
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: ChildMessage): void {
    if (IS_IE) { // prevent flicker on IE
      sendMessage(this.parent, WidgetMessage.FitRequest);
    } else {
      this.parent.fit();
    }
    // TODO audit this method
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
   * Attach a widget to the parent's DOM node.
   */
  private _attachWidget(widget: Widget): void {
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
   * Detach a widget from the parent's DOM node.
   */
  private _detachWidget(widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.BeforeDetach);

    // Remove the widget's node from the parent.
    this.parent.node.removeChild(widget.node);

    // Reset the layout geometry for the widget.
    Widget.resetGeometry(widget);

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * Remove the specified widget from the layout structure.
   *
   * Returns `true` if the widget was removed, or `false` if the
   * widget was not found in the layout structure.
   */
  private _removeFromLayout(widget: Widget): boolean {
    // Bail early if there is no layout root.
    if (!this._root) {
      return false;
    }

    // Find the tab node containing the specified widget.
    let tabNode = this._root.findTabNode(widget);
    if (!tabNode) {
      return false;
    }

    // Remove the tab from the tab bar.
    tabNode.tabBar.removeTab(widget.title);

    // Removal is complete if the tab bar still has tabs.
    if (tabNode.tabBar.titles.length > 0) {
      return true;
    }

    // Handle the case where the tab node is the root.
    if (this._root === tabNode) {
      this._root = null;
      tabNode.tabBar.dispose();
      return true;
    }

    // Remove the tab node from its parent.
    let splitNode = tabNode.parent;
    tabNode.parent = null;

    // Remove the child data from the split node.
    let i = splitNode.children.remove(tabNode);
    let handle = splitNode.handles.removeAt(i);
    splitNode.sizers.removeAt(i);

    // Remove the handle from its parent node.
    if (handle.parentNode) {
      handle.parentNode.removeChild(handle);
    }

    // Update the visibility of the last handle.
    let lastHandle = splitNode.handles.back;
    if (lastHandle) {
      lastHandle.style.display = 'none';
    }

    // Dispose of the tab bar.
    tabNode.tabBar.dispose();

    // Removal is complete if there are still multiple children.
    if (splitNode.children.length > 1) {
      return true;
    }

    // Remove the remaining handle from its parent node.
    if (lastHandle.parentNode) {
      lastHandle.parentNode.removeChild(lastHandle);
    }

    // Lookup the split node parent and remaining child data.
    let parentNode = splitNode.parent;
    let childNode = splitNode.children.at(0);

    // Clear the split node.
    splitNode.children.clear();
    splitNode.handles.clear();
    splitNode.sizers.clear();
    splitNode.parent = null;

    // Handle the case where the split node is the root.
    if (this._root === splitNode) {
      this._root = childNode;
      return true;
    }

    // Lookup the index of the split node.
    let index = indexOf(parentNode.children, splitNode);

    // Handle the case where the last node is a tab node.
    if (childNode instanceof Private.TabLayoutNode) {
      childNode.parent = parentNode;
      parentNode.children.set(index, childNode);
      return true;
    }

    // Otherwise, the last node is a split node. Merge the children
    // of the last node with the parent at the split node's index.

    return true;
  }

  private _insertIntoLayout(...args: any[]): void {

  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Setup the size limits.
    let minW = 0;
    let minH = 0;
    let maxW = Infinity;
    let maxH = Infinity;

    // Update the limits for the root layout node.
    if (this._root) {
      let limits = this._root.fit(this._spacing);
      minW = limits.minWidth;
      minH = limits.minHeight;
      maxW = limits.maxWidth;
      maxH = limits.maxHeight;
    }

    // Update the box sizing and add it to the size limits.
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

    // Bail early if there is no root layout node.
    if (!this._root) {
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
    let x = box.paddingTop;
    let y = box.paddingLeft;
    let width = offsetWidth - box.horizontalSum;
    let height = offsetHeight - box.verticalSum;

    // Update the geometry of the root layout node.
    this._root.update(x, y, width, height, this._spacing);
  }

  private _spacing = 4;
  private _dirty = false;
  private _box: IBoxSizing = null;
  private _root: Private.TabLayoutNode | Private.SplitLayoutNode = null;
}


/**
 * The namespace for the `DockLayout` class statics.
 */
export
namespace DockLayout {
  /**
   * An options object for creating a dock layout.
   */
  export
  interface IOptions {
    /**
     * The spacing between items in the layout.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * A type alias for the supported insertion modes.
   *
   * A dock mode is used to specify how a widget should be added
   * to the dock panel relative to a reference widget.
   */
  export
  type Mode = (
    /**
     * The area to the top of the reference widget.
     *
     * The widget will be inserted just above the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the top edge of the dock panel.
     */
    'split-top' |

    /**
     * The area to the left of the reference widget.
     *
     * The widget will be inserted just left of the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the left edge of the dock panel.
     */
    'split-left' |

    /**
     * The area to the right of the reference widget.
     *
     * The widget will be inserted just right of the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted  at the right edge of the dock panel.
     */
    'split-right' |

    /**
     * The area to the bottom of the reference widget.
     *
     * The widget will be inserted just below the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the bottom edge of the dock panel.
     */
    'split-bottom' |

    /**
     * The tab position before the reference widget.
     *
     * The widget will be added as a tab before the reference widget.
     *
     * If the reference widget is null or invalid, a sensible default
     * will be used.
     */
    'tab-before' |

    /**
     * The tab position after the reference widget.
     *
     * The widget will be added as a tab after the reference widget.
     *
     * If the reference widget is null or invalid, a sensible default
     * will be used.
     */
    'tab-after'
  );

  /**
   * An options object for adding a widget to the dock layout.
   */
  export
  interface IAddOptions {
    /**
     * The insertion mode for adding the widget.
     *
     * The default is `'tab-after'`.
     */
    mode?: Mode;

    /**
     * The reference widget for the insert location.
     *
     * The default is `null`.
     */
    ref?: Widget;
  }
}


/**
 * The namespace for the module private data.
 */
namespace Private {
  /**
   * A type alias for the orientation of a split layout node.
   */
  export
  type Orientation = 'horizontal' | 'vertical';

  /**
   * A layout node for managing a tabbed layout area.
   */
  export
  class TabLayoutNode {
    /**
     * Construct a new tab layout node.
     *
     * @param parent - The parent of the layout node, or `null`.
     *
     * @param tabBar - The tab bar to use for the layout node.
     */
    constructor(parent: SplitLayoutNode, tabBar: TabBar) {
      let tabSizer = new BoxSizer();
      let widgetSizer = new BoxSizer();
      tabSizer.stretch = 0;
      widgetSizer.stretch = 1;
      this._sizers = [tabSizer, widgetSizer];
      this.parent = parent;
      this.tabBar = tabBar;
    }

    /**
     * The parent of the layout node, or `null`.
     */
    parent: SplitLayoutNode;

    /**
     * The tab bar used by the layout node.
     *
     * #### Notes
     * The dock panel should add widget titles and manipulate this tab
     * bar as needed. The widget for the current tab will be positioned
     * directly underneath the tab bar.
     *
     * The dock layout is responsible for ensuring the tab bar and any
     * of the added widgets are attached to the parent widget.
     */
    readonly tabBar: TabBar;

    /**
     * Create an iterator over the widgets in the node.
     */
    iter(): IIterator<Widget> {
      let tabBar = repeat(this.tabBar, 1);
      let widgets = map(this.tabBar.titles, title => title.owner as Widget);
      return chain(tabBar, widgets);
    }

    /**
     * Find the tab layout node which holds the reference widget.
     *
     * @returns `this` if the reference widget is contained by this
     *   layout node, `null` otherwise.
     */
    findTabNode(ref: Widget): TabLayoutNode {
      let titles = this.tabBar.titles;
      for (let i = 0, n = titles.length; i < n; ++i) {
        if (titles.at(i).owner === ref) {
          return this;
        }
      }
      return null;
    }

    /**
     * Fit the tab layout node.
     *
     * @param spacing - This parameter is ignored. It is included to
     *   make this method compatible with `SplitLayoutNode.fit()`.
     *
     * @returns The computed size limits for the layout node.
     */
    fit(spacing?: number): ISizeLimits {
      // Setup the limit variables.
      let minWidth = 0;
      let minHeight = 0;
      let maxWidth = Infinity;
      let maxHeight = Infinity;

      // Lookup common variables.
      let tabBar = this.tabBar;
      let tabSizer = this._sizers[0];
      let widgetSizer = this._sizers[1];
      let currentTitle = tabBar.currentTitle;
      let widget = currentTitle ? currentTitle.owner as Widget : null;

      // Adjust the starting max height if a widget is visible.
      if (!tabBar.isHidden || (widget && !widget.isHidden)) {
        maxHeight = 0;
      }

      // Update the results and sizer for the tab bar.
      if (!tabBar.isHidden) {
        let limits = sizeLimits(tabBar.node);
        minWidth = Math.max(minWidth, limits.minWidth);
        maxWidth = Math.min(maxWidth, limits.maxWidth);
        minHeight += limits.minHeight;
        maxHeight += limits.maxHeight;
        tabSizer.minSize = limits.minHeight;
        tabSizer.maxSize = limits.maxHeight;
      } else {
        tabSizer.minSize = 0;
        tabSizer.maxSize = 0;
      }

      // Update the results and sizer for the current widget.
      if (widget && !widget.isHidden) {
        let limits = sizeLimits(widget.node);
        minWidth = Math.max(minWidth, limits.minWidth);
        maxWidth = Math.min(maxWidth, limits.maxWidth);
        minHeight += limits.minHeight;
        maxHeight += limits.maxHeight;
        widgetSizer.minSize = limits.minHeight;
        widgetSizer.maxSize = limits.maxHeight;
      } else {
        widgetSizer.minSize = 0;
        widgetSizer.maxSize = 0;
      }

      // TODO normalize sizes to ensure max >= min?

      // Return the computed size limits for the layout node.
      return { minWidth, minHeight, maxWidth, maxHeight };
    }

    /**
     * Update the geometry for the widgets in the tab area.
     *
     * @param x - The X coordinate of the layout area.
     *
     * @param y - The Y coordinate of the layout area.
     *
     * @param width - The width of the layout area.
     *
     * @param height - The height of the layout area.
     *
     * @param spacing - This parameter is ignored. It is included to
     *   make this method compatible with `SplitLayoutNode.update()`.
     */
    update(x: number, y: number, width: number, height: number, spacing?: number): void {
      // Lookup common variables.
      let tabBar = this.tabBar;
      let tabSizer = this._sizers[0];
      let widgetSizer = this._sizers[1];
      let currentTitle = tabBar.currentTitle;
      let widget = currentTitle ? currentTitle.owner as Widget : null;

      // Distribute the layout space to the sizers.
      boxCalc(this._sizers, height);

      // Layout the tab bar using the computed size.
      if (!tabBar.isHidden) {
        Widget.setGeometry(tabBar, x, y, width, tabSizer.size);
        y += tabSizer.size;
      }

      // Layout the widget using the computed size.
      if (widget && !widget.isHidden) {
        Widget.setGeometry(widget, x, y, width, widgetSizer.size);
      }
    }

    private _sizers: [BoxSizer, BoxSizer];
  }

  /**
   * A layout node for managing a split layout area.
   */
  export
  class SplitLayoutNode {
    /**
     * Construct a new split layout node.
     *
     * @param parent - The parent of the layout node, or `null`.
     *
     * @param orientation - The layout orientation of the node.
     */
    constructor(parent: SplitLayoutNode, orientation: Orientation) {
      this.parent = parent;
      this.orientation = orientation;
    }

    /**
     * The parent of the layout node, or `null`.
     */
    parent: SplitLayoutNode;

    /**
     * The layout orientation of the node.
     */
    readonly orientation: Orientation;

    /**
     * The child nodes for the split layout node.
     *
     * #### Notes
     * It dock layout should keep this in sync with `sizers`.
     */
    readonly children = new Vector<SplitLayoutNode | TabLayoutNode>();

    /**
     * The box sizers for the layout children.
     *
     * #### Notes
     * The dock layout should keep this in sync with `children`.
     */
    readonly sizers = new Vector<BoxSizer>();

    /**
     * The split handles for the node.
     *
     * #### Notes
     * The dock layout should keep this in sync with `children`.
     */
    readonly handles = new Vector<HTMLElement>();

    /**
     * Create an iterator over the widgets in the node.
     */
    iter(): IIterator<Widget> {
      return new ChainIterator(map(this.children, iter));
    }

    /**
     * Find the tab layout node which holds the reference widget.
     *
     * @returns The layout node which holds the reference widget,
     *   or `null` if the reference widget is not found.
     */
    findTabNode(ref: Widget): TabLayoutNode {
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let node = this.children.at(i).findTabNode(ref);
        if (node !== null) {
          return node;
        }
      }
      return null;
    }

    /**
     * Fit the split layout node.
     *
     * @param spacing - The spacing to place between the children.
     *
     * @returns The updated size limits for the layout node.
     */
    fit(spacing: number): ISizeLimits {
      // Setup the limit variables.
      let minWidth = 0;
      let minHeight = 0;
      let maxWidth = Infinity;
      let maxHeight = Infinity;

      // Compute common values.
      let horizontal = this.orientation === 'horizontal';
      let fixed = Math.max(0, this.children.length - 1) * spacing;

      // Adjust the starting limits for the orientation.
      if (horizontal) {
        minWidth = fixed;
        maxWidth = fixed;
      } else {
        minHeight = fixed;
        maxHeight = fixed;
      }

      // Adjust the limits and sizer for each child area.
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let sizer = this.sizers.at(i);
        let child = this.children.at(i);
        let limits = child.fit(spacing);
        if (horizontal) {
          minHeight = Math.max(minHeight, limits.minHeight);
          maxHeight = Math.min(maxHeight, limits.maxHeight);
          minWidth += limits.minWidth;
          maxWidth += limits.maxWidth;
          sizer.minSize = limits.minWidth;
          sizer.maxSize = limits.maxWidth;
        } else {
          minWidth = Math.max(minWidth, limits.minWidth);
          maxWidth = Math.min(maxWidth, limits.maxWidth);
          minHeight += limits.minHeight;
          maxHeight += limits.maxHeight;
          sizer.minSize = limits.minHeight;
          sizer.maxSize = limits.maxHeight;
        }
      }

      // TODO normalize sizes to ensure max >= min?

      // Return the computed size limits for the layout node.
      return { minWidth, minHeight, maxWidth, maxHeight };
    }

    /**
     * Update the geometry for the widgets in the tab area.
     *
     * @param x - The X coordinate of the layout area.
     *
     * @param y - The Y coordinate of the layout area.
     *
     * @param width - The width of the layout area.
     *
     * @param height - The height of the layout area.
     *
     * @param spacing - The spacing to place between the children.
     */
    update(x: number, y: number, width: number, height: number, spacing: number): void {
      // Compute the available layout space.
      let horizontal = this.orientation === 'horizontal';
      let fixed = Math.max(0, this.children.length - 1) * spacing;
      let space = Math.max(0, (horizontal ? width : height) - fixed);

      // Distribute the layout space to the sizers.
      boxCalc(this.sizers, space);

      // Update the geometry of the child areas and split handles.
      for (let i = 0, n = this.children.length; i < n; ++i) {
        let child = this.children.at(i);
        let size = this.sizers.at(i).size;
        let style = this.handles.at(i).style;
        if (horizontal) {
          child.update(x, y, size, height, spacing);
          x += size;
          style.top = `${y}px`;
          style.left = `${x}px`;
          style.width = `${spacing}px`;
          style.height = `${height}px`;
          x += spacing;
        } else {
          child.update(x, y, width, size, spacing);
          y += size;
          style.top = `${y}px`;
          style.left = `${x}px`;
          style.width = `${width}px`;
          style.height = `${spacing}px`;
          y += spacing;
        }
      }
    }
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }
}
