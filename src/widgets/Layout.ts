/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import CoreEvent = require('../core/CoreEvent');
import ICoreEvent = require('../core/ICoreEvent');
import IEventHandler = require('../core/IEventHandler');
import evtl = require('../core/eventloop');

import Size = require('../geometry/Size');

import Alignment = require('./Alignment');
import ChildEvent = require('./ChildEvent');
import ILayout = require('./ILayout');
import ILayoutItem = require('./ILayoutItem');
import Widget = require('./Widget');

export = Layout;


/**
 * The base class of phosphor layouts.
 *
 * The Layout class does not define an interface for adding widgets
 * or layout items to the layout. A subclass should define that API
 * in a manner suitable for its intended use case.
 *
 * This class must be subclassed to be useful.
 */
class Layout implements ILayout {
  /**
   * Construct a new layout.
   */
  constructor() { }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._m_parentWidget = null;
  }

  /**
   * Get the parent widget of the layout.
   */
  get parentWidget(): Widget {
    return this._m_parentWidget;
  }

  /**
   * Set the parent widget of the layout.
   *
   * The parent widget can only be set once, and is done automatically
   * when the layout is installed on a widget. It should not be set
   * directly by user code.
   */
  set parentWidget(widget: Widget) {
    if (!widget) {
      throw new Error('cannot set parent widget to null');
    }
    if (widget === this._m_parentWidget) {
      return;
    }
    if (this._m_parentWidget) {
      throw new Error('layout already installed on a widget');
    }
    this._m_parentWidget = widget;
    this.reparentChildWidgets();
    this.invalidate();
  }

  /**
   * Get the number of layout items in the layout.
   *
   * This must be implemented by a subclass.
   */
  get count(): number {
    throw new Error('not implemented');
  }

  /**
   * Get the layout item at the given index.
   *
   * The items are numbered consecutively from `0` to `count - 1`.
   *
   * This must be implemented by a subclass.
   */
  itemAt(index: number): ILayoutItem {
    throw new Error('not implemented');
  }

  /**
   * Remove and return the layout item at the given index.
   *
   * This must be implemented by a subclass.
   */
  takeAt(index: number): ILayoutItem {
    throw new Error('not implemented');
  }

  /**
   * Compute the preferred size of the layout.
   *
   * This must be implemented by a subclass.
   */
  sizeHint(): Size {
    throw new Error('not implemented');
  }

  /**
   * Compute the minimum required size for the layout.
   *
   * This must be implemented by a subclass.
   */
  minSize(): Size {
    throw new Error('not implemented');
  }

  /**
   * Compute the maximum allowed size for the layout.
   *
   * This must be implemented by a subclass.
   */
  maxSize(): Size {
    throw new Error('not implemented');
  }

  /**
   * Get the index of the given layout item.
   *
   * Returns -1 if the item is not in the layout.
   */
  itemIndex(item: ILayoutItem): number {
    for (var i = 0, n = this.count; i < n; ++i) {
      if (this.itemAt(i) === item) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Remove the given item from the layout.
   *
   * This is a no-op if the item is not in the layout.
   *
   * Returns the index of the removed item.
   */
  removeItem(item: ILayoutItem): number {
    var i = this.itemIndex(item);
    if (i >= 0) this.takeAt(i);
    return i;
  }

  /**
   * Get the widget at the given index.
   *
   * Returns undefined if no widget exists for the index.
   */
  widgetAt(index: number): Widget {
    var item = this.itemAt(index);
    return (item && item.widget) || void 0;
  }

  /**
   * Get the index of the given widget.
   *
   * Returns -1 if the widget is not in the layout.
   */
  widgetIndex(widget: Widget): number {
    for (var i = 0, n = this.count; i < n; ++i) {
      if (this.itemAt(i).widget === widget) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Remove the given widget from the layout.
   *
   * This is a no-op if the widget is not in the layout.
   *
   * Returns the index of the removed widget.
   */
  removeWidget(widget: Widget): number {
    var i = this.widgetIndex(widget);
    if (i >= 0) this.takeAt(i);
    return i;
  }

  /**
   * Get the alignment for the given widget.
   *
   * Returns 0 if the widget is not in the layout.
   */
  alignmentFor(widget: Widget): Alignment {
    var i = this.widgetIndex(widget);
    return i >= 0 ? this.itemAt(i).alignment : 0;
  }

  /**
   * Set the alignment for the given widget.
   *
   * If the widget is not in the layout, this is a no-op.
   */
  setAlignment(widget: Widget, alignment: Alignment): void {
    var i = this.widgetIndex(widget);
    if (i >= 0) {
      var item = this.itemAt(i);
      if (item.alignment !== alignment) {
        item.alignment = alignment;
        this.invalidate();
      }
    }
  }

  /**
   * Invalidate the cached layout data and enqueue an update.
   *
   * This should be reimplemented by a subclass as needed.
   */
  invalidate(): void {
    var parent = this._m_parentWidget;
    if (parent) {
      evtl.postEvent(parent, EVT_LAYOUT_REQUEST);
      parent.updateGeometry();
    }
  }

  /**
   * Hook an event dispatched to an event handler.
   *
   * This calls the `processWidgetEvent` method when the event handler
   * target is the parent widget. This always returns false.
   */
  filterEvent(handler: IEventHandler, event: ICoreEvent): boolean {
    if (handler === this._m_parentWidget) {
      this.processWidgetEvent(event);
    }
    return false;
  }

  /**
   * Process an event dispatched to the parent widget.
   *
   * Subclasses should reimplement this method as needed.
   */
  protected processWidgetEvent(event: ICoreEvent): void {
    switch (event.type) {
      case 'resize':
      case 'layout-request':
        if (this._m_parentWidget.isVisible) {
          this.updateLayout();
        }
        break;
      case 'child-removed':
        this.removeWidget((<ChildEvent>event).child);
        break;
      case 'before-attach':
        this.invalidate();
        break;
      default:
        break;
    }
  }

  /**
   * A method invoked on parent 'resize' and 'layout-request' events.
   *
   * Subclasses should reimplement this method to update the layout.
   *
   * The default implementation is a no-op.
   */
  protected updateLayout(): void { }

  /**
   * Reparent the child widgets to the layout's parent.
   *
   * This is called when the layout is installed on a widget.
   */
  protected reparentChildWidgets(): void {
    var parent = this._m_parentWidget;
    if (parent) {
      for (var i = 0, n = this.count; i < n; ++i) {
        var child = this.itemAt(i).widget;
        if (child) child.parent = parent;
      }
    }
  }

  /**
   * Add a child widget to the layout.
   *
   * This should be called by a subclass when a widget is added to
   * layout. It ensures that the widget is properly parented to the
   * layout's parent widget.
   */
  protected addChildWidget(child: Widget): void {
    var parent = this._m_parentWidget;
    if (parent) child.parent = parent;
  }

  private _m_parentWidget: Widget = null;
}


/**
 * A singleton 'layout-request' event.
 */
var EVT_LAYOUT_REQUEST = new CoreEvent('layout-request');
