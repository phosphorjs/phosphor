/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import ICoreEvent = require('../core/ICoreEvent');
import IDisposable = require('../core/IDisposable');

import overrideCursor = require('../dom/overrideCursor');

import Alignment = require('./Alignment');
import Orientation = require('./Orientation');
import SplitterHandle = require('./SplitterHandle');
import SplitterLayout = require('./SplitterLayout');
import Widget = require('./Widget');
import WidgetFlag = require('./WidgetFlag');

export = Splitter;


/**
 * The class name added to Splitter instances.
 */
var SPLITTER_CLASS = 'p-Splitter';


/**
 * A widget which separates its children into resizable sections.
 */
class Splitter extends Widget {
  /**
   * Construct a new splitter.
   */
  constructor(orientation = Orientation.Horizontal) {
    super();
    this.classList.add(SPLITTER_CLASS);
    this.layout = new SplitterLayout(orientation);
    this.setFlag(WidgetFlag.DisallowLayoutChange);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._releaseMouse();
    super.dispose();
  }

  /**
   * Get the orientation of the splitter.
   */
  get orientation(): Orientation {
    return (<SplitterLayout>this.layout).orientation;
  }

  /**
   * Set the orientation of the splitter.
   */
  set orientation(value: Orientation) {
    (<SplitterLayout>this.layout).orientation = value;
  }

  /**
   * Get the size of the splitter handles.
   */
  get handleSize(): number {
    return (<SplitterLayout>this.layout).handleSize;
  }

  /**
   * Set the the size of the splitter handles.
   */
  set handleSize(size: number) {
    (<SplitterLayout>this.layout).handleSize = size;
  }

  /**
   * Get the number of widgets in the splitter.
   */
  get count(): number {
    return (<SplitterLayout>this.layout).count;
  }

  /**
   * Get the normalized sizes of the items in the splitter.
   */
  sizes(): number[] {
    return (<SplitterLayout>this.layout).sizes();
  }

  /**
   * Set the relative sizes for the splitter items.
   *
   * Extra values are ignored, too few will yield an undefined layout.
   */
  setSizes(sizes: number[]): void {
    (<SplitterLayout>this.layout).setSizes(sizes);
  }

  /**
   * Get the splitter handle at the given index.
   */
  handleAt(index: number): SplitterHandle {
    return (<SplitterLayout>this.layout).handleAt(index);
  }

  /**
   * Get the widget at the given index.
   */
  widgetAt(index: number): Widget {
    return (<SplitterLayout>this.layout).widgetAt(index);
  }

  /**
   * Get the index of the given widget.
   */
  widgetIndex(widget: Widget): number {
    return (<SplitterLayout>this.layout).widgetIndex(widget);
  }

  /**
   * Add a child widget to the end of the splitter.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget, stretch = 0, alignment: Alignment = 0): number {
    return (<SplitterLayout>this.layout).addWidget(widget, stretch, alignment);
  }

  /**
   * Insert a child widget into the splitter at the given index.
   *
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget, stretch = 0, alignment: Alignment = 0): number {
    return (<SplitterLayout>this.layout).insertWidget(index, widget, stretch, alignment);
  }

  /**
   * Move a child widget from one index to another.
   *
   * Returns the new index of the widget.
   */
  moveWidget(fromIndex: number, toIndex: number): number {
    return (<SplitterLayout>this.layout).moveItem(fromIndex, toIndex);
  }

  /**
   * Remove a widget from the splitter and set its parent to null.
   *
   * This is equivalent to simply setting the widget parent to null,
   * except that it returns the index that the widget occupied.
   *
   * If the widget is not a child of the splitter, this returns -1.
   */
  removeWidget(widget: Widget): number {
    if (widget.parent !== this) {
      return -1;
    }
    var index = this.widgetIndex(widget);
    widget.parent = null;
    return index;
  }

  /**
   * Get the stretch factor for the widget at the given index.
   *
   * Returns -1 if the index is out of range.
   */
  stretchAt(index: number): number {
    return (<SplitterLayout>this.layout).stretchAt(index);
  }

  /**
   * Set the stretch factor for the widget at the given index.
   */
  setStretch(index: number, stretch: number): void {
    (<SplitterLayout>this.layout).setStretch(index, stretch);
  }

  /**
   * Get the alignment for the given widget.
   *
   * Returns 0 if the widget is not in the layout.
   */
  alignmentFor(widget: Widget): Alignment {
    return (<SplitterLayout>this.layout).alignmentFor(widget);
  }

  /**
   * Set the alignment for the given widget.
   *
   * If the widget is not in the layout, this is a no-op.
   */
  setAlignment(widget: Widget, alignment: Alignment): void {
    (<SplitterLayout>this.layout).setAlignment(widget, alignment);
  }

  /**
   * A method invoked after the node is attached to the DOM.
   */
  protected afterAttachEvent(event: ICoreEvent): void {
    this.node.addEventListener('mousedown', <any>this);
  }

  /**
   * A method invoked after the node is detached from the DOM.
   */
  protected afterDetachEvent(event: ICoreEvent): void {
    this.node.removeEventListener('mousedown', <any>this);
  }

  /**
   * Handle the DOM events for the splitter.
   */
  protected handleEvent(event: Event): void {
    switch (event.type) {
      case 'mousedown':
        this.domEvent_mousedown(<MouseEvent>event);
        break;
      case 'mouseup':
        this.domEvent_mouseup(<MouseEvent>event);
        break;
      case 'mousemove':
        this.domEvent_mousemove(<MouseEvent>event);
        break;
      default:
        break;
    }
  }

  /**
   * Handle the 'mousedown' event for the splitter.
   */
  protected domEvent_mousedown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    var data = this._findHandle(event.target);
    if (!data) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    document.addEventListener('mouseup', <any>this, true);
    document.addEventListener('mousemove', <any>this, true);
    var delta: number;
    var node = data.handle.node;
    var rect = node.getBoundingClientRect();
    if (this.orientation === Orientation.Horizontal) {
      delta = event.clientX - rect.left;
    } else {
      delta = event.clientY - rect.top;
    }
    var grab = overrideCursor(window.getComputedStyle(node).cursor);
    this._m_pressData = { index: data.index, delta: delta, grab: grab };
  }

  /**
   * Handle the 'mouseup' event for the splitter.
   */
  protected domEvent_mouseup(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._releaseMouse();
  }

  /**
   * Handle the 'mousemove' event for the splitter.
   */
  protected domEvent_mousemove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    var pos: number;
    var data = this._m_pressData;
    var rect = this.node.getBoundingClientRect();
    var layout = <SplitterLayout>this.layout;
    if (layout.orientation === Orientation.Horizontal) {
      pos = event.clientX - data.delta - rect.left;
    } else {
      pos = event.clientY - data.delta - rect.top;
    }
    layout.moveHandle(data.index, pos);
  }

  /**
   * Find the index of the handle which contains a target element.
   */
  private _findHandle(target: any): IHandleData {
    var layout = <SplitterLayout>this.layout;
    for (var i = 0, n = layout.count; i < n; ++i) {
      var handle = layout.handleAt(i);
      if (handle.node.contains(target)) {
        return { index: i, handle: handle };
      }
    }
    return null;
  }

  /**
   * Release the mouse grab for the splitter.
   */
  private _releaseMouse(): void {
    if (!this._m_pressData) {
      return;
    }
    this._m_pressData.grab.dispose();
    this._m_pressData = null;
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);
  }

  private _m_pressData: IPressData = null;
}


/**
 * An object which holds a handle and its index.
 */
interface IHandleData {
  /**
   * The index of the handle.
   */
  index: number;

  /**
   * The handle.
   */
  handle: SplitterHandle;
}


/**
 * An object which holds mouse press data.
 */
interface IPressData {
  /**
   * The index of the pressed handle.
   */
  index: number;

  /**
   * The offset of the press in handle coordinates.
   */
  delta: number;

  /**
   * The disposable which will clear the override cursor.
   */
  grab: IDisposable;
}
