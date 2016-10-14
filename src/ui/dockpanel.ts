/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ChainIterator, IIterator, chain, each, empty, map, once
} from '../algorithm/iteration';

import {
  contains, find, indexOf
} from '../algorithm/searching';

import {
  Vector
} from '../collections/vector';

import {
  Message, sendMessage
} from '../core/messaging';

import {
  IS_EDGE, IS_IE
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
 * The class name added to a DockPanel tab bar.
 */
const TAB_BAR_CLASS = 'p-DockPanel-tabBar';

/**
 * The class name added to a DockPanel handle.
 */
const HANDLE_CLASS = 'p-DockPanel-handle';

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

    //
    this._renderer = options.renderer || DockPanel.defaultRenderer;
    let spacing = options.spacing !== void 0 ? options.spacing : 4;

    //
    let renderer: DockPanel.IRenderer = {
      createTabBar: () => this._createTabBar(),
      createHandle: () => this._createHandle()
    };

    //
    this.layout = new DockLayout({ renderer, spacing });

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
   * The renderer used by the dock panel.
   */
  get renderer(): DockPanel.IRenderer {
    return (this.layout as DockLayout).renderer;
  }

  /**
   * Add a widget to the dock panel.
   *
   * @param widget - The widget to add to the dock panel.
   *
   * @param options - The additional options for adding the widget.
   */
  addWidget(widget: Widget, options: DockPanel.IAddOptions = {}): void {
    // TODO handle activation
    (this.layout as DockLayout).addWidget(widget, options);
  }

  /**
   *
   */
  private _createTabBar(): TabBar {
    //
    let tabBar = this._renderer.createTabBar();

    //
    tabBar.addClass(TAB_BAR_CLASS);

    //
    return tabBar;
  }

  /**
   *
   */
  private _createHandle(): HTMLDivElement {
    //
    let handle = this._renderer.createHandle();

    //
    handle.classList.add(HANDLE_CLASS);

    //
    return handle;
  }

  /**
   *
   */
  private _onCurrentChanged(sender: TabBar, args: TabBar.ICurrentChangedArgs): void {
    //
    let { previousTitle, currentTitle } = args;

    //
    let previousWidget = previousTitle ? previousTitle.owner as Widget : null;
    let currentWidget = currentTitle ? currentTitle.owner as Widget : null;

    //
    if (previousWidget) {
      previousWidget.hide();
      previousWidget.deactivate();
    }

    //
    if (currentWidget) {
      currentWidget.show();
      currentWidget.activate();
    }
  }

  /**
   *
   */
  private _onTabCloseRequested(sender: TabBar, args: TabBar.ITabCloseRequestedArgs): void {
    (args.title.owner as Widget).close();
  }

  private _renderer: DockPanel.IRenderer;
}


/**
 * The namespace for the `DockPanel` class statics.
 */
export
namespace DockPanel {
  /**
   * A type alias for a dock panel renderer;
   */
  export
  type IRenderer = DockLayout.IRenderer;

  /**
   * An options object for creating a dock panel.
   */
  export
  interface IOptions {
    /**
     * The renderer to use for the dock panel.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;

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
  type InsertMode = DockLayout.InsertMode;

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
    mode?: InsertMode;

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

  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Create a new tab bar for use with a dock panel.
     *
     * @returns A new tab bar for a dock panel.
     */
    createTabBar(): TabBar {
      return new TabBar({
        tabsMovable: true,
        allowDeselect: false,
        insertBehavior: 'select-tab-if-needed',
        removeBehavior: 'select-previous-tab',
      });
    }

    /**
     * Create a new handle node for use with a dock panel.
     *
     * @returns A new handle node for a dock panel.
     */
    createHandle(): HTMLDivElement {
      return document.createElement('div');
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();
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
  constructor(options: DockLayout.IOptions) {
    super();
    this._renderer = options.renderer;
    this._spacing = Private.clampSpacing(options.spacing);
  }

  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This will clear and dispose all widgets in the layout.
   */
  dispose(): void {
    // Clear the reference to the renderer.
    this._renderer = null;

    // Get an iterator over the widgets in the layout.
    let widgets = this.iter();

    // Clear the layout before disposing the widgets.
    this._root = null;

    // Dispose of the widgets contained in the old layout root.
    each(widgets, widget => { widget.dispose(); });

    // Dispose of the base class.
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
   * The renderer used by the dock layout.
   */
  get renderer(): DockLayout.IRenderer {
    return this._renderer;
  }

  /**
   * Create an iterator over all widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   *
   * #### Notes
   * This iterator includes the generated tab bars.
   */
  iter(): IIterator<Widget> {
    return this._root ? Private.iterAllWidgets(this._root) : empty<Widget>();
  }

  /**
   * Create an iterator over the user widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   *
   * #### Notes
   * This iterator does not include the generated tab bars.
   */
  widgets(): IIterator<Widget> {
    return this._root ? Private.iterUserWidgets(this._root) : empty<Widget>();
  }

  /**
   * Create an iterator over the split handles in the layout.
   *
   * @returns A new iterator over the handles in the layout.
   */
  handles(): IIterator<HTMLDivElement> {
    return this._root ? Private.iterHandles(this._root) : empty<HTMLDivElement>();
  }

  /**
   * Add a widget to the dock layout.
   *
   * @param widget - The widget to add to the dock layout.
   *
   * @param options - The additional options for adding the widget.
   *
   * #### Notes
   * The widget will be moved if it is already contained in the layout.
   *
   * A warning will be logged if the reference widget is invalid.
   */
  addWidget(widget: Widget, options: DockLayout.IAddOptions = {}): void {
    // Parse the options.
    let ref = options.ref || null;
    let mode = options.mode || 'tab-after';

    // Warn if the reference widget is invalid.
    if (widget === ref) {
      console.warn('Reference widget is the same as the target widget.');
      ref = null;
    }

    // Find the tab node which holds the reference widget.
    let refNode: Private.TabLayoutNode = null;
    if (this._root && ref) {
      refNode = Private.findTabNode(this._root, ref);
    }

    // Warn if the reference widget is invalid.
    if (ref && !refNode) {
      console.warn('Reference widget is not in the layout.');
      ref = null;
    }

    // Reparent the widget to the current layout parent.
    widget.parent = this.parent;

    // Remove the widget from its current layout location.
    this._removeWidget(widget);

    // Insert the widget according to the insert mode.
    switch (mode) {
    case 'tab-after':
      this._insertTab(widget, ref, refNode, true);
      break;
    case 'tab-before':
      this._insertTab(widget, ref, refNode, false);
      break;
    case 'split-top':
      this._insertSplit(widget, ref, refNode, 'vertical', false);
      break;
    case 'split-left':
      this._insertSplit(widget, ref, refNode, 'horizontal', false);
      break;
    case 'split-right':
      this._insertSplit(widget, ref, refNode, 'horizontal', true);
      break;
    case 'split-bottom':
      this._insertSplit(widget, ref, refNode, 'vertical', true);
      break;
    }

    // Do nothing else if there is no parent widget.
    if (!this.parent) {
      return;
    }

    // Ensure the widget is attached to the parent widget.
    this.attachWidget(widget);

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   */
  removeWidget(widget: Widget): void {
    // Remove the widget from its current layout location.
    this._removeWidget(widget);

    // Do nothing else if there is no parent widget.
    if (!this.parent) {
      return;
    }

    // Detach the widget from the parent widget.
    this.detachWidget(widget);

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    // Perform superclass initialization.
    super.init();

    // Attach each widget to the parent.
    each(this, widget => { this.attachWidget(widget); });

    // Attach each handle to the parent.
    each(this.handles(), handle => { this.parent.node.appendChild(handle); });

    // Post a fit request for the parent widget.
    this.parent.fit();
  }

  /**
   * Attach the widget to the layout parent widget.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This is a no-op if the widget is already attached.
   */
  protected attachWidget(widget: Widget): void {
    // Do nothing if the widget is already attached.
    if (this.parent.node === widget.node.parentNode) {
      return;
    }

    // Prepare the layout geometry for the widget.
    Widget.prepareGeometry(widget);

    // Add the widget's node to the parent.
    this.parent.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent.isAttached) {
      sendMessage(widget, WidgetMessage.AfterAttach);
    }
  }

  /**
   * Detach the widget from the layout parent widget.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This is a no-op if the widget is not attached.
   */
  protected detachWidget(widget: Widget): void {
    // Do nothing if the widget is not attached.
    if (this.parent.node !== widget.node.parentNode) {
      return;
    }

    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent.isAttached) {
      sendMessage(widget, WidgetMessage.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent.node.removeChild(widget.node);

    // Reset the layout geometry for the widget.
    Widget.resetGeometry(widget);
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
   * Remove the specified widget from the layout structure.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * This is a no-op if the widget is not in the layout tree.
   *
   * This does not detach the widget from the parent node.
   */
  private _removeWidget(widget: Widget): void {
    // Bail early if there is no layout root.
    if (!this._root) {
      return;
    }

    // Find the tab node which contains the given widget.
    let tabNode = Private.findTabNode(this._root, widget);

    // Bail if the tab node is not found.
    if (!tabNode) {
      return;
    }

    // If there are multiple tabs, just remove the widget's tab.
    if (tabNode.tabBar.titles.length > 1) {
      tabNode.tabBar.removeTab(widget.title);
      return;
    }

    // Otherwise, the tab node needs to be removed...

    // Dispose the tab bar.
    tabNode.tabBar.dispose();

    // Handle the case where the tab node is the root.
    if (this._root === tabNode) {
      this._root = null;
      return;
    }

    // Otherwise, remove the tab node from its parent...

    // Clear the parent reference on the tab node.
    let splitNode = tabNode.parent;
    tabNode.parent = null;

    // Remove the tab node from its parent split node.
    let i = splitNode.children.remove(tabNode);
    let handle = splitNode.handles.removeAt(i);
    splitNode.sizers.removeAt(i);

    // Remove the handle from its parent DOM node.
    if (handle.parentNode) {
      handle.parentNode.removeChild(handle);
    }

    // If there are multiple children, just update the split handles.
    if (splitNode.children.length > 1) {
      Private.updateSplitHandles(splitNode);
      return;
    }

    // Otherwise, the split node also needs to be removed...

    // Clear the parent reference on the split node.
    let parentNode = splitNode.parent;
    splitNode.parent = null;

    // Lookup the remaining child node and handle.
    let childNode = splitNode.children.front;
    let childHandle = splitNode.handles.front;

    // Clear the split node data.
    splitNode.children.clear();
    splitNode.handles.clear();
    splitNode.sizers.clear();

    // Remove the child handle from its parent node.
    if (childHandle.parentNode) {
      childHandle.parentNode.removeChild(childHandle);
    }

    // Handle the case where the split node is the root.
    if (this._root === splitNode) {
      childNode.parent = null;
      this._root = childNode;
      return;
    }

    // Otherwise, move the child node to the parent node...

    // Lookup the index of the split node.
    let j = parentNode.children.indexOf(splitNode);

    // Handle the case where the child node is a tab node.
    if (childNode instanceof Private.TabLayoutNode) {
      childNode.parent = parentNode;
      parentNode.children.set(j, childNode);
      return;
    }

    // Remove the split data from the parent.
    let splitHandle = parentNode.handles.removeAt(j);
    parentNode.children.removeAt(j);
    parentNode.sizers.removeAt(j);

    // Remove the split handle from its parent node.
    if (splitHandle.parentNode) {
      splitHandle.parentNode.removeChild(splitHandle);
    }

    // The child node and the split parent node will have the same
    // orientation. Merge the grand-children with the parent node.
    for (let i = 0, n = childNode.children.length; i < n; ++i) {
      let gChild = childNode.children.at(i);
      let gHandle = childNode.handles.at(i);
      let gSizer = childNode.sizers.at(i);
      parentNode.children.insert(j + i, gChild);
      parentNode.handles.insert(j + i, gHandle);
      parentNode.sizers.insert(j + i, gSizer);
      gChild.parent = parentNode;
    }

    // Clear the child node.
    childNode.children.clear();
    childNode.handles.clear();
    childNode.sizers.clear();
    childNode.parent = null;

    // Update the split handles on the parent node.
    Private.updateSplitHandles(parentNode);
  }

  /**
   * Insert a widget next to an existing tab.
   *
   * @param widget - The widget to add to the layout.
   *
   * @param ref - The reference widget, or `null`.
   *
   * @param refNode - The layout node for the ref widget, or `null`.
   *
   * @param after - Whether to insert the widget after the ref.
   *
   * #### Notes
   * This assumes the target widget is not in the layout tree.
   *
   * This does not attach the widget to the parent widget.
   */
  private _insertTab(widget: Widget, ref: Widget, refNode: Private.TabLayoutNode, after: boolean): void {
    // Create the root if it does not exist.
    if (!this._root) {
      let tabNode = new Private.TabLayoutNode(this._createTabBar());
      tabNode.tabBar.addTab(widget.title);
      this._root = tabNode;
      return;
    }

    // If there is a ref node, insert relative to the ref widget.
    if (refNode) {
      let i = indexOf(refNode.tabBar.titles, ref.title) + (after ? 1 : 0);
      refNode.tabBar.insertTab(i, widget.title);
      return;
    }

    // Otherwise, insert relative to the first tab area.
    let tabNode = Private.iterTabNodes(this._root).next();
    let i = tabNode.tabBar.currentIndex + (after ? 1 : 0);
    tabNode.tabBar.insertTab(i, widget.title);
  }

  /**
   * Insert a widget as a new split area.
   *
   * @param widget - The widget to add to the layout.
   *
   * @param ref - The reference widget, or `null`.
   *
   * @param refNode - The layout node for the ref widget, or `null`.
   *
   * @param orientation - The orientation for the split.
   *
   * @param after - Whether to insert the widget after the ref.
   *
   * #### Notes
   * This assumes the target widget is not in the layout tree.
   *
   * This does not attach the widget to the parent widget.
   */
  private _insertSplit(widget: Widget, ref: Widget, refNode: Private.TabLayoutNode, orientation: Private.Orientation, after: boolean): void {
    // Create the tab layout node to hold the widget.
    let tabNode = new Private.TabLayoutNode(this._createTabBar());
    tabNode.tabBar.addTab(widget.title);

    // Set the root if it does not exist.
    if (!this._root) {
      this._root = tabNode;
      return;
    }

    // Lookup the split node for the ref widget.
    let splitNode = refNode ? refNode.parent : null;

    // If the split node is null, split the root node.
    if (!splitNode) {
      let root = this._splitRoot(orientation);
      let i = after ? root.children.length : 0;
      root.children.insert(i, tabNode);
      root.sizers.insert(i, new BoxSizer());
      root.handles.insert(i, this._createHandle());
      Private.updateSplitHandles(root);
      tabNode.parent = root;
      return;
    }

    // If the split node already had the correct orientation,
    // the widget can be inserted into the split node directly.
    if (splitNode.orientation === orientation) {
      let i = splitNode.children.indexOf(refNode) + (after ? 1 : 0);
      splitNode.children.insert(i, tabNode);
      splitNode.sizers.insert(i, new BoxSizer());
      splitNode.handles.insert(i, this._createHandle());
      Private.updateSplitHandles(splitNode);
      tabNode.parent = splitNode;
      return;
    }

    // Remove the ref node from the split node.
    let i = splitNode.children.remove(refNode);
    let refSizer = splitNode.sizers.removeAt(i);
    let refHandle = splitNode.handles.removeAt(i);

    // Add the ref node to a new child split node.
    let childNode = new Private.SplitLayoutNode(orientation);
    childNode.children.pushBack(refNode);
    childNode.sizers.pushBack(refSizer);
    childNode.handles.pushBack(refHandle);
    refNode.parent = childNode;

    // Add the tab node to the child node.
    let j = after ? i : 0;
    childNode.children.insert(j, tabNode);
    childNode.sizers.insert(j, new BoxSizer());
    childNode.handles.insert(j, this._createHandle());
    Private.updateSplitHandles(childNode);
    tabNode.parent = childNode;

    // Add the new child node to the original split node.
    splitNode.children.insert(i, childNode);
    splitNode.sizers.insert(i, new BoxSizer());
    splitNode.handles.insert(i, this._createHandle());
    Private.updateSplitHandles(splitNode);
    childNode.parent = splitNode;
  }

  /**
   * Ensure the root is a split node with the given orientation.
   *
   * @param orientation - The required orientation of the root.
   *
   * @returns The new root node (as a convenience).
   */
  private _splitRoot(orientation: Private.Orientation): Private.SplitLayoutNode {
    // Bail early if the root already meets the requirements.
    let root = this._root;
    if (root instanceof Private.SplitLayoutNode) {
      if (root.orientation === orientation) {
        return root;
      }
    }

    // Create a new root node with the specified orientation.
    let result = new Private.SplitLayoutNode(orientation);
    this._root = result;

    // Add the old root to the new root.
    result.children.pushBack(root);
    result.sizers.pushBack(new BoxSizer());
    result.handles.pushBack(this._createHandle());
    root.parent = result;

    // Return the new root as a convenience.
    return result;
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
      let limits = Private.fitNode(this._root, this._spacing);
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
    if (this.parent.parent) {
      sendMessage(this.parent.parent, WidgetMessage.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      sendMessage(this.parent, WidgetMessage.UpdateRequest);
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
    Private.updateNode(this._root, x, y, width, height, this._spacing);
  }

  /**
   * Create a new tab bar for use by the dock layout.
   *
   * #### Notes
   * The tab bar will be attached to the parent if it exists.
   */
  private _createTabBar(): TabBar {
    // Create the tab bar using the renderer.
    let tabBar = this._renderer.createTabBar();

    // Enforce necessary tab bar behavior.
    // TODO: allow different tab bar locations?
    tabBar.orientation = 'horizontal';

    // Reparent and attach the tab bar to the parent if possible.
    if (this.parent) {
      tabBar.parent = this.parent;
      this.attachWidget(tabBar);
    }

    // Return the initialized tab bar.
    return tabBar;
  }

  /**
   * Create a new split handle for the dock layout.
   *
   * #### Notes
   * The handle will be attached to the parent if it exists.
   */
  private _createHandle(): HTMLDivElement {
    // Create the handle using the renderer.
    let handle = this._renderer.createHandle();

    // Initialize the handle geometry.
    let style = handle.style;
    style.position = 'absolute';
    style.top = '0';
    style.left = '0';
    style.width = '0';
    style.height = '0';

    // Attach the handle to the parent if it exists.
    if (this.parent) {
      this.parent.node.appendChild(handle);
    }

    // Return the initialized handle.
    return handle;
  }

  private _dirty = false;
  private _spacing: number;
  private _box: IBoxSizing = null;
  private _renderer: DockLayout.IRenderer;
  private _root: Private.LayoutNode = null;
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
     * The renderer to use for the dock layout.
     */
    renderer: IRenderer;

    /**
     * The spacing between items in the layout.
     */
    spacing: number;
  }

  /**
   * A renderer for use with a dock layout.
   */
  export
  interface IRenderer {
    /**
     * Create a new tab bar for use with a dock layout.
     *
     * @returns A new tab bar for a dock layout.
     */
    createTabBar(): TabBar;

    /**
     * Create a new handle node for use with a dock layout.
     *
     * @returns A new handle node for a dock layout.
     */
    createHandle(): HTMLDivElement;
  }

  /**
   * A type alias for the supported insertion modes.
   *
   * An insert mode is used to specify how a widget should be added
   * to the dock panel relative to a reference widget.
   */
  export
  type InsertMode = (
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
    mode?: InsertMode;

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
   * A type alias for a dock layout node.
   */
  export
  type LayoutNode = TabLayoutNode | SplitLayoutNode;

  /**
   * A type alias for the orientation of a split layout node.
   */
  export
  type Orientation = 'horizontal' | 'vertical';

  /**
   * A layout node which holds the data for a tabbed area.
   */
  export
  class TabLayoutNode {
    /**
     * Construct a new tab layout node.
     *
     * @param tabBar - The tab bar to use for the layout node.
     */
    constructor(tabBar: TabBar) {
      let tabSizer = new BoxSizer();
      let widgetSizer = new BoxSizer();
      tabSizer.stretch = 0;
      widgetSizer.stretch = 1;
      this.sizers.pushBack(tabSizer);
      this.sizers.pushBack(widgetSizer);
      this.tabBar = tabBar;
    }

    /**
     * The parent of the layout node, or `null`.
     */
    parent: SplitLayoutNode = null;

    /**
     * The tab bar for the layout node.
     */
    readonly tabBar: TabBar;

    /**
     * The box sizers for the tab bar and current widget.
     */
    readonly sizers = new Vector<BoxSizer>();
  }

  /**
   * A layout node which holds the data for a split area.
   */
  export
  class SplitLayoutNode {
    /**
     * Construct a new split layout node.
     *
     * @param orientation - The orientation of the node.
     */
    constructor(orientation: Orientation) {
      this.orientation = orientation;
    }

    /**
     * The parent of the layout node, or `null`.
     */
    parent: SplitLayoutNode = null;

    /**
     * The orientation of the node.
     */
    readonly orientation: Orientation;

    /**
     * The child nodes for the split node.
     */
    readonly children = new Vector<LayoutNode>();

    /**
     * The box sizers for the layout children.
     */
    readonly sizers = new Vector<BoxSizer>();

    /**
     * The split handles for the layout children.
     */
    readonly handles = new Vector<HTMLDivElement>();
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * Create an iterator for all widgets in the layout tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns An iterator which yields all widgets in the tree.
   *
   * #### Notes
   * This includes the tab bars for the tab layout nodes.
   */
  export
  function iterAllWidgets(node: LayoutNode): IIterator<Widget> {
    let it: IIterator<Widget>;
    if (node instanceof TabLayoutNode) {
      it = chain(once(node.tabBar), iterUserWidgets(node));
    } else {
      it = new ChainIterator(map(node.children, iterAllWidgets));
    }
    return it;
  }

  /**
   * Create an iterator for the user widgets in the layout tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns An iterator which yields the user widgets in the tree.
   *
   * #### Notes
   * This does not include the tab bars for the tab layout nodes.
   */
  export
  function iterUserWidgets(node: LayoutNode): IIterator<Widget> {
    let it: IIterator<Widget>;
    if (node instanceof TabLayoutNode) {
      it = map(node.tabBar.titles, title => title.owner as Widget);
    } else {
      it = new ChainIterator(map(node.children, iterUserWidgets));
    }
    return it;
  }

  /**
   * Create an iterator for the tab layout nodes in the tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns An iterator which yields the tab nodes in the tree.
   */
  export
  function iterTabNodes(node: LayoutNode): IIterator<TabLayoutNode> {
    let it: IIterator<TabLayoutNode>;
    if (node instanceof TabLayoutNode) {
      it = once(node);
    } else {
      it = new ChainIterator(map(node.children, iterTabNodes));
    }
    return it;
  }

  /**
   * Create an iterator for the split layout nodes in the tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns An iterator which yields the split nodes in the tree.
   */
  export
  function iterSplitNodes(node: LayoutNode): IIterator<SplitLayoutNode> {
    let it: IIterator<SplitLayoutNode>;
    if (node instanceof TabLayoutNode) {
      it = empty<SplitLayoutNode>();
    } else {
      let others = map(node.children, iterSplitNodes);
      it = chain(once(node), new ChainIterator(others));
    }
    return it;
  }

  /**
   * Create an iterator for the split handles in the tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns An iterator which yields the split handles in the tree.
   */
  export
  function iterHandles(node: LayoutNode): IIterator<HTMLDivElement> {
    let it: IIterator<HTMLDivElement>;
    if (node instanceof TabLayoutNode) {
      it = empty<HTMLDivElement>();
    } else {
      let others = map(node.children, iterHandles);
      it = chain(node.handles, new ChainIterator(others));
    }
    return it;
  }

  /**
   * Find the tab layout node which contains the given widget.
   *
   * @param node - The root layout node of interest.
   *
   * @param widget - The widget of interest.
   *
   * @returns The tab node which holds the widget, or `null`.
   */
  export
  function findTabNode(node: LayoutNode, widget: Widget): TabLayoutNode {
    return find(iterTabNodes(node), tabNode => {
      return contains(tabNode.tabBar.titles, widget.title);
    });
  }

  /**
   * Recursively fit the given layout node.
   *
   * @param node - The layout node of interest.
   *
   * @param spacing - The spacing to use between tab areas.
   *
   * @returns The computed size limits for the layout node.
   */
  export
  function fitNode(node: LayoutNode, spacing: number): ISizeLimits {
    let limits: ISizeLimits;
    if (node instanceof TabLayoutNode) {
      limits = fitTabNode(node);
    } else {
      limits = fitSplitNode(node, spacing);
    }
    return limits;
  }

  /**
   * Recursively update the given layout node.
   *
   * @param node - The layout node of interest.
   *
   * @param x - The offset left position of the layout area.
   *
   * @param y - The offset top position of the layout area.
   *
   * @param width - The width of the layout area.
   *
   * @param height - The height of the layout area.
   *
   * @param spacing - The spacing to use between tab areas.
   */
  export
  function updateNode(node: LayoutNode, x: number, y: number, width: number, height: number, spacing: number): void {
    if (node instanceof TabLayoutNode) {
      updateTabNode(node, x, y, width, height);
    } else {
      updateSplitNode(node, x, y, width, height, spacing);
    }
  }

  /**
   * Update the visibility and orientation of split handles.
   *
   * @param splitNode - The split layout node of interest.
   */
  export
  function updateSplitHandles(splitNode: SplitLayoutNode): void {
    // Do nothing if there are no handles.
    if (splitNode.handles.isEmpty) {
      return;
    }

    // Show all handles and update their orientation.
    for (let i = 0, n = splitNode.handles.length; i < n; ++i) {
      splitNode.handles.at(i).style.display = '';
    }

    // Hide the last handle.
    splitNode.handles.back.style.display = 'none';
  }

  /**
   * Fit the given tab layout node.
   *
   * @param tabNode - The tab node of interest.
   *
   * @returns The computed size limits for the node.
   */
  function fitTabNode(tabNode: TabLayoutNode): ISizeLimits {
    // Setup the limit variables.
    let minWidth = 0;
    let minHeight = 0;
    let maxWidth = Infinity;
    let maxHeight = Infinity;

    // Lookup common variables.
    let tabBar = tabNode.tabBar;
    let tabSizer = tabNode.sizers.at(0);
    let widgetSizer = tabNode.sizers.at(1);
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
   * Recursively fit the given split layout node.
   *
   * @param splitNode - The split node of interest.
   *
   * @returns The computed size limits for the node.
   */
  function fitSplitNode(splitNode: SplitLayoutNode, spacing: number): ISizeLimits {
    // Setup the limit variables.
    let minWidth = 0;
    let minHeight = 0;
    let maxWidth = Infinity;
    let maxHeight = Infinity;

    // Compute common values.
    let horizontal = splitNode.orientation === 'horizontal';
    let fixed = Math.max(0, splitNode.children.length - 1) * spacing;

    // Adjust the starting limits for the orientation.
    if (horizontal) {
      minWidth = fixed;
      maxWidth = fixed;
    } else {
      minHeight = fixed;
      maxHeight = fixed;
    }

    // Adjust the limits and sizer for each child area.
    for (let i = 0, n = splitNode.children.length; i < n; ++i) {
      let sizer = splitNode.sizers.at(i);
      let child = splitNode.children.at(i);
      let limits = fitNode(child, spacing);
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
   * Update the given tab layout node.
   *
   * @param tabNode - The tab node of interest.
   *
   * @param x - The offset left position of the layout area.
   *
   * @param y - The offset top position of the layout area.
   *
   * @param width - The width of the layout area.
   *
   * @param height - The height of the layout area.
   */
  function updateTabNode(tabNode: TabLayoutNode, x: number, y: number, width: number, height: number): void {
    // Lookup common variables.
    let tabBar = tabNode.tabBar;
    let tabSizer = tabNode.sizers.at(0);
    let widgetSizer = tabNode.sizers.at(1);
    let currentTitle = tabBar.currentTitle;
    let widget = currentTitle ? currentTitle.owner as Widget : null;

    // Distribute the layout space to the sizers.
    boxCalc(tabNode.sizers, height);

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

  /**
   * Update the given split layout node.
   *
   * @param splitNode - The split node of interest.
   *
   * @param x - The offset left position of the layout area.
   *
   * @param y - The offset top position of the layout area.
   *
   * @param width - The width of the layout area.
   *
   * @param height - The height of the layout area.
   *
   * @param spacing - The spacing to use between tab areas.
   */
  function updateSplitNode(splitNode: SplitLayoutNode, x: number, y: number, width: number, height: number, spacing: number): void {
    // Compute the available layout space.
    let horizontal = splitNode.orientation === 'horizontal';
    let fixed = Math.max(0, splitNode.children.length - 1) * spacing;
    let space = Math.max(0, (horizontal ? width : height) - fixed);

    // Distribute the layout space to the sizers.
    boxCalc(splitNode.sizers, space);

    // Update the geometry of the child areas and split handles.
    for (let i = 0, n = splitNode.children.length; i < n; ++i) {
      let child = splitNode.children.at(i);
      let size = splitNode.sizers.at(i).size;
      let style = splitNode.handles.at(i).style;
      if (horizontal) {
        updateNode(child, x, y, size, height, spacing);
        x += size;
        style.top = `${y}px`;
        style.left = `${x}px`;
        style.width = `${spacing}px`;
        style.height = `${height}px`;
        x += spacing;
      } else {
        updateNode(child, x, y, width, size, spacing);
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
