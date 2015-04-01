/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.panels {

import IMessage = core.IMessage;
import IDisposable = core.IDisposable;

import overrideCursor = domutil.overrideCursor;


/**
 * The class name added to SplitPanel instances.
 */
var SPLIT_PANEL_CLASS = 'p-SplitPanel';


/**
 * A panel which separates its children into resizable sections.
 *
 * This panel delegates to a permanently installed split layout and
 * can be used as a more convenient interface to a split layout.
 */
export
class SplitPanel extends Panel {
  /**
   * Construct a new split panel.
   */
  constructor(orientation = Orientation.Horizontal) {
    super();
    this.node.classList.add(SPLIT_PANEL_CLASS);
    this.layout = new SplitLayout(orientation);
    this.setFlag(PanelFlag.DisallowLayoutChange);
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
   * Get the number of child panels in the split panel.
   */
  get count(): number {
    return (<SplitLayout>this.layout).count;
  }

  /**
   * Get the normalized sizes of the children in the split panel.
   */
  sizes(): number[] {
    return (<SplitLayout>this.layout).sizes();
  }

  /**
   * Set the relative sizes for the split panel children.
   *
   * Extra values are ignored, too few will yield an undefined layout.
   */
  setSizes(sizes: number[]): void {
    (<SplitLayout>this.layout).setSizes(sizes);
  }

  /**
   * Get the index of the given panel.
   *
   * Returns -1 if the panel is not found.
   */
  indexOf(panel: Panel): number {
    return (<SplitLayout>this.layout).indexOf(panel);
  }

  /**
   * Get the panel at the given index.
   *
   * Returns `undefined` if there is no panel at the given index.
   */
  panelAt(index: number): Panel {
    return (<SplitLayout>this.layout).panelAt(index);
  }

  /**
   * Add a child panel to the end of the split panel.
   *
   * If the panel already exists, it will be moved.
   *
   * Returns the index of the added panel.
   */
  addPanel(panel: Panel): number {
    return (<SplitLayout>this.layout).addPanel(panel);
  }

  /**
   * Insert a child panel into the split panel at the given index.
   *
   * If the panel already exists, it will be moved.
   *
   * Returns the index of the added panel.
   */
  insertPanel(index: number, panel: Panel): number {
    return (<SplitLayout>this.layout).insertPanel(index, panel);
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
    this._pressData = { index: data.index, delta: delta, grab: grab };
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
    var data = this._pressData;
    var rect = this.node.getBoundingClientRect();
    var layout = <SplitLayout>this.layout;
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
   * Release the mouse grab for the splitter.
   */
  private _releaseMouse(): void {
    if (!this._pressData) {
      return;
    }
    this._pressData.grab.dispose();
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
  grab: IDisposable;
}

} // module phosphor.panels
