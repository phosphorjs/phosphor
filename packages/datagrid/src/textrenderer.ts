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
 * A cell renderer which renders data values as text.
 */
export
class TextRenderer extends CellRenderer {
  /**
   * Construct a new text renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: TextRenderer.IOptions = {}) {
    super();
    this.textColor = options.textColor || 'black';
    this.backgroundColor = options.backgroundColor || '';
    this.textFormatter = options.textFormatter || null;
    this.styleDelegate = options.styleDelegate || null;
  }

  /**
   * The default text color for cells.
   */
  textColor: string;

  /**
   * The default background color for cells.
   */
  backgroundColor: string;

  /**
   * The formatter for converting cell values to text.
   */
  textFormatter: TextRenderer.ITextFormatter | null;

  /**
   * The delegate object for getting cell-specific styles.
   */
  styleDelegate: TextRenderer.IStyleDelegate | null;

  /**
   * Draw the content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawCell(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig): void {
    // Fetch the cell specific style.
    let style = this.styleDelegate && this.styleDelegate.getStyle(config);

    // Draw the cell background.
    this.drawBackground(gc, config, style);

    // Draw the cell text.
    this.drawText(gc, config, style);
  }

  /**
   * Draw the background for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * @param style - The cell-specific style, or `null`.
   *
   * #### Notes
   * This method may be reimplemented by a subclass if needed.
   */
  protected drawBackground(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig, style: TextRenderer.ICellStyle | null): void {
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
   * Draw the text for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * @param style - The cell-specific style, or `null`.
   *
   * #### Notes
   * This method may be reimplemented by a subclass if needed.
   */
  protected drawText(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig, style: TextRenderer.ICellStyle | null): void {
    // Resolve the text color for the cell.
    let color = (style && style.textColor) || this.textColor;

    // Bail if there is no text color.
    if (!color) {
      return;
    }

    // Format the text for display.
    let text: string;
    if (this.textFormatter) {
      text = this.textFormatter.formatText(config);
    } else {
      text = TextRenderer.formatText(config.data.value);
    }

    // Bail if there is no text to draw.
    if (!text) {
      return;
    }

    // TODO - clean up this measurement code.

    //
    let tm = gc.measureText(text);

    //
    let needsClip = (tm.width + 4) > (config.width - 2);

    //
    if (needsClip) {
      gc.save();
      gc.beginPath();
      gc.rect(config.x + 1, config.y + 1, config.width - 2, config.height - 2);
      gc.clip();
    }

    // TODO
    // - font size and style
    // - measure text and clip as needed.
    // - horizontal and vertical text alignment

    // Draw the text for the cell.
    gc.fillStyle = color;
    gc.textBaseline = 'middle';
    gc.fillText(text, config.x + 4, config.y + config.height / 2);

    if (needsClip) {
      gc.restore();
    }
  }
}


/**
 * The namespace for the `TextRenderer` class statics.
 */
export
namespace TextRenderer {
  /**
   * An object which holds cell-specific style data.
   */
  export
  interface ICellStyle {
    /**
     * The text color for the cell.
     *
     * #### Notes
     * This will override the default text color.
     */
    textColor?: string;

    /**
     * The background color for the cell.
     *
     * #### Notes
     * This will override the default background color.
     */
    backgroundColor?: string;
  }

  /**
   * An object which resolves cell-specific styles.
   */
  export
  interface IStyleDelegate {
    /**
     * Get the cell style for a specific cell.
     *
     * @param config - The configuration data for the cell.
     *
     * @returns The style for the specified cell, or `null`.
     *
     * #### Notes
     * This method is called often, and so should be efficient.
     *
     * The delegate **must not** throw exceptions.
     */
    getStyle(config: CellRenderer.ICellConfig): ICellStyle | null;
  }

  /**
   * An object which converts a cell data value to text.
   */
  export
  interface ITextFormatter {
    /**
     * Format the cell data value for the renderer.
     *
     * @param config - The configuration data for the cell.
     *
     * @returns The cell text for display, or an empty string.
     *
     * #### Notes
     * This method is called often, and so should be efficient.
     *
     * The formatter **must not** throw exceptions.
     */
    formatText(config: CellRenderer.ICellConfig): string;
  }

  /**
   * An options object for initializing a text renderer.
   */
  export
  interface IOptions {
    /**
     * The text color to apply to all cells.
     *
     * #### Notes
     * This can be overridden per-cell by the style delegate.
     *
     * The default color is `'black'`.
     */
    textColor?: string;

    /**
     * The background color to apply to all cells.
     *
     * #### Notes
     * This can be overridden per-cell by the style delegate.
     *
     * The default color is `''`.
     */
    backgroundColor?: string;

    /**
     * The text formatter for the renderer.
     *
     * #### Notes
     * The default value is `null`.
     */
    textFormatter?: ITextFormatter;

    /**
     * The style delegate for the renderer.
     *
     * #### Notes
     * The default value is `null`.
     */
    styleDelegate?: IStyleDelegate;
  }

  /**
   * A text format function which converts any value to a string.
   *
   * #### Notes
   * This is used to format a value when no text formatter is provided
   * to the renderer. It is also useful as a fallback for custom text
   * formatters.
   */
  export
  function formatText(value: any): string {
    // Do nothing for a value which is already a string.
    if (typeof value === 'string') {
      return value;
    }

    // Convert `null` and `undefined` to an empty string.
    if (value === null || value === undefined) {
      return '';
    }

    // Coerce all other values to a string via `toString()`.
    return value.toString();
  }
}
