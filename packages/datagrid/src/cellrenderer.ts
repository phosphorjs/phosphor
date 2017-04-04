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
 * of multiple cells. It is registered by type with a data grid and
 * specified for use by an associated data model.
 *
 * If the predefined cell renderers are insufficient for a particular
 * use case, a custom cell renderer can be defined which implements
 * this interface.
 *
 * The data grid renders cells in column-major order, *after* the grid
 * lines are drawn. For performance, it **does not** apply a clipping
 * rect to the cell bounds before it invokes a renderer, but it *does*
 * save and restore the gc.
 *
 * If the state of a cell renderer is changed in-place, the grid must
 * be manually refreshed in order to paint the new effective results.
 */
export
interface ICellRenderer<T extends IDataModel> {
  /**
   * Draw the content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The bounding box specified in the config includes all four grid
   * lines of the cell. Since grid lines are `1px` thick, this means
   * that grid lines are shared between cells.
   *
   * The renderer **must not** draw outside of the cell bounding box.
   *
   * The renderer **must not** throw exceptions.
   */
  drawCell(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig<T>): void;
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
  interface ICellConfig<T extends IDataModel> {
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
     * The cell renderer **must not** modify the data model.
     */
    readonly model: T;

    /**
     * The data value for the cell.
     *
     * #### Notes
     * This value is provided by the data model.
     */
    readonly value: any;

    /**
     * The data type for the cell.
     *
     * #### Notes
     * This value is provided by the data model.
     */
    readonly type: string;
  }
}


/**
 * An abstract base class implementation of a cell renderer.
 *
 * #### Notes
 * This cell renderer provides simple background and border rendering.
 * Foreground content rendering must be implemented by a subclass.
 */
export
abstract class CellRenderer<T extends IDataModel, U extends CellRenderer.ICellStyle> implements ICellRenderer<T> {
  /**
   * Construct a new cell renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: CellRenderer.IOptions<T, U> = {}) {
    this.backgroundColor = options.backgroundColor || '';
    this.borderColor = options.borderColor || '';
    this.styleDelegate = options.styleDelegate || null;
  }

  /**
   * The default background color for rendered cells.
   */
  backgroundColor: string;

  /**
   * The default border color for rendered cells.
   */
  borderColor: string;

  /**
   * The delegate object for getting cell-specific styles.
   */
  styleDelegate: CellRenderer.IStyleDelegate<T, U> | null;

  /**
   * Draw the foreground content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * @param style - The cell-specific style to use for drawing.
   *
   * #### Notes
   * This method must be implemented by a subclass.
   */
  abstract drawForeground(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig<T>, style: U | null): void;

  /**
   * Draw the background content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * @param style - The cell-specific style to use for drawing.
   *
   * #### Notes
   * This method fills the entire cell rect with the background color.
   *
   * If there is no background color, this method is a no-op.
   *
   * This method may be reimplemented by a subclass as needed.
   */
  drawBackground(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig<T>, style: U | null): void {
    // Resolve the background color for the cell.
    let color = (style && style.backgroundColor) || this.backgroundColor;

    // Bail if there is no background to draw.
    if (!color) {
      return;
    }

    // Fill the cell with the background color.
    gc.fillStyle = color;
    gc.fillRect(config.x, config.y, config.width, config.height);
  }

  /**
   * Draw the border content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * @param style - The cell-specific style to use for drawing.
   *
   * #### Notes
   * This method draws a 1px thick border around the cell.
   *
   * If there is no border color, this method is a no-op.
   *
   * This method may be reimplemented by a subclass as needed.
   */
  drawBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig<T>, style: U | null): void {
    // Resolve the border color for the cell.
    let color = (style && style.borderColor) || this.borderColor;

    // Bail if there is no border to draw.
    if (!color) {
      return;
    }

    // Draw a 1px border around the cell.
    gc.lineWidth = 1;
    gc.strokeStyle = color;
    gc.strokeRect(x + 0.5, y + 0.5, width, height);
  }

  /**
   * Draw the content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawCell(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig<T>): void {
    // Look up the cell-specific style.
    let style = this.styleDelegate && this.styleDelegate.getStyle(config);

    // Draw the cell background.
    this.drawBackground(gc, config, style);

    // Draw the cell foreground.
    this.drawForeground(gc, config, style);

    // Draw the cell border.
    this.drawBorder(gc, config, style);
  }
}


/**
 * The namespace for the `CellRenderer` class statics.
 */
export
namespace CellRenderer {
  /**
   * An object which holds the cell-specific style data.
   */
  export
  interface ICellStyle {
    /**
     * The background color for the cell.
     *
     * #### Notes
     * If this is not provided, and there is no default background
     * color for the renderer, no cell background will be drawn.
     */
    backgroundColor?: string;

    /**
     * The border color for the cell.
     *
     * #### Notes
     * If this is not provided, and there is no default border
     * color for the renderer, no cell border will be drawn.
     */
    borderColor?: string;
  }

  /**
   * An object which looks up a cell-specific style.
   */
  export
  interface IStyleDelegate<T extends IDataModel, U extends ICellStyle> {
    /**
     * Look up the cell-specific style for a cell.
     *
     * @param config - The configuration data for the cell.
     *
     * @returns The style for the specified cell, or `null`.
     *
     * #### Notes
     * This method is called often, and so should be efficient.
     */
    getStyle(config: ICellRenderer.ICellConfig<T>): U;
  }

  /**
   * An options object for initializing a cell renderer.
   */
  export
  interface IOptions<T extends IDataModel, U extends ICellStyle> {
    /**
     * The default background color for rendered cells.
     *
     * #### Notes
     * This value will be used for the background of all cells, unless
     * it is overridden by the result of the style delegate.
     */
    backgroundColor?: string;

    /**
     * The default border color for rendered cells.
     *
     * #### Notes
     * This value will be used for the border of all cells, unless
     * it is overridden by the result of the style delegate.
     */
    borderColor?: string;

    /**
     * The style delegate for the renderer.
     */
    styleDelegate?: IStyleDelegate<T, U>;
  }
}
