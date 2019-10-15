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
  Platform
} from '@phosphor/domutils';

import {
  Drag
} from '@phosphor/dragdrop';

import {
  DataGrid
} from './datagrid';

import {
  DataModel, MutableDataModel
} from './datamodel';

import {
  SelectionModel
} from './selectionmodel';
import { ICellEditResponse } from './celleditor';

/**
 * A basic implementation of a data grid mouse handler.
 *
 * #### Notes
 * This class may be subclassed and customized as needed.
 */
export
class BasicMouseHandler implements DataGrid.IMouseHandler {
  /**
   * Dispose of the resources held by the mouse handler.
   */
  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this._disposed) {
      return;
    }

    // Release any held resources.
    this.release();

    // Mark the handler as disposed.
    this._disposed = true;
  }

  /**
   * Whether the mouse handler is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Release the resources held by the handler.
   */
  release(): void {
    // Bail early if the is no press data.
    if (!this._pressData) {
      return;
    }

    // Clear the autoselect timeout.
    if (this._pressData.type === 'select') {
      this._pressData.timeout = -1;
    }

    // Clear the press data.
    this._pressData.override.dispose();
    this._pressData = null;
  }

  /**
   * Handle the mouse hover event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse hover event of interest.
   */
  onMouseHover(grid: DataGrid, event: MouseEvent): void {
    // Hit test the grid.
    let hit = grid.hitTest(event.clientX, event.clientY);

    // Get the resize handle for the hit test.
    let handle = Private.resizeHandleForHitTest(hit);

    // Fetch the cursor for the handle.
    let cursor = Private.cursorForHandle(handle);

    // Update the viewport cursor based on the part.
    grid.viewport.node.style.cursor = cursor;

    // TODO support user-defined hover items
  }

  /**
   * Handle the mouse leave event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse hover event of interest.
   */
  onMouseLeave(grid: DataGrid, event: MouseEvent): void {
    // TODO support user-defined hover popups.

    // Clear the viewport cursor.
    grid.viewport.node.style.cursor = '';
  }

  /**
   * Handle the mouse down event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse down event of interest.
   */
  onMouseDown(grid: DataGrid, event: MouseEvent): void {
    // Unpack the event.
    let { clientX, clientY } = event;

    // Hit test the grid.
    let hit = grid.hitTest(clientX, clientY);

    // Unpack the hit test.
    let { region, row, column } = hit;

    // Bail if the hit test is on an uninteresting region.
    if (region === 'void') {
      return;
    }

    // Fetch the modifier flags.
    let shift = event.shiftKey;
    let accel = Platform.accelKey(event);

    // If the hit test is the body region, the only option is select.
    if (region === 'body') {
      // Fetch the selection model.
      let model = grid.selectionModel;

      // Bail early if there is no selection model.
      if (!model) {
        return;
      }

      // Override the document cursor.
      let override = Drag.overrideCursor('default');

      // Set up the press data.
      this._pressData = {
        type: 'select', region, row, column, override,
        localX: -1, localY: -1, timeout: -1
      };

      // Set up the selection variables.
      let r1: number;
      let c1: number;
      let r2: number;
      let c2: number;
      let cursorRow: number;
      let cursorColumn: number;
      let clear: SelectionModel.ClearMode;

      // Accel == new selection, keep old selections.
      if (accel) {
        r1 = row;
        r2 = row;
        c1 = column;
        c2 = column;
        cursorRow = row;
        cursorColumn = column;
        clear = 'none';
      } else if (shift) {
        r1 = model.cursorRow;
        r2 = row;
        c1 = model.cursorColumn;
        c2 = column;
        cursorRow = model.cursorRow;
        cursorColumn = model.cursorColumn;
        clear = 'current';
      } else {
        r1 = row;
        r2 = row;
        c1 = column;
        c2 = column;
        cursorRow = row;
        cursorColumn = column;
        clear = 'all';
      }

      // Make the selection.
      model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });

      // Done.
      return;
    }

    // Otherwise, the hit test is on a header region.

    // Convert the hit test into a part.
    let handle = Private.resizeHandleForHitTest(hit);

    // Fetch the cursor for the handle.
    let cursor = Private.cursorForHandle(handle);

    // Handle horizontal resize.
    if (handle === 'left' || handle === 'right' ) {
      // Set up the resize data type.
      let type: 'column-resize' = 'column-resize';

      // Determine the column region.
      let rgn: DataModel.ColumnRegion = (
        region === 'column-header' ? 'body' : 'row-header'
      );

      // Determine the section index.
      let index = handle === 'left' ? column - 1 : column;

      // Fetch the section size.
      let size = grid.columnSize(rgn, index);

      // Override the document cursor.
      let override = Drag.overrideCursor(cursor);

      // Create the temporary press data.
      this._pressData = { type, region: rgn, index, size, clientX, override };

      // Done.
      return;
    }

    // Handle vertical resize
    if (handle === 'top' || handle === 'bottom') {
      // Set up the resize data type.
      let type: 'row-resize' = 'row-resize';

      // Determine the row region.
      let rgn: DataModel.RowRegion = (
        region === 'row-header' ? 'body' : 'column-header'
      );

      // Determine the section index.
      let index = handle === 'top' ? row - 1 : row;

      // Fetch the section size.
      let size = grid.rowSize(rgn, index);

      // Override the document cursor.
      let override = Drag.overrideCursor(cursor);

      // Create the temporary press data.
      this._pressData = { type, region: rgn, index, size, clientY, override };

      // Done.
      return;
    }

    // Otherwise, the only option is select.

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Bail if there is no selection model.
    if (!model) {
      return;
    }

    // Override the document cursor.
    let override = Drag.overrideCursor('default');

    // Set up the press data.
    this._pressData = {
      type: 'select', region, row, column, override,
      localX: -1, localY: -1, timeout: -1
    };

    // Set up the selection variables.
    let r1: number;
    let c1: number;
    let r2: number;
    let c2: number;
    let cursorRow: number;
    let cursorColumn: number;
    let clear: SelectionModel.ClearMode;

    // Compute the selection based on the pressed region.
    if (region === 'corner-header') {
      r1 = 0;
      r2 = Infinity;
      c1 = 0;
      c2 = Infinity;
      cursorRow = accel ? 0 : shift ? model.cursorRow : 0;
      cursorColumn = accel ? 0 : shift ? model.cursorColumn : 0;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    } else if (region === 'row-header') {
      r1 = accel ? row : shift ? model.cursorRow : row;
      r2 = row;
      c1 = 0;
      c2 = Infinity;
      cursorRow = accel ? row : shift ? model.cursorRow : row;
      cursorColumn = accel ? 0 : shift ? model.cursorColumn : 0;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    } else if (region === 'column-header') {
      r1 = 0;
      r2 = Infinity;
      c1 = accel ? column : shift ? model.cursorColumn : column;
      c2 = column;
      cursorRow = accel ? 0 : shift ? model.cursorRow : 0;
      cursorColumn = accel ? column : shift ? model.cursorColumn : column;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    } else {
      r1 = accel ? row : shift ? model.cursorRow : row;
      r2 = row;
      c1 = accel ? column : shift ? model.cursorColumn : column;
      c2 = column;
      cursorRow = accel ? row : shift ? model.cursorRow : row;
      cursorColumn = accel ? column : shift ? model.cursorColumn : column;
      clear = accel ? 'none' : shift ? 'current' : 'all';
    }

    // Make the selection.
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });
  }

  /**
   * Handle the mouse move event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse move event of interest.
   */
  onMouseMove(grid: DataGrid, event: MouseEvent): void {
    // Fetch the press data.
    const data = this._pressData;

    // Bail early if there is no press data.
    if (!data) {
      return;
    }

    // Handle a row resize.
    if (data.type === 'row-resize') {
      let dy = event.clientY - data.clientY;
      grid.resizeRow(data.region, data.index, data.size + dy);
      return;
    }

    // Handle a column resize.
    if (data.type === 'column-resize') {
      let dx = event.clientX - data.clientX;
      grid.resizeColumn(data.region, data.index, data.size + dx);
      return;
    }

    // Otherwise, it's a select.

    // Mouse moves during a corner header press are a no-op.
    if (data.region === 'corner-header') {
      return;
    }

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Bail early if the selection model was removed.
    if (!model) {
      return;
    }

    // Map to local coordinates.
    let { lx, ly } = grid.mapToLocal(event.clientX, event.clientY);

    // Update the local mouse coordinates in the press data.
    data.localX = lx;
    data.localY = ly;

    // Fetch the grid geometry.
    let hw = grid.headerWidth;
    let hh = grid.headerHeight;
    let vpw = grid.viewportWidth;
    let vph = grid.viewportHeight;
    let sx = grid.scrollX;
    let sy = grid.scrollY;
    let msx = grid.maxScrollY;
    let msy = grid.maxScrollY;

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Set up the timeout variable.
    let timeout = -1;

    // Compute the timemout based on hit region and mouse position.
    if (data.region === 'row-header' || mode === 'row') {
      if (ly < hh && sy > 0) {
        timeout = Private.computeTimeout(hh - ly);
      } else if (ly >= vph && sy < msy) {
        timeout = Private.computeTimeout(ly - vph);
      }
    } else if (data.region === 'column-header' || mode === 'column') {
      if (lx < hw && sx > 0) {
        timeout = Private.computeTimeout(hw - lx);
      } else if (lx >= vpw && sx < msx) {
        timeout = Private.computeTimeout(lx - vpw);
      }
    } else {
      if (lx < hw && sx > 0) {
        timeout = Private.computeTimeout(hw - lx);
      } else if (lx >= vpw && sx < msx) {
        timeout = Private.computeTimeout(lx - vpw);
      } else if (ly < hh && sy > 0) {
        timeout = Private.computeTimeout(hh - ly);
      } else if (ly >= vph && sy < msy) {
        timeout = Private.computeTimeout(ly - vph);
      }
    }

    // Update or initiate the autoselect if needed.
    if (timeout >= 0) {
      if (data.timeout < 0) {
        data.timeout = timeout;
        setTimeout(() => { Private.autoselect(grid, data); }, timeout);
      } else {
        data.timeout = timeout;
      }
      return;
    }

    // Otherwise, clear the autoselect timeout.
    data.timeout = -1;

    // Map the position to virtual coordinates.
    let { vx, vy } = grid.mapToVirtual(event.clientX, event.clientY);

    // Clamp the coordinates to the limits.
    vx = Math.max(0, Math.min(vx, grid.bodyWidth -1));
    vy = Math.max(0, Math.min(vy, grid.bodyHeight - 1));

    // Set up the selection variables.
    let r1: number;
    let c1: number;
    let r2: number;
    let c2: number;
    let cursorRow = model.cursorRow;
    let cursorColumn = model.cursorColumn;
    let clear: SelectionModel.ClearMode = 'current';

    // Compute the selection based pressed region.
    if (data.region === 'row-header' || mode === 'row') {
      r1 = data.row;
      r2 = grid.rowAt('body', vy);
      c1 = 0;
      c2 = Infinity;
    } else if (data.region === 'column-header' || mode === 'column') {
      r1 = 0;
      r2 = Infinity;
      c1 = data.column;
      c2 = grid.columnAt('body', vx);
    } else {
      r1 = cursorRow;
      r2 = grid.rowAt('body', vy);
      c1 = cursorColumn;
      c2 = grid.columnAt('body', vx);
    }

    // Make the selection.
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });
  }

  /**
   * Handle the mouse up event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse up event of interest.
   */
  onMouseUp(grid: DataGrid, event: MouseEvent): void {
    this.release();
  }

  /**
   * Handle the mouse double click event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse up event of interest.
   */
  onMouseDoubleClick(grid: DataGrid, event: MouseEvent): void {
    if (!grid.dataModel) {
      this.release();
      return;
    }

    // Unpack the event.
    let { clientX, clientY } = event;

    // Hit test the grid.
    let hit = grid.hitTest(clientX, clientY);

    // Unpack the hit test.
    let { region, row, column } = hit;

    if (region === 'void') {
      this.release();
      return;
    }

    if (region === 'body') {
      const cell = {
        grid: grid,
        row: row,
        column: column,
        metadata: grid.dataModel!.metadata('body', row, column)
      };
      const editor = grid.cellEditorController.createEditor(cell);
      if (editor) {
        editor.onCommit.connect((_, args: ICellEditResponse) => {
          if (grid.dataModel instanceof MutableDataModel) {
            const dataModel = grid.dataModel as MutableDataModel;
            dataModel.setData('body', row, column, args.value);
          }
          grid.viewport.node.focus();
          if (args.cursorMovement !== 'none') {
            grid.incrementCursor(args.cursorMovement);
            grid.scrollToCursor();
          }
        });
        editor.edit(cell);
      }
    }

    this.release();
  }

  /**
   * Handle the context menu event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The context menu event of interest.
   */
  onContextMenu(grid: DataGrid, event: MouseEvent): void {
    // TODO support user-defined context menus
  }

  /**
   * Handle the wheel event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The wheel event of interest.
   */
  onWheel(grid: DataGrid, event: WheelEvent): void {
    // Bail if a mouse press is in progress.
    if (this._pressData) {
      return;
    }

    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;

    // Convert the delta values to pixel values.
    switch (event.deltaMode) {
    case 0:  // DOM_DELTA_PIXEL
      break;
    case 1:  // DOM_DELTA_LINE
      let ds = grid.defaultSizes;
      dx *= ds.columnWidth;
      dy *= ds.rowHeight;
      break;
    case 2:  // DOM_DELTA_PAGE
      dx *= grid.pageWidth;
      dy *= grid.pageHeight;
      break;
    default:
      throw 'unreachable';
    }

    // Scroll by the desired amount.
    grid.scrollBy(dx, dy);
  }

  private _disposed = false;
  private _pressData: Private.PressData | null;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for the row resize data.
   */
  export
  type RowResizeData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'row-resize';

    /**
     * The row region which holds the section being resized.
     */
    readonly region: DataModel.RowRegion;

    /**
     * The index of the section being resized.
     */
    readonly index: number;

    /**
     * The original size of the section.
     */
    readonly size: number;

    /**
     * The original client Y position of the mouse.
     */
    readonly clientY: number;

    /**
     * The disposable to clear the cursor override.
     */
    readonly override: IDisposable;
  };

  /**
   * A type alias for the column resize data.
   */
  export
  type ColumnResizeData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'column-resize';

    /**
     * The column region which holds the section being resized.
     */
    readonly region: DataModel.ColumnRegion;

    /**
     * The index of the section being resized.
     */
    readonly index: number;

    /**
     * The original size of the section.
     */
    readonly size: number;

    /**
     * The original client X position of the mouse.
     */
    readonly clientX: number;

    /**
     * The disposable to clear the cursor override.
     */
    readonly override: IDisposable;
  };

  /**
   * A type alias for the select data.
   */
  export
  type SelectData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'select';

    /**
     * The original region for the mouse press.
     */
    readonly region: DataModel.CellRegion;

    /**
     * The original row that was selected.
     */
    readonly row: number;

    /**
     * The original column that was selected.
     */
    readonly column: number;

    /**
     * The disposable to clear the cursor override.
     */
    readonly override: IDisposable;

    /**
     * The current local X position of the mouse.
     */
    localX: number;

    /**
     * The current local Y position of the mouse.
     */
    localY: number;

    /**
     * The timeout delay for the autoselect loop.
     */
    timeout: number;
  };

  /**
   * A type alias for the resize handler press data.
   */
  export
  type PressData = RowResizeData | ColumnResizeData | SelectData ;

  /**
   * A type alias for the resize handle types.
   */
  export
  type ResizeHandle = 'top' | 'left' | 'right' | 'bottom' | 'none';

  /**
   * Get the resize handle for a grid hit test.
   */
  export
  function resizeHandleForHitTest(hit: DataGrid.HitTestResult): ResizeHandle {
    // Fetch the row and column.
    let r = hit.row;
    let c = hit.column;

    // Fetch the leading and trailing sizes.
    let lw = hit.x;
    let lh = hit.y;
    let tw = hit.width - hit.x;
    let th = hit.height - hit.y;

    // Set up the result variable.
    let result: ResizeHandle;

    // Dispatch based on hit test region.
    switch (hit.region) {
    case 'corner-header':
      if (c > 0 && lw <= 5) {
        result = 'left';
      } else if (tw <= 6) {
        result = 'right';
      } else if (r > 0 && lh <= 5) {
        result = 'top';
      } else if (th <= 6) {
        result = 'bottom';
      } else {
        result = 'none';
      }
      break;
    case 'column-header':
      if (c > 0 && lw <= 5) {
        result = 'left';
      } else if (tw <= 6) {
        result = 'right';
      } else if (r > 0 && lh <= 5) {
        result = 'top';
      } else if (th <= 6) {
        result = 'bottom';
      } else {
        result = 'none';
      }
      break;
    case 'row-header':
      if (c > 0 && lw <= 5) {
        result = 'left';
      } else if (tw <= 6) {
        result = 'right';
      } else if (r > 0 && lh <= 5) {
        result = 'top';
      } else if (th <= 6) {
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
   * Convert a resize handle into a cursor.
   */
  export
  function cursorForHandle(handle: ResizeHandle): string {
    return cursorMap[handle];
  }

  /**
   * A timer callback for the autoselect loop.
   *
   * @param grid - The datagrid of interest.
   *
   * @param data - The select data of interest.
   */
  export
  function autoselect(grid: DataGrid, data: SelectData): void {
    // Bail early if the timeout has been reset.
    if (data.timeout < 0) {
      return;
    }

    // Fetch the selection model.
    let model = grid.selectionModel;

    // Bail early if the selection model has been removed.
    if (!model) {
      return;
    }

    // Fetch the current selection.
    let cs = model.currentSelection();

    // Bail early if there is no current selection.
    if (!cs) {
      return;
    }

    // Fetch local X and Y coordinates of the mouse.
    let lx = data.localX;
    let ly = data.localY;

    // Set up the selection variables.
    let r1 = cs.r1;
    let c1 = cs.c1;
    let r2 = cs.r2;
    let c2 = cs.c2;
    let cursorRow = model.cursorRow;
    let cursorColumn = model.cursorColumn;
    let clear: SelectionModel.ClearMode = 'current';

    // Fetch the grid geometry.
    let hw = grid.headerWidth;
    let hh = grid.headerHeight;
    let vpw = grid.viewportWidth;
    let vph = grid.viewportHeight;

    // Fetch the selection mode.
    let mode = model.selectionMode;

    // Update the selection based on the hit region.
    if (data.region === 'row-header' || mode === 'row') {
      r2 += ly <= hh ? -1 : ly >= vph ? 1 : 0;
    } else if (data.region === 'column-header' || mode === 'column') {
      c2 += lx <= hw ? -1 : lx >= vpw ? 1 : 0;
    } else {
      r2 += ly <= hh ? -1 : ly >= vph ? 1 : 0;
      c2 += lx <= hw ? -1 : lx >= vpw ? 1 : 0;
    }

    // Update the current selection.
    model.select({ r1, c1, r2, c2, cursorRow, cursorColumn, clear });

    // Re-fetch the current selection.
    cs = model.currentSelection();

    // Bail if there is no selection.
    if (!cs) {
      return
    }

    // Scroll the grid based on the hit region.
    if (data.region === 'row-header' || mode === 'row') {
      grid.scrollToRow(cs.r2);
    } else if (data.region === 'column-header' || mode == 'column') {
      grid.scrollToColumn(cs.c2);
    } else if (mode === 'cell') {
      grid.scrollToCell(cs.r2, cs.c2);
    }

    // Schedule the next call with the current timeout.
    setTimeout(() => { autoselect(grid, data); }, data.timeout);
  }

  /**
   * Compute the scroll timeout for the given delta distance.
   *
   * @param delta - The delta pixels from the origin.
   *
   * @returns The scaled timeout in milliseconds.
   */
  export
  function computeTimeout(delta: number): number {
    return 5 + 120 * (1 - Math.min(128, Math.abs(delta)) / 128);
  }

  /**
   * A mapping of resize handle to cursor.
   */
  const cursorMap = {
    top: 'ns-resize',
    left: 'ew-resize',
    right: 'ew-resize',
    bottom: 'ns-resize',
    none: 'default'
  };
}
