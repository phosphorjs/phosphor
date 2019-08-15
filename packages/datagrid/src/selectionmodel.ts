/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  IIterator
} from '@phosphor/algorithm';


/**
 * An object which provides selection regions for a data grid.
 *
 * #### Notes
 * If the predefined selection models are insufficient for a particular
 * use case, a custom model can be defined which derives from this class.
 */
export
abstract class SelectionModel {
  /**
   * A signal emitted when the selection model has changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * Get an iterator of the selected regions in the model.
   *
   * @returns A new iterator of selected regions in the model.
   *
   * #### Notes
   * The data grid will render the selections in order.
   */
  abstract selections(): IIterator<SelectionModel.Region>;

  /**
   * Select a region in the model.
   *
   * @param region - The region to select in the model.
   */
  abstract select(region: SelectionModel.Region): void;

  /**
   * Deselect a region in the model.
   *
   * @param region - The region to deselect in the model.
   */
  abstract deselect(region: SelectionModel.Region): void;

  /**
   * Clear all regions in the model.
   */
  abstract clear(): void;

  /**
   * Emit the `changed` signal for the selection model.
   *
   * #### Notes
   * Subclasses should call this method whenever the selection model
   * has changed so that attached data grids can update themselves.
   */
  protected emitChanged(): void {
    this._changed.emit(undefined);
  }

  private _changed = new Signal<this, void>(this);
}


/**
 * The namespace for the `SelectionModel` class statics.
 */
export
namespace SelectionModel {
  /**
   * A class which represents a selected region in the data grid.
   */
  export
  class Region {
    /**
     * Construct a new region.
     *
     * @param row - The first row of the region.
     *
     * @param column - The first column of the region.
     *
     * @param rowSpan - The number of rows spanned by the region.
     *
     * @param columnSpan - The number of columns spanned by the region.
     */
    constructor(row: number, column: number, rowSpan: number, columnSpan: number) {
      this.row = Math.max(0, Math.floor(row));
      this.column = Math.max(0, Math.floor(column));
      this.rowSpan = Math.max(0, Math.floor(rowSpan));
      this.columnSpan = Math.max(0, Math.floor(columnSpan));
    }

    /**
     * The first row of the span.
     */
    readonly row: number;

    /**
     * The first column of the span.
     */
    readonly column: number;

    /**
     * The number of rows spanned by the region.
     */
    readonly rowSpan: number;

    /**
     * The number of columns spanned by the region.
     */
    readonly columnSpan: number;

    /**
     * The last row in the region.
     */
    get lastRow(): number {
      return this.row + this.rowSpan - 1;
    }

    /**
     * The last column in the region.
     */
    get lastColumn(): number {
      return this.column + this.columnSpan - 1;
    }

    /**
     * Test whether the region contains the given row.
     *
     * @param row - The row index of interest.
     *
     * @returns Whether the region contains the given row.
     */
    containsRow(row: number): boolean {
      return row >= this.row && row <= this.lastRow;
    }

    /**
     * Test whether the region contains the given column.
     *
     * @param column - The column index of interest.
     *
     * @returns Whether the region contains the given column
     */
    containsColumn(column: number): boolean {
      return column >= this.column && column <= this.lastColumn;
    }

    /**
     * Test whether the region contains the given cell.
     *
     * @param row - The row index of interest.
     *
     * @param column - The column index of interest.
     *
     * @returns Whether the regions contains the given cell.
     */
    containsCell(row: number, column: number): boolean {
      return this.containsRow(row) && this.containsColumn(column);
    }

    /**
     * Test whether the region includes another region.
     *
     * @param other - The other region of interest.
     *
     * @returns Whether the region includes the given region.
     */
    includes(other: Region): boolean {
      if (other.row < this.row || other.lastRow > this.lastRow) {
        return false;
      }
      if (other.column < this.column || other.lastColumn > this.lastColumn) {
        return false;
      }
      return true;
    }

    /**
     * Test whether the region overlaps another region.
     *
     * @param other - The other region of interest.
     *
     * @returns Whether the region overlaps the other region.
     */
    overlaps(other: Region): boolean {
      if (other.row > this.lastRow || other.lastRow < this.row) {
        return false;
      }
      if (other.column > this.lastColumn || other.lastColumn < this.column) {
        return false;
      }
      return true;
    }
  }
}
