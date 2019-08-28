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
 * This selection model is sufficient for most use cases where keeping
 * track of mutations in the data model is *not* required.
 */
export
class BasicSelectionModel extends SelectionModel {
  /**
   * Construct a new basic selection model.
   *
   * @param options - The options for initializing the model.
   */
  constructor(options: BasicSelectionModel.IOptions) {
    super();
    this.model = options.model;
    this._selectionMode = options.selectionMode || 'multiple-cell';
  }

  /**
   * The data model associated with the selection model.
   */
  readonly model: DataModel;

  /**
   * Get the selection model for the model.
   */
  get selectionMode(): BasicSelectionModel.SelectionMode {
    return this._selectionMode;
  }

  /**
   * Set the selection mode for the model.
   */
  set selectionMode(value: BasicSelectionModel.SelectionMode) {
    // Bail early if the mode does not change.
    if (this._selectionMode === value) {
      return;
    }

    // Update the internal mode.
    this._selectionMode = value;

    // Clear the current selections.
    this.clear();
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
   * Select the specified cells.
   *
   * @param r1 - The first row of interest.
   *
   * @param c1 - The first column of interest.
   *
   * @param r2 - The second row of interest. The default is `r1`.
   *
   * @param c2 - The second column of interest. The default is `c1`.
   *
   * @returns The current selection.
   */
  select(r1: number, c1: number, r2?: number, c2?: number): SelectionModel.Selection | null {
    // Fetch the current row and column count.
    let rowCount = this.model.rowCount('body');
    let columnCount = this.model.columnCount('body');

    // Bail early if there is no content.
    if (rowCount <= 0 || columnCount <= 0) {
      return null;
    }

    // Handle the optional arguments.
    r2 = r2 === undefined ? r1 : r2;
    c2 = c2 === undefined ? c1 : c2;

    // Clamp to the bounds.
    r1 = Math.max(0, Math.min(r1, rowCount - 1));
    r2 = Math.max(0, Math.min(r2, rowCount - 1));
    c1 = Math.max(0, Math.min(c1, columnCount - 1));
    c2 = Math.max(0, Math.min(c2, columnCount - 1));

    // Update the cursor.
    this._cursorRow = r1;
    this._cursorColumn = c1;

    // Dispatch based on the selection mode.
    switch (this._selectionMode) {
    case 'single-row':
      this._selections.length = 0;
      r2 = r1;
      c1 = 0;
      c2 = columnCount - 1;
      break;
    case 'single-column':
      this._selections.length = 0;
      c2 = c1;
      r1 = 0;
      r2 = rowCount - 1;
      break;
    case 'single-cell':
      this._selections.length = 0;
      r2 = r1;
      c2 = c1;
      break;
    case 'multiple-row':
      c1 = 0;
      c2 = columnCount - 1;
      break;
    case 'multiple-column':
      r1 = 0;
      r2 = rowCount - 1;
      break;
    case 'multiple-cell':
      break;
    default:
      throw 'unreachable';
    }

    // Create the new selection.
    let selection = { r1, c1, r2, c2 };

    // Add the new selection.
    this._selections.push(selection);

    // Emit the changed signal.
    this.emitChanged();

    // Return the new selection.
    return selection;
  }

  /**
   * Resize the current selection to cover all columns up the given row.
   *
   * @param index - The row index of interest.
   *
   * @returns The current selection.
   */
  resizeToRow(index: number): SelectionModel.Selection | null {
    // Bail early if the selection mode only allows columns.
    if (this._selectionMode === 'single-column') {
      return null;
    }
    if (this._selectionMode === 'multiple-column') {
      return null;
    }

    // Fetch the current row and column count.
    let rowCount = this.model.rowCount('body');
    let columnCount = this.model.columnCount('body');

    // Bail early if there is no content.
    if (rowCount <= 0 || columnCount <= 0) {
      return null;
    }

    // Pop the current selection.
    this._selections.pop();

    // Normalize the index.
    index = Math.max(0, Math.min(Math.floor(index), rowCount - 1));

    // Fetch the cursor location.
    let cr = Math.max(0, this._cursorRow);
    let cc = Math.max(0, this._cursorColumn);

    // Set up the row and column variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;

    // Dispatch based on the selection mode.
    switch (this._selectionMode) {
    case 'single-row':
      r1 = index;
      r2 = index;
      c1 = 0;
      c2 = columnCount - 1;
      cr = index;
      break;
    case 'single-cell':
      r1 = index;
      r2 = index;
      c1 = cc;
      c2 = cc;
      cr = index;
      break;
    case 'multiple-row':
      r1 = cr;
      r2 = index;
      c1 = 0;
      c2 = columnCount - 1;
      break;
    case 'multiple-cell':
      r1 = cr;
      r2 = index;
      c1 = 0;
      c2 = columnCount - 1;
      break;
    default:
      throw 'unreachable';
    }

    // Update the internal cursor.
    this._cursorRow = cr;
    this._cursorColumn = cc;

    // Create the new selection.
    let selection = { r1, c1, r2, c2 };

    // Add the new selection.
    this._selections.push(selection);

    // Emit the changed signal.
    this.emitChanged();

    // Return the selection.
    return selection;
  }

  /**
   * Resize the current selection to cover all rows up the given column.
   *
   * @param index - The column index of interest.
   *
   * @returns The current selection.
   */
  resizeToColumn(index: number): SelectionModel.Selection | null {
    // Bail early if the selection mode only allows rows.
    if (this._selectionMode === 'single-row') {
      return null;
    }
    if (this._selectionMode === 'multiple-row') {
      return null;
    }

    // Fetch the current row and column count.
    let rowCount = this.model.rowCount('body');
    let columnCount = this.model.columnCount('body');

    // Bail early if there is no content.
    if (rowCount <= 0 || columnCount <= 0) {
      return null;
    }

    // Pop the current selection.
    this._selections.pop();

    // Normalize the index.
    index = Math.max(0, Math.min(Math.floor(index), columnCount - 1));

    // Fetch the cursor location.
    let cr = Math.max(0, this._cursorRow);
    let cc = Math.max(0, this._cursorColumn);

    // Set up the row and column variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;

    // Dispatch based on the selection mode.
    switch (this._selectionMode) {
    case 'single-column':
      r1 = 0;
      r2 = rowCount - 1;
      c1 = index;
      c2 = index;
      cc = index;
      break;
    case 'single-cell':
      r1 = cr;
      r2 = cr;
      c1 = index;
      c2 = index;
      cc = index;
      break;
    case 'multiple-column':
      r1 = 0;
      r2 = rowCount - 1;
      c1 = cc;
      c2 = index;
      break;
    case 'multiple-cell':
      r1 = 0;
      r2 = rowCount - 1;
      c1 = cc;
      c2 = index;
      break;
    default:
      throw 'unreachable';
    }

    // Update the internal cursor.
    this._cursorRow = cr;
    this._cursorColumn = cc;

    // Create the new selection.
    let selection = { r1, c1, r2, c2 };

    // Add the new selection.
    this._selections.push(selection);

    // Emit the changed signal.
    this.emitChanged();

    // Return the selection.
    return selection;
  }

  /**
   * Resize the current selection to the specified cell.
   *
   * @param row - The row index of interest.
   *
   * @param column - The column index of interest.
   *
   * @returns The current selection.
   */
  resizeTo(row: number, column: number): SelectionModel.Selection | null {
    // Fetch the current row and column count.
    let rowCount = this.model.rowCount('body');
    let columnCount = this.model.columnCount('body');

    // Bail early if there is no content.
    if (rowCount <= 0 || columnCount <= 0) {
      return null;
    }

    // Pop the current selection.
    this._selections.pop();

    // Normalize the indices.
    row = Math.max(0, Math.min(Math.floor(row), rowCount - 1));
    column = Math.max(0, Math.min(Math.floor(column), columnCount - 1));

    // Fetch the cursor location.
    let cr = Math.max(0, this._cursorRow);
    let cc = Math.max(0, this._cursorColumn);

    // Set up the row and column variables.
    let r1: number;
    let r2: number;
    let c1: number;
    let c2: number;

    // Dispatch based on the selection mode.
    switch (this._selectionMode) {
    case 'single-row':
      r1 = row;
      r2 = row;
      c1 = 0;
      c2 = columnCount - 1;
      cr = row;
      break;
    case 'single-column':
      r1 = 0;
      r2 = rowCount - 1;
      c1 = column;
      c2 = column;
      cc = column;
      break;
    case 'single-cell':
      r1 = row;
      r2 = row;
      c1 = column;
      c2 = column;
      cr = row;
      cc = column;
      break;
    case 'multiple-row':
      r1 = cr;
      r2 = row;
      c1 = 0;
      c2 = columnCount - 1;
      break;
    case 'multiple-column':
      r1 = 0;
      r2 = rowCount - 1;
      c1 = cc;
      c2 = column;
      break;
    case 'multiple-cell':
      r1 = cr;
      r2 = row;
      c1 = cc;
      c2 = column;
      break;
    default:
      throw 'unreachable';
    }

    // Update the internal cursor.
    this._cursorRow = cr;
    this._cursorColumn = cc;

    // Create the new selection.
    let selection = { r1, c1, r2, c2 };

    // Add the new selection.
    this._selections.push(selection);

    // Emit the changed signal.
    this.emitChanged();

    // Return the selection.
    return selection;
  }

  /**
   * Resize the current selection by the specified delta.
   *
   * @param rows - The delta number of rows.
   *
   * @param columns - The delta number of columns.
   *
   * @returns The current selection.
   */
  resizeBy(rows: number, columns: number): SelectionModel.Selection | null {
    // Fetch the last selection.
    let last = this._selections[this._selections.length - 1] || null;

    // Get the trailing row and column.
    let row: number;
    let column: number;
    if (last) {
      row = last.r2 + Math.floor(rows);
      column = last.c2 + Math.floor(columns);
    } else {
      row = Math.floor(rows);
      column = Math.floor(columns);
    }

    // Resize to the computed cell.
    return this.resizeTo(row, column);
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
  private _selectionMode: BasicSelectionModel.SelectionMode;
}


/**
 * The namespace for the `BasicSelectionModel` class statics.
 */
export
namespace BasicSelectionModel {
  /**
   * A type alias for the selection mode.
   */
  export
  type SelectionMode = (
    /**
     * Only a single full-row can be selected at a time.
     */
    'single-row' |

    /**
     * Only a single full-column can be selected at a time.
     */
    'single-column' |

    /**
     * Only a single cell can be selected at a time.
     */
    'single-cell' |

    /**
     * Multiple full-rows may be selected at a time.
     */
    'multiple-row' |

    /**
     * Multiple full-columns may be selected at a time.
     */
    'multiple-column' |

    /**
     * Multiple cells may be selected at a time.
     */
    'multiple-cell'
  );

  /**
   * An options object for initializing a basic selection model.
   */
  export
  interface IOptions {
    /**
     * The data model for the selection model.
     */
    model: DataModel;

    /**
     * The selection mode for the model.
     *
     * The default is `'multiple-cell'`.
     */
    selectionMode?: SelectionMode;
  }
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
    let { r1, r2 } = selection;
    return (row >= r1 && row <= r2) || (row >= r2 && row <= r1);
  }

  /**
   * Test whether a selection contains a given column.
   */
  export
  function containsColumn(selection: SelectionModel.Selection, column: number): boolean {
    let { c1, c2 } = selection;
    return (column >= c1 && column <= c2) || (column >= c2 && column <= c1);
  }

  /**
   * Test whether a selection contains a given cell.
   */
  export
  function containsCell(selection: SelectionModel.Selection, row: number, column: number): boolean {
    return containsRow(selection, row) && containsColumn(selection, column);
  }
}
