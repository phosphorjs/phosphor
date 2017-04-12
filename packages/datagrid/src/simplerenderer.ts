/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  CellRenderer
} from './cellrenderer';


/**
 * A partial implementation of a cell renderer.
 *
 * #### Notes
 * This base class implements simple background rendering and style
 * boilerplate which can be useful for most cell types. It must be
 * subclassed to create a renderer which draws foreground content.
 */
export
abstract class SimpleRenderer<T extends SimpleRenderer.ICellStyle> extends CellRenderer {
  /**
   * Construct a new simple renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: SimpleRenderer.IOptions<T> = {}) {
    super();
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
  styleDelegate: SimpleRenderer.IStyleDelegate<T> | null;

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
  abstract drawForeground(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig, style: T | null): void;

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
  drawBackground(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig, style: T | null): void {
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
  drawCell(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig): void {
    // Look up the cell-specific style.
    let style = this.styleDelegate && this.styleDelegate.getStyle(config);

    // Draw the cell background.
    this.drawBackground(gc, config, style);

    // Draw the cell foreground.
    this.drawForeground(gc, config, style);
  }
}


/**
 * The namespace for the `SimpleRenderer` class statics.
 */
export
namespace SimpleRenderer {
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
    getStyle(config: CellRenderer.ICellConfig): T | null;
  }

  /**
   * An options object for initializing a simple renderer.
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
