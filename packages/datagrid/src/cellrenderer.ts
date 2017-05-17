/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DataModel
} from './datamodel';

import {
  GraphicsContext
} from './graphicscontext';


/**
 * An object which renders the cells of a data grid.
 *
 * #### Notes
 * If the predefined cell renderers are insufficient for a particular
 * use case, a custom cell renderer can be defined which derives from
 * this class.
 *
 * The data grid renders cells in column-major order, by region. The
 * region order is: body, row header, column header, corner header.
 */
export
abstract class CellRenderer {
  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The grid will save/restore the `gc` state before/after invoking
   * the renderer.
   *
   * For performance, the cell content is efficiently clipped to the
   * width of the column, but *the height is not clipped*. If height
   * clipping is needed, the renderer must set up its own clip rect.
   *
   * The renderer **must not** draw outside the cell bounding height.
   */
  abstract paint(gc: GraphicsContext, config: CellRenderer.ICellConfig): void;

  /**
   * Prepare the graphics context for drawing a column of cells.
   *
   * @param gc - The graphics context to prepare.
   *
   * @param config - The configuration data for the column.
   *
   * #### Notes
   * This method is called just before the grid renders the cells in
   * a column. It allows the renderer an opportunity to set defaults
   * on the `gc` or pre-compute column render state. This can reduce
   * the need for costly `gc` state changes when painting each cell.
   *
   * The renderer **must not** draw to the `gc` in this method.
   *
   * The default implementation is a no-op.
   */
  prepare(gc: GraphicsContext, config: CellRenderer.IColumnConfig): void { }
}


/**
 * The namespace for the `CellRenderer` class statics.
 */
export
namespace CellRenderer {
  /**
   * An object which holds the configuration data for a column.
   */
  export
  interface IColumnConfig {
    /**
     * The X position of the column, in viewport coordinates.
     */
    readonly x: number;

    /**
     * The width of the column, in viewport pixels.
     */
    readonly width: number;

    /**
     * The column index.
     */
    readonly col: number;

    /**
     * The field descriptor for the column, or `null`.
     */
    readonly field: DataModel.IField | null;
  }

  /**
   * An object which holds the configuration data for a cell.
   */
  export
  interface ICellConfig {
    /**
     * The X position of the cell rectangle, in viewport coordinates.
     */
    readonly x: number;

    /**
     * The Y position of the cell rectangle, in viewport coordinates.
     */
    readonly y: number;

    /**
     * The height of the cell rectangle, in viewport pixels.
     */
    readonly height: number;

    /**
     * The width of the cell rectangle, in viewport pixels.
     */
    readonly width: number;

    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly col: number;

    /**
     * The field descriptor for the column, or `null`.
     */
    readonly field: DataModel.IField | null;

    /**
     * The data value for the cell.
     */
    readonly value: any;
  }
}
