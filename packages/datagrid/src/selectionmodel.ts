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
 * A base class for creating data grid selection models.
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
   * This is `-1` if the selection model is empty.
   */
  abstract readonly cursorRow: number;

  /**
   * The column index of the cursor.
   *
   * This is `-1` if the selection model is empty.
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
   * @param args - The arguments for the selection.
   */
  abstract select(args: SelectionModel.SelectArgs): void;

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
   * A type alias for the clear mode.
   */
  export
  type ClearMode = 'all' | 'current' | 'none';

  /**
   * A type alias for the select args.
   */
  export
  type SelectArgs = {
    /**
     * The first row of the selection.
     */
    r1: number;

    /**
     * The first column of the selection.
     */
    c1: number;

    /**
     * The second row of the selection.
     */
    r2: number;

    /**
     * The second column of the selection.
     */
    c2: number;

    /**
     * The row index for the cursor.
     */
    cursorRow: number;

    /**
     * The column index for the cursor.
     */
    cursorColumn: number;

    /**
     * Which of the existing selections to clear.
     */
    clear: ClearMode;
  };

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
