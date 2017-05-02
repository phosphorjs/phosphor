/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DataGrid
} from './datagrid';


/**
 * A cell renderer which renders data values as text.
 */
export
class TextRenderer implements DataGrid.ICellRenderer {
  /**
   * Construct a new text renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: TextRenderer.IOptions = {}) {
    this.font = options.font || '12px sans-serif';
    this.textColor = options.textColor || 'black';
    this.backgroundColor = options.backgroundColor || '';
    this.verticalTextAlignment = options.verticalTextAlignment || 'bottom';
    this.horizontalTextAlignment = options.horizontalTextAlignment || 'left';
    this.textFormatter = options.textFormatter || null;
    this.styleDelegate = options.styleDelegate || null;
  }

  /**
   * The default font for cells.
   */
  font: string;

  /**
   * The default text color for cells.
   */
  textColor: string;

  /**
   * The default background color for cells.
   */
  backgroundColor: string;

  /**
   * The default vertical text alignment for cells.
   */
  verticalTextAlignment: 'top' | 'center' | 'bottom';

  /**
   * The default horizontal text alignment for cells.
   */
  horizontalTextAlignment: 'left' | 'center' | 'right';

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
  drawCell(gc: CanvasRenderingContext2D, config: DataGrid.ICellConfig): void {
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
  protected drawBackground(gc: CanvasRenderingContext2D, config: DataGrid.ICellConfig, style: TextRenderer.ICellStyle | null): void {
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
  protected drawText(gc: CanvasRenderingContext2D, config: DataGrid.ICellConfig, style: TextRenderer.ICellStyle | null): void {
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
      text = TextRenderer.toString(config.value);
    }

    // Bail if there is no text to draw.
    if (!text) {
      return;
    }

    // Resolve the vertical text alignment for the cell.
    let vAlign = (
      (style && style.verticalTextAlignment) || this.verticalTextAlignment
    );

    // Resolve the horizontal text alignment for the cell.
    let hAlign = (
      (style && style.horizontalTextAlignment) || this.horizontalTextAlignment
    );

    // Compute the padded text box size for the specified alignment.
    let boxWidth = config.width - (hAlign === 'center' ? 2 : 4);
    let boxHeight = config.height - (vAlign === 'center' ? 2 : 3);

    // Bail if the text box has no effective size.
    if (boxWidth <= 0 || boxHeight <= 0) {
      return;
    }

    // Set the font for the cell.
    gc.font = (style && style.font) || this.font;

    // Compute the text height for the gc font.
    let textHeight = TextRenderer.measureFontHeight(gc.font);

    // Set up the text position variables.
    let textX: number;
    let textY: number;

    // Compute the Y position for the text.
    switch (vAlign) {
    case 'top':
      textY = config.y + 2 + textHeight;
      break;
    case 'center':
      textY = config.y + config.height / 2 + textHeight / 2;
      break;
    case 'bottom':
      textY = config.y + config.height - 2;
      break;
    default:
      throw 'unreachable';
    }

    // Compute the X position for the text.
    switch (hAlign) {
    case 'left':
      textX = config.x + 3;
      break;
    case 'center':
      textX = config.x + config.width / 2;
      break;
    case 'right':
      textX = config.x + config.width - 3;
      break;
    default:
      throw 'unreachable';
    }

    // Clip the cell if the text is taller than the text box height.
    if (textHeight > boxHeight) {
      gc.beginPath();
      gc.rect(config.x, config.y + 1, config.width, config.height - 2);
      gc.clip();
    }

    // Draw the text for the cell.
    gc.fillStyle = color;
    gc.textAlign = hAlign;
    gc.textBaseline = 'bottom';
    gc.fillText(text, textX, textY);
  }
}


/**
 * The namespace for the `TextRenderer` class statics.
 */
export
namespace TextRenderer {
  /**
   * An object which holds cell-specific style data.
   *
   * #### Notes
   * The cell style data will override the renderer defaults.
   */
  export
  interface ICellStyle {
    /**
     * The font for the cell as a CSS font string.
     */
    font?: string;

    /**
     * The text color for the cell.
     */
    textColor?: string;

    /**
     * The background color for the cell.
     */
    backgroundColor?: string;

    /**
     * The vertical text alignment for the cell.
     */
    verticalTextAlignment?: 'top' | 'center' | 'bottom';

    /**
     * The horizontal text alignment for the cell.
     */
    horizontalTextAlignment?: 'left' | 'center' | 'right';
  }

  // TODO
  // "Delegate" -> "???"

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
    getStyle(config: DataGrid.ICellConfig): ICellStyle | null;
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
    formatText(config: DataGrid.ICellConfig): string;
  }

  /**
   * An options object for initializing a text renderer.
   */
  export
  interface IOptions {
    /**
     * The font for all cells as a CSS font string.
     *
     * #### Notes
     * The default font is `'11px sans-serif'`.
     */
    font?: string;

    /**
     * The text color to apply to all cells.
     *
     * #### Notes
     * The default color is `'black'`.
     */
    textColor?: string;

    /**
     * The background color to apply to all cells.
     *
     * #### Notes
     * The default color is `''`.
     */
    backgroundColor?: string;

    /**
     * The vertical text alignment to apply to all cells.
     *
     * #### Notes
     * The default alignment is `'bottom'`.
     */
    verticalTextAlignment?: 'top' | 'center' | 'bottom';

    /**
     * The horizontal text alignment to apply to all cells.
     *
     * #### Notes
     * The default alignment is `'left'`.
     */
    horizontalTextAlignment?: 'left' | 'center' | 'right';

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
   * Convert any value to a string.
   *
   * #### Notes
   * This is used to format a value when no text formatter is provided
   * to the renderer. It is also useful as a fallback for custom text
   * formatters.
   */
  export
  function toString(value: any): string {
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

  /**
   * Measure the height of a font.
   *
   * @param font - The CSS font string of interest.
   *
   * @returns The height of the font bounding box.
   *
   * #### Notes
   * This function uses a temporary DOM node to measure the text box
   * height for the specified font. The first call for a given font
   * will incur a DOM reflow, but the return value is cached, so any
   * subsequent call for the same font will return the cached value.
   */
  export
  function measureFontHeight(font: string): number {
    // Return the cached value if it exists.
    if (font in Private.fontHeightCache) {
      return Private.fontHeightCache[font];
    }

    // Set the font on the measurement node.
    Private.fontMeasureNode.style.font = font;

    // Add the measurement node to the document.
    document.body.appendChild(Private.fontMeasureNode);

    // Measure the node height.
    let height = Private.fontMeasureNode.offsetHeight;

    // Remove the measurement node from the document.
    document.body.removeChild(Private.fontMeasureNode);

    // Cache the measured height.
    Private.fontHeightCache[font] = height;

    // Return the measured height.
    return height;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A cache of measured font heights.
   */
  export
  const fontHeightCache: { [font: string]: number } = Object.create(null);

  /**
   * The DOM node used for font height measurement.
   */
  export
  const fontMeasureNode = (() => {
    let node = document.createElement('div');
    node.style.position = 'absolute';
    node.style.top = '-99999px';
    node.style.left = '-99999px';
    node.style.visibility = 'hidden';
    node.textContent = 'M';
    return node;
  })();
}
