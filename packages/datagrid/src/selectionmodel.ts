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
   * Wether the selection model is empty.
   *
   * #### Notes
   * An empty selection model will yield an empty `selections` iterator.
   */
  abstract readonly isEmpty: boolean;

  /**
   * Get an iterator of the selections in the model.
   *
   * @returns A new iterator of the current selections.
   *
   * #### Notes
   * The data grid will render the selections in order.
   */
  abstract selections(): IIterator<SelectionModel.Selection>;

  /**
   * Test whether any selection intersects a row.
   *
   * @param row - The row index of interest.
   *
   * @returns Whether any selection intersects the row.
   */
  abstract isRowSelected(row: number): boolean;

  /**
   * Test whether any selection intersects a column.
   *
   * @param column - The column index of interest.
   *
   * @returns Whether any selection intersects the column.
   */
  abstract isColumnSelected(column: number): boolean;

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
   * Select cells in the selection model.
   *
   * @param args - The arguments for the selection.
   */
  abstract select(args: SelectionModel.SelectArgs): void;

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
     * #### Notes
     * This should be an integer `>= 0`.
     */
    readonly firstRow: number;

    /**
     * The first column of the selection.
     *
     * #### Notes
     * This should be an integer `>= 0`.
     */
    readonly firstColumn: number;

    /**
     * The last row of the selection.
     *
     * #### Notes
     * This should be an integer `>= firstRow`.
     *
     * A value of `Infinity` indicates a full row selection.
     */
    readonly lastRow: number;

    /**
     * The last column of the selection.
     *
     * #### Notes
     * This should be an integer `>= firstColumn`.
     *
     * A value of `Infinity` indicates a full column selection.
     */
    readonly lastColumn: number;
  };

  /**
   * A type alias for the selection model select args.
   */
  export
  type SelectArgs = {
    /**
     * The clear mode for the selection.
     *
     * This controls which of the existing selections are cleared
     * when making a new selection.
     */
    clear: 'all' | 'last' | 'none';

    /**
     * The first row of the selection.
     *
     * #### Notes
     * This should be an integer `>= 0`.
     */
    firstRow: number;

    /**
     * The first column of the selection.
     *
     * #### Notes
     * This should be an integer `>= 0`.
     */
    firstColumn: number;

    /**
     * The last row of the selection.
     *
     * #### Notes
     * This should be an integer `>= firstRow`.
     *
     * A value of `Infinity` indicates a full row selection.
     */
    lastRow: number;

    /**
     * The last column of the selection.
     *
     * #### Notes
     * This should be an integer `>= firstColumn`.
     *
     * A value of `Infinity` indicates a full column selection.
     */
    lastColumn: number;
  };
}
