/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, find
} from '@phosphor/algorithm';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  Drag, IDragEvent
} from '@phosphor/dragdrop';

import {
  Message
} from '@phosphor/messaging';

import {
  MimeData
} from '@phosphor/mime';

import {
  DockLayout
} from './docklayout';

import {
  DOMUtil
} from './domutil';

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
    this.addClass(Constants.DOCK_PANEL_CLASS);

    // Extract the inter-panel spacing.
    let spacing = options.spacing !== undefined ? options.spacing : 4;

    // Extract the content renderer for the panel.
    this._renderer = options.renderer || DockPanel.defaultRenderer;

    // Create the delegate renderer for the layout.
    let renderer: DockPanel.IRenderer = {
      createTabBar: () => this._createTabBar(),
      createHandle: () => this._createHandle()
    };

    // Setup the dock layout for the panel.
    this.layout = new DockLayout({ renderer, spacing });

    // Setup the overlay drop indicator.
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
   * post the widget an `activate-request` message.
   */
  activateWidget(widget: Widget): void {
    // Find the tab bar which contains the widget.
    let title = widget.title;
    let tabBar = find(this.tabBars(), bar => bar.titles.indexOf(title) !== -1);

    // Throw an error if no tab bar is found.
    if (!tabBar) {
      throw new Error('Widget is not contained in the dock panel.');
    }

    // Update the current title and activate the widget.
    tabBar.currentTitle = title;
    widget.activate();
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
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.node.addEventListener('p-dragenter', this);
    this.node.addEventListener('p-dragleave', this);
    this.node.addEventListener('p-dragover', this);
    this.node.addEventListener('p-drop', this);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
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
    if (msg.child.hasClass(Constants.TAB_BAR_CLASS)) { // FIXME
      return;
    }

    // Add the widget class to the child.
    msg.child.addClass(Constants.WIDGET_CLASS);
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    // Ignore the generated tab bars.
    if (msg.child.hasClass(Constants.TAB_BAR_CLASS)) { // FIXME
      return;
    }

    // Remove the widget class from the child.
    msg.child.removeClass(Constants.WIDGET_CLASS);
  }

  /**
   * Handle the `'p-dragenter'` event for the dock panel.
   */
  private _evtDragEnter(event: IDragEvent): void {
    // If the factory mime type is present, mark the event as
    // handled in order to get the rest of the drag events.
    if (event.mimeData.hasData(Constants.FACTORY_MIME)) {
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
    let { clientX, clientY, shiftKey } = event;
    if (this._showOverlay(clientX, clientY, shiftKey) === 'invalid') {
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
    let { clientX, clientY, shiftKey } = event;
    let { zone, target } = this._findDropTarget(clientX, clientY, shiftKey);

    // Bail if the drop zone is invalid.
    if (zone === 'invalid') {
      event.dropAction = 'none';
      return;
    }

    // Bail if the factory mime type has invalid data.
    let factory = event.mimeData.getData(Constants.FACTORY_MIME);
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

    // Handle the drop using the generated widget.
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
      this.addWidget(widget, { mode: 'split-top', ref: target });
      break;
    case 'widget-left':
      this.addWidget(widget, { mode: 'split-left', ref: target });
      break;
    case 'widget-right':
      this.addWidget(widget, { mode: 'split-right', ref: target });
      break;
    case 'widget-bottom':
      this.addWidget(widget, { mode: 'split-bottom', ref: target });
      break;
    case 'tab-bar':
      let ref = Private.tabBarRef(target as TabBar<Widget>);
      this.addWidget(widget, { mode: 'tab-after', ref });
      break;
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
      this._releaseMouse();
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
   * Find the drop target for the given client position.
   *
   * @param clientX - The client X position of interest.
   *
   * @param clientY - The client Y position of interest.
   *
   * @param shift - Whether to search for shifted drop targets.
   *
   * @returns The dock target at the specified client position.
   */
  private _findDropTarget(clientX: number, clientY: number, shift: boolean): Private.IDropTarget {
    // Bail, if the mouse is not over the dock panel.
    if (!DOMUtil.hitTest(this.node, clientX, clientY)) {
      return { zone: 'invalid', target: null };
    }

    // Lookup the layout for the panel.
    let layout = this.layout as DockLayout;

    // If the layout is empty, indicate a root drop zone.
    if (layout.isEmpty) {
      return { zone: 'root', target: null };
    }

    // Handle the shifted drop zones.
    if (shift) {
      let edge = Private.calcEdge(this.node, clientX, clientY);
      return { zone: `root-${edge}` as Private.DropZone, target: null };
    }

    // Find the widget at the given client position.
    let widget = find(layout, w => {
      return w.isVisible && DOMUtil.hitTest(w.node, clientX, clientY);
    });

    // Bail if no widget is found.
    if (!widget) {
      return { zone: 'invalid', target: null };
    }

    // Handle the drop zone for a generated tab bar.
    if (widget.hasClass(Constants.TAB_BAR_CLASS)) { // FIXME
      return { zone: 'tab-bar', target: widget };
    }

    // Handle the drop zone for a user widget.
    let edge = Private.calcEdge(widget.node, clientX, clientY);
    return { zone: `widget-${edge}` as Private.DropZone, target: widget };
  }

  /**
   * Show the overlay indicator at the given client position.
   *
   * @param clientX - The client X position of interest.
   *
   * @param clientY - The client Y position of interest.
   *
   * @param shift - Whether to show the shifted drop targets.
   *
   * @returns The drop zone at the specified client position.
   *
   * #### Notes
   * If the position is not over a valid zone, the overlay is hidden.
   */
  private _showOverlay(clientX: number, clientY: number, shift: boolean): Private.DropZone {
    // Find the dock target for the given client position.
    let { zone, target } = this._findDropTarget(clientX, clientY, shift);

    // If the drop zone is invalid, hide the overlay and bail.
    if (zone === 'invalid' || !target) {
      this.overlay.hide(100);
      return zone;
    }

    // Setup the variables needed to compute the overlay geometry.
    let top: number;
    let left: number;
    let right: number;
    let bottom: number;
    let tr: ClientRect;
    let box = DOMUtil.boxSizing(this.node); // TODO cache this?
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
      bottom = rect.height * Constants.GOLDEN_RATIO;
      break;
    case 'root-left':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = rect.width * Constants.GOLDEN_RATIO;
      bottom = box.paddingBottom;
      break;
    case 'root-right':
      top = box.paddingTop;
      left = rect.width * Constants.GOLDEN_RATIO;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'root-bottom':
      top = rect.height * Constants.GOLDEN_RATIO;
      left = box.paddingLeft;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'tab-bar':
      tr = target.node.getBoundingClientRect();
      top = tr.top - rect.top - box.borderTop;
      left = tr.left - rect.left - box.borderLeft;
      right = rect.right - tr.right - box.borderRight;
      bottom = rect.bottom - tr.bottom - box.borderBottom;
      break;
    case 'widget-top':
      tr = target.node.getBoundingClientRect();
      top = tr.top - rect.top - box.borderTop;
      left = tr.left - rect.left - box.borderLeft;
      right = rect.right - tr.right - box.borderRight;
      bottom = rect.bottom - tr.bottom + tr.height / 2 - box.borderBottom;
      break;
    case 'widget-left':
      tr = target.node.getBoundingClientRect();
      top = tr.top - rect.top - box.borderTop;
      left = tr.left - rect.left - box.borderLeft;
      right = rect.right - tr.right + tr.width / 2 - box.borderRight;
      bottom = rect.bottom - tr.bottom - box.borderBottom;
      break;
    case 'widget-right':
      tr = target.node.getBoundingClientRect();
      top = tr.top - rect.top - box.borderTop;
      left = tr.left - rect.left + tr.width / 2 - box.borderLeft;
      right = rect.right - tr.right - box.borderRight;
      bottom = rect.bottom - tr.bottom - box.borderBottom;
      break;
    case 'widget-bottom':
      tr = target.node.getBoundingClientRect();
      top = tr.top - rect.top + tr.height / 2 - box.borderTop;
      left = tr.left - rect.left - box.borderLeft;
      right = rect.right - tr.right - box.borderRight;
      bottom = rect.bottom - tr.bottom - box.borderBottom;
      break;
    default:
      throw 'unreachable';
    }

    // Derive the width and height from the other dimensions.
    let width = rect.width - right - left - box.borderLeft - box.borderRight;
    let height = rect.height - bottom - top - box.borderTop - box.borderBottom;

    // Show the overlay with the computed geometry.
    this.overlay.show({
      mouseX: clientX,
      mouseY: clientY,
      parentRect: rect,
      top, left, right, bottom, width, height
    });

    // Finally, return the computed drop zone.
    return zone;
  }

  /**
   * Create a new tab bar for use by the panel.
   */
  private _createTabBar(): TabBar<Widget> {
    // Create and initialize the tab bar.
    let tabBar = this._renderer.createTabBar();
    //tabBar.addClass(TAB_BAR_CLASS); FIXME

    // Setup the signal handlers for the tab bar.
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
    let handle = this._renderer.createHandle();
    //handle.classList.add(HANDLE_CLASS); FIXME
    return handle;
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
    let widget = title.owner;
    let mimeData = new MimeData();
    mimeData.setData(Constants.FACTORY_MIME, () => widget);

    // Create the drag image for the drag operation.
    let dragImage = tab.cloneNode(true) as HTMLElement;

    // Create the drag object to manage the drag-drop operation.
    this._drag = new Drag({
      mimeData, dragImage,
      proposedAction: 'move',
      supportedActions: 'move',
    });

    // Hide the tab node in the original tab.
    tab.classList.add(Constants.HIDDEN_CLASS);

    // Create the cleanup callback.
    let cleanup = (() => {
      this._drag = null;
      tab.classList.remove(Constants.HIDDEN_CLASS);
    });

    // Start the drag operation and cleanup when done.
    this._drag.start(clientX, clientY).then(cleanup);
  }

  private _drag: Drag | null = null;
  private _renderer: DockPanel.IRenderer;
  private _pressData: Private.IPressData | null = null;
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
     * The client X position of the mouse.
     */
    mouseX: number;

    /**
     * The client Y position of the mouse.
     */
    mouseY: number;

    /**
     * The client rect of the overlay parent node.
     */
    parentRect: ClientRect;

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

    /**
     * The width of the overlay.
     */
    width: number;

    /**
     * The height of the overlay.
     */
    height: number;
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
      this.node.classList.add(Constants.OVERLAY_CLASS);
      this.node.classList.add(Constants.HIDDEN_CLASS);
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
      this.node.classList.remove(Constants.HIDDEN_CLASS);
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
        this.node.classList.add(Constants.HIDDEN_CLASS);
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
        this.node.classList.add(Constants.HIDDEN_CLASS);
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
      bar.addClass(Constants.TAB_BAR_CLASS);
      return bar;
    }

    /**
     * Create a new handle node for use with a dock panel.
     *
     * @returns A new handle node for a dock panel.
     */
    createHandle(): HTMLDivElement {
      let handle = document.createElement('div');
      handle.classList.add(Constants.HANDLE_CLASS);
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
 * The namespace for the module constants.
 */
namespace Constants {
  /**
   * The class name added to a DockPanel instance.
   */
  export
  const DOCK_PANEL_CLASS = 'p-DockPanel';

  /**
   * The class name added to DockPanel widgets.
   */
  export
  const WIDGET_CLASS = 'p-DockPanel-widget';

  /**
   * The class name added to a DockPanel overlay.
   */
  export
  const OVERLAY_CLASS = 'p-DockPanel-overlay';

  /**
   * The class name added to a DockPanel handle.
   */
  export
  const HANDLE_CLASS = 'p-DockPanel-handle';

  /**
   * The class name added to a DockPanel tab bar.
   */
  export
  const TAB_BAR_CLASS = 'p-DockPanel-tabBar';

  /**
   * The class name added to hidden entities.
   */
  export
  const HIDDEN_CLASS = 'p-mod-hidden';

  /**
   * The factory MIME type supported by the dock panel.
   */
  export
  const FACTORY_MIME = 'application/vnd.phosphor.widget-factory';

  /**
   * A fraction used for sizing root panels; ~= `1 / golden_ratio`.
   */
  export
  const GOLDEN_RATIO = 0.618;
}


/**
 * The namespace for the module private details.
 */
namespace Private {
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
     * The area of a generated tab bar.
     */
    'tab-bar' |

    /**
     * The top half of a user widget.
     */
    'widget-top' |

    /**
     * The left half of a user widget.
     */
    'widget-left' |

    /**
     * The right half of a user widget.
     */
    'widget-right' |

    /**
     * The bottom half of a user widget.
     */
    'widget-bottom'
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
     * The target widget related to the drop zone, or `null`.
     */
    target: Widget | null;
  }

  /**
   * Get the reference widget for a tab bar.
   *
   * @param tabBar - The tab bar of interest.
   *
   * @returns The target reference widget in the tab bar, or `null`.
   */
  export
  function tabBarRef(tabBar: TabBar<Widget>): Widget | null {
    if (tabBar.currentTitle) {
      return tabBar.currentTitle.owner;
    }
    let lastTitle = tabBar.titles[tabBar.titles.length - 1];
    return lastTitle ? lastTitle.owner : null;
  }

  /**
   * Determine the zone for the given node and client position.
   *
   * This assumes the position lies within the node's client rect.
   */
  export
  function calcEdge(node: HTMLElement, x: number, y: number): 'top' | 'left' | 'right' | 'bottom' {
    let rect = node.getBoundingClientRect();
    let fracX = (x - rect.left) / rect.width;
    let fracY = (y - rect.top) / rect.height;
    let normX = fracX > 0.5 ? 1 - fracX : fracX;
    let normY = fracY > 0.5 ? 1 - fracY : fracY;
    let result: 'top' | 'left' | 'right' | 'bottom';
    if (normX < normY) {
      result = fracX <= 0.5 ? 'left' : 'right';
    } else {
      result = fracY <= 0.5 ? 'top' : 'bottom';
    }
    return result;
  }
}
