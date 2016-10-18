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
  move
} from '../algorithm/mutation';

import {
  findIndex, indexOf
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

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
  overrideCursor
} from '../dom/cursor';

import {
  hitTest
} from '../dom/query';

import {
  Title
} from './title';

import {
  VNode, h, realize, render
} from './vdom';

import {
  Widget, WidgetFlag, WidgetMessage
} from './widget';


/**
 * The class name added to TabBar instances.
 */
const TAB_BAR_CLASS = 'p-TabBar';

/**
 * The class name added to a tab bar content node.
 */
const CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to a tab bar tab.
 */
const TAB_CLASS = 'p-TabBar-tab';

/**
 * The class name added to a tab label node.
 */
const LABEL_CLASS = 'p-TabBar-tabLabel';

/**
 * The class name added to a tab icon node.
 */
const ICON_CLASS = 'p-TabBar-tabIcon';

/**
 * The class name added to a tab close icon node.
 */
const CLOSE_ICON_CLASS = 'p-TabBar-tabCloseIcon';

/**
 * The class name added to a tab bar and tab when dragging.
 */
const DRAGGING_CLASS = 'p-mod-dragging';

/**
 * The class name added to the current tab.
 */
const CURRENT_CLASS = 'p-mod-current';

/**
 * The class name added to a closable tab.
 */
const CLOSABLE_CLASS = 'p-mod-closable';

/**
 * The start drag distance threshold.
 */
const DRAG_THRESHOLD = 5;

/**
 * The detach distance threshold.
 */
const DETACH_THRESHOLD = 20;

/**
 * The DOM structure for a TabBar.
 */
const TAB_BAR_NODE = (
  h.div(
    h.ul({ className: CONTENT_CLASS })
  )
);


/**
 * A widget which displays titles as a single row or column of tabs.
 *
 * #### Notes
 * If CSS transforms are used to rotate nodes for vertically oriented
 * text, then tab dragging will not work correctly. The `tabsMovable`
 * property should be set to `false` when rotating nodes from CSS.
 */
export
class TabBar extends Widget {
  /**
   * Construct a new tab bar.
   *
   * @param options - The options for initializing the tab bar.
   */
  constructor(options: TabBar.IOptions = {}) {
    super({ node: realize(TAB_BAR_NODE) });
    this.addClass(TAB_BAR_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
    this._tabsMovable = options.tabsMovable || false;
    this._allowDeselect = options.allowDeselect || false;
    this._orientation = options.orientation || 'horizontal';
    this._renderer = options.renderer || TabBar.defaultRenderer;
    this._insertBehavior = options.insertBehavior || 'select-tab-if-needed';
    this._removeBehavior = options.removeBehavior || 'select-tab-after';
    this.addClass(`p-mod-${this._orientation}`);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    this._titles.clear();
    this._renderer = null;
    this._previousTitle = null;
    super.dispose();
  }

  /**
   * A signal emitted when the current tab is changed.
   *
   * #### Notes
   * This signal is emitted when the currently selected tab is changed
   * either through user or programmatic interaction.
   *
   * Notably, this signal is not emitted when the index of the current
   * tab changes due to tabs being inserted, removed, or moved. It is
   * only emitted when the actual current tab node is changed.
   */
  currentChanged: ISignal<TabBar, TabBar.ICurrentChangedArgs>;

  /**
   * A signal emitted when a tab is moved by the user.
   *
   * #### Notes
   * This signal is emitted when a tab is moved by user interaction.
   *
   * This signal is not emitted when a tab is moved programmatically.
   */
  tabMoved: ISignal<TabBar, TabBar.ITabMovedArgs>;

  /**
   * A signal emitted when a tab is clicked by the user.
   *
   * #### Notes
   * If the clicked tab is not the current tab, the clicked tab will be
   * made current and the `currentChanged` signal will be emitted first.
   *
   * This signal is emitted even if the clicked tab is the current tab.
   */
  tabActivateRequested: ISignal<TabBar, TabBar.ITabActivateRequestedArgs>;

  /**
   * A signal emitted when a tab close icon is clicked.
   *
   * #### Notes
   * This signal is not emitted unless the tab title is `closable`.
   */
  tabCloseRequested: ISignal<TabBar, TabBar.ITabCloseRequestedArgs>;

  /**
   * A signal emitted when a tab is dragged beyond the detach threshold.
   *
   * #### Notes
   * This signal is emitted when the user drags a tab with the mouse,
   * and mouse is dragged beyond the detach threshold.
   *
   * The consumer of the signal should call `releaseMouse` and remove
   * the tab in order to complete the detach.
   *
   * This signal is only emitted once per drag cycle.
   */
  tabDetachRequested: ISignal<TabBar, TabBar.ITabDetachRequestedArgs>;

  /**
   * Get the tab bar content node.
   *
   * #### Notes
   * This is the node which holds the tab nodes.
   *
   * Modifying this node directly can lead to undefined behavior.
   *
   * This is a read-only property.
   */
  get contentNode(): HTMLUListElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLUListElement;
  }

  /**
   * A read-only sequence of the titles in the tab bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get titles(): ISequence<Title> {
    return this._titles;
  }

  /**
   * Get the currently selected title.
   *
   * #### Notes
   * This will be `null` if no tab is selected.
   */
  get currentTitle(): Title {
    let i = this._currentIndex;
    return i !== -1 ? this._titles.at(i) : null;
  }

  /**
   * Set the currently selected title.
   *
   * #### Notes
   * If the title does not exist, the title will be set to `null`.
   */
  set currentTitle(value: Title) {
    this.currentIndex = indexOf(this._titles, value);
  }

  /**
   * Get the index of the currently selected tab.
   *
   * #### Notes
   * This will be `-1` if no tab is selected.
   */
  get currentIndex(): number {
    return this._currentIndex;
  }

  /**
   * Set the index of the currently selected tab.
   *
   * #### Notes
   * If the value is out of range, the index will be set to `-1`.
   */
  set currentIndex(value: number) {
    // Coerce the value to an index.
    let i = Math.floor(value);
    if (i < 0 || i >= this._titles.length) {
      i = -1;
    }

    // Bail early if the index will not change.
    if (this._currentIndex === i) {
      return;
    }

    // Look up the previous index and title.
    let pi = this._currentIndex;
    let pt = pi === -1 ? null : this._titles.at(pi);

    // Look up the current index and title.
    let ci = i;
    let ct = ci === -1 ? null : this._titles.at(ci);

    // Update the current index and previous title.
    this._currentIndex = ci;
    this._previousTitle = pt;

    // Emit the current changed signal.
    this.currentChanged.emit({
      previousIndex: pi, previousTitle: pt,
      currentIndex: ci, currentTitle: ct
    });

    // Schedule an update of the tabs.
    this.update();
  }

  /**
   * Get the orientation of the tab bar.
   *
   * #### Notes
   * This controls whether the tabs are arranged in a row or column.
   */
  get orientation(): TabBar.Orientation {
    return this._orientation;
  }

  /**
   * Set the orientation of the tab bar.
   *
   * #### Notes
   * This controls whether the tabs are arranged in a row or column.
   */
  set orientation(value: TabBar.Orientation) {
    // Do nothing if the orientation does not change.
    if (this._orientation === value) {
      return;
    }

    // Release the mouse before making any changes.
    this._releaseMouse();

    // Swap the orientation values.
    let old = this._orientation;
    this._orientation = value;

    // Toggle the orientation classes.
    this.removeClass(`p-mod-${old}`);
    this.addClass(`p-mod-${value}`);
  }

  /**
   * Get whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  get tabsMovable(): boolean {
    return this._tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can always be moved programmatically.
   */
  set tabsMovable(value: boolean) {
    this._tabsMovable = value;
  }

  /**
   * Get whether a tab can be deselected by the user.
   *
   * #### Notes
   * Tabs can be always be deselected programmatically.
   */
  get allowDeselect(): boolean {
    return this._allowDeselect;
  }

  /**
   * Set whether a tab can be deselected by the user.
   *
   * #### Notes
   * Tabs can be always be deselected programmatically.
   */
  set allowDeselect(value: boolean) {
    this._allowDeselect = value;
  }

  /**
   * Get the selection behavior when inserting a tab.
   */
  get insertBehavior(): TabBar.InsertBehavior {
    return this._insertBehavior;
  }

  /**
   * Set the selection behavior when inserting a tab.
   */
  set insertBehavior(value: TabBar.InsertBehavior) {
    this._insertBehavior = value;
  }

  /**
   * Get the selection behavior when removing a tab.
   */
  get removeBehavior(): TabBar.RemoveBehavior {
    return this._removeBehavior;
  }

  /**
   * Set the selection behavior when removing a tab.
   */
  set removeBehavior(value: TabBar.RemoveBehavior) {
    this._removeBehavior = value;
  }

  /**
   * The renderer used by the tab bar.
   *
   * #### Notes
   * This is a read-only property.
   */
  get renderer(): TabBar.IRenderer {
    return this._renderer;
  }

  /**
   * Add a tab to the end of the tab bar.
   *
   * @param value - The title which holds the data for the tab,
   *   or an options object to convert to a title.
   *
   * @returns The title object added to the tab bar.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  addTab(value: Title | Title.IOptions): Title {
    return this.insertTab(this._titles.length, value);
  }

  /**
   * Insert a tab into the tab bar at the specified index.
   *
   * @param index - The index at which to insert the tab.
   *
   * @param value - The title which holds the data for the tab,
   *   or an options object to convert to a title.
   *
   * @returns The title object added to the tab bar.
   *
   * #### Notes
   * The index will be clamped to the bounds of the tabs.
   *
   * If the title is already added to the tab bar, it will be moved.
   */
  insertTab(index: number, value: Title | Title.IOptions): Title {
    // Release the mouse before making any changes.
    this._releaseMouse();

    // Coerce the value to a title.
    let title = Private.asTitle(value);

    // Look up the index of the title.
    let i = indexOf(this._titles, title);

    // Clamp the insert index to the vector bounds.
    let j = Math.max(0, Math.min(Math.floor(index), this._titles.length));

    // If the title is not in the vector, insert it.
    if (i === -1) {
      // Insert the title into the vector.
      this._titles.insert(j, title);

      // Connect to the title changed signal.
      title.changed.connect(this._onTitleChanged, this);

      // Adjust the current index for the insert.
      this._adjustCurrentForInsert(j, title);

      // Schedule an update of the tabs.
      this.update();

      // Return the title added to the tab bar.
      return title;
    }

    // Otherwise, the title exists in the vector and should be moved.

    // Adjust the index if the location is at the end of the vector.
    if (j === this._titles.length) j--;

    // Bail if there is no effective move.
    if (i === j) return title;

    // Move the title to the new location.
    move(this._titles, i, j);

    // Adjust the current index for the move.
    this._adjustCurrentForMove(i, j);

    // Schedule an update of the tabs.
    this.update();

    // Return the title added to the tab bar.
    return title;
  }

  /**
   * Remove a tab from the tab bar.
   *
   * @param title - The title for the tab to remove.
   *
   * @returns The index occupied by the tab, or `-1` if the tab
   *   was not contained in the tab bar.
   */
  removeTab(title: Title): number {
    let index = indexOf(this._titles, title);
    if (index !== -1) this.removeTabAt(index);
    return index;
  }

  /**
   * Remove the tab at a given index from the tab bar.
   *
   * @param index - The index of the tab to remove.
   *
   * @returns The title occupying the index, or `null` if the index
   *   is out of range.
   */
  removeTabAt(index: number): Title {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._titles.length) {
      return null;
    }

    // Release the mouse before making any changes.
    this._releaseMouse();

    // Remove the title from the vector.
    let title = this._titles.removeAt(i);

    // Disconnect from the title changed signal.
    title.changed.disconnect(this._onTitleChanged, this);

    // Clear the previous title if it's being removed.
    if (title === this._previousTitle) {
      this._previousTitle = null;
    }

    // Adjust the current index for the remove.
    this._adjustCurrentForRemove(i, title);

    // Schedule an update of the tabs.
    this.update();

    // Return the removed title.
    return title;
  }

  /**
   * Remove all tabs from the tab bar.
   */
  clearTabs(): void {
    // Bail if there is nothing to remove.
    if (this._titles.length === 0) {
      return;
    }

    // Release the mouse before making any changes.
    this._releaseMouse();

    // Disconnect from the title changed signals.
    each(this._titles, title => {
      title.changed.disconnect(this._onTitleChanged, this);
    });

    // Get the current index and title.
    let pi = this.currentIndex;
    let pt = this.currentTitle;

    // Reset the current index and previous title.
    this._currentIndex = -1;
    this._previousTitle = null;

    // Clear the title vector.
    this._titles.clear();

    // Schedule an update of the tabs.
    this.update();

    // If no tab was selected, there's nothing else to do.
    if (pi === -1) {
      return;
    }

    // Emit the current changed signal.
    this.currentChanged.emit({
      previousIndex: pi, previousTitle: pt,
      currentIndex: -1, currentTitle: null
    });
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   *
   * #### Notes
   * This will cause the tab bar to stop handling mouse events and to
   * restore the tabs to their non-dragged positions.
   */
  releaseMouse(): void {
    this._releaseMouse();
  }

  /**
   * Handle the DOM events for the tab bar.
   *
   * @param event - The DOM event sent to the tab bar.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tab bar's DOM node.
   *
   * This should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'click':
      this._evtClick(event as MouseEvent);
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
    this.node.addEventListener('click', this);
    this.node.addEventListener('mousedown', this);
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   */
  protected onBeforeDetach(msg: Message): void {
    this.node.removeEventListener('click', this);
    this.node.removeEventListener('mousedown', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    let content: VNode[] = [];
    let titles = this._titles;
    let renderer = this._renderer;
    let currentTitle = this.currentTitle;
    for (let i = 0, n = titles.length; i < n; ++i) {
      let title = titles.at(i);
      let current = title === currentTitle;
      let zIndex = current ? n : n - i - 1;
      content.push(renderer.renderTab({ title, current, zIndex }));
    }
    render(content, this.contentNode);
  }

  /**
   * Handle the `'keydown'` event for the tab bar.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop all input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) this._releaseMouse();
  }

  /**
   * Handle the `'click'` event for the tab bar.
   */
  private _evtClick(event: MouseEvent): void {
    // Do nothing if it's not a left click.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Lookup the tab nodes.
    let tabs = this.contentNode.children;

    // Do nothing if the click is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(tabs, tab => hitTest(tab, x, y));
    if (i < 0) {
      return;
    }

    // Clicking on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the click if the title is not closable.
    let title = this._titles.at(i);
    if (!title.closable) {
      return;
    }

    // Ignore the click if it was not on a close icon.
    let icon = tabs[i].querySelector(this._renderer.closeIconSelector);
    if (!icon || !icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Emit the tab close requested signal.
    this.tabCloseRequested.emit({ index: i, title });
  }

  /**
   * Handle the `'mousedown'` event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if it's not a left mouse press.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if a drag is in progress.
    if (this._dragData) {
      return;
    }

    // Lookup the tab nodes.
    let tabs = this.contentNode.children;

    // Do nothing if the press is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(tabs, tab => hitTest(tab, x, y));
    if (i < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the press if it was on a close icon.
    let icon = tabs[i].querySelector(this._renderer.closeIconSelector);
    if (icon && icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Setup the drag data if the tabs are movable.
    if (this._tabsMovable) {
      this._dragData = new Private.DragData();
      this._dragData.index = i;
      this._dragData.tab = tabs[i] as HTMLElement;
      this._dragData.pressX = event.clientX;
      this._dragData.pressY = event.clientY;
      document.addEventListener('mousemove', this, true);
      document.addEventListener('mouseup', this, true);
      document.addEventListener('keydown', this, true);
      document.addEventListener('contextmenu', this, true);
    }

    // Update the current index as appropriate.
    if (this._allowDeselect && this._currentIndex === i) {
      this.currentIndex = -1;
    } else {
      this.currentIndex = i;
    }

    // Do nothing else if there is no current tab.
    if (this._currentIndex === -1) {
      return;
    }

    // Emit the tab activate request signal.
    this.tabActivateRequested.emit({
      index: this.currentIndex,
      title: this.currentTitle
    });
  }

  /**
   * Handle the `'mousemove'` event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Suppress the event during a drag.
    event.preventDefault();
    event.stopPropagation();

    // Lookup the tab nodes.
    let tabs = this.contentNode.children;

    // Check the threshold if the drag is not active.
    let data = this._dragData;
    if (!data.dragActive) {
      // Bail if the drag threshold is not exceeded.
      let dx = Math.abs(event.clientX - data.pressX);
      let dy = Math.abs(event.clientY - data.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }

      // Fill in the rest of the drag data measurements.
      let tabRect = data.tab.getBoundingClientRect();
      if (this._orientation === 'horizontal') {
        data.tabPos = data.tab.offsetLeft;
        data.tabSize = tabRect.width;
        data.tabPressPos = data.pressX - tabRect.left;
      } else {
        data.tabPos = data.tab.offsetTop;
        data.tabSize = tabRect.height;
        data.tabPressPos = data.pressY - tabRect.top;
      }
      data.tabLayout = Private.snapTabLayout(tabs, this._orientation);
      data.contentRect = this.contentNode.getBoundingClientRect();
      data.override = overrideCursor('default');

      // Add the dragging style classes.
      data.tab.classList.add(DRAGGING_CLASS);
      this.addClass(DRAGGING_CLASS);

      // Mark the drag as active.
      data.dragActive = true;
    }

    // Emit the detach requested signal if the threshold is exceeded.
    if (!data.detachRequested && Private.detachExceeded(data, event)) {
      // Only emit the signal once per drag cycle.
      data.detachRequested = true;

      // Setup the arguments for the signal.
      let index = data.index;
      let clientX = event.clientX;
      let clientY = event.clientY;
      let tab = tabs[index] as HTMLElement;
      let title = this._titles.at(index);

      // Emit the tab detach requested signal.
      this.tabDetachRequested.emit({ index, title, tab, clientX, clientY });

      // Bail if the signal handler aborted the drag.
      if (data.dragAborted) {
        return;
      }
    }

    // Update the positions of the tabs.
    Private.layoutTabs(tabs, data, event, this._orientation);
  }

  /**
   * Handle the `'mouseup'` event for the tab bar.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if it's not a left mouse release.
    if (event.button !== 0) {
      return;
    }

    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Suppress the event during a drag operation.
    event.preventDefault();
    event.stopPropagation();

    // Remove the extra mouse event listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Bail early if the drag is not active.
    let data = this._dragData;
    if (!data.dragActive) {
      this._dragData = null;
      return;
    }

    // Position the tab at its final resting position.
    Private.finalizeTabPosition(data, this._orientation);

    // Remove the dragging class from the tab so it can be transitioned.
    data.tab.classList.remove(DRAGGING_CLASS);

    // Parse the transition duration for releasing the tab.
    let duration = Private.parseTransitionDuration(data.tab);

    // Complete the release on a timer to allow the tab to transition.
    setTimeout(() => {
      // Do nothing if the drag has been aborted.
      if (data.dragAborted) {
        return;
      }

      // Clear the drag data reference.
      this._dragData = null;

      // Reset the positions of the tabs.
      Private.resetTabPositions(this.contentNode.children, this._orientation);

      // Clear the cursor grab.
      data.override.dispose();

      // Remove the remaining dragging style.
      this.removeClass(DRAGGING_CLASS);

      // If the tab was not moved, there is nothing else to do.
      let i = data.index;
      let j = data.targetIndex;
      if (j === -1 || i === j) {
        return;
      }

      // Move the title to the new locations.
      move(this._titles, i, j);

      // Adjust the current index for the move.
      this._adjustCurrentForMove(i, j);

      // Emit the tab moved signal.
      this.tabMoved.emit({
        fromIndex: i, toIndex: j, title: this._titles.at(j)
      });

      // Update the tabs immediately to prevent flicker.
      sendMessage(this, WidgetMessage.UpdateRequest);
    }, duration);
  }

  /**
   * Release the mouse and restore the non-dragged tab positions.
   */
  private _releaseMouse(): void {
    // Do nothing if no drag is in progress.
    if (!this._dragData) {
      return;
    }

    // Remove the extra mouse listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Clear the drag data reference.
    let data = this._dragData;
    this._dragData = null;

    // Indicate the drag has been aborted. This allows the mouse
    // event handlers to return early when the drag is canceled.
    data.dragAborted = true;

    // If the drag is not active, there's nothing more to do.
    if (!data.dragActive) {
      return;
    }

    // Reset the tabs to their non-dragged positions.
    Private.resetTabPositions(this.contentNode.children, this._orientation);

    // Clear the cursor override.
    data.override.dispose();

    // Clear the dragging style classes.
    data.tab.classList.remove(DRAGGING_CLASS);
    this.removeClass(DRAGGING_CLASS);
  }

  /**
   * Adjust the current index for a tab insert operation.
   *
   * This method accounts for the tab bar's insertion behavior when
   * adjusting the current index and emitting the changed signal.
   */
  private _adjustCurrentForInsert(i: number, title: Title): void {
    // Lookup commonly used variables.
    let ct = this.currentTitle;
    let ci = this._currentIndex;
    let bh = this._insertBehavior;

    // Handle the behavior where the new tab is always selected,
    // or the behavior where the new tab is selected if needed.
    if (bh === 'select-tab' || (bh === 'select-tab-if-needed' && ci === -1)) {
      this._currentIndex = i;
      this._previousTitle = ct;
      this.currentChanged.emit({
        previousIndex: ci, previousTitle: ct,
        currentIndex: i, currentTitle: title
      });
      return;
    }

    // Otherwise, silently adjust the current index if needed.
    if (ci >= i) this._currentIndex++;
  }

  /**
   * Adjust the current index for a tab move operation.
   *
   * This method will not cause the actual current tab to change.
   * It silently adjusts the index to account for the given move.
   */
  private _adjustCurrentForMove(i: number, j: number): void {
    if (this._currentIndex === i) {
      this._currentIndex = j;
    } else if (this._currentIndex < i && this._currentIndex >= j) {
      this._currentIndex++;
    } else if (this._currentIndex > i && this._currentIndex <= j) {
      this._currentIndex--;
    }
  }

  /**
   * Adjust the current index for a tab remove operation.
   *
   * This method accounts for the tab bar's remove behavior when
   * adjusting the current index and emitting the changed signal.
   */
  private _adjustCurrentForRemove(i: number, title: Title): void {
    // Lookup commonly used variables.
    let ci = this._currentIndex;
    let bh = this._removeBehavior;

    // Silently adjust the index if the current tab is not removed.
    if (ci !== i) {
      if (ci > i) this._currentIndex--;
      return;
    }

    // No tab gets selected if the tab bar is empty.
    if (this._titles.length === 0) {
      this._currentIndex = -1;
      this.currentChanged.emit({
        previousIndex: i, previousTitle: title,
        currentIndex: -1, currentTitle: null
      });
      return;
    }

    // Handle behavior where the next sibling tab is selected.
    if (bh === 'select-tab-after') {
      this._currentIndex = Math.min(i, this._titles.length - 1);
      this.currentChanged.emit({
        previousIndex: i, previousTitle: title,
        currentIndex: this._currentIndex, currentTitle: this.currentTitle
      });
      return;
    }

    // Handle behavior where the previous sibling tab is selected.
    if (bh === 'select-tab-before') {
      this._currentIndex = Math.max(0, i - 1);
      this.currentChanged.emit({
        previousIndex: i, previousTitle: title,
        currentIndex: this._currentIndex, currentTitle: this.currentTitle
      });
      return;
    }

    // Handle behavior where the previous history tab is selected.
    if (bh === 'select-previous-tab') {
      if (this._previousTitle) {
        this._currentIndex = indexOf(this._titles, this._previousTitle);
        this._previousTitle = null;
      } else {
        this._currentIndex = Math.min(i, this._titles.length - 1);
      }
      this.currentChanged.emit({
        previousIndex: i, previousTitle: title,
        currentIndex: this._currentIndex, currentTitle: this.currentTitle
      });
      return;
    }

    // Otherwise, no tab gets selected.
    this._currentIndex = -1;
    this.currentChanged.emit({
      previousIndex: i, previousTitle: title,
      currentIndex: -1, currentTitle: null
    });
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this.update();
  }

  private _currentIndex = -1;
  private _tabsMovable: boolean;
  private _allowDeselect: boolean;
  private _renderer: TabBar.IRenderer;
  private _previousTitle: Title = null;
  private _titles = new Vector<Title>();
  private _orientation: TabBar.Orientation;
  private _dragData: Private.DragData = null;
  private _insertBehavior: TabBar.InsertBehavior;
  private _removeBehavior: TabBar.RemoveBehavior;
}


// Define the signals for the `TabBar` class.
defineSignal(TabBar.prototype, 'currentChanged');
defineSignal(TabBar.prototype, 'tabMoved');
defineSignal(TabBar.prototype, 'tabActivateRequested');
defineSignal(TabBar.prototype, 'tabCloseRequested');
defineSignal(TabBar.prototype, 'tabDetachRequested');


/**
 * The namespace for the `TabBar` class statics.
 */
export
namespace TabBar {
  /**
   * A type alias for a tab bar orientation.
   */
  export
  type Orientation = (
    /**
     * The tabs are arranged in a single row, left-to-right.
     *
     * The tab text orientation is horizontal.
     */
    'horizontal' |

    /**
     * The tabs are arranged in a single column, top-to-bottom.
     *
     * The tab text orientation is horizontal.
     */
    'vertical'
  );

  /**
   * A type alias for the selection behavior on tab insert.
   */
  export
  type InsertBehavior = (
    /**
     * The selected tab will not be changed.
     */
    'none' |

    /**
     * The inserted tab will be selected.
     */
    'select-tab' |

    /**
     * The inserted tab will be selected if the current tab is null.
     */
    'select-tab-if-needed'
  );

  /**
   * A type alias for the selection behavior on tab remove.
   */
  export
  type RemoveBehavior = (
    /**
     * No tab will be selected.
     */
    'none' |

    /**
     * The tab after the removed tab will be selected if possible.
     */
    'select-tab-after' |

    /**
     * The tab before the removed tab will be selected if possible.
     */
    'select-tab-before' |

    /**
     * The previously selected tab will be selected if possible.
     */
    'select-previous-tab'
  );

  /**
   * An options object for creating a tab bar.
   */
  export
  interface IOptions {
    /**
     * The layout orientation of the tab bar.
     *
     * The default is `horizontal`.
     */
    orientation?: TabBar.Orientation;

    /**
     * Whether the tabs are movable by the user.
     *
     * The default is `false`.
     */
    tabsMovable?: boolean;

    /**
     * Whether a tab can be deselected by the user.
     *
     * The default is `false`.
     */
    allowDeselect?: boolean;

    /**
     * The selection behavior when inserting a tab.
     *
     * The default is `'select-tab-if-needed'`.
     */
    insertBehavior?: TabBar.InsertBehavior;

    /**
     * The selection behavior when removing a tab.
     *
     * The default is `'select-tab-after'`.
     */
    removeBehavior?: TabBar.RemoveBehavior;

    /**
     * A renderer to use with the tab bar.
     *
     * The default is a shared renderer instance.
     */
    renderer?: IRenderer;
  }

  /**
   * The arguments object for the `currentChanged` signal.
   */
  export
  interface ICurrentChangedArgs {
    /**
     * The previously selected index.
     */
    previousIndex: number;

    /**
     * The previously selected title.
     */
    previousTitle: Title;

    /**
     * The currently selected index.
     */
    currentIndex: number;

    /**
     * The currently selected title.
     */
    currentTitle: Title;
  }

  /**
   * The arguments object for the `tabMoved` signal.
   */
  export
  interface ITabMovedArgs {
    /**
     * The previous index of the tab.
     */
    fromIndex: number;

    /**
     * The current index of the tab.
     */
    toIndex: number;

    /**
     * The title for the tab.
     */
    title: Title;
  }

  /**
   * The arguments object for the `tabActivateRequested` signal.
   */
  export
  interface ITabActivateRequestedArgs {
    /**
     * The index of the tab to activate.
     */
    index: number;

    /**
     * The title for the tab.
     */
    title: Title;
  }

  /**
   * The arguments object for the `tabCloseRequested` signal.
   */
  export
  interface ITabCloseRequestedArgs {
    /**
     * The index of the tab to close.
     */
    index: number;

    /**
     * The title for the tab.
     */
    title: Title;
  }

  /**
   * The arguments object for the `tabDetachRequested` signal.
   */
  export
  interface ITabDetachRequestedArgs {
    /**
     * The index of the tab to detach.
     */
    index: number;

    /**
     * The title for the tab.
     */
    title: Title;

    /**
     * The node representing the tab.
     */
    tab: HTMLElement;

    /**
     * The current client X position of the mouse.
     */
    clientX: number;

    /**
     * The current client Y position of the mouse.
     */
    clientY: number;
  }

  /**
   * An object which holds the data to render a tab.
   */
  export
  interface IRenderData {
    /**
     * The title associated with the tab.
     */
    title: Title;

    /**
     * Whether the tab is the current tab.
     */
    current: boolean;

    /**
     * The z-index for the tab.
     */
    zIndex: number;
  }

  /**
   * A renderer for use with a tab bar.
   */
  export
  interface IRenderer {
    /**
     * A selector which matches the close icon node in a tab.
     *
     * #### Notes
     * This should be a read-only property.
     */
    closeIconSelector: string;

    /**
     * Render the node for the a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual DOM node representing the tab.
     */
    renderTab(data: IRenderData): VNode;
  }

  /**
   * The default implementation of `IRenderer`.
   */
  export
  class Renderer implements IRenderer {
    /**
     * Construct a new renderer.
     *
     * @param options - The options for initializing the renderer.
     */
    constructor(options: Renderer.IOptions = {}) {
      this._extraTabClass = options.extraTabClass || '';
    }

    /**
     * A selector which matches the close icon node in a tab.
     *
     * #### Notes
     * This is a read-only property.
     */
    get closeIconSelector(): string {
      return `.${CLOSE_ICON_CLASS}`;
    }

    /**
     * Render the node for the a tab.
     *
     * @param data - The data to use for rendering the tab.
     *
     * @returns A virtual DOM node representing the tab.
     */
    renderTab(data: IRenderData): VNode {
      let { label, caption } = data.title;
      let key = this.createTabKey(data);
      let style = this.createTabStyle(data);
      let tabClass = this.createTabClass(data);
      let iconClass = this.createIconClass(data);
      return (
        h.li({ key, className: tabClass, title: caption, style },
          h.div({ className: iconClass }),
          h.div({ className: LABEL_CLASS }, label),
          h.div({ className: CLOSE_ICON_CLASS })
        )
      );
    }

    /**
     * Create a unique render key for the tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The unique render key for the tab.
     *
     * #### Notes
     * This method caches the key against the tab title the first time
     * the key is generated. This enables efficient rendering of moved
     * tabs and avoids subtle hover style artifacts.
     */
    createTabKey(data: IRenderData): string {
      let key = this._tabKeys.get(data.title);
      if (key === void 0) {
        key = `tab-key-${this._tabID++}`;
        this._tabKeys.set(data.title, key);
      }
      return key;
    }

    /**
     * Create the inline style object for a tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The inline style data for the tab.
     */
    createTabStyle(data: IRenderData): any {
      return { zIndex: `${data.zIndex}` };
    }

    /**
     * Create the class name for the tab.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The full class name for the tab.
     */
    createTabClass(data: IRenderData): string {
      let { title, current } = data;
      let name = TAB_CLASS;
      if (title.className) {
        name += ` ${title.className}`;
      }
      if (title.closable) {
        name += ` ${CLOSABLE_CLASS}`;
      }
      if (current) {
        name += ` ${CURRENT_CLASS}`;
      }
      if (this._extraTabClass) {
        name += ` ${this._extraTabClass}`;
      }
      return name;
    }

    /**
     * Create the class name for the tab icon.
     *
     * @param data - The data to use for the tab.
     *
     * @returns The full class name for the tab icon.
     */
    createIconClass(data: IRenderData): string {
      let { title } = data;
      let name = ICON_CLASS;
      if (title.icon) {
        name += ` ${title.icon}`;
      }
      return name;
    }

    private _tabID = 0;
    private _extraTabClass: string;
    private _tabKeys = new WeakMap<Title, string>();
  }

  /**
   * The namespace for the `Renderer` class statics.
   */
  export
  namespace Renderer {
    /**
     * An options object for creating a renderer.
     */
    export
    interface IOptions {
      /**
       * The extra CSS class name to add to each tab.
       */
      extraTabClass?: string;
    }
  }

  /**
   * The default `Renderer` instance.
   */
  export
  const defaultRenderer = new Renderer();
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * A struct which holds the drag data for a tab bar.
   */
  export
  class DragData {
    /**
     * The tab node being dragged.
     */
    tab: HTMLElement = null;

    /**
     * The index of the tab being dragged.
     */
    index = -1;

    /**
     * The offset left/top of the tab being dragged.
     */
    tabPos = -1;

    /**
     * The offset width/height of the tab being dragged.
     */
    tabSize = -1;

    /**
     * The original mouse X/Y position in tab coordinates.
     */
    tabPressPos = -1;

    /**
     * The tab target index upon mouse release.
     */
    targetIndex = -1;

    /**
     * The array of tab layout objects snapped at drag start.
     */
    tabLayout: ITabLayout[] = null;

    /**
     * The mouse press client X position.
     */
    pressX = -1;

    /**
     * The mouse press client Y position.
     */
    pressY = -1;

    /**
     * The bounding client rect of the tab bar content node.
     */
    contentRect: ClientRect = null;

    /**
     * The disposable to clean up the cursor override.
     */
    override: IDisposable = null;

    /**
     * Whether the drag is currently active.
     */
    dragActive = false;

    /**
     * Whether the drag has been aborted.
     */
    dragAborted = false;

    /**
     * Whether a detach request as been made.
     */
    detachRequested = false;
  }

  /**
   * An object which holds layout data for a tab.
   */
  export
  interface ITabLayout {
    /**
     * The left/top margin value for the tab.
     */
    margin: number;

    /**
     * The offset left/top position of the tab.
     */
    pos: number;

    /**
     * The offset width/height of the tab.
     */
    size: number;
  }

  /**
   * Coerce a title or options into a real title.
   */
  export
  function asTitle(value: Title | Title.IOptions): Title {
    return value instanceof Title ? value : new Title(value);
  }

  /**
   * Parse the transition duration for a tab node.
   */
  export
  function parseTransitionDuration(tab: HTMLElement): number {
    let style = window.getComputedStyle(tab);
    return 1000 * (parseFloat(style.transitionDuration) || 0);
  }

  /**
   * Get a snapshot of the current tab layout values.
   */
  export
  function snapTabLayout(tabs: HTMLCollection, orientation: TabBar.Orientation): ITabLayout[] {
    let layout = new Array<ITabLayout>(tabs.length);
    if (orientation === 'horizontal') {
      for (let i = 0, n = tabs.length; i < n; ++i) {
        let node = tabs[i] as HTMLElement;
        let pos = node.offsetLeft;
        let size = node.offsetWidth;
        let cstyle = window.getComputedStyle(node);
        let margin = parseInt(cstyle.marginLeft, 10) || 0;
        layout[i] = { margin, pos, size };
      }
    } else {
      for (let i = 0, n = tabs.length; i < n; ++i) {
        let node = tabs[i] as HTMLElement;
        let pos = node.offsetTop;
        let size = node.offsetHeight;
        let cstyle = window.getComputedStyle(node);
        let margin = parseInt(cstyle.marginTop, 10) || 0;
        layout[i] = { margin, pos, size };
      }
    }
    return layout;
  }

  /**
   * Test if the event exceeds the drag detach threshold.
   */
  export
  function detachExceeded(data: DragData, event: MouseEvent): boolean {
    let rect = data.contentRect;
    return (
      (event.clientX < rect.left - DETACH_THRESHOLD) ||
      (event.clientX >= rect.right + DETACH_THRESHOLD) ||
      (event.clientY < rect.top - DETACH_THRESHOLD) ||
      (event.clientY >= rect.bottom + DETACH_THRESHOLD)
    );
  }

  /**
   * Update the relative tab positions and computed target index.
   */
  export
  function layoutTabs(tabs: HTMLCollection, data: DragData, event: MouseEvent, orientation: TabBar.Orientation): void {
    // Compute the orientation-sensitive values.
    let pressPos: number;
    let localPos: number;
    let clientPos: number;
    let clientSize: number;
    if (orientation === 'horizontal') {
      pressPos = data.pressX;
      localPos = event.clientX - data.contentRect.left;
      clientPos = event.clientX;
      clientSize = data.contentRect.width;
    } else {
      pressPos = data.pressY;
      localPos = event.clientY - data.contentRect.top;
      clientPos = event.clientY;
      clientSize = data.contentRect.height;
    }

    // Compute the target data.
    let targetIndex = data.index;
    let targetPos = localPos - data.tabPressPos;
    let targetEnd = targetPos + data.tabSize;

    // Update the relative tab positions.
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let pxPos: string;
      let layout = data.tabLayout[i];
      let threshold = layout.pos + (layout.size >> 1);
      if (i < data.index && targetPos < threshold) {
        pxPos = `${data.tabSize + data.tabLayout[i + 1].margin}px`;
        targetIndex = Math.min(targetIndex, i);
      } else if (i > data.index && targetEnd > threshold) {
        pxPos = `${-data.tabSize - layout.margin}px`;
        targetIndex = Math.max(targetIndex, i);
      } else if (i === data.index) {
        let ideal = clientPos - pressPos;
        let limit = clientSize - (data.tabPos + data.tabSize);
        pxPos = `${Math.max(-data.tabPos, Math.min(ideal, limit))}px`;
      } else {
        pxPos = '';
      }
      if (orientation === 'horizontal') {
        (tabs[i] as HTMLElement).style.left = pxPos;
      } else {
        (tabs[i] as HTMLElement).style.top = pxPos;
      }
    }

    // Update the computed target index.
    data.targetIndex = targetIndex;
  }

  /**
   * Position the drag tab at its final resting relative position.
   */
  export
  function finalizeTabPosition(data: DragData, orientation: TabBar.Orientation): void {
    // Compute the orientation-sensitive client size.
    let clientSize: number;
    if (orientation === 'horizontal') {
      clientSize = data.contentRect.width;
    } else {
      clientSize = data.contentRect.height;
    }

    // Compute the ideal final tab position.
    let ideal: number;
    if (data.targetIndex === data.index) {
      ideal = 0;
    } else if (data.targetIndex > data.index) {
      let tgt = data.tabLayout[data.targetIndex];
      ideal = tgt.pos + tgt.size - data.tabSize - data.tabPos;
    } else {
      let tgt = data.tabLayout[data.targetIndex];
      ideal = tgt.pos - data.tabPos;
    }

    // Compute the tab position limit.
    let limit = clientSize - (data.tabPos + data.tabSize);
    let final = Math.max(-data.tabPos, Math.min(ideal, limit));

    // Set the final orientation-sensitive position.
    if (orientation === 'horizontal') {
      data.tab.style.left = `${final}px`;
    } else {
      data.tab.style.top = `${final}px`;
    }
  }

  /**
   * Reset the relative positions of the given tabs.
   */
  export
  function resetTabPositions(tabs: HTMLCollection, orientation: TabBar.Orientation): void {
    if (orientation === 'horizontal') {
      each(tabs, tab => { (tab as HTMLElement).style.left = ''; });
    } else {
      each(tabs, tab => { (tab as HTMLElement).style.top = ''; });
    }
  }
}
