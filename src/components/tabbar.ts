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
 * The default start drag distance threshold.
 */
var DRAG_THRESHOLD = 5;


/**
 *
 */
export
interface ITabItem {
  /**
   *
   */
  id: string;

  /**
   *
   */
  text: string;

  /**
   *
   */
  selected?: boolean;

  /**
   *
   */
  closable?: boolean;
}


/**
 *
 */
export
interface ITabBarData extends IData {
  /**
   *
   */
  items: ITabItem[];

  /**
   *
   */
  tabsMovable?: boolean;
}


/**
 *
 */
export
interface ITabGeo {
  /**
   *
   */
  top: number;

  /**
   *
   */
  left: number;

  /**
   *
   */
  width: number;

  /**
   *
   */
  height: number;

  /**
   *
   */
  zIndex: number;
}


/**
 *
 */
export
interface ITabLayout {
  /**
   *
   */
  offsets: number[];

  /**
   *
   */
  order: string[];

  /**
   *
   */
  geos: { [id: string]: ITabGeo };
}


/**
 *
 */
export
class TabBarComponent extends Component<ITabBarData> {
  /**
   *
   */
  static tagName = 'ul';

  /**
   *
   */
  static className = TAB_BAR_CLASS;

  /**
   *
   */
  constructor() {
    super();
    this.node.addEventListener('mousedown', <any>this);
    this.node.addEventListener('click', <any>this);
  }

  /**
   *
   */
  dispose() {
    this._releaseMouse();
    this.node.removeEventListener('mousedown', <any>this);
    this.node.removeEventListener('click', <any>this);
    super.dispose();
  }

  /**
   *
   */
  render(): IElement[] {
    var dragData = this._dragData;
    if (!dragData) {
      return this.data.items.map(item => this.renderTab(item, null));
    }
    var result: IElement[] = [];
    var geos = dragData.layout.geos;
    this.data.items.forEach(item => {
      result.push(this.renderTab(item, geos[item.id]));
    });
    return result;
  }

  /**
   *
   */
  protected renderTab(tab: ITabItem, geo: ITabGeo): IElement {
    var parts = [TAB_CLASS];
    if (tab.selected) {
      parts.push(SELECTED_CLASS);
    }
    if (tab.closable) {
      parts.push(CLOSABLE_CLASS);
    }
    if (this._dragData && this._dragData.tabId === tab.id) {
      parts.push('p-mod-active');
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
   *
   */
  protected isCloseIcon(target: HTMLElement): boolean {
    return target.classList.contains(CLOSE_ICON_CLASS);
  }

  /**
   *
   */
  protected tabAtPos(clientX: number, clientY: number): HTMLElement {
    var tab = <HTMLElement>this.node.firstChild;
    while (tab !== null) {
      if (hitTest(tab, clientX, clientY)) {
        return tab;
      }
      tab = <HTMLElement>tab.nextSibling;
    }
    return null;
  }

  /**
   * Handle the DOM events for the tab component.
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
   *
   */
  protected domEvent_click(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    if (!this.isCloseIcon(<HTMLElement>event.target)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    // var tab = this._tabs[index];
    // var icon = tab.closeIconNode;
    // if (icon && icon === event.target && tab.closable) {
    //   this.tabCloseRequested.emit(this, { index: index, tab: tab });
    // }
  }

  /**
   *
   */
  protected domEvent_mousedown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    var clientX = event.clientX;
    var clientY = event.clientY;
    var tab = this.tabAtPos(clientX, clientY);
    if (!tab) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!this.data.tabsMovable) {
      return;
    }
    if (this.isCloseIcon(<HTMLElement>event.target)) {
      return;
    }
    var tabId = <string>(<any>tab.dataset).id;
    var tabRect = tab.getBoundingClientRect();
    var clientRect = this.node.getBoundingClientRect();
    this._dragData = {
      tabId: tabId,
      pressX: clientX,
      pressY: clientY,
      offsetX: clientX - tabRect.left,
      offsetY: clientY - tabRect.top,
      clientRect: clientRect,
      cursor: null,
      active: false,
      layout: null };
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);
  }

  /**
   *
   */
  protected domEvent_mousemove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    var dragData = this._dragData;
    if (!dragData || !this.data.tabsMovable) {
      return;
    }
    var dragData = this._dragData;
    if (!dragData.active) {
      var dx = Math.abs(event.clientX - dragData.pressX);
      var dy = Math.abs(event.clientY - dragData.pressY);
      if (dx < DRAG_THRESHOLD && dy < DRAG_THRESHOLD) {
        return;
      }
      dragData.active = true;
      dragData.layout = this.snapLayout();
      dragData.cursor = overrideCursor('default');
    }
    var clientRect = dragData.clientRect;
    var geos = dragData.layout.geos;
    var order = dragData.layout.order;
    var geo = geos[dragData.tabId];
    var index = order.indexOf(dragData.tabId);
    var localX = event.clientX - clientRect.left - dragData.offsetX;
    var targetX = Math.max(0, Math.min(localX, clientRect.width - geo.width));

    var lowerBound = 0;
    if (index > 0) {
     var leftGeo = geos[order[index - 1]];
     lowerBound = leftGeo.left + leftGeo.width * (1 - 0.6);
    }

    var upperBound = clientRect.width - geo.width;
    if (index < order.length - 1) {
      var rightGeo = geos[order[index + 1]];
      upperBound = rightGeo.left + rightGeo.width * 0.6 - geo.width;
    }

    if (targetX < lowerBound) {
      var tempId = order[index - 1];
      order[index - 1] = dragData.tabId;
      order[index] = tempId;
    } else if (targetX > upperBound) {
      var tempId = order[index + 1];
      order[index + 1] = dragData.tabId;
      order[index] = tempId;
    }

    geo.left = targetX;
    this._layoutTabs();
    this.doRender();
  }

  /**
   * Handle the mouse up event for the tab component.
   */
  protected domEvent_mouseup(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._releaseMouse();
    this.doRender();
  }

  /**
   *
   */
  protected snapLayout(): ITabLayout {
    var order: string[] = [];
    var offsets: number[] = [];
    var geos: { [id: string]: ITabGeo } = {};
    var barRect = this.node.getBoundingClientRect();
    var barTop = barRect.top;
    var barLeft = barRect.left;
    var left = barLeft;
    var childNodes = this.node.childNodes;
    for (var i = 0, n = childNodes.length; i < n; ++i) {
      var tab = <HTMLElement>childNodes[i];
      var id = <string>(<any>tab.dataset).id;
      var rect = tab.getBoundingClientRect();
      order.push(id);
      offsets.push(rect.left - left);
      geos[id] = {
        zIndex: i,
        top: rect.top - barTop,
        left: rect.left - barLeft,
        width: rect.width,
        height: rect.height };
      left = rect.right;
    }
    return { order: order, offsets: offsets, geos: geos };
  }

  /**
   * Release the current mouse grab for the tab component.
   */
  private _releaseMouse(): void {
    var data = this._dragData;
    if (!data) {
      return;
    }
    this._dragData = null;
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);
    if (data.cursor) data.cursor.dispose();
  }

  private _layoutTabs(): void {
    var dragData = this._dragData;
    var activeId = dragData.tabId;
    var geos = dragData.layout.geos;
    var order = dragData.layout.order;
    var offsets = dragData.layout.offsets;
    var left = 0;
    for (var i = 0, n = order.length; i < n; ++i) {
      var id = order[i];
      var geo = geos[id];
      left += offsets[i];
      if (id !== activeId) {
        geo.left = left;
        geo.zIndex = i;
      } else {
        geo.zIndex = n;
      }
      left += geo.width;
    }
  }

  private _dragData: IDragData = null;
}


/**
 *
 */
export
var TabBar = createFactory(TabBarComponent);


/**
 * An object which holds the drag data for a tab bar.
 */
interface IDragData {
  /**
   * The id of the drag tab.
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
   * The client rect of the tab bar node.
   */
  clientRect: ClientRect;

  /**
   * The disposable to clean up the cursor override.
   */
  cursor: IDisposable;

  /**
   * Whether the drag is currently active.
   */
  active: boolean;

  /**
   * The current layout data for the tabs.
   */
  layout: ITabLayout;
}

} // module phosphor.components
