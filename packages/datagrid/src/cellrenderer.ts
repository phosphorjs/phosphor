/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DataModel
} from './datamodel';

import {
  GraphicsContext
} from './graphicscontext';


/**
 * An object which renders the cells of a data grid.
 *
 * #### Notes
 * If the predefined cell renderers are insufficient for a particular
 * use case, a custom cell renderer can be defined which derives from
 * this class.
 *
 * The data grid renders cells in column-major order, by region. The
 * region order is: body, row header, column header, corner header.
 */
export
abstract class CellRenderer {
  /**
   * Paint the content for a cell.
   *
   * @param gc - The graphics context to use for drawing.
   *
   * @param config - The configuration data for the cell.
   *
   * #### Notes
   * The grid will save/restore the `gc` state before/after invoking
   * the renderer.
   *
   * For performance, the cell content is efficiently clipped to the
   * width of the column, but *the height is not clipped*. If height
   * clipping is needed, the renderer must set up its own clip rect.
   *
   * The renderer **must not** draw outside the cell bounding height.
   */
  abstract paint(gc: GraphicsContext, config: CellRenderer.CellConfig): void;
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
  type CellConfig = {
    /**
     * The X position of the cell rectangle, in viewport coordinates.
     */
    readonly x: number;

    /**
     * The Y position of the cell rectangle, in viewport coordinates.
     */
    readonly y: number;

    /**
     * The height of the cell rectangle, in viewport pixels.
     */
    readonly height: number;

    /**
     * The width of the cell rectangle, in viewport pixels.
     */
    readonly width: number;

    /**
     * The region for the cell.
     */
    readonly region: DataModel.CellRegion;

    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly column: number;

    /**
     * The value for the cell.
     */
    readonly value: any;

    /**
     * The metadata for the cell.
     */
    readonly metadata: DataModel.Metadata;
  };

  /**
   * A type alias for a cell renderer config function.
   *
   * This type is used to compute a value from a cell config object.
   */
  export
  type ConfigFunc<T> = (config: CellConfig) => T;

  /**
   * A type alias for a cell renderer config option.
   *
   * A config option can be a static value or a config function.
   */
  export
  type ConfigOption<T> = T | ConfigFunc<T>;

  /**
   * Resolve a config option for a cell renderer.
   *
   * @param option - The config option to resolve.
   *
   * @param config - The cell config object.
   *
   * @returns The resolved value for the option.
   */
  export
  function resolveOption<T>(option: ConfigOption<T>, config: CellConfig): T {
    return typeof option === 'function' ? option(config) : option;
  }
}
