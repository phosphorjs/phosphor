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


/**
 * An object which provides selection data for a data grid.
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
   * The currently selected regions in the model.
   *
   * #### Notes
   * The data grid will render the selections in order, meaning the
   * last selection in the array will be the last one rendered.
   */
  abstract readonly selections: ReadonlyArray<SelectionModel.Region>;

  /**
   * Select a region in the model.
   *
   * @param args - The arguments for making the selection.
   */
  abstract select(args: SelectionModel.SelectArgs): void;

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
 *
 */
export
namespace SelectionModel {
  /**
   *
   */
  export
  type SelectArgs = {
    /**
     *
     */
     row: number;

     /**
      *
      */
     column: number;

     /**
      *
      */
     rowSpan: number;

     /**
      *
      */
     columnSpan: number;

     /**
      *
      */
     clear: 'all' | 'last' | 'none';
  };

  /**
   *
   */
  export
  class Region {


    /**
     *
     */
    constructor(row: number, column: number, rowSpan: number, columnSpan: number) {
      this.row = Math.max(0, Math.floor(row));
      this.column = Math.max(0, Math.floor(column));
      this.rowSpan = Math.max(0, Math.floor(rowSpan));
      this.columnSpan = Math.max(0, Math.floor(columnSpan));
    }

    /**
     *
     */
    readonly row: number;

    /**
     *
     */
    readonly column: number;

    /**
     *
     */
    readonly rowSpan: number;

    /**
     *
     */
    readonly columnSpan: number;

    /**
     *
     */
    get endRow(): number {
      return this.row + this.rowSpan - 1;
    }

    /**
     *
     */
    get endColumn(): number {
      return this.column + this.columnSpan - 1;
    }

    /**
     *
     */
    containsRow(row: number): boolean {
      return row >= this.row && row <= this.endRow;
    }

    /**
     *
     */
    containsColumn(column: number): boolean {
      return column >= this.column && column <= this.endColumn;
    }

    /**
     *
     */
    containsCell(row: number, column: number): boolean {
      return this.containsRow(row) && this.containsColumn(column);
    }
  }
}
