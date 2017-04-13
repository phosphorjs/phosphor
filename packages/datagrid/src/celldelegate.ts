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
 * An object which resolves cell-specific data for a data grid.
 *
 * #### Notes
 * A cell delegate **must not** throw exceptions, and **must not**
 * mutate the data model or the data grid.
 */
export
interface ICellDelegate {
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
