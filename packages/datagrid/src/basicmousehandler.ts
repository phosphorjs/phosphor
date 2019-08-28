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
  DataGrid
} from './datagrid';

import {
  DataModel
} from './datamodel';


/**
 * A basic implementation of a data grid key handler.
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

    // Bail if the client position is out of bounds.
    if (!hit) {
      return;
    }

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

    // Bail if the hit test is on an invalid region.
    if (!hit || hit.region === 'void' || hit.region === 'body') {
      return;
    }

    // Convert the hit test into a part.
    let handle = Private.resizeHandleForHitTest(hit);

    // Bail if the hit test is not on a resize handle.
    if (handle === 'none') {
      return;
    }

    // Fetch the cursor for the handle.
    let cursor = Private.cursorForHandle(handle);

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
      let size = grid.columnSize(region, index);

      // Override the document cursor.
      let override = Drag.overrideCursor(cursor);

      // Create the temporary press data.
      this._pressData = { type, region, index, size, clientX, override };
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
      let size = grid.rowSize(region, index);

      // Override the document cursor.
      let override = Drag.overrideCursor(cursor);

      // Create the temporary press data.
      this._pressData = { type, region, index, size, clientY, override };
    }
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
    let data = this._pressData;

    // Bail early if there is no press data.
    if (!data) {
      return;
    }

    // Dispatch to the proper grid resize method.
    if (data.type === 'row') {
      let dy = event.clientY - data.clientY;
      grid.resizeRow(data.region, data.index, data.size + dy);
    } else {
      let dx = event.clientX - data.clientX;
      grid.resizeColumn(data.region, data.index, data.size + dx);
    }
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
   * A type alias for the row press data.
   */
  export
  type RowPressData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'row';

    /**
     * The row region which holds the section being pressed.
     */
    readonly region: DataModel.RowRegion;

    /**
     * The index of the section being pressed.
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
   * A type alias for the column press data.
   */
  export
  type ColumnPressData = {
    /**
     * The descriminated type for the data.
     */
    readonly type: 'column';

    /**
     * The column region which holds the section being pressed.
     */
    readonly region: DataModel.ColumnRegion;

    /**
     * The index of the section being pressed.
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
   * A type alias for the resize handler press data.
   */
  export
  type PressData = RowPressData | ColumnPressData;

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
