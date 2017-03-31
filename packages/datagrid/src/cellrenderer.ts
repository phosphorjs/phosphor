/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDataModel
} from './datamodel';


/**
 * An object which renders the contents of a grid cell.
 *
 * #### Notes
 * A single cell renderer instance can be used to render the contents
 * of multiple cells, as well as the contents of header cells. A cell
 * renderer is registered by type with a data grid and specified for
 * use by an associated data model.
 *
 * If the predefined cell renderers are insufficient for a particular
 * use case, a custom cell renderer can be defined which implements
 * this interface.
 */
export
interface ICellRenderer<T extends IDataModel> {
  /**
   * Draw the background for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The renderer **must not** draw outside of the box specified by
   * `(x - 1, y - 1`) and `(x + width - 1, y + height - 1)`.
   */
  drawBackground(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<T>): void;

  /**
   * Draw the content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The renderer **must not** draw outside of the box specified by
   * `(x - 1, y - 1`) and `(x + width - 1, y + height - 1)`.
   */
  drawContent(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<T>): void;

  /**
   * Draw the border for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The renderer **must not** draw outside of the box specified by
   * `(x - 1, y - 1`) and `(x + width - 1, y + height - 1)`.
   */
  drawBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<T>): void;
}


/**
 * The namespace for the `ICellRenderer` interface statics.
 */
export
namespace ICellRenderer {
  /**
   * An object which holds the configuration data for a cell.
   */
  export
  interface IConfig<T extends IDataModel> {
    /**
     * The X coordinate of the cell bounding rectangle.
     *
     * #### Notes
     * This is the viewport coordinate of the rect, and is aligned to
     * the cell boundary. It may be negative if the cell is partially
     * off-screen.
     */
    readonly x: number;

    /**
     * The Y coordinate of the cell bounding rectangle.
     *
     * #### Notes
     * This is the viewport coordinate of the rect, and is aligned to
     * the cell boundary. It may be negative if the cell is partially
     * off-screen.
     */
    readonly y: number;

    /**
     * The width of the cell bounding rectangle.
     *
     * #### Notes
     * This value is aligned to the cell boundary. It may extend past
     * the viewport bounds if the cell is partially off-screen.
     */
    readonly width: number;

    /**
     * The width of the cell bounding rectangle.
     *
     * #### Notes
     * This value is aligned to the cell boundary. It may extend past
     * the viewport bounds if the cell is partially off-screen.
     */
    readonly height: number;

    /**
     * The row index of the cell.
     *
     * #### Notes
     * This will be `-1` if the cell is a column header cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     *
     * #### Notes
     * This will be `-1` if the cell is a row header cell.
     */
    readonly col: number;

    /**
     * The data model for the cell.
     *
     * #### Notes
     * The cell renderer *must not* modify the data model.
     */
    readonly model: T;

    /**
     * The data value for the cell, or `null`.
     *
     * #### Notes
     * This value is provided by the data model.
     */
    readonly value: any;

    /**
     * The data type for the cell, or `''`.
     *
     * #### Notes
     * This value is provided by the data model.
     */
    readonly type: string;
  }
}
