/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message
} from '../core/messaging';

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
    Private.syncSpacing(this._root, value);
  }

  /**
   * Add a widget to the dock panel.
   *
   * @param location - The location to add the widget.
   *
   * @param widget - The widget to insert into the dock panel.
   *
   * @param ref - The reference widget, if needed for the location.
   *
   * @throws An error if the combination of location, widget, and
   *   reference is invalid.
   */
  addWidget(location: DockPanel.Location, widget: Widget, ref?: Widget): void {

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
    if (event.mimeData.hasData(FACTORY_MIME)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Handle the `'p-dragleave'` event for the dock panel.
   */
  private _evtDragLeave(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    let related = event.relatedTarget as HTMLElement;
    if (!related || !this.node.contains(related)) {
      this._overlay.hide();
    }
  }

  /**
   * Handle the `'p-dragover'` event for the dock panel.
   */
  private _evtDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    let zone = this._showOverlay(event.clientX, event.clientY);
    if (zone === Private.DockZone.Invalid) {
      event.dropAction = 'none';
    } else {
      event.dropAction = event.proposedAction;
    }
  }

  /**
   * Handle the `'p-drop'` event for the dock panel.
   */
  private _evtDrop(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this._overlay.hide();
    if (event.proposedAction === 'none') {
      event.dropAction = 'none';
      return;
    }
    let x = event.clientX;
    let y = event.clientY;
    let target = Private.findDockTarget(this._root, x, y);
    if (target.zone === Private.DockZone.Invalid) {
      event.dropAction = 'none';
      return;
    }
    let factory = event.mimeData.getData(FACTORY_MIME);
    if (typeof factory !== 'function') {
      event.dropAction = 'none';
      return;
    }
    let widget = factory();
    if (!(widget instanceof Widget)) {
      event.dropAction = 'none';
      return;
    }
    this._handleDrop(widget, target);
    event.dropAction = event.proposedAction;
  }

  /**
   * Show the dock panel overlay at the given client position.
   *
   * If the position is not over a dock zone, the overlay is hidden.
   *
   * This returns the dock zone used to display the overlay.
   */
  private _showOverlay(clientX: number, clientY: number): Private.DockZone {
    // Find the dock target for the given client position.
    let target = Private.findDockTarget(this._root, clientX, clientY);

    // If the dock zone is invalid, hide the overlay and bail.
    if (target.zone === Private.DockZone.Invalid) {
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
    case Private.DockZone.RootTop:
      top = box.paddingTop;
      left = box.paddingLeft;
      width = rect.width - box.horizontalSum;
      height = (rect.height - box.verticalSum) / 3;
      break;
    case Private.DockZone.RootLeft:
      top = box.paddingTop;
      left = box.paddingLeft;
      width = (rect.width - box.horizontalSum) / 3;
      height = rect.height - box.verticalSum;
      break;
    case Private.DockZone.RootRight:
      top = box.paddingTop;
      width = (rect.width - box.horizontalSum) / 3;
      left = box.paddingLeft + 2 * width;
      height = rect.height - box.verticalSum;
      break;
    case Private.DockZone.RootBottom:
      height = (rect.height - box.verticalSum) / 3;
      top = box.paddingTop + 2 * height;
      left = box.paddingLeft;
      width = rect.width - box.horizontalSum;
      break;
    case Private.DockZone.RootCenter:
      top = box.paddingTop;
      left = box.paddingLeft;
      width = rect.width - box.horizontalSum;
      height = rect.height - box.verticalSum;
      break;
    case Private.DockZone.PanelTop:
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      width = cr.width;
      height = cr.height / 2;
      break;
    case Private.DockZone.PanelLeft:
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft;
      width = cr.width / 2;
      height = cr.height;
      break;
    case Private.DockZone.PanelRight:
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop;
      left = cr.left - rect.left - box.borderLeft + cr.width / 2;
      width = cr.width / 2;
      height = cr.height;
      break;
    case Private.DockZone.PanelBottom:
      cr = target.panel.node.getBoundingClientRect();
      top = cr.top - rect.top - box.borderTop + cr.height / 2;
      left = cr.left - rect.left - box.borderLeft;
      width = cr.width;
      height = cr.height / 2;
      break;
    case Private.DockZone.PanelCenter:
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
   *
   */
  private _handleDrop(widget: Widget, target: Private.IDockTarget): void {

  }

  private _spacing = 4;
  private _drag: Drag = null;
  private _root: Private.DockPanelChild;
  private _overlay: Private.DockPanelOverlay;
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
     * The spacing between items in the panel.
     *
     * The default is `4`.
     */
    spacing?: number;
  }

  /**
   * A type alias for the supported dock panel locations.
   *
   * A location is used to specify *how* a widget should be added to
   * a dock panel when calling `insertWidget()`. Some locations must
   * be paired with a reference widget which has *already* been added
   * to the dock panel.
   */
  export
  type Location = (
    /**
     * The top-most area of the dock panel.
     *
     * The widget will span horizontally above all other widgets.
     */
    'top' |

    /**
     * The left-most area of the dock panel.
     *
     * The widget will span vertically to the left all other widgets.
     */
    'left' |

    /**
     * The right-most area of the dock panel.
     *
     * The widget will span vertically to the right all other widgets.
     */
    'right' |

    /**
     * The bottom-most area of the dock panel.
     *
     * The widget will span horizontally below all other widgets.
     */
    'bottom' |

    /**
     * The area to the top of the reference widget.
     *
     * The widget will be inserted just above the reference widget.
     */
    'split-top' |

    /**
     * The area to the left of the reference widget.
     *
     * The widget will be inserted just left of the reference widget.
     */
    'split-left' |

    /**
     * The area to the right of the reference widget.
     *
     * The widget will be inserted just right of the reference widget.
     */
    'split-right' |

    /**
     * The area to the bottom of the reference widget.
     *
     * The widget will be inserted just below the reference widget.
     */
    'split-bottom' |

    /**
     * The tab position before the reference widget.
     *
     * The widget will be added as a tab before the reference widget.
     */
    'tab-before' |

    /**
     * The tab position after the reference widget.
     *
     * The widget will be added as a tab after the reference widget.
     */
    'tab-after'
  );
}


/**
 * The namespace for the module private data.
 */
namespace Private {
  /**
   * An enum of the dock zones for a dock panel.
   */
  export
  const enum DockZone {
    /**
     * The dock zone at the top of the root panel.
     */
    RootTop,

    /**
     * The dock zone at the left of the root panel.
     */
    RootLeft,

    /**
     * The dock zone at the right of the root panel.
     */
    RootRight,

    /**
     * The dock zone at the bottom of the root panel.
     */
    RootBottom,

    /**
     * The dock zone at the center of the root panel.
     */
    RootCenter,

    /**
     * The dock zone at the top third of a tab panel.
     */
    PanelTop,

    /**
     * The dock zone at the left third of a tab panel.
     */
    PanelLeft,

    /**
     * The dock zone at the right third of a tab panel.
     */
    PanelRight,

    /**
     * The dock zone at the bottom third of a tab panel.
     */
    PanelBottom,

    /**
     * The dock zone at the center of a tab panel.
     */
    PanelCenter,

    /**
     * An invalid dock zone.
     */
    Invalid
  }

  /**
   * A class which manages an overlay node for a dock panel.
   */
  export
  class DockPanelOverlay {
    /**
     * A mapping of dock zone enum value to modifier class.
     */
    static ZoneClasses = [  // keep in-sync with the DockZone enum
      ROOT_TOP_CLASS,
      ROOT_LEFT_CLASS,
      ROOT_RIGHT_CLASS,
      ROOT_BOTTOM_CLASS,
      ROOT_CENTER_CLASS,
      PANEL_TOP_CLASS,
      PANEL_LEFT_CLASS,
      PANEL_RIGHT_CLASS,
      PANEL_BOTTOM_CLASS,
      PANEL_CENTER_CLASS
    ];

    /**
     * Construct a new dock panel overlay.
     */
    constructor() {
      this._node = document.createElement('div');
      this._node.classList.add(OVERLAY_CLASS);
      this._node.classList.add(HIDDEN_CLASS);
      this._node.style.position = 'absolute';
    }

    /**
     * The DOM node for the overlay.
     */
    get node(): HTMLElement {
      return this._node;
    }

    /**
     * Show the overlay with the given zone and geometry
     */
    show(zone: DockZone, left: number, top: number, width: number, height: number): void {
      let style = this._node.style;
      style.top = `${top}px`;
      style.left = `${left}px`;
      style.width = `${width}px`;
      style.height = `${height}px`;
      this._node.classList.remove(HIDDEN_CLASS);
      this._setZone(zone);
    }

    /**
     * Hide the overlay and reset its zone.
     */
    hide(): void {
      this._node.classList.add(HIDDEN_CLASS);
      this._setZone(DockZone.Invalid);
    }

    /**
     * Set the dock zone for the overlay.
     */
    private _setZone(zone: DockZone): void {
      if (zone === this._zone) {
        return;
      }
      let oldClass = DockPanelOverlay.ZoneClasses[this._zone];
      let newClass = DockPanelOverlay.ZoneClasses[zone];
      if (oldClass) this._node.classList.remove(oldClass);
      if (newClass) this._node.classList.add(newClass);
      this._zone = zone;
    }

    private _node: HTMLElement;
    private _zone = DockZone.Invalid;
  }

  /**
   * A custom tab panel used by a DockPanel.
   */
  export
  class DockTabPanel extends TabPanel {
    /**
     * Construct a new dock tab panel.
     */
    constructor(options: TabPanel.IOptions = {}) {
      super(options);
      this.addClass(TAB_PANEL_CLASS);
    }
  }

  /**
   * A custom split panel used by a DockPanel.
   */
  export
  class DockSplitPanel extends SplitPanel {
    /**
     * Construct a new dock split panel.
     */
    constructor(options: SplitPanel.IOptions = {}) {
      super(options);
      this.addClass(SPLIT_PANEL_CLASS);
    }
  }

  /**
   * A type alias for a dock panel child.
   */
  export
  type DockPanelChild = DockTabPanel | DockSplitPanel;

  /**
   * The result object for a dock target hit test.
   */
  export
  interface IDockTarget {
    /**
     * The dock zone at the specified position.
     *
     * This will be `Invalid` if the position is not over a dock zone.
     */
    zone: DockZone;

    /**
     * The dock tab panel for the panel dock zone.
     *
     * This will be `null` if the dock zone is not a panel zone.
     */
    panel: DockTabPanel;
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * Synchronize the spacing value for the dock split panels.
   */
  export
  function syncSpacing(root: DockPanelChild, value: number): void {
    // Bail if the child is a tab panel.
    if (root instanceof DockTabPanel) {
      return;
    }

    // Update the spacing for the split panel.
    (root as DockSplitPanel).spacing = value;

    // Recursively update the split panel children.
    let widgets = root.widgets;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      syncSpacing(widgets.at(i) as DockPanelChild, value);
    }
  }

  /**
   * Find the dock target for the given client position.
   */
  export
  function findDockTarget(root: DockPanelChild, clientX: number, clientY: number): IDockTarget {
    if (!hitTest(root.node, clientX, clientY)) {
      return { zone: DockZone.Invalid, panel: null };
    }
    let rootZone = getRootZone(root.node, clientX, clientY);
    if (rootZone !== DockZone.Invalid) {
      return { zone: rootZone, panel: null };
    }
    let hitPanel = iterTabPanels(root, panel => {
      return hitTest(panel.node, clientX, clientY) ? panel : void 0;
    });
    if (!hitPanel) {
      return { zone: DockZone.Invalid, panel: null };
    }
    let panelZone = getPanelZone(hitPanel.node, clientX, clientY);
    return { zone: panelZone, panel: hitPanel };
  }

  /**
   * Get the root zone for the given node and client position.
   *
   * This assumes the position lies within the node's client rect.
   *
   * Returns the `Invalid` zone if the position is not within an edge.
   */
  function getRootZone(node: HTMLElement, x: number, y: number): DockZone {
    let zone: DockZone;
    let rect = node.getBoundingClientRect();
    if (x < rect.left + EDGE_SIZE) {
      if (y - rect.top < x - rect.left) {
        zone = DockZone.RootTop;
      } else if (rect.bottom - y < x - rect.left) {
        zone = DockZone.RootBottom;
      } else {
        zone = DockZone.RootLeft;
      }
    } else if (x >= rect.right - EDGE_SIZE) {
      if (y - rect.top < rect.right - x) {
        zone = DockZone.RootTop;
      } else if (rect.bottom - y < rect.right - x) {
        zone = DockZone.RootBottom;
      } else {
        zone = DockZone.RootRight;
      }
    } else if (y < rect.top + EDGE_SIZE) {
      zone = DockZone.RootTop;
    } else if (y >= rect.bottom - EDGE_SIZE) {
      zone = DockZone.RootBottom;
    } else {
      zone = DockZone.Invalid;
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
  function getPanelZone(node: HTMLElement, x: number, y: number): DockZone {
    let zone: DockZone;
    let rect = node.getBoundingClientRect();
    let fracX = (x - rect.left) / rect.width;
    let fracY = (y - rect.top) / rect.height;
    if (fracX < 1 / 3) {
      if (fracY < fracX) {
        zone = DockZone.PanelTop;
      } else if (1 - fracY < fracX) {
        zone = DockZone.PanelBottom;
      } else {
        zone = DockZone.PanelLeft;
      }
    } else if (fracX < 2 / 3) {
      if (fracY < 1 / 3) {
        zone = DockZone.PanelTop;
      } else if (fracY < 2 / 3) {
        zone = DockZone.PanelCenter;
      } else {
        zone = DockZone.PanelBottom;
      }
    } else {
      if (fracY < 1 - fracX) {
        zone = DockZone.PanelTop;
      } else if (fracY > fracX) {
        zone = DockZone.PanelBottom;
      } else {
        zone = DockZone.PanelRight;
      }
    }
    return zone;
  }

  /**
   * Recursively iterate over the tab panels of a root panel.
   *
   * Iteration stops if the callback returns anything but `undefined`.
   */
  function iterTabPanels<T>(root: DockPanelChild, callback: (tabs: DockTabPanel) => T): T {
    // If the root is a tab panel, just invoke the callback.
    if (root instanceof DockTabPanel) {
      return callback(root);
    }

    // Otherwise, recursively invoke for the split panel children.
    let widgets = root.widgets;
    for (let i = 0, n = widgets.length; i < n; ++i) {
      let panel = widgets.at(i) as DockPanelChild;
      let result = iterTabPanels(panel, callback);
      if (result !== void 0) return result;
    }

    // Otherwise, iteration has ended.
    return void 0;
  }
}
