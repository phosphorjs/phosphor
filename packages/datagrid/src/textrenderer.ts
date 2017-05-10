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
  DataModel
} from './datamodel';

import {
  GraphicsContext
} from './graphicscontext';


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
    this.style = options.style || TextRenderer.defaultStyle;
    this.styleDelegate = options.styleDelegate || null;
  }

  /**
   *
   */
  style: TextRenderer.IStyle;

  /**
   *
   */
  styleDelegate: TextRenderer.IStyleDelegate | null;

  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  paint(gc: GraphicsContext, config: CellRenderer.ICellConfig): void {
    this.drawBackground(gc, config);
    this.drawText(gc, config);
  }

  /**
   * Prepare the graphics context for drawing a column of cells.
   *
   * @param gc - The graphics context to prepare.
   *
   * @param row - The index of the first row to be rendered.
   *
   * @param col - The index of the column to be rendered.
   *
   * @param field - The field descriptor for the column, or `null`.
   */
  prepare(gc: GraphicsContext, row: number, col: number, field: DataModel.IField | null): void {
    // Set the default font.
    if (this.style.font) {
      gc.font = this.style.font;
    }

    // Set the default fill style.
    if (this.style.textColor) {
      gc.fillStyle = this.style.textColor;
    }

    // Set the default text alignment.
    gc.textAlign = this.style.horizontalAlignment;

    // Set the default text baseline.
    gc.textBaseline = 'bottom';
  }

  /**
   * Draw the background for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawBackground(gc: GraphicsContext, config: CellRenderer.ICellConfig): void {
    //
    let color = this._getStyle('backgroundColor', config);

    // Bail if there is no background color to draw.
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
   */
  drawText(gc: GraphicsContext, config: CellRenderer.ICellConfig): void {
    //
    let formatterFn = this.cellFormatter;

    let formatter = Private.resolve(config, this.cellFormatter, this.formatter);
    //
    let formatter = (formatterFn && formatterFn(config)) || this.formatter;

    // Format the cell value to text.
    let text = formatter(config.value);

    // Bail if there is no text to draw.
    if (!text) {
      return;
    }

    // Resolve the vertical alignment.
    let vAlign = Private.resolve(
      config, this.cellVerticalAlignment, this.verticalAlignment
    );

    // Resolve the horizontal alignment.
    let hAlign = Private.resolve(
      config, this.cellHorizontalAlignment, this.horizontalAlignment
    );

    // Compute the padded text box height for the specified alignment.
    let boxHeight = config.height - (vAlign === 'center' ? 2 : 3);

    // Bail if the text box has no effective size.
    if (boxHeight <= 0) {
      return;
    }

    // Resolve the font for the cell.
    let font = Private.resolve(config, this.cellFont, this.font);

    // Set the gc font if needed.
    if (font) {
      gc.font = font;
    }

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

    // Resolve the text color for the cell.
    let textColor = Private.resolve(
      config, this.cellTextColor, this.textColor
    );

    // Set the fill style if needed.
    if (textColor) {
      gc.fillStyle = textColor;
    }

    // Clip the cell if the text is taller than the text box height.
    if (textHeight > boxHeight) {
      gc.beginPath();
      gc.rect(config.x, config.y + 1, config.width, config.height - 2);
      gc.clip();
    }

    // Set the text alignment state.
    gc.textAlign = hAlign;
    gc.textBaseline = 'bottom';

    // Draw the text for the cell.
    gc.fillText(text, textX, textY);
  }

  private _getStyle<K keyof TextRenderer.IStyle>(key: K, config: CellRenderer.ICellConfig): TextRenderer.IStyle[K] {
    return (this.styleDelegate && this.styleDelegate.getStyle(key, config)) || this.style[key];
  }
}


/**
 * The namespace for the `TextRenderer` class statics.
 */
export
namespace TextRenderer {
  /**
   * A type alias for a function which formats a cell value as text.
   */
  export
  type Formatter = (value: any) => string;

  /**
   *
   */
  export
  interface IStyle {
    /**
     *
     */
    readonly font: string;

    /**
     *
     */
    readonly formatter: Formatter;

    /**
     *
     */
    readonly textColor: string;

    /**
     *
     */
    readonly backgroundColor: string;

    /**
     *
     */
    readonly verticalAlignment: 'top' | 'center' | 'bottom';

    /**
     *
     */
    readonly horizontalAlignment: 'left' | 'center' | 'right';
  }

  /**
   *
   */
  export
  interface IStyleDelegate {
    /**
     *
     */
    getStyle<K keyof IStyle>(key: K, config: CellRenderer.ICellConfig): IStyle[K] | null;
  }

  /**
   * An options object for initializing a text renderer.
   */
  export
  interface IOptions {
    /**
     *
     */
    style?: IStyle;

    /**
     *
     */
    styleDelegate?: IStyleDelegate;
  }

  /**
   * Convert any value to a string.
   *
   * #### Notes
   * This is the default formatter for a text renderer.
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
    // Look up the cached font height.
    let height = Private.fontHeightCache[font];

    // Return the cached font height if it exists.
    if (height !== undefined) {
      return height;
    }

    // Set the font on the measurement node.
    Private.fontMeasurementNode.style.font = font;

    // Add the measurement node to the document.
    document.body.appendChild(Private.fontMeasurementNode);

    // Measure the node height.
    height = Private.fontMeasurementNode.offsetHeight;

    // Remove the measurement node from the document.
    document.body.removeChild(Private.fontMeasurementNode);

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
  const fontMeasurementNode = (() => {
    let node = document.createElement('div');
    node.style.position = 'absolute';
    node.style.top = '-99999px';
    node.style.left = '-99999px';
    node.style.visibility = 'hidden';
    node.textContent = 'M';
    return node;
  })();

  /**
   * Resolve the concrete cell behavior for a text renderer.
   */
  export
  function resolve<T>(config: CellRenderer.ICellConfig, cellFn: TextRenderer.CellFunc<T> | null, defaultvalue: T): T {
    return (cellFn && cellFn(config.row, config.col, config.field, config.value)) || defaultValue;
  }
}
