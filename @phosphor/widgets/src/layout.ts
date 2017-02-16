/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, each
} from '@phosphor/algorithm';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  AttachedProperty
} from '@phosphor/properties';

import {
  Signal
} from '@phosphor/signaling';

import {
  Widget
} from './widget';


/**
 * An abstract base class for creating Phosphor layouts.
 *
 * #### Notes
 * A layout is used to add widgets to a parent and to arrange those
 * widgets within the parent's DOM node.
 *
 * This class implements the base functionality which is required of
 * nearly all layouts. It must be subclassed in order to be useful.
 *
 * Notably, this class does not define a uniform interface for adding
 * widgets to the layout. A subclass should define that API in a way
 * which is meaningful for its intended use.
 */
export
abstract class Layout implements IIterable<Widget>, IDisposable {
  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   *
   * #### Notes
   * This abstract method must be implemented by a subclass.
   */
  abstract iter(): IIterator<Widget>;

  /**
   * Remove a widget from the layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method should *not* modify the widget's `parent`.
   */
  abstract removeWidget(widget: Widget): void;

  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This should be reimplemented to clear and dispose of the widgets.
   *
   * All reimplementations should call the superclass method.
   *
   * This method is called automatically when the parent is disposed.
   */
  dispose(): void {
    this._parent = null;
    this._disposed = true;
    Signal.clearData(this);
    AttachedProperty.clearData(this);
  }

  /**
   * Test whether the layout is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Get the parent widget of the layout.
   */
  get parent(): Widget | null {
    return this._parent;
  }

  /**
   * Set the parent widget of the layout.
   *
   * #### Notes
   * This is set automatically when installing the layout on the parent
   * widget. The parent widget should not be set directly by user code.
   */
  set parent(value: Widget | null) {
    if (this._parent === value) {
      return;
    }
    if (this._parent) {
      throw new Error('Cannot change parent widget.');
    }
    if (value!.layout !== this) {
      throw new Error('Invalid parent widget.');
    }
    this._parent = value;
    this.init();
  }

  /**
   * Process a message sent to the parent widget.
   *
   * @param msg - The message sent to the parent widget.
   *
   * #### Notes
   * This method is called by the parent widget to process a message.
   *
   * Subclasses may reimplement this method as needed.
   */
  processParentMessage(msg: Message): void {
    switch (msg.type) {
    case 'resize':
      this.onResize(msg as Widget.ResizeMessage);
      break;
    case 'update-request':
      this.onUpdateRequest(msg);
      break;
    case 'fit-request':
      this.onFitRequest(msg);
      break;
    case 'before-show':
      this.onBeforeShow(msg);
      break;
    case 'after-show':
      this.onAfterShow(msg);
      break;
    case 'before-hide':
      this.onBeforeHide(msg);
      break;
    case 'after-hide':
      this.onAfterHide(msg);
      break;
    case 'before-attach':
      this.onBeforeAttach(msg);
      break;
    case 'after-attach':
      this.onAfterAttach(msg);
      break;
    case 'before-detach':
      this.onBeforeDetach(msg);
      break;
    case 'after-detach':
      this.onAfterDetach(msg);
      break;
    case 'child-removed':
      this.onChildRemoved(msg as Widget.ChildMessage);
      break;
    case 'child-shown':
      this.onChildShown(msg as Widget.ChildMessage);
      break;
    case 'child-hidden':
      this.onChildHidden(msg as Widget.ChildMessage);
      break;
    }
  }

  /**
   * Perform layout initialization which requires the parent widget.
   *
   * #### Notes
   * This method is invoked immediately after the layout is installed
   * on the parent widget.
   *
   * The default implementation reparents all of the widgets to the
   * layout parent widget.
   *
   * Subclasses should reimplement this method and attach the child
   * widget nodes to the parent widget's node.
   */
  protected init(): void {
    each(this, widget => {
      widget.parent = this.parent;
    });
  }

  /**
   * A message handler invoked on a `'resize'` message.
   *
   * #### Notes
   * The layout should ensure that its widgets are resized according
   * to the specified layout space, and that they are sent a `'resize'`
   * message if appropriate.
   *
   * The default implementation of this method sends an `UnknownSize`
   * resize message to all widgets.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    each(this, widget => {
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
    });
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   *
   * #### Notes
   * The layout should ensure that its widgets are resized according
   * to the available layout space, and that they are sent a `'resize'`
   * message if appropriate.
   *
   * The default implementation of this method sends an `UnknownSize`
   * resize message to all widgets.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onUpdateRequest(msg: Message): void {
    each(this, widget => {
      MessageLoop.sendMessage(widget, Widget.ResizeMessage.UnknownSize);
    });
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeAttach(msg: Message): void {
    each(this, widget => {
      MessageLoop.sendMessage(widget, msg);
    });
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterAttach(msg: Message): void {
    each(this, widget => {
      MessageLoop.sendMessage(widget, msg);
    });
  }

  /**
   * A message handler invoked on a `'before-detach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeDetach(msg: Message): void {
    each(this, widget => {
      MessageLoop.sendMessage(widget, msg);
    });
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message
   * to all widgets. It assumes all widget nodes are attached to the
   * parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterDetach(msg: Message): void {
    each(this, widget => {
      MessageLoop.sendMessage(widget, msg);
    });
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeShow(msg: Message): void {
    each(this, widget => {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    });
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterShow(msg: Message): void {
    each(this, widget => {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    });
  }

  /**
   * A message handler invoked on a `'before-hide'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onBeforeHide(msg: Message): void {
    each(this, widget => {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    });
  }

  /**
   * A message handler invoked on an `'after-hide'` message.
   *
   * #### Notes
   * The default implementation of this method forwards the message to
   * all non-hidden widgets. It assumes all widget nodes are attached
   * to the parent widget node.
   *
   * This may be reimplemented by subclasses as needed.
   */
  protected onAfterHide(msg: Message): void {
    each(this, widget => {
      if (!widget.isHidden) {
        MessageLoop.sendMessage(widget, msg);
      }
    });
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   *
   * #### Notes
   * This will remove the child widget from the layout.
   *
   * Subclasses should **not** typically reimplement this method.
   */
  protected onChildRemoved(msg: Widget.ChildMessage): void {
    this.removeWidget(msg.child);
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onFitRequest(msg: Message): void { }

  /**
   * A message handler invoked on a `'child-shown'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildShown(msg: Widget.ChildMessage): void { }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void { }

  private _disposed = false;
  private _parent: Widget | null = null;
}
