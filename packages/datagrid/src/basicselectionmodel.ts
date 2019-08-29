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
 * A basic selection model implementation.
 *
 * #### Notes
 * This selection model is sufficient for most use cases where
 * structural knowledge of the underlying data source *not* required.
 */
export
class BasicSelectionModel extends SelectionModel {
  /**
   * Wether the selection model is empty.
   */
  get isEmpty(): boolean {
    return this._selections.length === 0;
  }

  /**
   * The row index of the cursor.
   */
  get cursorRow(): number {
    return this._cursorRow;
  }

  /**
   * The column index of the cursor.
   */
  get cursorColumn(): number {
    return this._cursorColumn;
  }

  /**
   * Get the current selection in the selection model.
   *
   * @returns The current selection or `null`.
   *
   * #### Notes
   * This is the selection which holds the cursor.
   */
  currentSelection(): SelectionModel.Selection | null {
    return this._selections[this._selections.length - 1] || null;
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
   * Select the specified cells.
   *
   * @param args - The arguments for the selection.
   */
  select(args: SelectionModel.SelectArgs): void {
    // Fetch the current row and column counts;
    let rowCount = this.model.rowCount('body');
    let columnCount = this.model.columnCount('body');

    // Bail early if there is no content.
    if (rowCount <= 0 || columnCount <= 0) {
      return;
    }

    // Unpack the arguments.
    let { r1, c1, r2, c2, cursorRow, cursorColumn, clear } = args;

    // Clear the necessary selections.
    if (!this.allowMultipleSelections) {
      this._selections.length = 0;
    } else if (clear === 'all') {
      this._selections.length = 0;
    } else if (clear === 'current') {
      this._selections.pop();
    }

    // Clamp to the data model bounds.
    r1 = Math.max(0, Math.min(r1, rowCount - 1));
    r2 = Math.max(0, Math.min(r2, rowCount - 1));
    c1 = Math.max(0, Math.min(c1, columnCount - 1));
    c2 = Math.max(0, Math.min(c2, columnCount - 1));

    // Handle the selection mode and range flag.
    let ar = this.allowSelectionRanges;
    switch (this.selectionMode) {
    case 'row':
      r2 = ar ? r2 : r1;
      c1 = 0;
      c2 = columnCount - 1;
      break;
    case 'column':
      r1 = 0;
      r2 = rowCount - 1;
      c2 = ar ? c2 : c1;
      break;
    case 'cell':
      r2 = ar ? r2 : r1;
      c2 = ar ? c2 : c1;
      break;
    default:
      throw 'unreachable';
    }

    // Alias the cursor row and column.
    let cr = cursorRow;
    let cc = cursorColumn;

    // Compute the new cursor location.
    if (cr < 0 || (cr < r1 && cr < r2) || (cr > r1 && cr > r2)) {
      cr = r1;
    }
    if (cc < 0 || (cc < c1 && cc < c2) || (cc > c1 && cc > c2)) {
      cc = c1;
    }

    // Update the cursor.
    this._cursorRow = cr;
    this._cursorColumn = cc;

    // Add the new selection.
    this._selections.push({ r1, c1, r2, c2 });

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

    // Reset the internal state.
    this._cursorRow = -1;
    this._cursorColumn = -1;
    this._selections.length = 0;

    // Emit the changed signal.
    this.emitChanged();
  }

  private _cursorRow = -1;
  private _cursorColumn = -1;
  private _selections: SelectionModel.Selection[] = [];
}
