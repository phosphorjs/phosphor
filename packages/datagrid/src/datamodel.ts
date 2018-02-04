/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, Signal
} from '@phosphor/signaling';


/**
 * An object which provides the data for a data grid.
 *
 * #### Notes
 * If the predefined data models are insufficient for a particular use
 * case, a custom model can be defined which derives from this class.
 */
export
abstract class DataModel {
  /**
   * A signal emitted when the data model has changed.
   */
  get changed(): ISignal<this, DataModel.ChangedArgs> {
    return this._changed;
  }

  /**
   * Get the row count for a region in the data model.
   *
   * @param region - The row region of interest.
   *
   * @returns - The row count for the region.
   *
   * #### Notes
   * This method is called often, and so should be efficient.
   */
  abstract rowCount(region: DataModel.RowRegion): number;

  /**
   * Get the column count for a region in the data model.
   *
   * @param region - The column region of interest.
   *
   * @returns - The column count for the region.
   *
   * #### Notes
   * This method is called often, and so should be efficient.
   */
  abstract columnCount(region: DataModel.ColumnRegion): number;

  /**
   * Get the data value for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @param returns - The data value for the specified cell.
   *
   * #### Notes
   * This method is called often, and so should be efficient.
   */
  abstract data(region: DataModel.CellRegion, row: number, column: number): any;

  /**
   * Get the metadata for a column in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param column - The index of the column of interest.
   *
   * @returns The metadata for the column.
   *
   * #### Notes
   * The returned metadata should be treated as immutable.
   *
   * Models which support columnar data may reimplement this method to
   * return the metadata for a column.
   *
   * The metadata can be used by custom cell renderers and cell editors
   * to customize handling of specific cell data types.
   *
   * This method is called often, and so should be efficient.
   *
   * The default implementation returns `{}`.
   */
  metadata(region: DataModel.CellRegion, column: number): DataModel.Metadata {
    return DataModel.emptyMetadata;
  }

  /**
   * Emit the `changed` signal for the data model.
   *
   * #### Notes
   * Subclass should call this method whenever the data model has
   * changed so that attached data grids can update themselves.
   */
  protected emitChanged(args: DataModel.ChangedArgs): void {
    this._changed.emit(args);
  }

  private _changed = new Signal<this, DataModel.ChangedArgs>(this);
}


/**
 * The namespace for the `DataModel` class statics.
 */
export
namespace DataModel {
  /**
   * A type alias for the data model row regions.
   */
  export
  type RowRegion = 'body' | 'column-header';

  /**
   * A type alias for the data model column regions.
   */
  export
  type ColumnRegion = 'body' | 'row-header';

  /**
   * A type alias for the data model cell regions.
   */
  export
  type CellRegion = 'body' | 'row-header' | 'column-header' | 'corner-header';

  /**
   * The metadata for a column in a data model.
   */
  export
  type Metadata = { [key: string]: any };

  /**
   * A singleton empty metadata object.
   */
  export
  const emptyMetadata: Metadata = Object.freeze({});

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when rows are inserted or removed.
   */
  export
  interface IRowsChangedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'rows-inserted' | 'rows-removed';

    /**
     * The region which contains the modified rows.
     */
    readonly region: RowRegion;

    /**
     * The index of the first modified row.
     */
    readonly index: number;

    /**
     * The number of modified rows.
     */
    readonly span: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when columns are inserted or removed.
   */
  export
  interface IColumnsChangedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'columns-inserted' | 'columns-removed';

    /**
     * The region which contains the modified columns.
     */
    readonly region: ColumnRegion;

    /**
     * The index of the first modified column.
     */
    readonly index: number;

    /**
     * The number of modified columns.
     */
    readonly span: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when rows are moved.
   */
  export
  interface IRowsMovedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'rows-moved';

    /**
     * The region which contains the modified rows.
     */
    readonly region: RowRegion;

    /**
     * The starting index of the first modified row.
     */
    readonly index: number;

    /**
     * The number of modified rows.
     */
    readonly span: number;

    /**
     * The ending index of the first modified row.
     */
    readonly destination: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when columns are moved.
   */
  export
  interface IColumnsMovedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'columns-moved';

    /**
     * The region which contains the modified columns.
     */
    readonly region: ColumnRegion;

    /**
     * The starting index of the first modified column.
     */
    readonly index: number;

    /**
     * The number of modified columns.
     */
    readonly span: number;

    /**
     * The ending index of the first modified column.
     */
    readonly destination: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when cells are changed in-place.
   */
  export
  interface ICellsChangedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'cells-changed';

    /**
     * The region which contains the modified cells.
     */
    readonly region: CellRegion;

    /**
     * The row index of the first modified cell.
     */
    readonly rowIndex: number;

    /**
     * The column index of the first modified cell.
     */
    readonly columnIndex: number;

    /**
     * The number of rows in the modified cell range.
     */
    readonly rowSpan: number;

    /**
     * The number of columns in the modified cell range.
     */
    readonly columnSpan: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when the model has changed in a fashion that cannot be easily
   * expressed by the other args object types.
   *
   * This is the "big hammer" approach, and will cause any associated
   * data grid to perform a full reset. The other changed args types
   * should be used whenever possible.
   */
  export
  interface IModelResetArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'model-reset';
  }

  /**
   * A type alias for the args objects of the `changed` signal.
   */
  export
  type ChangedArgs = (
    IRowsChangedArgs |
    IColumnsChangedArgs |
    IRowsMovedArgs |
    IColumnsMovedArgs |
    ICellsChangedArgs |
    IModelResetArgs
  );
}
