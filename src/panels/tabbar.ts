/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import IMessage = core.IMessage;
import IDisposable = core.IDisposable;
import Signal = core.Signal;

import hitTest = dom.hitTest;
import overrideCursor = dom.overrideCursor;


/**
 * The class name added to TabBar instances.
 */
var TAB_BAR_CLASS = 'p-TabBar';

/**
 * The class name added to the tab bar inner div.
 */
var INNER_CLASS = 'p-TabBar-inner';

/**
 * The class name added to the inner div when transitioning tabs.
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
 * The stub size of an overlapped tab.
 */
var TAB_STUB_SIZE = 5;


/**
 * The arguments object for the `attachTab` method.
 */
export
interface ITabAttachArgs {
  /**
   * The tab to add to the tab bar.
   */
  tab: ITab;

  /**
   * The current width of the tab.
   */
  tabWidth: number;

  /**
   * The X press position in tab coordinates.
   */
  offsetX: number;

  /**
   * The Y press position in tab coordinates.
   */
  offsetY: number;

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
 * The arguments object for various tab bar signals.
 */
export
interface ITabIndexArgs {
  /**
   * The index of interest.
   */
  index: number;

  /**
   * The tab associated with the index.
   */
  tab: ITab;
}


/**
 * The arguments object for the `tabMoved` signal.
 */
export
interface ITabMoveArgs {
  /**
   * The original tab index.
   */
  fromIndex: number;

  /**
   * The new tab index.
   */
  toIndex: number;
}


/**
 * The arguments object for the `tabDetachRequested` signal.
 */
export
interface ITabDetachArgs {
  /**
   * The index of the tab to detach.
   */
  index: number;

  /**
   * The tab to detach.
   */
  tab: ITab;

  /**
   * The current width of the tab.
   */
  tabWidth: number;

  /**
   * The X press position in tab coordinates.
   */
  offsetX: number;

  /**
   * The Y press position in tab coordinates.
   */
  offsetY: number;

  /**
   * The current client mouse X position.
   */
  clientX: number;

  /**
   * The current client mouse Y position.
   */
  clientY: number;
}


/**
 * A panel which displays a row of tabs.
 *
 * A tab bar should be treated as leaf content with no children.
 */
export
class TabBar extends Panel {
  /**
   * A signal emitted when a tab is moved.
   */
  tabMoved = new Signal<TabBar, ITabMoveArgs>();

  /**
   * A signal emitted when the currently selected tab is changed.
   */
  currentChanged = new Signal<TabBar, ITabIndexArgs>();

  /**
   * A signal emitted when the user clicks a tab close icon.
   */
  tabCloseRequested = new Signal<TabBar, ITabIndexArgs>();

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   */
  tabDetachRequested = new Signal<TabBar, ITabDetachArgs>();

  /**
   * Construct a new tab bar.
   */
  constructor() {
    super();
    this.node.classList.add(TAB_BAR_CLASS);
    this.verticalSizePolicy = SizePolicy.Fixed;
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this._releaseMouse();
    this._tabs = null;
    this.tabMoved.disconnect();
    this.currentChanged.disconnect();
    this.tabCloseRequested.disconnect();
    this.tabDetachRequested.disconnect();
    super.dispose();
  }

  /**
   * Get the index of the current tab.
   */
  get currentIndex(): number {
    return this._tabs.indexOf(this._currentTab);
  }

  /**
   * Set the selected tab index.
   */
  set currentIndex(index: number) {
    var prev = this._currentTab;
    var next = this._tabs[index] || null;
    if (prev === next) {
      return;
    }
    if (prev) prev.selected = false;
    if (next) next.selected = true;
    index = next ? index : -1;
    this._currentTab = next;
    this._previousTab = prev;
    this._updateTabZOrder();
    this.currentChanged.emit(this, { index: index, tab: next });
  }

  /**
   * Get the currently selected tab.
   */
  get currentTab(): ITab {
    return this._currentTab;
  }

  /**
   * Set the currently selected tab.
   */
  set currentTab(tab: ITab) {
    this.currentIndex = this._tabs.indexOf(tab);
  }

  /**
   * Get the previously selected tab.
   */
  get previousTab(): ITab {
    return this._previousTab;
  }

  /**
   * Get whether the tabs are movable by the user.
   */
  get tabsMovable(): boolean {
    return this._movable;
  }

  /**
   * Set whether the tabs are movable by the user.
   */
  set tabsMovable(movable: boolean) {
    this._movable = movable;
    if (!movable) this._releaseMouse();
  }

  /**
   * Get the desired tab width in pixels.
   */
  get tabWidth(): number {
    return this._tabWidth;
  }

  /**
   * Set the desired tab width in pixels.
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
    if (this.isAttached) {
      this._updateTabLayout();
      this.updateGeometry();
    }
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
  tabAt(index: number): ITab {
    return this._tabs[index];
  }

  /**
   * Get the index of the given tab.
   */
  tabIndex(tab: ITab): number {
    return this._tabs.indexOf(tab);
  }

  /**
   * Add a tab to the end of the tab bar.
   *
   * Returns the index of the tab.
   */
  addTab(tab: string | ITab): number {
    return this.insertTab(this._tabs.length, tab);
  }

  /**
   * Insert a tab into the tab bar at the given index.
   *
   * Returns the index of the tab.
   */
  insertTab(index: number, tab: string | ITab): number {
    var tabs = this._tabs;
    index = Math.max(0, Math.min(index | 0, tabs.length));
    if (typeof tab === 'string') {
      this._insertTab(index, new Tab(tab), true);
    } else {
      var curr = tabs.indexOf(tab);
      if (curr !== -1) {
        index = this.moveTab(curr, index);
      } else {
        this._insertTab(index, tab, true);
      }
    }
    return index;
  }

  /**
   * Move a tab from one index to another.
   *
   * Returns the new tab index.
   */
  moveTab(fromIndex: number, toIndex: number): number {
    fromIndex = fromIndex | 0;
    var count = this._tabs.length;
    if (fromIndex < 0 || fromIndex >= count) {
      return -1;
    }
    toIndex = Math.max(0, Math.min(toIndex | 0, count - 1));
    if (fromIndex === toIndex) {
      return toIndex;
    }
    this._moveTab(fromIndex, toIndex);
    return toIndex;
  }

  /**
   * Remove a tab from the tab bar by index.
   *
   * Returns the removed tab.
   */
  takeAt(index: number, animate = true): ITab {
    index = index | 0;
    var tabs = this._tabs;
    if (index < 0 || index >= tabs.length) {
      return void 0;
    }
    var tab = this._tabs[index];
    this._removeTab(index, animate);
    return tab;
  }

  /**
   * Remove a tab from the tab bar by value.
   *
   * Returns the index of the removed item.
   */
  removeTab(tab: ITab, animate = true): number {
    var index = this._tabs.indexOf(tab);
    this.takeAt(index, animate);
    return index;
  }

  /**
   * Remove all of the tabs from the tab bar.
   *
   * This is more efficient than removing the tabs individually.
   */
  clearTabs(): void {
    this._releaseMouse();
    if (this._currentTab) {
      this._currentTab.selected = false;
      this._currentTab = null;
    }
    this._previousTab = null;
    this._tabs.length = 0;
    (<HTMLElement>this.node.firstChild).innerHTML = '';
    if (this.isAttached) {
      this.updateGeometry();
    }
  }

  /**
   * Attach a tab to the tab bar.
   *
   * This will immediately insert the tab with no transition. It will
   * then grab the mouse to continue the tab drag. It assumes the left
   * mouse button is down.
   */
  attachTab(args: ITabAttachArgs): void {
    var curr = this._tabs.indexOf(args.tab);
    var inner = <HTMLElement>this.node.firstChild;
    var innerRect = inner.getBoundingClientRect();
    var localLeft = args.clientX - args.offsetX - innerRect.left;
    var index = localLeft / (this._tabLayoutWidth() - this._tabOverlap);
    index = Math.max(0, Math.min(Math.round(index), this._tabs.length));
    if (curr === -1) {
      this._insertTab(index, args.tab, false);
    } else if (curr !== index) {
      this._moveTab(curr, index);
    }
    this.currentIndex = index;
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);
    if (!this._movable) {
      return;
    }
    var node = args.tab.node;
    var tabWidth = this._tabLayoutWidth();
    var offsetX = tabWidth * (args.offsetX / args.tabWidth);
    var maxX = this.width - tabWidth;
    var localX = args.clientX - innerRect.left - offsetX;
    var targetX = Math.max(0, Math.min(localX, maxX));
    var grab = overrideCursor(window.getComputedStyle(node).cursor);
    this._dragData = {
      node: node,
      pressX: args.clientX,
      pressY: args.clientY,
      offsetX: offsetX,
      offsetY: args.offsetY,
      innerRect: innerRect,
      cursorGrab: grab,
      dragActive: true,
      emitted: false,
    };
    inner.classList.add(TRANSITION_CLASS);
    node.style.transition = 'none';
    this._updateTabLayout();
    node.style.left = targetX + 'px';
  }

  /**
   * Compute the size hint for the tab bar.
   */
  sizeHint(): Size {
    var width = 0;
    var count = this._tabs.length;
    if (count > 0) {
      var overlap = this._tabOverlap * (count - 1);
      width = this._tabWidth * count - overlap;
    }
    var style = window.getComputedStyle(this.node);
    var height = parseInt(style.minHeight, 10) || 0;
    return new Size(width, height);
  }

  /**
   * Compute the minimum size hint for the tab bar.
   */
  minSizeHint(): Size {
    var width = 0;
    var count = this._tabs.length;
    if (count > 0) {
      var stub = TAB_STUB_SIZE * (count - 1);
      width = this._minTabWidth + stub;
    }
    var style = window.getComputedStyle(this.node);
    var height = parseInt(style.minHeight, 10) || 0;
    return new Size(width, height);
  }

  /**
   * Create the DOM node for the tab bar.
   */
  protected createNode(): HTMLElement {
    var node = document.createElement('div');
    var inner = document.createElement('ul');
    inner.className = INNER_CLASS;
    node.appendChild(inner);
    return node;
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
        this.domEvent_click(<MouseEvent>event);
        break;
      case 'mousedown':
        this.domEvent_mousedown(<MouseEvent>event);
        break;
      case 'mousemove':
        this.domEvent_mousemove(<MouseEvent>event);
        break;
      case 'mouseup':
        this.domEvent_mouseup(<MouseEvent>event);
        break;
      default:
        break;
    }
  }

  /**
   * Handle the click event for the tab bar.
   */
  protected domEvent_click(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    var clientX = event.clientX;
    var clientY = event.clientY;
    var index = this._indexAtPos(clientX, clientY);
    if (index < 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    var tab = this._tabs[index];
    var icon = tab.closeIconNode;
    if (icon && icon === event.target && tab.closable) {
      this.tabCloseRequested.emit(this, { index: index, tab: tab });
    }
  }

  /**
   * Handle the mousedown event for the tab bar.
   */
  protected domEvent_mousedown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    var clientX = event.clientX;
    var clientY = event.clientY;
    var index = this._indexAtPos(clientX, clientY);
    if (index < 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    var tab = this._tabs[index];
    var icon = tab.closeIconNode;
    if (icon && icon === event.target) {
      return;
    }
    if (this._movable) {
      var node = tab.node;
      var rect = node.getBoundingClientRect();
      this._dragData = {
        node: node,
        pressX: clientX,
        pressY: clientY,
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        innerRect: null,
        cursorGrab: null,
        dragActive: false,
        emitted: false,
      };
    }
    this.currentIndex = index;
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);
  }

  /**
   * Handle the mouse move event for the tab bar.
   */
  protected domEvent_mousemove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this._movable || !this._dragData) {
      return;
    }
    var clientX = event.clientX;
    var clientY = event.clientY;
    var data = this._dragData;
    if (!data.dragActive) {
      var dx = Math.abs(clientX - data.pressX);
      var dy = Math.abs(clientY - data.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }
      var inner = <HTMLElement>this.node.firstChild;
      var innerRect = inner.getBoundingClientRect();
      var cursor = window.getComputedStyle(data.node).cursor;
      var grab = overrideCursor(cursor);
      data.innerRect = innerRect;
      data.cursorGrab = grab;
      data.dragActive = true;
      inner.classList.add(TRANSITION_CLASS);
      data.node.style.transition = 'none';
    }
    var tabWidth = this._tabLayoutWidth();
    if (!data.emitted) {
      var innerRect = data.innerRect;
      if (!inBounds(innerRect, DETACH_THRESHOLD, clientX, clientY)) {
        var args: ITabDetachArgs = {
          index: this.currentIndex,
          tab: this.currentTab,
          tabWidth: tabWidth,
          offsetX: data.offsetX,
          offsetY: data.offsetY,
          clientX: clientX,
          clientY: clientY,
        };
        data.emitted = true;
        this.tabDetachRequested.emit(this, args);
        if (!this._dragData) { // tab detached
          return;
        }
      }
    }
    var index = this.currentIndex;
    var naturalX = index * (tabWidth - this._tabOverlap);
    var lowerBound = naturalX - tabWidth * OVERLAP_THRESHOLD;
    var upperBound = naturalX + tabWidth * OVERLAP_THRESHOLD;
    var localX = event.clientX - data.innerRect.left - data.offsetX;
    var targetX = Math.max(0, Math.min(localX, this.width - tabWidth));
    if (targetX < lowerBound) {
      this.moveTab(index, index - 1);
    } else if (targetX > upperBound) {
      this.moveTab(index, index + 1);
    }
    data.node.style.left = targetX + 'px';
  }

  /**
   * Handle the mouse up event for the tab bar.
   */
  protected domEvent_mouseup(event: MouseEvent): void {
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
    var data = this._dragData;
    if (!data) {
      return;
    }
    this._dragData = null;
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);
    if (data && data.dragActive) {
      data.cursorGrab.dispose();
      data.node.style.transition = '';
      this._withTransition(() => this._updateTabLayout());
    }
  }

  /**
   * Insert a new tab into the tab bar at a valid index.
   */
  private _insertTab(index: number, tab: ITab, animate: boolean): void {
    tab.selected = false;
    this._tabs.splice(index, 0, tab);
    (<HTMLElement>this.node.firstChild).appendChild(tab.node);
    if (!this._currentTab) {
      this.currentTab = tab;
    } else {
      this._updateTabZOrder();
    }
    if (!this.isAttached) {
      return;
    }
    if (animate) {
      this._withTransition(() => {
        tab.node.classList.add(INSERTING_CLASS);
        this._updateTabLayout();
      }, () => {
        tab.node.classList.remove(INSERTING_CLASS);
      });
    } else {
      this._withTransition(() => this._updateTabLayout());
    }
    this.updateGeometry();
  }

  /**
   * Move an item to a new index in the tab bar.
   */
  private _moveTab(fromIndex: number, toIndex: number): void {
    var tab = this._tabs.splice(fromIndex, 1)[0];
    this._tabs.splice(toIndex, 0, tab);
    this._updateTabZOrder();
    this.tabMoved.emit(this, { fromIndex: fromIndex, toIndex: toIndex });
    if (!this.isAttached) {
      return;
    }
    this._withTransition(() => this._updateTabLayout());
  }

  /**
   * Remove the tab at the given index from the tab bar.
   */
  private _removeTab(index: number, animate: boolean): void {
    this._releaseMouse();
    var tabs = this._tabs;
    var tab = tabs.splice(index, 1)[0];
    tab.selected = false;
    tab.node.style.zIndex = '0';
    if (tab === this._currentTab) {
      var next = this._previousTab || tabs[index] || tabs[index - 1];
      this._currentTab = null;
      this._previousTab = null;
      if (next) {
        this.currentTab = next;
      } else {
        this.currentChanged.emit(this, { index: -1, tab: void 0 });
      }
    } else if (tab === this._previousTab) {
      this._previousTab =  null;
      this._updateTabZOrder();
    } else {
      this._updateTabZOrder();
    }
    var inner = <HTMLElement>this.node.firstChild;
    if (!this.isAttached) {
      inner.removeChild(tab.node);
      return;
    }
    if (animate) {
      this._withTransition(() => {
        tab.node.classList.add(REMOVING_CLASS);
        this._updateTabLayout();
      }, () => {
        tab.node.classList.remove(REMOVING_CLASS);
        inner.removeChild(tab.node);
      });
    } else {
      inner.removeChild(tab.node);
      this._withTransition(() => this._updateTabLayout());
    }
    this.updateGeometry();
  }

  /**
   * Update the Z order of the tab nodes in the tab bar.
   */
  private _updateTabZOrder(): void {
    var tabs = this._tabs;
    var index = tabs.length - 1;
    for (var i = 0, n = tabs.length; i < n; ++i) {
      var tab = tabs[i];
      if (tab === this._currentTab) {
        tab.node.style.zIndex = tabs.length + '';
      } else {
        tab.node.style.zIndex = index-- + '';
      }
    }
  }

  /**
   * Get the index of the tab which covers the given client position.
   */
  private _indexAtPos(clientX: number, clientY: number): number {
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
   * tab size (but not less than the minimum), taking into account
   * the current tab bar inner div width and tab overlap setting.
   */
  private _tabLayoutWidth(): number {
    var count = this._tabs.length;
    if (count === 0) {
      return 0;
    }
    var totalOverlap = this._tabOverlap * (count - 1);
    var totalWidth = this._tabWidth * count - totalOverlap;
    if (this.width >= totalWidth) {
      return this._tabWidth;
    }
    var ideal = (this.width + totalOverlap) / count;
    return Math.max(this._minTabWidth, ideal);
  }

  /**
   * Update the layout of the tabs in the tab bar.
   *
   * This will update the position and size of the tabs according to
   * the current inner width of the tab bar. The position of the drag
   * tab will not be updated.
   */
  private _updateTabLayout(): void {
    var left = 0;
    var width = this.width;
    var tabs = this._tabs;
    var stub = TAB_STUB_SIZE;
    var data = this._dragData;
    var overlap = this._tabOverlap;
    var tabWidth = this._tabLayoutWidth();
    var dragNode = data && data.dragActive && data.node;
    for (var i = 0, n = tabs.length; i < n; ++i) {
      var node = tabs[i].node;
      var style = node.style;
      if (node !== dragNode) {
        var stubOffset = tabWidth + stub * (n - i - 1);
        if (left + stubOffset > width) {
          left = Math.max(0, width - stubOffset);
        }
        style.left = left + 'px';
      }
      style.width = tabWidth + 'px';
      left += tabWidth - overlap;
    }
  }

  /**
   * A helper function to execute an animated transition.
   *
   * This will execute the enter after the transition class has been
   * added to the tab bar, and execute the exit callback after the
   * transition duration has expired and the transition class has
   * been removed from the tab bar.
   *
   * If there is an active drag in progress, the transition class
   * will not be removed from the inner div on exit.
   */
  private _withTransition(enter?: () => void, exit?: () => void): void {
    var inner = <HTMLElement>this.node.firstChild;
    inner.classList.add(TRANSITION_CLASS);
    if (enter) enter();
    setTimeout(() => {
      var data = this._dragData;
      if (!data || !data.dragActive) {
        inner.classList.remove(TRANSITION_CLASS);
      }
      if (exit) exit();
    }, TRANSITION_DURATION);
  }

  private _movable = true;
  private _tabWidth = 175;
  private _tabOverlap = 1;
  private _minTabWidth = 45;
  private _currentTab: ITab = null;
  private _previousTab: ITab = null;
  private _dragData: IDragData = null;
  private _tabs: ITab[] = [];
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
   * The mouse Y position in tab coordinates.
   */
  offsetY: number;

  /**
   * The client rect of the inner tab bar node.
   */
  innerRect: ClientRect;

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
  emitted: boolean;
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

} // module phosphor.panels
