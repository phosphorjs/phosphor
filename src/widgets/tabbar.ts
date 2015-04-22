/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import algo = collections.algorithm;

import IMessage = core.IMessage;
import Signal = core.Signal;

import IDisposable = utility.IDisposable;
import Pair = utility.Pair;
import Size = utility.Size;
import hitTest = utility.hitTest;
import overrideCursor = utility.overrideCursor;


/**
 * The class name added to TabBar instances.
 */
var TAB_BAR_CLASS = 'p-TabBar';

/**
 * The class name added to the tab bar header div.
 */
var HEADER_CLASS = 'p-TabBar-header';

/**
 * The class name added to the tab bar content list.
 */
var CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to the tab bar footer div.
 */
var FOOTER_CLASS = 'p-TabBar-footer';

/**
 * The class name added to the content div when transitioning tabs.
 */
var TRANSITION_CLASS = 'p-mod-transition';

/**
 * The class name added to a tab being inserted.
 */
var INSERTING_CLASS = 'p-mod-inserting';

/**
 * The class name added to a tab being removed.
 */
var REMOVING_CLASS = 'p-mod-removing';

/**
 * The overlap threshold before swapping tabs.
 */
var OVERLAP_THRESHOLD = 0.6;

/**
 * The start drag distance threshold.
 */
var DRAG_THRESHOLD = 5;

/**
 * The detach distance threshold.
 */
var DETACH_THRESHOLD = 20;

/**
 * The tab transition duration.
 */
var TRANSITION_DURATION = 150;

/**
 * The size of a collapsed tab stub.
 */
var TAB_STUB_SIZE = 7;


/**
 * The arguments object for the `tabDetachRequested` signal.
 */
export
interface ITabDetachArgs {
  /**
   * The tab of interest.
   */
  tab: Tab;

  /**
   * The index of the tab.
   */
  index: number;

  /**
   * The current mouse client X position.
   */
  clientX: number;

  /**
   * The current mouse client Y position.
   */
  clientY: number;
}


/**
 * The options object for initializing a tab bar.
 */
export
interface ITabBarOptions {
  /**
   * Wether the tabs are movable by the user.
   */
  tabsMovable?: boolean;

  /**
   * The preferred tab width.
   *
   * Tabs will be sized to this width if possible, but never larger.
   */
  tabWidth?: number;

  /**
   * The minimum tab width.
   *
   * Tabs will never be sized smaller than this amount.
   */
  minTabWidth?: number;

  /**
   * The tab overlap amount.
   *
   * A positive value will cause neighboring tabs to overlap.
   * A negative value will insert empty space between tabs.
   */
  tabOverlap?: number;
}


/**
 * A leaf widget which displays a row of tabs.
 */
export
class TabBar extends Widget {
  /**
   * Create the DOM node for a tab bar.
   */
  static createNode(): HTMLElement {
    var node = document.createElement('div');
    var header = document.createElement('div');
    var content = document.createElement('ul');
    var footer = document.createElement('div');
    header.className = HEADER_CLASS;
    content.className = CONTENT_CLASS;
    footer.className = FOOTER_CLASS;
    node.appendChild(header);
    node.appendChild(content);
    node.appendChild(footer);
    return node;
  }

  /**
   * A signal emitted when a tab is moved.
   */
  tabMoved = new Signal<TabBar, Pair<number, number>>();

  /**
   * A signal emitted when the currently selected tab is changed.
   */
  currentChanged = new Signal<TabBar, Pair<number, Tab>>();

  /**
   * A signal emitted when the user clicks a tab close icon.
   */
  tabCloseRequested = new Signal<TabBar, Pair<number, Tab>>();

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   */
  tabDetachRequested = new Signal<TabBar, ITabDetachArgs>();

  /**
   * Construct a new tab bar.
   */
  constructor(options?: ITabBarOptions) {
    super();
    this.addClass(TAB_BAR_CLASS);
    this.verticalSizePolicy = SizePolicy.Fixed;
    if (options) this._initFrom(options);
  }

  /*
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this.tabMoved.disconnect();
    this.currentChanged.disconnect();
    this.tabCloseRequested.disconnect();
    this.tabDetachRequested.disconnect();
    this._releaseMouse();
    this._previousTab = null;
    this._currentTab = null;
    this._tabs = null;
    super.dispose();
  }

  /**
   * Get the currently selected tab index.
   */
  get currentIndex(): number {
    return this.indexOf(this.currentTab);
  }

  /**
   * Set the currently selected tab index.
   */
  set currentIndex(index: number) {
    var prev = this._currentTab;
    var next = this.tabAt(index) || null;
    if (prev === next) {
      return;
    }
    if (prev) prev.selected = false;
    if (next) next.selected = true;
    this._currentTab = next;
    this._previousTab = prev;
    this._updateTabZOrder();
    this.currentChanged.emit(this, new Pair(next ? index : -1, next));
  }

  /**
   * Get the currently selected tab.
   */
  get currentTab(): Tab {
    return this._currentTab;
  }

  /**
   * Set the currently selected tab.
   */
  set currentTab(tab: Tab) {
    this.currentIndex = this.indexOf(tab);
  }

  /**
   * Get the previously selected tab.
   */
  get previousTab(): Tab {
    return this._previousTab;
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(movable: boolean) {
    if (movable === this._tabsMovable) {
      return;
    }
    this._tabsMovable = movable;
    if (!movable) {
      this._releaseMouse();
    }
  }

  /**
   * Get the preferred tab width.
   *
   * Tabs will be sized to this width if possible, but never larger.
   */
  get tabWidth(): number {
    return this._tabWidth;
  }

  /**
   * Set the preferred tab width.
   *
   * Tabs will be sized to this width if possible, but never larger.
   */
  set tabWidth(width: number) {
    width = Math.max(0, width);
    if (width === this._tabWidth) {
      return;
    }
    this._tabWidth = width;
    if (this.isAttached) {
      this._updateTabLayout();
      this.updateGeometry();
    }
  }

  /**
   * Get the minimum tab width.
   *
   * Tabs will never be sized smaller than this amount.
   */
  get minTabWidth(): number {
    return this._minTabWidth;
  }

  /**
   * Set the minimum tab width.
   *
   * Tabs will never be sized smaller than this amount.
   */
  set minTabWidth(width: number) {
    width = Math.max(0, width);
    if (width === this._minTabWidth) {
      return;
    }
    this._minTabWidth = width;
    if (this.isAttached) {
      this._updateTabLayout();
      this.updateGeometry();
    }
  }

  /**
   * Get the tab overlap amount.
   *
   * A positive value will cause neighboring tabs to overlap.
   * A negative value will insert empty space between tabs.
   */
  get tabOverlap(): number {
    return this._tabOverlap;
  }

  /**
   * Set the tab overlap amount.
   *
   * A positive value will cause neighboring tabs to overlap.
   * A negative value will insert empty space between tabs.
   */
  set tabOverlap(overlap: number) {
    if (overlap === this._tabOverlap) {
      return;
    }
    this._tabOverlap = overlap;
    if (this.isAttached) {
      this._updateTabLayout();
      this.updateGeometry();
    }
  }

  /**
   * Get the number of tabs in the tab bar.
   */
  get count(): number {
    return this._tabs.length;
  }

  /**
   * Get the tab at the given index.
   */
  tabAt(index: number): Tab {
    return this._tabs[index];
  }

  /**
   * Get the index of the given tab.
   */
  indexOf(tab: Tab): number {
    return algo.indexOf(this._tabs, tab);
  }

  /**
   * Add a tab to the end of the tab bar.
   *
   * Returns the index of the tab.
   */
  addTab(tab: Tab): number {
    return this.insertTab(this.count, tab);
  }

  /**
   * Insert a tab into the tab bar at the given index.
   *
   * Returns the index of the tab.
   */
  insertTab(index: number, tab: Tab): number {
    var fromIndex = this.indexOf(tab);
    if (fromIndex !== -1) {
      index = this.moveTab(fromIndex, index);
    } else {
      index = this._insertTab(index, tab, true);
    }
    return index;
  }

  /**
   * Move a tab from one index to another.
   *
   * Returns the new tab index.
   */
  moveTab(fromIndex: number, toIndex: number): number {
    return this._moveTab(fromIndex, toIndex);
  }

  /**
   * Remove and return the tab at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  removeAt(index: number): Tab {
    return this._removeTab(index, true);
  }

  /**
   * Remove a tab from the tab bar and return its index.
   *
   * Returns -1 if the tab is not in the tab bar.
   */
  removeTab(tab: Tab): number {
    var i = this.indexOf(tab);
    if (i !== -1) this._removeTab(i, true);
    return i;
  }

  /**
   * Remove all of the tabs from the tab bar.
   */
  clearTabs(): void {
    while (this.count) {
      this._removeTab(this.count - 1, false);
    }
  }

  /**
   * Add a tab to the tab bar at the given client X position.
   *
   * This method is intended for use by code which supports tear-off
   * tab interfaces. It will insert the tab at the specified location
   * without a transition and grab the mouse to continue the tab drag.
   * It assumes that the left mouse button is currently pressed.
   *
   * This is a no-op if the tab is already added to the tab bar.
   */
  attachTab(tab: Tab, clientX: number): void {
    // Do nothing if the tab is already attached to the tab bar.
    if (this.indexOf(tab) !== -1) {
      return;
    }

    // Compute the insert index for the given client position.
    var contentNode = this.contentNode;
    var contentRect = contentNode.getBoundingClientRect();
    var localX = clientX - contentRect.left;
    var index = localX / (this._tabLayoutWidth() - this._tabOverlap);
    index = Math.max(0, Math.min(Math.round(index), this.count));

    // Insert and select the tab and install the mouse listeners.
    this._insertTab(index, tab, false);
    this.currentIndex = index;
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);

    // Bail early if the tabs are not movable.
    if (!this._tabsMovable) {
      return;
    }

    // Setup the drag data object.
    var tlw = this._tabLayoutWidth();
    var offsetX = (0.4 * tlw) | 0;
    var clientY = contentRect.top + (0.5 * contentRect.height) | 0;
    var cursorGrab = overrideCursor('default');
    this._dragData = {
      node: tab.node,
      pressX: clientX,
      pressY: clientY,
      offsetX: offsetX,
      contentRect: contentRect,
      cursorGrab: cursorGrab,
      dragActive: true,
      detachRequested: false,
    };

    // Move the tab to its target position.
    var tgtLeft = localX - offsetX;
    var maxLeft = contentRect.width - tlw;
    var tabLeft = Math.max(0, Math.min(tgtLeft, maxLeft));
    var tabStyle = tab.node.style;
    contentNode.classList.add(TRANSITION_CLASS);
    tabStyle.transition = 'none';
    this._updateTabLayout();
    tabStyle.left = tabLeft + 'px';
  }

  /**
   * Detach and return the tab at the given index.
   *
   * This method is intended for use by code which supports tear-off
   * tab interfaces. It will remove the tab at the specified index
   * without a transition.
   *
   * Returns `undefined` if the index is invalid.
   */
  detachAt(index: number): Tab {
    return this._removeTab(index, false);
  }

  /**
   * Compute the size hint for the tab bar.
   */
  sizeHint(): Size {
    var width = 0;
    var count = this.count;
    if (count > 0) {
      width = this._tabWidth * count - this._tabOverlap * (count - 1);
    }
    return new Size(width, this.boxSizing.minHeight);
  }

  /**
   * Compute the minimum size hint for the tab bar.
   */
  minSizeHint(): Size {
    var width = 0;
    var count = this.count;
    if (count > 0) {
      width = this._minTabWidth + TAB_STUB_SIZE * (count - 1);
    }
    return new Size(width, this.boxSizing.minHeight);
  }

  /**
   * Get the content node for the tab bar.
   */
  protected get contentNode(): HTMLElement {
    return <HTMLElement>this.node.firstChild.nextSibling;
  }

  /**
   * A method invoked on an 'after-attach' message.
   */
  protected onAfterAttach(msg: IMessage): void {
    var node = this.node;
    node.addEventListener('mousedown', <any>this);
    node.addEventListener('click', <any>this);
  }

  /**
   * A method invoked on an 'after-dettach' message.
   */
  protected onAfterDetach(msg: IMessage): void {
    var node = this.node;
    node.removeEventListener('mousedown', <any>this);
    node.removeEventListener('click', <any>this);
  }

  /**
   * A method invoked on a 'resize' message.
   */
  protected onResize(msg: ResizeMessage): void {
    this._updateTabLayout();
  }

  /**
   * Handle the DOM events for the tab bar.
   */
  protected handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(<MouseEvent>event);
      break;
    case 'mousedown':
      this._evtMouseDown(<MouseEvent>event);
      break;
    case 'mousemove':
      this._evtMouseMove(<MouseEvent>event);
      break;
    case 'mouseup':
      this._evtMouseUp(<MouseEvent>event);
      break;
    }
  }

  /**
   * Handle the 'click' event for the tab bar.
   */
  private _evtClick(event: MouseEvent): void {
    // Do nothing if it's not a left click.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if the click is not on a tab.
    var index = this._hitTest(event.clientX, event.clientY);
    if (index < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // If the click was on the close icon of a closable tab,
    // emit the `tabCloseRequested` signal.
    var tab = this._tabs[index];
    if (tab.closable && tab.closeIconNode === event.target) {
      this.tabCloseRequested.emit(this, new Pair(index, tab));
    }
  }

  /**
   * Handle the 'mousedown' event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing of the press is not on a tab.
    var clientX = event.clientX;
    var clientY = event.clientY;
    var index = this._hitTest(clientX, clientY);
    if (index < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Do nothing further if the press was on the tab close icon.
    var tab = this._tabs[index];
    if (tab.closeIconNode === event.target) {
      return;
    }

    // Setup the drag data if the tabs are movable.
    if (this._tabsMovable) {
      var offsetX = clientX - tab.node.getBoundingClientRect().left;
      this._dragData = {
        node: tab.node,
        pressX: clientX,
        pressY: clientY,
        offsetX: offsetX,
        contentRect: null,
        cursorGrab: null,
        dragActive: false,
        detachRequested: false,
      };
    }

    // Select the tab and install the other mouse event listeners.
    this.currentIndex = index;
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);
  }

  /**
   * Handle the 'mousemove' event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Mouse move events are never propagated since this handler is
    // only installed when during a left-mouse-drag operation. Bail
    // early if the tabs are not movable or there is no drag data.
    event.preventDefault();
    event.stopPropagation();
    if (!this._tabsMovable || !this._dragData) {
      return;
    }

    // Setup common variables
    var clientX = event.clientX;
    var clientY = event.clientY;
    var data = this._dragData;

    // Check to see if the drag threshold has been exceeded, and
    // start the tab drag operation the first time that occurrs.
    if (!data.dragActive) {
      var dx = Math.abs(clientX - data.pressX);
      var dy = Math.abs(clientY - data.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }

      // Fill in the missing drag data.
      var contentNode = this.contentNode;
      data.contentRect = contentNode.getBoundingClientRect();
      data.cursorGrab = overrideCursor('default');
      data.dragActive = true;

      // Setup the styles for the drag.
      contentNode.classList.add(TRANSITION_CLASS);
      data.node.style.transition = 'none';
    }

    // Check to see if the detach threshold has been exceeded, and
    // emit the detach request signal the first time that occurrs.
    if (!data.detachRequested) {
      if (!inBounds(data.contentRect, DETACH_THRESHOLD, clientX, clientY)) {
        // Update the data nad emit the `tabDetachRequested` signal.
        data.detachRequested = true;
        this.tabDetachRequested.emit(this, {
          tab: this.currentTab,
          index: this.currentIndex,
          clientX: clientX,
          clientY: clientY,
        });

        // If the drag data is null, it means the mouse was released due
        // to the tab being detached and the move operation has ended.
        if (!this._dragData) {
          return;
        }
      }
    }

    // Compute the natural position of the current tab, absent any
    // influence from the mouse drag.
    var index = this.currentIndex;
    var tlw = this._tabLayoutWidth();
    var naturalX = index * (tlw - this._tabOverlap);

    // Compute the upper and lower bound on the natural tab position
    // which would cause the tab to swap position with its neighbor.
    var lowerBound = naturalX - tlw * OVERLAP_THRESHOLD;
    var upperBound = naturalX + tlw * OVERLAP_THRESHOLD;

    // Compute the actual target mouse position of the tab.
    var localX = clientX - data.contentRect.left - data.offsetX;
    var targetX = Math.max(0, Math.min(localX, data.contentRect.width - tlw));

    // Swap the position of the tab if it exceeds a threshold.
    if (targetX < lowerBound) {
      this.moveTab(index, index - 1);
    } else if (targetX > upperBound) {
      this.moveTab(index, index + 1);
    }

    // Move the tab to its target position.
    data.node.style.left = targetX + 'px';
  }

  /**
   * Handle the 'mouseup' event for the tab bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._releaseMouse();
  }

  /**
   * Release the current mouse grab for the tab bar.
   */
  private _releaseMouse(): void {
    // Do nothing if the mouse has already been released.
    var data = this._dragData;
    if (!data) {
      return;
    }

    // Clear the drag data and remove the extra listeners.
    this._dragData = null;
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);

    // Reset the state and layout to the non-drag state.
    if (data.dragActive) {
      data.cursorGrab.dispose();
      data.node.style.transition = '';
      this._withTransition(() => { this._updateTabLayout() });
    }
  }

  /**
   * Insert a new tab into the tab bar at the given index.
   *
   * This method assumes that the tab has not already been added.
   */
  private _insertTab(index: number, tab: Tab, animate: boolean): number {
    // Insert the tab into the array.
    index = algo.insert(this._tabs, index, tab);

    // Ensure the tab is deselected and add it to the DOM.
    tab.selected = false;
    this.contentNode.appendChild(tab.node);

    // Select this tab if there are no selected tabs. Otherwise,
    // update the tab Z-order to account for the new tab.
    if (!this._currentTab) {
      this.currentTab = tab;
    } else {
      this._updateTabZOrder();
    }

    // If the tab bar is not attached, there is nothing left to do.
    if (!this.isAttached) {
      return index;
    }

    // Animate the tab insert and and layout as appropriate.
    if (animate) {
      this._withTransition(() => {
        tab.addClass(INSERTING_CLASS);
        this._updateTabLayout();
      }, () => {
        tab.removeClass(INSERTING_CLASS);
      });
    } else {
      this._withTransition(() => { this._updateTabLayout() });
    }

    // Notify the layout system that the widget geometry is dirty.
    this.updateGeometry();

    return index;
  }

  /**
   * Move an item to a new index in the tab bar.
   *
   * Returns the new index of the tab, or -1.
   */
  private _moveTab(fromIndex: number, toIndex: number): number {
    // Move the tab to its new location.
    toIndex = algo.move(this._tabs, fromIndex, toIndex);

    // Bail if the index is invalid.
    if (toIndex === -1) {
      return -1;
    }

    // Update the tab Z-order to account for the new order.
    this._updateTabZOrder();

    // Emit the `tabMoved` signal.
    this.tabMoved.emit(this, new Pair(fromIndex, toIndex));

    // If the tab bar is not attached, there is nothing left to do.
    if (!this.isAttached) {
      return toIndex;
    }

    // Animate the tab layout update.
    this._withTransition(() => { this._updateTabLayout() });

    return toIndex;
  }

  /**
   * Remove and return the tab at the given index.
   *
   * Returns `undefined` if the index is invalid.
   */
  private _removeTab(index: number, animate: boolean): Tab {
    // Remove the tab from the tabs array.
    var tabs = this._tabs;
    var tab = algo.removeAt(tabs, index);

    // Bail early if the index is invalid.
    if (!tab) {
      return void 0;
    }

    // The mouse is always released when removing a tab. Attempting
    // to gracefully handle the rare case of removing a tab while
    // a drag is in progress it is not worth the effort.
    this._releaseMouse();

    // Ensure the tab is deselected and at the bottom of the Z-order.
    tab.selected = false;
    tab.node.style.zIndex = '0';

    // If the tab is the current tab, select the next best tab by
    // starting with the previous tab, then the next sibling, and
    // finally the previous sibling. Otherwise, update the state
    // and tab Z-order as appropriate.
    if (tab === this._currentTab) {
      var next = this._previousTab || tabs[index] || tabs[index - 1];
      this._currentTab = null;
      this._previousTab = null;
      if (next) {
        this.currentTab = next;
      } else {
        this.currentChanged.emit(this, new Pair(-1, void 0));
      }
    } else if (tab === this._previousTab) {
      this._previousTab =  null;
      this._updateTabZOrder();
    } else {
      this._updateTabZOrder();
    }

    // If the tab bar is not attached, remove the node immediately.
    if (!this.isAttached) {
      this._removeContentChild(tab.node);
      return tab;
    }

    // Animate the tab remove as appropriate.
    if (animate) {
      this._withTransition(() => {
        tab.addClass(REMOVING_CLASS);
        this._updateTabLayout();
      }, () => {
        tab.removeClass(REMOVING_CLASS);
        this._removeContentChild(tab.node);
      });
    } else {
      this._removeContentChild(tab.node);
      this._withTransition(() => { this._updateTabLayout() });
    }

    // Notify the layout system that the widget geometry is dirty.
    this.updateGeometry();

    return tab;
  }

  /**
   * Remove a child node of the tab bar content node.
   *
   * This is a no-op if the node is not a child of the content node.
   */
  private _removeContentChild(node: HTMLElement): void {
    var content = this.contentNode;
    if (content === node.parentNode) {
      content.removeChild(node);
    }
  }

  /**
   * Get the index of the tab which covers the given client position.
   *
   * Returns -1 if the client position does not intersect a tab.
   */
  private _hitTest(clientX: number, clientY: number): number {
    var tabs = this._tabs;
    for (var i = 0, n = tabs.length; i < n; ++i) {
      if (hitTest(tabs[i].node, clientX, clientY)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Compute the layout width of a tab.
   *
   * This computes a tab size as close as possible to the preferred
   * tab size, taking into account the minimum tab width, the current
   * tab bar width, and the tab overlap setting.
   */
  private _tabLayoutWidth(): number {
    var count = this.count;
    if (count === 0) {
      return 0;
    }
    var totalOverlap = this._tabOverlap * (count - 1);
    var totalWidth = this._tabWidth * count - totalOverlap;
    if (this.width >= totalWidth) {
      return this._tabWidth;
    }
    return Math.max(this._minTabWidth, (this.width + totalOverlap) / count);
  }

  /**
   * Update the Z-indices of the tabs for the current tab order.
   */
  private _updateTabZOrder(): void {
    var tabs = this._tabs;
    var k = tabs.length - 1;
    var current = this._currentTab;
    for (var i = 0, n = tabs.length; i < n; ++i) {
      var tab = tabs[i];
      if (tab === current) {
        tab.node.style.zIndex = n + '';
      } else {
        tab.node.style.zIndex = k-- + '';
      }
    }
  }

  /**
   * Update the position and size of the tabs in the tab bar.
   *
   * The position of the drag tab will not be updated.
   */
  private _updateTabLayout(): void {
    var dragNode: HTMLElement = null;
    if (this._dragData && this._dragData.dragActive) {
      dragNode = this._dragData.node;
    }
    var left = 0;
    var tabs = this._tabs;
    var width = this.width;
    var overlap = this._tabOverlap;
    var tlw = this._tabLayoutWidth();
    for (var i = 0, n = tabs.length; i < n; ++i) {
      var node = tabs[i].node;
      var style = node.style;
      if (node !== dragNode) {
        var offset = tlw + TAB_STUB_SIZE * (n - i - 1);
        if ((left + offset) > width) {
          left = Math.max(0, width - offset);
        }
        style.left = left + 'px';
      }
      style.width = tlw + 'px';
      left += tlw - overlap;
    }
  }

  /**
   * A helper function to execute an animated transition.
   *
   * This will add the transition class to the tab bar for the global
   * transition duration. The optional `onEnter` callback is invoked
   * immediately after the transition class is added. The optional
   * `onExit` callback will be invoked after the transition duration
   * has expired and the transition class is removed from the tab bar.
   *
   * If there is an active drag in progress, the transition class
   * will not be removed from the on exit.
   */
  private _withTransition(onEnter?: () => void, onExit?: () => void): void {
    var node = this.contentNode;
    node.classList.add(TRANSITION_CLASS);
    if (onEnter) {
      onEnter();
    }
    setTimeout(() => {
      if (!this._dragData || !this._dragData.dragActive) {
        node.classList.remove(TRANSITION_CLASS);
      }
      if (onExit) {
        onExit();
      }
    }, TRANSITION_DURATION);
  }

  /**
   * Initialize the tab bar state from an options object.
   */
  private _initFrom(options: ITabBarOptions): void {
    if (options.tabsMovable !== void 0) {
      this.tabsMovable = options.tabsMovable;
    }
    if (options.tabWidth !== void 0) {
      this.tabWidth = options.tabWidth;
    }
    if (options.minTabWidth !== void 0) {
      this.minTabWidth = options.minTabWidth;
    }
    if (options.tabOverlap !== void 0) {
      this.tabOverlap = options.tabOverlap;
    }
  }

  private _tabWidth = 175;
  private _tabOverlap = 0;
  private _minTabWidth = 45;
  private _tabs: Tab[] = [];
  private _tabsMovable = true;
  private _currentTab: Tab = null;
  private _previousTab: Tab = null;
  private _dragData: IDragData = null;
}


/**
 * An object which holds the drag data for a tab.
 */
interface IDragData {
  /**
   * The drag tab node.
   */
  node: HTMLElement;

  /**
   * The mouse press client X position.
   */
  pressX: number;

  /**
   * The mouse press client Y position.
   */
  pressY: number;

  /**
   * The mouse X position in tab coordinates.
   */
  offsetX: number;

  /**
   * The client rect of the tab bar content node.
   */
  contentRect: ClientRect;

  /**
   * The disposable to clean up the cursor override.
   */
  cursorGrab: IDisposable;

  /**
   * Whether the drag is currently active.
   */
  dragActive: boolean;

  /**
   * Whether the detach request signal has been emitted.
   */
  detachRequested: boolean;
}


/**
 * Test whether a point lies within an expanded rect.
 */
function inBounds(r: ClientRect, v: number, x: number, y: number) {
  if (x < r.left - v) {
    return false;
  }
  if (x >= r.right + v) {
    return false;
  }
  if (y < r.top - v) {
    return false;
  }
  if (y >= r.bottom + v) {
    return false;
  }
  return true;
}

} // module phosphor.widgets
