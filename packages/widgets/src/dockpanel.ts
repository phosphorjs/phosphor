/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, find
} from '@phosphor/algorithm';

import {
  MimeData
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ElementExt
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

    // Extract the renderer for the panel.
    this._renderer = options.renderer || DockPanel.defaultRenderer;

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
   * The overlay used by the dock panel.
   */
  readonly overlay: DockPanel.IOverlay;

  /**
   * A signal emitted when the layout configuration is modified.
   *
   * #### Notes
   * This signal is emitted for the following conditions:
   * - A widget is added, moved, or removed
   * - The current tab of a tab bar is changed
   * - A tab is moved in the tab bar
   * - A split handle is moved by the user
   *
   * This signal is emitted asynchronously in a collapsed fashion, so
   * that multiple synchronous modifications results in only a single
   * emit of the signal.
   */
  get layoutModified(): ISignal<this, void> {
    return this._layoutModified;
  }

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
   * Activate the specified widget in the dock panel.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will make the widget the current widget in its tab area and
   * post an `activate-request` message to the widget.
   */
  activateWidget(widget: Widget): void {
    // Find the tab bar which contains the widget.
    let tabBar = find(this.tabBars(), bar => {
      return bar.titles.indexOf(widget.title) !== -1;
    });

    // Throw an error if no tab bar is found.
    if (!tabBar) {
      throw new Error('Widget is not contained in the dock panel.');
    }

    // Update the current title and activate the widget.
    tabBar.currentTitle = widget.title;
    widget.activate();
  }

  /**
   * Save the current layout configuration of the dock panel.
   *
   * @param options - The options specifying the version of the layout
   *   config object to generate.
   *
   * @returns A new layout config object of the specified version.
   *
   * #### Notes
   * The version number enables future expansion of the layout config
   * in a backwards compatible fashion.
   *
   * The return value can be provided to the `restoreLayout` method
   * in order to restore the layout to its current configuration.
   */
  saveLayout<T extends keyof DockPanel.LayoutConfigVersionMap>(options: { version: T }): DockPanel.LayoutConfigVersionMap[T] {
    return (this.layout as DockLayout).saveLayout(options);
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
  restoreLayout(config: DockPanel.LayoutConfig): void {
    (this.layout as DockLayout).restoreLayout(config);
  }

  /**
   * Add a widget to the dock panel.
   *
   * @param widget - The widget to add to the dock panel.
   *
   * @param options - The additional options for adding the widget.
   */
  addWidget(widget: Widget, options: DockPanel.IAddOptions = {}): void {
    // Add the widget to the layout.
    (this.layout as DockLayout).addWidget(widget, options);

    // Schedule an emit of the layout modified signal.
    MessageLoop.postMessage(this, new ConflatableMessage('layout-modified'));
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
    MessageLoop.postMessage(this, new ConflatableMessage('layout-modified'));
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
    // Always mark the event as handled.
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
    // Always mark the event as handled.
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
    // Always mark the event as handled.
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
    let { zone, target } = Private.findDropTarget(this, clientX, clientY);

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
    case 'root':
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
    case 'widget-center':
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
      MessageLoop.postMessage(this, new ConflatableMessage('layout-modified'));
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
    MessageLoop.postMessage(this, new ConflatableMessage('layout-modified'));
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
    let { zone, target } = Private.findDropTarget(this, clientX, clientY);

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
    case 'root':
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
    case 'widget-center':
      top = target!.top;
      left = target!.left;
      right = target!.right;
      bottom = target!.bottom;
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

    // Connect the signal handlers for the tab bar.
    tabBar.tabMoved.connect(this._onGenericLayoutChange, this);
    tabBar.currentChanged.connect(this._onGenericLayoutChange, this);
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
   * Handle a signal which indicates the dock layout is modified.
   */
  private _onGenericLayoutChange(): void {
    MessageLoop.postMessage(this, new ConflatableMessage('layout-modified'));
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
  }

  /**
   * A type alias for a layout configuration object.
   */
  export
  type LayoutConfig = DockLayout.LayoutConfig;

  /**
   * A type alias for the layout config version map.
   */
  export
  type LayoutConfigVersionMap = DockLayout.LayoutConfigVersionMap;

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
      this._timer = setTimeout(() => {
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
      let bar = new TabBar<Widget>();
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
   * The size of the edge dock zone for the root panel, in pixels.
   */
  export
  const EDGE_SIZE = 40;

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
     * The drop zone for an empty root.
     */
    'root' |

    /**
     * The top half of the root dock area.
     */
    'root-top' |

    /**
     * The left half of the root dock area.
     */
    'root-left' |

    /**
     * The right half of the root dock area.
     */
    'root-right' |

    /**
     * The bottom half of the root dock area.
     */
    'root-bottom' |

    /**
     * The top third of tabbed widget area.
     */
    'widget-top' |

    /**
     * The left third of tabbed widget area.
     */
    'widget-left' |

    /**
     * The right third of tabbed widget area.
     */
    'widget-right' |

    /**
     * The bottom third of tabbed widget area.
     */
    'widget-bottom' |

    /**
     * The center third of tabbed widget area.
     */
    'widget-center'
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
   * Find the drop target at the given client position.
   */
  export
  function findDropTarget(panel: DockPanel, clientX: number, clientY: number): IDropTarget {
    // Bail, if the mouse is not over the dock panel.
    if (!ElementExt.hitTest(panel.node, clientX, clientY)) {
      return { zone: 'invalid', target: null };
    }

    // Look up the layout for the panel.
    let layout = panel.layout as DockLayout;

    // If the layout is empty, indicate a root drop zone.
    if (layout.isEmpty) {
      return { zone: 'root', target: null };
    }

    // Get the rect for the dock panel.
    let panelRect = panel.node.getBoundingClientRect();

    // Compute the distance to each edge of the panel.
    let pl = clientX - panelRect.left + 1;
    let pt = clientY - panelRect.top + 1;
    let pr = panelRect.right - clientX;
    let pb = panelRect.bottom - clientY;

    // Find the minimum distance to an edge.
    let pd = Math.min(pl, pt, pr, pb);

    // If the mouse is within an edge zone, find the root zone.
    if (pd <= EDGE_SIZE) {
      let zone: DropZone;
      switch (pd) {
      case pl:
        zone = 'root-left';
        break;
      case pt:
        zone = 'root-top';
        break;
      case pr:
        zone = 'root-right';
        break;
      case pb:
        zone = 'root-bottom';
        break;
      default:
        throw 'unreachable';
      }
      return { zone, target: null };
    }

    // Hit test the dock layout at the given client position.
    let target = layout.hitTestTabAreas(clientX, clientY);

    // Bail if no target was found.
    if (!target) {
      return { zone: 'invalid', target: null };
    }

    // Compute the distance to each edge of the tab area.
    let al = target.x - target.left + 1;
    let at = target.y - target.top + 1;
    let ar = target.left + target.width - target.x;
    let ab = target.top + target.height - target.y;

    // Get the X and Y edge sizes for the area.
    let rx = Math.round(target.width / 3);
    let ry = Math.round(target.height / 3);

    // If the mouse is not within an edge, return the center zone.
    if (al > rx && ar > rx && at > ry && ab > ry) {
      return { zone: 'widget-center', target };
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
