/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ChainIterator, IIterator, chain, each, empty, map, once, reduce
} from '../algorithm/iteration';

import {
  contains, find, indexOf
} from '../algorithm/searching';

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
  ISignal, defineSignal
} from '../core/signaling';

import {
  MimeData
} from '../core/mimedata';

import {
  overrideCursor
} from '../dom/cursor';

import {
  Drag, IDragEvent
} from '../dom/dragdrop';

import {
  IS_EDGE, IS_IE
} from '../dom/platform';

import {
  hitTest
} from '../dom/query';

import {
  IBoxSizing, ISizeLimits, boxSizing, sizeLimits
} from '../dom/sizing';

import {
  BoxSizer, adjustSizer, boxCalc
} from './boxengine';

import {
  FocusTracker
} from './focustracker';

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
 * The class name added to DockPanel widgets.
 */
const WIDGET_CLASS = 'p-DockPanel-widget';

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
 * The class name added to horizontal handles.
 */
const HORIZONTAL_CLASS = 'p-mod-horizontal';

/**
 * The class name added to vertical handles.
 */
const VERTICAL_CLASS = 'p-mod-vertical';

/**
 * The factory MIME type supported by the dock panel.
 */
const FACTORY_MIME = 'application/vnd.phosphor.widget-factory';

/**
 * A fraction used for sizing root panels; ~= `1 / golden_ratio`.
 */
const GOLDEN = 0.618;


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

    // Extract the inter-panel spacing.
    let spacing = options.spacing !== void 0 ? options.spacing : 4;

    // Extract the content renderer for the panel.
    this._renderer = options.renderer || DockPanel.defaultRenderer;

    // Create the delegate renderer for the layout.
    let renderer: DockLayout.IRenderer = {
      createTabBar: () => this._createTabBar(),
      createHandle: () => this._createHandle()
    };

    // Setup the dock layout for the panel.
    this.layout = new DockLayout({ renderer, spacing });

    // Setup the overlay drop indicator.
    this._overlay = options.overlay || new DockPanel.Overlay();
    this._overlay.node.classList.add(OVERLAY_CLASS);
    this.node.appendChild(this._overlay.node);

    // Connect the focus tracker changed signal.
    this._tracker.currentChanged.connect(this._onCurrentChanged, this);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    // Ensure the mouse is released.
    this._releaseMouse();

    // Hide the overlay.
    this._overlay.hide(0);

    // Cancel a drag if one is in progress.
    if (this._drag) {
      this._drag.dispose();
    }

    // Dispose of the focus tracker.
    this._tracker.dispose();

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * A signal emitted when the current widget has changed.
   */
  currentChanged: ISignal<DockPanel, DockPanel.ICurrentChangedArgs>;

  /**
   * The current widget in the dock panel.
   *
   * #### Notes
   * The current widget is the widget among the added widgets which
   * has the *descendant node* which has most recently been focused.
   *
   * This is the `currentWidget` of an internal `FocusTracker` which
   * tracks all widgets in the dock panel.
   *
   * This will be `null` if there is no current widget.
   *
   * This is a read-only property.
   */
  get currentWidget(): Widget {
    return this._tracker.currentWidget;
  }

  /**
   * The overlay used by the dock panel.
   */
  get overlay(): DockPanel.IOverlay {
    return this._overlay;
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
   * The renderer used by the dock panel.
   */
  get renderer(): DockPanel.IRenderer {
    return (this.layout as DockLayout).renderer;
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
  tabBars(): IIterator<TabBar> {
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
    let tabBar = find(this.tabBars(), bar => contains(bar.titles, title));

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

    // Add the widget to the focus tracker.
    this._tracker.add(widget);
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
  protected onChildAdded(msg: ChildMessage): void {
    // Ignore the generated tab bars.
    if (msg.child.hasClass(TAB_BAR_CLASS)) {
      return;
    }

    // Add the widget class to the child.
    msg.child.addClass(WIDGET_CLASS);
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    // Ignore the generated tab bars.
    if (msg.child.hasClass(TAB_BAR_CLASS)) {
      return;
    }

    // Remove the widget class from the child.
    msg.child.removeClass(WIDGET_CLASS);

    // Remove the widget from the focus tracker.
    this._tracker.remove(msg.child);
  }

  /**
   * Handle the `'p-dragenter'` event for the dock panel.
   */
  private _evtDragEnter(event: IDragEvent): void {
    // If the factory mime type is present, mark the event as
    // handled in order to get the rest of the drag events.
    if (event.mimeData.hasData(FACTORY_MIME)) {
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
      this._overlay.hide(0);
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
    this._overlay.hide(0);

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
    let factory = event.mimeData.getData(FACTORY_MIME);
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
      let ref = Private.tabBarRef(target as TabBar);
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
    let override = overrideCursor(style.cursor);
    this._pressData = { handle, deltaX, deltaY, override };
  }

  /**
   * Handle the `'mousemove'` event for the dock panel.
   */
  private _evtMouseMove(event: MouseEvent): void {
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
    if (!hitTest(this.node, clientX, clientY)) {
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
    let widget = find(layout, widget => {
      return widget.isVisible && hitTest(widget.node, clientX, clientY);
    });

    // Bail if no widget is found.
    if (!widget) {
      return { zone: 'invalid', target: null };
    }

    // Handle the drop zone for a generated tab bar.
    if (widget.hasClass(TAB_BAR_CLASS)) {
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
    if (zone === 'invalid') {
      this._overlay.hide(100);
      return zone;
    }

    // Setup the variables needed to compute the overlay geometry.
    let top: number;
    let left: number;
    let right: number;
    let bottom: number;
    let tr: ClientRect;
    let box = boxSizing(this.node); // TODO cache this?
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
      bottom = rect.height * GOLDEN;
      break;
    case 'root-left':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = rect.width * GOLDEN;
      bottom = box.paddingBottom;
      break;
    case 'root-right':
      top = box.paddingTop;
      left = rect.width * GOLDEN;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'root-bottom':
      top = rect.height * GOLDEN;
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
    }

    // Derive the width and height from the other dimensions.
    let width = rect.width - right - left - box.borderLeft - box.borderRight;
    let height = rect.height - bottom - top - box.borderTop - box.borderBottom;

    // Show the overlay with the computed geometry.
    this._overlay.show({
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
  private _createTabBar(): TabBar {
    // Create and initialize the tab bar.
    let tabBar = this._renderer.createTabBar();
    tabBar.addClass(TAB_BAR_CLASS);

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
    handle.classList.add(HANDLE_CLASS);
    return handle;
  }

  /**
   * Handle the `tabActivateRequested` signal from a tab bar.
   */
  private _onTabActivateRequested(sender: TabBar, args: TabBar.ITabActivateRequestedArgs): void {
    (args.title.owner as Widget).activate();
  }

  /**
   * Handle the `tabCloseRequested` signal from a tab bar.
   */
  private _onTabCloseRequested(sender: TabBar, args: TabBar.ITabCloseRequestedArgs): void {
    (args.title.owner as Widget).close();
  }

  /**
   * Handle the `tabDetachRequested` signal from a tab bar.
   */
  private _onTabDetachRequested(sender: TabBar, args: TabBar.ITabDetachRequestedArgs): void {
    // Do nothing if a drag is already in progress.
    if (this._drag) {
      return;
    }

    // Release the tab bar's hold on the mouse.
    sender.releaseMouse();

    // Extract the data from the args.
    let { index, title, tab, clientX, clientY } = args;

    // Setup the mime data for the drag operation.
    let mimeData = new MimeData();
    let widget = title.owner as Widget;
    mimeData.setData(FACTORY_MIME, () => widget);

    // Create the drag image for the drag operation.
    let dragImage = tab.cloneNode(true) as HTMLElement;

    // Create the drag object to manage the drag-drop operation.
    this._drag = new Drag({
      mimeData, dragImage,
      proposedAction: 'move',
      supportedActions: 'move',
    });

    // Hide the tab node in the original tab.
    tab.classList.add(HIDDEN_CLASS);

    // Create the cleanup callback.
    let cleanup = (() => {
      this._drag = null;
      tab.classList.remove(HIDDEN_CLASS);
    });

    // Start the drag operation and cleanup when done.
    this._drag.start(clientX, clientY).then(cleanup);
  }

  /**
   * Handle the `currentChanged` signal from the focus tracker.
   */
  private _onCurrentChanged(sender: FocusTracker<Widget>, args: DockPanel.ICurrentChangedArgs): void {
    this.currentChanged.emit(args);
  }

  private _drag: Drag = null;
  private _overlay: DockPanel.IOverlay;
  private _renderer: DockPanel.IRenderer;
  private _pressData: Private.IPressData = null;
  private _tracker = new FocusTracker<Widget>();
}


// Define the signals for the `DockPanel` class.
defineSignal(DockPanel.prototype, 'currentChanged');


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
   * An arguments object for the `currentChanged` signal.
   */
  export
  type ICurrentChangedArgs = FocusTracker.ICurrentChangedArgs<Widget>;

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
      this._node = document.createElement('div');
      this._node.classList.add(HIDDEN_CLASS);
      this._node.style.position = 'absolute';
    }

    /**
     * The DOM node for the overlay.
     */
    get node(): HTMLDivElement {
      return this._node;
    }

    /**
     * Show the overlay using the given overlay geometry.
     *
     * @param geo - The desired geometry for the overlay.
     */
    show(geo: IOverlayGeometry): void {
      // Update the position of the overlay.
      let style = this._node.style;
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
      this._node.classList.remove(HIDDEN_CLASS);
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
        this._node.classList.add(HIDDEN_CLASS);
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
        this._node.classList.add(HIDDEN_CLASS);
      }, delay);
    }

    private _timer = -1;
    private _hidden = true;
    private _node: HTMLDivElement;
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
    createTabBar(): TabBar {
      return new TabBar();
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
   * Whether the dock layout is empty.
   */
  get isEmpty(): boolean {
    return this._root === null;
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
  tabBars(): IIterator<TabBar> {
    return this._root ? Private.iterTabBars(this._root) : empty<TabBar>();
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
    if (!this._root || handle.classList.contains(HIDDEN_CLASS)) {
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
    adjustSizer(data.node.sizers, data.index, delta);

    // Update the layout of the widgets.
    if (this.parent) {
      this.parent.update();
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
   * A warning will be logged if the reference widget is invalid.
   */
  addWidget(widget: Widget, options: DockLayout.IAddOptions = {}): void {
    // Parse the options.
    let ref = options.ref || null;
    let mode = options.mode || 'tab-after';

    // Find the tab node which holds the reference widget.
    let refNode: Private.TabLayoutNode = null;
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
      // TODO not collapsing can cause lots of fitting
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
      // TODO not collapsing can cause lots of fitting
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

    // If there are multiple children, just update the handles.
    if (splitNode.children.length > 1) {
      Private.syncHandles(splitNode);
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
    let j = indexOf(parentNode.children, splitNode);

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

    // Remove the handle from its parent node.
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

    // Sync the handles on the parent node.
    Private.syncHandles(parentNode);
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
      refNode = Private.firstTabNode(this._root);
    }

    // If the widget is not contained in the ref node, ensure it is
    // removed from the layout and hidden before being added again.
    if (!contains(refNode.tabBar.titles, widget.title)) {
      this._removeWidget(widget);
      widget.hide();
    }

    // Lookup the target index for inserting the tab.
    let index: number;
    if (ref) {
      index = indexOf(refNode.tabBar.titles, ref.title);
    } else {
      index = refNode.tabBar.currentIndex;
    }

    // Insert the widget's tab relative to the target index.
    refNode.tabBar.insertTab(index + (after ? 1 : 0), widget.title);
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
    // Do nothing if there is no effective split.
    if (widget === ref && refNode.tabBar.titles.length === 1) {
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

    // Lookup the split node for the ref widget.
    let splitNode = refNode ? refNode.parent : null;

    // If the split node is null, split the root.
    if (!splitNode) {
      // Ensure the root is split with the correct orientation.
      let root = this._splitRoot(orientation);

      // Determine the insert index for the new tab node.
      let i = after ? root.children.length : 0;

      // Normalize the split node.
      Private.normalizeSizes(root);

      // Insert the tab node sized to the golden ratio.
      root.children.insert(i, tabNode);
      root.sizers.insert(i, Private.createSizer(GOLDEN));
      root.handles.insert(i, this._createHandle());
      tabNode.parent = root;

      // Re-normalize the split node to maintain the ratios.
      Private.normalizeSizes(root);

      // Finally, synchronize the visibility of the handles.
      Private.syncHandles(root);
      return;
    }

    // If the split node already had the correct orientation,
    // the widget can be inserted into the split node directly.
    if (splitNode.orientation === orientation) {
      // Find the index of the ref node.
      let i = indexOf(splitNode.children, refNode);

      // Normalize the split node.
      Private.normalizeSizes(splitNode);

      // Consume half the space for the insert location.
      let s = splitNode.sizers.at(i).sizeHint /= 2;

      // Insert the tab node sized to the other half.
      let j = i + (after ? 1 : 0);
      splitNode.children.insert(j, tabNode);
      splitNode.sizers.insert(j, Private.createSizer(s));
      splitNode.handles.insert(j, this._createHandle());
      tabNode.parent = splitNode;

      // Finally, synchronize the visibility of the handles.
      Private.syncHandles(splitNode);
      return;
    }

    // Remove the ref node from the split node.
    let i = splitNode.children.remove(refNode);

    // Create a new normalized split node for the children.
    let childNode = new Private.SplitLayoutNode(orientation);
    childNode.normalized = true;

    // Add the ref node sized to half the space.
    childNode.children.pushBack(refNode);
    childNode.sizers.pushBack(Private.createSizer(0.5));
    childNode.handles.pushBack(this._createHandle());
    refNode.parent = childNode;

    // Add the tab node sized to the other half.
    let j = after ? 1 : 0;
    childNode.children.insert(j, tabNode);
    childNode.sizers.insert(j, Private.createSizer(0.5));
    childNode.handles.insert(j, this._createHandle());
    tabNode.parent = childNode;

    // Synchronize the visibility of the handles.
    Private.syncHandles(childNode);

    // Finally, add the new child node to the original split node.
    splitNode.children.insert(i, childNode);
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
    let result = this._root = new Private.SplitLayoutNode(orientation);

    // Add the old root to the new root.
    result.children.pushBack(root);
    result.sizers.pushBack(Private.createSizer(0));
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
      let limits = Private.fitLayoutNode(this._root, this._spacing);
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
    Private.updateLayoutNode(this._root, x, y, width, height, this._spacing);
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
    // TODO do we really want to enforce *all* of these?
    tabBar.tabsMovable = true;
    tabBar.allowDeselect = false;
    tabBar.orientation = 'horizontal';
    tabBar.removeBehavior = 'select-previous-tab';
    tabBar.insertBehavior = 'select-tab-if-needed';

    // Setup the signal handlers for the tab bar.
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
    let handle = this._renderer.createHandle();

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
  private _onCurrentChanged(sender: TabBar, args: TabBar.ICurrentChangedArgs): void {
    // Extract the previous and current title from the args.
    let { previousTitle, currentTitle } = args;

    // Extract the widgets from the titles.
    let previousWidget = previousTitle ? previousTitle.owner as Widget : null;
    let currentWidget = currentTitle ? currentTitle.owner as Widget : null;

    // Hide the previous widget.
    if (previousWidget) {
      previousWidget.hide();
    }

    // Show the current widget.
    if (currentWidget) {
      currentWidget.show();
    }
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
    ref?: Widget;
  }
}


/**
 * The namespace for the module private data.
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
    target: Widget;
  }

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
    readonly children = new Vector<LayoutNode>();

    /**
     * The box sizers for the layout children.
     */
    readonly sizers = new Vector<BoxSizer>();

    /**
     * The handles for the layout children.
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
   * Create an iterator for the tab bars in the tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns An iterator which yields the tab bars in the tree.
   */
  export
  function iterTabBars(node: LayoutNode): IIterator<TabBar> {
    let it: IIterator<TabBar>;
    if (node instanceof TabLayoutNode) {
      it = once(node.tabBar);
    } else {
      it = new ChainIterator(map(node.children, iterTabBars));
    }
    return it;
  }

  /**
   * Create an iterator for the handles in the tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns An iterator which yields the handles in the tree.
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
   * Get the reference widget for a tab bar.
   *
   * @param tabBar - The tab bar of interest.
   *
   * @returns The target reference widget in the tab bar, or null.
   */
  export
  function tabBarRef(tabBar: TabBar): Widget {
    if (tabBar.currentTitle) {
      return tabBar.currentTitle.owner as Widget;
    }
    if (tabBar.titles.length > 0) {
      return tabBar.titles.at(tabBar.titles.length - 1).owner as Widget;
    }
    return null;
  }

  /**
   * Find the first tab layout node in a layout tree.
   *
   * @param node - The root layout node of interest.
   *
   * @returns The first tab node in the tree, or `null`.
   */
  export
  function firstTabNode(node: LayoutNode): TabLayoutNode {
    // Return the node if it's a tab layout node.
    if (node instanceof TabLayoutNode) {
      return node;
    }

    // Recursively search the children for a tab layout node.
    for (let i = 0, n = node.children.length; i < n; ++i) {
      let result = firstTabNode(node.children.at(i));
      if (result !== null) {
        return result;
      }
    }

    // Otherwise, there is no tab layout node.
    return null;
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
    // Return the tab node if it contains the widget.
    if (node instanceof TabLayoutNode) {
      return contains(node.tabBar.titles, widget.title) ? node : null;
    }

    // Recursively search the children of a split layout node.
    for (let i = 0, n = node.children.length; i < n; ++i) {
      let result = findTabNode(node.children.at(i), widget);
      if (result !== null) {
        return result;
      }
    }

    // Otherwise, the widget does not exist in the tree.
    return null;
  }

  /**
   * Find the split layout node which contains the given handle.
   *
   * @param node - The root layout node of interest.
   *
   * @param handle - The handle of interest.
   *
   * @returns An object which contains the split node and the index
   *   of the handle, or `null` if the split node is not found.
   */
  export
  function findSplitNode(node: LayoutNode, handle: HTMLDivElement): { index: number, node: SplitLayoutNode } {
    // Bail if the node is not a split node.
    if (node instanceof TabLayoutNode) {
      return null;
    }

    // Return the pair if the node contains the handle.
    let index = indexOf(node.handles, handle);
    if (index !== -1) {
      return { index, node };
    }

    // Recursively search the child split nodes.
    for (let i = 0, n = node.children.length; i < n; ++i) {
      let result = findSplitNode(node.children.at(i), handle);
      if (result !== null) {
        return result;
      }
    }

    // Otherwise, the handle does not exist in the tree.
    return null;
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
  function fitLayoutNode(node: LayoutNode, spacing: number): ISizeLimits {
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
  function updateLayoutNode(node: LayoutNode, x: number, y: number, width: number, height: number, spacing: number): void {
    if (node instanceof TabLayoutNode) {
      updateTabNode(node, x, y, width, height);
    } else {
      updateSplitNode(node, x, y, width, height, spacing);
    }
  }

  /**
   * Sync the visibility and orientation of split node handles.
   *
   * @param splitNode - The split node of interest.
   */
  export
  function syncHandles(splitNode: SplitLayoutNode): void {
    // Do nothing if there are no handles.
    if (splitNode.handles.isEmpty) {
      return;
    }

    // Compute the classes to add and remove.
    let horizontal = splitNode.orientation === 'horizontal';
    let remClass = horizontal ? VERTICAL_CLASS : HORIZONTAL_CLASS;
    let addClass = horizontal ? HORIZONTAL_CLASS : VERTICAL_CLASS;

    // Show all handles and update their orientation.
    each(splitNode.handles, handle => {
      handle.classList.remove(HIDDEN_CLASS);
      handle.classList.remove(remClass);
      handle.classList.add(addClass);
    });

    // Hide the last handle.
    splitNode.handles.back.classList.add(HIDDEN_CLASS);
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

  /**
   * Hold the current sizes of a vector of box sizers.
   *
   * This sets the size hint of each sizer to its current size.
   */
  export
  function holdSizes(sizers: Vector<BoxSizer>): void {
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

    // De-normalize the split node if needed.
    if (splitNode.normalized) {
      each(splitNode.sizers, sizer => { sizer.sizeHint *= space; });
      splitNode.normalized = false;
    }

    // Distribute the layout space to the sizers.
    boxCalc(splitNode.sizers, space);

    // Update the geometry of the child areas and handles.
    for (let i = 0, n = splitNode.children.length; i < n; ++i) {
      let child = splitNode.children.at(i);
      let size = splitNode.sizers.at(i).size;
      let hStyle = splitNode.handles.at(i).style;
      if (horizontal) {
        updateLayoutNode(child, x, y, size, height, spacing);
        x += size;
        hStyle.top = `${y}px`;
        hStyle.left = `${x}px`;
        hStyle.width = `${spacing}px`;
        hStyle.height = `${height}px`;
        x += spacing;
      } else {
        updateLayoutNode(child, x, y, width, size, spacing);
        y += size;
        hStyle.top = `${y}px`;
        hStyle.left = `${x}px`;
        hStyle.width = `${width}px`;
        hStyle.height = `${spacing}px`;
        y += spacing;
      }
    }
  }
}
