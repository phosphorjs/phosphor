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
  Vector
} from '../collections/vector';

import {
  Message
} from '../core/messaging';

import {
  AttachedProperty
} from '../core/properties';

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
  StackedLayout
} from './stackedpanel';

import {
  SplitPanel
} from './splitpanel';

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
    this.layout = new StackedLayout();
    if (options.spacing !== void 0) {
      this._spacing = Private.clampSpacing(options.spacing);
    }
  }

  /**
   * The dock indicator overlay.
   *
   * #### Notes
   * User code may customize the overlay node as needed.
   *
   * This is a read-only property.
   */
  get overlay(): DockOverlay {
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
   * Add a widget to the dock panel.
   *
   * @param widget - The widget to add into the dock panel.
   *
   * @param ref - The reference widget specifying the insert point.
   *
   * #### Notes
   * This will add the widget as a tab after the reference widget.
   *
   * If the reference widget is `null`, a sensible default is used.
   */
  addWidget(widget: Widget, ref?: Widget): void {
    this.insertWidget('tab-after', widget, ref);
  }

  /**
   * Insert a widget into the dock panel.
   *
   * @param location - The location to add the widget.
   *
   * @param widget - The widget to insert into the dock panel.
   *
   * @param ref - The reference widget specifying the insert point.
   *
   * #### Notes
   * If the reference widget is `null`, a sensible default is used.
   */
  insertWidget(location: DockPanel.Location, widget: Widget, ref: Widget = null): void {
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

    // Insert the widget based on the specified location.
    this._insertWidget(location, widget, ref);

    // TODO focus the insert widget?
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
    if (!hitTest(this.node, clientX, clientY)) {
      return { zone: 'invalid', panel: null };
    }

    // If there is no root, indicate a center drop position.
    if (!this._root) {
      return { zone: 'root-center', panel: null };
    }

    // Test for a root zone first.
    let zone = Private.getRootZone(this.node, clientX, clientY);
    if (zone !== 'invalid') {
      return { zone, panel: null };
    }

    // Find the panel at the client position.
    let panel = find(this._tabPanels, panel => {
      return hitTest(panel.node, clientX, clientY);
    }) || null;

    // Compute the zone for the hit panel, if any.
    if (panel) {
      zone = Private.getPanelZone(panel.node, clientX, clientY);
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
      this._overlay.hide();
      return target.zone;
    }

    // Setup the variables needed to compute the overlay geometry.
    let top: number;
    let left: number;
    let width: number;
    let height: number;
    let cr: ClientRect;
    let box = boxSizing(this.node); // TODO cache this?
    let rect = this.node.getBoundingClientRect();

    // Compute the overlay geometry based on the dock zone.
    switch (target.zone) {
    case 'root-top':
      top = box.paddingTop;
      left = box.paddingLeft;
      width = rect.width - box.horizontalSum;
      height = (rect.height - box.verticalSum) / 3;
      break;
    case 'root-left':
      top = box.paddingTop;
      left = box.paddingLeft;
      width = (rect.width - box.horizontalSum) / 3;
      height = rect.height - box.verticalSum;
      break;
    case 'root-right':
      top = box.paddingTop;
      width = (rect.width - box.horizontalSum) / 3;
      left = box.paddingLeft + 2 * width;
      height = rect.height - box.verticalSum;
      break;
    case 'root-bottom':
      height = (rect.height - box.verticalSum) / 3;
      top = box.paddingTop + 2 * height;
      left = box.paddingLeft;
      width = rect.width - box.horizontalSum;
      break;
    case 'root-center':
      top = box.paddingTop;
      left = box.paddingLeft;
      width = rect.width - box.horizontalSum;
      height = rect.height - box.verticalSum;
      break;
    case 'panel-top':
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      width = cr.width;
      height = cr.height / 2;
      break;
    case 'panel-left':
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      width = cr.width / 2;
      height = cr.height;
      break;
    case 'panel-right':
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft + cr.width / 2;
      width = cr.width / 2;
      height = cr.height;
      break;
    case 'panel-bottom':
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop + cr.height / 2;
      left = cr.left - rect.left - box.borderLeft;
      width = cr.width;
      height = cr.height / 2;
      break;
    case 'panel-center':
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      width = cr.width;
      height = cr.height;
      break;
    }

    // Show the overlay at the computed position.
    this._overlay.show(target.zone, left, top, width, height);

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
    let node = this.node;
    node.addEventListener('p-dragenter', this);
    node.addEventListener('p-dragleave', this);
    node.addEventListener('p-dragover', this);
    node.addEventListener('p-drop', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    let node = this.node;
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
      this._overlay.hide();
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
    this._overlay.hide();

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
      this.insertWidget('split-top', widget);
      return;
    case 'root-left':
      this.insertWidget('split-left', widget);
      return;
    case 'root-right':
      this.insertWidget('split-right', widget);
      return;
    case 'root-bottom':
      this.insertWidget('split-bottom', widget);
      return;
    case 'root-center':
      this.insertWidget('split-left', widget);
      return;
    }

    // Otherwise, it's a panel drop, and that requires more checks.

    // Fetch the children of the target panel.
    let children = target.panel.widgets;

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
      this.insertWidget('split-top', widget, ref);
      return;
    case 'panel-left':
      this.insertWidget('split-left', widget, ref);
      return;
    case 'panel-right':
      this.insertWidget('split-right', widget, ref);
      return;
    case 'panel-bottom':
      this.insertWidget('split-bottom', widget, ref);
      return;
    case 'panel-center':
      this.insertWidget('tab-after', widget, ref);
      return;
    }
  }

  /**
   * Insert a widget into the dock panel using the given location.
   *
   * The target widget should have no parent, and the reference widget
   * should either be null or a widget contained in the dock panel.
   */
  private _insertWidget(location: DockPanel.Location, widget: Widget, ref: Widget): void {
    // Determine whether the insert is before or after the ref.
    let after = (
      location === 'tab-after' ||
      location === 'split-right' ||
      location === 'split-bottom'
    );

    // Handle the simple case of adding to a tab panel.
    if (location === 'tab-before' || location === 'tab-after') {
      if (ref) {
        let tabPanel = ref.parent.parent as TabPanel;
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
    if (location === 'split-top' || location === 'split-bottom') {
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
      let sizes = splitPanel.sizes();
      let index = after ? sizes.length : 0;
      sizes.splice(index, 0, 0.5);
      splitPanel.insertWidget(index, tabPanel);
      splitPanel.setSizes(sizes);
      return;
    }

    // Lookup the tab panel for the ref widget.
    let refTabPanel = ref.parent.parent as TabPanel;

    // If the ref tab panel is the root, split the root.
    if (this._root === refTabPanel) {
      let splitPanel = this._ensureSplitRoot(orientation);
      splitPanel.insertWidget(after ? 1 : 0, tabPanel);
      splitPanel.setSizes([1, 1]);
      return;
    }

    // Otherwise, the ref tab panel parent is a split panel.
    let splitPanel = refTabPanel.parent as SplitPanel;

    // If the split panel is the correct orientation, the widget
    // can be inserted directly and sized to 0.5 of the ref space.
    if (splitPanel.orientation === orientation) {
      let i = indexOf(splitPanel.widgets, refTabPanel);
      let index = after ? i + 1 : i;
      let sizes = splitPanel.sizes();
      let size = sizes[i] = sizes[i] / 2;
      sizes.splice(index, 0, size);
      splitPanel.insertWidget(index, tabPanel);
      splitPanel.setSizes(sizes);
      return;
    }

    // If the split panel only has a single child, its orientation
    // can be changed directly and its sizes set to a 1:1 ratio.
    if (splitPanel.widgets.length === 1) {
      splitPanel.orientation = orientation;
      splitPanel.insertWidget(after ? 1 : 0, tabPanel);
      splitPanel.setSizes([1, 1]);
      return;
    }

    // Otherwise, a new split panel with the correct orientation needs
    // to be created to hold the ref panel and tab panel, and inserted
    // at the previous location of the ref panel.
    let sizes = splitPanel.sizes();
    let i = indexOf(splitPanel.widgets, refTabPanel);
    let childSplit = this._createSplitPanel(orientation);
    childSplit.insertWidget(0, refTabPanel);
    childSplit.insertWidget(after ? 1 : 0, tabPanel);
    splitPanel.insertWidget(i, childSplit);
    splitPanel.setSizes(sizes);
    childSplit.setSizes([1, 1]);
  }

  /**
   * Create a new tab panel for adding to the dock panel.
   */
  private _createTabPanel(): TabPanel {
    let panel = new TabPanel({ tabsMovable: true });
    return panel;
  }

  /**
   * Create a new split panel for adding to the dock panel.
   */
  private _createSplitPanel(orientation: SplitPanel.Orientation): SplitPanel {
    let panel = new SplitPanel({ orientation, spacing: this._spacing });
    return panel;
  }

  /**
   * Ensure a tab panel is available in the dock panel.
   *
   * TODO...
   */
  private _ensureTabPanel(): TabPanel {
    // If there is no root panel, create a new root tab panel.
    if (!this._root) {
      let panel = this._createTabPanel();
      this._setRoot(panel);
      return panel;
    }

    // Otherwise, use the tab panel of the active widget. Since
    // the
    return null;
    //
    // let target = max(this._widgets, Private.cmpSemanticFocusNumber);

    // //
    // return target.parent.parent as TabPanel;
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
   * Set the root widget for the dock panel.
   */
  private _setRoot(root: TabPanel | SplitPanel): void {
    this._root = root;
    (this.layout as StackedLayout).addWidget(root);
    root.show();
  }

  private _spacing = 4;
  private _drag: Drag = null;
  private _overlay: DockOverlay;
  private _widgets = new Vector<Widget>();
  private _tabPanels = new Vector<TabPanel>();
  private _splitPanels = new Vector<SplitPanel>();
  private _tracker = new FocusTracker<Widget>();
  private _root: TabPanel | SplitPanel = null;
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
     * The spacing between tab panels in the dock panel.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * A type alias for the supported dock panel locations.
   *
   * A dock location is used to specify how a widget should be added
   * to the dock panel relative to a reference widget.
   */
  export
  type Location = (
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
    panel: TabPanel;
  }
}


/**
 * A class which manages an overlay node for a dock panel.
 */
export
class DockOverlay {
  /**
   * Construct a new dock overlay.
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
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Show the overlay with the given zone and geometry
   *
   * @param zone - The dock zone for the overlay.
   *
   * @param left - The offset left position for the overlay.
   *
   * @param top - The offset top position for the overlay.
   *
   * @param width - The offset width for the overlay.
   *
   * @param height - The offset height for the overlay.
   */
  show(zone: DockPanel.Zone, left: number, top: number, width: number, height: number): void {
    let style = this._node.style;
    style.top = `${top}px`;
    style.left = `${left}px`;
    style.width = `${width}px`;
    style.height = `${height}px`;
    this._setZone(zone);
    this._showIfHidden();
  }

  /**
   * Hide the overlay.
   */
  hide(): void {
    this._hideIfVisible();
    this._setZone('invalid');
  }

  /**
   * Show the underlying node, if hidden.
   */
  private _showIfHidden(): void {
    if (this._hidden) {
      this._hidden = false;
      this._node.classList.remove(HIDDEN_CLASS);
    }
  }

  /**
   * Hide the underlying node, if visible.
   */
  private _hideIfVisible(): void {
    if (!this._hidden) {
      this._hidden = true;
      this._node.classList.add(HIDDEN_CLASS);
    }
  }

  /**
   * Set the dock zone for the overlay.
   */
  private _setZone(zone: DockPanel.Zone): void {
    if (zone === this._zone) {
      return;
    }
    let oldClass = DockOverlay.createZoneClass(this._zone);
    let newClass = DockOverlay.createZoneClass(zone);
    if (oldClass) this._node.classList.remove(oldClass);
    if (newClass) this._node.classList.add(newClass);
    this._zone = zone;
  }

  private _hidden = true;
  private _node: HTMLElement;
  private _zone: DockPanel.Zone = 'invalid';
}


/**
 * The namespace for the `DockOverlay` class statics.
 */
export
namespace DockOverlay {
  /**
   * Create the modifier class name for an overlay zone.
   *
   * @param zone - The dock zone of interest.
   *
   * @returns A modifier class name for the overlay zone.
   */
  export
  function createZoneClass(zone: DockPanel.Zone): string {
    return zone !== 'invalid' ? `p-mod-${zone}` : '';
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
