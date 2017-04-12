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

import {
  SimpleRenderer
} from './simplerenderer';


/**
 * A cell renderer which renders cell values as text.
 */
export
class TextRenderer<T extends TextRenderer.ICellStyle> extends SimpleRenderer<T> {
  /**
   * Construct a new text renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: TextRenderer.IOptions<T> = {}) {
    super(options);
    this.textColor = options.textColor || 'black';
    this.formatter = options.formatter || new TextRenderer.Formatter();
  }

  /**
   * The default text color for cells.
   */
  textColor: string;

  /**
   * The formatter for converting cell values to text.
   */
  formatter: TextRenderer.IFormatter;

  /**
   * Draw the foreground for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * @param style - The cell style to use for drawing.
   *
   * #### Notes
   * This method may be reimplemented by a subclass as needed.
   */
  drawForeground(gc: CanvasRenderingContext2D, config: CellRenderer.ICellConfig, style: T | null): void {
    // Resolve the background color for the cell.
    let color = (style && style.textColor) || this.textColor;

    // Bail if there is no text color.
    if (!color) {
      return;
    }

    // Format the text for display.
    let text = this.formatter.formatText(config);

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
   * An object which holds cell style data.
   */
  export
  interface ICellStyle extends SimpleRenderer.ICellStyle {
    /**
     * The text color for the cell.
     *
     * #### Notes
     * This will override the default text color.
     */
    textColor?: string;
  }

  /**
   * An options object for initializing a text renderer.
   */
  export
  interface IOptions<T extends ICellStyle> extends SimpleRenderer.IOptions<T> {
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
     * The value formatter for the renderer.
     *
     * #### Notes
     * The default formatter is a new `Formatter` instance.
     */
    formatter?: IFormatter;
  }

  /**
   * An object which coverts a cell value to text.
   */
  export
  interface IFormatter {
    /**
     * Format the cell value for the renderer.
     *
     * @param config - The configuration data for the cell.
     *
     * @returns The cell text for display.
     */
    formatText(config: CellRenderer.ICellConfig): string;
  }

  /**
   * The default implementation of `IFormatter`.
   */
  export
  class Formatter implements IFormatter {
    /**
     * Format the cell value for the renderer.
     *
     * @param config - The configuration data for the cell.
     *
     * @returns The cell text for display.
     */
    formatText(config: CellRenderer.ICellConfig): string {
      // Get the data value for the cell.
      let value = config.data.value;

      // Bail early if the value is already a string.
      if (typeof value === 'string') {
        return value;
      }

      // Return an empty string for `null` or `undefined`.
      if (value === null || value === undefined) {
        return '';
      }

      // Otherwise, coerce the value to a string.
      return value.toString();
    }
  }
}
