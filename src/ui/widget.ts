/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, each, empty
} from '../algorithm/iteration';

import {
  IDisposable
} from '../core/disposable';

import {
  ConflatableMessage, IMessageHandler, Message, clearMessageData, postMessage,
  sendMessage
} from '../core/messaging';

import {
  AttachedProperty, clearPropertyData
} from '../core/properties';

import {
  ISignal, clearSignalData, defineSignal
} from '../core/signaling';

import {
  Title
} from './title';


/**
 * The class name added to Widget instances.
 */
const WIDGET_CLASS = 'p-Widget';

/**
 * The class name added to hidden widgets.
 */
const HIDDEN_CLASS = 'p-mod-hidden';


/**
 * The base class of the Phosphor widget hierarchy.
 *
 * #### Notes
 * This class will typically be subclassed in order to create a useful
 * widget. However, it can be used directly to host externally created
 * content.
 */
export
class Widget implements IDisposable, IMessageHandler {
  /**
   * Construct a new widget.
   *
   * @param options - The options for initializing the widget.
   */
  constructor(options: Widget.IOptions = {}) {
    this._node = Private.createNode(options);
    this.addClass(WIDGET_CLASS);
  }

  /**
   * Dispose of the widget and its descendant widgets.
   *
   * #### Notes
   * It is unsafe to use the widget after it has been disposed.
   *
   * All calls made to this method after the first are a no-op.
   */
  dispose(): void {
    // Do nothing if the widget is already disposed.
    if (this.isDisposed) {
      return;
    }

    // Set the disposed flag and emit the disposed signal.
    this.setFlag(WidgetFlag.IsDisposed);
    this.disposed.emit(void 0);

    // Remove or detach the widget if necessary.
    if (this.parent) {
      this.parent = null;
    } else if (this.isAttached) {
      Widget.detach(this);
    }

    // Dispose of the widget layout.
    if (this._layout) {
      this._layout.dispose();
      this._layout = null;
    }

    // Clear the attached data associated with the widget.
    clearSignalData(this);
    clearMessageData(this);
    clearPropertyData(this);

    // Clear the reference to the DOM node.
    this._node = null;
  }

  /**
   * A signal emitted when the widget is disposed.
   */
  disposed: ISignal<Widget, void>;

  /**
   * Test whether the widget has been disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this.testFlag(WidgetFlag.IsDisposed);
  }

  /**
   * Test whether the widget's node is attached to the DOM.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isAttached(): boolean {
    return this.testFlag(WidgetFlag.IsAttached);
  }

  /**
   * Test whether the widget is explicitly hidden.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isHidden(): boolean {
    return this.testFlag(WidgetFlag.IsHidden);
  }

  /**
   * Test whether the widget is visible.
   *
   * #### Notes
   * A widget is visible when it is attached to the DOM, is not
   * explicitly hidden, and has no explicitly hidden ancestors.
   *
   * This is a read-only property.
   */
  get isVisible(): boolean {
    return this.testFlag(WidgetFlag.IsVisible);
  }

  /**
   * Get the DOM node owned by the widget.
   *
   * #### Notes
   * This is a read-only property.
   */
  get node(): HTMLElement {
    return this._node;
  }

  /**
   * Get the id of the widget's DOM node.
   */
  get id(): string {
    return this._node.id;
  }

  /**
   * Set the id of the widget's DOM node.
   */
  set id(value: string) {
    this._node.id = value;
  }

  /**
   * Get the title object for the widget.
   *
   * #### Notes
   * The title object is used by some container widgets when displaying
   * the widget alongside some title, such as a tab panel or side bar.
   *
   * Since not all widgets will use the title, it is created on demand.
   *
   * The `owner` property of the title is set to this widget.
   *
   * This is a read-only property.
   */
  get title(): Title {
    return Private.titleProperty.get(this);
  }

  /**
   * Get the parent of the widget.
   *
   * #### Notes
   * This will be `null` if the widget does not have a parent.
   */
  get parent(): Widget {
    return this._parent;
  }

  /**
   * Set the parent of the widget.
   *
   * #### Notes
   * Children are typically added to a widget by using a layout, which
   * means user code will not normally set the parent widget directly.
   *
   * The widget will be automatically removed from its old parent.
   *
   * This is a no-op if there is no effective parent change.
   */
  set parent(value: Widget) {
    value = value || null;
    if (this._parent === value) {
      return;
    }
    if (value && this.contains(value)) {
      throw new Error('Invalid parent widget.');
    }
    if (this._parent && !this._parent.isDisposed) {
      sendMessage(this._parent, new ChildMessage('child-removed', this));
    }
    this._parent = value;
    if (this._parent && !this._parent.isDisposed) {
      sendMessage(this._parent, new ChildMessage('child-added', this));
    }
    sendMessage(this, WidgetMessage.ParentChanged);
  }

  /**
   * Get the layout for the widget.
   *
   * #### Notes
   * This will be `null` if the widget does not have a layout.
   */
  get layout(): Layout {
    return this._layout;
  }

  /**
   * Set the layout for the widget.
   *
   * #### Notes
   * The layout is single-use only. It cannot be set to `null` and it
   * cannot be changed after the first assignment.
   *
   * The layout is disposed automatically when the widget is disposed.
   */
  set layout(value: Layout) {
    value = value || null;
    if (this._layout === value) {
      return;
    }
    if (this.testFlag(WidgetFlag.DisallowLayout)) {
      throw new Error('Cannot set widget layout.');
    }
    if (this._layout) {
      throw new Error('Cannot change widget layout.');
    }
    if (value.parent) {
      throw new Error('Cannot change layout parent.');
    }
    this._layout = value;
    value.parent = this;
  }

  /**
   * Create an iterator over the widget's children.
   *
   * @returns A new iterator over the children of the widget.
   *
   * #### Notes
   * The widget must have a populated layout in order to have children.
   *
   * If a layout is not installed, the returned iterator will be empty.
   */
  children(): IIterator<Widget> {
    return this._layout ? this._layout.iter() : empty<Widget>();
  }

  /**
   * Test whether a widget is a descendant of this widget.
   *
   * @param widget - The descendant widget of interest.
   *
   * @returns `true` if the widget is a descendant, `false` otherwise.
   */
  contains(widget: Widget): boolean {
    for (; widget; widget = widget._parent) {
      if (widget === this) return true;
    }
    return false;
  }

  /**
   * Test whether the widget's DOM node has the given class name.
   *
   * @param name - The class name of interest.
   *
   * @returns `true` if the node has the class, `false` otherwise.
   */
  hasClass(name: string): boolean {
    return this._node.classList.contains(name);
  }

  /**
   * Add a class name to the widget's DOM node.
   *
   * @param name - The class name to add to the node.
   *
   * #### Notes
   * If the class name is already added to the node, this is a no-op.
   *
   * The class name must not contain whitespace.
   */
  addClass(name: string): void {
    this._node.classList.add(name);
  }

  /**
   * Remove a class name from the widget's DOM node.
   *
   * @param name - The class name to remove from the node.
   *
   * #### Notes
   * If the class name is not yet added to the node, this is a no-op.
   *
   * The class name must not contain whitespace.
   */
  removeClass(name: string): void {
    this._node.classList.remove(name);
  }

  /**
   * Toggle a class name on the widget's DOM node.
   *
   * @param name - The class name to toggle on the node.
   *
   * @param force - Whether to force add the class (`true`) or force
   *   remove the class (`false`). If not provided, the presence of
   *   the class will be toggled from its current state.
   *
   * @returns `true` if the class is now present, `false` otherwise.
   *
   * #### Notes
   * The class name must not contain whitespace.
   */
  toggleClass(name: string, force?: boolean): boolean {
    if (force === true) {
      this._node.classList.add(name);
      return true;
    }
    if (force === false) {
      this._node.classList.remove(name);
      return false;
    }
    return this._node.classList.toggle(name);
  }

  /**
   * Post an `'update-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for posting the message.
   */
  update(): void {
    postMessage(this, WidgetMessage.UpdateRequest);
  }

  /**
   * Post a `'fit-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for posting the message.
   */
  fit(): void {
    postMessage(this, WidgetMessage.FitRequest);
  }

  /**
   * Post an `'activate-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for posting the message.
   */
  activate(): void {
    postMessage(this, WidgetMessage.ActivateRequest);
  }

  /**
   * Send a `'close-request'` message to the widget.
   *
   * #### Notes
   * This is a simple convenience method for sending the message.
   */
  close(): void {
    sendMessage(this, WidgetMessage.CloseRequest);
  }

  /**
   * Show the widget and make it visible to its parent widget.
   *
   * #### Notes
   * This causes the [[isHidden]] property to be `false`.
   *
   * If the widget is not explicitly hidden, this is a no-op.
   */
  show(): void {
    if (!this.testFlag(WidgetFlag.IsHidden)) {
      return;
    }
    this.clearFlag(WidgetFlag.IsHidden);
    this.removeClass(HIDDEN_CLASS);
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      sendMessage(this, WidgetMessage.AfterShow);
    }
    if (this.parent) {
      sendMessage(this.parent, new ChildMessage('child-shown', this));
    }
  }

  /**
   * Hide the widget and make it hidden to its parent widget.
   *
   * #### Notes
   * This causes the [[isHidden]] property to be `true`.
   *
   * If the widget is explicitly hidden, this is a no-op.
   */
  hide(): void {
    if (this.testFlag(WidgetFlag.IsHidden)) {
      return;
    }
    if (this.isAttached && (!this.parent || this.parent.isVisible)) {
      sendMessage(this, WidgetMessage.BeforeHide);
    }
    this.setFlag(WidgetFlag.IsHidden);
    this.addClass(HIDDEN_CLASS);
    if (this.parent) {
      sendMessage(this.parent, new ChildMessage('child-hidden', this));
    }
  }

  /**
   * Show or hide the widget according to a boolean value.
   *
   * @param hidden - `true` to hide the widget, or `false` to show it.
   *
   * #### Notes
   * This is a convenience method for `hide()` and `show()`.
   */
  setHidden(hidden: boolean): void {
    if (hidden) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Test whether the given widget flag is set.
   *
   * #### Notes
   * This will not typically be called directly by user code.
   */
  testFlag(flag: WidgetFlag): boolean {
    return (this._flags & flag) !== 0;
  }

  /**
   * Set the given widget flag.
   *
   * #### Notes
   * This will not typically be called directly by user code.
   */
  setFlag(flag: WidgetFlag): void {
    this._flags |= flag;
  }

  /**
   * Clear the given widget flag.
   *
   * #### Notes
   * This will not typically be called directly by user code.
   */
  clearFlag(flag: WidgetFlag): void {
    this._flags &= ~flag;
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   *
   * #### Notes
   * Subclasses may reimplement this method as needed.
   */
  processMessage(msg: Message): void {
    switch (msg.type) {
    case 'resize':
      this.notifyLayout(msg);
      this.onResize(msg as ResizeMessage);
      break;
    case 'update-request':
      this.notifyLayout(msg);
      this.onUpdateRequest(msg);
      break;
    case 'after-show':
      this.setFlag(WidgetFlag.IsVisible);
      this.notifyLayout(msg);
      this.onAfterShow(msg);
      break;
    case 'before-hide':
      this.notifyLayout(msg);
      this.onBeforeHide(msg);
      this.clearFlag(WidgetFlag.IsVisible);
      break;
    case 'after-attach':
      let visible = !this.isHidden && (!this.parent || this.parent.isVisible);
      if (visible) this.setFlag(WidgetFlag.IsVisible);
      this.setFlag(WidgetFlag.IsAttached);
      this.notifyLayout(msg);
      this.onAfterAttach(msg);
      break;
    case 'before-detach':
      this.notifyLayout(msg);
      this.onBeforeDetach(msg);
      this.clearFlag(WidgetFlag.IsVisible);
      this.clearFlag(WidgetFlag.IsAttached);
      break;
    case 'activate-request':
      this.notifyLayout(msg);
      this.onActivateRequest(msg);
      break;
    case 'close-request':
      this.notifyLayout(msg);
      this.onCloseRequest(msg);
      break;
    case 'child-added':
      this.notifyLayout(msg);
      this.onChildAdded(msg as ChildMessage);
      break;
    case 'child-removed':
      this.notifyLayout(msg);
      this.onChildRemoved(msg as ChildMessage);
      break;
    default:
      this.notifyLayout(msg);
      break;
    }
  }

  /**
   * Invoke the message processing routine of the widget's layout.
   *
   * @param msg - The message to dispatch to the layout.
   *
   * #### Notes
   * This is a no-op if the widget does not have a layout.
   *
   * This will not typically be called directly by user code.
   */
  protected notifyLayout(msg: Message): void {
    if (this._layout) this._layout.processParentMessage(msg);
  }

  /**
   * A message handler invoked on a `'close-request'` message.
   *
   * #### Notes
   * The default implementation unparents or detaches the widget.
   */
  protected onCloseRequest(msg: Message): void {
    if (this.parent) {
      this.parent = null;
    } else if (this.isAttached) {
      Widget.detach(this);
    }
  }

  /**
   * A message handler invoked on a `'resize'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onResize(msg: ResizeMessage): void { }

  /**
   * A message handler invoked on an `'update-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onUpdateRequest(msg: Message): void { }

  /**
   * A message handler invoked on an `'activate-request'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onActivateRequest(msg: Message): void { }

  /**
   * A message handler invoked on an `'after-show'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onAfterShow(msg: Message): void { }

  /**
   * A message handler invoked on a `'before-hide'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onBeforeHide(msg: Message): void { }

  /**
   * A message handler invoked on an `'after-attach'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onAfterAttach(msg: Message): void { }

  /**
   * A message handler invoked on a `'before-detach'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onBeforeDetach(msg: Message): void { }

  /**
   * A message handler invoked on a `'child-added'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildAdded(msg: ChildMessage): void { }

  /**
   * A message handler invoked on a `'child-removed'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildRemoved(msg: ChildMessage): void { }

  private _flags = 0;
  private _node: HTMLElement;
  private _layout: Layout = null;
  private _parent: Widget = null;
}


// Define the signals for the `Widget` class.
defineSignal(Widget.prototype, 'disposed');


/**
 * The namespace for the `Widget` class statics.
 */
export
namespace Widget {
  /**
   * An options object for initializing a widget.
   */
  export
  interface IOptions {
    /**
     * The optional node to use for the widget.
     *
     * If a node is provided, the widget will assume full ownership
     * and control of the node, as if it had created the node itself.
     *
     * The default is a new `<div>`.
     */
    node?: HTMLElement;
  }

  // TODO - should this be an instance method?
  /**
   * Attach a widget to a host DOM node.
   *
   * @param widget - The widget of interest.
   *
   * @param host - The DOM node to use as the widget's host.
   *
   * #### Notes
   * This will throw an error if the widget is not a root widget, if
   * the widget is already attached, or if the host is not attached
   * to the DOM.
   */
  export
  function attach(widget: Widget, host: HTMLElement): void {
    if (widget.parent) {
      throw new Error('Cannot attach child widget.');
    }
    if (widget.isAttached || document.body.contains(widget.node)) {
      throw new Error('Widget already attached.');
    }
    if (!document.body.contains(host)) {
      throw new Error('Host not attached.');
    }
    host.appendChild(widget.node);
    sendMessage(widget, WidgetMessage.AfterAttach);
  }

  // TODO - should this be an instance method?
  /**
   * Detach the widget from its host DOM node.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This will throw an error if the widget is not a root widget, or
   * if the widget is not attached to the DOM.
   */
  export
  function detach(widget: Widget): void {
    if (widget.parent) {
      throw new Error('Cannot detach child widget.');
    }
    if (!widget.isAttached || !document.body.contains(widget.node)) {
      throw new Error('Widget not attached.');
    }
    sendMessage(widget, WidgetMessage.BeforeDetach);
    widget.node.parentNode.removeChild(widget.node);
  }

  /**
   * Prepare a widget for absolute layout geometry.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This sets the inline style position of the widget to `absolute`.
   */
  export
  function prepareGeometry(widget: Widget): void {
    widget.node.style.position = 'absolute';
  }

  /**
   * Reset the layout geometry of a widget.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * This clears the inline style position and geometry of the widget.
   */
  export
  function resetGeometry(widget: Widget): void {
    let style = widget.node.style;
    let rect = Private.rectProperty.get(widget);
    rect.top = NaN;
    rect.left = NaN;
    rect.width = NaN;
    rect.height = NaN;
    style.position = '';
    style.top = '';
    style.left = '';
    style.width = '';
    style.height = '';
  }

  /**
   * Set the absolute layout geometry of a widget.
   *
   * @param widget - The widget of interest.
   *
   * @param left - The desired offset left position of the widget.
   *
   * @param top - The desired offset top position of the widget.
   *
   * @param width - The desired offset width of the widget.
   *
   * @param height - The desired offset height of the widget.
   *
   * #### Notes
   * All dimensions are assumed to be pixels with coordinates relative
   * to the origin of the widget's offset parent.
   *
   * The widget's node is assumed to be position `absolute`.
   *
   * If the widget is resized from its previous size, a `ResizeMessage`
   * will be automatically sent to the widget.
   */
  export
  function setGeometry(widget: Widget, left: number, top: number, width: number, height: number): void {
    let resized = false;
    let style = widget.node.style;
    let rect = Private.rectProperty.get(widget);
    if (rect.top !== top) {
      rect.top = top;
      style.top = `${top}px`;
    }
    if (rect.left !== left) {
      rect.left = left;
      style.left = `${left}px`;
    }
    if (rect.width !== width) {
      resized = true;
      rect.width = width;
      style.width = `${width}px`;
    }
    if (rect.height !== height) {
      resized = true;
      rect.height = height;
      style.height = `${height}px`;
    }
    if (resized) {
      sendMessage(widget, new ResizeMessage(width, height));
    }
  }
}


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
    this._disposed = true;
    this._parent = null;
    clearSignalData(this);
    clearPropertyData(this);
  }

  /**
   * Test whether the layout is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._disposed;
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
   * #### Notes
   * This is set automatically when installing the layout on the parent
   * widget. The parent widget should not be set directly by user code.
   */
  set parent(value: Widget) {
    if (!value) {
      throw new Error('Cannot set parent widget to null.');
    }
    if (this._parent === value) {
      return;
    }
    if (this._parent) {
      throw new Error('Cannot change parent widget.');
    }
    if (value.layout !== this) {
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
      this.onResize(msg as ResizeMessage);
      break;
    case 'update-request':
      this.onUpdateRequest(msg);
      break;
    case 'fit-request':
      this.onFitRequest(msg);
      break;
    case 'after-show':
      this.onAfterShow(msg);
      break;
    case 'before-hide':
      this.onBeforeHide(msg);
      break;
    case 'after-attach':
      this.onAfterAttach(msg);
      break;
    case 'before-detach':
      this.onBeforeDetach(msg);
      break;
    case 'child-removed':
      this.onChildRemoved(msg as ChildMessage);
      break;
    case 'child-shown':
      this.onChildShown(msg as ChildMessage);
      break;
    case 'child-hidden':
      this.onChildHidden(msg as ChildMessage);
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
    each(this, widget => { widget.parent = this.parent; });
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
  protected onResize(msg: ResizeMessage): void {
    each(this, widget => { sendMessage(widget, ResizeMessage.UnknownSize); });
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
    each(this, widget => { sendMessage(widget, ResizeMessage.UnknownSize); });
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
    each(this, widget => { sendMessage(widget, msg); });
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
    each(this, widget => { sendMessage(widget, msg); });
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
    each(this, widget => { if (!widget.isHidden) sendMessage(widget, msg); });
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
    each(this, widget => { if (!widget.isHidden) sendMessage(widget, msg); });
  }

  /**
   * A message handler invoked on a `'child-removed'` message.
   *
   * #### Notes
   * This will remove the child widget from the layout.
   *
   * Subclasses should **not** typically reimplement this method.
   */
  protected onChildRemoved(msg: ChildMessage): void {
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
  protected onChildShown(msg: ChildMessage): void { }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   *
   * #### Notes
   * The default implementation of this handler is a no-op.
   */
  protected onChildHidden(msg: ChildMessage): void { }

  private _disposed = false;
  private _parent: Widget = null;
}


// TODO should this be in the Widget namespace?
/**
 * An enum of widget bit flags.
 */
export
enum WidgetFlag {
  /**
   * The widget has been disposed.
   */
  IsDisposed = 0x1,

  /**
   * The widget is attached to the DOM.
   */
  IsAttached = 0x2,

  /**
   * The widget is hidden.
   */
  IsHidden = 0x4,

  /**
   * The widget is visible.
   */
  IsVisible = 0x8,

  /**
   * A layout cannot be set on the widget.
   */
  DisallowLayout = 0x10
}


// TODO should this be in the Widget namespace?
/**
 * A collection of stateless messages related to widgets.
 */
export
namespace WidgetMessage {
  /**
   * A singleton `'after-show'` message.
   *
   * #### Notes
   * This message is sent to a widget after it becomes visible.
   *
   * This message is **not** sent when the widget is being attached.
   */
  export
  const AfterShow = new Message('after-show');

  /**
   * A singleton `'before-hide'` message.
   *
   * #### Notes
   * This message is sent to a widget before it becomes not-visible.
   *
   * This message is **not** sent when the widget is being detached.
   */
  export
  const BeforeHide = new Message('before-hide');

  /**
   * A singleton `'after-attach'` message.
   *
   * #### Notes
   * This message is sent to a widget after it is attached.
   */
  export
  const AfterAttach = new Message('after-attach');

  /**
   * A singleton `'before-detach'` message.
   *
   * #### Notes
   * This message is sent to a widget before it is detached.
   */
  export
  const BeforeDetach = new Message('before-detach');

  /**
   * A singleton `'parent-changed'` message.
   *
   * #### Notes
   * This message is sent to a widget when its parent has changed.
   */
  export
  const ParentChanged = new Message('parent-changed');

  /**
   * A singleton conflatable `'update-request'` message.
   *
   * #### Notes
   * This message can be dispatched to supporting widgets in order to
   * update their content based on the current widget state. Not all
   * widgets will respond to messages of this type.
   *
   * For widgets with a layout, this message will inform the layout to
   * update the position and size of its child widgets.
   */
  export
  const UpdateRequest = new ConflatableMessage('update-request');

  /**
   * A singleton conflatable `'fit-request'` message.
   *
   * #### Notes
   * For widgets with a layout, this message will inform the layout to
   * recalculate its size constraints to fit the space requirements of
   * its child widgets, and to update their position and size. Not all
   * layouts will respond to messages of this type.
   */
  export
  const FitRequest = new ConflatableMessage('fit-request');

  /**
   * A singleton conflatable `'activate-request'` message.
   *
   * #### Notes
   * This message should be dispatched to a widget when it should
   * perform the actions necessary to activate the widget, which
   * may include focusing its node or descendant node.
   */
  export
  const ActivateRequest = new ConflatableMessage('activate-request');

  /**
   * A singleton conflatable `'close-request'` message.
   *
   * #### Notes
   * This message should be dispatched to a widget when it should close
   * and remove itself from the widget hierarchy.
   */
  export
  const CloseRequest = new ConflatableMessage('close-request');
}


// TODO should this be in the Widget namespace?
/**
 * A message class for child related messages.
 */
export
class ChildMessage extends Message {
  /**
   * Construct a new child message.
   *
   * @param type - The message type.
   *
   * @param child - The child widget for the message.
   */
  constructor(type: string, child: Widget) {
    super(type);
    this._child = child;
  }

  /**
   * The child widget for the message.
   *
   * #### Notes
   * This is a read-only property.
   */
  get child(): Widget {
    return this._child;
  }

  private _child: Widget;
}


// TODO should this be in the Widget namespace?
/**
 * A message class for `'resize'` messages.
 */
export
class ResizeMessage extends Message {
  /**
   * Construct a new resize message.
   *
   * @param width - The **offset width** of the widget, or `-1` if
   *   the width is not known.
   *
   * @param height - The **offset height** of the widget, or `-1` if
   *   the height is not known.
   */
  constructor(width: number, height: number) {
    super('resize');
    this._width = width;
    this._height = height;
  }

  /**
   * The offset width of the widget.
   *
   * #### Notes
   * This will be `-1` if the width is unknown.
   *
   * This is a read-only property.
   */
  get width(): number {
    return this._width;
  }

  /**
   * The offset height of the widget.
   *
   * #### Notes
   * This will be `-1` if the height is unknown.
   *
   * This is a read-only property.
   */
  get height(): number {
    return this._height;
  }

  private _width: number;
  private _height: number;
}


/**
 * The namespace for the `ResizeMessage` class statics.
 */
export
namespace ResizeMessage {
  /**
   * A singleton `'resize'` message with an unknown size.
   */
  export
  const UnknownSize = new ResizeMessage(-1, -1);
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * An object which represents an offset rect.
   */
  export
  interface IRect {
    /**
     * The offset top edge, in pixels.
     */
    top: number;

    /**
     * The offset left edge, in pixels.
     */
    left: number;

    /**
     * The offset width, in pixels.
     */
    width: number;

    /**
     * The offset height, in pixels.
     */
    height: number;
  }

  /**
   * A property descriptor for a widget absolute geometry rect.
   */
  export
  const rectProperty = new AttachedProperty<Widget, IRect>({
    name: 'rect',
    create: () => ({ top: NaN, left: NaN, width: NaN, height: NaN }),
  });

  /**
   * An attached property for the widget title object.
   */
  export
  const titleProperty = new AttachedProperty<Widget, Title>({
    name: 'title',
    create: owner => new Title({ owner }),
  });

  /**
   * Create a DOM node for the given widget options.
   */
  export
  function createNode(options: Widget.IOptions): HTMLElement {
    return options.node || document.createElement('div');
  }
}
