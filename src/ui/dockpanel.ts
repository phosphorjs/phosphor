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
  IDragEvent
} from '../dom/dragdrop';

import {
  StackedLayout
} from './stackedpanel';

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
    if (zone === DockZone.Invalid) {
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
    let target = DockPanelPrivate.findDockTarget(this, x, y);
    if (target.zone === DockZone.Invalid) {
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
    DockPanelPrivate.handleDrop(this, widget, target);
    event.dropAction = event.proposedAction;
  }

  private _spacing = 3;
  private _overlay: Thing;
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
     * The default is `3`.
     */
    spacing?: number;
  }

  /**
   *
   */
  export
  type Location = (
    /**
     *
     */
    'top' |

    /**
     *
     */
    'left' |

    /**
     *
     */
    'right' |

    /**
     *
     */
    'bottom' |

    /**
     *
     */
    'split-top' |

    /**
     *
     */
    'split-left' |

    /**
     *
     */
    'split-right' |

    /**
     *
     */
    'split-bottom' |

    /**
     *
     */
    'tab-before' |

    /**
     *
     */
    'tab-after'
  );
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
   * Synchronize the spacing value for the dock split panels.
   */
  export
  function syncSpacing(root: Thing, value: number): void {

  }
}
