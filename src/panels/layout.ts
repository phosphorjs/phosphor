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
 * The Layout class does not define an interface for adding panels
 * or layout items to the layout. A subclass should define that API
 * in a manner suitable for its intended use case.
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
  set parent(panel: Panel) {
    if (!panel) {
      throw new Error('cannot set parent panel to null');
    }
    if (panel === this._parent) {
      return;
    }
    if (this._parent) {
      throw new Error('layout already installed on a panel');
    }
    this._parent = panel;
    this.reparentChildren();
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
   * Get the panel at the given index.
   *
   * Returns undefined if no panel exists for the index.
   */
  panelAt(index: number): Panel {
    var item = this.itemAt(index);
    return (item && item.panel) || void 0;
  }

  /**
   * Get the index of the given panel.
   *
   * Returns -1 if the panel is not in the layout.
   */
  panelIndex(panel: Panel): number {
    for (var i = 0, n = this.count; i < n; ++i) {
      if (this.itemAt(i).panel === panel) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Remove the given panel from the layout.
   *
   * This is a no-op if the panel is not in the layout.
   *
   * Returns the index of the removed panel.
   */
  removePanel(panel: Panel): number {
    var i = this.panelIndex(panel);
    if (i >= 0) this.takeAt(i);
    return i;
  }

  /**
   * Get the alignment for the given panel.
   *
   * Returns 0 if the panel is not in the layout.
   */
  alignmentFor(panel: Panel): Alignment {
    var i = this.panelIndex(panel);
    return i >= 0 ? this.itemAt(i).alignment : 0;
  }

  /**
   * Set the alignment for the given panel.
   *
   * If the panel is not in the layout, this is a no-op.
   */
  setAlignment(panel: Panel, alignment: Alignment): void {
    var i = this.panelIndex(panel);
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
   * Subclasses should reimplement this method as needed.
   */
  protected processPanelMessage(msg: IMessage): void {
    switch (msg.type) {
      case 'resize':
      case 'layout-request':
        if (this._parent.isVisible) {
          this.updateLayout();
        }
        break;
      case 'child-removed':
        this.removePanel((<ChildMessage>msg).child);
        break;
      case 'before-attach':
        this.invalidate();
        break;
      default:
        break;
    }
  }

  /**
   * A method invoked on parent 'resize' and 'layout-request' messages.
   *
   * Subclasses should reimplement this method to update the layout.
   *
   * The default implementation is a no-op.
   */
  protected updateLayout(): void { }

  /**
   * Reparent the child panels to the layout's parent.
   *
   * This is called when the layout is installed on a panel.
   */
  protected reparentChildren(): void {
    var parent = this._parent;
    if (parent) {
      for (var i = 0, n = this.count; i < n; ++i) {
        var child = this.itemAt(i).panel;
        if (child) child.parent = parent;
      }
    }
  }

  /**
   * Ensure a child panel is parented to the layout parent.
   *
   * This should be called by a subclass when adding a panel.
   */
  protected ensureParent(child: Panel): void {
    var parent = this._parent;
    if (parent) child.parent = parent;
  }

  private _parent: Panel = null;
}

} // module phosphor.panels
