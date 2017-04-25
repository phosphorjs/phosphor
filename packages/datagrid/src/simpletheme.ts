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
 * A grid theme which provides simple grid styling.
 *
 * #### Notes
 * Theme colors support the full CSS color syntax.
 *
 * An empty string can be used to indicate no color.
 *
 * If the state of the theme is changed in-place, the `repaint`
 * method of the grid should be called to paint the new results.
 */
export
class SimpleTheme implements DataGrid.IGridTheme {
  /**
   * Construct a new simple theme.
   *
   * @param options - The options for initializing the theme.
   */
  constructor(options: SimpleTheme.IOptions = {}) {
    if (options.voidSpaceFillColor !== undefined) {
      this.voidSpaceFillColor = options.voidSpaceFillColor;
    }
    if (options.mainAreaFillColor !== undefined) {
      this.mainAreaFillColor = options.mainAreaFillColor;
    }
    if (options.rowHeaderFillColor !== undefined) {
      this.rowHeaderFillColor = options.rowHeaderFillColor;
    }
    if (options.colHeaderFillColor !== undefined) {
      this.colHeaderFillColor = options.colHeaderFillColor;
    }
    if (options.cornerHeaderFillColor !== undefined) {
      this.cornerHeaderFillColor = options.cornerHeaderFillColor;
    }
    if (options.mainAreaGridLineColor !== undefined) {
      this.mainAreaGridLineColor = options.mainAreaGridLineColor;
    }
    if (options.rowHeaderGridLineColor !== undefined) {
      this.rowHeaderGridLineColor = options.rowHeaderGridLineColor;
    }
    if (options.colHeaderGridLineColor !== undefined) {
      this.colHeaderGridLineColor = options.colHeaderGridLineColor;
    }
    if (options.cornerHeaderGridLineColor !== undefined) {
      this.cornerHeaderGridLineColor = options.cornerHeaderGridLineColor;
    }
    if (options.evenRowFillColor !== undefined) {
      this.evenRowFillColor = options.evenRowFillColor;
    }
    if (options.oddRowFillColor !== undefined) {
      this.oddRowFillColor = options.oddRowFillColor;
    }
    if (options.evenColFillColor !== undefined) {
      this.evenColFillColor = options.evenColFillColor;
    }
    if (options.oddColFillColor !== undefined) {
      this.oddColFillColor = options.oddColFillColor;
    }
  }

  /**
   * The fill color for the the entire data grid.
   */
  voidSpaceFillColor = '#F3F3F3';

  /**
   * The fill color for the main cell area.
   */
  mainAreaFillColor = '#FFFFFF';

  /**
   * The fill color for the row header area.
   */
  rowHeaderFillColor = '#F3F3F3';

  /**
   * The fill color for the column header area.
   */
  colHeaderFillColor = '#F3F3F3';

  /**
   * The fill color for the corner header area.
   */
  cornerHeaderFillColor = '#F3F3F3';

  /**
   * The grid line color for the main cell area.
   */
  mainAreaGridLineColor = '#D4D4D4';

  /**
   * The grid line color for the row header area.
   */
  rowHeaderGridLineColor = '#B5B5B5';

  /**
   * The grid line color for the column header area.
   */
  colHeaderGridLineColor = '#B5B5B5';

  /**
   * The grid line color for the corner header area.
   */
  cornerHeaderGridLineColor = '#B5B5B5';

  /**
   * The fill color for even-numbered rows.
   */
  evenRowFillColor = '';

  /**
   * The fill color for odd-numbered rows.
   */
  oddRowFillColor = '';

  /**
   * The fill color for even-numbered columns.
   */
  evenColFillColor = '';

  /**
   * The fill color for odd-numbered columns.
   */
  oddColFillColor = '';

  /**
   * Get the fill color for a specific row.
   *
   * @param index - The row index in the data grid.
   *
   * @returns The fill color for the row.
   */
  rowFillColor(index: number): string {
    return index % 2 === 0 ? this.evenRowFillColor : this.oddRowFillColor;
  }

  /**
   * Get the fill color for a specific column.
   *
   * @param index - The column index in the data grid.
   *
   * @returns The fill color for the column.
   */
  colFillColor(index: number): string {
    return index % 2 === 0 ? this.evenColFillColor : this.oddColFillColor;
  }
}


/**
 * The namespace for the `SimpleTheme` class statics.
 */
export
namespace SimpleTheme {
  /**
   * An options object for a initializing a simple theme.
   */
  export
  interface IOptions {
    /**
     * The fill color for the the entire data grid.
     */
    voidSpaceFillColor?: string;

    /**
     * The fill color for the main cell area.
     */
    mainAreaFillColor?: string;

    /**
     * The fill color for the row header area.
     */
    rowHeaderFillColor?: string;

    /**
     * The fill color for the column header area.
     */
    colHeaderFillColor?: string;

    /**
     * The fill color for the corner header area.
     */
    cornerHeaderFillColor?: string;

    /**
     * The grid line color for the main cell area.
     */
    mainAreaGridLineColor?:  string;

    /**
     * The grid line color for the row header area.
     */
    rowHeaderGridLineColor?: string;

    /**
     * The grid line color for the column header area.
     */
    colHeaderGridLineColor?: string;

    /**
     * The grid line color for the corner header area.
     */
    cornerHeaderGridLineColor?: string;

    /**
     * The fill color for even-numbered rows.
     */
    evenRowFillColor?: string;

    /**
     * The fill color for odd-numbered rows.
     */
    oddRowFillColor?: string;

    /**
     * The fill color for even-numbered columns.
     */
    evenColFillColor?: string;

    /**
     * The fill color for odd-numbered columns.
     */
    oddColFillColor?: string;
  }
}
