/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDisposable
} from '@phosphor/disposable';

import {
  IMessageHandler, Message, MessageLoop
} from '@phosphor/messaging';

import {
  Signal
} from '@phosphor/signaling';

import {
  DataGrid
} from './datagrid';


/**
 * A base class for implementing data grid event handlers.
 *
 * #### Notes
 * This class implements a small state machine, and dispatches events
 * to different handlers based on the current state. It should be a
 * sufficient starting point for most use cases. However, if this class
 * proves to be insufficient for a particular use case, an entirely new
 * class may be defined. The data grid has no direct dependency on this
 * `EventHandler` class.
 */
export
class EventHandler implements IDisposable, IMessageHandler {
  /**
   * Construct a new event handler object.
   *
   * @param options - The options for initializing the handler.
   */
  constructor(options: EventHandler.IOptions) {
    // Fetch the data grid.
    this.grid = options.grid;

    // Parse the rest of the options.
    if (options.resizableRows !== undefined) {
      this.resizableRows = options.resizableRows;
    } else {
      this.resizableRows = true;
    }
    if (options.resizableColumns !== undefined) {
      this.resizableColumns = options.resizableColumns;
    } else {
      this.resizableColumns = true;
    }
    if (options.resizableRowHeaders !== undefined) {
      this.resizableRowHeaders = options.resizableRowHeaders;
    } else {
      this.resizableRowHeaders = true;
    }
    if (options.resizableColumnHeaders !== undefined) {
      this.resizableColumnHeaders = options.resizableColumnHeaders;
    } else {
      this.resizableColumnHeaders = true;
    }

    // Tie the handler lifetime to the grid.
    this.grid.disposed.connect(() => { this.dispose(); });

    // Set up the viewport listeners.
    this.grid.viewport.node.addEventListener('keydown', this);
    this.grid.viewport.node.addEventListener('mousedown', this);
    this.grid.viewport.node.addEventListener('mousemove', this);
    this.grid.viewport.node.addEventListener('mouseleave', this);
    this.grid.viewport.node.addEventListener('contextmenu', this);

    // Set up the grid listeners.
    this.grid.node.addEventListener('wheel', this);

    // Set up the window listeners.
    window.addEventListener('resize', this);
  }

  /**
   * Dispose of the resources held by the event handler.
   */
  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this._disposed) {
      return;
    }

    // Flip the disposed flag.
    this._disposed = true;

    // Reset the state.
    this._state = 'default';

    // Ensure the document listeners are removed.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);

    // Remove the viewport listeners.
    this.grid.viewport.node.removeEventListener('keydown', this);
    this.grid.viewport.node.removeEventListener('mousedown', this);
    this.grid.viewport.node.removeEventListener('mousemove', this);
    this.grid.viewport.node.removeEventListener('mouseleave', this);
    this.grid.viewport.node.removeEventListener('contextmenu', this);

    // Remove the grid listeners.
    this.grid.node.removeEventListener('wheel', this);

    // Remove the window listeners.
    window.removeEventListener('resize', this);

    // Clear the signal and message data.
    Signal.clearData(this);
    MessageLoop.clearData(this);
  }

  /**
   * The data grid associated with this event handler.
   */
  readonly grid: DataGrid;

  /**
   * Whether the grid rows are resizable by the user.
   */
  readonly resizableRows: boolean;

  /**
   * Whether the grid columns are resizable by the user.
   */
  readonly resizableColumns: boolean;

  /**
   * Whether the grid row headers are resizable by the user.
   */
  readonly resizableRowHeaders: boolean;

  /**
   * Whether the grid column headers are resizable by the user.
   */
  readonly resizableColumnHeaders: boolean;

  /**
   * Whether the event handler is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * The current state of the event handler
   */
  get state(): EventHandler.State {
    return this._state;
  }

  /**
   *
   * @param msg
   */
  processMessage(msg: Message): void {

  }

  /**
   * Handle the DOM events for the data grid.
   *
   * @param event - The DOM event sent to the data grid.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the data grid's DOM node. It
   * should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseleave':
      this._evtMouseLeave(event as MouseEvent);
      break;
    case 'wheel':
      this._evtWheel(event as WheelEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'contextmenu':
      this._evtContextMenu(event as MouseEvent);
      break;
    case 'resize':
      this.grid.refreshDPI();
      break;
    }
  }

  /**
   * Get the cell part for a hit test result.
   *
   * @param hitTest - The data grid hit test result.
   *
   * @returns The cell part that was hit, or null.
   *
   * #### Notes
   * This method may be reimplemented by a subclass.
   */
  protected partForHitTest(hitTest: DataGrid.HitTestResult): EventHandler.CellPart | null {
    // Set up the result variable.
    let result: EventHandler.CellPart | null;

    // Fetch the behavior flags.
    let rr = this.resizableRows;
    let rc = this.resizableColumns;
    let rrh = this.resizableRowHeaders;
    let rch = this.resizableColumnHeaders;

    //
    let hs = 5;

    // Fetch the row and column.
    let r = hitTest.row;
    let c = hitTest.column;

    // Fetch the leading and trailing sizes.
    let lw = hitTest.x;
    let lh = hitTest.y;
    let tw = hitTest.width - hitTest.x;
    let th = hitTest.height - hitTest.y;

    // Dispatch based on hit test region.
    switch (hitTest.region) {
    case 'corner-header':
      if (c > 0 && rrh && lw <= hs) {
        result = 'left-resize-handle';
      } else if (rrh && tw <= hs) {
        result = 'right-resize-handle';
      } else if (r > 0 && rch && lh <= hs) {
        result = 'top-resize-handle';
      } else if (rch && th <= hs) {
        result = 'bottom-resize-handle';
      } else {
        result = 'body';
      }
      break;
    case 'column-header':
      if (c > 0 && rc && lw <= hs) {
        result = 'left-resize-handle';
      } else if (rc && tw <= hs) {
        result = 'right-resize-handle';
      } else if (r > 0 && rch && lh <= hs) {
        result = 'top-resize-handle';
      } else if (rch && th <= hs) {
        result = 'bottom-resize-handle';
      } else {
        result = 'body';
      }
      break;
    case 'row-header':
      if (c > 0 && rrh && lw <= hs) {
        result = 'left-resize-handle';
      } else if (rrh && tw <= hs) {
        result = 'right-resize-handle';
      } else if (r > 0 && rr && lh <= hs) {
        result = 'top-resize-handle';
      } else if (rr && th <= hs) {
        result = 'bottom-resize-handle';
      } else {
        result = 'body';
      }
      break;
    case 'body':
      result = 'body';
      break;
    case 'void':
      result = null;
      break;
    default:
      throw 'unreachable';
    }

    // Return the result.
    return result;
  }

  /**
   * Convert a cell part into a cursor for the grid.
   *
   * @param part - The cell part of interest.
   *
   * @returns The cursor for the given part.
   *
   * #### Notes
   * This method may be reimplemented by a subclass.
   */
  protected cursorForPart(part: EventHandler.CellPart): string {
    // Set up the cursor variable.
    let cursor: string;

    // Dispatch based on the part.
    switch (part) {
    case 'left-resize-handle':
    case 'right-resize-handle':
      cursor = 'ew-resize';
      break;
    case 'top-resize-handle':
    case 'bottom-resize-handle':
      cursor = 'ns-resize';
      break;
    case 'body':
      cursor = '';
      break;
    default:
      throw 'unreachable';
    }

    // Return the cursor.
    return cursor;
  }

  /**
   * Handle the mouse move event for the default state.
   *
   * @param event - The mouse event of interest.
   *
   * @param hitTest - The hit test at the current mouse position.
   *
   * #### Notes
   * The default implementation of this handler sets the mouse
   * cursor for the viewport, taking into account the various
   * behavior flags.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onMouseMove(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {
    // If the hit test failed, clear the viewport cursor.
    if (!hitTest) {
      this.grid.viewport.node.style.cursor = '';
      return;
    }

    // Get the cell part for the hit test.
    let part = this.partForHitTest(hitTest);

    // Update the viewport cursor based on the part.
    if (part === null) {
      this.grid.viewport.node.style.cursor = '';
    } else {
      this.grid.viewport.node.style.cursor = this.cursorForPart(part);
    }
  }

  /**
   * Handle the wheel event for the default state.
   *
   * @param event - The wheel event of interest.
   *
   * #### Notes
   * The defualt implementation scrolls the data grid.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onWheel(event: WheelEvent): void {
    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;

    // Convert the delta values to pixel values.
    switch (event.deltaMode) {
    case 0:  // DOM_DELTA_PIXEL
      break;
    case 1:  // DOM_DELTA_LINE
      let ds = this.grid.defaultSizes;
      dx *= ds.columnWidth;
      dy *= ds.rowHeight;
      break;
    case 2:  // DOM_DELTA_PAGE
      dx *= this.grid.pageWidth;
      dy *= this.grid.pageHeight;
      break;
    default:
      throw 'unreachable';
    }

    // Scroll by the desired amount.
    this.grid.scrollBy(dx, dy);
  }

  /**
   *
   */
  protected default_onContextMenu(event: MouseEvent): void {

  }

  /**
   *
   */
  protected resize_onMouseDown(event: MouseEvent, hitTest: DataGrid.HitTestResult): boolean {
    return false;
  }

  /**
   *
   */
  protected resize_onMouseMove(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected resize_onMouseUp(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected resize_onWheel(event: WheelEvent): void {

  }

  /**
   *
   */
  protected grab_onMouseDown(event: MouseEvent, hitTest: DataGrid.HitTestResult): boolean {
    return false;
  }

  /**
   *
   */
  protected grab_onMouseMove(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected grab_onMouseUp(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected grab_onWheel(event: WheelEvent): void {

  }

  /**
   *
   */
  protected select_onMouseDown(event: MouseEvent, hitTest: DataGrid.HitTestResult): boolean {
    return false;
  }

  /**
   *
   */
  protected select_onMouseMove(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected select_onMouseUp(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected select_onWheel(event: WheelEvent): void {

  }

  /**
   *
   */
  protected cell_onMouseDown(event: MouseEvent, hitTest: DataGrid.HitTestResult): boolean {
    return false;
  }

  /**
   *
   */
  protected cell_onMouseMove(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected cell_onMouseUp(event: MouseEvent, hitTest: DataGrid.HitTestResult | null): void {

  }

  /**
   *
   */
  protected cell_onWheel(event: WheelEvent): void {

  }

  /**
   * Handle the `'keydown'` event for the data grid.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // // Bail early if a drag is not in progress.
    // if (!this._pressData) {
    //   return;
    // }

    // // Stop input events during drag.
    // event.preventDefault();
    // event.stopPropagation();

    // // Repain the overlay and release if `Escape` is pressed.
    // if (event.keyCode === 27) {
    //   this._repaintOverlay();
    //   this._releaseMouse();
    // }
  }

  /**
   * Handle the `'mousedown'` event for the data grid.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Bail early if not in the default state.
    if (this._state !== 'default') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Do nothing if the left mouse button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Hit test the grid.
    let hitTest = this.grid.hitTest(event.clientX, event.clientY);

    // Bail early the hit test was out of bounds.
    if (!hitTest) {
      return;
    }

    // Determine which state to enter.
    let state: EventHandler.State;
    if (this.resize_onMouseDown(event, hitTest)) {
      state = 'resize';
    } else if (this.grab_onMouseDown(event, hitTest)) {
      state = 'grab';
    } else if (this.select_onMouseDown(event, hitTest)) {
      state = 'select';
    } else if (this.cell_onMouseDown(event, hitTest)) {
      state = 'cell';
    } else {
      state = 'default';
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Bail early if still in the default state.
    if (state === 'default') {
      return;
    }

    // Update the internal state.
    this._state = state;

    // Add the extra document listeners.
    document.addEventListener('keydown', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mousedown', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('contextmenu', this, true);
  }

  /**
   * Handle the `'mouseup'` event for the data grid.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Bail early if in the default state.
    if (this._state === 'default') {
      return;
    }

    // Do nothing if the left mouse button is not released.
    if (event.button !== 0) {
      return;
    }

    // Hit test the grid.
    let ht = this.grid.hitTest(event.clientX, event.clientY);

    // Dispatch based on the current mode.
    switch (this._state) {
    case 'resize':
      this.resize_onMouseUp(event, ht);
      break;
    case 'grab':
      this.grab_onMouseUp(event, ht);
      break;
    case 'select':
      this.select_onMouseUp(event, ht);
      break;
    case 'cell':
      this.cell_onMouseUp(event, ht);
      break;
    default:
      throw 'unreachable';
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Reset the state.
    this._state = 'default';

    // Remove the document listeners.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Handle the `'mousemove'` event for the data grid.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Hit test the grid.
    let hitTest = this.grid.hitTest(event.clientX, event.clientY);

    // Dispatch based on the current state.
    switch (this._state) {
    case 'default':
      this.default_onMouseMove(event, hitTest);
      break;
    case 'resize':
      this.resize_onMouseMove(event, hitTest);
      break;
    case 'grab':
      this.grab_onMouseMove(event, hitTest);
      break;
    case 'select':
      this.select_onMouseMove(event, hitTest);
      break;
    case 'cell':
      this.cell_onMouseMove(event, hitTest);
      break;
    default:
      throw 'unreachable';
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'mouseleave'` event for the data grid.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    if (this._state === 'default') {
      this.default_onMouseMove(event, null);
    }
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // Do nothing if the control key is held.
    if (event.ctrlKey) {
      return;
    }

    // Dispatch based on the state.
    switch (this._state) {
    case 'default':
      this.default_onWheel(event);
      break;
    case 'resize':
      this.resize_onWheel(event);
      break;
    case 'grab':
      this.grab_onWheel(event);
      break;
    case 'select':
      this.select_onWheel(event);
      break;
    case 'cell':
      this.cell_onWheel(event);
      break;
    default:
      throw 'unreachable';
    }

    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'contextmenu'` event for the data grid.
   */
  private _evtContextMenu(event: MouseEvent): void {
    if (this._state === 'default') {
      this.default_onContextMenu(event);
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private _disposed = false;
  private _state: EventHandler.State = 'default';
}


/**
 * The namespace for the `EventHandler` class statics.
 */
export
namespace EventHandler {
  /**
   * A type alias for the state of the event handler.
   */
  export
  type State = (
    /**
     * The default state.
     *
     * This is the state when no mouse button is pressed.
     */
    'default' |

    /**
     * The resize state.
     *
     * This is the state when resizing a section in the grid.
     */
    'resize' |

    /**
     * The grab state.
     *
     * This is the state when moving a section in the grid.
     */
    'grab' |

    /**
     * The select state.
     *
     * This is the state when selecting sells in the grid.
     */
    'select' |

    /**
     * The cell state.
     *
     * This is the state when interacting with a single cell.
     */
    'cell'
  );

  /**
   *
   */
  export
  type CellPart = (
    /**
     *
     */
    'top-resize-handle' |

    /**
     *
     */
    'left-resize-handle' |

    /**
     *
     */
    'right-resize-handle' |

    /**
     *
     */
    'bottom-resize-handle' |

    /**
     *
     */
    'body'
  );

  /**
   * An options object for initializing an event handler.
   */
  export
  interface IOptions {
    /**
     * The data grid to associated with the event handler.
     */
    grid: DataGrid;

    /**
     * Whether grid rows are resizable.
     *
     * The default is `true`.
     */
    resizableRows?: boolean;

    /**
     * Whether grid columns are resizable.
     *
     * The default is `true`.
     */
    resizableColumns?: boolean;

    /**
     * Whether grid row headers are resizable.
     *
     * The default is `true`.
     */
    resizableRowHeaders?: boolean;

    /**
     * Whether grid column headers are resizabe.
     *
     * The default is `true`.
     */
    resizableColumnHeaders?: boolean;
  }
}



  // /**
  //  * A message hook invoked on a viewport `'section-resize-request'` message.
  //  */
  // private _onViewportSectionResizeRequest(msg: Message): void {
  //   // Bail early if no drag is in progress.
  //   if (!this._pressData) {
  //     return;
  //   }

  //   // Extract the press data.
  //   let { hitTest, clientX, clientY } = this._pressData;

  //   // Convert the mouse position to local coordinates.
  //   let rect = this._viewport.node.getBoundingClientRect();
  //   let x = clientX - rect.left;
  //   let y = clientY - rect.top;

  //   // Fetch the details for the hit test part.
  //   let pos: number;
  //   let delta: number;
  //   let index: number;
  //   let list: SectionList;
  //   switch (hitTest.part) {
  //   case 'column-header-h-resize-handle':
  //     pos = x + this._scrollX - this.headerWidth;
  //     delta = hitTest.x;
  //     index = hitTest.column;
  //     list = this._columnSections;
  //     break;
  //   case 'row-header-v-resize-handle':
  //     pos = y + this._scrollY - this.headerHeight;
  //     delta = hitTest.y;
  //     index = hitTest.row;
  //     list = this._rowSections;
  //     break;
  //   case 'column-header-v-resize-handle':
  //   case 'corner-header-v-resize-handle':
  //     pos = y;
  //     delta = hitTest.y;
  //     index = hitTest.row;
  //     list = this._columnHeaderSections;
  //     break;
  //   case 'row-header-h-resize-handle':
  //   case 'corner-header-h-resize-handle':
  //     pos = x;
  //     delta = hitTest.x;
  //     index = hitTest.column;
  //     list = this._rowHeaderSections;
  //     break;
  //   default:
  //     return;
  //   }

  //   // Fetch the offset of the section to resize.
  //   let offset = list.offsetOf(index);

  //   // Bail if that section no longer exists.
  //   if (offset < 0) {
  //     return;
  //   }

  //   // Resize the section to the target size.
  //   this._resizeSection(list, index, pos - delta - offset);
  // }
