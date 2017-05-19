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
   * The number of data rows in the data model.
   *
   * #### Notes
   * This property is accessed often, and so should be efficient.
   */
  abstract readonly rowCount: number;

  /**
   * The number of data columns in the data model.
   *
   * #### Notes
   * This property is accessed often, and so should be efficient.
   */
  abstract readonly columnCount: number;

  /**
   * The number of row header columns in the data model.
   *
   * #### Notes
   * This property is accessed often, and so should be efficient.
   */
  abstract readonly rowHeaderCount: number;

  /**
   * The number of column header rows in the data model.
   *
   * #### Notes
   * This property is accessed often, and so should be efficient.
   */
  abstract readonly columnHeaderCount: number;

  /**
   * Get the data value for a specific cell in the data model.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @param returns - The data value for the specified cell.
   *
   * #### Notes
   * A negative `row` index indicates a column header row.
   *
   * A negative `column` index indicates a row header column.
   *
   * This method is called often, and so should be efficient.
   */
  abstract data(row: number, column: number): any;

  /**
   * Get the field descriptor for a specific column in the data model.
   *
   * @param column - The index of the column of interest.
   *
   * @returns The field descriptor for the column.
   *
   * #### Notes
   * Subclasses which support columnar data may reimplement this method
   * to return a field descriptor for a column.
   *
   * The field descriptor can be used by custom cell renderers and cell
   * editors to customize handling of specific cell data types.
   *
   * The default implementation returns `{ name: '', type: '' }`.
   */
  field(column: number): DataModel.IField {
    return { name: '', type: '' };
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
   * A field descriptor for a column in a data model.
   */
  export
  interface IField {
    /**
     * The name of the column.
     *
     * #### Notes
     * This can be any string, but should typically be unique for a
     * given instance of a data model.
     */
    readonly name: string;

    /**
     * The data type of the values in the column.
     *
     * #### Notes
     * This can be any string, but should typically be descriptive of
     * the data type such as `'number'`, `'integer'`, `'array'`, etc.
     */
    readonly type: string;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when new rows or columns are inserted.
   */
  export
  interface ISectionsInsertedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'rows-inserted' | 'columns-inserted';

    /**
     * The index of the first inserted row or column.
     */
    readonly index: number;

    /**
     * The number of inserted rows or columns.
     */
    readonly span: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when existing rows or columns are removed.
   */
  export
  interface ISectionsRemovedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'rows-removed' | 'columns-removed';

    /**
     * The index of the first removed row or column.
     */
    readonly index: number;

    /**
     * The number of removed rows or columns.
     */
    readonly span: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when existing rows or columns are moved.
   */
  export
  interface ISectionsMovedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'rows-moved' | 'columns-moved';

    /**
     * The starting index of the first moved row or column.
     */
    readonly index: number;

    /**
     * The number of moved rows or columns.
     */
    readonly span: number;

    /**
     * The ending index of the first moved row or column.
     */
    readonly destination: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when existing cells are changed in-place.
   */
  export
  interface ICellsChangedArgs {
    /**
     * The discriminated type of the args object.
     */
    readonly type: 'cells-changed';

    /**
     * The row index of the first changed cell.
     */
    readonly rowIndex: number;

    /**
     * The column index of the first changed cell.
     */
    readonly columnIndex: number;

    /**
     * The number of rows in the changed cell range.
     */
    readonly rowSpan: number;

    /**
     * The number of columns in the changed cell range.
     */
    readonly columnSpan: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when the model has changed in a fashion that cannot be easily
   * expressed by the other args object types, like when the data model
   * is sorted or filtered.
   *
   * This will cause any listening data grid to perform a full refresh,
   * so the other changed args types should be used when possible.
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
    ISectionsInsertedArgs |
    ISectionsRemovedArgs |
    ISectionsMovedArgs |
    ICellsChangedArgs |
    IModelResetArgs
  );
}
