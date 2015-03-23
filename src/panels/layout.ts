/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import dispatch = core.dispatch;
import IDisposable = core.IDisposable;
import IMessage = core.IMessage;
import IMessageHandler = core.IMessageHandler;
import IMessageFilter = core.IMessageFilter;
import Message = core.Message;


/**
 * The base class of phosphor layouts.
 *
 * The Layout class does not define an interface for adding panels to
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
   * Get the parent panel of the layout.
   */
  get parent(): Panel {
    return this._parent;
  }

  /**
   * Set the parent panel of the layout.
   *
   * The parent panel can only be set once, and is done automatically
   * when the layout is installed on a panel. This should not be set
   * directly by user code.
   */
  set parent(parent: Panel) {
    if (!parent) {
      throw new Error('cannot set parent panel to null');
    }
    if (parent === this._parent) {
      return;
    }
    if (this._parent) {
      throw new Error('layout already installed on a panel');
    }
    this._parent = parent;
    this.reparentChildPanels();
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
   * Get the index of the given panel.
   *
   * Returns -1 if the panel does not exist in the layout.
   */
  indexOf(panel: Panel): number {
    for (var i = 0, n = this.count; i < n; ++i) {
      if (this.itemAt(i).panel === panel) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Remove the given panel from the layout.
   */
  remove(panel: Panel): void {
    var i = this.indexOf(panel);
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
      dispatch.postMessage(parent, new Message('layout-request'));
      parent.updateGeometry();
    }
  }

  /**
   * Filter a message sent to a message handler.
   */
  filterMessage(handler: IMessageHandler, msg: IMessage): boolean {
    if (handler === this._parent) {
      this.processPanelMessage(msg);
    }
    return false;
  }

  /**
   * Process a message dispatched to the parent panel.
   *
   * Subclasses may reimplement this method as needed.
   */
  protected processPanelMessage(msg: IMessage): void {
    switch (msg.type) {
      case 'resize':
      case 'layout-request':
        if (this._parent.isVisible) {
          this.layout();
        }
        break;
      case 'child-removed':
        this.remove((<ChildMessage>msg).child);
        break;
      case 'before-attach':
        this.invalidate();
        break;
      default:
        break;
    }
  }

  /**
   * Ensure a child panel is parented to the layout parent.
   *
   * This should be called by a subclass when adding a panel.
   */
  protected ensureParent(panel: Panel): void {
    var parent = this._parent;
    if (parent) panel.parent = parent;
  }

  /**
   * Reparent the child panels to the current layout parent.
   *
   * This is typically called automatically at the proper times.
   */
  protected reparentChildPanels(): void {
    var parent = this.parent;
    if (!parent) {
      return;
    }
    for (var i = 0, n = this.count; i < n; ++i) {
      var panel = this.itemAt(i).panel;
      if (panel) panel.parent = parent;
    }
  }

  /**
   * A method invoked on parent 'resize' and 'layout-request' messages.
   *
   * Subclasses should reimplement this method to update the layout.
   *
   * The default implementation is a no-op.
   */
  protected layout(): void { }

  private _parent: Panel = null;
}

} // module phosphor.panels
