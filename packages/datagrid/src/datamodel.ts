/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal
} from '@phosphor/signaling';


/**
 * The core data model interface for a data grid.
 *
 * #### Notes
 * If the predefined data models are insufficient for a particular use
 * case, a custom model can be defined which implements this interface.
 */
export
interface IDataModel {
  /**
   * A signal emitted when the data model has changed.
   *
   * #### Notes
   * Implementations should emit this signal whenever the data model
   * has changed so that attached data grids can update themselves.
   */
  readonly changed: ISignal<this, IDataModel.ChangedArgs>;

  /**
   * The number of rows in the data model.
   *
   * #### Notes
   * This property is accessed often, and so should be efficient.
   */
  readonly rowCount: number;

  /**
   * The number of columns in the data model.
   *
   * #### Notes
   * This property is accessed often, and so should be efficient.
   */
  readonly colCount: number;

  /**
   * Get the data for a particular cell in the data model.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param col - The column index of the cell of interest.
   *
   * @param out - The result object to fill with the cell data.
   *
   * #### Notes
   * A `row` index `< 0` represents a column header cell.
   *
   * A `col` index `< 0` represents a row header cell.
   *
   * A `row` and `col` index `< 0` represent a corner cell.
   *
   * The `out` parameter is used for efficiency, to avoid the potential
   * for thousands of small object allocations during a rendering pass.
   *
   * This method is called often, and so should be efficient.
   */
  data(row: number, col: number, out: IDataModel.ICellData): void;
}


/**
 * The namespace for the `IDataModel` interface statics.
 */
export
namespace IDataModel {
  /**
   * An object which holds the data for a particular cell.
   */
  export
  interface ICellData {
    /**
     * The data value for the cell.
     *
     * #### Notes
     * This may be any value, including complex object types.
     *
     * The `type` parameter of the cell data is used by a data grid to
     * select a cell renderer which knows how to render the data value.
     */
    value: any;

    /**
     * The descriptive type of the data value.
     *
     * #### Notes
     * This is used by a data grid to select a renderer which knows how
     * to render the cell data `value`.
     *
     * The `type` can be any string, but should be descriptive of the
     * actual type of the data value.
     */
    type: string;
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
    type: 'rows-inserted' | 'cols-inserted';

    /**
     * The index of the first inserted row or column.
     */
    index: number;

    /**
     * The number of inserted rows or columns.
     */
    count: number;
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
    type: 'rows-removed' | 'cols-removed';

    /**
     * The index of the first removed row or column.
     */
    index: number;

    /**
     * The number of removed rows or columns.
     */
    count: number;
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
    type: 'rows-moved' | 'cols-moved';

    /**
     * The starting index of the first moved row or column.
     */
    fromIndex: number;

    /**
     * The ending index of the first moved row or column.
     */
    toIndex: number;

    /**
     * The number of moved rows or columns.
     */
    count: number;
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
    type: 'cells-changed';

    /**
     * The row index of the first changed cell.
     */
    rowIndex: number;

    /**
     * The column index of the first changed cell.
     */
    colIndex: number;

    /**
     * The number of rows in the changed cell range.
     */
    rowCount: number;

    /**
     * The number of columns in the changed cell range.
     */
    colCount: number;
  }

  /**
   * An arguments object for the `changed` signal.
   *
   * #### Notes
   * Data models should emit the `changed` signal with this args object
   * type when the model has changed in a fashion that cannot be easily
   * expressed by the other args object types.
   *
   * This will cause any listening data grid to perform a full repaint,
   * so the other args object types should be used when possible.
   */
  export
  interface IModelChangedArgs {
    /**
     * The discriminated type of the args object.
     */
    type: 'model-changed';
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
    IModelChangedArgs
  );
}
