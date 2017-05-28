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
    this.font = options.font || '12px sans-serif';
    this.textColor = options.textColor || '#000000';
    this.backgroundColor = options.backgroundColor || '';
    this.verticalAlignment = options.verticalAlignment || 'center';
    this.horizontalAlignment = options.horizontalAlignment || 'left';
    this.formatter = options.formatter || TextRenderer.defaultFormatter;
  }

  /**
   * The CSS shorthand font for drawing the text.
   */
  font: TextRenderer.StyleProp<string>;

  /**
   * The CSS color for drawing the text.
   */
  textColor: TextRenderer.StyleProp<string>;

  /**
   * The CSS color for the cell background.
   */
  backgroundColor: TextRenderer.StyleProp<string>;

  /**
   * The vertical alignment for the cell text.
   */
  verticalAlignment: TextRenderer.StyleProp<TextRenderer.VerticalAlignment>;

  /**
   * The horizontal alignment for the cell text.
   */
  horizontalAlignment: TextRenderer.StyleProp<TextRenderer.HorizontalAlignment>;

  /**
   * The format function which converts the cell value to text.
   */
  formatter: TextRenderer.CellFunc<string>;

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
  prepare(gc: GraphicsContext, config: CellRenderer.IColumnConfig): void {
    // Look up the default state from the renderer.
    let { font, textColor, backgroundColor, horizontalAlignment } = this;

    // Set up the default font.
    if (font && typeof font === 'string') {
      gc.font = font;
    }

    // Set up the default fill style.
    if (backgroundColor && typeof backgroundColor === 'string') {
      gc.fillStyle = backgroundColor;
    } else if (textColor && typeof textColor === 'string') {
      gc.fillStyle = textColor;
    }

    // Set up the default text alignment.
    if (typeof horizontalAlignment === 'string') {
      gc.textAlign = horizontalAlignment;
    } else {
      gc.textAlign = 'left';
    }

    // Set up the default text baseline.
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
    // Resolve the background color for the cell.
    let backgroundColor = Private.resolve(this.backgroundColor, config);

    // Bail if there is no background color to draw.
    if (!backgroundColor) {
      return;
    }

    // Fill the cell with the background color.
    gc.fillStyle = backgroundColor;
    gc.fillRect(config.x, config.y, config.width, config.height);
  }

  /**
   * Draw the text for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawText(gc: GraphicsContext, config: CellRenderer.ICellConfig): void {
    // Resolve the font for the cell.
    let font = Private.resolve(this.font, config);

    // Bail if there is no font to draw.
    if (!font) {
      return;
    }

    // Resolve the text color for the cell.
    let textColor = Private.resolve(this.textColor, config);

    // Bail if there is no text color to draw.
    if (!textColor) {
      return;
    }

    // Format the cell value to text.
    let formatter = this.formatter;
    let text = formatter(config);

    // Bail if there is no text to draw.
    if (!text) {
      return;
    }

    // Resolve the vertical and horizontal alignment.
    let vAlign = Private.resolve(this.verticalAlignment, config);
    let hAlign = Private.resolve(this.horizontalAlignment, config);

    // Compute the padded text box height for the specified alignment.
    let boxHeight = config.height - (vAlign === 'center' ? 2 : 3);

    // Bail if the text box has no effective size.
    if (boxHeight <= 0) {
      return;
    }

    // Compute the text height for the gc font.
    let textHeight = TextRenderer.measureFontHeight(font);

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

    // Set the gc state.
    gc.font = font;
    gc.fillStyle = textColor;
    gc.textAlign = hAlign;
    gc.textBaseline = 'bottom';

    // Draw the text for the cell.
    gc.fillText(text, textX, textY);
  }
}


/**
 * The namespace for the `TextRenderer` class statics.
 */
export
namespace TextRenderer {
  /**
   * A type alias for a text renderer cell config function.
   *
   * This function type is used to compute a value from a cell config.
   */
  export
  type CellFunc<T> = (config: CellRenderer.ICellConfig) => T;

  /**
   * A type alias for a text renderer style property.
   *
   * The type is used to define a static style property, or a function
   * which computes the style property for a given cell config.
   */
  export
  type StyleProp<T> = T | CellFunc<T>;

  /**
   * A type alias for the supported vertical alignment modes.
   */
  export
  type VerticalAlignment = 'top' | 'center' | 'bottom';

  /**
   * A type alias for the supported horizontal alignment modes.
   */
  export
  type HorizontalAlignment = 'left' | 'center' | 'right';

  /**
   * An options object for initializing a text renderer.
   */
  export
  interface IOptions {
    /**
     * The font for drawing the cell text.
     *
     * The default is `'12px sans-serif'`.
     */
    font?: StyleProp<string>;

    /**
     * The color for the drawing the cell text.
     *
     * The default `'#000000'`.
     */
    textColor?: StyleProp<string>;

    /**
     * The background color for the cells.
     *
     * The default is `''`.
     */
    backgroundColor?: StyleProp<string>;

    /**
     * The vertical alignment for the cell text.
     *
     * The default is `'center'`.
     */
    verticalAlignment?: StyleProp<VerticalAlignment>;

    /**
     * The horizontal alignment for the cell text.
     *
     * The default is `'left'`.
     */
    horizontalAlignment?: StyleProp<HorizontalAlignment>;

    /**
     * The format function to convert a cell value to a string.
     *
     * The default is `TextRenderer.defaultFormatter`.
     */
    formatter?: CellFunc<string>;
  }

  /**
   * The default formatter for a text renderer.
   *
   * #### Notes
   * This will convert any cell value to a string.
   */
  export
  const defaultFormatter: CellFunc<string> = ({ value }) => {
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
  };

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

    // Normalize the font.
    Private.fontMeasurementGC.font = font;
    let normFont = Private.fontMeasurementGC.font;

    // Set the font on the measurement node.
    Private.fontMeasurementNode.style.font = normFont;

    // Add the measurement node to the document.
    document.body.appendChild(Private.fontMeasurementNode);

    // Measure the node height.
    height = Private.fontMeasurementNode.offsetHeight;

    // Remove the measurement node from the document.
    document.body.removeChild(Private.fontMeasurementNode);

    // Cache the measured height for the font and norm font.
    Private.fontHeightCache[font] = height;
    Private.fontHeightCache[normFont] = height;

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
   * The GC used for font measurement.
   */
  export
  const fontMeasurementGC = (() => {
    let canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    return canvas.getContext('2d')!;
  })();

  /**
   * Resolve a style property for a text renderer.
   */
  export
  function resolve<T>(thing: TextRenderer.StyleProp<T>, config: CellRenderer.ICellConfig): T {
    return typeof thing === 'function' ? thing(config) : thing;
  }
}
