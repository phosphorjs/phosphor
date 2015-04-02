/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import IDisposable = core.IDisposable;
import IMessage = core.IMessage;
import IMessageHandler = core.IMessageHandler;
import IMessageFilter = core.IMessageFilter;
import Message = core.Message;
import postMessage = core.postMessage;

import Size = utility.Size;


/**
 * The base class of phosphor layouts.
 *
 * The Layout class does not define an interface for adding widgets to
 * the layout. A subclass should define that API in a manner suitable
 * for its intended use.
 */
export
class Layout implements IMessageFilter, IDisposable {
  /**
   * Construct a new layout.
   */
  constructor() { }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    this._parent = null;
  }

  /**
   * Get the parent widget of the layout.
   */
  get parent(): Widget {
    return this._parent;
  }

  /**
   * Set the parent widget of the layout.
   *
   * The parent widget can only be set once, and is done automatically
   * when the layout is installed on a widget. This should not be set
   * directly by user code.
   */
  set parent(parent: Widget) {
    if (!parent) {
      throw new Error('cannot set parent widget to null');
    }
    if (parent === this._parent) {
      return;
    }
    if (this._parent) {
      throw new Error('layout already installed on a widget');
    }
    this._parent = parent;
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
   * Get the widget at the given index.
   *
   * Returns `undefined` if there is no widget at the given index.
   */
  widgetAt(index: number): Widget {
    var item = this.itemAt(index);
    return (item && item.widget) || void 0;
  }

  /**
   * Get the index of the given widget or layout item.
   *
   * Returns -1 if the widget or item does not exist in the layout.
   */
  indexOf(value: Widget | ILayoutItem): number {
    for (var i = 0, n = this.count; i < n; ++i) {
      var item = this.itemAt(i);
      if (item === value || item.widget === value) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Remove the given widget or layout item from the layout.
   */
  remove(value: Widget | ILayoutItem): void {
    var i = this.indexOf(value);
    if (i !== -1) this.takeAt(i);
  }

  /**
   * Invalidate the cached layout data and enqueue an update.
   *
   * This should be reimplemented by a subclass as needed.
   */
  invalidate(): void {
    var parent = this._parent;
    if (parent) {
      postMessage(parent, new Message('layout-request'));
      parent.updateGeometry();
    }
  }

  /**
   * Update the layout for the parent widget immediately.
   *
   * This is typically called automatically at the appropriate times.
   */
  update(): void {
    var parent = this._parent;
    if (parent.isVisible) {
      var box = parent.boxData();
      var x = box.paddingLeft;
      var y = box.paddingTop;
      var w = parent.width - box.horizontalSum;
      var h = parent.height - box.verticalSum;
      this.layout(x, y, w, h);
    }
  }

  /**
   * Filter a message sent to a message handler.
   *
   * This implements the `IMessageFilter` interface.
   */
  filterMessage(handler: IMessageHandler, msg: IMessage): boolean {
    if (handler === this._parent) {
      this.processParentMessage(msg);
    }
    return false;
  }

  /**
   * Process a message dispatched to the parent widget.
   *
   * Subclasses may reimplement this method as needed.
   */
  protected processParentMessage(msg: IMessage): void {
    switch (msg.type) {
    case 'resize':
    case 'layout-request':
      this.update();
      break;
    case 'child-removed':
      this.remove((<ChildMessage>msg).child);
      break;
    case 'before-attach':
      this.invalidate();
      break;
    }
  }

  /**
   * A method invoked when widget layout should be updated.
   *
   * The arguments are the content boundaries for the layout which are
   * already adjusted to account for the parent widget box sizing data.
   *
   * The default implementation of this method is a no-op.
   */
  protected layout(x: number, y: number, width: number, height: number): void { }

  /**
   * Ensure a child widget is parented to the layout's parent.
   *
   * This should be called by a subclass when adding a widget.
   */
  protected ensureParent(widget: Widget): void {
    var parent = this._parent;
    if (parent) widget.parent = parent;
  }

  /**
   * Reparent the child widgets to the layout's parent.
   *
   * This is typically called automatically at the proper times.
   */
  protected reparentChildWidgets(): void {
    var parent = this._parent;
    if (parent) {
      for (var i = 0, n = this.count; i < n; ++i) {
        var widget = this.itemAt(i).widget;
        if (widget) widget.parent = parent;
      }
    }
  }

  private _parent: Widget = null;
}

} // module phosphor.widgets
