/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, each
} from '../algorithm/iteration';

import {
  move
} from '../algorithm/mutation';

import {
  indexOf
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

import {
  Vector
} from '../collections/vector';

import {
  sendMessage
} from '../core/messaging';

import {
  Layout, Widget, WidgetMessage
} from './widget';


/**
 * The class name added to Panel instances.
 */
const PANEL_CLASS = 'p-Panel';


/**
 * A simple and convenient panel widget class.
 *
 * #### Notes
 * This class is suitable as a base class for implementing a variety of
 * convenience panel widgets, but can also be used directly with CSS to
 * arrange a collection of widgets.
 *
 * This class provides a convenience wrapper around a [[PanelLayout]].
 */
export
class Panel extends Widget {
  /**
   * Construct a new panel.
   *
   * @param options - The options for initializing the panel.
   */
  constructor(options: Panel.IOptions = {}) {
    super();
    this.addClass(PANEL_CLASS);
    this.layout = Private.createLayout(options);
  }

  /**
   * A read-only sequence of the widgets in the panel.
   *
   * #### Notes
   * This is a read-only property.
   */
  get widgets(): ISequence<Widget> {
    return (this.layout as PanelLayout).widgets;
  }

  /**
   * Add a widget to the end of the panel.
   *
   * @param widget - The widget to add to the panel.
   *
   * #### Notes
   * If the is already contained in the panel, it will be moved.
   */
  addWidget(widget: Widget): void {
    (this.layout as PanelLayout).addWidget(widget);
  }

  /**
   * Insert a widget at the specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into to the panel.
   *
   * #### Notes
   * If the widget is already contained in the panel, it will be moved.
   */
  insertWidget(index: number, widget: Widget): void {
    (this.layout as PanelLayout).insertWidget(index, widget);
  }
}


/**
 * The namespace for the `Panel` class statics.
 */
export
namespace Panel {
  /**
   * An options object for creating a panel.
   */
  export
  interface IOptions {
    /**
     * The panel layout to use for the panel.
     *
     * The default is a new `PanelLayout`.
     */
    layout?: PanelLayout;
  }
}


/**
 * A concrete layout implementation suitable for many use cases.
 *
 * #### Notes
 * This class is suitable as a base class for implementing a variety of
 * layouts, but can also be used directly with standard CSS to layout a
 * collection of widgets.
 */
export
class PanelLayout extends Layout {
  /**
   * Dispose of the resources held by the layout.
   *
   * #### Notes
   * This will clear and dispose all widgets in the layout.
   *
   * All reimplementations should call the superclass method.
   *
   * This method is called automatically when the parent is disposed.
   */
  dispose(): void {
    while (this._widgets.length > 0) {
      this._widgets.popBack().dispose();
    }
    super.dispose();
  }

  /**
   * A read-only sequence of the widgets in the layout.
   *
   * #### Notes
   * This is a read-only property.
   */
  get widgets(): ISequence<Widget> {
    return this._widgets;
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   */
  iter(): IIterator<Widget> {
    return this._widgets.iter();
  }

  /**
   * Add a widget to the end of the layout.
   *
   * @param widget - The widget to add to the layout.
   *
   * #### Notes
   * If the widget is already contained in the layout, it will be moved.
   */
  addWidget(widget: Widget): void {
    this.insertWidget(this._widgets.length, widget);
  }

  /**
   * Insert a widget into the layout at the specified index.
   *
   * @param index - The index at which to insert the widget.
   *
   * @param widget - The widget to insert into the layout.
   *
   * #### Notes
   * The index will be clamped to the bounds of the widgets.
   *
   * If the widget is already added to the layout, it will be moved.
   */
  insertWidget(index: number, widget: Widget): void {
    // Remove the widget from its current parent. This is a no-op
    // if the widget's parent is already the layout parent widget.
    widget.parent = this.parent;

    // Look up the current index of the widget.
    let i = indexOf(this._widgets, widget);

    // Clamp the insert index to the vector bounds.
    let j = Math.max(0, Math.min(Math.floor(index), this._widgets.length));

    // If the widget is not in the vector, insert it.
    if (i === -1) {
      // Insert the widget into the vector.
      this._widgets.insert(j, widget);

      // If the layout is parented, attach the widget to the DOM.
      if (this.parent) this.attachWidget(j, widget);

      // There is nothing more to do.
      return;
    }

    // Otherwise, the widget exists in the vector and should be moved.

    // Adjust the index if the location is at the end of the vector.
    if (j === this._widgets.length) j--;

    // Bail if there is no effective move.
    if (i === j) return;

    // Move the widget to the new location.
    move(this._widgets, i, j);

    // If the layout is parented, move the widget in the DOM.
    if (this.parent) this.moveWidget(i, j, widget);
  }

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
   * This method does *not* modify the widget's `parent`.
   */
  removeWidget(widget: Widget): void {
    this.removeWidgetAt(indexOf(this._widgets, widget));
  }

  /**
   * Remove the widget at a given index from the layout.
   *
   * @param index - The index of the widget to remove.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   */
  removeWidgetAt(index: number): void {
    // Bail if the index is out of range.
    let i = Math.floor(index);
    if (i < 0 || i >= this._widgets.length) {
      return;
    }

    // Remove the widget from the vector.
    let widget = this._widgets.removeAt(i);

    // If the layout is parented, detach the widget from the DOM.
    if (this.parent) this.detachWidget(i, widget);
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    super.init();
    let index = 0;
    each(this, widget => { this.attachWidget(index++, widget); });
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param index - The current index of the widget in the layout.
   *
   * @param widget - The widget to attach to the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation adds the widgets's node to the parent's
   * node at the proper location, and sends an `'after-attach'` message
   * to the widget if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is added to the parent's node, but the reimplementation must
   * send an `'after-attach'` message to the widget if the parent is
   * attached to the DOM.
   */
  protected attachWidget(index: number, widget: Widget): void {
    // Look up the next sibling reference widget.
    let ref = this._widgets.at(index + 1) || null;

    // Insert the widget's node before the sibling.
    this.parent.node.insertBefore(widget.node, ref && ref.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.AfterAttach);
  }

  /**
   * Move a widget in the parent's DOM node.
   *
   * @param fromIndex - The previous index of the widget in the layout.
   *
   * @param toIndex - The current index of the widget in the layout.
   *
   * @param widget - The widget to move in the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation moves the widget's node to the proper
   * location in the parent's node and sends both a `'before-detach'`
   * and an `'after-attach'` message to the widget if the parent is
   * attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is moved in the parent's node, but the reimplementation must
   * send both a `'before-detach'` and an `'after-attach'` message to
   * the widget if the parent is attached to the DOM.
   */
  protected moveWidget(fromIndex: number, toIndex: number, widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.BeforeDetach);

    // Remove the widget's node from the parent.
    this.parent.node.removeChild(widget.node);

    // Look up the next sibling reference node.
    let ref = this.parent.node.children[toIndex];

    // Insert the widget's node before the sibling.
    this.parent.node.insertBefore(widget.node, ref);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.AfterAttach);
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param index - The previous index of the widget in the layout.
   *
   * @param widget - The widget to detach from the parent.
   *
   * #### Notes
   * This method is called automatically by the panel layout at the
   * appropriate time. It should not be called directly by user code.
   *
   * The default implementation removes the widget's node from the
   * parent's node, and sends a `'before-detach'` message to the widget
   * if the parent is attached to the DOM.
   *
   * Subclasses may reimplement this method to control how the widget's
   * node is removed from the parent's node, but the reimplementation
   * must send a `'before-detach'` message to the widget if the parent
   * is attached to the DOM.
   */
  protected detachWidget(index: number, widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent.isAttached) sendMessage(widget, WidgetMessage.BeforeDetach);

    // Remove the widget's node from the parent.
    this.parent.node.removeChild(widget.node);
  }

  private _widgets = new Vector<Widget>();
}


/**
 * The namespace for the private module data.
 */
namespace Private {
  /**
   * Create a panel layout for the given panel options.
   */
  export
  function createLayout(options: Panel.IOptions): PanelLayout {
    return options.layout || new PanelLayout();
  }
}
