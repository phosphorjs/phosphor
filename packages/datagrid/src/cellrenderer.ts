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


/**
 * An object which renders the contents of a grid cell.
 *
 * #### Notes
 * A single cell renderer instance can be used to render the contents
 * of multiple cells.
 *
 * If the predefined cell renderers are insufficient for a particular
 * use case, a custom cell renderer can be defined which derives from
 * this class.
 *
 * If the state of a cell renderer is changed in-place, the grid must
 * be manually refreshed in order to paint the new effective results.
 *
 * A cell renderer **must not** throw exceptions, and **must not**
 * mutate the data model or the data grid.
 */
export
abstract class CellRenderer {
  /**
   * Draw the content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The data grid renders cells in column-major order. For performance,
   * it **does not** apply a clipping rect to the cell bounds before it
   * invokes the renderer, **nor** does it save and restore the `gc`.
   *
   * The renderer should assume that the fill, stroke, and text style
   * of the `gc` have been arbitrarily modified, but that the rest of
   * the `gc` state remains in the default state.
   *
   * If the cell renderer modifies any `gc` state aside from the fill,
   * stroke, and text style, it **must** restore those changes on exit.
   *
   * A cell renderer **must not** draw outside the cell bounding box.
   */
  abstract drawCell(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig): void;
}


/**
 * The namespace for the `CellRenderer` class statics.
 */
export
namespace CellRenderer {
  /**
   * An object which holds the configuration data for a cell.
   */
  export
  interface ICellConfig {
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
     * The data model for the cell.
     */
    readonly model: DataModel;

    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly col: number;

    /**
     * The cell data object for the cell.
     */
    readonly data: DataModel.ICellData;
  }
}
