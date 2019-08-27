/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DataGrid
} from './datagrid';


/**
 * A basic implementation of a data grid key handler.
 *
 * #### Notes
 * This class may be subclassed and customized as needed.
 */
export
class BasicMouseHandler implements DataGrid.IMouseHandler {
  /**
   *
   */
  dispose(): void {
    this._disposed = true;
  }

  /**
   *
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   *
   */
  release(): void {

  }

  /**
   * Handle the mouse hover event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse hover event of interest.
   */
  onMouseHover(grid: DataGrid, event: MouseEvent): void {

  }

  /**
   * Handle the mouse leave event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse hover event of interest.
   */
  onMouseLeave(grid: DataGrid, event: MouseEvent): void {

  }

  /**
   * Handle the mouse down event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse down event of interest.
   */
  onMouseDown(grid: DataGrid, event: MouseEvent): void {

  }

  /**
   * Handle the mouse move event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse move event of interest.
   */
  onMouseMove(grid: DataGrid, event: MouseEvent): void {

  }

  /**
   * Handle the mouse up event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The mouse up event of interest.
   */
  onMouseUp(grid: DataGrid, event: MouseEvent): void {

  }

  /**
   * Handle the context menu event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The context menu event of interest.
   */
  onContextMenu(grid: DataGrid, event: MouseEvent): void {

  }

  /**
   * Handle the wheel event for the data grid.
   *
   * @param grid - The data grid of interest.
   *
   * @param event - The wheel event of interest.
   */
  onWheel(grid: DataGrid, event: WheelEvent): void {

  }

  private _disposed = false;
}
