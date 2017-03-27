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
   */
  readonly changed: ISignal<IDataModel, IDataModel.ChangedArgs>;

  /**
   * The number of rows in the data model.
   *
   * #### Notes
   * This property accessor should be efficient.
   */
  readonly rowCount: number;

  /**
   * The number of columns in the data model.
   *
   * #### Notes
   * This property accessor should be efficient.
   */
  readonly colCount: number;

  /**
   * Get the data for a particular cell in the data model.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param col - The column index of the cell of interest.
   *
   * @param out - The datum to fill with the cell value.
   *
   * #### Notes
   * <explain -1 values for row/colum and reason for out parameter>
   */
  data(row: number, col: number, out: IDataModel.IDatum): void;
}


/**
 * The namespace for the `IDataModel` interface statics.
 */
export
namespace IDataModel {
  /**
   *
   */
  export
  interface IDatum {
    /**
     *
     */
    value: any;

    /**
     *
     */
    renderer: string;

    /**
     *
     */
    config: any;
  }

  /**
   *
   */
  export
  interface ISectionsInsertedArgs {
    /**
     *
     */
    type: 'rows-inserted' | 'cols-inserted';

    /**
     *
     */
    start: number;

    /**
     *
     */
    count: number;
  }

  /**
   *
   */
  export
  interface ISectionsRemovedArgs {
    /**
     *
     */
    type: 'rows-removed' | 'cols-removed';

    /**
     *
     */
    start: number;

    /**
     *
     */
    count: number;
  }

  /**
   *
   */
  export
  interface ISectionsMovedArgs {
    /**
     *
     */
    type: 'rows-moved' | 'cols-moved';

    /**
     *
     */
    start: number;

    /**
     *
     */
    count: number;

    /**
     *
     */
    dest: number;
  }

  /**
   *
   */
  export
  interface ICellsChangedArgs {
    /**
     *
     */
    type: 'cells-changed';

    /**
     *
     */
    startRow: number;

    /**
     *
     */
    rowCount: number;

    /**
     *
     */
    startCol: number;

    /**
     *
     */
    colCount: number;
  }

  /**
   *
   */
  export
  interface IModelResetArgs {
    /**
     *
     */
    type: 'model-reset';
  }

  /**
   *
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
