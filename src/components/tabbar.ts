/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.components {

import IDisposable = core.IDisposable;

import hitTest = domutil.hitTest;
import overrideCursor = domutil.overrideCursor;

import IData = virtualdom.IData;
import IElement = virtualdom.IElement;
import createFactory = virtualdom.createFactory;
import dom = virtualdom.dom;


/**
 * The class name added to TabBarComponent instances.
 */
var TAB_BAR_CLASS = 'p-TabBarComponent';

/**
 * The class name added to Tab instances.
 */
var TAB_CLASS = 'p-TabBarComponent-tab';

/**
 * The class name assigned to a tab text sub element.
 */
var TEXT_CLASS = 'p-TabBarComponent-tab-text';

/**
 * The class name assigned to a tab icon sub element.
 */
var ICON_CLASS = 'p-TabBarComponent-tab-icon';

/**
 * The class name assigned to a tab close icon sub element.
 */
var CLOSE_ICON_CLASS = 'p-TabBarComponent-tab-close-icon';

/**
 * The class name added to the selected tab.
 */
var SELECTED_CLASS = 'p-mod-selected';

/**
 * The class name added to a closable tab.
 */
var CLOSABLE_CLASS = 'p-mod-closable';

/**
 * The class name added to the drag target.
 */
var DRAGGING_CLASS = 'p-mod-dragging';

/**
 * The default start drag distance threshold.
 */
var DRAG_THRESHOLD = 5;

/**
 * The percentage tab overlap before swapping tabs.
 */
var OVERLAP_THRESHOLD = 0.6;


/**
 * A data object for a tab in a tab bar.
 */
export
interface ITabItem {
  /**
   * An id for the tab which is unique among its siblings.
   */
  id: string;

  /**
   * The text for the tab.
   */
  text: string;

  /**
   * Whether the tab is the selected tab.
   */
  selected?: boolean;

  /**
   * Whether the tab is closable.
   */
  closable?: boolean;
}


/**
 * The data object for a tab bar component.
 */
export
interface ITabBarData extends IData {
  /**
   * The tab data items to render in the tab bar.
   */
  items: ITabItem[];

  /**
   * Whether the tabs can be moved by the user.
   */
  tabsMovable?: boolean;
}


/**
 * An object which holds the geometry data for a tab.
 *
 * This is used when rendering the tabs during a drag operation.
 */
export
interface ITabGeo {
  /**
   * The top edge of the tab, in tab bar coordinates.
   */
  top: number;

  /**
   * The left edge of the tab, in tab bar coordinates.
   */
  left: number;

  /**
   * The width of the tab, in pixels.
   */
  width: number;

  /**
   * The height of the tab, in pixels.
   */
  height: number;

  /**
   * The z-index of the tab.
   */
  zIndex: number;
}


/**
 * A component which renders tab items as a row of tabs.
 */
export
class TabBarComponent extends Component<ITabBarData> {
  /**
   * The tag name for the component node.
   */
  static tagName = 'ul';

  /**
   * The initial class name assigned to the component node.
   */
  static className = TAB_BAR_CLASS;

  /**
   * Construct a new tab bar component.
   */
  constructor() {
    super();
    this.node.addEventListener('mousedown', <any>this);
    this.node.addEventListener('click', <any>this);
  }

  /**
   * Dispose of the resources held by the component.
   */
  dispose() {
    this._clearDragState();
    this.node.removeEventListener('mousedown', <any>this);
    this.node.removeEventListener('click', <any>this);
    super.dispose();
  }

  /**
   * Render the virtual element content for the component.
   */
  render(): IElement[] {
    var result: IElement[];
    var items = this.data.items;
    var state = this._dragState;
    var layout = state && state.layout;
    if (layout) {
      result = items.map(item => this.renderTab(item, layout.geo(item.id)));
    } else {
      result = items.map(item => this.renderTab(item, void 0));
    }
    return result;
  }

  /**
   * Get the tab id of the current drag target.
   *
   * Returns an empty string if there is no current drag target.
   */
  protected get dragTarget(): string {
    return this._dragState ? this._dragState.tabId : '';
  }

  /**
   * Render a virtual element for the given tab item.
   *
   * The tab geometry object will be `undefined` unless the tab should
   * be absolutely positioned, in which case it represents the geometry
   * to apply to the tab.
   *
   * A subclass may reimplement this method to create custom tabs.
   */
  protected renderTab(tab: ITabItem, geo: ITabGeo): IElement {
    var parts = [TAB_CLASS];
    if (tab.selected) {
      parts.push(SELECTED_CLASS);
    }
    if (tab.closable) {
      parts.push(CLOSABLE_CLASS);
    }
    if (tab.id === this.dragTarget) {
      parts.push(DRAGGING_CLASS);
    }
    var attrs = {
      className: parts.join(' '),
      dataset: { id: tab.id },
      style: geo ? {
        margin: '0px',
        position: 'absolute',
        top: geo.top + 'px',
        left: geo.left + 'px',
        width: geo.width + 'px',
        height: geo.height + 'px',
        zIndex: geo.zIndex + '',
      } : void 0,
    };
    return (
      dom.li(attrs,
        dom.span({ className: ICON_CLASS }),
        dom.span({ className: TEXT_CLASS }, tab.text),
        dom.span({ className: CLOSE_ICON_CLASS }))
    );
  }

  /**
   * Handle the DOM events for the tab component.
   */
  protected handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this._evtMouseDown(<MouseEvent>event);
        break;
      case 'mousemove':
        this._evtMouseMove(<MouseEvent>event);
        break;
      case 'mouseup':
        this._evtMouseUp(<MouseEvent>event);
        break;
      default:
        break;
    }
  }

  /**
   * Handle the 'mousedown' event for the tab bar.
   */
  private _evtMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    var clientX = event.clientX;
    var clientY = event.clientY;
    var tab = hitTestTabs(this.node, clientX, clientY);
    if (!tab) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!this.data.tabsMovable) {
      return;
    }
    var tabId = <string>(<any>tab.dataset).id;
    var tabRect = tab.getBoundingClientRect();
    var offsetX = clientX - tabRect.left;
    var offsetY = clientY - tabRect.top;
    this._dragState = {
      tabId: tabId,
      pressX: clientX,
      pressY: clientY,
      offsetX: offsetX,
      offsetY: offsetY,
      cursor: null,
      layout: null,
    };
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);
  }

  /**
   * Handle the 'mousemove' event for the tab bar.
   */
  private _evtMouseMove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    var state = this._dragState;
    if (!state || !this.data.tabsMovable) {
      return;
    }
    if (!state.layout) {
      var dx = Math.abs(event.clientX - state.pressX);
      var dy = Math.abs(event.clientY - state.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }
      state.layout = TabLayout.from(this.node);
      state.cursor = overrideCursor('default');
    }
    state.layout.update(state.tabId, event.clientX - state.offsetX);
    this.update(true);
  }

  /**
   * Handle the 'mouseup' event for the tab component.
   */
  private _evtMouseUp(event: MouseEvent): void {
    var state = this._dragState;
    if (!state || event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (state.layout) {
      state.tabId = '';
      state.layout.reset();
      this.update(true);
      setTimeout(() => this.update(), 150);
    }
    this._clearDragState();
  }

  /**
   * Clear the drag state and release the mouse grab.
   */
  private _clearDragState(): void {
    var state = this._dragState;
    if (!state) {
      return;
    }
    this._dragState = null;
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);
    if (state.cursor) state.cursor.dispose();
  }

  private _dragState: IDragState = null;
}


/**
 * The default element factory for a tab bar component.
 */
export
var TabBar = createFactory(TabBarComponent);


/**
 * An internal function to hit test the tabs in the tab bar.
 *
 * Returns the tab which contains the point or `undefined`.
 */
function hitTestTabs(bar: HTMLElement, cx: number, cy: number): HTMLElement {
  for (var node = bar.firstChild; node; node = node.nextSibling) {
    if (hitTest(<HTMLElement>node, cx, cy)) return <HTMLElement>node;
  }
  return void 0;
}


/**
 * An internal class which implements absolute tab layout.
 */
class TabLayout {
  /**
   * Create a new tab layout from the given tab bar node.
   *
   * The layout is initialized with the current tab geometries.
   */
  static from(bar: HTMLElement): TabLayout {
    var offsets: number[] = [];
    var order: string[] = [];
    var geos: { [id: string]: ITabGeo } = {};
    var barRect = bar.getBoundingClientRect();
    var nodes = bar.childNodes;
    var left = barRect.left;
    for (var i = 0, n = nodes.length; i < n; ++i) {
      var tab = <HTMLElement>nodes[i];
      var tabId = <string>(<any>tab.dataset).id;
      var tabRect = tab.getBoundingClientRect();
      offsets.push(tabRect.left - left);
      order.push(tabId);
      geos[tabId] = {
        top: tabRect.top - barRect.top,
        left: tabRect.left - barRect.left,
        width: tabRect.width,
        height: tabRect.height,
        zIndex: i,
      };
      left = tabRect.right;
    }
    var layout = new TabLayout();
    layout._clientRect = barRect;
    layout._offsets = offsets;
    layout._order = order;
    layout._geos = geos;
    return layout;
  }

  /**
   * Get the current tab geometry for the given tab id.
   *
   * Returns `undefined` if no geometry exists for the id.
   */
  geo(tabId: string): ITabGeo {
    return this._geos[tabId];
  }

  /**
   * Get the index of the tab with the given tab id.
   *
   * Returns -1 if the tab id is not in the layout.
   */
  indexOf(tabId: string): number {
    return this._order.indexOf(tabId);
  }

  /**
   * Update the positions of the tabs in the tab layout.
   *
   * The tab with the given id will be placed at the given X position
   * and the neighboring tabs will be moved as needed.
   */
  update(tabId: string, clientX: number): void {
    var clientRect = this._clientRect;
    var offsets = this._offsets;
    var order = this._order;
    var geos = this._geos;

    var tabGeo = geos[tabId];
    var overlap = OVERLAP_THRESHOLD;
    var index = order.indexOf(tabId);
    var maxX = clientRect.width - tabGeo.width;
    var localX = Math.max(0, Math.min(clientX - clientRect.left, maxX));

    var lowerBound: number;
    if (index > 0) {
      var sibling = geos[order[index - 1]];
      lowerBound = sibling.left + sibling.width * (1 - overlap);
    } else {
      lowerBound = 0;
    }

    var upperBound: number;
    if (index < order.length - 1) {
      var sibling = geos[order[index + 1]];
      upperBound = sibling.left + sibling.width * overlap - tabGeo.width;
    } else {
      upperBound = clientRect.width - tabGeo.width;
    }

    if (localX < lowerBound) {
      var tempId = order[index - 1];
      order[index - 1] = tabId;
      order[index] = tempId;
    } else if (localX > upperBound) {
      var tempId = order[index + 1];
      order[index + 1] = tabId;
      order[index] = tempId;
    }

    tabGeo.left = localX;
    tabGeo.zIndex = order.length;

    var left = 0;
    for (var i = 0, n = order.length; i < n; ++i) {
      var id = order[i];
      var geo = geos[id];
      left += offsets[i];
      if (id !== tabId) {
        geo.left = left;
        geo.zIndex = i;
      }
      left += geo.width;
    }
  }

  /**
   * Reset the tabs to their natural geometries.
   */
  reset(): void {
    var offsets = this._offsets;
    var order = this._order;
    var geos = this._geos;
    var left = 0;
    for (var i = 0, n = order.length; i < n; ++i) {
      var id = order[i];
      var geo = geos[id];
      left += offsets[i];
      geo.left = left;
      geo.zIndex = i;
      left += geo.width;
    }
  }

  private _clientRect: ClientRect;
  private _offsets: number[] = null;
  private _order: string[] = null;
  private _geos: { [id: string]: ITabGeo } = null;
}


/**
 * An object which holds the drag state for a tab bar.
 */
interface IDragState {
  /**
   * The id of the tab being dragged.
   */
  tabId: string;

  /**
   * The mouse press client X position.
   */
  pressX: number;

  /**
   * The mouse press client Y position.
   */
  pressY: number;

  /**
   * The mouse press X position in tab coordinates.
   */
  offsetX: number;

  /**
   * The mouse press Y position in tab coordinates.
   */
  offsetY: number;

  /**
   * The tab layout object which manages tab position.
   */
  layout: TabLayout;

  /**
   * The disposable to clean up the cursor override.
   */
  cursor: IDisposable;
}

} // module phosphor.components
