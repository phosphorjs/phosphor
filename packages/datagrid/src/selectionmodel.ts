/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, some
} from '@phosphor/algorithm';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  DataModel
} from './datamodel';


/**
 * An object which controls selections for a data grid.
 *
 * #### Notes
 * If the predefined selection models are insufficient for a particular
 * use case, a custom model can be defined which derives from this class.
 */
export
abstract class SelectionModel {
  /**
   * Construct a new selection model.
   *
   * @param options - The options for initializing the model
   */
  constructor(options: SelectionModel.IOptions) {
    this.model = options.model;
    if (options.selectionMode !== undefined) {
      this._selectionMode = options.selectionMode;
    }
    if (options.allowSelectionRanges !== undefined) {
      this._allowSelectionRanges = options.allowSelectionRanges;
    }
    if (options.allowMultipleSelections !== undefined) {
      this._allowMultipleSelections = options.allowMultipleSelections;
    }
  }

  /**
   * Whether the selection model is empty.
   *
   * #### Notes
   * An empty selection model will yield an empty `selections` iterator.
   */
  abstract readonly isEmpty: boolean;

  /**
   * The row index of the cursor.
   *
   * The grid only renders the cursor for the `'cell'` selection mode.
   */
  abstract readonly cursorRow: number;

  /**
   * The column index of the cursor.
   *
   * The grid only renders the cursor for the `'cell'` selection mode.
   */
  abstract readonly cursorColumn: number;

  /**
   * Get the current selection in the selection model.
   *
   * @returns The current selection or `null`.
   *
   * #### Notes
   * This is the selection which holds the cursor.
   */
  abstract currentSelection(): SelectionModel.Selection | null;

  /**
   * Get an iterator of the selections in the model.
   *
   * @returns A new iterator of the selections in the model.
   *
   * #### Notes
   * The data grid will render the selections in order.
   */
  abstract selections(): IIterator<SelectionModel.Selection>;

  /**
   * Select the specified cells.
   *
   * @param r1 - The first row of the selection.
   *
   * @param c1 - The first column of the selection.
   *
   * @param r2 - The last row of the selection.
   *
   * @param c2 - The last column of the selection.
   *
   * @param clear - The clear operation to perform when selecting.
   */
  abstract select(r1: number, c1: number, r2: number, c2: number, clear: 'all' | 'current' | 'none'): void;

  /**
   * Clear all selections in the selection model.
   */
  abstract clear(): void;

  /**
   * A signal emitted when the selection model has changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * The data model associated with the selection model.
   */
  readonly model: DataModel;

  /**
   * Get the selection model for the model.
   */
  get selectionMode(): SelectionModel.SelectionMode {
    return this._selectionMode;
  }

  /**
   * Set the selection mode for the model.
   *
   * #### Notes
   * This will clear the selection model.
   */
  set selectionMode(value: SelectionModel.SelectionMode) {
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
   * Get whether selection ranges are allowed.
   */
  get allowSelectionRanges(): boolean {
    return this._allowSelectionRanges;
  }

  /**
   * Set whether selection ranges are allowed.
   *
   * #### Notes
   * This will clear the selection model.
   */
  set allowSelectionRanges(value: boolean) {
    // Bail early if the flag does not change.
    if (this._allowSelectionRanges === value) {
      return;
    }

    // Update the internal flag.
    this._allowSelectionRanges = value;

    // Clear the current selections.
    this.clear();
  }

  /**
   * Get whether multiple selections are allowed.
   */
  get allowMultipleSelections(): boolean {
    return this._allowMultipleSelections;
  }

  /**
   * Set whether multiple selections are allowed.
   *
   * #### Notes
   * This will clear the selection model.
   */
  set allowMultipleSelections(value: boolean) {
    // Bail early if the flag does not change.
    if (this._allowMultipleSelections === value) {
      return;
    }

    // Update the internal flag.
    this._allowMultipleSelections = value;

    // Clear the current selections.
    this.clear();
  }

  /**
   * Test whether any selection intersects a row.
   *
   * @param index - The row index of interest.
   *
   * @returns Whether any selection intersects the row.
   *
   * #### Notes
   * This method may be reimplemented in a subclass.
   */
  isRowSelected(index: number): boolean {
    return some(this.selections(), s => Private.containsRow(s, index));
  }

  /**
   * Test whether any selection intersects a column.
   *
   * @param index - The column index of interest.
   *
   * @returns Whether any selection intersects the column.
   *
   * #### Notes
   * This method may be reimplemented in a subclass.
   */
  isColumnSelected(index: number): boolean {
    return some(this.selections(), s => Private.containsColumn(s, index));
  }

  /**
   * Test whether any selection intersects a cell.
   *
   * @param row - The row index of interest.
   *
   * @param column - The column index of interest.
   *
   * @returns Whether any selection intersects the cell.
   *
   * #### Notes
   * This method may be reimplemented in a subclass.
   */
  isCellSelected(row: number, column: number): boolean {
    return some(this.selections(), s => Private.containsCell(s, row, column));
  }

  /**
   * Resize the current selection to cover all columns up the given row.
   *
   * @param index - The row index of interest.
   */
  resizeToRow(index: number): void {
    // Bail early if the selection mode doesn't support rows.
    if (this._selectionMode === 'column') {
      return;
    }

    // Fetch the necessary data.
    let cr = this.cursorRow;
    let cc = this.cursorColumn;
    let ar = this._allowSelectionRanges;

    // Set up the selection variables.
    let r1: number;
    let c1: number;
    let r2: number;
    let c2: number;

    // Compute the variables based on the selection mode.
    if (this._selectionMode === 'row') {
      r1 = ar ? (cr < 0 ? 0 : cr) : index;
      r2 = index;
      c1 = 0
      c2 = Infinity;
    } else {
      r1 = ar ? (cr < 0 ? 0 : cr) : index;
      r2 = index;
      c1 = ar ? 0 : (cc < 0 ? 0 : cc);
      c2 = ar ? Infinity : (cc < 0 ? 0 : cc);
    }

    // Select the computed range, clearing the current selection.
    this.select(r1, c1, r2, c2, 'current');
  }

  /**
   * Resize the current selection to cover all rows up the given column.
   *
   * @param index - The column index of interest.
   */
  resizeToColumn(index: number): void {
    // Bail early if the selection mode doesn't support columns.
    if (this._selectionMode === 'row') {
      return;
    }

    // Fetch the necessary data.
    let cr = this.cursorRow;
    let cc = this.cursorColumn;
    let ar = this._allowSelectionRanges;

    // Set up the selection variables.
    let r1: number;
    let c1: number;
    let r2: number;
    let c2: number;

    // Compute the variables based on the selection mode.
    if (this._selectionMode === 'column') {
      r1 = 0
      r2 = Infinity;
      c1 = ar ? (cc < 0 ? 0 : cc) : index;
      c2 = index;
    } else {
      r1 = ar ? 0 : (cr < 0 ? 0 : cr);
      r2 = ar ? Infinity : (cr < 0 ? 0 : cr);
      c1 = ar ? (cc < 0 ? 0 : cc) : index;
      c2 = index;
    }

    // Select the computed range, clearing the current selection.
    this.select(r1, c1, r2, c2, 'current');
  }

  /**
   * Resize the current selection to the specified cell.
   *
   * @param row - The row index of interest.
   *
   * @param column - The column index of interest.
   */
  resizeTo(row: number, column: number): void {
    // Handle the row selection mode.
    if (this._selectionMode === 'row') {
      this.resizeToRow(row);
      return;
    }

    // Handle the column selection mode.
    if (this._selectionMode === 'column') {
      this.resizeToColumn(column);
      return;
    }

    // Fetch the necessary data.
    let cr = this.cursorRow;
    let cc = this.cursorColumn;
    let ar = this._allowSelectionRanges;

    // Set up the selection variables.
    let r1 = ar ? (cr < 0 ? 0 : cr) : row;
    let c1 = ar ? (cc < 0 ? 0 : cc) : column;
    let r2 = row;
    let c2 = column;

    // Select the computed range, clearing the current selection.
    this.select(r1, c1, r2, c2, 'current');
  }

  /**
   * Resize the current selection by the specified delta.
   *
   * @param rows - The delta number of rows.
   *
   * @param columns - The delta number of columns.
   */
  resizeBy(rows: number, columns: number): void {
    // Fetch the current selection.
    let cs = this.currentSelection();

    // Determine the target location.
    let r = cs ? cs.r2 + rows : rows;
    let c = cs ? cs.c2 + columns : columns;

    // Resize to the target.
    this.resizeTo(r, c);
  }

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
  private _allowSelectionRanges = true;
  private _allowMultipleSelections = true;
  private _selectionMode: SelectionModel.SelectionMode = 'cell';
}


/**
 * The namespace for the `SelectionModel` class statics.
 */
export
namespace SelectionModel {
  /**
   * A type alias for the selection mode.
   */
  export
  type SelectionMode = 'row' | 'column' | 'cell';

  /**
   * A type alias for a selection in a selection model.
   */
  export
  type Selection = {
    /**
     * The first row of the selection.
     */
    readonly r1: number;

    /**
     * The first column of the selection.
     */
    readonly c1: number;

    /**
     * The second row of the selection.
     */
    readonly r2: number;

    /**
     * The second column of the selection.
     */
    readonly c2: number;
  };

  /**
   * An options object for initializing a selection model.
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
     * The default is `'cell'`.
     */
    selectionMode?: SelectionMode;

    /**
     * Whether selection ranges are allowed.
     *
     * The default is `true`.
     */
    allowSelectionRanges?: boolean;

    /**
     * Whether multiple selections are allowed.
     *
     * The default is `true`.
     */
    allowMultipleSelections?: boolean;
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
