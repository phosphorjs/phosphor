/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import any = collections.any;
import forEach = collections.forEach;
import IIterable = collections.IIterable;
import IList = collections.IList;
import List = collections.List;
import ReadOnlyList = collections.ReadOnlyList;

import CoreEvent = core.CoreEvent;
import ICoreEvent = core.ICoreEvent;
import IEventHandler = core.IEventHandler;
import Signal = core.Signal;

import IBoxData = dom.IBoxData;
import createBoxData = dom.createBoxData;

import SizePolicy = enums.SizePolicy;
import WidgetFlag = enums.WidgetFlag;

import ChildEvent = events.ChildEvent;
import MoveEvent = events.MoveEvent;
import ResizeEvent = events.ResizeEvent;

import Point = geometry.Point;
import Rect = geometry.Rect;
import Size = geometry.Size;

import Layout = layout.Layout;


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
 */
export
class Widget implements IEventHandler {
  /**
   * A signal emitted when the widget is disposed.
   */
  disposed = new Signal<Widget, void>();

  /**
   * Construct a new widget.
   */
  constructor() {
    this._m_node = this.createNode();
    this.classList.add(WIDGET_CLASS);
  }

  /**
   * Dispose of the widget and its descendants.
   *
   * The widget should be discarded after calling this method.
   */
  dispose(): void {
    // Set the disposed flag before taking any action. This allows
    // user code triggered by the `disposed` signal to test whether
    // the widget is disposed.
    this.setFlag(WidgetFlag.IsDisposed);

    // Clear event data before potentially invoking user code.
    core.clearEventData(this);

    // Allow user code to a chance to cleanup resources or take action
    // in response to the widget being disposed.
    this.disposed.emit(this, void 0);
    this.disposed.disconnect();

    // Remove the widget from its parent or detach it from the DOM.
    // The parent references on the children are cleared before they
    // are disposed, so the expensive path is only taken for the
    // widget at the root of the disposal tree.
    var parent = this._m_parent;
    if (parent) {
      this._m_parent = null;
      this._m_parent._m_children.remove(this);
      core.sendEvent(parent, new ChildEvent('child-removed', this));
    } else if (this.isAttached) {
      this.detach();
    }

    // Drop what should be the last reference to the DOM node.
    this._m_node = null;

    // Dispose of the layout.
    var layout = this._m_layout;
    if (layout) {
      this._m_layout = null;
      layout.dispose();
    }

    // Dispose of the children. A child's parent reference is first
    // cleared so that it does not try to recursively remove itself.
    var children = this._m_children;
    for (var i = 0, n = children.size; i < n; ++i) {
      var child = children.get(i);
      children.set(i, null);
      child._m_parent = null;
      child.dispose();
    }
    children.clear();
  }

  /**
   * Get the parent widget of the widget.
   */
  get parent(): Widget {
    return this._m_parent;
  }

  /**
   * Set the parent widget of the widget.
   */
  set parent(parent: Widget) {
    parent = parent || null;
    var old = this._m_parent;
    if (old === parent) {
      return;
    }
    if (old) {
      this._m_parent = null;
      old._m_children.remove(this);
      core.sendEvent(old, new ChildEvent('child-removed', this));
    }
    if (parent) {
      this._m_parent = parent;
      parent._m_children.add(this);
      core.sendEvent(parent, new ChildEvent('child-added', this));
    }
    core.sendEvent(this, EVT_PARENT_CHANGED);
  }

  /**
   * Get a read only list of the child widgets.
   */
  get children(): IList<Widget> {
    return new ReadOnlyList(this._m_children);
  }

  /**
   * Get the layout associated with the widget.
   */
  get layout(): Layout {
    return this._m_layout;
  }

  /**
   * Set the layout associated with the widget.
   *
   * The given layout must be a new layout not assigned to any other
   * widget or an exception will be raised. A null layout is allowed.
   *
   * The current layout will be disposed and cannot be reused.
   */
  set layout(layout: Layout) {
    layout = layout || null;
    var old = this._m_layout;
    if (old === layout) {
      return;
    }
    if (this.testFlag(WidgetFlag.DisallowLayoutChange)) {
      throw new Error('cannot change widget layout');
    }
    if (layout && layout.parentWidget) {
      throw new Error('layout already installed on a widget');
    }
    if (old) {
      this._m_layout = null;
      core.removeEventFilter(this, old);
      old.dispose();
    }
    if (layout) {
      this._m_layout = layout;
      core.installEventFilter(this, layout);
      layout.parentWidget = this;
    }
    core.sendEvent(this, EVT_LAYOUT_CHANGED);
  }

  /**
   * Get the name of the widget.
   *
   * The widget name can be used to identify the widget in various
   * contexts. It does not have a visual representation and is not
   * stored in the DOM node.
   *
   * The default name is an empty string.
   */
  get name(): string {
    return this._m_extra.name;
  }

  /**
   * Set the name of the widget.
   *
   * The widget name can be used to identify the widget in various
   * contexts. It does not have a visual representation and is not
   * stored in the DOM node.
   *
   * This should typically by set to a unique value.
   */
  set name(name: string) {
    if (name === this._m_extra.name) {
      return;
    }
    this._m_extra.name = name;
  }

  /**
   * Get the DOM node managed by the widget.
   */
  get node(): HTMLElement {
    return this._m_node;
  }

  /**
   * Get the id of the widget's DOM node.
   */
  get id(): string {
    return this._m_node.id;
  }

  /**
   * Set the id of the widget's DOM node.
   */
  set id(value: string) {
    this._m_node.id = value;
  }

  /**
   * Get the class list for the widget's DOM node.
   */
  get classList(): DOMTokenList {
    return this._m_node.classList;
  }

  /**
   * Get the X position of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get x(): number {
    return this._m_extra.x;
  }

  /**
   * Set the X position of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set x(x: number) {
    this.move(x, this._m_extra.y);
  }

  /**
   * Get the Y position of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get y(): number {
    return this._m_extra.y;
  }

  /**
   * Set the Y position of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set y(y: number) {
    this.move(this._m_extra.x, y);
  }

  /**
   * Get the width of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get width(): number {
    return this._m_extra.width;
  }

  /**
   * Set the width of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set width(width: number) {
    this.resize(width, this._m_extra.height);
  }

  /**
   * Get the height of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get height(): number {
    return this._m_extra.height;
  }

  /**
   * Set the height of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set height(height: number) {
    this.resize(this._m_extra.width, height);
  }

  /**
   * Get the position of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get pos(): Point {
    var extra = this._m_extra;
    return new Point(extra.x, extra.y);
  }

  /**
   * Set the position of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set pos(pos: Point) {
    this.move(pos.x, pos.y);
  }

  /**
   * Get the size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get size(): Size {
    var extra = this._m_extra;
    return new Size(extra.width, extra.height);
  }

  /**
   * Set the size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set size(size: Size) {
    this.resize(size.width, size.height);
  }

  /**
   * Get the geometry of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get geometry(): Rect {
    var extra = this._m_extra;
    return new Rect(extra.x, extra.y, extra.width, extra.height);
  }

  /**
   * Set the geometry of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set geometry(rect: Rect) {
    this.setGeometry(rect.x, rect.y, rect.width, rect.height);
  }

  /**
   * Get the minimum width of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get minWidth(): number {
    return this._m_extra.minWidth;
  }

  /**
   * Set the minimum width of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set minWidth(width: number) {
    this.setMinSize(width, this._m_extra.minHeight);
  }

  /**
   * Get the minimum height of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get minHeight(): number {
    return this._m_extra.minHeight;
  }

  /**
   * Set the minimum height of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set minHeight(height: number) {
    this.setMinSize(this._m_extra.minWidth, height);
  }

  /**
   * Get the maximum width of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get maxWidth(): number {
    return this._m_extra.maxWidth;
  }

  /**
   * Set the maximum width of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set maxWidth(width: number) {
    this.setMaxSize(width, this._m_extra.maxHeight);
  }

  /**
   * Get the maximum height of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get maxHeight(): number {
    return this._m_extra.maxHeight;
  }

  /**
   * Set the maximum height of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set maxHeight(height: number) {
    this.setMaxSize(this._m_extra.maxWidth, height);
  }

  /**
   * Get the minimum size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get minSize(): Size {
    var extra = this._m_extra;
    return new Size(extra.minWidth, extra.minHeight);
  }

  /**
   * Set the minimum size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set minSize(size: Size) {
    this.setMinSize(size.width, size.height);
  }

  /**
   * Get the maximum size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  get maxSize(): Size {
    var extra = this._m_extra;
    return new Size(extra.maxWidth, extra.maxHeight);
  }

  /**
   * Set the maximum size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  set maxSize(size: Size) {
    this.setMaxSize(size.width, size.height);
  }

  /**
   * Get the horizontal size policy for the widget.
   */
  get horizontalSizePolicy(): SizePolicy {
    return this._m_extra.hSizePolicy;
  }

  /**
   * Set the horizontal size policy for the widget.
   */
  set horizontalSizePolicy(policy: SizePolicy) {
    this.setSizePolicy(policy, this._m_extra.vSizePolicy);
  }

  /**
   * Get the vertical size policy for the widget.
   */
  get verticalSizePolicy(): SizePolicy {
    return this._m_extra.vSizePolicy;
  }

  /**
   * Set the vertical size policy for the widget.
   */
  set verticalSizePolicy(policy: SizePolicy) {
    this.setSizePolicy(this._m_extra.hSizePolicy, policy);
  }

  /**
   * Get the read only box data for the widget node.
   *
   * If an external style change causes the box data to change, the
   * `updateBoxData` method should be called to update the widget.
   */
  get boxData(): IBoxData {
    var extra = this._m_extra;
    var data = extra.boxData;
    if (data) return data;
    return extra.boxData = createBoxData(this._m_node);
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
   *  - it is attached to the DOM
   *  - it is not explicitly hidden
   *  - it has no explicitly hidden ancestors
   */
  get isVisible(): boolean {
    return this.testFlag(WidgetFlag.IsVisible);
  }

  /**
   * Test whether a widget flag is set.
   */
  testFlag(flag: WidgetFlag): boolean {
    return (this._m_flags & flag) !== 0;
  }

  /**
   * Set the given widget flag.
   */
  setFlag(flag: WidgetFlag): void {
    this._m_flags |= flag;
  }

  /**
   * Clear the given widget flag.
   */
  clearFlag(flag: WidgetFlag): void {
    this._m_flags &= ~flag;
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
    var p = this._m_parent;
    if (this.isAttached && (!p || p.isVisible)) {
      core.sendEvent(this, EVT_BEFORE_SHOW);
      this.classList.remove(HIDDEN_CLASS);
      this.clearFlag(WidgetFlag.IsHidden);
      core.sendEvent(this, EVT_AFTER_SHOW);
    } else {
      this.classList.remove(HIDDEN_CLASS);
      this.clearFlag(WidgetFlag.IsHidden);
    }
    if (p) {
      core.sendEvent(p, new ChildEvent('child-shown', this));
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
    var p = this._m_parent;
    if (this.isAttached && (!p || p.isVisible)) {
      core.sendEvent(this, EVT_BEFORE_HIDE);
      this.classList.add(HIDDEN_CLASS);
      this.setFlag(WidgetFlag.IsHidden);
      core.sendEvent(this, EVT_AFTER_HIDE);
    } else {
      this.classList.add(HIDDEN_CLASS);
      this.setFlag(WidgetFlag.IsHidden);
    }
    if (p) {
      core.sendEvent(p, new ChildEvent('child-hidden', this));
    }
    this.updateGeometry(true);
  }

  /**
   * Close the widget by sending it a 'close' event.
   *
   * Subclass may reimplement the `closeEvent` method to perform custom
   * actions before removing the widget from the hierarchy. The default
   * close event handler will unparent the widget.
   */
  close(): void {
    core.sendEvent(this, EVT_CLOSE);
  }

  /**
   * Attach the widget's node to a DOM element.
   *
   * The `fitToHost` method can be called to resize the widget to
   * fill its host node. It should be called whenever the size of
   * host node is known to have changed.
   *
   * Only a root widget can be attached to a host node.
   */
  attach(node: HTMLElement): void {
    if (this._m_parent) {
      throw new Error('can only attach a root widget to the DOM');
    }
    core.sendEvent(this, EVT_BEFORE_ATTACH);
    node.appendChild(this._m_node);
    core.sendEvent(this, EVT_AFTER_ATTACH);
  }

  /**
   * Detach the widget's node from the DOM.
   *
   * Only a root widget can be detached from its host node.
   */
  detach(): void {
    if (this._m_parent) {
      throw new Error('can only detach a root widget from the DOM');
    }
    var node = this._m_node;
    var parentNode = node.parentNode;
    if (!parentNode) {
      return;
    }
    core.sendEvent(this, EVT_BEFORE_DETACH);
    parentNode.removeChild(node);
    core.sendEvent(this, EVT_AFTER_DETACH);
  }

  /**
   * Resize the widget so that its fills its host node.
   *
   * Only a root widget can be resized to fill its host node.
   *
   * If the size of the host node is known, it can be provided
   * so that the size does not need to be read from the DOM.
   */
  fitToHost(width?: number, height?: number, box?: IBoxData): void {
    if (this._m_parent) {
      throw new Error('can only fit a root widget');
    }
    var parentNode = <HTMLElement>this._m_node.parentNode;
    if (!parentNode) {
      return;
    }
    if (box === void 0) {
      box = createBoxData(parentNode);
    }
    if (width === void 0) {
      width = parentNode.offsetWidth - box.horizontalSum;
    }
    if (height === void 0) {
      height = parentNode.offsetHeight - box.verticalSum;
    }
    this.setGeometry(box.paddingLeft, box.paddingTop, width, height);
  }

  /**
   * Calculate the preferred size for the widget.
   *
   * This does not apply when using CSS for layout.
   *
   * The default implementation returns the layout size hint if
   * a layout is installed, otherwise it returns a zero size.
   *
   * Most leaf widgets will reimplement this method.
   */
  sizeHint(): Size {
    if (this._m_layout) {
      return this._m_layout.sizeHint();
    }
    return new Size(0, 0);
  }

  /**
   * Calculate the preferred minimum size for the widget.
   *
   * This does not apply when using CSS for layout.
   *
   * The default implementation returns the layout min size if
   * a layout is installed, otherwise it returns a zero size.
   *
   * Most leaf widgets will reimplement this method.
   */
  minSizeHint(): Size {
    if (this._m_layout) {
      return this._m_layout.minSize();
    }
    return new Size(0, 0);
  }

  /**
   * Calculate the preferred maximum size for the widget.
   *
   * This does not apply when using CSS for layout.
   *
   * The default implementation returns the layout max size if
   * a layout is installed, otherwise it returns an inf size.
   */
  maxSizeHint(): Size {
    if (this._m_layout) {
      return this._m_layout.maxSize();
    }
    return new Size(Infinity, Infinity);
  }

  /**
   * Notify the layout system that the widget geometry needs updating.
   *
   * This should be called if the widget's size hint(s) have changed.
   *
   * If the `force` flag is false and the widget is explicitly hidden,
   * this is a no-op. The layout will update automatically when the
   * widget is made visible.
   */
  updateGeometry(force = false): void {
    var parent = this._m_parent;
    if (!parent || (this.isHidden && !force)) {
      return;
    }
    if (parent._m_layout) {
      parent._m_layout.invalidate();
    } else {
      core.postEvent(parent, EVT_LAYOUT_REQUEST);
      parent.updateGeometry();
    }
  }

  /**
   * Notify the layout system that the widget box data needs updating.
   *
   * This should be called if the node's padding or border has changed.
   */
  updateBoxData(): void {
    this._m_extra.boxData = null;
    if (this._m_layout) {
      this._m_layout.invalidate();
    } else {
      core.postEvent(this, EVT_LAYOUT_REQUEST);
    }
    this.updateGeometry();
  }

  /**
   * Move the widget to the given X-Y position.
   *
   * This does not apply when using CSS for layout.
   */
  move(x: number, y: number): void {
    var extra = this._m_extra;
    this.setGeometry(x, y, extra.width, extra.height);
  }

  /**
   * Resize the widget to the given width and height.
   *
   * This does not apply when using CSS for layout.
   */
  resize(width: number, height: number): void {
    var extra = this._m_extra;
    this.setGeometry(extra.x, extra.y, width, height);
  }

  /**
   * Set the geometry of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  setGeometry(x: number, y: number, width: number, height: number): void {
    var extra = this._m_extra;
    width = Math.max(extra.minWidth, Math.min(width, extra.maxWidth));
    height = Math.max(extra.minHeight, Math.min(height, extra.maxHeight));
    var isMove = false;
    var isResize = false;
    var oldX = extra.x;
    var oldY = extra.y;
    var oldWidth = extra.width;
    var oldHeight = extra.height;
    var style = this._m_node.style;
    if (oldX !== x) {
      isMove = true;
      extra.x = x;
      style.left = x + 'px';
    }
    if (oldY !== y) {
      isMove = true;
      extra.y = y;
      style.top = y + 'px';
    }
    if (oldWidth !== width) {
      isResize = true;
      extra.width = width;
      style.width = width + 'px';
    }
    if (oldHeight !== height) {
      isResize = true;
      extra.height = height;
      style.height = height + 'px';
    }
    if (isMove) {
      core.sendEvent(this, new MoveEvent(oldX, oldY, x, y));
    }
    if (isResize) {
      core.sendEvent(this, new ResizeEvent(oldWidth, oldHeight, width, height));
    }
  }

  /**
   * Set the minimum size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  setMinSize(width: number, height: number): void {
    var extra = this._m_extra;
    this.setSizeLimits(width, height, extra.maxWidth, extra.maxHeight);
  }

  /**
   * Set the maximum size of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  setMaxSize(width: number, height: number): void {
    var extra = this._m_extra;
    this.setSizeLimits(extra.minWidth, extra.minHeight, width, height);
  }

  /**
   * Set the minimum and maximum sizes of the widget.
   *
   * This does not apply when using CSS for layout.
   */
  setSizeLimits(minW: number, minH: number, maxW: number, maxH: number): void {
    minW = Math.max(0, minW);
    minH = Math.max(0, minH);
    maxW = Math.max(minW, maxW);
    maxH = Math.max(minH, maxH);
    var changed = false;
    var extra = this._m_extra;
    if (minW !== extra.minWidth) {
      extra.minWidth = minW;
      changed = true;
    }
    if (minH !== extra.minHeight) {
      extra.minHeight = minH;
      changed = true;
    }
    if (maxW !== extra.maxWidth) {
      extra.maxWidth = maxW;
      changed = true;
    }
    if (maxH !== extra.maxHeight) {
      extra.maxHeight = maxH;
      changed = true;
    }
    if (changed) {
      this.resize(extra.width, extra.height);
      this.updateGeometry();
    }
  }

  /**
   * Set the size policy values for the widget.
   */
  setSizePolicy(horizontal: SizePolicy, vertical: SizePolicy): void {
    var changed = false;
    var extra = this._m_extra;
    if (horizontal !== extra.hSizePolicy) {
      extra.hSizePolicy = horizontal;
      changed = true;
    }
    if (vertical !== extra.vSizePolicy) {
      extra.vSizePolicy = vertical;
      changed = true;
    }
    if (changed) {
      this.updateGeometry();
    }
  }

  /**
   * Process an event dispatched to the handler.
   *
   * This is the primary event processing method. If the handler has
   * installed event filters and one of them returns true from its
   * `filterEvent` method, this method will not be called.
   */
  processEvent(event: ICoreEvent): void {
    switch (event.type) {
      case 'move':
        this.moveEvent(<MoveEvent>event);
        break;
      case 'resize':
        this.resizeEvent(<ResizeEvent>event);
        break;
      case 'child-added':
        var child = (<ChildEvent>event).child;
        if (this.isAttached) {
          core.sendEvent(child, EVT_BEFORE_ATTACH);
          this._m_node.appendChild(child._m_node);
          core.sendEvent(child, EVT_AFTER_ATTACH);
        } else {
          this._m_node.appendChild(child._m_node);
        }
        break;
      case 'child-removed':
        var child = (<ChildEvent>event).child;
        if (this.isAttached) {
          core.sendEvent(child, EVT_BEFORE_DETACH);
          this._m_node.removeChild(child._m_node);
          core.sendEvent(child, EVT_AFTER_DETACH);
        } else {
          this._m_node.removeChild(child._m_node);
        }
        break;
      case 'before-show':
        this.beforeShowEvent(event);
        sendNonHiddenChildrenEvent(this._m_children, event);
        break;
      case 'after-show':
        this.setFlag(WidgetFlag.IsVisible);
        this.afterShowEvent(event);
        sendNonHiddenChildrenEvent(this._m_children, event);
        break;
      case 'before-hide':
        this.beforeHideEvent(event);
        sendNonHiddenChildrenEvent(this._m_children, event);
        break;
      case 'after-hide':
        this.clearFlag(WidgetFlag.IsVisible);
        this.afterHideEvent(event);
        sendNonHiddenChildrenEvent(this._m_children, event);
        break;
      case 'before-attach':
        this._m_extra.boxData = null;
        this.beforeAttachEvent(event);
        sendChildrenEvent(this._m_children, event);
        break;
      case 'after-attach':
        var p = this._m_parent;
        var v = !p || p.isVisible;
        v = v && !this.isHidden;
        if (v) this.setFlag(WidgetFlag.IsVisible);
        this.setFlag(WidgetFlag.IsAttached);
        this.afterAttachEvent(event);
        sendChildrenEvent(this._m_children, event);
        break;
      case 'before-detach':
        this.beforeDetachEvent(event);
        sendChildrenEvent(this._m_children, event);
        break;
      case 'after-detach':
        this.clearFlag(WidgetFlag.IsVisible);
        this.clearFlag(WidgetFlag.IsAttached);
        this.afterDetachEvent(event);
        sendChildrenEvent(this._m_children, event);
        break;
      case 'close':
        this.closeEvent(event);
        break;
      default:
        break;
    }
  }

  /**
   * Compress an event posted to the event handler.
   *
   * This allows the handler to merge a posted event with an event
   * which is already enqueued. It should return true if the event
   * was compressed and should be dropped, or false if the event
   * should be posted as normal.
   *
   * By default 'layout-request' events are compressed.
   */
  compressEvent(event: ICoreEvent, posted: IIterable<ICoreEvent>): boolean {
    if (event.type === 'layout-request') {
      return any(posted, ev => ev.type === event.type);
    }
    return false;
  }

  /**
   * Create the DOM node which represents the widget.
   *
   * The default implementation creates an empty div.
   */
  protected createNode(): HTMLElement {
    return document.createElement('div');
  }

  /**
   * A method invoked on a 'close' event.
   *
   * Subclass may reimplement this method to perform custom actions
   * before removing the widget from the hierarchy.
   *
   * The default behavior sets the parent to null.
   */
  protected closeEvent(event: ICoreEvent): void {
    this.parent = null;
  }

  /**
   * A method invoked on a 'move' event.
   *
   * The default implementation is a no-op.
   */
  protected moveEvent(event: MoveEvent): void { }

  /**
   * A method invoked on a 'resize' event.
   *
   * The default implementation is a no-op.
   */
  protected resizeEvent(event: ResizeEvent): void { }

  /**
   * A method invoked on a 'before-show' event.
   *
   * The default implementation is a no-op.
   */
  protected beforeShowEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on an 'after-show' event.
   *
   * The default implementation is a no-op.
   */
  protected afterShowEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on a 'before-hide' event.
   *
   * The default implementation is a no-op.
   */
  protected beforeHideEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on an 'after-hide' event.
   *
   * The default implementation is a no-op.
   */
  protected afterHideEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on a 'before-attach' event.
   *
   * The default implementation is a no-op.
   */
  protected beforeAttachEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on an 'after-attach' event.
   *
   * The default implementation is a no-op.
   */
  protected afterAttachEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on a 'before-detach' event.
   *
   * The default implementation is a no-op.
   */
  protected beforeDetachEvent(event: ICoreEvent): void { }

  /**
   * A method invoked on an 'after-detach' event.
   *
   * The default implementation is a no-op.
   */
  protected afterDetachEvent(event: ICoreEvent): void { }

  private _m_flags = 0;
  private _m_node: HTMLElement;
  private _m_extra = createExtra();
  private _m_parent: Widget = null;
  private _m_layout: Layout = null;
  private _m_children = new List<Widget>();
}


/**
 * A singleton 'before-show' event.
 */
var EVT_BEFORE_SHOW = new CoreEvent('before-show');

/**
 * A singleton 'after-show' event.
 */
var EVT_AFTER_SHOW = new CoreEvent('after-show');

/**
 * A singleton 'before-hide' event.
 */
var EVT_BEFORE_HIDE = new CoreEvent('before-hide');

/**
 * A singleton 'after-hide' event.
 */
var EVT_AFTER_HIDE = new CoreEvent('after-hide');

/**
 * A singleton 'before-attach' event.
 */
var EVT_BEFORE_ATTACH = new CoreEvent('before-attach');

/**
 * A singleton 'after-attach' event.
 */
var EVT_AFTER_ATTACH = new CoreEvent('after-attach');

/**
 * A singleton 'before-detach' event.
 */
var EVT_BEFORE_DETACH = new CoreEvent('before-detach');

/**
 * A singleton 'after-detach' event.
 */
var EVT_AFTER_DETACH = new CoreEvent('after-detach');

/**
 * A singleton 'parent-changed' event.
 */
var EVT_PARENT_CHANGED = new CoreEvent('parent-changed');

/**
 * A singleton 'layout-changed' event.
 */
var EVT_LAYOUT_CHANGED = new CoreEvent('layout-changed');

/**
 * A singleton 'layout-request' event.
 */
var EVT_LAYOUT_REQUEST = new CoreEvent('layout-request');

/**
 * A singleton 'close' event.
 */
var EVT_CLOSE = new CoreEvent('close');


/**
 * An object which holds extra widget data.
 */
interface IWidgetExtra {
  /**
   * The X position of the widget.
   */
  x: number;

  /**
   * The Y position of the widget.
   */
  y: number;

  /**
   * The width of the widget.
   */
  width: number;

  /**
   * The height of the widget.
   */
  height: number;

  /**
   * The minimum width of the widget.
   */
  minWidth: number;

  /**
   * The minimum height of the widget.
   */
  minHeight: number;

  /**
   * The maximum width of the widget.
   */
  maxWidth: number;

  /**
   * The maximum height of the widget.
   */
  maxHeight: number;

  /**
   * The horizontal size policy of the widget.
   */
  hSizePolicy: SizePolicy;

  /**
   * The vertical size policy of the widget.
   */
  vSizePolicy: SizePolicy;

  /**
   * The box data for the widget.
   */
  boxData: IBoxData;

  /**
   * The name of the widget.
   */
  name: string;
}


/**
 * The widget extra prototype object used by `createExtra`.
 */
var widgetExtraProto: IWidgetExtra = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  minWidth: 0,
  minHeight: 0,
  maxWidth: Infinity,
  maxHeight: Infinity,
  hSizePolicy: SizePolicy.Preferred,
  vSizePolicy: SizePolicy.Preferred,
  boxData: null,
  name: '',
};


/**
 * Create a new widget extra object using the extra prototype.
 */
function createExtra(): IWidgetExtra {
  return Object.create(widgetExtraProto);
}


/**
 * Send an event to a list of child widgets.
 */
function sendChildrenEvent(children: IList<Widget>, event: ICoreEvent): void {
  forEach(children, ch => { core.sendEvent(ch, event); });
}


/**
 * Send an event to the non-hidden children in the list.
 */
function sendNonHiddenChildrenEvent(children: IList<Widget>, event: ICoreEvent): void {
  forEach(children, ch => { if (!ch.isHidden) core.sendEvent(ch, event); });
}

} // module phosphor.widgets
