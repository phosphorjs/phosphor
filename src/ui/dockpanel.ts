/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each
} from '../algorithm/iteration';

import {
  find, indexOf, max
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

import {
  Vector
} from '../collections/vector';

import {
  Message
} from '../core/messaging';

import {
  MimeData
} from '../core/mimedata';

import {
  ISignal, defineSignal
} from '../core/signaling';

import {
  Drag, IDragEvent
} from '../dom/dragdrop';

import {
  hitTest
} from '../dom/query';

import {
  boxSizing
} from '../dom/sizing';

import {
  FocusTracker
} from './focustracker';

import {
  SplitPanel
} from './splitpanel';

import {
  StackedLayout, StackedPanel
} from './stackedpanel';

import {
  TabBar
} from './tabbar';

import {
  TabPanel
} from './tabpanel';

import {
  Widget
} from './widget';


/**
 * The class name added to a DockPanel instance.
 */
const DOCK_PANEL_CLASS = 'p-DockPanel';

/**
 * The class name added to a DockPanel tab panel descendant.
 */
const TAB_PANEL_CLASS = 'p-DockPanel-tabPanel';

/**
 * The class name added to a DockPanel split panel descendant.
 */
const SPLIT_PANEL_CLASS = 'p-DockPanel-splitPanel';

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
    this.layout = new StackedLayout();

    // Parse the spacing option.
    if (options.spacing !== void 0) {
      this._spacing = Private.clampSpacing(options.spacing);
    }

    // Setup the overlay indicator.
    if (options.overlay !== void 0) {
      this._overlay = options.overlay;
    } else {
      this._overlay = new DockPanel.Overlay();
    }

    // Connect the focus tracker changed signal.
    this._tracker.currentChanged.connect(this._onCurrentChanged, this);

    // Add the overlay node to the panel.
    this.node!.appendChild(this._overlay.node);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    // Hide the overlay.
    this._overlay.hide(0);

    // Cancel a drag if one is in progress.
    if (this._drag) this._drag.dispose();

    // Clear the data structures.
    this._root = null;
    this._widgets.clear();
    this._tabPanels.clear();
    this._splitPanels.clear();

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
   * The overlay used by the dock panel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get overlay(): DockPanel.IOverlay {
    return this._overlay;
  }

  /**
   * Get the spacing between the panels.
   */
  get spacing(): number {
    return this._spacing;
  }

  /**
   * Set the spacing between the panels.
   */
  set spacing(value: number) {
    value = Private.clampSpacing(value);
    if (this._spacing === value) {
      return;
    }
    this._spacing = value;
    each(this._splitPanels, panel => { panel.spacing = value; });
  }

  /**
   * A read-only sequence of the widgets in the dock panel.
   *
   * #### Notes
   * The order of the widgets in the sequence has no meaning.
   *
   * This is a read-only property.
   */
  get widgets(): ISequence<Widget> {
    return this._widgets;
  }

  /**
   * The current widget in the dock panel.
   *
   * #### Notes
   * The current widget is the widget among the added widgets which
   * has the *descendant node* which has most recently been focused.
   *
   * This is the `currentWidget` of the internal `FocusTracker` which
   * tracks all widgets in the dock panel.
   *
   * This will be `null` if there is no current widget.
   *
   * This is a read-only property.
   */
  get currentWidget(): Widget | null {
    return this._tracker.currentWidget;
  }

  /**
   * Activate the specified widget in the dock panel.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will ensure that the widget is the current visible widget
   * in its host tab panel and post the widget an activate request.
   */
  activateWidget(widget: Widget): void {
    // Ensure the widget is contained by the panel.
    if (indexOf(this._widgets, widget) === -1) {
      throw new Error('Widget is not contained by the dock panel.');
    }

    // Ensure the widget is the current widget.
    (widget.parent!.parent as TabPanel).currentWidget = widget;

    // Activate the widget.
    widget.activate();
  }

  /**
   * Add a widget to the dock panel.
   *
   * @param widget - The widget to add into the dock panel.
   *
   * @param options - The additional options for adding the widget.
   */
  addWidget(widget: Widget, options: DockPanel.IAddOptions = {}): void {
    // Setup the option defaults.
    let activate = true;
    let ref: Widget | null = null;
    let mode: DockPanel.Mode = 'tab-after';

    // Extract the options.
    if (options.activate !== void 0) {
      activate = options.activate;
    }
    if (options.ref !== void 0) {
      ref = options.ref;
    }
    if (options.mode !== void 0) {
      mode = options.mode;
    }

    // Ensure the arguments are valid.
    if (!widget) {
      throw new Error('Target widget is null.');
    }
    if (widget === ref) {
      throw new Error('Target widget cannot be the reference widget.');
    }
    if (ref && indexOf(this._widgets, ref) === -1) {
      throw new Error('Reference widget is not contained by the dock panel.');
    }

    // Unparent the widget before performing the insert, so that structural
    // changes to the panel occur before searching for the insert location.
    widget.parent = null;

    // Add the widget to the focus tracker.
    this._tracker.add(widget);

    // Add the widget to the widgets vector.
    this._widgets.pushBack(widget);

    // Insert the widget based on the specified mode.
    this._insertWidget(widget, mode, ref);

    // Activate the widget if requested.
    if (activate) this.activateWidget(widget);
  }

  /**
   * Find the drop target for the given client position.
   *
   * @param clientX - The client X position of interest.
   *
   * @param clientY - The client Y position of interest.
   *
   * @returns The drop target at the specified client position.
   */
  findDropTarget(clientX: number, clientY: number): DockPanel.IDropTarget {
    // If the position is not over the dock panel, bail.
    if (!hitTest(this.node!, clientX, clientY)) {
      return { zone: 'invalid', panel: null };
    }

    // If there is no root, indicate a center drop position.
    if (!this._root) {
      return { zone: 'root-center', panel: null };
    }

    // Test for a root zone first.
    let zone = Private.getRootZone(this.node!, clientX, clientY);
    if (zone !== 'invalid') {
      return { zone, panel: null };
    }

    // Find the panel at the client position.
    let panel = find(this._tabPanels, panel => {
      return hitTest(panel.node!, clientX, clientY);
    }) || null;

    // Compute the zone for the hit panel, if any.
    if (panel) {
      zone = Private.getPanelZone(panel.node!, clientX, clientY);
    } else {
      zone = 'invalid';
    }

    // Return the final drop target.
    return { zone, panel };
  }

  /**
   * Show the overlay indicator at the given client position.
   *
   * @param clientX - The client X position of interest.
   *
   * @param clientY - The client Y position of interest.
   *
   * @returns The dock zone at the specified client position.
   *
   * #### Notes
   * If the position is not over a valid zone, the overlay is hidden.
   *
   * This returns the dock zone used to display the overlay.
   */
  showOverlay(clientX: number, clientY: number): DockPanel.Zone {
    // Find the dock target for the given client position.
    let target = this.findDropTarget(clientX, clientY);

    // If the dock zone is invalid, hide the overlay and bail.
    if (target.zone === 'invalid') {
      this._overlay.hide(100);
      return target.zone;
    }

    // Setup the variables needed to compute the overlay geometry.
    let top: number;
    let left: number;
    let right: number;
    let bottom: number;
    let cr: ClientRect;
    let box = boxSizing(this.node!); // TODO cache this?
    let rect = this.node!.getBoundingClientRect();

    // Compute the overlay geometry based on the dock zone.
    switch (target.zone) {
    case 'root-top':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = box.paddingRight;
      bottom = (rect.height - box.verticalSum) * 2 / 3;
      break;
    case 'root-left':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = (rect.width - box.horizontalSum) * 2 / 3;
      bottom = box.paddingBottom;
      break;
    case 'root-right':
      top = box.paddingTop;
      left = (rect.width - box.horizontalSum) * 2 / 3;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'root-bottom':
      top = (rect.height - box.verticalSum) * 2 / 3;
      left = box.paddingLeft;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'root-center':
      top = box.paddingTop;
      left = box.paddingLeft;
      right = box.paddingRight;
      bottom = box.paddingBottom;
      break;
    case 'panel-top':
      cr = target.panel!.node!.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      right = rect.right - cr.right - box.borderRight;
      bottom = rect.bottom - cr.bottom + cr.height / 2 - box.borderBottom;
      break;
    case 'panel-left':
      cr = target.panel!.node!.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      right = rect.right - cr.right + cr.width / 2 - box.borderRight;
      bottom = rect.bottom - cr.bottom - box.borderBottom;
      break;
    case 'panel-right':
      cr = target.panel!.node!.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left + cr.width / 2 - box.borderLeft;
      right = rect.right - cr.right - box.borderRight;
      bottom = rect.bottom - cr.bottom - box.borderBottom;
      break;
    case 'panel-bottom':
      cr = target.panel!.node!.getBoundingClientRect();
      top = cr.top - rect.top + cr.height / 2 - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      right = rect.right - cr.right - box.borderRight;
      bottom = rect.bottom - cr.bottom - box.borderBottom;
      break;
    case 'panel-center':
      cr = target.panel!.node!.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      right = rect.right - cr.right - box.borderRight;
      bottom = rect.bottom - cr.bottom - box.borderBottom;
      break;
    default:
      throw 'Invalid value for target zone: "' + target.zone + '"';
    }

    // Derive the width and height from the other dimensions.
    let width = rect.width - right - left - box.borderLeft - box.borderRight;
    let height = rect.height - bottom - top - box.borderTop - box.borderBottom;

    // Show the overlay with the computed geometry.
    this._overlay.show({
      zone: target.zone,
      mouseX: clientX,
      mouseY: clientY,
      parentRect: rect,
      top, left, right, bottom, width, height
    });

    // Finally, return the dock zone used for the overlay.
    return target.zone;
  }

  /**
   * Handle the DOM events for the dock panel.
   *
   * @param event - The DOM event sent to the dock panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the dock panel's node. It should
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
    }
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    let node = this.node!;
    node.addEventListener('p-dragenter', this);
    node.addEventListener('p-dragleave', this);
    node.addEventListener('p-dragover', this);
    node.addEventListener('p-drop', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    let node = this.node!;
    node.removeEventListener('p-dragenter', this);
    node.removeEventListener('p-dragleave', this);
    node.removeEventListener('p-dragover', this);
    node.removeEventListener('p-drop', this);
  }

  /**
   * Handle the `'p-dragenter'` event for the dock panel.
   */
  private _evtDragEnter(event: IDragEvent): void {
    // If the factory mime type is present, mark the event as
    // handled in order to get the rest of the drag events.
    if (event.mimeData!.hasData(FACTORY_MIME)) {
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
    if (!related || !this.node!.contains(related)) {
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
    if (this.showOverlay(event.clientX, event.clientY) === 'invalid') {
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
    let target = this.findDropTarget(event.clientX, event.clientY);

    // Bail if the drop zone is invalid.
    if (target.zone === 'invalid') {
      event.dropAction = 'none';
      return;
    }

    // Bail if the factory mime type has invalid data.
    let factory = event.mimeData!.getData(FACTORY_MIME);
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
    this._handleDrop(widget, target);

    // Accept the proposed drop action.
    event.dropAction = event.proposedAction;
  }

  /**
   * Drop a widget onto the dock panel using the given drop target.
   */
  private _handleDrop(widget: Widget, target: DockPanel.IDropTarget): void {
    // Do nothing if the dock zone is invalid.
    if (target.zone === 'invalid') {
      return;
    }

    // Handle the simple case of root drops first.
    switch(target.zone) {
    case 'root-top':
      this.addWidget(widget, { mode: 'split-top' });
      return;
    case 'root-left':
      this.addWidget(widget, { mode: 'split-left' });
      return;
    case 'root-right':
      this.addWidget(widget, { mode: 'split-right' });
      return;
    case 'root-bottom':
      this.addWidget(widget, { mode: 'split-bottom' });
      return;
    case 'root-center':
      this.addWidget(widget, { mode: 'split-left' });
      return;
    }

    // Otherwise, it's a panel drop, and that requires more checks.

    // Fetch the children of the target panel.
    let children = target.panel!.widgets;

    // Do nothing if the widget is dropped as a tab on its own panel.
    if (target.zone === 'panel-center' && indexOf(children, widget) !== -1) {
      return;
    }

    // Do nothing if the panel only contains the drop widget.
    if (children.length === 1 && children.at(0) === widget) {
      return;
    }

    // Find a suitable reference widget for the drop.
    let ref = children.at(children.length - 1);
    if (ref === widget) {
      ref = children.at(children.length - 2);
    }

    // Insert the widget based on the panel zone.
    switch(target.zone) {
    case 'panel-top':
      this.addWidget(widget, { mode: 'split-top', ref });
      return;
    case 'panel-left':
      this.addWidget(widget, { mode: 'split-left', ref });
      return;
    case 'panel-right':
      this.addWidget(widget, { mode: 'split-right', ref });
      return;
    case 'panel-bottom':
      this.addWidget(widget, { mode: 'split-bottom', ref });
      return;
    case 'panel-center':
      this.addWidget(widget, { mode: 'tab-after', ref });
      return;
    }
  }

  /**
   * Insert a widget into the dock panel using the given mode.
   *
   * The target widget should have no parent, and the reference widget
   * should either be null or a widget contained in the dock panel.
   */
  private _insertWidget(widget: Widget, mode: DockPanel.Mode, ref: Widget | null): void {
    // Determine whether the insert is before or after the ref.
    let after = (
      mode === 'tab-after' ||
      mode === 'split-right' ||
      mode === 'split-bottom'
    );

    // Handle the simple case of adding to a tab panel.
    if (mode === 'tab-before' || mode === 'tab-after') {
      if (ref) {
        let tabPanel = ref.parent!.parent as TabPanel;
        let index = indexOf(tabPanel.widgets, ref) + (after ? 1 : 0);
        tabPanel.insertWidget(index, widget);
      } else {
        let tabPanel = this._ensureTabPanel();
        let index = after ? tabPanel.widgets.length : 0;
        tabPanel.insertWidget(index, widget);
      }
      return;
    }

    // Otherwise, determine the orientation of the new split.
    let orientation: SplitPanel.Orientation;
    if (mode === 'split-top' || mode === 'split-bottom') {
      orientation = 'vertical';
    } else {
      orientation = 'horizontal';
    }

    // Setup the new tab panel to host the widget.
    let tabPanel = this._createTabPanel();
    tabPanel.addWidget(widget);

    // If there is no root, add the new tab panel as the root.
    if (!this._root) {
      this._setRoot(tabPanel);
      return;
    }

    // If the ref widget is null, split the root panel.
    if (!ref) {
      let splitPanel = this._ensureSplitRoot(orientation);
      let sizes = splitPanel.relativeSizes();
      let index = after ? sizes.length : 0;
      sizes.splice(index, 0, 0.5);
      splitPanel.insertWidget(index, tabPanel);
      splitPanel.setRelativeSizes(sizes);
      return;
    }

    // Lookup the tab panel for the ref widget.
    let refTabPanel = ref.parent!.parent as TabPanel;

    // If the ref tab panel is the root, split the root.
    if (this._root === refTabPanel) {
      let splitPanel = this._ensureSplitRoot(orientation);
      splitPanel.insertWidget(after ? 1 : 0, tabPanel);
      splitPanel.setRelativeSizes([1, 1]);
      return;
    }

    // Otherwise, the ref tab panel parent is a split panel.
    let splitPanel = refTabPanel.parent as SplitPanel;

    // If the split panel is the correct orientation, the widget
    // can be inserted directly and sized to 0.5 of the ref space.
    if (splitPanel.orientation === orientation) {
      let i = indexOf(splitPanel.widgets, refTabPanel);
      let index = after ? i + 1 : i;
      let sizes = splitPanel.relativeSizes();
      let size = sizes[i] = sizes[i] / 2;
      sizes.splice(index, 0, size);
      splitPanel.insertWidget(index, tabPanel);
      splitPanel.setRelativeSizes(sizes);
      return;
    }

    // If the split panel only has a single child, its orientation
    // can be changed directly and its sizes set to a 1:1 ratio.
    if (splitPanel.widgets.length === 1) {
      splitPanel.orientation = orientation;
      splitPanel.insertWidget(after ? 1 : 0, tabPanel);
      splitPanel.setRelativeSizes([1, 1]);
      return;
    }

    // Otherwise, a new split panel with the correct orientation needs
    // to be created to hold the ref panel and tab panel, and inserted
    // at the previous location of the ref panel.
    let sizes = splitPanel.relativeSizes();
    let i = indexOf(splitPanel.widgets, refTabPanel);
    let childSplit = this._createSplitPanel(orientation);
    childSplit.insertWidget(0, refTabPanel);
    childSplit.insertWidget(after ? 1 : 0, tabPanel);
    splitPanel.insertWidget(i, childSplit);
    splitPanel.setRelativeSizes(sizes);
    childSplit.setRelativeSizes([1, 1]);
  }

  /**
   * Create a new tab panel for adding to the dock panel.
   */
  private _createTabPanel(): TabPanel {
    let panel = new TabPanel({ tabsMovable: true });
    panel.addClass(TAB_PANEL_CLASS);
    panel.tabBar!.tabDetachRequested.connect(this._onTabDetachRequested, this);
    panel.stackedPanel!.widgetRemoved.connect(this._onWidgetRemoved, this);
    this._tabPanels.pushBack(panel);
    return panel;
  }

  /**
   * Create a new split panel for adding to the dock panel.
   */
  private _createSplitPanel(orientation: SplitPanel.Orientation): SplitPanel {
    let panel = new SplitPanel({ orientation, spacing: this._spacing });
    panel.addClass(SPLIT_PANEL_CLASS);
    this._splitPanels.pushBack(panel);
    return panel;
  }

  /**
   * Dispose of a tab panel created for the dock panel.
   */
  private _disposeTabPanel(panel: TabPanel): void {
    this._tabPanels.remove(panel);
    panel.dispose();
  }

  /**
   * Dispose of a split panel created for the dock panel.
   */
  private _disposeSplitPanel(panel: SplitPanel): void {
    this._splitPanels.remove(panel);
    panel.dispose();
  }

  /**
   * Ensure a tab panel is available in the dock panel.
   *
   * If there is no root panel, a new root tab panel will be created.
   * Otherwise, if there is an active widget, the tab panel for that
   * widget will be returned. Otherwise, the top-left tab panel will
   * be returned.
   */
  private _ensureTabPanel(): TabPanel {
    // If there is no root panel, create a new root tab panel.
    if (!this._root) {
      let panel = this._createTabPanel();
      this._setRoot(panel);
      return panel;
    }

    // Otherwise, use the tab panel of the current widget if possible.
    let current = this._tracker.currentWidget;
    if (current) {
      return current.parent!.parent as TabPanel;
    }

    // Otherwise, fallback on using the top-left tab panel.
    let panel = this._root;
    while (panel instanceof SplitPanel) {
      panel = panel.widgets.at(0) as (SplitPanel | TabPanel);
    }

    // Return the top-left tab panel.
    return panel as TabPanel;
  }

  /**
   * Ensure the root panel is a split panel with the given orientation.
   *
   * This returns split panel so that casting the root is not needed.
   */
  private _ensureSplitRoot(orientation: SplitPanel.Orientation): SplitPanel {
    // If there is no root panel, create a new root split panel.
    if (!this._root) {
      let root = this._createSplitPanel(orientation);
      this._setRoot(root);
      return root;
    }

    // If the root is a tab panel, add it to a new split root.
    if (this._root instanceof TabPanel) {
      let root = this._createSplitPanel(orientation);
      root.addWidget(this._root);
      this._setRoot(root);
      return root;
    }

    // Otherwise, do nothing if the split root orientation is okay.
    let oldRoot = this._root as SplitPanel;
    if (oldRoot.orientation === orientation) {
      return oldRoot;
    }

    // Correct the orientation of the split root, if feasible.
    if (oldRoot.widgets.length <= 1) {
      oldRoot.orientation = orientation;
      return oldRoot;
    }

    // Otherwise, create a new split root.
    let newRoot = this._createSplitPanel(orientation);
    newRoot.addWidget(oldRoot);
    this._setRoot(newRoot);
    return newRoot;
  }

  /**
   * Set the non-null root widget for the dock panel.
   */
  private _setRoot(root: SplitPanel | TabPanel): void {
    this._root = root;
    (this.layout as StackedLayout).addWidget(root);
    root.show();
  }

  /**
   * Remove an empty dock tab panel from the hierarchy.
   *
   * This ensures that the hierarchy is kept consistent by merging an
   * ancestor split panel when it contains only a single child widget.
   */
  private _removeTabPanel(tabPanel: TabPanel): void {
    // If the parent of the tab panel is the root, just remove it.
    if (this._root === tabPanel) {
      this._disposeTabPanel(tabPanel);
      this._root = null;
      return;
    }

    // Cast the tab panel parent to a split panel.
    // It's guaranteed to have at least 2 children.
    let splitPanel = tabPanel.parent as SplitPanel;

    // Release the tab panel.
    this._disposeTabPanel(tabPanel);

    // Do nothing more if the split panel still has multiple children.
    if (splitPanel.widgets.length > 1) {
      return;
    }

    // Extract the remaining child from the split panel.
    let child = splitPanel.widgets.at(0) as (SplitPanel | TabPanel);

    // If the split panel is the root, replace it.
    if (this._root === splitPanel) {
      this._setRoot(child);
      this._disposeSplitPanel(splitPanel);
      return;
    }

    // Cast the split panel parent to a split panel and lookup
    // the index of the split panel. The grand panel will have
    // at least 2 children.
    let grandPanel = splitPanel.parent as SplitPanel;
    let index = indexOf(grandPanel.widgets, splitPanel);

    // If the child is a tab panel, replace the split panel.
    if (child instanceof TabPanel) {
      let sizes = grandPanel.relativeSizes();
      splitPanel.parent = null;
      grandPanel.insertWidget(index, child);
      grandPanel.setRelativeSizes(sizes);
      this._disposeSplitPanel(splitPanel);
      return;
    }

    // Cast the child to a split panel.
    let childSplit = child as SplitPanel;

    // Child splitters have an orthogonal orientation to their parent.
    // The grand children can now be merged with their grand parent.

    // Start by fetching the relevant current sizes.
    let childSizes = childSplit.relativeSizes();
    let grandSizes = grandPanel.relativeSizes();

    // Remove the split panel and store its share of the size.
    splitPanel.parent = null;
    let sizeShare = grandSizes.splice(index, 1)[0];

    // Merge the grand children and maintain their relative size.
    for (let i = 0; childSplit.widgets.length !== 0; ++i) {
      grandPanel.insertWidget(index + i, childSplit.widgets.at(0));
      grandSizes.splice(index + i, 0, sizeShare * childSizes[i]);
    }

    // Update the grand parent sizes.
    grandPanel.setRelativeSizes(grandSizes);

    // Dispose the removed split panel.
    this._disposeSplitPanel(splitPanel);
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
      mimeData: mimeData,
      dragImage: dragImage,
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
   * Handle the `widgetRemoved` signal from a stacked panel.
   */
  private _onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
    this._widgets.remove(widget);
    this._tracker.remove(widget);
    if (sender.widgets.length === 0) {
      this._removeTabPanel(sender.parent as TabPanel);
    }
  }

  /**
   * Handle the `currentChanged` signal from the focus tracker.
   */
  private _onCurrentChanged(sender: FocusTracker<Widget>, args: FocusTracker.ICurrentChangedArgs<Widget>): void {
    this.currentChanged.emit(args);
  }

  private _spacing: number;
  private _drag: Drag | null = null;
  private _overlay: DockPanel.IOverlay;
  private _widgets = new Vector<Widget>();
  private _tabPanels = new Vector<TabPanel>();
  private _splitPanels = new Vector<SplitPanel>();
  private _tracker = new FocusTracker<Widget>();
  private _root: SplitPanel | TabPanel | null = null;
}


// Define the signals for the `FocusTracker` class.
defineSignal(DockPanel.prototype, 'currentChanged');


/**
 * The namespace for the `DockPanel` class statics.
 */
export
namespace DockPanel {
  /**
   * An arguments object for the `currentChanged` signal.
   */
  export
  interface ICurrentChangedArgs {
    /**
     * The old value for the `currentWidget`, or `null`.
     */
    oldValue: Widget | null;

    /**
     * The new value for the `currentWidget`, or `null`.
     */
    newValue: Widget | null;
  }

  /**
   * An options object for creating a dock panel.
   */
  export
  interface IOptions {
    /**
     * The spacing between tab panels in the dock panel.
     *
     * The default is `4`.
     */
    spacing?: number;

    /**
     * The overlay to use with the dock panel.
     *
     * The default is a new `Overlay` instance.
     */
    overlay?: IOverlay;
  }

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
    ref?: Widget | null;

    /**
     * Whether to activate the new widget.
     *
     * The default is `true`.
     */
    activate?: boolean;
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
     * If the reference widget is null, the widget will be inserted
     * at the top edge of the dock panel.
     */
    'split-top' |

    /**
     * The area to the left of the reference widget.
     *
     * The widget will be inserted just left of the reference widget.
     *
     * If the reference widget is null, the widget will be inserted
     * at the left edge of the dock panel.
     */
    'split-left' |

    /**
     * The area to the right of the reference widget.
     *
     * The widget will be inserted just right of the reference widget.
     *
     * If the reference widget is null, the widget will be inserted
     * at the right edge of the dock panel.
     */
    'split-right' |

    /**
     * The area to the bottom of the reference widget.
     *
     * The widget will be inserted just below the reference widget.
     *
     * If the reference widget is null, the widget will be inserted
     * at the bottom edge of the dock panel.
     */
    'split-bottom' |

    /**
     * The tab position before the reference widget.
     *
     * The widget will be added as a tab before the reference widget.
     *
     * If the reference widget is `null`, a sensible default is used.
     */
    'tab-before' |

    /**
     * The tab position after the reference widget.
     *
     * The widget will be added as a tab after the reference widget.
     *
     * If the reference widget is `null`, a sensible default is used.
     */
    'tab-after'
  );

  /**
   * A type alias of the supported dock zones.
   *
   * A dock zone is used to indicate the position of the dock panel
   * overlay when the user drags over the dock panel with the mouse.
   */
  export
  type Zone = (
    /**
     * An invalid dock zone.
     */
    'invalid' |

    /**
     * The dock zone at the top of the root panel.
     */
    'root-top' |

    /**
     * The dock zone at the left of the root panel.
     */
    'root-left' |

    /**
     * The dock zone at the right of the root panel.
     */
    'root-right' |

    /**
     * The dock zone at the bottom of the root panel.
     */
    'root-bottom' |

    /**
     * The dock zone at the center of the root panel.
     */
    'root-center' |

    /**
     * The dock zone at the top third of a tab panel.
     */
    'panel-top' |

    /**
     * The dock zone at the left third of a tab panel.
     */
    'panel-left' |

    /**
     * The dock zone at the right third of a tab panel.
     */
    'panel-right' |

    /**
     * The dock zone at the bottom third of a tab panel.
     */
    'panel-bottom' |

    /**
     * The dock zone at the center of a tab panel.
     */
    'panel-center'
  );

  /**
   * The result object for a drop target hit test.
   */
  export
  interface IDropTarget {
    /**
     * The dock zone at the specified position.
     *
     * This will be `'invalid'` if the position is not a valid zone.
     */
    zone: Zone;

    /**
     * The tab panel for the indicated dock zone.
     *
     * This will be `null` if the dock zone is not a panel zone.
     */
    panel: TabPanel | null;
  }

  /**
   * An object which holds the geometry for overlay positioning.
   */
  export
  interface IOverlayGeometry {
    /**
     * The zone associated with the geometry.
     */
    zone: Zone;

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
     *
     * #### Notes
     * This should be a read-only property.
     */
    node: HTMLDivElement;

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
      this._node.classList.add(OVERLAY_CLASS);
      this._node.classList.add(HIDDEN_CLASS);
      this._node.style.position = 'absolute';
    }

    /**
     * The DOM node for the overlay.
     *
     * #### Notes
     * This is a read-only property.
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

      // Update the class name for the zone.
      this._setZone(geo.zone);

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

    /**
     * Set the dock zone for the overlay.
     */
    private _setZone(newZone: DockPanel.Zone): void {
      let oldZone = this._zone;
      if (oldZone === newZone) {
        return;
      }
      let oldClass = oldZone !== 'invalid' ? `p-mod-${oldZone}` : '';
      let newClass = newZone !== 'invalid' ? `p-mod-${newZone}` : '';
      if (oldClass) this._node.classList.remove(oldClass);
      if (newClass) this._node.classList.add(newClass);
      this._zone = newZone;
    }

    private _timer = -1;
    private _hidden = true;
    private _node: HTMLDivElement;
    private _zone: Zone = 'invalid';
  }
}


/**
 * The namespace for the module private data.
 */
namespace Private {
  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * Get the root zone for the given node and client position.
   *
   * This assumes the position lies within the node's client rect.
   *
   * Returns the `'invalid'` zone if the position is not within an edge.
   */
  export
  function getRootZone(node: HTMLElement, x: number, y: number): DockPanel.Zone {
    let zone: DockPanel.Zone;
    let rect = node.getBoundingClientRect();
    if (x < rect.left + EDGE_SIZE) {
      if (y - rect.top < x - rect.left) {
        zone = 'root-top';
      } else if (rect.bottom - y < x - rect.left) {
        zone = 'root-bottom';
      } else {
        zone = 'root-left';
      }
    } else if (x >= rect.right - EDGE_SIZE) {
      if (y - rect.top < rect.right - x) {
        zone = 'root-top';
      } else if (rect.bottom - y < rect.right - x) {
        zone = 'root-bottom';
      } else {
        zone = 'root-right';
      }
    } else if (y < rect.top + EDGE_SIZE) {
      zone = 'root-top';
    } else if (y >= rect.bottom - EDGE_SIZE) {
      zone = 'root-bottom';
    } else {
      zone = 'invalid';
    }
    return zone;
  }

  /**
   * Get the panel zone for the given node and position.
   *
   * This assumes the position lies within the node's client rect.
   *
   * This always returns a valid zone.
   */
  export
  function getPanelZone(node: HTMLElement, x: number, y: number): DockPanel.Zone {
    let zone: DockPanel.Zone;
    let rect = node.getBoundingClientRect();
    let fracX = (x - rect.left) / rect.width;
    let fracY = (y - rect.top) / rect.height;
    if (fracX < 1 / 3) {
      if (fracY < fracX) {
        zone = 'panel-top';
      } else if (1 - fracY < fracX) {
        zone = 'panel-bottom';
      } else {
        zone = 'panel-left';
      }
    } else if (fracX < 2 / 3) {
      if (fracY < 1 / 3) {
        zone = 'panel-top';
      } else if (fracY < 2 / 3) {
        zone = 'panel-center';
      } else {
        zone = 'panel-bottom';
      }
    } else {
      if (fracY < 1 - fracX) {
        zone = 'panel-top';
      } else if (fracY > fracX) {
        zone = 'panel-bottom';
      } else {
        zone = 'panel-right';
      }
    }
    return zone;
  }
}
