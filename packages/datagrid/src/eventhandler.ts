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
  Drag
} from '@phosphor/dragdrop';

import {
  IMessageHandler, Message, MessageLoop
} from '@phosphor/messaging';

import {
  Signal
} from '@phosphor/signaling';

import {
  DataGrid
} from './datagrid';

import {
  DataModel
} from './datamodel';


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
    if (options.resizeHandleSize !== undefined) {
      this.resizeHandleSize = Math.max(0, options.resizeHandleSize);
    } else {
      this.resizeHandleSize = 10;
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

    // Clear the resize data if needed.
    if (this.resizeData) {
      this.resizeData.override.dispose();
      this.resizeData = null;
    }

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
   * The size of a resize handle.
   */
  readonly resizeHandleSize: number;

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
   * Get the cell resize handle for a grid hit test result.
   *
   * @param hit - The grid hit test result.
   *
   * @returns The resize handle for the hit test.
   */
  protected resizeHandleForHitTest(hit: DataGrid.HitTestResult): EventHandler.ResizeHandle {
    // Fetch the behavior flags.
    let rr = this.resizableRows;
    let rc = this.resizableColumns;
    let rrh = this.resizableRowHeaders;
    let rch = this.resizableColumnHeaders;

    // Fetch the resize handle size.
    let rhs = Math.floor(this.resizeHandleSize / 2);

    // Fetch the row and column.
    let r = hit.row;
    let c = hit.column;

    // Fetch the leading and trailing sizes.
    let lw = hit.x;
    let lh = hit.y;
    let tw = hit.width - hit.x;
    let th = hit.height - hit.y;

    // Set up the result variable.
    let result: EventHandler.ResizeHandle;

    // Dispatch based on hit test region.
    switch (hit.region) {
    case 'corner-header':
      if (c > 0 && rrh && lw <= rhs) {
        result = 'left';
      } else if (rrh && tw <= rhs) {
        result = 'right';
      } else if (r > 0 && rch && lh <= rhs) {
        result = 'top';
      } else if (rch && th <= rhs) {
        result = 'bottom';
      } else {
        result = 'none';
      }
      break;
    case 'column-header':
      if (c > 0 && rc && lw <= rhs) {
        result = 'left';
      } else if (rc && tw <= rhs) {
        result = 'right';
      } else if (r > 0 && rch && lh <= rhs) {
        result = 'top';
      } else if (rch && th <= rhs) {
        result = 'bottom';
      } else {
        result = 'none';
      }
      break;
    case 'row-header':
      if (c > 0 && rrh && lw <= rhs) {
        result = 'left';
      } else if (rrh && tw <= rhs) {
        result = 'right';
      } else if (r > 0 && rr && lh <= rhs) {
        result = 'top';
      } else if (rr && th <= rhs) {
        result = 'bottom';
      } else {
        result = 'none';
      }
      break;
    case 'body':
      result = 'none';
      break;
    case 'void':
      result = 'none';
      break;
    default:
      throw 'unreachable';
    }

    // Return the result.
    return result;
  }

  /**
   * Handle the key down event for the `'default'` state.
   *
   * @param event - The keyboard event of interest.
   *
   * ##### Notes
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onKeyDown(event: KeyboardEvent): void { }

  /**
   * Handle the mouse move event for the `'default'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this handler sets the mouse
   * cursor for the viewport, taking into account the various
   * behavior flags.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onMouseMove(event: MouseEvent): void {
    // Hit test the grid.
    let hit = this.grid.hitTest(event.clientX, event.clientY);

    // If the hit test failed, clear the viewport cursor.
    if (!hit) {
      this.grid.viewport.node.style.cursor = '';
      return;
    }

    // TODO alt cursor

    // TODO move cursor

    // Get the resize handle for the hit test.
    let handle = this.resizeHandleForHitTest(hit);

    // Fetch the cursor for the handle.
    let cursor = Private.cursorForHandle(handle);

    // Update the viewport cursor based on the part.
    this.grid.viewport.node.style.cursor = cursor;
  }

  /**
   * Handle the mouse leave event for the `'default'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this handler clears the
   * viewport cursor.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onMouseLeave(event: MouseEvent): void {
    this.grid.viewport.node.style.cursor = '';
  }

  /**
   * Handle the mouse down event for the `'default'` state.
   *
   * @param event - The mouse event of interest.
   *
   * @returns The new state for the handler.
   *
   * #### Notes
   * This method determines the new state for the handler, based
   * on where the mouse was pressed. If a state change results,
   * the mouse down handler for the new state will also be called.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onMouseDown(event: MouseEvent): EventHandler.State {
    // Hit test the grid.
    let hit = this.grid.hitTest(event.clientX, event.clientY);

    // Bail early if the hit test was out of bounds.
    if (hit === null) {
      return 'default';
    }

    // Bail early if the hit was in the void region.
    if (hit.region === 'void') {
      return 'default';
    }

    // Transition to the alternate mode if the alt key is held.
    if (event.altKey) {
      return 'alt';
    }

    // move transition

    // Get the resize handle for the hit test.
    let handle = this.resizeHandleForHitTest(hit);

    // Transition to the resize mode if possible.
    if (handle !== 'none') {
      return 'resize';
    }

    // Otherwise, transition to the select mode.
    return 'select';
  }

  /**
   * Handle the wheel event for the `'default'` state.
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
   * Handle the context menu event for the `'default'` state.
   *
   * @param event - The context menu event of interest.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   *
   * This method may be reimplemented by a subclass.
   */
  protected default_onContextMenu(event: MouseEvent): void { }

  /**
   * The temporary data stored during the resize state.
   */
  protected resizeData: EventHandler.ResizeData | null = null;

  /**
   * Handle the mouse down event for the `'resize'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this method initializes a resize.
   *
   * This method may be reimplemented by a subclass.
   */
  protected resize_onMouseDown(event: MouseEvent): void {
    // Unpack the event.
    let { clientX, clientY } = event;

    // Hit test the grid.
    let hit = this.grid.hitTest(clientX, clientY);

    // Test for invalid state.
    if (!hit || hit.region === 'void' || hit.region === 'body') {
      console.warn('invalid resize state');
      return;
    }

    // Convert the hit test into a part.
    let handle = this.resizeHandleForHitTest(hit);

    // Test for invalid state.
    if (handle === 'none') {
      console.warn('invalid resize state');
      return;
    }

    // Set up the temporary resize data.
    if (handle === 'left' || handle === 'right' ) {
      // Set up the resize data type.
      let type: 'column' = 'column';

      // Determine the column region.
      let region: DataModel.ColumnRegion = (
        hit.region === 'column-header' ? 'body' : 'row-header'
      );

      // Determine the section index.
      let index = handle === 'left' ? hit.column - 1 : hit.column;

      // Fetch the section size.
      let size = this.grid.columnSize(region, index);

      // Override the document cursor.
      let override = Drag.overrideCursor('ew-resize');

      // Create the temporary resize data.
      this.resizeData = { type, region, index, size, clientX, override };
    } else {
      // Set up the resize data type.
      let type: 'row' = 'row';

      // Determine the row region.
      let region: DataModel.RowRegion = (
        hit.region === 'row-header' ? 'body' : 'column-header'
      );

      // Determine the section index.
      let index = handle === 'top' ? hit.row - 1 : hit.row;

      // Fetch the section size.
      let size = this.grid.rowSize(region, index);

      // Override the document cursor.
      let override = Drag.overrideCursor('ns-resize');

      // Create the temporary resize data.
      this.resizeData = { type, region, index, size, clientY, override };
    }
  }

  /**
   * Handle the mouse move event for the `'resize'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this method executes a resize.
   *
   * This method may be reimplemented by a subclass.
   */
  protected resize_onMouseMove(event: MouseEvent): void {
    // Fetch the resize data.
    let data = this.resizeData;

    // Test for invalid state.
    if (!data) {
      console.warn('invalid resize state');
      return;
    }

    // Dispatch to the proper grid resize method.
    if (data.type === 'row') {
      let dy = event.clientY - data.clientY;
      this.grid.resizeRow(data.region, data.index, data.size + dy);
    } else {
      let dx = event.clientX - data.clientX;
      this.grid.resizeColumn(data.region, data.index, data.size + dx);
    }
  }

  /**
   * Handle the mouse down event for the `'resize'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this method finalizes a resize.
   *
   * This method may be reimplemented by a subclass.
   */
  protected resize_onMouseUp(event: MouseEvent): void {
    // Test for invalid state.
    if (!this.resizeData) {
      console.warn('invalid resize state');
      return;
    }

    // Dispose of the cursor override.
    this.resizeData.override.dispose();

    // Clear the resize data.
    this.resizeData = null;
  }

  /**
   * Handle the wheel event for the `'resize'` state.
   *
   * @param event - The wheel event of interest.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   *
   * This method may be reimplemented by a subclass.
   */
  protected resize_onWheel(event: WheelEvent): void { }

  /**
   *
   */
  protected move_onMouseDown(event: MouseEvent): void { }

  /**
   *
   */
  protected move_onMouseMove(event: MouseEvent): void { }

  /**
   *
   */
  protected move_onMouseUp(event: MouseEvent): void { }

  /**
   *
   */
  protected move_onWheel(event: WheelEvent): void { }

  /**
   *
   */
  protected select_onMouseDown(event: MouseEvent): void { }

  /**
   *
   */
  protected select_onMouseMove(event: MouseEvent): void { }

  /**
   *
   */
  protected select_onMouseUp(event: MouseEvent): void { }

  /**
   *
   */
  protected select_onWheel(event: WheelEvent): void { }

  /**
   * Handle the mouse down event for the `'alt'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   *
   * This method may be reimplemented by a subclass.
   */
  protected alt_onMouseDown(event: MouseEvent): void { }

  /**
   * Handle the mouse move event for the `'alt'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   *
   * This method may be reimplemented by a subclass.
   */
  protected alt_onMouseMove(event: MouseEvent): void { }

  /**
   * Handle the mouse up event for the `'alt'` state.
   *
   * @param event - The mouse event of interest.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   *
   * This method may be reimplemented by a subclass.
   */
  protected alt_onMouseUp(event: MouseEvent): void { }

  /**
   * Handle the wheel event for the `'alt'` state.
   *
   * @param event - The wheel event of interest.
   *
   * #### Notes
   * The default implementation of this method is a no-op.
   *
   * This method may be reimplemented by a subclass.
   */
  protected alt_onWheel(event: WheelEvent): void { }

  /**
   * Handle the `'keydown'` event for the data grid.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    if (this._state === 'default') {
      this.default_onKeyDown(event);
    } else {
      event.preventDefault();
      event.stopPropagation();
    }
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

    // Determine which state to enter.
    let state = this.default_onMouseDown(event);

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Bail early if still in the default state.
    if (state === 'default') {
      return;
    }

    // Update the internal state.
    this._state = state;

    // Dispatch based on the current state.
    switch (state) {
    case 'resize':
      this.resize_onMouseDown(event);
      break;
    case 'move':
      this.move_onMouseDown(event);
      break;
    case 'select':
      this.select_onMouseDown(event);
      break;
    case 'alt':
      this.alt_onMouseDown(event);
      break;
    default:
      throw 'unreachable';
    }

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

    // Dispatch based on the current mode.
    switch (this._state) {
    case 'resize':
      this.resize_onMouseUp(event);
      break;
    case 'move':
      this.move_onMouseUp(event);
      break;
    case 'select':
      this.select_onMouseUp(event);
      break;
    case 'alt':
      this.alt_onMouseUp(event);
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
    // Dispatch based on the current state.
    switch (this._state) {
    case 'default':
      this.default_onMouseMove(event);
      break;
    case 'resize':
      this.resize_onMouseMove(event);
      break;
    case 'move':
      this.move_onMouseMove(event);
      break;
    case 'select':
      this.select_onMouseMove(event);
      break;
    case 'alt':
      this.alt_onMouseMove(event);
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
      this.default_onMouseLeave(event);
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
    case 'move':
      this.move_onWheel(event);
      break;
    case 'select':
      this.select_onWheel(event);
      break;
    case 'alt':
      this.alt_onWheel(event);
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
     * The move state.
     *
     * This is the state when moving a section in the grid.
     */
    'move' |

    /**
     * The select state.
     *
     * This is the state when selecting cells in the grid.
     */
    'select' |

    /**
     * The alternate state.
     *
     * This is the state when the `alt` key is held.
     */
    'alt'
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

    /**
     * The size of a section resize handle.
     *
     * The default is `10`.
     */
    resizeHandleSize?: number;
  }

  /**
   * A type alias for a cell resize handle.
   */
  export
  type ResizeHandle = 'top' | 'left' | 'right' | 'bottom' | 'none';

  /**
   * A type alias for the row resize data.
   */
  export
  type RowResizeData = {
    /**
     * The descriminated type for the data.
     */
    type: 'row';

    /**
     * The row region which holds the section being resized.
     */
    region: DataModel.RowRegion;

    /**
     * The index of the section being resized.
     */
    index: number;

    /**
     * The original size of the section.
     */
    size: number;

    /**
     * The original client Y position of the mouse.
     */
    clientY: number;

    /**
     * The disposable to clear the cursor override.
     */
    override: IDisposable;
  };

  /**
   * A type alias for the column resize data.
   */
  export
  type ColumnResizeData = {
    /**
     * The descriminated type for the data.
     */
    type: 'column';

    /**
     * The column region which holds the section being resized.
     */
    region: DataModel.ColumnRegion;

    /**
     * The index of the section being resized.
     */
    index: number;

    /**
     * The original size of the section.
     */
    size: number;

    /**
     * The original client X position of the mouse.
     */
    clientX: number;

    /**
     * The disposable to clear the cursor override.
     */
    override: IDisposable;
  };

  /**
   * A type alias for the event handler resize data.
   */
  export
  type ResizeData = RowResizeData | ColumnResizeData;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Convert a resize handle into a cursor.
   */
  export
  function cursorForHandle(handle: EventHandler.ResizeHandle): string {
    return cursorMap[handle];
  }

  /**
   * A mapping of resize handle to cursor.
   */
  const cursorMap = {
    top: 'ns-resize',
    left: 'ew-resize',
    right: 'ew-resize',
    bottom: 'ns-resize',
    none: ''
  };
}
