/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import algo = collections.algorithm;

import connect = core.connect;

import IDisposable = utility.IDisposable;
import Pair = utility.Pair;
import hitTest = utility.hitTest;
import overrideCursor = utility.overrideCursor;


/**
 * The class name added to DockArea instances.
 */
var DOCK_AREA_CLASS = 'p-DockArea';

/**
 * The class name added to DockSplitter instances.
 */
var DOCK_SPLITTER_CLASS = 'p-DockSplitter';

/**
 * The class name added to DockPanel instances.
 */
var DOCK_PANEL_CLASS = 'p-DockPanel';

/**
 * The class name added to the DockPanel overlay div.
 */
var OVERLAY_CLASS = 'p-DockPanel-overlay';

/**
 * The class name added to floating tabs.
 */
var FLOATING_CLASS = 'p-mod-floating';


/**
 * A widget which can be added to a DockArea.
 */
export
interface IDockWidget extends Widget {
  /**
   * The tab associated with the widget.
   */
  tab: Tab;
}


/**
 * A widget which provides a flexible docking layout area for widgets.
 */
export
class DockArea extends Widget {
  /**
   * Construct a new dock area.
   */
  constructor() {
    super();
    this.addClass(DOCK_AREA_CLASS);
    this._root = this._createSplitter(Orientation.Horizontal);

    var layout = new BoxLayout(Direction.TopToBottom, 0);
    layout.addWidget(this._root);

    this.layout = layout;
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._abortDrag();
    this._root = null;
    this._items = null;
    super.dispose();
  }

  /**
   * Get the width of the tabs in the dock area.
   */
  get tabWidth(): number {
    return this._tabWidth;
  }

  /**
   * Get the width of the tabs in the dock area.
   */
  set tabWidth(width: number) {
    width = Math.max(0, width);
    if (width === this._tabWidth) {
      return;
    }
    this._tabWidth = width;
    iterPanels(this._root, panel => {
      panel.tabBar.tabWidth = width;
    });
  }

  /**
   * Get the minimum tab width in pixels.
   */
  get minTabWidth(): number {
    return this._minTabWidth;
  }

  /**
   * Set the minimum tab width in pixels.
   */
  set minTabWidth(width: number) {
    width = Math.max(0, width);
    if (width === this._minTabWidth) {
      return;
    }
    this._minTabWidth = width;
    iterPanels(this._root, panel => {
      panel.tabBar.minTabWidth = width;
    });
  }

  /**
   * Get the tab overlap amount in pixels.
   */
  get tabOverlap(): number {
    return this._tabOverlap;
  }

  /**
   * Set the tab overlap amount in pixels.
   */
  set tabOverlap(overlap: number) {
    if (overlap === this._tabOverlap) {
      return;
    }
    this._tabOverlap = overlap;
    iterPanels(this._root, panel => {
      panel.tabBar.tabOverlap = overlap;
    });
  }

  /**
   * Get the handle size of the dock splitters.
   */
  get handleSize(): number {
    return this._handleSize;
  }

  /**
   * Set the handle size of the dock splitters.
   */
  set handleSize(size: number) {
    if (size === this._handleSize) {
      return;
    }
    this._handleSize = size;
    iterSplitters(this._root, splitter => {
      splitter.handleSize = size;
    });
  }

  /**
   * Add a widget to the dock area.
   *
   * The widget is positioned in the area according to the given dock
   * mode and reference widget. If the dock widget is already added to
   * the area, it will be moved to the new location.
   *
   * The default mode inserts the widget on the left side of the area.
   */
  addWidget(widget: IDockWidget, mode?: DockMode, ref?: IDockWidget): void {
    switch (mode) {
    case DockMode.Top:
      this._addWidget(widget, Orientation.Vertical, false);
      break;
    case DockMode.Left:
      this._addWidget(widget, Orientation.Horizontal, false);
      break;
    case DockMode.Right:
      this._addWidget(widget, Orientation.Horizontal, true);
      break;
    case DockMode.Bottom:
      this._addWidget(widget, Orientation.Vertical, true);
      break;
    case DockMode.SplitTop:
      this._splitWidget(widget, ref, Orientation.Vertical, false);
      break;
    case DockMode.SplitLeft:
      this._splitWidget(widget, ref, Orientation.Horizontal, false);
      break;
    case DockMode.SplitRight:
      this._splitWidget(widget, ref, Orientation.Horizontal, true);
      break;
    case DockMode.SplitBottom:
      this._splitWidget(widget, ref, Orientation.Vertical, true);
      break;
    case DockMode.TabBefore:
      this._tabifyWidget(widget, ref, false);
      break;
    case DockMode.TabAfter:
      this._tabifyWidget(widget, ref, true);
      break;
    default:
      this._addWidget(widget, Orientation.Horizontal, false);
      break;
    }
  }

  // /**
  //  * Ensure the given widget is activated.
  //  *
  //  * If the widget does not exist, this is a no-op.
  //  *
  //  * Returns true if the widget was activated, false otherwise.
  //  */
  // activateWidget(widget: Widget): boolean {
  //   var item = find(this._items, it => it.widget === widget);
  //   if (!item) {
  //     return false;
  //   }
  //   item.panel.tabBar.currentTab = item.widget.tab;
  //   return true;
  // }

  // /**
  //  * Get an array of the active widgets in the dock area.
  //  */
  // activeWidgets(): Widget[] {
  //   var result: Widget[] = [];
  //   iterPanels(this._root, panel => {
  //     var current = panel.stackPanel.currentPanel;
  //     if (current) result.push(current);
  //   });
  //   return result;
  // }

  /**
   * Handle the DOM events for the dock area.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousemove':
      this._evtMouseMove(<MouseEvent>event);
      break;
    case 'mouseup':
      this._evtMouseUp(<MouseEvent>event);
      break;
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
      break;
    }
  }

  /**
   * Handle the 'mousemove' event for the dock area.
   *
   * This is triggered on the document during a tab move operation.
   */
  private _evtMouseMove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    var dragData = this._dragData;
    if (!dragData) {
      return;
    }

    // Hit test the panels using the current mouse position.
    var clientX = event.clientX;
    var clientY = event.clientY;
    var hitPanel = iterPanels(this._root, p => {
      return hitTest(p.node, clientX, clientY) ? p : void 0;
    });

    // If the last hit panel is not this hit panel, clear the overlay.
    if (dragData.lastHitPanel && dragData.lastHitPanel !== hitPanel) {
      dragData.lastHitPanel.hideOverlay();
    }

    // Clear the reference to the hit panel. It will be updated again
    // if the mouse is over a panel, but not over the panel's tab bar.
    dragData.lastHitPanel = null;

    // Compute the new X and Y tab coordinates.
    var x = clientX - dragData.offsetX;
    var y = clientY - dragData.offsetY;

    // If the mouse is not over a dock panel, simply update the tab.
    var item = dragData.item;
    var itemTab = item.widget.tab;
    var tabStyle = itemTab.node.style;
    if (!hitPanel) {
      tabStyle.left = x + 'px';
      tabStyle.top = y + 'px';
      return;
    }

    // Handle the case where the mouse is not over a tab bar. This
    // saves a reference to the hit panel so that its overlay can be
    // hidden once the mouse leaves the area, and shows the overlay
    // provided that the split target is not the current widget.
    if (!hitTest(hitPanel.tabBar.node, clientX, clientY)) {
      dragData.lastHitPanel = hitPanel;
      if (hitPanel !== item.panel || hitPanel.tabBar.count > 0) {
        hitPanel.showOverlay(clientX, clientY);
      }
      tabStyle.left = x + 'px';
      tabStyle.top = y + 'px';
      return;
    }

    // Otherwise the mouse is positioned over a tab bar. Hide the
    // overlay before attaching the tab to the new tab bar.
    hitPanel.hideOverlay();

    // If the hit panel is not the current owner, the current hit
    // panel and tab are saved so that they can be restored later.
    if (hitPanel !== item.panel) {
      dragData.tempPanel = hitPanel;
      dragData.tempTab = hitPanel.tabBar.currentTab;
    }

    // Reset the tab style before attaching the tab to the tab bar.
    floatTab(itemTab, false);
    tabStyle.top = '';
    tabStyle.left = '';
    tabStyle.width = '';

    // Attach the tab to the hit tab bar.
    hitPanel.tabBar.attachTab(itemTab, clientX);

    // The tab bar takes over movement of the tab. The dock area still
    // listens for the mouseup event in order to complete the move.
    document.removeEventListener('mousemove', <any>this, true);
  }

  /**
   * Handle the 'mouseup' event for the dock area.
   *
   * This is triggered on the document during a tab move operation.
   */
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);
    document.removeEventListener('contextmenu', <any>this, true);
    var dragData = this._dragData;
    if (!dragData) {
      return;
    }
    this._dragData = null;

    // Restore the application cursor and hide the overlay.
    dragData.cursorGrab.dispose();
    if (dragData.lastHitPanel) {
      dragData.lastHitPanel.hideOverlay();
    }

    // Fetch common variables.
    var item = dragData.item;
    var ownPanel = item.panel;
    var ownBar = ownPanel.tabBar;
    var ownCount = ownBar.count;
    var itemTab = item.widget.tab;

    // If the tab was being temporarily borrowed by another panel,
    // make that relationship permanent by moving the dock widget.
    // If the original owner panel becomes empty, it is removed.
    // Otherwise, its current index is updated to the next widget.
    // The ignoreRemoved flag is set during the widget swap since
    // the widget is not actually being removed from the area.
    if (dragData.tempPanel) {
      this._ignoreRemoved = true;
      item.panel = dragData.tempPanel;
      item.panel.stackedPanel.addWidget(item.widget);
      item.panel.stackedPanel.currentWidget = item.widget;
      this._ignoreRemoved = false;
      if (ownPanel.stackedPanel.count === 0) {
        this._removePanel(ownPanel);
      } else {
        var i = ownBar.indexOf(dragData.prevTab);
        if (i === -1) i = Math.min(dragData.index, ownCount - 1);
        ownBar.currentIndex = i;
      }
      return;
    }

    // Snap the split mode before modifying the DOM with the tab insert.
    var mode = SplitMode.Invalid;
    var hitPanel = dragData.lastHitPanel;
    if (hitPanel && (hitPanel !== ownPanel || ownCount !== 0)) {
      mode = hitPanel.splitModeAt(event.clientX, event.clientY);
    }

    // If the mouse was not released over a panel, or if the hit panel
    // is the empty owner panel, restore the tab to its position.
    var tabStyle = itemTab.node.style;
    if (mode === SplitMode.Invalid) {
      if (ownBar.currentTab !== itemTab) {
        floatTab(itemTab, false);
        tabStyle.top = '';
        tabStyle.left = '';
        tabStyle.width = '';
        ownBar.insertTab(dragData.index, itemTab);
      }
      return;
    }

    // Remove the tab from the document body and reset its style.
    document.body.removeChild(itemTab.node);
    floatTab(itemTab, false);
    tabStyle.top = '';
    tabStyle.left = '';
    tabStyle.width = '';

    // Split the target panel with the dock widget.
    var after = mode === SplitMode.Right || mode === SplitMode.Bottom;
    var horiz = mode === SplitMode.Left || mode === SplitMode.Right;
    var orientation = horiz ? Orientation.Horizontal : Orientation.Vertical;
    this._splitPanel(hitPanel, item.widget, orientation, after);
    var i = ownBar.indexOf(dragData.prevTab);
    if (i === -1) i = Math.min(dragData.index, ownCount - 1);
    ownBar.currentIndex = i;
  }

  /**
   * Add the widget to a new root dock panel along the given orientation.
   *
   * If the widget already exists in the area, it will be removed.
   */
  private _addWidget(widget: IDockWidget, orientation: Orientation, after: boolean): void {
    widget.parent = null;
    var panel = this._createPanel();
    this._items.push({ widget: widget, panel: panel });
    panel.stackedPanel.addWidget(widget);
    panel.tabBar.addTab(widget.tab);
    this._ensureRoot(orientation);
    if (after) {
      this._root.addWidget(panel);
    } else {
      this._root.insertWidget(0, panel);
    }
  }

  /**
   * Add the dock widget as a new split panel next to the reference.
   *
   * If the reference does not exist in the area, this is a no-op.
   *
   * If the dock widget already exists in the area, it will be moved.
   */
  private _splitWidget(widget: IDockWidget, ref: IDockWidget, orientation: Orientation, after: boolean): void {
    if (widget === ref) {
      return;
    }
    var refItem = algo.find(this._items, it => it.widget === ref);
    if (!refItem) {
      return;
    }
    this._splitPanel(refItem.panel, widget, orientation, after);
  }

  /**
   * Split the panel with the given widget along the given orientation.
   *
   * If the widget already exists in the area, it will be moved.
   */
  private _splitPanel(panel: DockPanel, widget: IDockWidget, orientation: Orientation, after: boolean): void {
    widget.parent = null;
    var newPanel = this._createPanel();
    this._items.push({ widget: widget, panel: newPanel });
    newPanel.stackedPanel.addWidget(widget);
    newPanel.tabBar.addTab(widget.tab);
    var splitter = <DockSplitter>panel.parent;
    if (splitter.orientation !== orientation) {
      if (splitter.count <= 1) {
        splitter.orientation = orientation;
        splitter.insertWidget(after ? 1 : 0, newPanel);
        splitter.setSizes([1, 1]);
      } else {
        var sizes = splitter.sizes();
        var index = splitter.indexOf(panel);
        var newSplitter = this._createSplitter(orientation);
        newSplitter.addWidget(panel);
        newSplitter.insertWidget(after ? 1 : 0, newPanel);
        splitter.insertWidget(index, newSplitter);
        splitter.setSizes(sizes);
        newSplitter.setSizes([1, 1]);
      }
    } else {
      var index = splitter.indexOf(panel);
      var i = after ? index + 1 : index;
      var sizes = splitter.sizes();
      var size = sizes[index] = sizes[index] / 2;
      splitter.insertWidget(i, newPanel);
      algo.insert(sizes, i, size);
      splitter.setSizes(sizes);
    }
  }

  /**
   * Add the dock widget as a tab next to the reference.
   *
   * If the reference does not exist in the area, this is a no-op.
   *
   * If the dock widget already exists in the area, it will be moved.
   */
  private _tabifyWidget(widget: IDockWidget, ref: IDockWidget, after: boolean): void {
    if (widget === ref) {
      return;
    }
    var refItem = algo.find(this._items, it => it.widget === ref);
    if (!refItem) {
      return;
    }
    widget.parent = null;
    var panel = refItem.panel;
    var index = panel.tabBar.indexOf(ref.tab) + (after ? 1 : 0);
    this._items.push({ widget: widget, panel: panel });
    panel.stackedPanel.addWidget(widget);
    panel.tabBar.insertTab(index, widget.tab);
  }

  /**
   * Ensure the root splitter has the given orientation.
   *
   * If the current root has the given orientation, this is a no-op.
   *
   * If the root has <= 1 child, its orientation will be updated.
   *
   * Otherwise, a new root will be created with the proper orientation
   * and the current root will be added as the new root's first child.
   */
  private _ensureRoot(orientation: Orientation): void {
    var root = this._root;
    if (root.orientation === orientation) {
      return;
    }
    if (root.count <= 1) {
      root.orientation = orientation;
    } else {
      this._root = this._createSplitter(orientation);
      this._root.addWidget(root);
      (<BoxLayout>this.layout).addWidget(this._root);
    }
  }

  /**
   * Create a new panel and setup the signal handlers.
   */
  private _createPanel(): DockPanel {
    var panel = new DockPanel();
    var bar = panel.tabBar;
    var stack = panel.stackedPanel;
    bar.tabWidth = this._tabWidth;
    bar.tabOverlap = this._tabOverlap;
    bar.minTabWidth = this._minTabWidth;
    connect(bar, TabBar.currentChanged, this, this._p_currentChanged);
    connect(bar, TabBar.tabCloseRequested, this, this._p_tabCloseRequested);
    connect(bar, TabBar.tabDetachRequested, this, this._p_tabDetachRequested);
    connect(stack, StackedPanel.widgetRemoved, this, this._p_widgetRemoved);
    return panel;
  }

  /**
   * Create a new dock splitter for the dock area.
   */
  private _createSplitter(orientation: Orientation): DockSplitter {
    var splitter = new DockSplitter(orientation);
    splitter.handleSize = this._handleSize;
    return splitter;
  }

  /**
   * Remove an empty dock panel from the hierarchy.
   *
   * This ensures that the hierarchy is kept consistent by merging an
   * ancestor splitter when it contains only a single child widget.
   */
  private _removePanel(panel: DockPanel): void {
    // The parent of a dock panel is always a splitter.
    var splitter = <DockSplitter>panel.parent;

    // Dispose the panel. It is possible that this method is executing
    // on the path of the panel's child stack widget event handler, so
    // the panel is disposed in a deferred fashion to avoid disposing
    // the child stack widget while its processing events.
    panel.parent = null;
    setTimeout(() => panel.dispose(), 0);

    // If the splitter still has multiple children after removing
    // the target panel, nothing else needs to be done.
    if (splitter.count > 1) {
      return;
    }

    // If the splitter is the root splitter and has a remaining
    // child which is a splitter, that child becomes the root.
    if (splitter === this._root) {
      if (splitter.count === 1) {
        var child = splitter.widgetAt(0);
        if (child instanceof DockSplitter) {
          var layout = <BoxLayout>this.layout;
          var sizes = child.sizes();
          this._root = child;
          splitter.parent = null;
          layout.addWidget(child);
          child.setSizes(sizes);
          splitter.dispose();
        }
      }
      return;
    }

    // Non-root splitters always have a splitter parent and are always
    // created with 2 children, so the splitter is guaranteed to have
    // a single child at this point. Furthermore, splitters always have
    // an orthogonal orientation to their parent, so a grandparent and
    // a grandhild splitter will have the same orientation. This means
    // the children of the granchild can be merged into the grandparent.
    var gParent = <DockSplitter>splitter.parent;
    var gSizes = gParent.sizes();
    var gChild = splitter.widgetAt(0);
    var index = gParent.indexOf(splitter);
    splitter.parent = null;
    if (gChild instanceof DockPanel) {
      gParent.insertWidget(index, gChild);
    } else {
      var gcsp = <DockSplitter>gChild;
      var gcspSizes = gcsp.sizes();
      var sizeShare = algo.removeAt(gSizes, index);
      for (var i = 0; gcsp.count !== 0; ++i) {
        gParent.insertWidget(index + i, gcsp.widgetAt(0));
        algo.insert(gSizes, index + i, sizeShare * gcspSizes[i]);
      }
    }
    gParent.setSizes(gSizes);
    splitter.dispose();
  }

  /**
   * Abort the tab drag operation if one is in progress.
   */
  private _abortDrag(): void {
    var dragData = this._dragData;
    if (!dragData) {
      return;
    }
    this._dragData = null;

    // Release the mouse grab and restore the application cursor.
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);
    document.removeEventListener('contextmenu', <any>this, true);
    dragData.cursorGrab.dispose();

    // Hide the overlay for the last hit panel.
    if (dragData.lastHitPanel) {
      dragData.lastHitPanel.hideOverlay();
    }

    // If the tab is borrowed by another tab bar, remove it from
    // that tab bar and restore that tab bar's previous tab.
    if (dragData.tempPanel) {
      var tabBar = dragData.tempPanel.tabBar;
      tabBar.detachAt(tabBar.currentIndex);
      tabBar.currentTab = dragData.tempTab;
    }

    // Restore the tab to its original location in its owner panel.
    var item = dragData.item;
    var itemTab = item.widget.tab;
    var ownBar = item.panel.tabBar;
    if (ownBar.currentTab !== itemTab) {
      var tabStyle = itemTab.node.style;
      floatTab(itemTab, false);
      tabStyle.top = '';
      tabStyle.left = '';
      tabStyle.width = '';
      ownBar.insertTab(dragData.index, itemTab);
    }
  }

  /**
   * Handle the `currentChanged` signal from a tab bar.
   */
  private _p_currentChanged(sender: TabBar, args: Pair<number, Tab>): void {
    var item = algo.find(this._items, it => it.widget.tab === args.second);
    if (item && item.panel.tabBar === sender) {
      item.panel.stackedPanel.currentWidget = item.widget;
    }
  }

  /**
   * Handle the `tabCloseRequested` signal from a tab bar.
   */
  private _p_tabCloseRequested(sender: TabBar, args: Pair<number, Tab>): void {
    var item = algo.find(this._items, it => it.widget.tab === args.second);
    if (item) item.widget.close();
  }

  /**
   * Handle the `tabDetachRequested` signal from the tab bar.
   */
  private _p_tabDetachRequested(sender: TabBar, args: ITabDetachArgs): void {
    // Find the dock item for the detach operation.
    var tab = args.tab;
    var item = algo.find(this._items, it => it.widget.tab === tab);
    if (!item) {
      return;
    }

    // Create the drag data the first time a tab is detached.
    // The drag data will be cleared on the mouse up event.
    if (!this._dragData) {
      var prevTab = sender.previousTab;
      this._dragData = {
        item: item,
        index: args.index,
        offsetX: 0,
        offsetY: 0,
        prevTab: prevTab,
        lastHitPanel: null,
        cursorGrab: null,
        tempPanel: null,
        tempTab: null,
      };
    }

    // Update the drag data with the current tab geometry.
    var dragData = this._dragData;
    dragData.offsetX = (0.4 * this._tabWidth) | 0;
    dragData.offsetY = (0.6 * tab.node.offsetHeight) | 0;

    // Grab the cursor for the drag operation.
    dragData.cursorGrab = overrideCursor('default');

    // The tab being detached will have one of two states:
    //
    // 1) The tab is being detached from its owner tab bar. The current
    //    index is unset before detaching the tab so that the content
    //    widget does not change during the drag operation.
    // 2) The tab is being detached from a tab bar which was borrowing
    //    the tab temporarily. Its previously selected tab is restored.
    if (item.panel.tabBar === sender) {
      sender.currentIndex = -1;
      sender.detachAt(args.index);
    } else {
      sender.detachAt(args.index);
      sender.currentTab = dragData.tempTab;
    }

    // Clear the temp panel and tab
    dragData.tempPanel = null;
    dragData.tempTab = null;

    // Setup the initial style and position for the floating tab.
    var style = tab.node.style;
    style.left = args.clientX - dragData.offsetX + 'px';
    style.top = args.clientY - dragData.offsetY +  'px';
    style.width = this._tabWidth + 'px';
    style.zIndex = '';

    // Add the floating tab to the document body.
    floatTab(tab, true);
    document.body.appendChild(tab.node);

    // Attach the necessary mouse event listeners.
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);
    document.addEventListener('contextmenu', <any>this, true);
  }

  /**
   * Handle the `widgetRemoved` signal from a stack widget.
   */
  private _p_widgetRemoved(sender: StackedPanel, args: Pair<number, Widget>): void {
    if (this._ignoreRemoved) {
      return;
    }
    var i = algo.findIndex(this._items, it => it.widget === args.second);
    if (i === -1) {
      return;
    }
    this._abortDrag();
    var item = algo.removeAt(this._items, i);
    item.panel.tabBar.removeTab(item.widget.tab);
    if (item.panel.stackedPanel.count === 0) {
      this._removePanel(item.panel);
    }
  }

  private _handleSize = 3;
  private _tabWidth = 175;
  private _tabOverlap = 0;
  private _minTabWidth = 45;
  private _ignoreRemoved = false;
  private _root: DockSplitter = null;
  private _dragData: IDragData = null;
  private _items: IDockItem[] = [];
}


/**
 * An object which holds item data for a dock widget.
 */
interface IDockItem {
  widget: IDockWidget;
  panel: DockPanel;
}


/**
 * An object which holds drag data for a dock area.
 */
interface IDragData {
  item: IDockItem;
  index: number;
  offsetX: number;
  offsetY: number;
  cursorGrab: IDisposable;
  lastHitPanel: DockPanel;
  tempPanel: DockPanel;
  tempTab: Tab;
  prevTab: Tab;
}


/**
 * Set or remove the floating class on the given tab.
 */
function floatTab(tab: Tab, on: boolean): void {
  if (on) {
    tab.addClass(FLOATING_CLASS);
  } else {
    tab.removeClass(FLOATING_CLASS);
  }
}


/**
 * Iterate over the DockPanels starting with the given root splitter.
 *
 * Iteration stops when the callback returns anything but undefined.
 */
function iterPanels<T>(root: DockSplitter, cb: (panel: DockPanel) => T): T {
  for (var i = 0, n = root.count; i < n; ++i) {
    var result: T;
    var panel = root.widgetAt(i);
    if (panel instanceof DockPanel) {
      result = cb(panel);
    } else {
      result = iterPanels(<DockSplitter>panel, cb);
    }
    if (result !== void 0) {
      return result;
    }
  }
  return void 0;
}


/**
 * Iterate over the DockSplitters starting with the given root splitter.
 *
 * Iteration stops when the callback returns anything but undefined.
 */
function iterSplitters<T>(root: DockSplitter, cb: (panel: DockSplitter) => T): T {
  var result = cb(root);
  if (result !== void 0) {
    return result;
  }
  for (var i = 0, n = root.count; i < n; ++i) {
    var panel = root.widgetAt(i);
    if (panel instanceof DockSplitter) {
      result = iterSplitters(panel, cb);
      if (result !== void 0) {
        return result;
      }
    }
  }
  return void 0;
}


/**
 * The split modes used to indicate a dock panel split direction.
 */
enum SplitMode { Top, Left, Right, Bottom, Invalid }


/**
 * A panel used by a DockArea.
 *
 * A dock panel acts as a simple container for a tab bar and stack
 * panel, plus a bit of logic to manage a drop indicator overlay.
 * The dock area manages the tab bar and stack panel directly, as
 * there is not always a 1:1 association between a tab and panel.
 *
 * This class is not part of the public Phosphor API.
 */
class DockPanel extends Widget {
  /**
   * Construct a new dock panel.
   */
  constructor() {
    super();
    this.addClass(DOCK_PANEL_CLASS);
    this._tabBar = new TabBar();
    this._stackedPanel = new StackedPanel();
    this._overlayNode = this.createOverlay();

    var layout = new BoxLayout(Direction.TopToBottom, 0);
    layout.addWidget(this._tabBar);
    layout.addWidget(this._stackedPanel);

    this.layout = layout;
    this.setFlag(WidgetFlag.DisallowLayoutChange);
    this.node.appendChild(this._overlayNode);
  }

  /**
   * Get the tab bar child of the dock panel.
   */
  get tabBar(): TabBar {
    return this._tabBar;
  }

  /**
   * Get the stack panel child of the dock panel.
   */
  get stackedPanel(): StackedPanel {
    return this._stackedPanel;
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this._clearOverlayTimer();
    this._tabBar = null;
    this._stackedPanel = null;
    this._overlayNode = null;
    super.dispose();
  }

  /**
   * Compute the split mode for the given client position.
   */
  splitModeAt(clientX: number, clientY: number): SplitMode {
    var rect = this.node.getBoundingClientRect();
    var fracX = (clientX - rect.left) / rect.width;
    var fracY = (clientY - rect.top) / rect.height;
    if (fracX < 0.0 || fracX > 1.0 || fracY < 0.0 || fracY > 1.0) {
      return SplitMode.Invalid;
    }
    var mode: SplitMode;
    var normX = fracX > 0.5 ? 1 - fracX : fracX;
    var normY = fracY > 0.5 ? 1 - fracY : fracY;
    if (normX < normY) {
      mode = fracX <= 0.5 ? SplitMode.Left : SplitMode.Right;
    } else {
      mode = fracY <= 0.5 ? SplitMode.Top : SplitMode.Bottom;
    }
    return mode;
  }

  /**
   * Show the dock overlay for the given client position.
   *
   * If the overlay is already visible, it will be adjusted.
   */
  showOverlay(clientX: number, clientY: number): void {
    this._clearOverlayTimer();
    var box = this.boxSizing;
    var top = box.paddingTop;
    var left = box.paddingLeft;
    var right = box.paddingRight;
    var bottom = box.paddingBottom;
    switch (this.splitModeAt(clientX, clientY)) {
    case SplitMode.Left:
      right = this.width / 2;
      break;
    case SplitMode.Right:
      left = this.width / 2;
      break;
    case SplitMode.Top:
      bottom = this.height / 2;
      break;
    case SplitMode.Bottom:
      top = this.height / 2;
      break;
    }
    // The first time the overlay is made visible, it is positioned at
    // the cursor with zero size before being displayed. This allows
    // for a nice transition to the normally computed size. Since the
    // elements starts with display: none, a restyle must be forced.
    var style = this._overlayNode.style;
    if (this._overlayHidden) {
      this._overlayHidden = false;
      var rect = this.node.getBoundingClientRect();
      style.top = clientY - rect.top + 'px';
      style.left = clientX - rect.left + 'px';
      style.right = rect.right - clientX + 'px';
      style.bottom = rect.bottom - clientY + 'px';
      style.display = '';
      this._overlayNode.offsetWidth; // force layout
    }
    style.opacity = '1';
    style.top = top + 'px';
    style.left = left + 'px';
    style.right = right + 'px';
    style.bottom = bottom + 'px';
  }

  /**
   * Hide the dock overlay.
   *
   * If the overlay is already hidden, this is a no-op.
   */
  hideOverlay(): void {
    if (this._overlayHidden) {
      return;
    }
    this._clearOverlayTimer();
    this._overlayHidden = true;
    this._overlayNode.style.opacity = '0';
    this._overlayTimer = setTimeout(() => {
      this._overlayTimer = 0;
      this._overlayNode.style.display = 'none';
    }, 150);
  }

  /**
   * Create the overlay node for the dock panel.
   */
  protected createOverlay(): HTMLElement {
    var overlay = document.createElement('div');
    overlay.className = OVERLAY_CLASS;
    overlay.style.display = 'none';
    return overlay;
  }

  /**
   * Clear the overlay timer.
   */
  private _clearOverlayTimer(): void {
    if (this._overlayTimer) {
      clearTimeout(this._overlayTimer);
      this._overlayTimer = 0;
    }
  }

  private _tabBar: TabBar;
  private _overlayTimer = 0;
  private _overlayHidden = true;
  private _stackedPanel: StackedPanel;
  private _overlayNode: HTMLElement = null;
}


/**
 * A split panel used by a DockArea.
 *
 * This class is not part of the public Phosphor API.
 */
class DockSplitter extends SplitPanel {
  /**
   * Construct a new dock splitter.
   */
  constructor(orientation: Orientation) {
    super(orientation);
    this.addClass(DOCK_SPLITTER_CLASS);
  }
}

} // module phosphor.widgets
