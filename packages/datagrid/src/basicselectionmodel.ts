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
  DataModel
} from './datamodel';

import {
  SelectionModel
} from './selectionmodel';


/**
 * A basic selection model implementation.
 *
 * #### Notes
 * This selection model is sufficient for most use cases where
 * structural knowledge of the data source is *not* required.
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
   * Move cursor down/up while making sure it remains
   * within the bounds of selected rectangles
   */
  incrementCursorWithinSelections(direction: SelectionModel.CursorMoveDirection): void {
    // Bail early if there are no selections or no existing cursor
    if (this.isEmpty || this.cursorRow === -1 || this._cursorColumn === -1) {
      return;
    }

    // Bail early if only single cell is selected
    const firstSelection = this._selections[0];
    if (this._selections.length === 1 &&
      firstSelection.r1 === firstSelection.r2 &&
      firstSelection.c1 === firstSelection.c2) {
      return;
    }

    // start from last selection rectangle
    if (this._cursorRectIndex === -1) {
      this._cursorRectIndex = this._selections.length - 1;
    }

    let cursorRect = this._selections[this._cursorRectIndex];
    let newRow = this._cursorRow + (direction === 'down' ? 1 : -1);
    let newColumn = this._cursorColumn;
    const r1 = Math.min(cursorRect.r1, cursorRect.r2);
    const r2 = Math.max(cursorRect.r1, cursorRect.r2);
    const c1 = Math.min(cursorRect.c1, cursorRect.c2);
    const c2 = Math.max(cursorRect.c1, cursorRect.c2);

    if (newRow > r2) {
      newRow = r1;
      newColumn += 1;
    } else if (newRow < r1) {
      newRow = r2;
      newColumn -= 1;
    }

    // if going downward and the last cell in the selection rectangle visited,
    // move to next rectangle
    if (newColumn > c2) {
      this._cursorRectIndex = (this._cursorRectIndex + 1) % this._selections.length;
      cursorRect = this._selections[this._cursorRectIndex];
      newRow = Math.min(cursorRect.r1, cursorRect.r2);
      newColumn = Math.min(cursorRect.c1, cursorRect.c2);
    }
    // if going upward and the first cell in the selection rectangle visited,
    // move to previous rectangle
    else if (newColumn < c1) {
      this._cursorRectIndex = this._cursorRectIndex === 0 ? this._selections.length - 1 : this._cursorRectIndex - 1;
      cursorRect = this._selections[this._cursorRectIndex];
      newRow = Math.max(cursorRect.r1, cursorRect.r2);
      newColumn = Math.max(cursorRect.c1, cursorRect.c2);
    }

    this._cursorRow = newRow;
    this._cursorColumn = newColumn;

    // Emit the changed signal.
    this.emitChanged();
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
    let rowCount = this.dataModel.rowCount('body');
    let columnCount = this.dataModel.columnCount('body');

    // Bail early if there is no content.
    if (rowCount <= 0 || columnCount <= 0) {
      return;
    }

    // Unpack the arguments.
    let { r1, c1, r2, c2, cursorRow, cursorColumn, clear } = args;

    // Clear the necessary selections.
    if (clear === 'all') {
      this._selections.length = 0;
    } else if (clear === 'current') {
      this._selections.pop();
    }

    // Clamp to the data model bounds.
    r1 = Math.max(0, Math.min(r1, rowCount - 1));
    r2 = Math.max(0, Math.min(r2, rowCount - 1));
    c1 = Math.max(0, Math.min(c1, columnCount - 1));
    c2 = Math.max(0, Math.min(c2, columnCount - 1));

    // Handle the selection mode.
    if (this.selectionMode === 'row') {
      c1 = 0;
      c2 = columnCount - 1;
    } else if (this.selectionMode === 'column') {
      r1 = 0;
      r2 = rowCount - 1;
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
    this._cursorRectIndex = this._selections.length;

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
    this._cursorRectIndex = -1;
    this._selections.length = 0;

    // Emit the changed signal.
    this.emitChanged();
  }

  /**
   * A signal handler for the data model `changed` signal.
   *
   * @param args - The arguments for the signal.
   */
  protected onDataModelChanged(sender: DataModel, args: DataModel.ChangedArgs): void {
    // Bail early if the model has no current selections.
    if (this._selections.length === 0) {
      return;
    }

    // Bail early if the cells have changed in place.
    if (args.type === 'cells-changed') {
      return;
    }

    // Bail early if there is no change to the row or column count.
    if (args.type === 'rows-moved' || args.type === 'columns-moved') {
      return;
    }

    // Fetch the last row and column index.
    let lr = sender.rowCount('body') - 1;
    let lc = sender.columnCount('body') - 1;

    // Bail early if the data model is empty.
    if (lr < 0 || lc < 0) {
      this._selections.length = 0;
      this.emitChanged();
      return;
    }

    // Fetch the selection mode.
    let mode = this.selectionMode;

    // Set up the assignment index variable.
    let j = 0;

    // Iterate over the current selections.
    for (let i = 0, n = this._selections.length; i < n; ++i) {
      // Unpack the selection.
      let { r1, c1, r2, c2 } = this._selections[i];

      // Skip the selection if it will disappear.
      if ((lr < r1 && lr < r2) || (lc < c1 && lc < c2)) {
        continue;
      }

      // Modify the bounds based on the selection mode.
      if (mode === 'row') {
        r1 = Math.max(0, Math.min(r1, lr));
        r2 = Math.max(0, Math.min(r2, lr));
        c1 = 0;
        c2 = lc;
      } else if (mode === 'column') {
        r1 = 0;
        r2 = lr;
        c1 = Math.max(0, Math.min(c1, lc));
        c2 = Math.max(0, Math.min(c2, lc));
      } else {
        r1 = Math.max(0, Math.min(r1, lr));
        r2 = Math.max(0, Math.min(r2, lr));
        c1 = Math.max(0, Math.min(c1, lc));
        c2 = Math.max(0, Math.min(c2, lc));
      }

      // Assign the modified selection to the array.
      this._selections[j++] = { r1, c1, r2, c2 };
    }

    // Remove the stale selections.
    this._selections.length = j;

    // Emit the changed signal.
    this.emitChanged();
  }

  private _cursorRow = -1;
  private _cursorColumn = -1;
  private _cursorRectIndex = -1;
  private _selections: SelectionModel.Selection[] = [];
}
