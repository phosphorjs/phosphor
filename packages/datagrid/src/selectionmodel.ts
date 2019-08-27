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
   * A signal emitted when the selection model has changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * The data model associated with the selection model.
   */
  abstract readonly model: DataModel;

  /**
   * The row index of the cursor.
   */
  abstract readonly cursorRow: number;

  /**
   * The column index of the cursor.
   */
  abstract readonly cursorColumn: number;

  /**
   * Whether the selection model is empty.
   *
   * #### Notes
   * An empty selection model will yield an empty `selections` iterator.
   */
  abstract readonly isEmpty: boolean;

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
   * Test whether any selection intersects a row.
   *
   * @param index - The row index of interest.
   *
   * @returns Whether any selection intersects the row.
   */
  abstract isRowSelected(index: number): boolean;

  /**
   * Test whether any selection intersects a column.
   *
   * @param index - The column index of interest.
   *
   * @returns Whether any selection intersects the column.
   */
  abstract isColumnSelected(index: number): boolean;

  /**
   * Test whether any selection intersects a cell.
   *
   * @param row - The row index of interest.
   *
   * @param column - The column index of interest.
   *
   * @returns Whether any selection intersects the cell.
   */
  abstract isCellSelected(row: number, column: number): boolean;

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
   * @returns The current selection or `null`.
   */
  abstract select(r1: number, c1: number, r2?: number, c2?: number): SelectionModel.Selection | null;

  /**
   * Resize the current selection to cover all columns up the given row.
   *
   * @param index - The row index of interest.
   *
   * @returns The current selection or `null`.
   */
  abstract resizeToRow(index: number): SelectionModel.Selection | null;

  /**
   * Resize the current selection to cover all rows up the given column.
   *
   * @param index - The column index of interest.
   *
   * @returns The current selection or `null`.
   */
  abstract resizeToColumn(index: number): SelectionModel.Selection | null;

  /**
   * Resize the current selection to the specified cell.
   *
   * @param row - The row index of interest.
   *
   * @param column - The column index of interest.
   *
   * @returns The current selection or `null`.
   */
  abstract resizeTo(row: number, column: number): SelectionModel.Selection | null;

  /**
   * Resize the current selection by the specified delta.
   *
   * @param rows - The delta number of rows.
   *
   * @param columns - The delta number of columns.
   *
   * @returns The current selection or `null`.
   */
  abstract resizeBy(rows: number, columns: number): SelectionModel.Selection | null;

  /**
   * Clear all selections in the selection model.
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
   * A type alias for a selection in a selection model.
   */
  export
  type Selection = {
    /**
     * The first row of the selection.
     *
     * This is an integer `0 <= r1`.
     */
    readonly r1: number;

    /**
     * The first column index the selection.
     *
     * This is an integer `0 <= c1`.
     */
    readonly c1: number;

    /**
     * The second row of the selection.
     *
     * This is an integer `0 <= r2`.
     */
    readonly r2: number;

    /**
     * The second column of the selection.
     *
     * This is an integer `0 <= c2`.
     */
    readonly c2: number;
  };
}
