/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, iter
} from '@phosphor/algorithm';

import {
  SelectionModel
} from './selectionmodel';


/**
 * A simple selection model implementation.
 *
 * #### Notes
 * This selection model is sufficient for most use cases where keeping
 * track of mutations in the data model is *not* required.
 */
export
class SimpleSelections extends SelectionModel {
  /**
   * Wether the selection model is empty.
   *
   * #### Notes
   * An empty selection model will yield an empty `selections` iterator.
   */
  get isEmpty(): boolean {
    return this._selections.length === 0;
  }

  /**
   * Get an iterator of the selections in the model.
   *
   * @returns A new iterator of the current selections.
   *
   * #### Notes
   * The data grid will render the selections in order.
   */
  selections(): IIterator<SelectionModel.Selection> {
    return iter(this._selections);
  }

  /**
   * Test whether any selection intersects a row.
   *
   * @param row - The row index of interest.
   *
   * @returns Whether any selection intersects the row.
   */
  isRowSelected(row: number): boolean {
    return this._selections.some(s => Private.containsRow(s, row));
  }

  /**
   * Test whether any selection intersects a column.
   *
   * @param column - The column index of interest.
   *
   * @returns Whether any selection intersects the column.
   */
  isColumnSelected(column: number): boolean {
    return this._selections.some(s => Private.containsColumn(s, column));
  }

  /**
   * Test whether any selection intersects a cell.
   *
   * @param row - The row index of interest.
   *
   * @param column - The column index of interest.
   *
   * @returns Whether any selection intersects the cell.
   */
  isCellSelected(row: number, column: number): boolean {
    return this._selections.some(s => Private.containsCell(s, row, column));
  }

  /**
   * Select cells in the selection model.
   *
   * @param args - The arguments for the selection.
   */
  select(args: SelectionModel.SelectArgs): void {
    // Unpack the arguments.
    let { clear, firstRow, firstColumn, lastRow, lastColumn } = args;

    // Floor and clamp the leading index.
    firstRow = Math.max(0, Math.floor(firstRow));
    firstColumn = Math.max(0, Math.floor(firstColumn));

    // Floor the trailing index.
    lastRow = Math.floor(lastRow);
    lastColumn = Math.floor(lastColumn);

    // Bail if the selection is empty.
    if (lastRow < firstRow || lastColumn < firstColumn) {
      return;
    }

    // Clear the appropriate exisiting selections.
    if (clear === 'all') {
      this._selections.length = 0;
    } else if (clear === 'last') {
      this._selections.pop();
    }

    // Add the new selection.
    this._selections.push({ firstRow, firstColumn, lastRow, lastColumn });

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * Clear all selections in the selection model.
   */
  clear(): void {
    // Bail early if there are no selections.
    if (this._selections.length === 0) {
      return;
    }

    // Clear the selections.
    this._selections.length = 0;

    // Emit the changed signal.
    this.emitChanged();
  }

  private _selections: SelectionModel.Selection[] = [];
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Test whether a selection contains a given row.
   */
  export
  function containsRow(selection: SelectionModel.Selection, row: number): boolean {
    return row >= selection.firstRow && row <= selection.lastRow;
  }

  /**
   * Test whether a selection contains a given column.
   */
  export
  function containsColumn(selection: SelectionModel.Selection, column: number): boolean {
    return column >= selection.firstColumn && column <= selection.lastColumn;
  }

  /**
   * Test whether a selection contains a given cell.
   */
  export
  function containsCell(selection: SelectionModel.Selection, row: number, column: number): boolean {
    return containsRow(selection, row) && containsColumn(selection, column);
  }
}
