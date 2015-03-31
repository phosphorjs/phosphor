/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

import IList = collections.IList;
import List = collections.List;
import ReadOnlyList = collections.ReadOnlyList;


/**
 * An object which forms the base of a parent-child hierarchy.
 *
 * This class is used as the base class for Phosphor widgets, but it can
 * also be subclassed to create non-visual objects which live alongside
 * widgets in an object hierarchy and can respond to lifecycle messages.
 */
export
class CoreObject implements IMessageHandler, IDisposable {
  /**
   * A signal emitted when the object is disposed.
   */
  disposed = new Signal<CoreObject, void>();

  /**
   * Construct a new core object.
   */
  constructor() { }

  /**
   * Dispose of the object and its descendants.
   */
  dispose(): void {
    clearMessageData(this);

    this.disposed.emit(this, void 0);
    this.disposed.disconnect();

    var parent = this._parent;
    if (parent) {
      this._parent = null;
      parent._children.remove(this);
      sendMessage(parent, new ChildMessage('child-removed', this));
    }

    var children = this._children;
    for (var i = 0, n = children.size; i < n; ++i) {
      var child = children.get(i);
      children.set(i, null);
      child._parent = null;
      child.dispose();
    }
    children.clear();
  }

  /**
   * Get the parent of the object.
   */
  get parent(): CoreObject {
    return this._parent;
  }

  /**
   * Set the parent of the object.
   */
  set parent(parent: CoreObject) {
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
   * Get a read only list of the object's children.
   */
  get children(): IList<CoreObject> {
    return new ReadOnlyList(this._children);
  }

  /**
   * Process a message sent to the object.
   *
   * This method implements the IMessageHandler interface.
   *
   * A subclass may reimplement this method as needed.
   */
  processMessage(msg: IMessage): void {
    switch (msg.type) {
    case 'child-added':
      this.onChildAdded(<ChildMessage>msg);
      break;
    case 'child-removed':
      this.onChildRemoved(<ChildMessage>msg);
      break;
    }
  }

  /**
   * A method invoked on a 'child-added' message.
   *
   * The default implementation is a no-op.
   */
  protected onChildAdded(msg: ChildMessage): void { }

  /**
   * A method invoked on a 'child-removed' message.
   *
   * The default implementation is a no-op.
   */
  protected onChildRemoved(msg: ChildMessage): void { }

  private _parent: CoreObject = null;
  private _children = new List<CoreObject>();
}


/**
 * A message class for child object messages.
 */
export
class ChildMessage extends Message {
  /**
   * Construct a new child message.
   */
  constructor(type: string, child: CoreObject) {
    super(type);
    this._child = child;
  }

  /**
   * The child object for the message.
   */
  get child(): CoreObject {
    return this._child;
  }

  private _child: CoreObject;
}

} // phosphor.core
