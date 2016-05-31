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
  Message
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
  Widget, WidgetFlag
} from './widget';


/**
 * The class name added to TabBar instances.
 */
const TAB_BAR_CLASS = 'p-TabBar';

/**
 * The class name added to a tab bar body node.
 */
const BODY_CLASS = 'p-TabBar-body';

/**
 * The class name added to a tab bar header node.
 */
const HEADER_CLASS = 'p-TabBar-header';

/**
 * The class name added to a tab bar content node.
 */
const CONTENT_CLASS = 'p-TabBar-content';

/**
 * The class name added to a tab bar footer node.
 */
const FOOTER_CLASS = 'p-TabBar-footer';

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
 * The tab transition duration.
 */
const TRANSITION_DURATION = 150;  // Keep in sync with CSS.


/**
 * A widget which displays titles as a row of tabs.
 */
export
class TabBar extends Widget {
  /**
   * Create the DOM node for a tab bar.
   */
  static createNode(): HTMLElement {
    let node = document.createElement('div');
    let header = document.createElement('div');
    let body = document.createElement('div');
    let footer = document.createElement('div');
    let content = document.createElement('ul');
    header.className = HEADER_CLASS;
    body.className = BODY_CLASS;
    footer.className = FOOTER_CLASS;
    content.className = CONTENT_CLASS;
    body.appendChild(content);
    node.appendChild(header);
    node.appendChild(body);
    node.appendChild(footer);
    return node;
  }

  /**
   * Construct a new tab bar.
   *
   * @param options - The options for initializing the tab bar.
   */
  constructor(options: TabBar.IOptions = {}) {
    super();
    this.addClass(TAB_BAR_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);
    this._renderer = options.renderer || TabBar.defaultRenderer;
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    this._tabs.clear();
    this._titles.clear();
    this._dirtyTitles.clear();
    this._renderer = null;
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
   * Get the tab bar header node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar header.
   *
   * This is a read-only property.
   */
  get headerNode(): HTMLElement {
    return this.node.getElementsByClassName(HEADER_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar body node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar.
   *
   * This is a read-only property.
   */
  get bodyNode(): HTMLElement {
    return this.node.getElementsByClassName(BODY_CLASS)[0] as HTMLElement;
  }

  /**
   * Get the tab bar footer node.
   *
   * #### Notes
   * This node can be used to add extra content to the tab bar footer.
   *
   * This is a read-only property.
   */
  get footerNode(): HTMLElement {
    return this.node.getElementsByClassName(FOOTER_CLASS)[0] as HTMLElement;
  }

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
  get contentNode(): HTMLElement {
    return this.node.getElementsByClassName(CONTENT_CLASS)[0] as HTMLElement;
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

    // Update the current index.
    this._currentIndex = i;

    // Emit the current changed signal.
    this.currentChanged.emit({
      previousIndex: pi, previousTitle: pt,
      currentIndex: ci, currentTitle: ct
    });

    // Schedule an update of the tabs.
    this.update();
  }

  /**
   * Get whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can be moved programmatically, irrespective of this value.
   */
  get tabsMovable(): boolean {
    return this._tabsMovable;
  }

  /**
   * Set whether the tabs are movable by the user.
   *
   * #### Notes
   * Tabs can be moved programmatically, irrespective of this value.
   */
  set tabsMovable(value: boolean) {
    this._tabsMovable = value;
  }

  /**
   * Add a tab to the end of the tab bar.
   *
   * @param title - The title which holds the data for the tab.
   *
   * #### Notes
   * If the title is already added to the tab bar, it will be moved.
   */
  addTab(title: Title): void {
    this.insertTab(this._titles.length, title);
  }

  /**
   * Insert a tab into the tab bar at the specified index.
   *
   * @param index - The index at which to insert the tab.
   *
   * @param title - The title which holds the data for the tab.
   *
   * #### Notes
   * The index will be clamped to the bounds of the tabs.
   *
   * If the title is already added to the tab bar, it will be moved.
   */
  insertTab(index: number, title: Title): void {
    // Release the mouse before making any changes.
    this._releaseMouse();

    // Look up the index of the title.
    let i = indexOf(this._titles, title);

    // Clamp the insert index to the vector bounds.
    let j = Math.max(0, Math.min(Math.floor(index), this._titles.length));

    // If the title is not in the vector, insert it.
    if (i === -1) {
      // Create the new tab node for the title.
      let tab = this._renderer.createTabNode();
      this._renderer.updateTabNode(tab, title);

      // Insert the tab and title into the vectors.
      this._tabs.insert(j, tab);
      this._titles.insert(j, title);

      // Look up the next sibling node.
      let ref = j + 1 < this._tabs.length ? this._tabs.at(j + 1) : null;

      // Insert the tab into the content node.
      this.contentNode.insertBefore(tab, ref);

      // Connect to the title changed signal.
      title.changed.connect(this._onTitleChanged, this);

      // Update the current index.
      if (this._currentIndex === -1) {
        this._currentIndex = j
        this.currentChanged.emit({
          previousIndex: -1, previousTitle: null,
          currentIndex: j, currentTitle: title
        });
      } else if (this._currentIndex >= j) {
        this._currentIndex++;
      }

      // Schedule an update of the tabs.
      this.update();

      // There is nothing more to do.
      return;
    }

    // Otherwise, the title exists in the vector and should be moved.

    // Adjust the index if the location is at the end of the vector.
    if (j === this._titles.length) j--;

    // Bail if there is no effective move.
    if (i === j) return;

    // Move the tab and title to the new locations.
    move(this._tabs, i, j);
    move(this._titles, i, j);

    // Look up the next sibling node.
    let ref = j + 1 < this._tabs.length ? this._tabs.at(j + 1) : null;

    // Move the tab in the content node.
    this.contentNode.insertBefore(this._tabs.at(j), ref);

    // Update the current index.
    let ci = this._currentIndex;
    if (ci === i) {
      this._currentIndex = j;
    } else if (ci < i && ci >= j) {
      this._currentIndex++;
    } else if (ci > i && ci <= j) {
      this._currentIndex--;
    }

    // Schedule an update of the tabs.
    this.update();
  }

  /**
   * Remove a tab from the tab bar.
   *
   * @param index - The index of the tab to remove.
   *
   * #### Notes
   * This is a no-op if the index is out of range.
   */
  removeTab(index: number): void {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._titles.length) {
      return;
    }

    // Release the mouse before making any changes.
    this._releaseMouse();

    // Look up the tab and title.
    let tab = this._tabs.at(i);
    let title = this._titles.at(i);

    // Remove the tab and title from the vectors.
    this._tabs.remove(i);
    this._titles.remove(i);

    // Remove the title from the dirty set.
    this._dirtyTitles.delete(title);

    // Disconnect from the title changed signal.
    title.changed.disconnect(this._onTitleChanged, this);

    // Remove the tab from the content node.
    this.contentNode.removeChild(tab);

    // Update the current index.
    if (this._currentIndex === i) {
      let ci = Math.min(i, this._titles.length - 1);
      let ct = ci === -1 ? null : this._titles.at(ci);
      this._currentIndex = ci;
      this.currentChanged.emit({
        previousIndex: i, previousTitle: title,
        currentIndex: ci, currentTitle: ct
      });
    } else if (this._currentIndex > i) {
      this._currentIndex--;
    }

    // Schedule an update of the tabs.
    this.update();
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

    // Reset the current index.
    this._currentIndex = -1;

    // Clear the tab and title vectors.
    this._tabs.clear();
    this._titles.clear();

    // Clear the dirty title set.
    this._dirtyTitles.clear();

    // Clear the content node.
    this.contentNode.textContent = '';

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
    let tabs = this._tabs;
    let titles = this._titles;
    let renderer = this._renderer;
    let dirtyTitles = this._dirtyTitles;
    let currentTitle = this.currentTitle;
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let tab = tabs.at(i);
      let title = titles.at(i);
      if (dirtyTitles.has(title)) {
        renderer.updateTabNode(tab, title);
      }
      if (title === currentTitle) {
        tab.classList.add(CURRENT_CLASS);
        tab.style.zIndex = `${n}`;
      } else {
        tab.classList.remove(CURRENT_CLASS);
        tab.style.zIndex = `${n - i - 1}`;
      }
    }
    dirtyTitles.clear();
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

    // Do nothing if the click is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(this._tabs, tab => hitTest(tab, x, y));
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
    let icon = this._renderer.closeIconNode(this._tabs.at(i));
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

    // Do nothing if the press is not on a tab.
    let x = event.clientX;
    let y = event.clientY;
    let i = findIndex(this._tabs, tab => hitTest(tab, x, y));
    if (i < 0) {
      return;
    }

    // Pressing on a tab stops the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Ignore the press if it was on a close icon.
    let icon = this._renderer.closeIconNode(this._tabs.at(i));
    if (icon && icon.contains(event.target as HTMLElement)) {
      return;
    }

    // Setup the drag data if the tabs are movable.
    if (this._tabsMovable) {
      this._dragData = new Private.DragData();
      this._dragData.index = i;
      this._dragData.tab = this._tabs.at(i);
      this._dragData.pressX = event.clientX;
      this._dragData.pressY = event.clientY;
      document.addEventListener('mousemove', this, true);
      document.addEventListener('mouseup', this, true);
      document.addEventListener('keydown', this, true);
      document.addEventListener('contextmenu', this, true);
    }

    // Update the current index.
    this.currentIndex = i;
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
      data.tabLeft = data.tab.offsetLeft;
      data.tabWidth = tabRect.width;
      data.tabPressX = data.pressX - tabRect.left;
      data.tabLayout = Private.snapTabLayout(this._tabs);
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
      let title = this._titles.at(index);

      // Emit the tab detach requested signal.
      this.tabDetachRequested.emit({ index, title, clientX, clientY });

      // Bail if the signal handler aborted the drag.
      if (data.dragAborted) {
        return;
      }
    }

    // Update the positions of the tab.
    Private.layoutTabs(this._tabs, data, event);
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
    Private.finalizeTabPosition(data);

    // Remove the dragging class from the tab so it can be transitioned.
    data.tab.classList.remove(DRAGGING_CLASS);

    // Complete the release on a timer to allow the tab to transition.
    setTimeout(() => {
      // Do nothing if the drag has been aborted.
      if (data.dragAborted) {
        return;
      }

      // Clear the drag data reference.
      this._dragData = null;

      // Reset the positions of the tabs.
      Private.resetTabPositions(this._tabs);

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

      // Move the tab and title to the new locations.
      move(this._tabs, i, j);
      move(this._titles, i, j);

      // Look up the next sibling node.
      let ref = j + 1 < this._tabs.length ? this._tabs.at(j + 1) : null;

      // Move the tab in the content node.
      this.contentNode.insertBefore(this._tabs.at(j), ref);

      // Update the current index.
      let ci = this._currentIndex;
      if (ci === i) {
        this._currentIndex = j;
      } else if (ci < i && ci >= j) {
        this._currentIndex++;
      } else if (ci > i && ci <= j) {
        this._currentIndex--;
      }

      // Emit the tab moved signal.
      this.tabMoved.emit({
        fromIndex: i, toIndex: j, title: this._titles.at(j)
      });

      // Schedule an update of the tabs.
      this.update();
    }, TRANSITION_DURATION);
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
    Private.resetTabPositions(this._tabs);

    // Clear the cursor override.
    data.override.dispose();

    // Clear the dragging style classes.
    data.tab.classList.remove(DRAGGING_CLASS);
    this.removeClass(DRAGGING_CLASS);
  }

  /**
   * Handle the `changed` signal of a title object.
   */
  private _onTitleChanged(sender: Title): void {
    this._dirtyTitles.add(sender);
    this.update();
  }

  private _currentIndex = -1;
  private _tabsMovable = false;
  private _titles = new Vector<Title>();
  private _dirtyTitles= new Set<Title>();
  private _tabs = new Vector<HTMLElement>();
  private _dragData: Private.DragData = null;
  private _renderer: TabBar.IContentRenderer;
}


// Define the signals for the `TabBar` class.
defineSignal(TabBar.prototype, 'currentChanged');
defineSignal(TabBar.prototype, 'tabMoved');
defineSignal(TabBar.prototype, 'tabCloseRequested');
defineSignal(TabBar.prototype, 'tabDetachRequested');


/**
 * The namespace for the `TabBar` class statics.
 */
export
namespace TabBar {
  /**
   * An options object for creating a tab bar.
   */
  export
  interface IOptions {
    /**
     * A custom renderer for creating tab bar content.
     */
    renderer?: IContentRenderer;
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
     * The current client X position of the mouse.
     */
    clientX: number;

    /**
     * The current client Y position of the mouse.
     */
    clientY: number;
  }

  /**
   * An object which renders content for a tab bar.
   *
   * #### Notes
   * User code can implement a custom renderer when the default
   * content created by the tab bar is insufficient.
   */
  export
  interface IContentRenderer {
    /**
     * Create a node for a tab.
     *
     * @returns A new node for a tab.
     *
     * #### Notes
     * The data in the node should be uninitialized.
     *
     * The `updateTabNode` method will be called for initialization.
     */
    createTabNode(): HTMLElement;

    /**
     * Update a tab node to reflect the state of a title.
     *
     * @param node - A tab node created by a call to `createTabNode`.
     *
     * @param title - The title object holding the data for the tab.
     *
     * #### Notes
     * This method should completely reset the state of the node to
     * reflect the data in the title.
     */
    updateTabNode(node: HTMLElement, title: Title): void;

    /**
     * Look up the close icon descendant node for a tab node.
     *
     * @param node - A tab node created by a call to `createTabNode`.
     *
     * @returns The close icon node, or `null` if none exists.
     *
     * #### Notes
     * This is used by the tab bar to detect clicks on the close icon.
     */
    closeIconNode(node: HTMLElement): HTMLElement;
  }

  /**
   * The default concrete implementation of [[IContentRenderer]].
   */
  export
  class ContentRenderer implements IContentRenderer {
    /**
     * Create a node for a tab.
     *
     * @returns A new node for a tab.
     */
    createTabNode(): HTMLElement {
      let node = document.createElement('li');
      let icon = document.createElement('span');
      let text = document.createElement('span');
      let close = document.createElement('span');
      node.className = TAB_CLASS;
      icon.className = ICON_CLASS;
      text.className = LABEL_CLASS;
      close.className = CLOSE_ICON_CLASS;
      node.appendChild(icon);
      node.appendChild(text);
      node.appendChild(close);
      return node;
    }

    /**
     * Update a tab node to reflect the state of a title.
     *
     * @param node - A tab node created by a call to `createTabNode`.
     *
     * @param title - The title object holding the data for the tab.
     */
    updateTabNode(node: HTMLElement, title: Title): void {
      let tabInfix = title.className ? ` ${title.className}` : '';
      let tabSuffix = title.closable ? ` ${CLOSABLE_CLASS}` : '';
      let iconSuffix = title.icon ? ` ${title.icon}` : '';
      let icon = node.firstChild as HTMLElement;
      let text = icon.nextSibling as HTMLElement;
      node.className = `${TAB_CLASS} ${tabInfix} ${tabSuffix}`;
      icon.className = `${ICON_CLASS} ${iconSuffix}`;
      text.textContent = title.label;
      text.title = title.tooltip;
    }

    /**
     * Look up the close icon descendant node for a tab node.
     *
     * @param node - A tab node created by a call to `createTabNode`.
     *
     * @returns The close icon node, or `null` if none exists.
     */
    closeIconNode(node: HTMLElement): HTMLElement {
      return node.lastChild as HTMLElement;
    }
  }

  /**
   * A default instance of the `ContentRenderer` class.
   */
  export
  const defaultRenderer = new ContentRenderer();
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
     * The offset left of the tab being dragged.
     */
    tabLeft = -1;

    /**
     * The offset width of the tab being dragged.
     */
    tabWidth = -1;

    /**
     * The original mouse X position in tab coordinates.
     */
    tabPressX = -1;

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
     * The left margin value for the tab.
     */
    margin: number;

    /**
     * The offset left position of the tab.
     */
    left: number;

    /**
     * The offset width of the tab.
     */
    width: number;
  }

  /**
   * Get a snapshot of the current tab layout values.
   */
  export
  function snapTabLayout(tabs: Vector<HTMLElement>): ITabLayout[] {
    let layout = new Array<ITabLayout>(tabs.length);
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let node = tabs.at(i);
      let left = node.offsetLeft;
      let width = node.offsetWidth;
      let cstyle = window.getComputedStyle(node);
      let margin = parseInt(cstyle.marginLeft, 10) || 0;
      layout[i] = { margin, left, width };
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
  function layoutTabs(tabs: Vector<HTMLElement>, data: DragData, event: MouseEvent): void {
    let targetIndex = data.index;
    let targetLeft = event.clientX - data.contentRect.left - data.tabPressX;
    let targetRight = targetLeft + data.tabWidth;
    for (let i = 0, n = tabs.length; i < n; ++i) {
      let style = tabs.at(i).style;
      let layout = data.tabLayout[i];
      let threshold = layout.left + (layout.width >> 1);
      if (i < data.index && targetLeft < threshold) {
        style.left = `${data.tabWidth + data.tabLayout[i + 1].margin}px`;
        targetIndex = Math.min(targetIndex, i);
      } else if (i > data.index && targetRight > threshold) {
        style.left = `${-data.tabWidth - layout.margin}px`;
        targetIndex = Math.max(targetIndex, i);
      } else if (i === data.index) {
        let ideal = event.clientX - data.pressX;
        let limit = data.contentRect.width - (data.tabLeft + data.tabWidth);
        style.left = `${Math.max(-data.tabLeft, Math.min(ideal, limit))}px`;
      } else {
        style.left = '';
      }
    }
    data.targetIndex = targetIndex;
  }

  /**
   * Position the drag tab at its final resting relative position.
   */
  export
  function finalizeTabPosition(data: DragData): void {
    let ideal: number;
    if (data.targetIndex === data.index) {
      ideal = 0;
    } else if (data.targetIndex > data.index) {
      let tgt = data.tabLayout[data.targetIndex];
      ideal = tgt.left + tgt.width - data.tabWidth - data.tabLeft;
    } else {
      let tgt = data.tabLayout[data.targetIndex];
      ideal = tgt.left - data.tabLeft;
    }
    let style = data.tab.style;
    let limit = data.contentRect.width - (data.tabLeft + data.tabWidth);
    style.left = `${Math.max(-data.tabLeft, Math.min(ideal, limit))}px`;
  }

  /**
   * Reset the relative positions of the given tabs.
   */
  export
  function resetTabPositions(tabs: Vector<HTMLElement>): void {
    each(tabs, tab => { tab.style.left = ''; });
  }
}
