/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import some = collections.some;
import IIterable = collections.IIterable;
import IList = collections.IList;
import List = collections.List;
import ReadOnlyList = collections.ReadOnlyList;

import IDisposable = core.IDisposable;
import IMessage = core.IMessage;
import IMessageHandler = core.IMessageHandler;
import Message = core.Message;
import Signal = core.Signal;
import dispatch = core.dispatch;

import IBoxData = dom.IBoxData;
import createBoxData = dom.createBoxData;


/**
 * The class name added to Panel instances.
 */
var PANEL_CLASS = 'p-Panel';

/**
 * The class name added to hidden widgets.
 */
var HIDDEN_CLASS = 'p-mod-hidden';


/**
 * The base class of the Phosphor panel hierarchy.
 *
 * A panel wraps an absolutely positioned DOM node. It can be used with
 * a Phosphor layout manager to layout its child panels, or it can also
 * be used to host any other leaf DOM content.
 */
export
class Panel implements IMessageHandler, IDisposable {
  /**
   * A signal emitted when the panel is disposed.
   */
  disposed = new Signal<Panel, void>();

  /**
   * Construct a new panel.
   */
  constructor() {
    this._node = this.createNode();
    this._node.classList.add(PANEL_CLASS);
  }

  /**
   * Dispose of the panel and its descendants.
   */
  dispose(): void {
    dispatch.clearMessageData(this);
    this.setFlag(PanelFlag.IsDisposed);
    this.disposed.emit(this, void 0);
    this.disposed.disconnect();

    var parent = this._parent;
    if (parent) {
      this._parent = null;
      parent._children.remove(this);
      dispatch.sendMessage(parent, new ChildMessage('child-removed', this));
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
   * Get the DOM node managed by the panel.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Get the X position of the panel.
   */
  get x(): number {
    return this._x;
  }

  /**
   * Get the Y position of the panel.
   */
  get y(): number {
    return this._y;
  }

  /**
   * Get the width of the panel.
   */
  get width(): number {
    return this._width;
  }

  /**
   * Get the height of the panel.
   */
  get height(): number {
    return this._height;
  }

  /**
   * Get the position of the panel.
   */
  get pos(): Point {
    return new Point(this._x, this._y);
  }

  /**
   * Get the size of the panel.
   */
  get size(): Size {
    return new Size(this._width, this._height);
  }

  /**
   * Get the geometry of the panel.
   */
  get geometry(): Rect {
    return new Rect(this._x, this._y, this._width, this._height);
  }

  /**
   * Get the minimum width of the panel.
   */
  get minWidth(): number {
    return this._minWidth;
  }

  /**
   * Get the minimum height of the panel.
   */
  get minHeight(): number {
    return this._minHeight;
  }

  /**
   * Get the maximum width of the panel.
   */
  get maxWidth(): number {
    return this._maxWidth;
  }

  /**
   * Get the maximum height of the panel.
   */
  get maxHeight(): number {
    return this._maxHeight;
  }

  /**
   * Get the minimum size of the panel.
   */
  get minSize(): Size {
    return new Size(this._minWidth, this._minHeight);
  }

  /**
   * Get the maximum size of the panel.
   */
  get maxSize(): Size {
    return new Size(this._maxWidth, this._maxHeight);
  }

  /**
   * Get the horizontal size policy for the panel.
   */
  get horizontalSizePolicy(): SizePolicy {
    return this._sizePolicy >> 4;
  }

  /**
   * Get the vertical size policy for the panel.
   */
  get verticalSizePolicy(): SizePolicy {
    return this._sizePolicy & 0xF;
  }

  /**
   * Get the box data for the panel's node.
   */
  get boxData(): IBoxData {
    return this._boxData || (this._boxData = createBoxData(this._node));
  }

  /**
   * Test whether the panel's node is attached to the DOM.
   */
  get isAttached(): boolean {
    return this.testFlag(PanelFlag.IsAttached);
  }

  /**
   * Test whether the panel has been disposed.
   */
  get isDisposed(): boolean {
    return this.testFlag(PanelFlag.IsDisposed);
  }

  /**
   * Test whether the panel is explicitly hidden.
   */
  get isHidden(): boolean {
    return this.testFlag(PanelFlag.IsHidden);
  }

  /**
   * Test whether the panel is visible.
   *
   * A panel is visible under the following conditions:
   *   - it is attached to the DOM
   *   - it is not explicitly hidden
   *   - it has no explicitly hidden ancestors
   */
  get isVisible(): boolean {
    return this.testFlag(PanelFlag.IsVisible);
  }

  /**
   * Get the parent panel of the panel.
   */
  get parent(): Panel {
    return this._parent;
  }

  /**
   * Set the parent panel of the panel.
   */
  set parent(parent: Panel) {
    parent = parent || null;
    var old = this._parent;
    if (old === parent) {
      return;
    }
    if (old) {
      this._parent = null;
      old._children.remove(this);
      dispatch.sendMessage(old, new ChildMessage('child-removed', this));
    }
    if (parent) {
      this._parent = parent;
      parent._children.add(this);
      dispatch.sendMessage(parent, new ChildMessage('child-added', this));
    }
    dispatch.sendMessage(this, new Message('parent-changed'));
  }

  /**
   * Get a read only list of the child panels.
   */
  get children(): IList<Panel> {
    return new ReadOnlyList(this._children);
  }

  /**
   * Get the layout attached to the panel.
   */
  get layout(): Layout {
    return this._layout;
  }

  /**
   * Set the layout for the panel.
   *
   * The given layout must be a new layout not assigned to any other
   * panel or an exception will be thrown. A null layout is allowed.
   *
   * The current layout will be disposed and cannot be reused.
   */
  set layout(layout: Layout) {
    layout = layout || null;
    var old = this._layout;
    if (old === layout) {
      return;
    }
    if (this.testFlag(PanelFlag.DisallowLayoutChange)) {
      throw new Error('cannot change panel layout');
    }
    if (layout && layout.parent) {
      throw new Error('layout already installed on a panel');
    }
    if (old) {
      this._layout = null;
      dispatch.removeMessageFilter(this, old);
      old.dispose();
    }
    if (layout) {
      this._layout = layout;
      dispatch.installMessageFilter(this, layout);
      layout.parent = this;
    }
    dispatch.sendMessage(this, new Message('layout-changed'));
  }

  /**
   * Test whether the given panel flag is set.
   */
  testFlag(flag: PanelFlag): boolean {
    return (this._flags & flag) !== 0;
  }

  /**
   * Set the given panel flag.
   */
  setFlag(flag: PanelFlag): void {
    this._flags |= flag;
  }

  /**
   * Clear the given panel flag.
   */
  clearFlag(flag: PanelFlag): void {
    this._flags &= ~flag;
  }

  /**
   * Make the panel visible to its parent.
   *
   * If the panel is not explicitly hidden, this is a no-op.
   */
  show(): void {
    if (!this.isHidden) {
      return;
    }
    var parent = this._parent;
    if (this.isAttached && (!parent || parent.isVisible)) {
      dispatch.sendMessage(this, new Message('before-show'));
      this._node.classList.remove(HIDDEN_CLASS);
      this.clearFlag(PanelFlag.IsHidden);
      dispatch.sendMessage(this, new Message('after-show'));
    } else {
      this._node.classList.remove(HIDDEN_CLASS);
      this.clearFlag(PanelFlag.IsHidden);
    }
    if (parent) {
      dispatch.sendMessage(parent, new ChildMessage('child-shown', this));
    }
    this.updateGeometry();
  }

  /**
   * Make the panel invisible to its parent.
   *
   * If the panel is already hidden, this is a no-op.
   */
  hide(): void {
    if (this.isHidden) {
      return;
    }
    var parent = this._parent;
    if (this.isAttached && (!parent || parent.isVisible)) {
      dispatch.sendMessage(this, new Message('before-hide'));
      this._node.classList.add(HIDDEN_CLASS);
      this.setFlag(PanelFlag.IsHidden);
      dispatch.sendMessage(this, new Message('after-hide'));
    } else {
      this._node.classList.add(HIDDEN_CLASS);
      this.setFlag(PanelFlag.IsHidden);
    }
    if (parent) {
      dispatch.sendMessage(parent, new ChildMessage('child-hidden', this));
    }
    this.updateGeometry(true);
  }

  /**
   * Close the panel by sending it a 'close' message.
   *
   * Subclasses may reimplement the `onClose` method to perform custom
   * actions before removing the panel from the hierarchy. The default
   * close message handler will unparent the panel.
   */
  close(): void {
    dispatch.sendMessage(this, new Message('close'));
  }

  /**
   * Attach the panel's node to a host DOM element.
   *
   * The `fit` method can be called to resize the panel to fill its
   * host node. It should be called whenever the size of host node
   * is known to have changed.
   *
   * Only a root panel can be attached to a host node.
   */
  attach(host: HTMLElement): void {
    if (this._parent) {
      throw new Error('can only attach a root panel to the DOM');
    }
    dispatch.sendMessage(this, new Message('before-attach'));
    host.appendChild(this._node);
    dispatch.sendMessage(this, new Message('after-attach'));
  }

  /**
   * Detach the panel's node from the DOM.
   *
   * Only a root panel can be detached from its host node.
   */
  detach(): void {
    if (this._parent) {
      throw new Error('can only detach a root widget from the DOM');
    }
    var node = this._node;
    var host = node.parentNode;
    if (!host) {
      return;
    }
    dispatch.sendMessage(this, new Message('before-detach'));
    host.removeChild(node);
    dispatch.sendMessage(this, new Message('after-detach'));
  }

  /**
   * Resize the panel so that its fills its host node.
   *
   * Only a root panel can be fit to its host.
   *
   * If the size of the host node is known, it can be provided. This
   * will prevent a read from the DOM and avoid a potential reflow.
   */
  fit(width?: number, height?: number, box?: IBoxData): void {
    if (this._parent) {
      throw new Error('can only fit a root widget');
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
    this.setGeometry(x, y, w, h);
  }

  /**
   * Calculate the preferred size for the panel.
   *
   * The default implementation returns the layout size hint if
   * a layout is installed, otherwise it returns a zero size.
   */
  sizeHint(): Size {
    if (this._layout) {
      return this._layout.sizeHint();
    }
    return new Size(0, 0);
  }

  /**
   * Calculate the preferred minimum size for the panel.
   *
   * The default implementation returns the layout min size if
   * a layout is installed, otherwise it returns a zero size.
   */
  minSizeHint(): Size {
    if (this._layout) {
      return this._layout.minSize();
    }
    return new Size(0, 0);
  }

  /**
   * Calculate the preferred maximum size for the panel.
   *
   * The default implementation returns the layout max size if
   * a layout is installed, otherwise it returns an inf size.
   */
  maxSizeHint(): Size {
    if (this._layout) {
      return this._layout.maxSize();
    }
    return new Size(Infinity, Infinity);
  }

  /**
   * Notify the layout system that the panel geometry needs updating.
   *
   * This should be called if the panel's size hint(s) have changed.
   *
   * If the `force` flag is false and the panel is explicitly hidden,
   * this is a no-op. The geometry will update automatically when the
   * panel is made visible.
   */
  updateGeometry(force = false): void {
    var parent = this._parent;
    if (!parent || (this.isHidden && !force)) {
      return;
    }
    if (parent._layout) {
      parent._layout.invalidate();
    } else {
      dispatch.postMessage(parent, new Message('layout-request'));
      parent.updateGeometry();
    }
  }

  /**
   * Notify the layout system that the panel box data needs updating.
   *
   * This should be called if the node's padding or border has changed.
   */
  updateBoxData(): void {
    this._boxData = null;
    if (this._layout) {
      this._layout.invalidate();
    } else {
      dispatch.postMessage(this, new Message('layout-request'));
    }
    this.updateGeometry();
  }

  /**
   * Move the panel to the given X-Y position.
   */
  move(x: number, y: number): void {
    this.setGeometry(x, y, this._width, this._height);
  }

  /**
   * Resize the panel to the given width and height.
   */
  resize(width: number, height: number): void {
    this.setGeometry(this._x, this._y, width, height);
  }

  /**
   * Set the geometry of the panel.
   */
  setGeometry(x: number, y: number, width: number, height: number): void {
    width = Math.max(this._minWidth, Math.min(width, this._maxWidth));
    height = Math.max(this._minHeight, Math.min(height, this._maxHeight));
    var isMove = false;
    var isResize = false;
    var oldX = this._x;
    var oldY = this._y;
    var oldWidth = this._width;
    var oldHeight = this._height;
    var style = this._node.style;
    if (oldX !== x) {
      this._x = x;
      isMove = true;
      style.left = x + 'px';
    }
    if (oldY !== y) {
      this._y = y;
      isMove = true;
      style.top = y + 'px';
    }
    if (oldWidth !== width) {
      this._width = width;
      isResize = true;
      style.width = width + 'px';
    }
    if (oldHeight !== height) {
      this._height = height;
      isResize = true;
      style.height = height + 'px';
    }
    if (isMove) {
      var move = new MoveMessage(oldX, oldY, x, y);
      dispatch.sendMessage(this, move);
    }
    if (isResize) {
      var resize = new ResizeMessage(oldWidth, oldHeight, width, height);
      dispatch.sendMessage(this, resize);
    }
  }

  /**
   * Set the minimum size of the panel.
   */
  setMinSize(width: number, height: number): void {
    this.setSizeLimits(width, height, this._maxWidth, this._maxHeight);
  }

  /**
   * Set the maximum size of the panel.
   */
  setMaxSize(width: number, height: number): void {
    this.setSizeLimits(this._minWidth, this._minHeight, width, height);
  }

  /**
   * Set the size limits of the panel.
   */
  setSizeLimits(minW: number, minH: number, maxW: number, maxH: number): void {
    minW = Math.max(0, minW);
    minH = Math.max(0, minH);
    maxW = Math.max(minW, maxW);
    maxH = Math.max(minH, maxH);
    var changed = false;
    if (minW !== this._minWidth) {
      this._minWidth = minW;
      changed = true;
    }
    if (minH !== this._minHeight) {
      this._minHeight = minH;
      changed = true;
    }
    if (maxW !== this._maxWidth) {
      this._maxWidth = maxW;
      changed = true;
    }
    if (maxH !== this._maxHeight) {
      this._maxHeight = maxH;
      changed = true;
    }
    if (changed) {
      this.resize(this._width, this._height);
      this.updateGeometry();
    }
  }

  /**
   * Set the size policy values for the panel.
   */
  setSizePolicy(horizontal: SizePolicy, vertical: SizePolicy): void {
    var policy = (horizontal << 4) | vertical;
    var changed = policy !== this._sizePolicy;
    this._sizePolicy = policy;
    if (changed) this.updateGeometry();
  }

  /**
   * Process a message dispatched to the handler.
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
        sendNonHidden(this._children, msg);
        break;
      case 'after-show':
        this.setFlag(PanelFlag.IsVisible);
        this.onAfterShow(msg);
        sendNonHidden(this._children, msg);
        break;
      case 'before-hide':
        this.onBeforeHide(msg);
        sendNonHidden(this._children, msg);
        break;
      case 'after-hide':
        this.clearFlag(PanelFlag.IsVisible);
        this.onAfterHide(msg);
        sendNonHidden(this._children, msg);
        break;
      case 'before-attach':
        this._boxData = null;
        this.onBeforeAttach(msg);
        sendAll(this._children, msg);
        break;
      case 'after-attach':
        var parent = this._parent
        var visible = !this.isHidden && (!parent || parent.isVisible);
        if (visible) this.setFlag(PanelFlag.IsVisible);
        this.setFlag(PanelFlag.IsAttached);
        this.onAfterAttach(msg);
        sendAll(this._children, msg);
        break;
      case 'before-detach':
        this.onBeforeDetach(msg);
        sendAll(this._children, msg);
        break;
      case 'after-detach':
        this.clearFlag(PanelFlag.IsVisible);
        this.clearFlag(PanelFlag.IsAttached);
        this.onAfterDetach(msg);
        sendAll(this._children, msg);
        break;
      case 'close':
        this.onClose(msg);
        break;
      default:
        break;
    }
  }

  /**
   * Compress a message posted to the handler.
   *
   * By default 'layout-request' messages are compressed.
   */
  compressEvent(msg: IMessage, posted: IIterable<IMessage>): boolean {
    if (msg.type === 'layout-request') {
      return some(posted, p => p.type === msg.type);
    }
    return false;
  }

  /**
   * Create the DOM node which represents the panel.
   *
   * The default implementation creates an empty div.
   */
  protected createNode(): HTMLElement {
    return document.createElement('div');
  }

  /**
   * A method invoked on a 'child-added' message.
   *
   * The default implementation attaches the child node.
   */
  protected onChildAdded(msg: ChildMessage): void {
    var child = msg.child;
    if (this.isAttached) {
      dispatch.sendMessage(child, new Message('before-attach'));
      this._node.appendChild(child._node);
      dispatch.sendMessage(child, new Message('after-attach'));
    } else {
      this._node.appendChild(child._node);
    }
  }

  /**
   * A method invoked on a 'child-removed' message.
   *
   * The default implementation detaches the child node.
   */
  protected onChildRemoved(msg: ChildMessage): void {
    var child = msg.child;
    if (this.isAttached) {
      dispatch.sendMessage(child, new Message('before-detach'));
      this._node.removeChild(child._node);
      dispatch.sendMessage(child, new Message('after-detach'));
    } else {
      this._node.removeChild(child._node);
    }
  }

  /**
   * A method invoked on a 'close' message.
   *
   * The default implementation sets the parent to null.
   */
  protected onClose(msg: IMessage): void {
    this.parent = null;
  }

  /**
   * A method invoked on a 'move' message.
   *
   * The default implementation is a no-op.
   */
  protected onMove(msg: MoveMessage): void { }

  /**
   * A method invoked on a 'resize' message.
   *
   * The default implementation is a no-op.
   */
  protected onResize(msg: ResizeMessage): void { }

  /**
   * A method invoked on a 'before-show' message.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeShow(msg: IMessage): void { }

  /**
   * A method invoked on an 'after-show' message.
   *
   * The default implementation is a no-op.
   */
  protected onAfterShow(msg: IMessage): void { }

  /**
   * A method invoked on a 'before-hide' message.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeHide(msg: IMessage): void { }

  /**
   * A method invoked on an 'after-hide' message.
   *
   * The default implementation is a no-op.
   */
  protected onAfterHide(msg: IMessage): void { }

  /**
   * A method invoked on a 'before-attach' message.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeAttach(msg: IMessage): void { }

  /**
   * A method invoked on an 'after-attach' message.
   *
   * The default implementation is a no-op.
   */
  protected onAfterAttach(msg: IMessage): void { }

  /**
   * A method invoked on a 'before-detach' message.
   *
   * The default implementation is a no-op.
   */
  protected onBeforeDetach(msg: IMessage): void { }

  /**
   * A method invoked on an 'after-detach' message.
   *
   * The default implementation is a no-op.
   */
  protected onAfterDetach(msg: IMessage): void { }

  private _flags = 0;
  private _node: HTMLElement;
  private _parent: Panel = null;
  private _layout: Layout = null;
  private _children = new List<Panel>();
  private _x = 0;
  private _y = 0;
  private _width = 0;
  private _height = 0;
  private _minWidth = 0;
  private _minHeight = 0;
  private _maxWidth = Infinity;
  private _maxHeight = Infinity;
  private _boxData: IBoxData = null;
  private _sizePolicy = 51; // Preferred, Preferred
}


/**
 * Send a message to all panels in a list.
 */
function sendAll(list: IList<Panel>, msg: IMessage): void {
  for (var i = 0; i < list.size; ++i) {
    dispatch.sendMessage(list.get(i), msg);
  }
}


/**
 * Send a message to all non-hidden panels in a list.
 */
function sendNonHidden(list: IList<Panel>, msg: IMessage): void {
  for (var i = 0; i < list.size; ++i) {
    var panel = list.get(i);
    if (!panel.isHidden) {
      dispatch.sendMessage(panel, msg);
    }
  }
}

} // module phosphor.panels
