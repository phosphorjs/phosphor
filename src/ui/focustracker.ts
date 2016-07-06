/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  each, filter
} from '../algorithm/iteration';

import {
  indexOf, max
} from '../algorithm/searching';

import {
  ISequence
} from '../algorithm/sequence';

import {
  Vector
} from '../collections/vector';

import {
  IDisposable
} from '../core/disposable';

import {
  ISignal, clearSignalData, defineSignal
} from '../core/signaling';

import {
  Widget
} from './widget';


/**
 * A class which tracks focus among a set of widgets.
 *
 * This class is useful when code needs to keep track of the most
 * recently focused widget(s) among a set of related widgets.
 */
export
class FocusTracker<T extends Widget> implements IDisposable {
  /**
   * Construct a new focus tracker.
   */
  constructor() { }

  /**
   * Dispose of the resources held by the tracker.
   */
  dispose(): void {
    // Do nothing if the tracker is already disposed.
    if (this._counter < 0) {
      return;
    }

    // Mark the tracker as disposed.
    this._counter = -1;

    // Clear the connections for the tracker.
    clearSignalData(this);

    // Remove all event listeners.
    each(this._widgets, widget => {
      widget.node.removeEventListener('focus', this, true);
    });

    // Clear the internal data structures.
    this._activeWidget = null;
    this._nodes.clear();
    this._numbers.clear();
    this._widgets.clear();
  }

  /**
   * A signal emitted when the active widget has changed.
   */
  activeWidgetChanged: ISignal<FocusTracker<T>, FocusTracker.IActiveWidgetChangedArgs<T>>;

  /**
   * A flag indicated whether the tracker is disposed.
   *
   * #### Notes
   * This is a read-only property.
   */
  get isDisposed(): boolean {
    return this._counter < 0;
  }

  /**
   * The currently active widget.
   *
   * #### Notes
   * The active widget is the widget among the tracked widgets which
   * has the *descendant node* which has most recently been focused.
   *
   * The active widget will not be updated if the node loses focus. It
   * will only be updated when a different tracked widget gains focus.
   *
   * If the active widget is removed from the tracker, the previously
   * active widget will be restored.
   *
   * This behavior is intended to follow a user's conceptual model of
   * a semantically "active" widget, where the "last thing of type X"
   * to be interacted with is the "active instance of X", regardless
   * of whether that instance still has focus.
   *
   * This will be `null` if there is no active widget.
   *
   * This is a read-only property.
   */
  get activeWidget(): T {
    return this._activeWidget;
  }

  /**
   * A read only sequence of the widgets being tracked.
   *
   * #### Notes
   * This is a read-only property.
   */
  get widgets(): ISequence<T> {
    return this._widgets;
  }

  /**
   * Get the focus number for a particular widget in the tracker.
   *
   * @param widget - The widget of interest.
   *
   * @returns The focus number for the given widget, or `-1` if the
   *   widget has not had focus since being added to the tracker.
   *
   * #### Notes
   * The focus number indicates the relative order in which the widgets
   * have gained focus. A widget with a larger number has gained focus
   * more recently than a widget with a smaller number.
   *
   * The `activeWidget` will always have the largest focus number.
   *
   * All widgets start with a focus number of `-1`, which indicates that
   * the widget has not been focused since being added to the tracker.
   *
   * #### Undefined Behavior
   * A `widget` which is not contained in the tracker.
   */
  focusNumber(widget: T): number {
    return this._numbers.get(widget);
  }

  /**
   * Test whether the focus tracker contains a given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns `true` if the widget is tracked, `false` otherwise.
   */
  has(widget: T): boolean {
    return this._numbers.has(widget);
  }

  /**
   * Add a widget to the focus tracker.
   *
   * @param widget - The widget of interest.
   *
   * #### Notes
   * If the widget is currently focused, it will automatically become
   * the new `activeWidget`.
   *
   * A widget will be automatically removed from the tracker if it
   * is disposed after being added.
   *
   * If the widget is already tracked, this is a no-op.
   */
  add(widget: T): void {
    // Do nothing if the widget is already tracked.
    if (this._numbers.has(widget)) {
      return;
    }

    // Test whether this widget has focus.
    let focused = widget.node.contains(document.activeElement);

    // Setup the initial focus number.
    let n = focused ? this._counter++ : -1;

    // Add the widget to the internal data structures.
    this._numbers.set(widget, n);
    this._widgets.pushBack(widget);
    this._nodes.set(widget.node, widget);

    // Setup the focus event listener. The capturing phase must
    // be used since the 'focus' event doesn't bubble and since
    // firefox doesn't support the 'focusin' event.
    widget.node.addEventListener('focus', this, true);

    // Connect the disposed signal handler.
    widget.disposed.connect(this._onWidgetDisposed, this);

    // Update the active widget if the new widget has focus.
    if (focused) this._setActiveWidget(widget);
  }

  /**
   * Remove a widget from the focus tracker.
   *
   * #### Notes
   * If the widget is the `activeWidget`, the previously active widget
   * will become the new `activeWidget`.
   *
   * A widget will be automatically removed from the tracker if it
   * is disposed after being added.
   *
   * If the widget is not tracked, this is a no-op.
   */
  remove(widget: T): void {
    // Do nothing if the widget is not tracked.
    if (!this._numbers.has(widget)) {
      return;
    }

    // Disconnect the disposed signal handler.
    widget.disposed.disconnect(this._onWidgetDisposed, this);

    // Remove the focus event listener.
    widget.node.removeEventListener('focus', this, true);

    // Remove the widget from the internal data structures.
    this._widgets.remove(indexOf(this._widgets, widget));
    this._nodes.delete(widget.node);
    this._numbers.delete(widget);

    // If the widget is not the active widget, we're done.
    if (this._activeWidget !== widget) {
      return;
    }

    // Otherwise, filter the widgets for those which have had focus.
    let valid = filter(this._widgets, w => this._numbers.get(w) !== -1);

    // Get the valid widget with the max focus number.
    let previous = max(valid, (first, second) => {
      let a = this._numbers.get(first);
      let b = this._numbers.get(second);
      return a - b;
    }) || null;

    // Finally, update the active widget.
    this._setActiveWidget(previous);
  }

  /**
   * Handle the DOM events for the focus tracker.
   *
   * @param event - The DOM event sent to the panel.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the tracked nodes. It should
   * not be called directly by user code.
   */
  handleEvent(event: Event): void {
    if (event.type === 'focus') {
      this._evtFocus(event);
    }
  }

  /**
   * Set the active widget for the tracker.
   */
  private _setActiveWidget(widget: T): void {
    // Do nothing if there is no change.
    if (this._activeWidget === widget) {
      return;
    }

    // Swap the active widget.
    let old = this._activeWidget;
    this._activeWidget = widget;

    // Emit the changed signal.
    this.activeWidgetChanged.emit({ oldValue: old, newValue: widget });
  }

  /**
   * Handle the `'focus'` event for a tracked widget.
   */
  private _evtFocus(event: Event): void {
    // Find the widget which gained focus.
    let widget = this._nodes.get(event.currentTarget as HTMLElement);

    // Update the focus number for the widget.
    this._numbers.set(widget, this._counter++);

    // Update the active widget.
    this._setActiveWidget(widget);
  }

  /**
   * Handle the `disposed` signal for a tracked widget.
   */
  private _onWidgetDisposed(sender: T): void {
    this.remove(sender);
  }

  private _counter = 0;
  private _activeWidget: T = null;
  private _widgets = new Vector<T>();
  private _numbers = new Map<T, number>();
  private _nodes = new Map<HTMLElement, T>();
}


// Define the signals for the `FocusTracker` class.
defineSignal(FocusTracker.prototype, 'activeWidgetChanged');


/**
 * The namespace for the `FocusTracker` class statics.
 */
export
namespace FocusTracker {
  /**
   * An arguments object for the `activeWidgetChanged` signal.
   */
  export
  interface IActiveWidgetChangedArgs<T extends Widget> {
    /**
     * The old value for the `activeWidget`, or `null`.
     */
    oldValue: T;

    /**
     * The new value for the `activeWidget`, or `null`.
     */
    newValue: T;
  }
}
