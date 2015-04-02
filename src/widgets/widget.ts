/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import some = collections.some;
import IIterable = collections.IIterable;
import IIterator = collections.IIterator;
import List = collections.List;

import IDisposable = core.IDisposable;
import IMessage = core.IMessage;
import IMessageHandler = core.IMessageHandler;
import Message = core.Message;
import Signal = core.Signal;
import clearMessageData = core.clearMessageData;
import installMessageFilter = core.installMessageFilter;
import postMessage = core.postMessage;
import sendMessage = core.sendMessage;
import removeMessageFilter = core.removeMessageFilter;

import IBoxData = utility.IBoxData;
import Point = utility.Point;
import Rect = utility.Rect;
import Size = utility.Size;
import createBoxData = utility.createBoxData;


/**
 * The class name added to Widget instances.
 */
var WIDGET_CLASS = 'p-Widget';

/**
 * The class name added to hidden widgets.
 */
var HIDDEN_CLASS = 'p-mod-hidden';


/**
 * The base class of the Phosphor widget hierarchy.
 *
 * A widget wraps an absolutely positioned DOM node. It can act as a
 * container for child widgets which can be arranged with a Phosphor
 * layout manager, or it can act as a leaf control which manipulates
 * its DOM node directly.
 *
 * A root widget (a widget with no parent) can be mounted anywhere
 * in the DOM by calling its `attach` method and passing the DOM
 * node which should be used as the parent of the widget's node.
 */
export
class Widget implements IMessageHandler, IDisposable {
  /**
   * A signal emitted when the widget is disposed.
   */
  disposed = new Signal<Widget, void>();

  /**
   * Construct a new widget.
   */
  constructor() {
    this._node = this.createNode();
    this.addClass(WIDGET_CLASS);
  }

  /**
   * Dispose of the widget and its descendants.
   */
  dispose(): void {
    clearMessageData(this);
    this.setFlag(WidgetFlag.IsDisposed);
    this.disposed.emit(this, void 0);
    this.disposed.disconnect();

    var parent = this._parent;
    if (parent) {
      this._parent = null;
      parent._children.remove(this);
      sendMessage(parent, new ChildMessage('child-removed', this));
    } else if (this.isAttached) {
      this.detach();
    }

    var layout = this._layout;
    if (layout) {
      this._layout = null;
      layout.dispose();
    }

    var children = this._children;
    for (var i = 0, n = children.size; i < n; ++i) {
      var child = children.get(i);
      children.set(i, null);
      child._parent = null;
      child.dispose();
    }
    children.clear();

    this._node = null;
  }

  /**
   * Get the DOM node managed by the widget.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Get the X position of the widget.
   */
  get x(): number {
    return this._x;
  }

  /**
   * Set the X position of the widget.
   *
   * This is equivalent to `setPos(x, this.y)`.
   */
  set x(x: number) {
    this.setPos(x, this._y);
  }

  /**
   * Get the Y position of the widget.
   */
  get y(): number {
    return this._y;
  }

  /**
   * Set the Y position of the widget.
   *
   * This is equivalent to `setPos(this.x, y)`.
   */
  set y(y: number) {
    this.setPos(this._x, y);
  }

  /**
   * Get the width of the widget.
   */
  get width(): number {
    return this._width;
  }

  /**
   * Set the width of the widget.
   *
   * This is equivalent to `setSize(width, this.height)`.
   */
  set width(width: number) {
    this.setSize(width, this._height);
  }

  /**
   * Get the height of the widget.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Set the height of the widget.
   *
   * This is equivalent to `setSize(this.width, height)`.
   */
  set height(height: number) {
    this.setSize(this._width, height);
  }

  /**
   * Get the position of the widget.
   */
  get pos(): Point {
    return new Point(this._x, this._y);
  }

  /**
   * Set the position of the widget.
   *
   * This is equivalent to `setPos(pos.x, pos.y)`.
   */
  set pos(pos: Point) {
    this.setPos(pos.x, pos.y);
  }

  /**
   * Get the size of the widget.
   */
  get size(): Size {
    return new Size(this._width, this._height);
  }

  /**
   * Set the size of the widget.
   *
   * This is equivalent to `setSize(size.width, size.height)`.
   */
  set size(size: Size) {
    this.setSize(size.width, size.height);
  }

  /**
   * Get the geometry rect of the widget.
   */
  get rect(): Rect {
    return new Rect(this._x, this._y, this._width, this._height);
  }

  /**
   * Set the geometry rect of the widget.
   *
   * This is equivalent to `setRect(r.x, r.y, r.width, r.height)`.
   */
  set rect(rect: Rect) {
    this.setRect(rect.x, rect.y, rect.width, rect.height);
  }

  /**
   * Test whether the widget's node is attached to the DOM.
   */
  get isAttached(): boolean {
    return this.testFlag(WidgetFlag.IsAttached);
  }

  /**
   * Test whether the widget has been disposed.
   */
  get isDisposed(): boolean {
    return this.testFlag(WidgetFlag.IsDisposed);
  }

  /**
   * Test whether the widget is explicitly hidden.
   */
  get isHidden(): boolean {
    return this.testFlag(WidgetFlag.IsHidden);
  }

  /**
   * Test whether the widget is visible.
   *
   * A widget is visible under the following conditions:
   *   - it is attached to the DOM
   *   - it is not explicitly hidden
   *   - it has no explicitly hidden ancestors
   */
  get isVisible(): boolean {
    return this.testFlag(WidgetFlag.IsVisible);
  }

  /**
   * Get the parent of the widget.
   *
   * This is null if the widget has no parent.
   */
  get parent(): Widget {
    return this._parent;
  }

  /**
   * Set the parent of the widget.
   *
   * Setting the parent to null will detach the widget from the DOM and
   * remove the widget from the hierarchy and any layout manager which
   * is attached to its parent.
   */
  set parent(parent: Widget) {
    parent = parent || null;
    var oldParent = this._parent;
    if (oldParent === parent) {
      return;
    }
    if (oldParent) {
      this._parent = null;
      oldParent._children.remove(this);
      sendMessage(oldParent, new ChildMessage('child-removed', this));
    }
    if (parent) {
      this._parent = parent;
      parent._children.add(this);
      sendMessage(parent, new ChildMessage('child-added', this));
    }
    sendMessage(this, new Message('parent-changed'));
  }

  /**
   * Get the layout manager attached to the widget.
   *
   * This is null if the widget has no layout manager.
   */
  get layout(): Layout {
    return this._layout;
  }

  /**
   * Set the layout manager for the widget.
   *
   * The given layout must be null or a new layout which has not been
   * assigned to any other widget or an exception will be thrown. The
   * existing layout will be disposed and cannot be reused.
   */
  set layout(layout: Layout) {
    layout = layout || null;
    var oldLayout = this._layout;
    if (oldLayout === layout) {
      return;
    }
    if (this.testFlag(WidgetFlag.DisallowLayoutChange)) {
      throw new Error('cannot change widget layout');
    }
    if (layout && layout.parent) {
      throw new Error('layout already installed on a widget');
    }
    if (oldLayout) {
      this._layout = null;
      removeMessageFilter(this, oldLayout);
      oldLayout.dispose();
    }
    if (layout) {
      this._layout = layout;
      installMessageFilter(this, layout);
      layout.parent = this;
    }
    sendMessage(this, new Message('layout-changed'));
  }

  /**
   * Get an iterator over the widget's children.
   */
  children(): IIterator<Widget> {
    return this._children.iterator();
  }

  /**
   * Test whether the widget's DOM node has the given class name.
   */
  hasClass(name: string): boolean {
    return this._node.classList.contains(name);
  }

  /**
   * Add a class name to the widget's DOM node.
   */
  addClass(name: string): void {
    this._node.classList.add(name);
  }

  /**
   * Remove a class name from the widget's DOM node.
   */
  removeClass(name: string): void {
    this._node.classList.remove(name);
  }

  /**
   * Test whether the given widget flag is set.
   */
  testFlag(flag: WidgetFlag): boolean {
    return (this._flags & flag) !== 0;
  }

  /**
   * Set the given widget flag.
   */
  setFlag(flag: WidgetFlag): void {
    this._flags |= flag;
  }

  /**
   * Clear the given widget flag.
   */
  clearFlag(flag: WidgetFlag): void {
    this._flags &= ~flag;
  }

  /**
   * Make the widget visible to its parent.
   *
   * If the widget is not explicitly hidden, this is a no-op.
   */
  show(): void {
    if (!this.isHidden) {
      return;
    }
    var parent = this._parent;
    if (this.isAttached && (!parent || parent.isVisible)) {
      sendMessage(this, new Message('before-show'));
      this.removeClass(HIDDEN_CLASS);
      this.clearFlag(WidgetFlag.IsHidden);
      sendMessage(this, new Message('after-show'));
    } else {
      this.removeClass(HIDDEN_CLASS);
      this.clearFlag(WidgetFlag.IsHidden);
    }
    if (parent) {
      sendMessage(parent, new ChildMessage('child-shown', this));
    }
    this.updateGeometry();
  }

  /**
   * Make the widget invisible to its parent.
   *
   * If the widget is already hidden, this is a no-op.
   */
  hide(): void {
    if (this.isHidden) {
      return;
    }
    var parent = this._parent;
    if (this.isAttached && (!parent || parent.isVisible)) {
      sendMessage(this, new Message('before-hide'));
      this.addClass(HIDDEN_CLASS);
      this.setFlag(WidgetFlag.IsHidden);
      sendMessage(this, new Message('after-hide'));
    } else {
      this.addClass(HIDDEN_CLASS);
      this.setFlag(WidgetFlag.IsHidden);
    }
    if (parent) {
      sendMessage(parent, new ChildMessage('child-hidden', this));
    }
    this.updateGeometry(true);
  }

  /**
   * Close the widget by sending it a 'close' message.
   *
   * Subclasses may reimplement the `onClose` method to perform custom
   * actions before removing the widget from the hierarchy.
   */
  close(): void {
    sendMessage(this, new Message('close'));
  }

  /**
   * Attach the widget's node to a host DOM element.
   *
   * The `fit` method can be called to resize the widget to fill its
   * host node. It should be called whenever the size of host node is
   * known to have changed.
   *
   * Only a root widget can be attached to a host node.
   */
  attach(host: HTMLElement): void {
    if (this._parent) {
      throw new Error('cannot attach a non-root widget to the DOM');
    }
    sendMessage(this, new Message('before-attach'));
    host.appendChild(this._node);
    sendMessage(this, new Message('after-attach'));
  }

  /**
   * Detach the widget's node from the DOM.
   *
   * Only a root widget can be detached from its host node.
   */
  detach(): void {
    if (this._parent) {
      throw new Error('cannot dettach a non-root widget from the DOM');
    }
    var host = this._node.parentNode;
    if (!host) {
      return;
    }
    sendMessage(this, new Message('before-detach'));
    host.removeChild(this._node);
    sendMessage(this, new Message('after-detach'));
  }

  /**
   * Resize the widget so that its fills its host node.
   *
   * Only a root widget can be fit to its host.
   *
   * If the size of the host node is known, it can be provided. This
   * will prevent a read from the DOM and avoid a potential reflow.
   */
  fit(width?: number, height?: number, box?: IBoxData): void {
    if (this._parent) {
      throw new Error('cannot fit a non-root widget');
    }
    var host = <HTMLElement>this._node.parentNode;
    if (!host) {
      return;
    }
    if (width === void 0) {
      width = host.offsetWidth;
    }
    if (height === void 0) {
      height = host.offsetHeight;
    }
    if (box === void 0) {
      box = createBoxData(host);
    }
    var x = box.paddingLeft;
    var y = box.paddingTop;
    var w = width - box.horizontalSum;
    var h = height - box.verticalSum;
    this.setRect(x, y, w, h);
  }

  /**
   * Calculate the preferred minimum size for the widget.
   *
   * This is used by Phosphor's layout machinery to compute the minimum
   * space required for the widget and its children. This is independent
   * of and subordinate to the minimum size specified in CSS. User code
   * will not typically interact with this method.
   *
   * The default implementation of this method delegates to the layout
   * manager if installed, otherwise it returns a zero size.
   */
  minSizeHint(): Size {
    if (this._layout) {
      return this._layout.minSize();
    }
    return Size.Zero;
  }

  /**
   * Calculate the preferred maximum size for the widget.
   *
   * This is used by Phosphor's layout machinery to compute the maximum
   * space allowed for the widget and its children. This is independent
   * of and subordinate to the maximum size specified in CSS. User code
   * will not typically interact with this method.
   *
   * The default implementation of this method delegates to the layout
   * manager if installed, otherwise it returns an infinite size.
   */
  maxSizeHint(): Size {
    if (this._layout) {
      return this._layout.maxSize();
    }
    return Size.Infinite;
  }

  /**
   * Get the CSS box data for the widget.
   *
   * This method computes the box data once, then caches it. The cached
   * box data can be cleared by calling the `invalidateBoxData` method.
   */
  boxData(): IBoxData {
    if (!this._boxData) {
      this._boxData = createBoxData(this._node);
    }
    return this._boxData;
  }

  /**
   * Invalidate the cached CSS box data for the widget.
   *
   * This should be called when the node's min or max size, padding,
   * or border changes due to user modifications to the node's CSS.
   */
  invalidateBoxData(): void {
    this._boxData = null;
    if (this._layout) {
      this._layout.invalidate();
    } else {
      postMessage(this, new Message('layout-request'));
    }
    this.updateGeometry();
  }

  /**
   * Notify the layout system that the widget geometry needs updating.
   *
   * This is typically called automatically at the proper times, so
   * user code will not normally need to interact with this method.
   *
   * If the `force` flag is false and the widget is explicitly hidden,
   * this is a no-op. The geometry will update automatically when the
   * widget is made visible.
   */
  updateGeometry(force = false): void {
    var parent = this._parent;
    if (!parent || (this.isHidden && !force)) {
      return;
    }
    if (parent._layout) {
      parent._layout.invalidate();
    } else {
      postMessage(parent, new Message('layout-request'));
      parent.updateGeometry();
    }
  }

  /**
   * Set the position of the widget.
   *
   * This is equivalent to `setRect(x, y, this.width, this.height)`.
   */
  setPos(x: number, y: number): void {
    this.setRect(x, y, this._width, this._height);
  }

  /**
   * Set the size of the widget.
   *
   * This is equivalent to `setRect(this.x, this.y, width, height)`.
   */
  setSize(width: number, height: number): void {
    this.setRect(this._x, this._y, width, height);
  }

  /**
   * Set the geometry rect of the widget.
   *
   * This clips the values to allowed size limits and updates the
   * inline style of the widget's node. If the change results in
   * a move or resize of the node, appropriate messages are sent.
   */
  setRect(x: number, y: number, width: number, height: number): void {
    var isMove = false;
    var isResize = false;
    var box = this.boxData();
    var style = this._node.style;
    var w = Math.max(box.minWidth, Math.min(width, box.maxWidth));
    var h = Math.max(box.minHeight, Math.min(height, box.maxHeight));
    if (this._x !== x) {
      this._x = x;
      style.left = x + 'px';
      isMove = true;
    }
    if (this._y !== y) {
      this._y = y;
      style.top = y + 'px';
      isMove = true;
    }
    if (this._width !== w) {
      this._width = w;
      style.width = w + 'px';
      isResize = true;
    }
    if (this._height !== h) {
      this._height = h;
      style.height = h + 'px';
      isResize = true;
    }
    if (isMove) {
      sendMessage(this, new Message('move'));
    }
    if (isResize) {
      sendMessage(this, new Message('resize'));
    }
  }

  /**
   * Process a message sent to the widget.
   *
   * This implements the IMessageHandler interface.
   *
   * Subclasses may reimplement this method as needed.
   */
  processMessage(msg: IMessage): void {
    switch (msg.type) {
    case 'move':
      this.onMove(msg);
      break;
    case 'resize':
      this.onResize(msg);
      break;
    case 'child-added':
      this.onChildAdded(<ChildMessage>msg);
      break;
    case 'child-removed':
      this.onChildRemoved(<ChildMessage>msg);
      break;
    case 'before-show':
      this.onBeforeShow(msg);
      sendNonHidden(this._children, msg);
      break;
    case 'after-show':
      this.setFlag(WidgetFlag.IsVisible);
      this.onAfterShow(msg);
      sendNonHidden(this._children, msg);
      break;
    case 'before-hide':
      this.onBeforeHide(msg);
      sendNonHidden(this._children, msg);
      break;
    case 'after-hide':
      this.clearFlag(WidgetFlag.IsVisible);
      this.onAfterHide(msg);
      sendNonHidden(this._children, msg);
      break;
    case 'before-attach':
      this._boxData = null;
      this.onBeforeAttach(msg);
      sendAll(this._children, msg);
      break;
    case 'after-attach':
      var parent = this._parent;
      var visible = !this.isHidden && (!parent || parent.isVisible);
      if (visible) this.setFlag(WidgetFlag.IsVisible);
      this.setFlag(WidgetFlag.IsAttached);
      this.onAfterAttach(msg);
      sendAll(this._children, msg);
      break;
    case 'before-detach':
      this.onBeforeDetach(msg);
      sendAll(this._children, msg);
      break;
    case 'after-detach':
      this.clearFlag(WidgetFlag.IsVisible);
      this.clearFlag(WidgetFlag.IsAttached);
      this.onAfterDetach(msg);
      sendAll(this._children, msg);
      break;
    case 'close':
      this.onClose(msg);
      break;
    }
  }

  /**
   * Compress a message posted to the widget.
   *
   * This implements the IMessageHandler interface.
   *
   * Subclasses may reimplement this method as needed.
   */
  compressMessage(msg: IMessage, posted: IIterable<IMessage>): boolean {
    if (msg.type === 'layout-request') {
      return some(posted, other => other.type === 'layout-request');
    }
    return false;
  }

  /**
   * Create the DOM node for the widget.
   *
   * This can be reimplemented by subclasses as needed.
   *
   * The default implementation creates an empty div.
   */
  protected createNode(): HTMLElement {
    return document.createElement('div');
  }

  /**
   * A method invoked when a 'close' message is received.
   *
   * The default implementation sets the widget parent to null.
   */
  protected onClose(msg: IMessage): void {
    this.parent = null;
  }

  /**
   * A method invoked when a 'child-added' message is received.
   *
   * The default implementation appends the child node to the DOM.
   */
  protected onChildAdded(msg: ChildMessage): void {
    var child = msg.child;
    if (this.isAttached) {
      sendMessage(child, new Message('before-attach'));
      this._node.appendChild(child._node);
      sendMessage(child, new Message('after-attach'));
    } else {
      this._node.appendChild(child._node);
    }
  }

  /**
   * A method invoked when a 'child-removed' message is received.
   *
   * The default implementation removes the child node from the DOM.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    var child = msg.child;
    if (this.isAttached) {
      sendMessage(child, new Message('before-detach'));
      this._node.removeChild(child._node);
      sendMessage(child, new Message('after-detach'));
    } else {
      this._node.removeChild(child._node);
    }
  }

  /**
   * A method invoked when a 'move' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onMove(msg: IMessage): void { }

  /**
   * A method invoked when a 'resize' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onResize(msg: IMessage): void { }

  /**
   * A method invoked when a 'before-show' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeShow(msg: IMessage): void { }

  /**
   * A method invoked when an 'after-show' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onAfterShow(msg: IMessage): void { }

  /**
   * A method invoked when a 'before-hide' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeHide(msg: IMessage): void { }

  /**
   * A method invoked when an 'after-hide' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onAfterHide(msg: IMessage): void { }

  /**
   * A method invoked when a 'before-attach' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeAttach(msg: IMessage): void { }

  /**
   * A method invoked when an 'after-attach' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onAfterAttach(msg: IMessage): void { }

  /**
   * A method invoked when a 'before-detach' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeDetach(msg: IMessage): void { }

  /**
   * A method invoked when an 'after-detach' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onAfterDetach(msg: IMessage): void { }

  private _node: HTMLElement;
  private _layout: Layout = null;
  private _parent: Widget = null;
  private _children = new List<Widget>();
  private _boxData: IBoxData = null;
  private _flags = 0;
  private _x = 0;
  private _y = 0;
  private _width = 0;
  private _height = 0;
}


/**
 * Send a message to all widgets in a list.
 */
function sendAll(list: List<Widget>, msg: IMessage): void {
  for (var i = 0; i < list.size; ++i) {
    sendMessage(list.get(i), msg);
  }
}


/**
 * Send a message to all non-hidden widgets in a list.
 */
function sendNonHidden(list: List<Widget>, msg: IMessage): void {
  for (var i = 0; i < list.size; ++i) {
    var widget = list.get(i);
    if (!widget.isHidden) {
      sendMessage(widget, msg);
    }
  }
}

} // module phosphor.widgets
