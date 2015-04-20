/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import IMessage = core.IMessage;

import IDisposable = utility.IDisposable;
import overrideCursor = utility.overrideCursor;


/**
 * The class name added to SplitPanel instances.
 */
var SPLIT_PANEL_CLASS = 'p-SplitPanel';


/**
 * A panel which arranges its children into resizable sections.
 */
export
class SplitPanel extends Panel {
  /**
   * Construct a new split panel.
   */
  constructor(orientation = Orientation.Horizontal) {
    super(new SplitLayout(orientation));
    this.node.classList.add(SPLIT_PANEL_CLASS);
  }

  /**
   * Dispose of the resources held by the panel.
   */
  dispose(): void {
    this._releaseMouse();
    super.dispose();
  }

  /**
   * Get the orientation of the split panel.
   */
  get orientation(): Orientation {
    return (<SplitLayout>this.layout).orientation;
  }

  /**
   * Set the orientation of the split panel.
   */
  set orientation(orient: Orientation) {
    (<SplitLayout>this.layout).orientation = orient;
  }

  /**
   * Get the size of the split handles.
   */
  get handleSize(): number {
    return (<SplitLayout>this.layout).handleSize;
  }

  /**
   * Set the the size of the split handles.
   */
  set handleSize(size: number) {
    (<SplitLayout>this.layout).handleSize = size;
  }

  /**
   * Get the normalized sizes of the widgets in the split panel.
   */
  sizes(): number[] {
    return (<SplitLayout>this.layout).sizes();
  }

  /**
   * Set the relative sizes for the split panel widgets.
   *
   * Extra values are ignored, too few will yield an undefined layout.
   */
  setSizes(sizes: number[]): void {
    (<SplitLayout>this.layout).setSizes(sizes);
  }

  /**
   * Add a child widget to the end of the split panel.
   *
   * If the widget already exists in the panel, it will be moved.
   *
   * Returns the index of the added widget.
   */
  addWidget(widget: Widget, stretch?: number, alignment?: Alignment): number {
    return (<SplitLayout>this.layout).addWidget(widget, stretch, alignment);
  }

  /**
   * Insert a child widget into the split panel at the given index.
   *
   * If the widget already exists in the panel, it will be moved.
   *
   * Returns the index of the added widget.
   */
  insertWidget(index: number, widget: Widget, stretch?: number, alignment?: Alignment): number {
    return (<SplitLayout>this.layout).insertWidget(index, widget, stretch, alignment);
  }

  /**
   * Get the stretch factor for the given widget or index.
   *
   * Returns -1 if the given widget or index is invalid.
   */
  stretch(which: Widget | number): number {
    return (<SplitLayout>this.layout).stretch(which);
  }

  /**
   * Set the stretch factor for the given widget or index.
   *
   * Returns true if the stretch was updated, false otherwise.
   */
  setStretch(which: Widget | number, stretch: number): boolean {
    return (<SplitLayout>this.layout).setStretch(which, stretch);
  }

  /**
   * A method invoked after the node is attached to the DOM.
   */
  protected onAfterAttach(msg: IMessage): void {
    this.node.addEventListener('mousedown', <any>this);
  }

  /**
   * A method invoked after the node is detached from the DOM.
   */
  protected onAfterDetach(msg: IMessage): void {
    this.node.removeEventListener('mousedown', <any>this);
  }

  /**
   * Handle the DOM events for the split panel.
   */
  protected handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(<MouseEvent>event);
      break;
    case 'mouseup':
      this._evtMouseUp(<MouseEvent>event);
      break;
    case 'mousemove':
      this._evtMouseMove(<MouseEvent>event);
      break;
    }
  }

  /**
   * Handle the 'mousedown' event for the split panel.
   */
  private _evtMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    var data = this._findHandle(<HTMLElement>event.target);
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
    var cursor = overrideCursor(window.getComputedStyle(node).cursor);
    this._pressData = { index: data.index, delta: delta, cursor: cursor };
  }

  /**
   * Handle the 'mouseup' event for the split panel.
   */
  private _evtMouseUp(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this._releaseMouse();
  }

  /**
   * Handle the 'mousemove' event for the split panel.
   */
  private _evtMouseMove(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    var pos: number;
    var data = this._pressData;
    var layout = <SplitLayout>this.layout;
    var rect = this.node.getBoundingClientRect();
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
  private _findHandle(target: HTMLElement): IHandleData {
    var layout = <SplitLayout>this.layout;
    for (var i = 0, n = layout.count; i < n; ++i) {
      var handle = layout.handleAt(i);
      if (handle.node.contains(target)) {
        return { index: i, handle: handle };
      }
    }
    return null;
  }

  /**
   * Release the mouse grab for the split panel.
   */
  private _releaseMouse(): void {
    if (!this._pressData) {
      return;
    }
    this._pressData.cursor.dispose();
    this._pressData = null;
    document.removeEventListener('mouseup', <any>this, true);
    document.removeEventListener('mousemove', <any>this, true);
  }

  private _pressData: IPressData = null;
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
  handle: SplitHandle;
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
  cursor: IDisposable;
}

} // module phosphor.widgets
