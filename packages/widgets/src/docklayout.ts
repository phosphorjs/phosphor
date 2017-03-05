/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, ChainIterator, IIterator, chain, each, empty, map, once, reduce
} from '@phosphor/algorithm';

import {
  ElementExt, Platform
} from '@phosphor/domutils';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  BoxEngine, BoxSizer
} from './boxengine';

import {
  Layout
} from './layout';

import {
  TabBar
} from './tabbar';

import {
  Widget
} from './widget';


/**
 * A layout which provides a flexible docking arrangement.
 *
 * #### Notes
 * The layout handles the `currentChanged` signals of the tab bars and
 * the corresponding visibility of the child widgets. The widget which
 * consumes the layout is responsible for all other tab interactions
 * as well as all mouse and drag events.
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
    this.renderer = options.renderer;
    this._spacing = Private.clampSpacing(options.spacing);
  }

  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This will clear and dispose all widgets in the layout.
   */
  dispose(): void {
    // Get an iterator over the widgets in the layout.
    let widgets = this.iter();

    // Clear the layout before disposing the widgets.
    this._box = null;
    this._root = null;

    // Dispose of the widgets contained in the old layout root.
    each(widgets, widget => { widget.dispose(); });

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * The renderer used by the dock layout.
   */
  readonly renderer: DockLayout.IRenderer;

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
   * Whether the dock layout is empty.
   */
  get isEmpty(): boolean {
    return this._root === null;
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
   * @returns A new iterator over the user widgets in the layout.
   *
   * #### Notes
   * This iterator does not include the generated tab bars.
   */
  widgets(): IIterator<Widget> {
    return this._root ? Private.iterUserWidgets(this._root) : empty<Widget>();
  }

  /**
   * Create an iterator over the tab bars in the layout.
   *
   * @returns A new iterator over the tab bars in the layout.
   *
   * #### Notes
   * This iterator does not include the user widgets.
   */
  tabBars(): IIterator<TabBar<Widget>> {
    return this._root ? Private.iterTabBars(this._root) : empty<TabBar<Widget>>();
  }

  /**
   * Create an iterator over the handles in the layout.
   *
   * @returns A new iterator over the handles in the layout.
   */
  handles(): IIterator<HTMLDivElement> {
    return this._root ? Private.iterHandles(this._root) : empty<HTMLDivElement>();
  }

  /**
   * Move a handle to the given offset position.
   *
   * @param handle - The handle to move.
   *
   * @param offsetX - The desired offset X position of the handle.
   *
   * @param offsetY - The desired offset Y position of the handle.
   *
   * #### Notes
   * If the given handle is not contained in the layout, this is no-op.
   *
   * The handle will be moved as close as possible to the desired
   * position without violating any of the layout constraints.
   *
   * Only one of the coordinates is used depending on the orientation
   * of the handle. This method accepts both coordinates to make it
   * easy to invoke from a mouse move event without needing to know
   * the handle orientation.
   */
  moveHandle(handle: HTMLDivElement, offsetX: number, offsetY: number): void {
    // Bail early if there is no root or if the handle is hidden.
    if (!this._root || handle.classList.contains('p-mod-hidden')) {
      return;
    }

    // Lookup the split node for the handle.
    let data = Private.findSplitNode(this._root, handle);
    if (!data) {
      return;
    }

    // Compute the desired delta movement for the handle.
    let delta: number;
    if (data.node.orientation === 'horizontal') {
      delta = offsetX - handle.offsetLeft;
    } else {
      delta = offsetY - handle.offsetTop;
    }

    // Bail if there is no handle movement.
    if (delta === 0) {
      return;
    }

    // Prevent sibling resizing unless needed.
    Private.holdSizes(data.node.sizers);

    // Adjust the sizers to reflect the handle movement.
    BoxEngine.adjust(data.node.sizers, data.index, delta);

    // Update the layout of the widgets.
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Save the current configuration of the dock layout.
   *
   * @returns A new snapshot of the current dock layout configuration.
   *
   * #### Notes
   * The return value can be provided to the `restoreLayout` method
   * in order to restore the layout to its current configuration.
   */
  saveLayout(): DockLayout.ILayoutConfig {
    // Bail early if there is no root.
    if (!this._root) {
      return { main: null };
    }

    // Hold the current layout sizes.
    Private.holdLayoutSizes(this._root);

    // Create the main area config.
    let main = Private.createConfig(this._root);

    // Return the layout config.
    return { main };
  }

  /**
   * Restore the layout to a previously saved configuration.
   *
   * @param config - The layout configuration to restore.
   *
   * @throws An error if the config is invalid.
   *
   * #### Notes
   * Widgets which currently belong to the layout but which are not
   * contained in the config will be unparented.
   */
  restoreLayout(config: DockLayout.ILayoutConfig): void {
    // Validate the config and collect the contained widgets.
    let widgetSet = Private.validateConfig(config);

    // Create iterators over the old widgets and tab bars.
    let oldWidgets = this.widgets();
    let oldTabBars = this.tabBars();

    // Clear the root before removing the old widgets.
    this._root = null;

    // Unparent the old widgets which are not in the new config.
    each(oldWidgets, widget => {
      if (!widgetSet.has(widget)) {
        widget.parent = null;
      }
    });

    // Dispose of the old tab bars.
    each(oldTabBars, tabBar => {
      tabBar.dispose();
    });

    // Reparent the new widgets to the current parent.
    widgetSet.forEach(widget => {
      widget.parent = this.parent;
    });

    // Create the root node for the new config.
    this._root = Private.realizeConfig(config, {
      createTabBar: () => this._createTabBar(),
      createHandle: () => this._createHandle()
    });

    // If there is no parent, there is nothing more to do.
    if (!this.parent) {
      return;
    }

    // Attach the new widgets to the parent.
    widgetSet.forEach(widget => {
      this.attachWidget(widget);
    });

    // Post a fit request to the parent.
    this.parent.fit();

    // Flush the message loop on IE and Edge to prevent flicker.
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush();
    }
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
   * An error will be thrown if the reference widget is invalid.
   */
  addWidget(widget: Widget, options: DockLayout.IAddOptions = {}): void {
    // Parse the options.
    let ref = options.ref || null;
    let mode = options.mode || 'tab-after';

    // Find the tab node which holds the reference widget.
    let refNode: Private.TabLayoutNode | null = null;
    if (this._root && ref) {
      refNode = Private.findTabNode(this._root, ref);
    }

    // Throw an error if the reference widget is invalid.
    if (ref && !refNode) {
      throw new Error('Reference widget is not in the layout.');
    }

    // Reparent the widget to the current layout parent.
    widget.parent = this.parent;

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
    each(this.handles(), handle => { this.parent!.node.appendChild(handle); });

    // Post a fit request for the parent widget.
    this.parent!.fit();
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
    if (this.parent!.node === widget.node.parentNode) {
      return;
    }

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
    if (this.parent!.node !== widget.node.parentNode) {
      return;
    }

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
   * Remove the specified widget from the layout structure.
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

    // Bail early if the tab node is not found.
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

    // Prevent widget resizing unless needed.
    Private.holdLayoutSizes(this._root);

    // Clear the parent reference on the tab node.
    let splitNode = tabNode.parent!;
    tabNode.parent = null;

    // Remove the tab node from its parent split node.
    let i = ArrayExt.removeFirstOf(splitNode.children, tabNode);
    let handle = ArrayExt.removeAt(splitNode.handles, i)!;
    ArrayExt.removeAt(splitNode.sizers, i);

    // Remove the handle from its parent DOM node.
    if (handle.parentNode) {
      handle.parentNode.removeChild(handle);
    }

    // If there are multiple children, just update the handles.
    if (splitNode.children.length > 1) {
      Private.syncHandles(splitNode);
      return;
    }

    // Otherwise, the split node also needs to be removed...

    // Clear the parent reference on the split node.
    let maybeParent = splitNode.parent;
    splitNode.parent = null;

    // Lookup the remaining child node and handle.
    let childNode = splitNode.children[0];
    let childHandle = splitNode.handles[0];

    // Clear the split node data.
    splitNode.children.length = 0;
    splitNode.handles.length = 0;
    splitNode.sizers.length = 0;

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
    let parentNode = maybeParent!;

    // Lookup the index of the split node.
    let j = parentNode.children.indexOf(splitNode);

    // Handle the case where the child node is a tab node.
    if (childNode instanceof Private.TabLayoutNode) {
      childNode.parent = parentNode;
      parentNode.children[j] = childNode;
      return;
    }

    // Remove the split data from the parent.
    let splitHandle = ArrayExt.removeAt(parentNode.handles, j)!;
    ArrayExt.removeAt(parentNode.children, j);
    ArrayExt.removeAt(parentNode.sizers, j);

    // Remove the handle from its parent node.
    if (splitHandle.parentNode) {
      splitHandle.parentNode.removeChild(splitHandle);
    }

    // The child node and the split parent node will have the same
    // orientation. Merge the grand-children with the parent node.
    for (let i = 0, n = childNode.children.length; i < n; ++i) {
      let gChild = childNode.children[i];
      let gHandle = childNode.handles[i];
      let gSizer = childNode.sizers[i];
      ArrayExt.insert(parentNode.children, j + i, gChild);
      ArrayExt.insert(parentNode.handles, j + i, gHandle);
      ArrayExt.insert(parentNode.sizers, j + i, gSizer);
      gChild.parent = parentNode;
    }

    // Clear the child node.
    childNode.children.length = 0;
    childNode.handles.length = 0;
    childNode.sizers.length = 0;
    childNode.parent = null;

    // Sync the handles on the parent node.
    Private.syncHandles(parentNode);
  }

  /**
   * Insert a widget next to an existing tab.
   *
   * #### Notes
   * This does not attach the widget to the parent widget.
   */
  private _insertTab(widget: Widget, ref: Widget | null, refNode: Private.TabLayoutNode | null, after: boolean): void {
    // Do nothing if the tab is inserted next to itself.
    if (widget === ref) {
      return;
    }

    // Create the root if it does not exist.
    if (!this._root) {
      let tabNode = new Private.TabLayoutNode(this._createTabBar());
      tabNode.tabBar.addTab(widget.title);
      this._root = tabNode;
      return;
    }

    // Use the first tab node as the ref node if needed.
    if (!refNode) {
      refNode = Private.firstTabNode(this._root)!;
    }

    // If the widget is not contained in the ref node, ensure it is
    // removed from the layout and hidden before being added again.
    if (refNode.tabBar.titles.indexOf(widget.title) === -1) {
      this._removeWidget(widget);
      widget.hide();
    }

    // Lookup the target index for inserting the tab.
    let index: number;
    if (ref) {
      index = refNode.tabBar.titles.indexOf(ref.title);
    } else {
      index = refNode.tabBar.currentIndex;
    }

    // Insert the widget's tab relative to the target index.
    refNode.tabBar.insertTab(index + (after ? 1 : 0), widget.title);
  }

  /**
   * Insert a widget as a new split area.
   *
   * #### Notes
   * This does not attach the widget to the parent widget.
   */
  private _insertSplit(widget: Widget, ref: Widget | null, refNode: Private.TabLayoutNode | null, orientation: Private.Orientation, after: boolean): void {
    // Do nothing if there is no effective split.
    if (widget === ref && refNode && refNode.tabBar.titles.length === 1) {
      return;
    }

    // Ensure the widget is removed from the current layout.
    this._removeWidget(widget);

    // Create the tab layout node to hold the widget.
    let tabNode = new Private.TabLayoutNode(this._createTabBar());
    tabNode.tabBar.addTab(widget.title);

    // Set the root if it does not exist.
    if (!this._root) {
      this._root = tabNode;
      return;
    }

    // If the ref node parent is null, split the root.
    if (!refNode || !refNode.parent) {
      // Ensure the root is split with the correct orientation.
      let root = this._splitRoot(orientation);

      // Determine the insert index for the new tab node.
      let i = after ? root.children.length : 0;

      // Normalize the split node.
      Private.normalizeSizes(root);

      // Create the sizer for new tab node.
      let sizer = Private.createSizer(refNode ? 1 : Private.GOLDEN_RATIO);

      // Insert the tab node sized to the golden ratio.
      ArrayExt.insert(root.children, i, tabNode);
      ArrayExt.insert(root.sizers, i, sizer);
      ArrayExt.insert(root.handles, i, this._createHandle());
      tabNode.parent = root;

      // Re-normalize the split node to maintain the ratios.
      Private.normalizeSizes(root);

      // Finally, synchronize the visibility of the handles.
      Private.syncHandles(root);
      return;
    }

    // Lookup the split node for the ref widget.
    let splitNode = refNode.parent;

    // If the split node already had the correct orientation,
    // the widget can be inserted into the split node directly.
    if (splitNode.orientation === orientation) {
      // Find the index of the ref node.
      let i = splitNode.children.indexOf(refNode);

      // Normalize the split node.
      Private.normalizeSizes(splitNode);

      // Consume half the space for the insert location.
      let s = splitNode.sizers[i].sizeHint /= 2;

      // Insert the tab node sized to the other half.
      let j = i + (after ? 1 : 0);
      ArrayExt.insert(splitNode.children, j, tabNode);
      ArrayExt.insert(splitNode.sizers, j, Private.createSizer(s));
      ArrayExt.insert(splitNode.handles, j, this._createHandle());
      tabNode.parent = splitNode;

      // Finally, synchronize the visibility of the handles.
      Private.syncHandles(splitNode);
      return;
    }

    // Remove the ref node from the split node.
    let i = ArrayExt.removeFirstOf(splitNode.children, refNode);

    // Create a new normalized split node for the children.
    let childNode = new Private.SplitLayoutNode(orientation);
    childNode.normalized = true;

    // Add the ref node sized to half the space.
    childNode.children.push(refNode);
    childNode.sizers.push(Private.createSizer(0.5));
    childNode.handles.push(this._createHandle());
    refNode.parent = childNode;

    // Add the tab node sized to the other half.
    let j = after ? 1 : 0;
    ArrayExt.insert(childNode.children, j, tabNode);
    ArrayExt.insert(childNode.sizers, j, Private.createSizer(0.5));
    ArrayExt.insert(childNode.handles, j, this._createHandle());
    tabNode.parent = childNode;

    // Synchronize the visibility of the handles.
    Private.syncHandles(childNode);

    // Finally, add the new child node to the original split node.
    ArrayExt.insert(splitNode.children, i, childNode);
    childNode.parent = splitNode;
  }

  /**
   * Ensure the root is a split node with the given orientation.
   */
  private _splitRoot(orientation: Private.Orientation): Private.SplitLayoutNode {
    // Bail early if the root already meets the requirements.
    let oldRoot = this._root;
    if (oldRoot instanceof Private.SplitLayoutNode) {
      if (oldRoot.orientation === orientation) {
        return oldRoot;
      }
    }

    // Create a new root node with the specified orientation.
    let newRoot = this._root = new Private.SplitLayoutNode(orientation);

    // Add the old root to the new root.
    if (oldRoot) {
      newRoot.children.push(oldRoot);
      newRoot.sizers.push(Private.createSizer(0));
      newRoot.handles.push(this._createHandle());
      oldRoot.parent = newRoot;
    }

    // Return the new root as a convenience.
    return newRoot;
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Set up the size limits.
    let minW = 0;
    let minH = 0;
    let maxW = Infinity;
    let maxH = Infinity;

    // Update the limits for the root layout node.
    if (this._root) {
      let limits = Private.fitLayoutNode(this._root, this._spacing);
      minW = limits.minWidth;
      minH = limits.minHeight;
      maxW = limits.maxWidth;
      maxH = limits.maxHeight;
    }

    // Update the box sizing and add it to the size limits.
    let box = this._box = ElementExt.boxSizing(this.parent!.node);
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

    // Bail early if there is no root layout node.
    if (!this._root) {
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
    let x = this._box.paddingTop;
    let y = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Update the geometry of the root layout node.
    Private.updateLayoutNode(this._root, x, y, width, height, this._spacing);
  }

  /**
   * Create a new tab bar for use by the dock layout.
   *
   * #### Notes
   * The tab bar will be attached to the parent if it exists.
   */
  private _createTabBar(): TabBar<Widget> {
    // Create the tab bar using the renderer.
    let tabBar = this.renderer.createTabBar();

    // Enforce necessary tab bar behavior.
    // TODO do we really want to enforce *all* of these?
    tabBar.tabsMovable = true;
    tabBar.allowDeselect = false;
    tabBar.orientation = 'horizontal';
    tabBar.removeBehavior = 'select-previous-tab';
    tabBar.insertBehavior = 'select-tab-if-needed';

    // Set up the signal handlers for the tab bar.
    tabBar.currentChanged.connect(this._onCurrentChanged, this);

    // Reparent and attach the tab bar to the parent if possible.
    if (this.parent) {
      tabBar.parent = this.parent;
      this.attachWidget(tabBar);
    }

    // Return the initialized tab bar.
    return tabBar;
  }

  /**
   * Create a new handle for the dock layout.
   *
   * #### Notes
   * The handle will be attached to the parent if it exists.
   */
  private _createHandle(): HTMLDivElement {
    // Create the handle using the renderer.
    let handle = this.renderer.createHandle();

    // Initialize the handle layout behavior.
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

  /**
   * Handle the `currentChanged` signal from a tab bar in the layout.
   */
  private _onCurrentChanged(sender: TabBar<Widget>, args: TabBar.ICurrentChangedArgs<Widget>): void {
    // Extract the previous and current title from the args.
    let { previousTitle, currentTitle } = args;

    // Hide the previous widget.
    if (previousTitle) {
      previousTitle.owner.hide();
    }

    // Show the current widget.
    if (currentTitle) {
      currentTitle.owner.show();
    }

    // Flush the message loop on IE and Edge to prevent flicker.
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush();
    }
  }

  private _dirty = false;
  private _spacing: number;
  private _root: Private.LayoutNode | null = null;
  private _box: ElementExt.IBoxSizing | null = null;
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
    createTabBar(): TabBar<Widget>;

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
   * to the dock layout relative to a reference widget.
   */
  export
  type InsertMode = (
    /**
     * The area to the top of the reference widget.
     *
     * The widget will be inserted just above the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the top edge of the dock layout.
     */
    'split-top' |

    /**
     * The area to the left of the reference widget.
     *
     * The widget will be inserted just left of the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the left edge of the dock layout.
     */
    'split-left' |

    /**
     * The area to the right of the reference widget.
     *
     * The widget will be inserted just right of the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted  at the right edge of the dock layout.
     */
    'split-right' |

    /**
     * The area to the bottom of the reference widget.
     *
     * The widget will be inserted just below the reference widget.
     *
     * If the reference widget is null or invalid, the widget will be
     * inserted at the bottom edge of the dock layout.
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
    ref?: Widget | null;
  }

  /**
   * A layout config object for a tab area.
   */
  export
  interface ITabAreaConfig {
    /**
     * The discriminated type of the config object.
     */
    type: 'tab-area';

    /**
     * The widgets contained in the tab area.
     */
    widgets: Widget[];

    /**
     * The index of the selected tab.
     */
    currentIndex: number;
  }

  /**
   * A layout config object for a split area.
   */
  export
  interface ISplitAreaConfig {
    /**
     * The discriminated type of the config object.
     */
    type: 'split-area';

    /**
     * The orientation of the split area.
     */
    orientation: 'horizontal' | 'vertical';

    /**
     * The children in the split area.
     */
    children: AreaConfig[];

    /**
     * The relative sizes of the children.
     */
    sizes: number[];
  }

  /**
   * A type alias for a general area config.
   */
  export
  type AreaConfig = ITabAreaConfig | ISplitAreaConfig;

  /**
   * A layout config object for a dock layout.
   */
  export
  interface ILayoutConfig {
    /**
     * The layout config for the main dock area.
     */
    main: AreaConfig | null;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A fraction used for sizing root panels; ~= `1 / golden_ratio`.
   */
  export
  const GOLDEN_RATIO = 0.618;

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
    constructor(tabBar: TabBar<Widget>) {
      let tabSizer = new BoxSizer();
      let widgetSizer = new BoxSizer();
      tabSizer.stretch = 0;
      widgetSizer.stretch = 1;
      this.tabBar = tabBar;
      this.sizers = [tabSizer, widgetSizer];
    }

    /**
     * The parent of the layout node.
     */
    parent: SplitLayoutNode | null = null;

    /**
     * The tab bar for the layout node.
     */
    readonly tabBar: TabBar<Widget>;

    /**
     * The box sizers for the tab bar and current widget.
     */
    readonly sizers: [BoxSizer, BoxSizer];
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
     * The parent of the layout node.
     */
    parent: SplitLayoutNode | null = null;

    /**
     * Whether the sizers have been normalized.
     */
    normalized = false;

    /**
     * The orientation of the node.
     */
    readonly orientation: Orientation;

    /**
     * The child nodes for the split node.
     */
    readonly children: LayoutNode[] = [];

    /**
     * The box sizers for the layout children.
     */
    readonly sizers: BoxSizer[] = [];

    /**
     * The handles for the layout children.
     */
    readonly handles: HTMLDivElement[] = [];
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
   * #### Notes
   * This includes the tab bars for the tab layout nodes.
   */
  export
  function iterAllWidgets(node: LayoutNode): IIterator<Widget> {
    let it: IIterator<Widget>;
    if (node instanceof TabLayoutNode) {
      it = chain(once(node.tabBar), iterUserWidgets(node));
    } else {
      it = new ChainIterator<Widget>(map(node.children, iterAllWidgets));
    }
    return it;
  }

  /**
   * Create an iterator for the user widgets in the layout tree.
   *
   * #### Notes
   * This does not include the tab bars for the tab layout nodes.
   */
  export
  function iterUserWidgets(node: LayoutNode): IIterator<Widget> {
    let it: IIterator<Widget>;
    if (node instanceof TabLayoutNode) {
      it = map(node.tabBar.titles, title => title.owner);
    } else {
      it = new ChainIterator<Widget>(map(node.children, iterUserWidgets));
    }
    return it;
  }

  /**
   * Create an iterator for the tab bars in the tree.
   */
  export
  function iterTabBars(node: LayoutNode): IIterator<TabBar<Widget>> {
    let it: IIterator<TabBar<Widget>>;
    if (node instanceof TabLayoutNode) {
      it = once(node.tabBar);
    } else {
      it = new ChainIterator<TabBar<Widget>>(map(node.children, iterTabBars));
    }
    return it;
  }

  /**
   * Create an iterator for the handles in the tree.
   */
  export
  function iterHandles(node: LayoutNode): IIterator<HTMLDivElement> {
    let it: IIterator<HTMLDivElement>;
    if (node instanceof TabLayoutNode) {
      it = empty<HTMLDivElement>();
    } else {
      let others = map(node.children, iterHandles);
      it = chain(node.handles, new ChainIterator<HTMLDivElement>(others));
    }
    return it;
  }

  /**
   * Find the first tab layout node in a layout tree.
   */
  export
  function firstTabNode(node: LayoutNode): TabLayoutNode | null {
    // Return the node if it's a tab layout node.
    if (node instanceof TabLayoutNode) {
      return node;
    }

    // Recursively search the children for a tab layout node.
    for (let i = 0, n = node.children.length; i < n; ++i) {
      let result = firstTabNode(node.children[i]);
      if (result) {
        return result;
      }
    }

    // Otherwise, there is no tab layout node.
    return null;
  }

  /**
   * Find the tab layout node which contains the given widget.
   */
  export
  function findTabNode(node: LayoutNode, widget: Widget): TabLayoutNode | null {
    // Return the tab node if it contains the widget.
    if (node instanceof TabLayoutNode) {
      return node.tabBar.titles.indexOf(widget.title) !== -1 ? node : null;
    }

    // Recursively search the children of a split layout node.
    for (let i = 0, n = node.children.length; i < n; ++i) {
      let result = findTabNode(node.children[i], widget);
      if (result) {
        return result;
      }
    }

    // Otherwise, the widget does not exist in the tree.
    return null;
  }

  /**
   * Find the split layout node which contains the given handle.
   */
  export
  function findSplitNode(node: LayoutNode, handle: HTMLDivElement): { index: number, node: SplitLayoutNode } | null {
    // Bail if the node is not a split node.
    if (node instanceof TabLayoutNode) {
      return null;
    }

    // Return the pair if the node contains the handle.
    let index = node.handles.indexOf(handle);
    if (index !== -1) {
      return { index, node };
    }

    // Recursively search the child split nodes.
    for (let i = 0, n = node.children.length; i < n; ++i) {
      let result = findSplitNode(node.children[i], handle);
      if (result) {
        return result;
      }
    }

    // Otherwise, the handle does not exist in the tree.
    return null;
  }

  /**
   * Recursively fit the given layout node.
   */
  export
  function fitLayoutNode(node: LayoutNode, spacing: number): ElementExt.ISizeLimits {
    let limits: ElementExt.ISizeLimits;
    if (node instanceof TabLayoutNode) {
      limits = fitTabNode(node);
    } else {
      limits = fitSplitNode(node, spacing);
    }
    return limits;
  }

  /**
   * Recursively update the given layout node.
   */
  export
  function updateLayoutNode(node: LayoutNode, x: number, y: number, width: number, height: number, spacing: number): void {
    if (node instanceof TabLayoutNode) {
      updateTabNode(node, x, y, width, height);
    } else {
      updateSplitNode(node, x, y, width, height, spacing);
    }
  }

  /**
   * Create an area config object for a dock layout node.
   */
  export
  function createConfig(node: LayoutNode): DockLayout.AreaConfig {
    let config: DockLayout.AreaConfig;
    if (node instanceof TabLayoutNode) {
      config = createTabAreaConfig(node);
    } else {
      config = createSplitAreaConfig(node);
    }
    return config;
  }

  /**
   * Valid a layout configuration object.
   */
  export
  function validateConfig(config: DockLayout.ILayoutConfig): Set<Widget> {
    // Create the set to hold the contained widgets.
    let widgetSet = new Set<Widget>();

    // Bail early if there is no main area.
    if (!config.main) {
      return widgetSet;
    }

    // Validate the main area.
    if (config.main.type === 'tab-area') {
      validateTabArea(config.main, widgetSet);
    } else {
      validateSplitArea(config.main, widgetSet);
    }

    // Return the contained widgets.
    return widgetSet;
  }

  /**
   * Create the root layout node for a layout configuration.
   */
  export
  function realizeConfig(config: DockLayout.ILayoutConfig, renderer: DockLayout.IRenderer): LayoutNode | null {
    // Bail early if there is no main area.
    if (!config.main) {
      return null;
    }

    // Create the layout node for the main area.
    return buildAreaNode(config.main, renderer);
  }

  /**
   * Sync the visibility and orientation of split node handles.
   */
  export
  function syncHandles(splitNode: SplitLayoutNode): void {
    // Do nothing if there are no handles.
    if (splitNode.handles.length === 0) {
      return;
    }

    // Update the handle orientation and visibility.
    each(splitNode.handles, (handle, i) => {
      if (splitNode.orientation === 'horizontal') {
        handle.classList.remove('p-mod-vertical');
        handle.classList.add('p-mod-horizontal');
      } else {
        handle.classList.remove('p-mod-horizontal');
        handle.classList.add('p-mod-vertical');
      }
      if (i === splitNode.handles.length - 1) {
        handle.classList.add('p-mod-hidden');
      } else {
        handle.classList.remove('p-mod-hidden');
      }
    });
  }

  /**
   * Hold the current sizes of an array of box sizers.
   *
   * This sets the size hint of each sizer to its current size.
   */
  export
  function holdSizes(sizers: BoxSizer[]): void {
    each(sizers, sizer => { sizer.sizeHint = sizer.size; });
  }

  /**
   * Recursively hold all the layout sizes in the tree.
   *
   * This ignores the sizers of tab layout nodes.
   */
  export
  function holdLayoutSizes(node: LayoutNode): void {
    if (node instanceof SplitLayoutNode) {
      each(node.children, holdLayoutSizes);
      holdSizes(node.sizers);
    }
  }

  /**
   * Create a box sizer with an initial size hint.
   */
  export
  function createSizer(hint: number): BoxSizer {
    let sizer = new BoxSizer();
    sizer.sizeHint = hint;
    sizer.size = hint;
    return sizer;
  }

  /**
   * Normalize the sizes of a split layout node.
   */
  export
  function normalizeSizes(splitNode: SplitLayoutNode): void {
    // Bail early if the sizers are empty.
    let n = splitNode.sizers.length;
    if (n === 0) {
      return;
    }

    // Hold the current sizes of the sizers.
    holdSizes(splitNode.sizers);

    // Compute the sum of the sizes.
    let sum = reduce(splitNode.sizers, (v, sizer) => v + sizer.sizeHint, 0);

    // Normalize the sizes based on the sum.
    if (sum === 0) {
      each(splitNode.sizers, sizer => {
        sizer.size = sizer.sizeHint = 1 / n;
      });
    } else {
      each(splitNode.sizers, sizer => {
        sizer.size = sizer.sizeHint /= sum;
      });
    }

    // Mark the split node as normalized.
    splitNode.normalized = true;
  }

  /**
   * Fit the given tab layout node.
   */
  function fitTabNode(tabNode: TabLayoutNode): ElementExt.ISizeLimits {
    // Set up the limit variables.
    let minWidth = 0;
    let minHeight = 0;
    let maxWidth = Infinity;
    let maxHeight = Infinity;

    // Lookup common variables.
    let tabBar = tabNode.tabBar;
    let tabSizer = tabNode.sizers[0];
    let widgetSizer = tabNode.sizers[1];
    let currentTitle = tabBar.currentTitle;
    let widget = currentTitle ? currentTitle.owner : null;

    // Adjust the starting max height if a widget is visible.
    if (!tabBar.isHidden || (widget && !widget.isHidden)) {
      maxHeight = 0;
    }

    // Update the results and sizer for the tab bar.
    if (!tabBar.isHidden) {
      let limits = ElementExt.sizeLimits(tabBar.node);
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
      let limits = ElementExt.sizeLimits(widget.node);
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

    // Return the computed size limits for the layout node.
    return { minWidth, minHeight, maxWidth, maxHeight };
  }

  /**
   * Recursively fit the given split layout node.
   */
  function fitSplitNode(splitNode: SplitLayoutNode, spacing: number): ElementExt.ISizeLimits {
    // Set up the limit variables.
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
      let sizer = splitNode.sizers[i];
      let child = splitNode.children[i];
      let limits = fitLayoutNode(child, spacing);
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

    // Return the computed size limits for the layout node.
    return { minWidth, minHeight, maxWidth, maxHeight };
  }

  /**
   * Update the given tab layout node.
   */
  function updateTabNode(tabNode: TabLayoutNode, x: number, y: number, width: number, height: number): void {
    // Lookup common variables.
    let tabBar = tabNode.tabBar;
    let tabSizer = tabNode.sizers[0];
    let widgetSizer = tabNode.sizers[1];
    let currentTitle = tabBar.currentTitle;
    let widget = currentTitle ? currentTitle.owner : null;

    // Distribute the layout space to the sizers.
    BoxEngine.calc(tabNode.sizers, height);

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
   */
  function updateSplitNode(splitNode: SplitLayoutNode, x: number, y: number, width: number, height: number, spacing: number): void {
    // Compute the available layout space.
    let horizontal = splitNode.orientation === 'horizontal';
    let fixed = Math.max(0, splitNode.children.length - 1) * spacing;
    let space = Math.max(0, (horizontal ? width : height) - fixed);

    // De-normalize the split node if needed.
    if (splitNode.normalized) {
      each(splitNode.sizers, sizer => { sizer.sizeHint *= space; });
      splitNode.normalized = false;
    }

    // Distribute the layout space to the sizers.
    BoxEngine.calc(splitNode.sizers, space);

    // Update the geometry of the child areas and handles.
    for (let i = 0, n = splitNode.children.length; i < n; ++i) {
      let child = splitNode.children[i];
      let size = splitNode.sizers[i].size;
      let handleStyle = splitNode.handles[i].style;
      if (horizontal) {
        updateLayoutNode(child, x, y, size, height, spacing);
        x += size;
        handleStyle.top = `${y}px`;
        handleStyle.left = `${x}px`;
        handleStyle.width = `${spacing}px`;
        handleStyle.height = `${height}px`;
        x += spacing;
      } else {
        updateLayoutNode(child, x, y, width, size, spacing);
        y += size;
        handleStyle.top = `${y}px`;
        handleStyle.left = `${x}px`;
        handleStyle.width = `${width}px`;
        handleStyle.height = `${spacing}px`;
        y += spacing;
      }
    }
  }

  /**
   * Create the tab area configuration for a tab layout node.
   */
  function createTabAreaConfig(node: TabLayoutNode): DockLayout.ITabAreaConfig {
    let widgets = node.tabBar.titles.map(title => title.owner);
    let currentIndex = node.tabBar.currentIndex;
    return { type: 'tab-area', widgets, currentIndex };
  }

  /**
   * Create the split area configuration for a split layout node.
   */
  function createSplitAreaConfig(node: SplitLayoutNode): DockLayout.ISplitAreaConfig {
    let orientation = node.orientation;
    let children = node.children.map(createConfig);
    let sizes = createNormalizedSizes(node);
    return { type: 'split-area', orientation, children, sizes };
  }

  /**
   * Snap the normalized sizes of a split layout node.
   */
  function createNormalizedSizes(splitNode: SplitLayoutNode): number[] {
    // Bail early if the sizers are empty.
    let n = splitNode.sizers.length;
    if (n === 0) {
      return [];
    }

    // Grab the current sizes of the sizers.
    let sizes = splitNode.sizers.map(sizer => sizer.size);

    // Compute the sum of the sizes.
    let sum = reduce(sizes, (v, size) => v + size, 0);

    // Normalize the sizes based on the sum.
    if (sum === 0) {
      each(sizes, (size, i) => { sizes[i] = 1 / n; });
    } else {
      each(sizes, (size, i) => { sizes[i] = size / sum; });
    }

    // Return the normalized sizes.
    return sizes;
  }

  /**
   * Validate a tab area config and collect the visited widgets.
   */
  function validateTabArea(config: DockLayout.ITabAreaConfig, widgetSet: Set<Widget>): void {
    each(config.widgets, widget => {
      if (widgetSet.has(widget)) {
        throw new Error('Layout config has duplicate widget.');
      }
      widgetSet.add(widget);
    });
  }

  /**
   * Validate a split area config and collect the visited widgets.
   */
  function validateSplitArea(config: DockLayout.ISplitAreaConfig, widgetSet: Set<Widget>): void {
    if (config.sizes.length !== config.children.length) {
      throw new Error('Split area config has mismatched sizes count.');
    }
    if (config.sizes.some(size => size < 0)) {
      throw new Error('Split area config has negative sizes.');
    }
    each(config.children, child => validateChildArea(config, child, widgetSet));
  }

  /**
   * Validate a child area config.
   */
  function validateChildArea(parent: DockLayout.ISplitAreaConfig, child: DockLayout.AreaConfig, widgetSet: Set<Widget>): void {
    if (child.type === 'tab-area') {
      validateTabArea(child, widgetSet);
    } else if (parent.orientation === child.orientation) {
      throw new Error('Child split area config has invalid orientation.');
    } else {
      validateSplitArea(child, widgetSet);
    }
  }

  /**
   * Create a new layout node for an area config.
   */
  function buildAreaNode(config: DockLayout.AreaConfig, renderer: DockLayout.IRenderer): LayoutNode {
    let node: LayoutNode;
    if (config.type === 'tab-area') {
      node = buildTabAreaNode(config, renderer);
    } else {
      node = buildSplitAreaNode(config, renderer);
    }
    return node;
  }

  /**
   * Create a new layout node for a tab area config.
   */
  function buildTabAreaNode(config: DockLayout.ITabAreaConfig, renderer: DockLayout.IRenderer): LayoutNode {
    // Create the tab bar for the layout node.
    let tabBar = renderer.createTabBar();

    // Hide each widget and add it to the tab bar.
    each(config.widgets, widget => {
      widget.hide();
      tabBar.addTab(widget.title);
    });

    // Set the current index of the tab bar.
    let n = tabBar.titles.length;
    tabBar.currentIndex = Math.max(0, Math.min(config.currentIndex, n - 1));

    // Return the new tab layout node.
    return new TabLayoutNode(tabBar);
  }

  /**
   * Create a new layout node for a split area config.
   */
  function buildSplitAreaNode(config: DockLayout.ISplitAreaConfig, renderer: DockLayout.IRenderer): LayoutNode {
    // Create the split layout node.
    let node = new SplitLayoutNode(config.orientation);

    // Add each child to the split layout node.
    each(config.children, (child, i) => {
      // Recursively create the child layout node.
      let childNode = buildAreaNode(child, renderer);

      // Create the sizer for the child.
      let sizer = createSizer(config.sizes[i]);

      // Create the handle for the child.
      let handle = renderer.createHandle();

      // Add the child data to the layout node.
      node.children.push(childNode);
      node.handles.push(handle);
      node.sizers.push(sizer);

      // Update the parent for the child node.
      childNode.parent = node;
    });

    // Synchronize the handle state for the split layout node.
    syncHandles(node);

    // Normalize the sizes for the split layout node.
    normalizeSizes(node);

    // Return the new split layout node.
    return node;
  }
}
