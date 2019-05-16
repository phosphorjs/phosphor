/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, each, find, toArray
} from '@phosphor/algorithm';

import {
  MimeData
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ElementExt, Platform
} from '@phosphor/domutils';

import {
  Drag, IDragEvent
} from '@phosphor/dragdrop';

import {
  ConflatableMessage, Message, MessageLoop
} from '@phosphor/messaging';

import {
  AttachedProperty
} from '@phosphor/properties';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  DockLayout
} from './docklayout';

import {
  TabBar
} from './tabbar';

import {
  Widget
} from './widget';


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
    this.addClass('p-DockPanel');
    this._mode = options.mode || 'multiple-document';
    this._renderer = options.renderer || DockPanel.defaultRenderer;
    this._edges = options.edges || Private.DEFAULT_EDGES;

    // Toggle the CSS mode attribute.
    this.dataset['mode'] = this._mode;

    // Create the delegate renderer for the layout.
    let renderer: DockPanel.IRenderer = {
      createTabBar: () => this._createTabBar(),
      createHandle: () => this._createHandle()
    };

    // Set up the dock layout for the panel.
    this.layout = new DockLayout({ renderer, spacing: options.spacing });

    // Set up the overlay drop indicator.
    this.overlay = options.overlay || new DockPanel.Overlay();
    this.node.appendChild(this.overlay.node);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Hide the overlay.
    this.overlay.hide(0);

    // Cancel a drag if one is in progress.
    if (this._drag) {
      this._drag.dispose();
    }

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * A signal emitted when the layout configuration is modified.
   *
   * #### Notes
   * This signal is emitted whenever the current layout configuration
   * may have changed.
   *
   * This signal is emitted asynchronously in a collapsed fashion, so
   * that multiple synchronous modifications results in only a single
   * emit of the signal.
   */
  get layoutModified(): ISignal<this, void> {
    return this._layoutModified;
  }

  /**
   * The overlay used by the dock panel.
   */
  readonly overlay: DockPanel.IOverlay;

  /**
   * The renderer used by the dock panel.
   */
  get renderer(): DockPanel.IRenderer {
    return (this.layout as DockLayout).renderer;
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
   * Get the mode for the dock panel.
   */
  get mode(): DockPanel.Mode {
    return this._mode;
  }

  /**
   * Set the mode for the dock panel.
   *
   * #### Notes
   * Changing the mode is a destructive operation with respect to the
   * panel's layout configuration. If layout state must be preserved,
   * save the current layout config before changing the mode.
   */
  set mode(value: DockPanel.Mode) {
    // Bail early if the mode does not change.
    if (this._mode === value) {
      return;
    }

    // Update the internal mode.
    this._mode = value;

    // Toggle the CSS mode attribute.
    this.dataset['mode'] = value;

    // Get the layout for the panel.
    let layout = this.layout as DockLayout;

    // Configure the layout for the specified mode.
    switch (value) {
    case 'multiple-document':
      each(layout.tabBars(), tabBar => { tabBar.show(); });
      break;
    case 'single-document':
      layout.restoreLayout(Private.createSingleDocumentConfig(this));
      break;
    default:
      throw 'unreachable';
    }

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Whether the dock panel is empty.
   */
  get isEmpty(): boolean {
    return (this.layout as DockLayout).isEmpty;
  }

  /**
   * Create an iterator over the user widgets in the panel.
   *
   * @returns A new iterator over the user widgets in the panel.
   *
   * #### Notes
   * This iterator does not include the generated tab bars.
   */
  widgets(): IIterator<Widget> {
    return (this.layout as DockLayout).widgets();
  }

  /**
   * Create an iterator over the selected widgets in the panel.
   *
   * @returns A new iterator over the selected user widgets.
   *
   * #### Notes
   * This iterator yields the widgets corresponding to the current tab
   * of each tab bar in the panel.
   */
  selectedWidgets(): IIterator<Widget> {
    return (this.layout as DockLayout).selectedWidgets();
  }

  /**
   * Create an iterator over the tab bars in the panel.
   *
   * @returns A new iterator over the tab bars in the panel.
   *
   * #### Notes
   * This iterator does not include the user widgets.
   */
  tabBars(): IIterator<TabBar<Widget>> {
    return (this.layout as DockLayout).tabBars();
  }

  /**
   * Create an iterator over the handles in the panel.
   *
   * @returns A new iterator over the handles in the panel.
   */
  handles(): IIterator<HTMLDivElement> {
    return (this.layout as DockLayout).handles();
  }

  /**
   * Select a specific widget in the dock panel.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will make the widget the current widget in its tab area.
   */
  selectWidget(widget: Widget): void {
    // Find the tab bar which contains the widget.
    let tabBar = find(this.tabBars(), bar => {
      return bar.titles.indexOf(widget.title) !== -1;
    });

    // Throw an error if no tab bar is found.
    if (!tabBar) {
      throw new Error('Widget is not contained in the dock panel.');
    }

    // Ensure the widget is the current widget.
    tabBar.currentTitle = widget.title;
  }

  /**
   * Activate a specified widget in the dock panel.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will select and activate the given widget.
   */
  activateWidget(widget: Widget): void {
    this.selectWidget(widget);
    widget.activate();
  }

  /**
   * Save the current layout configuration of the dock panel.
   *
   * @returns A new config object for the current layout state.
   *
   * #### Notes
   * The return value can be provided to the `restoreLayout` method
   * in order to restore the layout to its current configuration.
   */
  saveLayout(): DockPanel.ILayoutConfig {
    return (this.layout as DockLayout).saveLayout();
  }

  /**
   * Restore the layout to a previously saved configuration.
   *
   * @param config - The layout configuration to restore.
   *
   * #### Notes
   * Widgets which currently belong to the layout but which are not
   * contained in the config will be unparented.
   *
   * The dock panel automatically reverts to `'multiple-document'`
   * mode when a layout config is restored.
   */
  restoreLayout(config: DockPanel.ILayoutConfig): void {
    // Reset the mode.
    this._mode = 'multiple-document';

    // Restore the layout.
    (this.layout as DockLayout).restoreLayout(config);

    // Flush the message loop on IE and Edge to prevent flicker.
    if (Platform.IS_EDGE || Platform.IS_IE) {
      MessageLoop.flush();
    }

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Add a widget to the dock panel.
   *
   * @param widget - The widget to add to the dock panel.
   *
   * @param options - The additional options for adding the widget.
   *
   * #### Notes
   * If the panel is in single document mode, the options are ignored
   * and the widget is always added as tab in the hidden tab bar.
   */
  addWidget(widget: Widget, options: DockPanel.IAddOptions = {}): void {
    // Add the widget to the layout.
    if (this._mode === 'single-document') {
      (this.layout as DockLayout).addWidget(widget);
    } else {
      (this.layout as DockLayout).addWidget(widget, options);
    }

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   */
  processMessage(msg: Message): void {
    if (msg.type === 'layout-modified') {
      this._layoutModified.emit(undefined);
    } else {
      super.processMessage(msg);
    }
  }

  /**
   * Handle the DOM events for the dock panel.
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
    case 'p-dragenter':
      this._evtDragEnter(event as IDragEvent);
      break;
    case 'p-dragleave':
      this._evtDragLeave(event as IDragEvent);
      break;
    case 'p-dragover':
      this._evtDragOver(event as IDragEvent);
      break;
    case 'p-drop':
      this._evtDrop(event as IDragEvent);
      break;
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
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('p-dragenter', this);
    this.node.addEventListener('p-dragleave', this);
    this.node.addEventListener('p-dragover', this);
    this.node.addEventListener('p-drop', this);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('p-dragenter', this);
    this.node.removeEventListener('p-dragleave', this);
    this.node.removeEventListener('p-dragover', this);
    this.node.removeEventListener('p-drop', this);
    this.node.removeEventListener('mousedown', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'child-added'` message.
   */
  protected onChildAdded(msg: Widget.ChildMessage): void {
    // Ignore the generated tab bars.
    if (Private.isGeneratedTabBarProperty.get(msg.child)) {
      return;
    }

    // Add the widget class to the child.
    msg.child.addClass('p-DockPanel-widget');
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    // Ignore the generated tab bars.
    if (Private.isGeneratedTabBarProperty.get(msg.child)) {
      return;
    }

    // Remove the widget class from the child.
    msg.child.removeClass('p-DockPanel-widget');

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Handle the `'p-dragenter'` event for the dock panel.
   */
  private _evtDragEnter(event: IDragEvent): void {
    // If the factory mime type is present, mark the event as
    // handled in order to get the rest of the drag events.
    if (event.mimeData.hasData('application/vnd.phosphor.widget-factory')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handle the `'p-dragleave'` event for the dock panel.
   */
  private _evtDragLeave(event: IDragEvent): void {
    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();

    // Get the node into which the drag is entering.
    let related = event.relatedTarget as HTMLElement;

    // Hide the overlay if the drag is leaving the dock panel.
    if (!related || !this.node.contains(related)) {
      this.overlay.hide(0);
    }
  }

  /**
   * Handle the `'p-dragover'` event for the dock panel.
   */
  private _evtDragOver(event: IDragEvent): void {
    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();

    // Show the drop indicator overlay and update the drop
    // action based on the drop target zone under the mouse.
    if (this._showOverlay(event.clientX, event.clientY) === 'invalid') {
      event.dropAction = 'none';
    } else {
      event.dropAction = event.proposedAction;
    }
  }

  /**
   * Handle the `'p-drop'` event for the dock panel.
   */
  private _evtDrop(event: IDragEvent): void {
    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();

    // Hide the drop indicator overlay.
    this.overlay.hide(0);

    // Bail if the proposed action is to do nothing.
    if (event.proposedAction === 'none') {
      event.dropAction = 'none';
      return;
    }

    // Find the drop target under the mouse.
    let { clientX, clientY } = event;
    let { zone, target } = Private.findDropTarget(
      this,
      clientX,
      clientY,
      this._edges
    );

    // Bail if the drop zone is invalid.
    if (zone === 'invalid') {
      event.dropAction = 'none';
      return;
    }

    // Bail if the factory mime type has invalid data.
    let mimeData = event.mimeData;
    let factory = mimeData.getData('application/vnd.phosphor.widget-factory');
    if (typeof factory !== 'function') {
      event.dropAction = 'none';
      return;
    }

    // Bail if the factory does not produce a widget.
    let widget = factory();
    if (!(widget instanceof Widget)) {
      event.dropAction = 'none';
      return;
    }

    // Bail if the widget is an ancestor of the dock panel.
    if (widget.contains(this)) {
      event.dropAction = 'none';
      return;
    }

    // Find the reference widget for the drop target.
    let ref = target ? Private.getDropRef(target.tabBar) : null;

    // Add the widget according to the indicated drop zone.
    switch(zone) {
    case 'root-all':
      this.addWidget(widget);
      break;
    case 'root-top':
      this.addWidget(widget, { mode: 'split-top' });
      break;
    case 'root-left':
      this.addWidget(widget, { mode: 'split-left' });
      break;
    case 'root-right':
      this.addWidget(widget, { mode: 'split-right' });
      break;
    case 'root-bottom':
      this.addWidget(widget, { mode: 'split-bottom' });
      break;
    case 'widget-all':
      this.addWidget(widget, { mode: 'tab-after', ref });
      break;
    case 'widget-top':
      this.addWidget(widget, { mode: 'split-top', ref });
      break;
    case 'widget-left':
      this.addWidget(widget, { mode: 'split-left', ref });
      break;
    case 'widget-right':
      this.addWidget(widget, { mode: 'split-right', ref });
      break;
    case 'widget-bottom':
      this.addWidget(widget, { mode: 'split-bottom', ref });
      break;
    case 'widget-tab':
      this.addWidget(widget, { mode: 'tab-after', ref });
      break;
    default:
      throw 'unreachable';
    }

    // Accept the proposed drop action.
    event.dropAction = event.proposedAction;

    // Activate the dropped widget.
    this.activateWidget(widget);
  }

  /**
   * Handle the `'keydown'` event for the dock panel.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) {
      // Finalize the mouse release.
      this._releaseMouse();

      // Schedule an emit of the layout modified signal.
      MessageLoop.postMessage(this, Private.LayoutModified);
    }
  }

  /**
   * Handle the `'mousedown'` event for the dock panel.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if the left mouse button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Find the handle which contains the mouse target, if any.
    let layout = this.layout as DockLayout;
    let target = event.target as HTMLElement;
    let handle = find(layout.handles(), handle => handle.contains(target));
    if (!handle) {
      return;
    }

    // Stop the event when a handle is pressed.
    event.preventDefault();
    event.stopPropagation();

    // Add the extra document listeners.
    document.addEventListener('keydown', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('contextmenu', this, true);

    // Compute the offset deltas for the handle press.
    let rect = handle.getBoundingClientRect();
    let deltaX = event.clientX - rect.left;
    let deltaY = event.clientY - rect.top;

    // Override the cursor and store the press data.
    let style = window.getComputedStyle(handle);
    let override = Drag.overrideCursor(style.cursor!);
    this._pressData = { handle, deltaX, deltaY, override };
  }

  /**
   * Handle the `'mousemove'` event for the dock panel.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Bail early if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Stop the event when dragging a handle.
    event.preventDefault();
    event.stopPropagation();

    // Compute the desired offset position for the handle.
    let rect = this.node.getBoundingClientRect();
    let xPos = event.clientX - rect.left - this._pressData.deltaX;
    let yPos = event.clientY - rect.top - this._pressData.deltaY;

    // Set the handle as close to the desired position as possible.
    let layout = this.layout as DockLayout;
    layout.moveHandle(this._pressData.handle, xPos, yPos);
  }

  /**
   * Handle the `'mouseup'` event for the dock panel.
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

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Release the mouse grab for the dock panel.
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
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Show the overlay indicator at the given client position.
   *
   * Returns the drop zone at the specified client position.
   *
   * #### Notes
   * If the position is not over a valid zone, the overlay is hidden.
   */
  private _showOverlay(clientX: number, clientY: number): Private.DropZone {
    // Find the dock target for the given client position.
    let { zone, target } = Private.findDropTarget(
      this,
      clientX,
      clientY,
      this._edges
    );

    // If the drop zone is invalid, hide the overlay and bail.
    if (zone === 'invalid') {
      this.overlay.hide(100);
      return zone;
    }

    // Setup the variables needed to compute the overlay geometry.
    let top: number;
    let left: number;
    let right: number;
    let bottom: number;
    let box = ElementExt.boxSizing(this.node); // TODO cache this?
    let rect = this.node.getBoundingClientRect();

    // Compute the overlay geometry based on the dock zone.
    switch (zone) {
    case 'root-all':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'root-top':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = box.paddingRight;
      bottom = rect.height * Private.GOLDEN_RATIO;
      break;
    case 'root-left':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = rect.width * Private.GOLDEN_RATIO;
      bottom = box.paddingBottom;
      break;
    case 'root-right':
      top = box.paddingTop;
      left = rect.width * Private.GOLDEN_RATIO;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'root-bottom':
      top = rect.height * Private.GOLDEN_RATIO;
      left = box.paddingLeft;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'widget-all':
      top = target!.top;
      left = target!.left;
      right = target!.right;
      bottom = target!.bottom;
      break;
    case 'widget-top':
      top = target!.top;
      left = target!.left;
      right = target!.right;
      bottom = target!.bottom + target!.height / 2;
      break;
    case 'widget-left':
      top = target!.top;
      left = target!.left;
      right = target!.right + target!.width / 2;
      bottom = target!.bottom;
      break;
    case 'widget-right':
      top = target!.top;
      left = target!.left + target!.width / 2;
      right = target!.right;
      bottom = target!.bottom;
      break;
    case 'widget-bottom':
      top = target!.top + target!.height / 2;
      left = target!.left;
      right = target!.right;
      bottom = target!.bottom;
      break;
    case 'widget-tab':
      const tabHeight = target!.tabBar.node.getBoundingClientRect().height;
      top = target!.top;
      left = target!.left;
      right = target!.right;
      bottom = target!.bottom + target!.height - tabHeight;
      break;
    default:
      throw 'unreachable';
    }

    // Show the overlay with the computed geometry.
    this.overlay.show({ top, left, right, bottom });

    // Finally, return the computed drop zone.
    return zone;
  }

  /**
   * Create a new tab bar for use by the panel.
   */
  private _createTabBar(): TabBar<Widget> {
    // Create the tab bar.
    let tabBar = this._renderer.createTabBar();

    // Set the generated tab bar property for the tab bar.
    Private.isGeneratedTabBarProperty.set(tabBar, true);

    // Hide the tab bar when in single document mode.
    if (this._mode === 'single-document') {
      tabBar.hide();
    }

    // Enforce necessary tab bar behavior.
    // TODO do we really want to enforce *all* of these?
    tabBar.tabsMovable = true;
    tabBar.allowDeselect = false;
    tabBar.removeBehavior = 'select-previous-tab';
    tabBar.insertBehavior = 'select-tab-if-needed';

    // Connect the signal handlers for the tab bar.
    tabBar.tabMoved.connect(this._onTabMoved, this);
    tabBar.currentChanged.connect(this._onCurrentChanged, this);
    tabBar.tabCloseRequested.connect(this._onTabCloseRequested, this);
    tabBar.tabDetachRequested.connect(this._onTabDetachRequested, this);
    tabBar.tabActivateRequested.connect(this._onTabActivateRequested, this);

    // Return the initialized tab bar.
    return tabBar;
  }

  /**
   * Create a new handle for use by the panel.
   */
  private _createHandle(): HTMLDivElement {
    return this._renderer.createHandle();
  }

  /**
   * Handle the `tabMoved` signal from a tab bar.
   */
  private _onTabMoved(): void {
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Handle the `currentChanged` signal from a tab bar.
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

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, Private.LayoutModified);
  }

  /**
   * Handle the `tabActivateRequested` signal from a tab bar.
   */
  private _onTabActivateRequested(sender: TabBar<Widget>, args: TabBar.ITabActivateRequestedArgs<Widget>): void {
    args.title.owner.activate();
  }

  /**
   * Handle the `tabCloseRequested` signal from a tab bar.
   */
  private _onTabCloseRequested(sender: TabBar<Widget>, args: TabBar.ITabCloseRequestedArgs<Widget>): void {
    args.title.owner.close();
  }

  /**
   * Handle the `tabDetachRequested` signal from a tab bar.
   */
  private _onTabDetachRequested(sender: TabBar<Widget>, args: TabBar.ITabDetachRequestedArgs<Widget>): void {
    // Do nothing if a drag is already in progress.
    if (this._drag) {
      return;
    }

    // Release the tab bar's hold on the mouse.
    sender.releaseMouse();

    // Extract the data from the args.
    let { title, tab, clientX, clientY } = args;

    // Setup the mime data for the drag operation.
    let mimeData = new MimeData();
    let factory = () => title.owner;
    mimeData.setData('application/vnd.phosphor.widget-factory', factory);

    // Create the drag image for the drag operation.
    let dragImage = tab.cloneNode(true) as HTMLElement;

    // Create the drag object to manage the drag-drop operation.
    this._drag = new Drag({
      mimeData, dragImage,
      proposedAction: 'move',
      supportedActions: 'move',
    });

    // Hide the tab node in the original tab.
    tab.classList.add('p-mod-hidden');

    // Create the cleanup callback.
    let cleanup = (() => {
      this._drag = null;
      tab.classList.remove('p-mod-hidden');
    });

    // Start the drag operation and cleanup when done.
    this._drag.start(clientX, clientY).then(cleanup);
  }

  private _edges: DockPanel.IEdges;
  private _mode: DockPanel.Mode;
  private _drag: Drag | null = null;
  private _renderer: DockPanel.IRenderer;
  private _pressData: Private.IPressData | null = null;
  private _layoutModified = new Signal<this, void>(this);
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
     * The overlay to use with the dock panel.
     *
     * The default is a new `Overlay` instance.
     */
    overlay?: IOverlay;

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

    /**
     * The mode for the dock panel.
     *
     * The deafult is `'multiple-document'`.
     */
    mode?: DockPanel.Mode;

    /**
     * The sizes of the edge drop zones, in pixels.
     * If not given, default values will be used.
     */
    edges?: IEdges;
  }

  /**
   * The sizes of the edge drop zones, in pixels.
   */
  export interface IEdges {
    /**
     * The size of the top edge drop zone.
     */
    top: number;

    /**
     * The size of the right edge drop zone.
     */
    right: number;

    /**
     * The size of the bottom edge drop zone.
     */
    bottom: number;

    /**
     * The size of the left edge drop zone.
     */
    left: number;
  };

  /**
   * A type alias for the supported dock panel modes.
   */
  export
  type Mode = (
    /**
     * The single document mode.
     *
     * In this mode, only a single widget is visible at a time, and that
     * widget fills the available layout space. No tab bars are visible.
     */
    'single-document' |

    /**
     * The multiple document mode.
     *
     * In this mode, multiple documents are displayed in separate tab
     * areas, and those areas can be individually resized by the user.
     */
    'multiple-document'
  );

  /**
   * A type alias for a layout configuration object.
   */
  export
  type ILayoutConfig = DockLayout.ILayoutConfig;

  /**
   * A type alias for the supported insertion modes.
   */
  export
  type InsertMode = DockLayout.InsertMode;

  /**
   * A type alias for the add widget options.
   */
  export
  type IAddOptions = DockLayout.IAddOptions;

  /**
   * An object which holds the geometry for overlay positioning.
   */
  export
  interface IOverlayGeometry {
    /**
     * The distance between the overlay and parent top edges.
     */
    top: number;

    /**
     * The distance between the overlay and parent left edges.
     */
    left: number;

    /**
     * The distance between the overlay and parent right edges.
     */
    right: number;

    /**
     * The distance between the overlay and parent bottom edges.
     */
    bottom: number;
  }

  /**
   * An object which manages the overlay node for a dock panel.
   */
  export
  interface IOverlay {
    /**
     * The DOM node for the overlay.
     */
    readonly node: HTMLDivElement;

    /**
     * Show the overlay using the given overlay geometry.
     *
     * @param geo - The desired geometry for the overlay.
     *
     * #### Notes
     * The given geometry values assume the node will use absolute
     * positioning.
     *
     * This is called on every mouse move event during a drag in order
     * to update the position of the overlay. It should be efficient.
     */
    show(geo: IOverlayGeometry): void;

    /**
     * Hide the overlay node.
     *
     * @param delay - The delay (in ms) before hiding the overlay.
     *   A delay value <= 0 should hide the overlay immediately.
     *
     * #### Notes
     * This is called whenever the overlay node should been hidden.
     */
    hide(delay: number): void;
  }

  /**
   * A concrete implementation of `IOverlay`.
   *
   * This is the default overlay implementation for a dock panel.
   */
  export
  class Overlay implements IOverlay {
    /**
     * Construct a new overlay.
     */
    constructor() {
      this.node = document.createElement('div');
      this.node.classList.add('p-DockPanel-overlay');
      this.node.classList.add('p-mod-hidden');
      this.node.style.position = 'absolute';
    }

    /**
     * The DOM node for the overlay.
     */
    readonly node: HTMLDivElement;

    /**
     * Show the overlay using the given overlay geometry.
     *
     * @param geo - The desired geometry for the overlay.
     */
    show(geo: IOverlayGeometry): void {
      // Update the position of the overlay.
      let style = this.node.style;
      style.top = `${geo.top}px`;
      style.left = `${geo.left}px`;
      style.right = `${geo.right}px`;
      style.bottom = `${geo.bottom}px`;

      // Clear any pending hide timer.
      clearTimeout(this._timer);
      this._timer = -1;

      // If the overlay is already visible, we're done.
      if (!this._hidden) {
        return;
      }

      // Clear the hidden flag.
      this._hidden = false;

      // Finally, show the overlay.
      this.node.classList.remove('p-mod-hidden');
    }

    /**
     * Hide the overlay node.
     *
     * @param delay - The delay (in ms) before hiding the overlay.
     *   A delay value <= 0 will hide the overlay immediately.
     */
    hide(delay: number): void {
      // Do nothing if the overlay is already hidden.
      if (this._hidden) {
        return;
      }

      // Hide immediately if the delay is <= 0.
      if (delay <= 0) {
        clearTimeout(this._timer);
        this._timer = -1;
        this._hidden = true;
        this.node.classList.add('p-mod-hidden');
        return;
      }

      // Do nothing if a hide is already pending.
      if (this._timer !== -1) {
        return;
      }

      // Otherwise setup the hide timer.
      this._timer = window.setTimeout(() => {
        this._timer = -1;
        this._hidden = true;
        this.node.classList.add('p-mod-hidden');
      }, delay);
    }

    private _timer = -1;
    private _hidden = true;
  }

  /**
   * A type alias for a dock panel renderer;
   */
  export
  type IRenderer = DockLayout.IRenderer;

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
    createTabBar(): TabBar<Widget> {
      let bar = new TabBar<Widget>({name: `Activities ${this._tabBarCounter++}`});
      bar.addClass('p-DockPanel-tabBar');
      return bar;
    }

    /**
     * Create a new handle node for use with a dock panel.
     *
     * @returns A new handle node for a dock panel.
     */
    createHandle(): HTMLDivElement {
      let handle = document.createElement('div');
      handle.className = 'p-DockPanel-handle';
      return handle;
    }
    private _tabBarCounter = 0;
  }

  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();
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
   * The default sizes for the edge drop zones, in pixels.
   */
  export const DEFAULT_EDGES = {
    /**
     * The size of the top edge dock zone for the root panel, in pixels.
     * This is different from the others to distinguish between the top
     * tab bar and the top root zone.
     */
    top: 12,

    /**
     * The size of the edge dock zone for the root panel, in pixels.
     */
    right: 40,

    /**
     * The size of the edge dock zone for the root panel, in pixels.
     */
    bottom: 40,

    /**
     * The size of the edge dock zone for the root panel, in pixels.
     */
    left: 40
  };

  /**
   * A singleton `'layout-modified'` conflatable message.
   */
  export
  const LayoutModified = new ConflatableMessage('layout-modified');

  /**
   * An object which holds mouse press data.
   */
  export
  interface IPressData {
    /**
     * The handle which was pressed.
     */
    handle: HTMLDivElement;

    /**
     * The X offset of the press in handle coordinates.
     */
    deltaX: number;

    /**
     * The Y offset of the press in handle coordinates.
     */
    deltaY: number;

    /**
     * The disposable which will clear the override cursor.
     */
    override: IDisposable;
  }

  /**
   * A type alias for a drop zone.
   */
  export
  type DropZone = (
    /**
     * An invalid drop zone.
     */
    'invalid' |

    /**
     * The entirety of the root dock area.
     */
    'root-all' |

    /**
     * The top portion of the root dock area.
     */
    'root-top' |

    /**
     * The left portion of the root dock area.
     */
    'root-left' |

    /**
     * The right portion of the root dock area.
     */
    'root-right' |

    /**
     * The bottom portion of the root dock area.
     */
    'root-bottom' |

    /**
     * The entirety of a tabbed widget area.
     */
    'widget-all' |

    /**
     * The top portion of tabbed widget area.
     */
    'widget-top' |

    /**
     * The left portion of tabbed widget area.
     */
    'widget-left' |

    /**
     * The right portion of tabbed widget area.
     */
    'widget-right' |

    /**
     * The bottom portion of tabbed widget area.
     */
    'widget-bottom' |

    /**
     * The the bar of a tabbed widget area.
     */
    'widget-tab'
  );

  /**
   * An object which holds the drop target zone and widget.
   */
  export
  interface IDropTarget {
    /**
     * The semantic zone for the mouse position.
     */
    zone: DropZone;

    /**
     * The tab area geometry for the drop zone, or `null`.
     */
    target: DockLayout.ITabAreaGeometry | null;
  }

  /**
   * An attached property used to track generated tab bars.
   */
  export
  const isGeneratedTabBarProperty = new AttachedProperty<Widget, boolean>({
    name: 'isGeneratedTabBar',
    create: () => false
  });

  /**
   * Create a single document config for the widgets in a dock panel.
   */
  export
  function createSingleDocumentConfig(panel: DockPanel): DockPanel.ILayoutConfig {
    // Return an empty config if the panel is empty.
    if (panel.isEmpty) {
      return { main: null };
    }

    // Get a flat array of the widgets in the panel.
    let widgets = toArray(panel.widgets());

    // Get the first selected widget in the panel.
    let selected = panel.selectedWidgets().next();

    // Compute the current index for the new config.
    let currentIndex = selected ? widgets.indexOf(selected) : -1;

    // Return the single document config.
    return { main: { type: 'tab-area', widgets, currentIndex } };
  }

  /**
   * Find the drop target at the given client position.
   */
  export
  function findDropTarget(
    panel: DockPanel,
    clientX: number,
    clientY: number,
    edges: DockPanel.IEdges
  ): IDropTarget {
    // Bail if the mouse is not over the dock panel.
    if (!ElementExt.hitTest(panel.node, clientX, clientY)) {
      return { zone: 'invalid', target: null };
    }

    // Look up the layout for the panel.
    let layout = panel.layout as DockLayout;

    // If the layout is empty, indicate the entire root drop zone.
    if (layout.isEmpty) {
      return { zone: 'root-all', target: null };
    }

    // Test the edge zones when in multiple document mode.
    if (panel.mode === 'multiple-document') {
      // Get the client rect for the dock panel.
      let panelRect = panel.node.getBoundingClientRect();

      // Compute the distance to each edge of the panel.
      let pl = clientX - panelRect.left + 1;
      let pt = clientY - panelRect.top + 1;
      let pr = panelRect.right - clientX;
      let pb = panelRect.bottom - clientY;

      // Find the minimum distance to an edge.
      let pd = Math.min(pt, pr, pb, pl);

      // Return a root zone if the mouse is within an edge.
      switch (pd) {
        case pt:
          if (pt < edges.top) {
            return { zone: 'root-top', target: null };
          }
          break;
        case pr:
          if (pr < edges.right) {
            return { zone: 'root-right', target: null };
          }
          break;
        case pb:
          if (pb < edges.bottom) {
            return { zone: 'root-bottom', target: null };
          }
          break;
        case pl:
          if (pl < edges.left) {
            return { zone: 'root-left', target: null };
          }
          break;
        default:
          throw 'unreachable';
      }
    }

    // Hit test the dock layout at the given client position.
    let target = layout.hitTestTabAreas(clientX, clientY);

    // Bail if no target area was found.
    if (!target) {
      return { zone: 'invalid', target: null };
    }

    // Return the whole tab area when in single document mode.
    if (panel.mode === 'single-document') {
      return { zone: 'widget-all', target };
    }

    // Compute the distance to each edge of the tab area.
    let al = target.x - target.left + 1;
    let at = target.y - target.top + 1;
    let ar = target.left + target.width - target.x;
    let ab = target.top + target.height - target.y;

    const tabHeight = target.tabBar.node.getBoundingClientRect().height;
    if (at < tabHeight) {
      return { zone: 'widget-tab', target };
    }

    // Get the X and Y edge sizes for the area.
    let rx = Math.round(target.width / 3);
    let ry = Math.round(target.height / 3);

    // If the mouse is not within an edge, indicate the entire area.
    if (al > rx && ar > rx && at > ry && ab > ry) {
      return { zone: 'widget-all', target };
    }

    // Scale the distances by the slenderness ratio.
    al /= rx;
    at /= ry;
    ar /= rx;
    ab /= ry;

    // Find the minimum distance to the area edge.
    let ad = Math.min(al, at, ar, ab);

    // Find the widget zone for the area edge.
    let zone: DropZone;
    switch (ad) {
    case al:
      zone = 'widget-left';
      break;
    case at:
      zone = 'widget-top';
      break;
    case ar:
      zone = 'widget-right';
      break;
    case ab:
      zone = 'widget-bottom';
      break;
    default:
      throw 'unreachable';
    }

    // Return the final drop target.
    return { zone, target };
  }

  /**
   * Get the drop reference widget for a tab bar.
   */
  export
  function getDropRef(tabBar: TabBar<Widget>): Widget | null {
    if (tabBar.titles.length === 0) {
      return null;
    }
    if (tabBar.currentTitle) {
      return tabBar.currentTitle.owner;
    }
    return tabBar.titles[tabBar.titles.length - 1].owner;
  }
}
