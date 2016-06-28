/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
// import * as arrays
//   from 'phosphor-arrays';

// import {
//   boxSizing, hitTest
// } from 'phosphor-domutil';

// import {
//   Drag, DropAction, DropActions, IDragEvent, MimeData
// } from 'phosphor-dragdrop';

// import {
//   Message
// } from 'phosphor-messaging';

// import {
//   NodeWrapper
// } from 'phosphor-nodewrapper';

// import {
//   Property
// } from 'phosphor-properties';

// import {
//   Orientation, SplitPanel
// } from 'phosphor-splitpanel';

// import {
//   StackedLayout, StackedPanel
// } from 'phosphor-stackedpanel';

// import {
//   ITabDetachArgs, TabBar, TabPanel
// } from 'phosphor-tabs';

// import {
//   Widget
// } from 'phosphor-widget';

// import './index.css';


/**
 * The class name added to DockPanel instances.
 */
const DOCK_PANEL_CLASS = 'p-DockPanel';

/**
 * The class name added to dock tab panels.
 */
const TAB_PANEL_CLASS = 'p-DockTabPanel';

/**
 * The class name added to dock split panels.
 */
const SPLIT_PANEL_CLASS = 'p-DockSplitPanel';

/**
 * The class name added to dock panel overlays.
 */
const OVERLAY_CLASS = 'p-DockPanel-overlay';

/**
 * The class name added to hidden overlays and tabs.
 */
const HIDDEN_CLASS = 'p-mod-hidden';

/**
 * The class name added to top root dock overlays.
 */
const ROOT_TOP_CLASS = 'p-mod-root-top';

/**
 * The class name added to left root dock overlays.
 */
const ROOT_LEFT_CLASS = 'p-mod-root-left';

/**
 * The class name added to right root dock overlays.
 */
const ROOT_RIGHT_CLASS = 'p-mod-root-right';

/**
 * The class name added to bottom root dock overlays.
 */
const ROOT_BOTTOM_CLASS = 'p-mod-root-bottom';

/**
 * The class name added to center root dock overlays.
 */
const ROOT_CENTER_CLASS = 'p-mod-root-center';

/**
 * The class name added to top panel dock overlays.
 */
const PANEL_TOP_CLASS = 'p-mod-panel-top';

/**
 * The class name added to left panel dock overlays.
 */
const PANEL_LEFT_CLASS = 'p-mod-panel-left';

/**
 * The class name added to right panel dock overlays.
 */
const PANEL_RIGHT_CLASS = 'p-mod-panel-right';

/**
 * The class name added to bottom panel dock overlays.
 */
const PANEL_BOTTOM_CLASS = 'p-mod-panel-bottom';

/**
 * The class named added to center panel dock overlays.
 */
const PANEL_CENTER_CLASS = 'p-mod-panel-center';

/**
 * The factory MIME type supported by the dock panel.
 */
const FACTORY_MIME = 'application/x-phosphor-widget-factory';

/**
 * The size of the edge dock zone for the root panel.
 */
const EDGE_SIZE = 30;


/**
 * A widget which provides a flexible docking area for content widgets.
 */
// export
// class DockPanel extends Widget {
//   /**
//    * Construct a new dock panel.
//    */
//   constructor(options: DockPanel.IOptions = {}) {
//     super();
//     this.addClass(DOCK_PANEL_CLASS);
//     this.layout = new StackedLayout();
//   }

//   /**
//    * Get the spacing between the tab panels.
//    */
//   get spacing(): number {
//     return DockPanelPrivate.spacingProperty.get(this);
//   }

//   /**
//    * Set the spacing between the tab panels.
//    */
//   set spacing(value: number) {
//     DockPanelPrivate.spacingProperty.set(this, value);
//   }

//   /**
//    * Insert a widget as a new panel above a reference widget.
//    *
//    * @param widget - The widget to insert into the dock panel.
//    *
//    * @param ref - The reference widget. If this is not provided, the
//    *   widget will be inserted at the top edge of the dock panel.
//    *
//    * @throws An error if either `widget` or `ref` is invalid.
//    */
//   insertTop(widget: Widget, ref?: Widget): void {
//     DockPanelPrivate.insertSplit(this, widget, ref, Orientation.Vertical, false);
//   }

//   /**
//    * Insert a widget as a new panel to the left of a reference widget.
//    *
//    * @param widget - The widget to insert into the dock panel.
//    *
//    * @param ref - The reference widget. If this is not provided, the
//    *   widget will be inserted at the left edge of the dock panel.
//    *
//    * @throws An error if either `widget` or `ref` is invalid.
//    */
//   insertLeft(widget: Widget, ref?: Widget): void {
//     DockPanelPrivate.insertSplit(this, widget, ref, Orientation.Horizontal, false);
//   }

//   /**
//    * Insert a widget as a new panel to the right of a reference widget.
//    *
//    * @param widget - The widget to insert into the dock panel.
//    *
//    * @param ref - The reference widget. If this is not provided, the
//    *   widget will be inserted at the right edge of the dock panel.
//    *
//    * @throws An error if either `widget` or `ref` is invalid.
//    */
//   insertRight(widget: Widget, ref?: Widget): void {
//     DockPanelPrivate.insertSplit(this, widget, ref, Orientation.Horizontal, true);
//   }

//   /**
//    * Insert a widget as a new panel below a reference widget.
//    *
//    * @param widget - The widget to insert into the dock panel.
//    *
//    * @param ref - The reference widget. If this is not provided, the
//    *   widget will be inserted at the bottom edge of the dock panel.
//    *
//    * @throws An error if either `widget` or `ref` is invalid.
//    */
//   insertBottom(widget: Widget, ref?: Widget): void {
//     DockPanelPrivate.insertSplit(this, widget, ref, Orientation.Vertical, true);
//   }

//   /**
//    * Insert a widget as a sibling tab before a reference widget.
//    *
//    * @param widget - The widget to insert into the dock panel.
//    *
//    * @param ref - The reference widget. If this is not provided, the
//    *   widget will be inserted as the first tab in the top-left panel.
//    *
//    * @throws An error if either `widget` or `ref` is invalid.
//    */
//   insertTabBefore(widget: Widget, ref?: Widget): void {
//     DockPanelPrivate.insertTab(this, widget, ref, false);
//   }

//   /**
//    * Insert a widget as a sibling tab after a reference widget.
//    *
//    * @param widget - The widget to insert into the dock panel.
//    *
//    * @param ref - The reference widget. If this is not provided, the
//    *   widget will be inserted as the last tab in the top-left panel.
//    *
//    * @throws An error if either `widget` or `ref` is invalid.
//    */
//   insertTabAfter(widget: Widget, ref?: Widget): void {
//     DockPanelPrivate.insertTab(this, widget, ref, true);
//   }

//   *
//    * Ensure the tab for the specified content widget is selected.
//    *
//    * @param widget - The content widget of interest.
//    *
//    * #### Notes
//    * If the widget is not contained in the dock panel, or is already
//    * the selected tab in its respective tab panel, this is a no-op.

//   selectWidget(widget: Widget): void {
//     DockPanelPrivate.selectWidget(this, widget);
//   }

//   /**
//    * Handle the DOM events for the dock panel.
//    *
//    * @param event - The DOM event sent to the dock panel.
//    *
//    * #### Notes
//    * This method implements the DOM `EventListener` interface and is
//    * called in response to events on the dock panel's node. It should
//    * not be called directly by user code.
//    */
//   handleEvent(event: Event): void {
//     switch (event.type) {
//     case 'p-dragenter':
//       this._evtDragEnter(event as IDragEvent);
//       break;
//     case 'p-dragleave':
//       this._evtDragLeave(event as IDragEvent);
//       break;
//     case 'p-dragover':
//       this._evtDragOver(event as IDragEvent);
//       break;
//     case 'p-drop':
//       this._evtDrop(event as IDragEvent);
//       break;
//     }
//   }

//   /**
//    * A message handler invoked on an `'after-attach'` message.
//    */
//   protected onAfterAttach(msg: Message): void {
//     let node = this.node;
//     node.addEventListener('p-dragenter', this);
//     node.addEventListener('p-dragleave', this);
//     node.addEventListener('p-dragover', this);
//     node.addEventListener('p-drop', this);
//   }

//   /**
//    * A message handler invoked on a `'before-detach'` message.
//    */
//   protected onBeforeDetach(msg: Message): void {
//     let node = this.node;
//     node.removeEventListener('p-dragenter', this);
//     node.removeEventListener('p-dragleave', this);
//     node.removeEventListener('p-dragover', this);
//     node.removeEventListener('p-drop', this);
//   }

//   /**
//    * Handle the `'p-dragenter'` event for the dock panel.
//    */
//   private _evtDragEnter(event: IDragEvent): void {
//     if (event.mimeData.hasData(FACTORY_MIME)) {
//       event.preventDefault();
//       event.stopPropagation();
//     }
//   }

//   /**
//    * Handle the `'p-dragleave'` event for the dock panel.
//    */
//   private _evtDragLeave(event: IDragEvent): void {
//     event.preventDefault();
//     event.stopPropagation();
//     let related = event.relatedTarget as HTMLElement;
//     if (!related || !this.node.contains(related)) {
//       DockPanelPrivate.hideOverlay(this);
//     }
//   }

//   /**
//    * Handle the `'p-dragover'` event for the dock panel.
//    */
//   private _evtDragOver(event: IDragEvent): void {
//     event.preventDefault();
//     event.stopPropagation();
//     let x = event.clientX;
//     let y = event.clientY;
//     let zone = DockPanelPrivate.showOverlay(this, x, y);
//     if (zone === DockZone.Invalid) {
//       event.dropAction = DropAction.None;
//     } else {
//       event.dropAction = event.proposedAction;
//     }
//   }

//   /**
//    * Handle the `'p-drop'` event for the dock panel.
//    */
//   private _evtDrop(event: IDragEvent): void {
//     event.preventDefault();
//     event.stopPropagation();
//     DockPanelPrivate.hideOverlay(this);
//     if (event.proposedAction === DropAction.None) {
//       event.dropAction = DropAction.None;
//       return;
//     }
//     let x = event.clientX;
//     let y = event.clientY;
//     let target = DockPanelPrivate.findDockTarget(this, x, y);
//     if (target.zone === DockZone.Invalid) {
//       event.dropAction = DropAction.None;
//       return;
//     }
//     let factory = event.mimeData.getData(FACTORY_MIME);
//     if (typeof factory !== 'function') {
//       event.dropAction = DropAction.None;
//       return;
//     }
//     let widget = factory();
//     if (!(widget instanceof Widget)) {
//       event.dropAction = DropAction.None;
//       return;
//     }
//     DockPanelPrivate.handleDrop(this, widget, target);
//     event.dropAction = event.proposedAction;
//   }

//   private _spacing = 3;
// }


/**
 * The namespace for the `DockPanel` class statics.
 */
// export
// namespace DockPanel {
//   /**
//    * An options object for creating a dock panel.
//    */
//   export
//   interface IOptions {
//     /**
//      * The spacing between items in the panel.
//      *
//      * The default is `3`.
//      */
//     spacing?: number;
//   }
// }


/**
 * The namespace for the module private data.
 */
// namespace Private {
//   /**
//    * An enum of the dock zones for a dock panel.
//    */
//   const enum DockZone {
//     /**
//      * The dock zone at the top of the root split panel.
//      */
//     RootTop,

//     /**
//      * The dock zone at the left of the root split panel.
//      */
//     RootLeft,

//     /**
//      * The dock zone at the right of the root split panel.
//      */
//     RootRight,

//     /**
//      * The dock zone at the bottom of the root split panel.
//      */
//     RootBottom,

//     /**
//      * The dock zone at the center of the root split panel.
//      */
//     RootCenter,

//     /**
//      * The dock zone at the top third of a tab panel.
//      */
//     PanelTop,

//     /**
//      * The dock zone at the left third of a tab panel.
//      */
//     PanelLeft,

//     /**
//      * The dock zone at the right third of a tab panel.
//      */
//     PanelRight,

//     /**
//      * The dock zone at the bottom third of a tab panel.
//      */
//     PanelBottom,

//     /**
//      * The dock zone at the center of a tab panel.
//      */
//     PanelCenter,

//     /**
//      * An invalid dock zone.
//      */
//     Invalid,
//   }

//   /**
//    * The result object for a dock target hit test.
//    */
//   interface IDockTarget {
//     /**
//      * The dock zone at the specified position.
//      *
//      * This will be `Invalid` if the position is not over a dock zone.
//      */
//     zone: DockZone;

//     /**
//      * The dock tab panel for the panel dock zone.
//      *
//      * This will be `null` if the dock zone is not a panel zone.
//      */
//     panel: DockTabPanel;
//   }

//   /**
//    * A custom tab panel used by a DockPanel.
//    */
//   class DockTabPanel extends TabPanel {
//     /**
//      * Construct a new dock tab panel.
//      */
//     constructor() {
//       super();
//       this.addClass(TAB_PANEL_CLASS);
//       this.tabBar.tabsMovable = true;
//     }
//   }

//   /**
//    * A custom split panel used by a DockPanel.
//    */
//   class DockSplitPanel extends SplitPanel {
//     /**
//      * Construct a new dock split panel.
//      */
//     constructor(orientation: Orientation, spacing: number) {
//       super();
//       this.addClass(SPLIT_PANEL_CLASS);
//       this.orientation = orientation;
//       this.spacing = spacing;
//     }
//   }

//   /**
//    * A node wrapper used as an overlay dock indicator for a dock panel.
//    */
//   class DockPanelOverlay extends NodeWrapper {
//     /**
//      * A mapping of dock zone enum value to modifier class.
//      */
//     static zoneMap = [  // keep in-sync with DockZone enum
//       ROOT_TOP_CLASS,
//       ROOT_LEFT_CLASS,
//       ROOT_RIGHT_CLASS,
//       ROOT_BOTTOM_CLASS,
//       ROOT_CENTER_CLASS,
//       PANEL_TOP_CLASS,
//       PANEL_LEFT_CLASS,
//       PANEL_RIGHT_CLASS,
//       PANEL_BOTTOM_CLASS,
//       PANEL_CENTER_CLASS
//     ];

//     /**
//      * Construct a new dock panel overlay.
//      */
//     constructor() {
//       super();
//       this.addClass(OVERLAY_CLASS);
//       this.addClass(HIDDEN_CLASS);
//     }

//     /**
//      * Show the overlay with the given zone and geometry
//      */
//     show(zone: DockZone, left: number, top: number, width: number, height: number): void {
//       let style = this.node.style;
//       style.top = top + 'px';
//       style.left = left + 'px';
//       style.width = width + 'px';
//       style.height = height + 'px';
//       this.removeClass(HIDDEN_CLASS);
//       this._setZone(zone);
//     }

//     /**
//      * Hide the overlay and reset its zone.
//      */
//     hide(): void {
//       this.addClass(HIDDEN_CLASS);
//       this._setZone(DockZone.Invalid);
//     }

//     /**
//      * Set the dock zone for the overlay.
//      */
//     private _setZone(zone: DockZone): void {
//       if (zone === this._zone) {
//         return;
//       }
//       let oldClass = DockPanelOverlay.zoneMap[this._zone];
//       let newClass = DockPanelOverlay.zoneMap[zone];
//       if (oldClass) this.removeClass(oldClass);
//       if (newClass) this.addClass(newClass);
//       this._zone = zone;
//     }

//     private _zone = DockZone.Invalid;
//   }

//   /**
//    * The property descriptor for the spacing between panels.
//    */
//   export
//   const spacingProperty = new Property<DockPanel, number>({
//     name: 'spacing',
//     value: 3,
//     coerce: (owner, value) => Math.max(0, value | 0),
//     changed: onSpacingChanged,
//   });

//   /**
//    * Insert a widget as a new split panel in a dock panel.
//    */
//   export
//   function insertSplit(owner: DockPanel, widget: Widget, ref: Widget, orientation: Orientation, after: boolean): void {
//     // Ensure the insert args are valid.
//     validateInsertArgs(owner, widget, ref);

//     // If the widget is the same as the ref, there's nothing to do.
//     if (widget === ref) {
//       return;
//     }

//     // Unparent the widget before performing the insert. This ensures
//     // that structural changes to the dock panel occur before searching
//     // for the insert location.
//     widget.parent = null;

//     // Setup the new tab panel to host the widget.
//     let tabPanel = createTabPanel();
//     tabPanel.addChild(widget);

//     // If there is no root, add the new tab panel as the root.
//     if (!getRoot(owner)) {
//       setRoot(owner, tabPanel);
//       return;
//     }

//     // If the ref widget is null, split the root panel.
//     if (!ref) {
//       let root = ensureSplitRoot(owner, orientation);
//       let sizes = root.sizes();
//       let count = sizes.length;
//       arrays.insert(sizes, after ? count : 0, 0.5);
//       root.insertChild(after ? count : 0, tabPanel);
//       root.setSizes(sizes);
//       return;
//     }

//     // Lookup the tab panel for the ref widget.
//     let refTabPanel = findTabPanel(ref);

//     // If the ref tab panel parent is the dock panel, split the root.
//     if (refTabPanel.parent === owner) {
//       let root = ensureSplitRoot(owner, orientation);
//       root.insertChild(after ? 1 : 0, tabPanel);
//       root.setSizes([1, 1]);
//       return;
//     }

//     // Assert the parent of the ref tab panel is a dock split panel.
//     if (!(refTabPanel.parent instanceof DockSplitPanel)) {
//       internalError();
//     }

//     // Cast the ref tab panel parent to a dock split panel.
//     let splitPanel = refTabPanel.parent as DockSplitPanel;

//     // If the split panel is the correct orientation, the widget
//     // can be inserted directly and sized to 1/2 the ref space.
//     if (splitPanel.orientation === orientation) {
//       let i = splitPanel.childIndex(refTabPanel);
//       let sizes = splitPanel.sizes();
//       let size = sizes[i] = sizes[i] / 2;
//       arrays.insert(sizes, after ? i + 1 : i, size);
//       splitPanel.insertChild(after ? i + 1 : i, tabPanel);
//       splitPanel.setSizes(sizes);
//       return;
//     }

//     // If the split panel only has a single child, its orientation
//     // can be changed directly and its sizes set to a 1:1 ratio.
//     if (splitPanel.childCount() === 1) {
//       splitPanel.orientation = orientation;
//       splitPanel.insertChild(after ? 1 : 0, tabPanel);
//       splitPanel.setSizes([1, 1]);
//       return;
//     }

//     // Assert the split panel has more than one child.
//     if (splitPanel.childCount() === 0) {
//       internalError();
//     }

//     // Otherwise, a new split panel with the correct orientation needs
//     // to be created to hold the ref panel and tab panel, and inserted
//     // in the previous location of the ref panel.
//     let sizes = splitPanel.sizes();
//     let i = splitPanel.childIndex(refTabPanel);
//     let childSplit = new DockSplitPanel(orientation, owner.spacing);
//     childSplit.addChild(refTabPanel);
//     childSplit.insertChild(after ? 1 : 0, tabPanel);
//     splitPanel.insertChild(i, childSplit);
//     splitPanel.setSizes(sizes);
//     childSplit.setSizes([1, 1]);
//   }

//   /**
//    * Insert a widget as a sibling tab in a dock panel.
//    */
//   export
//   function insertTab(owner: DockPanel, widget: Widget, ref: Widget, after: boolean): void {
//     // Ensure the insert args are valid.
//     validateInsertArgs(owner, widget, ref);

//     // If the widget is the same as the ref, there's nothing to do.
//     if (widget === ref) {
//       return;
//     }

//     // Unparent the widget before performing the insert. This ensures
//     // that structural changes to the dock panel occur before searching
//     // for the insert location.
//     widget.parent = null;

//     // Find the index and tab panel for the insert operation.
//     let index: number;
//     let tabPanel: DockTabPanel;
//     if (ref) {
//       tabPanel = findTabPanel(ref);
//       index = tabPanel.childIndex(ref) + (after ? 1 : 0);
//     } else {
//       tabPanel = ensureFirstTabPanel(owner);
//       index = after ? tabPanel.childCount() : 0;
//     }

//     // Insert the widget into the tab panel at the proper location.
//     tabPanel.insertChild(index, widget);
//   }

//   /**
//    * Ensure the given widget is the current widget in its tab panel.
//    *
//    * This is a no-op if the widget is not contained in the dock panel.
//    */
//   export
//   function selectWidget(owner: DockPanel, widget: Widget): void {
//     if (!dockPanelContains(owner, widget)) return;
//     (widget.parent.parent as DockTabPanel).currentWidget = widget;
//   }

//   /**
//    * Hide the dock panel overlay for the given dock panel.
//    */
//   export
//   function hideOverlay(owner: DockPanel): void {
//     getOverlay(owner).hide();
//   }

//   /**
//    * Show the dock panel overlay indicator at the given client position.
//    *
//    * If the position is not over a dock zone, the overlay is hidden.
//    *
//    * This returns the dock zone used to display the overlay.
//    */
//   export
//   function showOverlay(owner: DockPanel, clientX: number, clientY: number): DockZone {
//     // Find the dock target for the given client position.
//     let target = findDockTarget(owner, clientX, clientY);

//     // If the dock zone is invalid, hide the overlay and bail.
//     if (target.zone === DockZone.Invalid) {
//       hideOverlay(owner);
//       return target.zone;
//     }

//     // Setup the variables needed to compute the overlay geometry.
//     let top: number;
//     let left: number;
//     let width: number;
//     let height: number;
//     let pcr: ClientRect;
//     let box = boxSizing(owner.node); // TODO cache this?
//     let rect = owner.node.getBoundingClientRect();

//     // Compute the overlay geometry based on the dock zone.
//     switch (target.zone) {
//     case DockZone.RootTop:
//       top = box.paddingTop;
//       left = box.paddingLeft;
//       width = rect.width - box.horizontalSum;
//       height = (rect.height - box.verticalSum) / 3;
//       break;
//     case DockZone.RootLeft:
//       top = box.paddingTop;
//       left = box.paddingLeft;
//       width = (rect.width - box.horizontalSum) / 3;
//       height = rect.height - box.verticalSum;
//       break;
//     case DockZone.RootRight:
//       top = box.paddingTop;
//       width = (rect.width - box.horizontalSum) / 3;
//       left = box.paddingLeft + 2 * width;
//       height = rect.height - box.verticalSum;
//       break;
//     case DockZone.RootBottom:
//       height = (rect.height - box.verticalSum) / 3;
//       top = box.paddingTop + 2 * height;
//       left = box.paddingLeft;
//       width = rect.width - box.horizontalSum;
//       break;
//     case DockZone.RootCenter:
//       top = box.paddingTop;
//       left = box.paddingLeft;
//       width = rect.width - box.horizontalSum;
//       height = rect.height - box.verticalSum;
//       break;
//     case DockZone.PanelTop:
//       pcr = target.panel.node.getBoundingClientRect();
//       top = pcr.top - rect.top - box.borderTop;
//       left = pcr.left - rect.left - box.borderLeft;
//       width = pcr.width;
//       height = pcr.height / 2;
//       break;
//     case DockZone.PanelLeft:
//       pcr = target.panel.node.getBoundingClientRect();
//       top = pcr.top - rect.top - box.borderTop;
//       left = pcr.left - rect.left - box.borderLeft;
//       width = pcr.width / 2;
//       height = pcr.height;
//       break;
//     case DockZone.PanelRight:
//       pcr = target.panel.node.getBoundingClientRect();
//       top = pcr.top - rect.top - box.borderTop;
//       left = pcr.left - rect.left - box.borderLeft + pcr.width / 2;
//       width = pcr.width / 2;
//       height = pcr.height;
//       break;
//     case DockZone.PanelBottom:
//       pcr = target.panel.node.getBoundingClientRect();
//       top = pcr.top - rect.top - box.borderTop + pcr.height / 2;
//       left = pcr.left - rect.left - box.borderLeft;
//       width = pcr.width;
//       height = pcr.height / 2;
//       break;
//     case DockZone.PanelCenter:
//       pcr = target.panel.node.getBoundingClientRect();
//       top = pcr.top - rect.top - box.borderTop;
//       left = pcr.left - rect.left - box.borderLeft;
//       width = pcr.width;
//       height = pcr.height;
//       break;
//     }

//     // Show the overlay and return the dock zone.
//     getOverlay(owner).show(target.zone, left, top, width, height);
//     return target.zone;
//   }

//   /**
//    * Find the dock target for the given client position.
//    */
//   export
//   function findDockTarget(owner: DockPanel, clientX: number, clientY: number): IDockTarget {
//     let root = getRoot(owner);
//     if (!root) {
//       return { zone: DockZone.RootCenter, panel: null };
//     }
//     if (!hitTest(root.node, clientX, clientY)) {
//       return { zone: DockZone.Invalid, panel: null };
//     }
//     let edgeZone = getEdgeZone(root.node, clientX, clientY);
//     if (edgeZone !== DockZone.Invalid) {
//       return { zone: edgeZone, panel: null };
//     }
//     let hitPanel = iterTabPanels(root, tabs => {
//       return hitTest(tabs.node, clientX, clientY) ? tabs : void 0;
//     });
//     if (!hitPanel) {
//       return { zone: DockZone.Invalid, panel: null };
//     }
//     let panelZone = getPanelZone(hitPanel.node, clientX, clientY);
//     return { zone: panelZone, panel: hitPanel };
//   }

//   /**
//    * Drop a widget onto a dock panel using the given dock target.
//    */
//   export
//   function handleDrop(owner: DockPanel, widget: Widget, target: IDockTarget): void {
//     // Do nothing if the dock zone is invalid.
//     if (target.zone === DockZone.Invalid) {
//       return;
//     }

//     // Handle the simple case of root drops first.
//     switch(target.zone) {
//     case DockZone.RootTop:
//       owner.insertTop(widget);
//       return;
//     case DockZone.RootLeft:
//       owner.insertLeft(widget);
//       return;
//     case DockZone.RootRight:
//       owner.insertRight(widget);
//       return;
//     case DockZone.RootBottom:
//       owner.insertBottom(widget);
//       return;
//     case DockZone.RootCenter:
//       owner.insertLeft(widget);
//       return;
//     }

//     // Otherwise, it's a panel drop, and that requires more checks.

//     // Do nothing if the widget is dropped as a tab on its own panel.
//     if (target.zone === DockZone.PanelCenter) {
//       if (target.panel.childIndex(widget) !== -1) {
//         return;
//       }
//     }

//     // Do nothing if the panel only contains the drop widget.
//     if (target.panel.childCount() === 1) {
//       if (target.panel.childAt(0) === widget) {
//         return;
//       }
//     }

//     // Find a suitable reference widget for the drop.
//     let n = target.panel.childCount();
//     let ref = target.panel.childAt(n - 1);
//     if (ref === widget) {
//       ref = target.panel.childAt(n - 2);
//     }

//     // Insert the widget based on the panel zone.
//     switch(target.zone) {
//     case DockZone.PanelTop:
//       owner.insertTop(widget, ref);
//       return;
//     case DockZone.PanelLeft:
//       owner.insertLeft(widget, ref);
//       return;
//     case DockZone.PanelRight:
//       owner.insertRight(widget, ref);
//       return;
//     case DockZone.PanelBottom:
//       owner.insertBottom(widget, ref);
//       return;
//     case DockZone.PanelCenter:
//       owner.insertTabAfter(widget, ref);
//       selectWidget(owner, widget);
//       return;
//     }
//   }

//   /**
//    * A type alias for the root panel type.
//    */
//   type RootPanel = DockSplitPanel | DockTabPanel;

//   /**
//    * A private attached property for the dock panel root.
//    */
//   const rootProperty = new Property<DockPanel, RootPanel>({
//     name: 'root',
//     value: null,
//     changed: onRootChanged,
//   });

//   /**
//    * A private attached property for the dock panel overlay.
//    */
//   const overlayProperty = new Property<DockPanel, DockPanelOverlay>({
//     name: 'overlay',
//     create: createOverlay,
//   });

//   /**
//    * Get the root panel for a dock panel.
//    */
//   function getRoot(owner: DockPanel): RootPanel {
//     return rootProperty.get(owner);
//   }

//   /**
//    * Set the root panel for a dock panel.
//    */
//   function setRoot(owner: DockPanel, root: RootPanel): void {
//     rootProperty.set(owner, root);
//   }

//   /**
//    * Get the overlay for a dock panel.
//    */
//   function getOverlay(owner: DockPanel): DockPanelOverlay {
//     return overlayProperty.get(owner);
//   }

//   /**
//    * The change handler for the dock panel `rootProperty`.
//    *
//    * This will re-parent the new root and set it as the current widget.
//    *
//    * The old root is not modified.
//    */
//   function onRootChanged(owner: DockPanel, old: RootPanel, root: RootPanel): void {
//     if (!root) return;
//     let layout = owner.layout as StackedLayout;
//     layout.addChild(root);
//     root.show();
//   }

//   /**
//    * The creation handler for the dock panel `overlayProperty`.
//    *
//    * This will create and install the overlay for the panel.
//    */
//   function createOverlay(owner: DockPanel): DockPanelOverlay {
//     let overlay = new DockPanelOverlay();
//     owner.node.appendChild(overlay.node);
//     return overlay;
//   }

//   /**
//    * The change handler for the `spacing` property of a dock panel.
//    */
//   function onSpacingChanged(owner: DockPanel, old: number, spacing: number): void {
//     let root = getRoot(owner);
//     if (root instanceof DockSplitPanel) {
//       updateSpacing(root, spacing);
//     }
//   }

//   /**
//    * Recursively update the spacing of a dock split panel.
//    */
//   function updateSpacing(panel: DockSplitPanel, spacing: number): void {
//     for (let i = 0, n = panel.childCount(); i < n; ++i) {
//       let child = panel.childAt(i);
//       if (child instanceof DockSplitPanel) {
//         updateSpacing(child, spacing);
//       }
//     }
//     panel.spacing = spacing;
//   }

//   /**
//    * Throw an internal dock panel error.
//    */
//   function internalError(): void {
//     throw new Error('Internal DockPanel Error.');
//   }

//   /**
//    * Test whether a dock panel contains the given widget.
//    *
//    * For this condition to be `true`, the widget must be a logical child
//    * of a `DockTabPanel`, which itself must be a proper descendant of the
//    * given dock panel.
//    */
//   function dockPanelContains(owner: DockPanel, widget: Widget): boolean {
//     let stack = widget.parent;
//     if (!stack) {
//       return false;
//     }
//     let tabs = stack.parent;
//     if (!(tabs instanceof DockTabPanel)) {
//       return false;
//     }
//     let parent = tabs.parent;
//     while (parent) {
//       if (parent === owner) {
//         return true;
//       }
//       if (!(parent instanceof DockSplitPanel)) {
//         return false;
//       }
//       parent = parent.parent;
//     }
//     return false;
//   }

//   /**
//    * Find the ancestor dock tab panel for the given widget.
//    *
//    * This assumes the widget already belongs to a dock panel, and will
//    * throw an error if that assumption does not hold.
//    */
//   function findTabPanel(widget: Widget): DockTabPanel {
//     let stack = widget.parent;
//     if (!stack) {
//       internalError();
//     }
//     let tabs = stack.parent;
//     if (!(tabs instanceof DockTabPanel)) {
//       internalError();
//     }
//     return tabs as DockTabPanel;
//   }

//   /**
//    * Find the first dock tab panel for the given dock panel.
//    *
//    * This returns `null` if the dock panel has no content. It will throw
//    * an error if the structure of the dock panel is found to be invalid.
//    */
//   function findFirstTabPanel(owner: DockPanel): DockTabPanel {
//     let root = getRoot(owner);
//     while (root) {
//       if (root instanceof DockTabPanel) {
//         return root;
//       }
//       if (!(root instanceof DockSplitPanel) || root.childCount() === 0) {
//         internalError();
//       }
//       root = root.childAt(0) as RootPanel;
//     }
//     return null;
//   }

//   /**
//    * Get or create the first dock tab panel for the given dock panel.
//    *
//    * If dock panel has no root, a new tab panel will be created and
//    * added as the root. An error will be thrown if the structure of
//    * the dock panel is found to be invalid.
//    */
//   function ensureFirstTabPanel(owner: DockPanel): DockTabPanel {
//     let tabs = findFirstTabPanel(owner);
//     if (!tabs) {
//       tabs = createTabPanel();
//       setRoot(owner, tabs);
//     }
//     return tabs;
//   }

//   /**
//    * Ensure the root panel is a splitter with the given orientation.
//    *
//    * This will throw an error if the panel does not have a current root,
//    * since that would violate the invariants of the dock panel structure.
//    */
//   function ensureSplitRoot(owner: DockPanel, orientation: Orientation): DockSplitPanel {
//     let oldRoot = getRoot(owner);
//     if (!oldRoot) {
//       internalError();
//     }
//     if (oldRoot instanceof DockSplitPanel) {
//       if (oldRoot.orientation === orientation) {
//         return oldRoot;
//       }
//       if (oldRoot.childCount() <= 1) {
//         oldRoot.orientation = orientation;
//         return oldRoot;
//       }
//     }
//     let newRoot = new DockSplitPanel(orientation, owner.spacing);
//     newRoot.addChild(oldRoot);
//     setRoot(owner, newRoot);
//     return newRoot;
//   }

//   /**
//    * Validate the insert arguments for a dock panel.
//    *
//    * This will throw an error if the target widget is null, or if the
//    * reference widget is not null and not contained by the dock panel.
//    */
//   function validateInsertArgs(owner: DockPanel, widget: Widget, ref: Widget): void {
//     if (!widget) {
//       throw new Error('Target widget is null.');
//     }
//     if (ref && !dockPanelContains(owner, ref)) {
//       throw new Error('Reference widget not contained by the dock panel.');
//     }
//   }

//   /**
//    * Recursively iterate over the dock tab panels of a root panel.
//    *
//    * Iteration stops if the callback returns anything but `undefined`.
//    */
//   function iterTabPanels<T>(root: RootPanel, callback: (tabs: DockTabPanel) => T): T {
//     if (root instanceof DockTabPanel) {
//       return callback(root);
//     }
//     if (!(root instanceof DockSplitPanel)) {
//       internalError();
//     }
//     for (let i = 0; i < root.childCount(); ++i) {
//       let child = root.childAt(i) as RootPanel;
//       let result = iterTabPanels(child, callback);
//       if (result !== void 0) return result;
//     }
//     return void 0;
//   }

//   /**
//    * Get the root edge zone for the given node and client position.
//    *
//    * This assumes the position lies within the node's client rect.
//    *
//    * Returns the `Invalid` zone if the position is not within an edge.
//    */
//   function getEdgeZone(node: HTMLElement, x: number, y: number): DockZone {
//     let zone: DockZone;
//     let rect = node.getBoundingClientRect();
//     if (x < rect.left + EDGE_SIZE) {
//       if (y - rect.top < x - rect.left) {
//         zone = DockZone.RootTop;
//       } else if (rect.bottom - y < x - rect.left) {
//         zone = DockZone.RootBottom;
//       } else {
//         zone = DockZone.RootLeft;
//       }
//     } else if (x >= rect.right - EDGE_SIZE) {
//       if (y - rect.top < rect.right - x) {
//         zone = DockZone.RootTop;
//       } else if (rect.bottom - y < rect.right - x) {
//         zone = DockZone.RootBottom;
//       } else {
//         zone = DockZone.RootRight;
//       }
//     } else if (y < rect.top + EDGE_SIZE) {
//       zone = DockZone.RootTop;
//     } else if (y >= rect.bottom - EDGE_SIZE) {
//       zone = DockZone.RootBottom;
//     } else {
//       zone = DockZone.Invalid;
//     }
//     return zone;
//   }

//   /**
//    * Get the panel zone for the given node and position.
//    *
//    * This assumes the position lies within the node's client rect.
//    *
//    * This always returns a valid zone.
//    */
//   function getPanelZone(node: HTMLElement, x: number, y: number): DockZone {
//     let zone: DockZone;
//     let rect = node.getBoundingClientRect();
//     let fracX = (x - rect.left) / rect.width;
//     let fracY = (y - rect.top) / rect.height;
//     if (fracX < 1 / 3) {
//       if (fracY < fracX) {
//         zone = DockZone.PanelTop;
//       } else if (1 - fracY < fracX) {
//         zone = DockZone.PanelBottom;
//       } else {
//         zone = DockZone.PanelLeft;
//       }
//     } else if (fracX < 2 / 3) {
//       if (fracY < 1 / 3) {
//         zone = DockZone.PanelTop;
//       } else if (fracY < 2 / 3) {
//         zone = DockZone.PanelCenter;
//       } else {
//         zone = DockZone.PanelBottom;
//       }
//     } else {
//       if (fracY < 1 - fracX) {
//         zone = DockZone.PanelTop;
//       } else if (fracY > fracX) {
//         zone = DockZone.PanelBottom;
//       } else {
//         zone = DockZone.PanelRight;
//       }
//     }
//     return zone;
//   }

//   /**
//    * The current tab drag object.
//    */
//   let currentDrag: Drag = null;

//   /**
//    * Create a new tab panel for a dock panel.
//    */
//   function createTabPanel(): DockTabPanel {
//     let panel = new DockTabPanel();
//     panel.tabBar.tabDetachRequested.connect(onTabDetachRequested);
//     panel.stackedPanel.widgetRemoved.connect(onWidgetRemoved);
//     return panel;
//   }

//   /**
//    * Remove an empty dock tab panel from the hierarchy.
//    *
//    * This ensures that the hierarchy is kept consistent by merging an
//    * ancestor split panel when it contains only a single child widget.
//    */
//   function removeTabPanel(tabPanel: DockTabPanel): void {
//     // Assert the tab panel is empty.
//     if (tabPanel.childCount() !== 0) {
//       internalError();
//     }

//     // If the parent of the tab panel is a dock panel, just remove it.
//     if (tabPanel.parent instanceof DockPanel) {
//       setRoot(tabPanel.parent as DockPanel, null);
//       tabPanel.dispose();
//       return;
//     }

//     // Assert the tab panel parent is a dock split panel.
//     if (!(tabPanel.parent instanceof DockSplitPanel)) {
//       internalError();
//     }

//     // Cast the tab panel parent to a dock split panel.
//     let splitPanel = tabPanel.parent as DockSplitPanel;

//     // Assert the split panel has at least two children.
//     if (splitPanel.childCount() < 2) {
//       internalError();
//     }

//     // Dispose the tab panel to ensure its resources are released.
//     tabPanel.dispose();

//     // If the split panel still has multiple children, there is
//     // nothing more to do.
//     if (splitPanel.childCount() > 1) {
//       return;
//     }

//     // Extract the remaining child from the split panel.
//     let child = splitPanel.childAt(0);

//     // Assert the remaining child is a proper panel type.
//     if (!(child instanceof DockTabPanel) && !(child instanceof DockSplitPanel)) {
//       internalError();
//     }

//     // If the parent of the split panel is a dock panel, replace it.
//     if (splitPanel.parent instanceof DockPanel) {
//       setRoot(splitPanel.parent as DockPanel, child as RootPanel);
//       splitPanel.dispose();
//       return;
//     }

//     // Assert the split panel parent is a dock split panel.
//     if (!(splitPanel.parent instanceof DockSplitPanel)) {
//       internalError();
//     }

//     // Cast the split panel parent to a dock split panel.
//     let grandPanel = splitPanel.parent as DockSplitPanel;

//     // If the child is a dock tab panel, replace the split panel.
//     if (child instanceof DockTabPanel) {
//       let sizes = grandPanel.sizes();
//       let index = grandPanel.childIndex(splitPanel);
//       splitPanel.parent = null;
//       grandPanel.insertChild(index, child);
//       grandPanel.setSizes(sizes);
//       splitPanel.dispose();
//       return;
//     }

//     // Cast the child to a dock split panel.
//     let childSplit = child as DockSplitPanel;

//     // Child splitters have an orthogonal orientation to their parent.
//     // Assert the orientation of the child matches the grand parent.
//     if (childSplit.orientation !== grandPanel.orientation) {
//       internalError();
//     }

//     // The grand children can now be merged with their grand parent.
//     // Start by fetching the relevant current sizes and insert index.
//     let index = grandPanel.childIndex(splitPanel);
//     let childSizes = childSplit.sizes();
//     let grandSizes = grandPanel.sizes();

//     // Remove the split panel and store its share of the size.
//     splitPanel.parent = null;
//     let sizeShare = arrays.removeAt(grandSizes, index);

//     // Merge the grand children and maintain their relative size.
//     for (let i = 0; childSplit.childCount() !== 0; ++i) {
//       grandPanel.insertChild(index + i, childSplit.childAt(0));
//       arrays.insert(grandSizes, index + i, sizeShare * childSizes[i]);
//     }

//     // Update the grand parent sizes and dispose the removed panel.
//     grandPanel.setSizes(grandSizes);
//     splitPanel.dispose();
//   }

//   /**
//    * Handle the `tabDetachRequested` signal from a dock tab bar.
//    */
//   function onTabDetachRequested(sender: TabBar, args: ITabDetachArgs): void {
//     // Do nothing if a drag is already in progress.
//     if (currentDrag) {
//       return;
//     }

//     // Release the tab bar's hold on the mouse.
//     sender.releaseMouse();

//     // Setup the mime data for the drag operation.
//     let mimeData = new MimeData();
//     let widget = args.item as Widget;
//     mimeData.setData(FACTORY_MIME, () => widget);

//     // Create the drag image for the drag operation.
//     let tab = sender.tabAt(args.index);
//     let dragImage = tab.cloneNode(true) as HTMLElement;

//     // Create the drag object to manage the drag-drop operation.
//     currentDrag = new Drag({
//       mimeData: mimeData,
//       dragImage: dragImage,
//       proposedAction: DropAction.Move,
//       supportedActions: DropActions.Move,
//     });

//     // Start the drag operation and cleanup when done.
//     tab.classList.add(HIDDEN_CLASS);
//     currentDrag.start(args.clientX, args.clientY).then(() => {
//       currentDrag = null;
//       tab.classList.remove(HIDDEN_CLASS);
//     });
//   }

//   /**
//    * Handle the `widgetRemvoed` signal for a dock stacked panel.
//    */
//   function onWidgetRemoved(sender: StackedPanel, widget: Widget): void {
//     if (sender.childCount() === 0) {
//       removeTabPanel(sender.parent as DockTabPanel);
//     }
//   }
// }
