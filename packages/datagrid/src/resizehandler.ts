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
} from "./datagrid";

import {
  DataModel
} from './datamodel';

import {
  EventHandler
} from "./eventhandler";


/**
 * An event handler proxy which handles section resizing.
 */
export
class ResizeHandler implements EventHandler.IProxy {
  /**
   * Dispose of the resources held by the handler.
   */
  dispose(): void {
    // Bail early if the handler is already disposed.
    if (this._disposed) {
      return;
    }

    // Flip the disposed flag.
    this._disposed = true;

    // Bail early if there is no press data.
    if (!this._pressData) {
      return;
    }

    // Clear the press data.
    this._pressData.override.dispose();
    this._pressData = null;
  }

  /**
   * Whether the handler is already disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Handle the `'keydown'` event.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The keyboard event of interest.
   */
  onKeyDown(grid: DataGrid, event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'mousedown'` event.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse event of interest.
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
    let handle = this.resizeHandleForHitTest(hit);

    // Bail if the hit test is not on a resize handle.
    if (handle === 'none') {
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
      let size = grid.columnSize(region, index);

      // Override the document cursor.
      let override = Drag.overrideCursor('ew-resize');

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
      let override = Drag.overrideCursor('ns-resize');

      // Create the temporary press data.
      this._pressData = { type, region, index, size, clientY, override };
    }
  }

  /**
   * Handle the `'mousemove'` event.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse event of interest.
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
   * Handle the `'mouseup'` event.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse event of interest.
   */
  onMouseUp(grid: DataGrid, event: MouseEvent): void {
    // Bail early if there is no press data.
    if (!this._pressData) {
      return;
    }

    // Clear the press data.
    this._pressData.override.dispose();
    this._pressData = null;
  }

  /**
   * Handle the `'wheel'` event.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The wheel event of interest.
   */
  onWheel(grid: DataGrid, event: WheelEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * Handle the `'contextmenu'` event.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse event of interest.
   */
  onContextMenu(grid: DataGrid, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private _disposed: boolean = false;
  private _pressData: Private.PressData | null = null;
}


/**
 * The namespace for the `ResizeHandler` class statics.
 */
export
namespace ResizeHandler {
  /**
   * A type alias for a cell resize handle.
   */
  export
  type Handle = 'top' | 'left' | 'right' | 'bottom' | 'none';

  /**
   *
   */
  export
  function handleForHitTest(hit: DataGrid.HitTestResult): ResizeHandler.Handle {
    // Fetch the row and column.
    let r = hit.row;
    let c = hit.column;

    // Fetch the leading and trailing sizes.
    let lw = hit.x;
    let lh = hit.y;
    let tw = hit.width - hit.x;
    let th = hit.height - hit.y;

    // Set up the result variable.
    let result: ResizeHandler.Handle;

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
}
