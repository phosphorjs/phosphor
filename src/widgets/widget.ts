/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import Queue = collections.Queue;
import algo = collections.algorithm;

import IMessage = core.IMessage;
import IMessageHandler = core.IMessageHandler;
import Message = core.Message;
import Signal = core.Signal;
import clearMessageData = core.clearMessageData;
import installMessageFilter = core.installMessageFilter;
import postMessage = core.postMessage;
import removeMessageFilter = core.removeMessageFilter;
import sendMessage = core.sendMessage;

import IBoxSizing = utility.IBoxSizing;
import IDisposable = utility.IDisposable;
import Size = utility.Size;
import createBoxSizing = utility.createBoxSizing;


/**
 * The class name added to Widget instances.
 */
var WIDGET_CLASS = 'p-Widget';

/**
 * The class name added to hidden widgets.
 */
var HIDDEN_CLASS = 'p-mod-hidden';

/**
 * A singleton 'layout-changed' message.
 */
var MSG_LAYOUT_CHANGED = new Message('layout-changed');

/**
 * A singleton 'layout-request' message.
 */
var MSG_LAYOUT_REQUEST = new Message('layout-request');

/**
 * A singleton 'parent-changed' message.
 */
var MSG_PARENT_CHANGED = new Message('parent-changed');

/**
 * A singleton 'before-show' message.
 */
var MSG_BEFORE_SHOW = new Message('before-show');

/**
 * A singleton 'after-show' message.
 */
var MSG_AFTER_SHOW = new Message('after-show');

/**
 * A singleton 'before-hide' message.
 */
var MSG_BEFORE_HIDE = new Message('before-hide');

/**
 * A singleton 'after-hide' message.
 */
var MSG_AFTER_HIDE = new Message('after-hide');

/**
 * A singleton 'before-attach' message.
 */
var MSG_BEFORE_ATTACH = new Message('before-attach');

/**
 * A singleton 'after-attach' message.
 */
var MSG_AFTER_ATTACH = new Message('after-attach');

/**
 * A singleton 'before-detach' message.
 */
var MSG_BEFORE_DETACH = new Message('before-detach');

/**
 * A singleton 'after-detach' message.
 */
var MSG_AFTER_DETACH = new Message('after-detach');

/**
 * A singleton 'close' message.
 */
var MSG_CLOSE = new Message('close');


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
    this._node.classList.add(WIDGET_CLASS);
  }

  /**
   * Dispose of the widget and its descendants.
   */
  dispose(): void {
    clearMessageData(this);
    this.setFlag(WidgetFlag.IsDisposed);
    this.disposed.emit(this, void 0);
    this.disposed.disconnect();

    var layout = this._layout;
    if (layout) {
      this._layout = null;
      layout.dispose();
    }

    var parent = this._parent;
    if (parent) {
      this._parent = null;
      algo.remove(parent._children, this);
      sendMessage(parent, new ChildMessage('child-removed', this));
    } else if (this.isAttached) {
      this.detach();
    }

    var children = this._children;
    for (var i = 0; i < children.length; ++i) {
      var child = children[i];
      children[i] = null;
      child._parent = null;
      child.dispose();
    }
    children.length = 0;

    this._node = null;
  }

  /**
   * Get the DOM node managed by the widget.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Get the X position set for the widget.
   */
  get x(): number {
    return this._x;
  }

  /**
   * Set the X position for the widget.
   *
   * This is equivalent to `move(x, this.y)`.
   */
  set x(x: number) {
    this.move(x, this._y);
  }

  /**
   * Get the Y position set for the widget.
   */
  get y(): number {
    return this._y;
  }

  /**
   * Set the Y position for the widget.
   *
   * This is equivalent to `move(this.x, y)`.
   */
  set y(y: number) {
    this.move(this._x, y);
  }

  /**
   * Get the width set for the widget.
   */
  get width(): number {
    return this._width;
  }

  /**
   * Set the width for the widget.
   *
   * This is equivalent to `resize(width, this.height)`.
   */
  set width(width: number) {
    this.resize(width, this._height);
  }

  /**
   * Get the height set for the widget.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Set the height for the widget.
   *
   * This is equivalent to `resize(this.width, height)`.
   */
  set height(height: number) {
    this.resize(this._width, height);
  }

  /**
   * Get the horizontal size policy for the widget.
   */
  get horizontalSizePolicy(): SizePolicy {
    return this._sizePolicy >> 16;
  }

  /**
   * Set the horizontal size policy for the widget.
   *
   * This is equivalent to `setSizePolicy(policy, this.verticalSizePolicy)`.
   */
  set horizontalSizePolicy(policy: SizePolicy) {
    this.setSizePolicy(policy, this.verticalSizePolicy);
  }

  /**
   * Get the vertical size policy for the widget.
   */
  get verticalSizePolicy(): SizePolicy {
    return this._sizePolicy & 0xFFFF;
  }

  /**
   * Set the vertical size policy for the widget.
   *
   * This is equivalent to `setSizePolicy(this.horizontalPolicy, policy)`.
   */
  set verticalSizePolicy(policy: SizePolicy) {
    this.setSizePolicy(this.horizontalSizePolicy, policy);
  }

  /**
   * Get the CSS box sizing for the widget.
   *
   * This method computes the data once, then caches it. The cached
   * data can be cleared by calling the `invalidateBoxSizing` method.
   */
  get boxSizing(): IBoxSizing {
    if (!this._boxSizing) {
      this._boxSizing = createBoxSizing(this._node);
    }
    return this._boxSizing;
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
   * Get the layout manager attached to the widget.
   *
   * Returns null if the widget has no layout manager.
   */
  get layout(): Layout {
    return this._layout;
  }

  /**
   * Set the layout manager for the widget.
   *
   * A layout is single-use only. The current layout can be set to null
   * or to a new layout instance, but not to a layout which is already
   * installed on another widget.
   *
   * The current layout will be disposed and cannot be reused.
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
    sendMessage(this, MSG_LAYOUT_CHANGED);
  }

  /**
   * Get the parent of the widget.
   *
   * Returns null if the widget has no parent.
   */
  get parent(): Widget {
    return this._parent;
  }

  /**
   * Set the parent of the widget.
   *
   * Setting the parent to null will detach the widget from the DOM
   * and automatically remove it from the relevant layout manager.
   */
  set parent(parent: Widget) {
    parent = parent || null;
    var oldParent = this._parent;
    if (oldParent === parent) {
      return;
    }
    if (oldParent) {
      this._parent = null;
      algo.remove(oldParent._children, this);
      sendMessage(oldParent, new ChildMessage('child-removed', this));
    }
    if (parent) {
      this._parent = parent;
      parent._children.push(this);
      sendMessage(parent, new ChildMessage('child-added', this));
    }
    sendMessage(this, MSG_PARENT_CHANGED);
  }

  /**
   * Get the number of children in the widget.
   */
  get childCount(): number {
    return this._children.length;
  }

  /**
   * Get the child widget at the given index.
   *
   * Returns `undefined` if the index is out of range.
   */
  childAt(index: number): Widget {
    return this._children[index];
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
      beforeShowHelper(this);
      this._node.classList.remove(HIDDEN_CLASS);
      this.clearFlag(WidgetFlag.IsHidden);
      afterShowHelper(this);
    } else {
      this._node.classList.remove(HIDDEN_CLASS);
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
      beforeHideHelper(this);
      this._node.classList.add(HIDDEN_CLASS);
      this.setFlag(WidgetFlag.IsHidden);
      afterHideHelper(this);
    } else {
      this._node.classList.add(HIDDEN_CLASS);
      this.setFlag(WidgetFlag.IsHidden);
    }
    if (parent) {
      sendMessage(parent, new ChildMessage('child-hidden', this));
    }
    this.updateGeometry(true);
  }

  /**
   * Show or hide the widget according to the given flag.
   */
  setVisible(visible: boolean): void {
    if (visible) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Close the widget by sending it a 'close' message.
   *
   * Subclasses should reimplement `onClose` to perform custom actions.
   */
  close(): void {
    sendMessage(this, MSG_CLOSE);
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
    beforeAttachHelper(this);
    host.appendChild(this._node);
    afterAttachHelper(this);
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
    beforeDetachHelper(this);
    host.removeChild(this._node);
    afterDetachHelper(this);
  }

  /**
   * Resize the widget so that it fills its host node.
   *
   * Only a root widget can be fit to its host.
   *
   * If the size of the host node is known, it can be provided. This
   * will prevent a DOM geometry read and avoid a potential reflow.
   */
  fit(width?: number, height?: number, box?: IBoxSizing): void {
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
      box = createBoxSizing(host);
    }
    var x = box.paddingLeft;
    var y = box.paddingTop;
    var w = width - box.horizontalSum;
    var h = height - box.verticalSum;
    this.setGeometry(x, y, w, h);
  }

  /**
   * Calculate the preferred size for the widget.
   *
   * This is used by Phosphor's layout machinery to compute the natural
   * space required for the widget and its children. A subclass which
   * provides leaf content should reimplement this method.
   *
   * The default implementation of this method delegates to the layout
   * manager if installed, otherwise it returns a zero size.
   */
  sizeHint(): Size {
    if (this._layout) {
      return this._layout.sizeHint();
    }
    return Size.Zero;
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
   * Invalidate the cached CSS box sizing for the widget.
   *
   * User code should invoke this method when it makes a change to the
   * node's style which changes its border, padding, or size limits.
   */
  invalidateBoxSizing(): void {
    this._boxSizing = null;
    if (this._layout) {
      this._layout.invalidate();
    } else {
      postMessage(this, MSG_LAYOUT_REQUEST);
    }
    this.updateGeometry();
  }

  /**
   * Notify the layout system that the widget's geometry is dirty.
   *
   * This is typically called automatically at the proper times, but
   * a custom leaf widget should call this method when its size hint
   * changes so that the ancestor layout will refresh.
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
      postMessage(parent, MSG_LAYOUT_REQUEST);
      parent.updateGeometry();
    }
  }

  /**
   * Move the widget to the specified X-Y coordinate.
   */
  move(x: number, y: number): void {
    this.setGeometry(x, y, this._width, this._height);
  }

  /**
   * Resize the widget to the specified width and height.
   */
  resize(width: number, height: number): void {
    this.setGeometry(this._x, this._y, width, height);
  }

  /**
   * Set the position and size of the widget.
   *
   * The size is clipped to the limits specified by the node's style.
   *
   * This method will send 'move' and 'resize' messages to the widget if
   * the new geometry changes the position or size of the widget's node.
   */
  setGeometry(x: number, y: number, width: number, height: number): void {
    var isMove = false;
    var isResize = false;
    var oldX = this._x;
    var oldY = this._y;
    var oldW = this._width;
    var oldH = this._height;
    var box = this.boxSizing;
    var style = this._node.style;
    var w = Math.max(box.minWidth, Math.min(width, box.maxWidth));
    var h = Math.max(box.minHeight, Math.min(height, box.maxHeight));
    if (oldX !== x) {
      this._x = x;
      style.left = x + 'px';
      isMove = true;
    }
    if (oldY !== y) {
      this._y = y;
      style.top = y + 'px';
      isMove = true;
    }
    if (oldW !== w) {
      this._width = w;
      style.width = w + 'px';
      isResize = true;
    }
    if (oldH !== h) {
      this._height = h;
      style.height = h + 'px';
      isResize = true;
    }
    if (isMove) {
      sendMessage(this, new MoveMessage(oldX, oldY, x, y));
    }
    if (isResize) {
      sendMessage(this, new ResizeMessage(oldW, oldH, w, h));
    }
  }

  /**
   * Set the size policy for the widget.
   */
  setSizePolicy(horizontal: SizePolicy, vertical: SizePolicy): void {
    var policy = (horizontal << 16) | vertical;
    if (policy !== this._sizePolicy) {
      this._sizePolicy = policy;
      this.updateGeometry();
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
      this.onMove(<MoveMessage>msg);
      break;
    case 'resize':
      this.onResize(<ResizeMessage>msg);
      break;
    case 'child-added':
      this.onChildAdded(<ChildMessage>msg);
      break;
    case 'child-removed':
      this.onChildRemoved(<ChildMessage>msg);
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
      this._boxSizing = null;
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
  compressMessage(msg: IMessage, pending: Queue<IMessage>): boolean {
    if (msg.type === 'layout-request') {
      return pending.some(other => other.type === 'layout-request');
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
   * The default implementation sets the parent to null.
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
      beforeAttachHelper(child);
      this._node.appendChild(child._node);
      afterAttachHelper(child);
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
      beforeDetachHelper(child);
      this._node.removeChild(child._node);
      afterDetachHelper(child);
    } else {
      this._node.removeChild(child._node);
    }
  }

  /**
   * A method invoked when a 'move' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onMove(msg: MoveMessage): void { }

  /**
   * A method invoked when a 'resize' message is received.
   *
   * The default implementation is a no-op.
   */
  protected onResize(msg: ResizeMessage): void { }

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
  private _children: Widget[] = [];
  private _sizePolicy = defaultSizePolicy;
  private _boxSizing: IBoxSizing = null;
  private _x = 0;
  private _y = 0;
  private _width = 0;
  private _height = 0;
  private _flags = 0;
}


/**
 * The default widget size policy.
 */
var defaultSizePolicy = (SizePolicy.Preferred << 16) | SizePolicy.Preferred;


/**
 * A recursive 'before-show' helper function.
 */
function beforeShowHelper(widget: Widget): void {
  sendMessage(widget, MSG_BEFORE_SHOW);
  for (var i = 0; i < widget.childCount; ++i) {
    var child = widget.childAt(i);
    if (!child.isHidden) beforeShowHelper(child);
  }
}


/**
 * A recursive 'after-show' helper function.
 */
function afterShowHelper(widget: Widget): void {
  widget.setFlag(WidgetFlag.IsVisible);
  sendMessage(widget, MSG_AFTER_SHOW);
  for (var i = 0; i < widget.childCount; ++i) {
    var child = widget.childAt(i);
    if (!child.isHidden) afterShowHelper(child);
  }
}


/**
 * A recursive 'before-hide' helper function.
 */
function beforeHideHelper(widget: Widget): void {
  sendMessage(widget, MSG_BEFORE_HIDE);
  for (var i = 0; i < widget.childCount; ++i) {
    var child = widget.childAt(i);
    if (!child.isHidden) beforeHideHelper(child);
  }
}


/**
 * A recursive 'after-hide' helper function.
 */
function afterHideHelper(widget: Widget): void {
  widget.clearFlag(WidgetFlag.IsVisible);
  sendMessage(widget, MSG_AFTER_HIDE);
  for (var i = 0; i < widget.childCount; ++i) {
    var child = widget.childAt(i);
    if (!child.isHidden) afterHideHelper(child);
  }
}


/**
 * A recursive 'before-attach' helper function.
 */
function beforeAttachHelper(widget: Widget): void {
  sendMessage(widget, MSG_BEFORE_ATTACH);
  for (var i = 0; i < widget.childCount; ++i) {
    beforeAttachHelper(widget.childAt(i));
  }
}


/**
 * A recursive 'after-attach' helper function.
 */
function afterAttachHelper(widget: Widget): void {
  var parent = widget.parent;
  if (!widget.isHidden && (!parent || parent.isVisible)) {
    widget.setFlag(WidgetFlag.IsVisible);
  }
  widget.setFlag(WidgetFlag.IsAttached);
  sendMessage(widget, MSG_AFTER_ATTACH);
  for (var i = 0; i < widget.childCount; ++i) {
    afterAttachHelper(widget.childAt(i));
  }
}


/**
 * A recursive 'before-detach' helper function.
 */
function beforeDetachHelper(widget: Widget): void {
  sendMessage(widget, MSG_BEFORE_DETACH);
  for (var i = 0; i < widget.childCount; ++i) {
    beforeDetachHelper(widget.childAt(i));
  }
}


/**
 * A recursive 'after-detach' helper function.
 */
function afterDetachHelper(widget: Widget): void {
  widget.clearFlag(WidgetFlag.IsVisible);
  widget.clearFlag(WidgetFlag.IsAttached);
  sendMessage(widget, MSG_AFTER_DETACH);
  for (var i = 0; i < widget.childCount; ++i) {
    afterDetachHelper(widget.childAt(i));
  }
}

} // module phosphor.widgets
