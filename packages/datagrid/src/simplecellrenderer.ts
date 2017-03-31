/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ICellRenderer
} from './cellrenderer';

import {
  IDataModel
} from './datamodel';


/**
 * A partial implementation of a cell renderer.
 *
 * #### Notes
 * This abstract base class draws the background and border for a
 * cell, while leaving the cell content to be drawn by a subclass.
 */
export
abstract class SimpleCellRenderer<T extends IDataModel> implements ICellRenderer<T> {
  /**
   * Construct a new simple cell renderer.
   *
   * @param options - The options for initializing the renderer.
   */
  constructor(options: SimpleCellRenderer.IOptions<T> = {}) {
    this._backgroundResolver = options.backgroundResolver || null;
    this._borderResolver = options.borderResolver || null;
  }

  /**
   * Draw the content for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * This method must be implemented by a subclass.
   */
  abstract drawContent(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<T>): void;

  /**
   * Draw the background for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawBackground(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<T>): void {
    // Bail if no background resolver is specified.
    let resolver = this._backgroundResolver;
    if (!resolver) {
      return;
    }

    // Resolve the background options for the cell.
    let opts = resolver(config);

    // Bail if no color is specified.
    if (!opts || !opts.color) {
      return;
    }

    // Set up the context fill style.
    gc.fillStyle = opts.color;

    // Fill the cell background with the specified color.
    gc.fillRect(config.x - 1, config.y - 1, config.width + 1, config.height + 1);
  }

  /**
   * Draw the border for the cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   */
  drawBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<T>): void {
    // Bail if no border resolver is specified.
    let resolver = this._borderResolver;
    if (!resolver) {
      return;
    }

    // Resolve the border options for the cell.
    let opts = resolver(config);

    // Bail if no options are specified.
    if (!opts) {
      return;
    }

    // Unpack the border specs.
    let { all, top, left, right, bottom } = opts;

    // Bail if there are no specs.
    if (!all && !top && !left && !right && !bottom) {
      return;
    }

    // Handle the fast case of a uniform border.
    if (all && !top && !left && !right && !bottom) {
      Private.drawBorder(gc, config, all);
      return;
    }

    // Coerce the specs for each edge.
    top = top || all;
    left = left || all;
    right = right || all;
    bottom = bottom || all;

    // Draw the specified border segments.
    // TODO - allow the user to customize the segment draw order?
    if (top) {
      Private.drawTopBorder(gc, config, top);
    }
    if (bottom) {
      Private.drawBottomBorder(gc, config, bottom);
    }
    if (left) {
      Private.drawLeftBorder(gc, config, left);
    }
    if (right) {
      Private.drawLeftBorder(gc, config, right);
    }
  }

  private _backgroundResolver: SimpleCellRenderer.BackgroundResolver<T> | null;
  private _borderResolver: SimpleCellRenderer.BorderResolver<T> | null;
}


/**
 * The namespace for the `SimpleCellRenderer` class statics.
 */
export
namespace SimpleCellRenderer {
  /**
   * An options object for a cell background.
   */
  export
  interface IBackgroundOptions {
    /**
     * The background color for the cell.
     */
    readonly color?: string;
  }

  /**
   * A type alias for the supported border weights.
   */
  export
  type BorderWeight = 'thin' | 'medium' | 'thick';

  /**
   * A type alias for the supported border line styles.
   */
  export
  type BorderStyle = 'solid' | 'dash' | 'dot';

  /**
   * An object which specifies border drawing parameters.
   */
  export
  interface IBorderSpec {
    /**
     * The color of the border line.
     */
    color: string;

    /**
     * The weight of the border line.
     */
    weight: BorderWeight;

    /**
     * The style of the border line.
     */
    style: BorderStyle;
  }

  /**
   * An options object for a cell border.
   */
  export
  interface IBorderOptions {
    /**
     * The border spec to apply to all borders edges.
     *
     * #### Notes
     * This spec can overridden on a per-edge basis.
     */
    readonly all?: IBorderSpec;

    /**
     * The border spec to apply to the top border.
     *
     * #### Notes
     * This spec will override `all` for the top border only.
     */
    readonly top?: IBorderSpec;

    /**
     * The border spec to apply to the left border.
     *
     * #### Notes
     * This spec will override `all` for the left border only.
     */
    readonly left?: IBorderSpec;

    /**
     * The border spec to apply to the right border.
     *
     * #### Notes
     * This spec will override `all` for the right border only.
     */
    readonly right?: IBorderSpec;

    /**
     * The border spec to apply to the bottom border.
     *
     * #### Notes
     * This spec will override `all` for the bottom border only.
     */
    readonly bottom?: IBorderSpec;
  }

  /**
   * A function which resolves the background options for a cell.
   *
   * #### Notes
   * The resolver function is called often. In order for grid rendering
   * to remain efficient, the resolver should make use of lookup tables
   * or caches to avoid repeatedly allocating the return value.
   */
  export
  type BackgroundResolver<T extends IDataModel> = (config: ICellRenderer.IConfig<T>) => IBackgroundOptions<T> | null;

  /**
   * A function which resolves the border options for a cell.
   *
   * #### Notes
   * The resolver function is called often. In order for grid rendering
   * to remain efficient, the resolver should make use of lookup tables
   * or caches to avoid repeatedly allocating the return value.
   */
  export
  type BorderResolver<T extends IDataModel> = (config: ICellRenderer.IConfig<T>) => IBorderOptions<T> | null;

  /**
   * An options object for initializing a simple cell renderer.
   */
  export
  interface IOptions<T extends IDataModel> {
    /**
     * The resolver function for cell background options.
     *
     * This function will be invoked with a cell renderer config to
     * resolve the background options for a particular cell.
     */
    readonly backgroundResolver?: BackgroundResolver<T>;

    /**
     * The resolver function for cell border options.
     *
     * This function will be invoked with a cell renderer config to
     * resolve the border options for a particular cell.
     */
    readonly borderResolver?: BorderResolver<T>;
  }
}


/**
 *
 */
namespace Private {
  /**
   *
   */
  export
  function drawBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<IDataModel>, spec: SimpleCellRenderer.IBorderSpec): void {
    //
    let { color, weight, style } = spec;

    //
    let x = config.x - 1;
    let y = config.y - 1;
    let w = config.width + 1;
    let h = config.height + 1;

    //
    gc.strokeStyle = color;

    //
    switch (weight) {
    case 'thin':
      gc.lineWidth = 1;
      x += 0.5;
      y += 0.5;
      w -= 1;
      h -= 1;
      break;
    case 'medium':
      gc.lineWidth = 2;
      x += 1;
      y += 1;
      w -= 2;
      h -= 2;
      break;
    case 'thick':
      gc.lineWidth = 3;
      x += 1.5;
      y += 1.5;
      w -= 3;
      h -= 3;
      break;
    }

    //
    switch (style) {
    case 'dash':
    }
    //
    if (style === 'dash') {
      gc.setLineDash([3 * lw, lw]);
    } else if (style === 'dot') {
      gc.setLineDash([lw, lw]);
    }

    //
    gc.strokeRect(x, y, w, h);
  }

  /**
   *
   */
  export
  function drawTopBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<IDataModel>, spec: SimpleCellRenderer.IBorderSpec): void {

  }

  /**
   *
   */
  export
  function drawLeftBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<IDataModel>, spec: SimpleCellRenderer.IBorderSpec): void {

  }

  /**
   *
   */
  export
  function drawRightBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<IDataModel>, spec: SimpleCellRenderer.IBorderSpec): void {

  }

  /**
   *
   */
  export
  function drawBottomBorder(gc: CanvasRenderingContext2D, config: ICellRenderer.IConfig<IDataModel>, spec: SimpleCellRenderer.IBorderSpec): void {

  }

  /**
   *
   */
  const uniformTable {
    'thin': {
      dx: 0.5,
      dy: 0.5,
      dw: -1,
      dh: -1,
      lw: 1
    },
    'medium': {
      dx: 1,
      dy: 1,
      dw: -2,
      dh: -2,
      lw: 2
    },
    'thick': {
      dx: 1.5,
      dy: 1.5,
      dw: -3,
      dh: -3,
      lw: 3
    }
  }
}
