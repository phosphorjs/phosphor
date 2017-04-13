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
 * An object which resolves cell-specific renderers for a data grid.
 *
 * #### Notes
 * A renderer delegate **must not** throw exceptions.
 */
export
interface IRendererDelegate {
  /**
   * Get the cell renderer for a specific cell.
   *
   * @param config - The configuration data for the cell.
   *
   * @returns The renderer for the specified cell, or `null`.
   *
   * #### Notes
   * This method is called often, and so should be efficient.
   */
  getRenderer(config: CellRenderer.ICellConfig): CellRenderer | null;
}
