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
 * of multiple cells. It is registered by cell data type with a data
 * grid and used to render those types for the associated data model.
 *
 * If the predefined cell renderers are insufficient for a particular
 * use case, a custom cell renderer can be defined which implements
 * this interface.
 *
 * If the state of a cell renderer is changed in-place, the grid must
 * be manually refreshed in order to paint the new effective results.
 */
export
interface ICellRenderer {
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
   * invokes a renderer, **nor** does it save and restore the gc.
   *
   * A renderer **must not** draw outside of the cell bounding box.
   *
   * A renderer **must not** throw exceptions.
   */
  drawCell(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig): void;
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
     *
     * #### Notes
     * The cell renderer **must not** modify the data model.
     */
    readonly model: IDataModel;

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
     * The cell data object for the cell.
     *
     * #### Notes
     * This value is provided by the data model.
     */
    readonly data: IDataModel.ICellData;
  }
}


/**
 * An abstract base class implementation of a cell renderer.
 *
 * #### Notes
 * This base class implements simple background rendering and style
 * boilerplate which can be useful for most cell types. It must be
 * subclassed to create a renderer which draws foreground content.
 */
export
abstract class CellRenderer<T extends CellRenderer.ICellStyle> implements ICellRenderer {
  /**
   * Construct a new cell renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: CellRenderer.IOptions<T> = {}) {
    this.backgroundColor = options.backgroundColor || '';
    this.styleDelegate = options.styleDelegate || null;
  }

  /**
   * The default background color for cells.
   */
  backgroundColor: string;

  /**
   * The delegate object for getting the cell-specific styles.
   */
  styleDelegate: CellRenderer.IStyleDelegate<T> | null;

  /**
   * Draw the foreground for the cell.
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
  abstract drawForeground(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig, style: T | null): void;

  /**
   * Draw the background for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * @param style - The cell-specific style to use for drawing.
   *
   * #### Notes
   * This method may be reimplemented by a subclass as needed.
   */
  drawBackground(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig, style: T | null): void {
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
   * Draw the content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawCell(gc: CanvasRenderingContext2D, config: ICellRenderer.ICellConfig): void {
    // Look up the cell-specific style.
    let style = this.styleDelegate && this.styleDelegate.getStyle(config);

    // Draw the cell background.
    this.drawBackground(gc, config, style);

    // Draw the cell foreground.
    this.drawForeground(gc, config, style);
  }
}


/**
 * The namespace for the `CellRenderer` class statics.
 */
export
namespace CellRenderer {
  /**
   * An object which holds cell style data.
   */
  export
  interface ICellStyle {
    /**
     * The background color for the cell.
     *
     * #### Notes
     * This will override the default background color.
     */
    backgroundColor?: string;
  }

  /**
   * An object which resolves cell styles.
   */
  export
  interface IStyleDelegate<T extends ICellStyle> {
    /**
     * Get the cell style for a specific cell.
     *
     * @param config - The configuration data for the cell.
     *
     * @returns The style for the specified cell, or `null`.
     *
     * #### Notes
     * This method is called often, and so should be efficient.
     */
    getStyle(config: ICellRenderer.ICellConfig): T | null;
  }

  /**
   * An options object for initializing a cell renderer.
   */
  export
  interface IOptions<T extends ICellStyle> {
    /**
     * The background color to apply to all cells.
     *
     * #### Notes
     * This can be overridden per-cell by the style delegate.
     */
    backgroundColor?: string;

    /**
     * The style delegate for the renderer.
     *
     * #### Notes
     * This is used to resolve the per-cell styles for the renderer.
     */
    styleDelegate?: IStyleDelegate<T>;
  }
}
