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

import {
  IRecord
} from './record';

import {
  Schema
} from './schema';


/**
 * An object which maintains a collection of records.
 */
export
interface ITable<S extends Schema> extends IIterable<IRecord<S>> {
  /**
   * A signal emitted when a record is inserted.
   *
   * #### Notes
   * The payload is the id of the record that was inserted.
   */
  readonly recordInserted: ISignal<ITable<S>, string>;

  /**
   * A signal emitted when the state of a record changes.
   *
   * #### Notes
   * This can be used to handle changes for multiple records.
   */
  readonly recordChanged: ISignal<ITable<S>, ITable.IRecordChangedArgs<S>>;

  /**
   * The schema for the table.
   *
   * #### Complexity
   * Constant.
   */
  readonly schema: T;

  /**
   * Whether the table is empty.
   *
   * #### Complexity
   * Constant.
   */
  readonly isEmpty: boolean;

  /**
   * The size of the table.
   *
   * #### Complexity
   * Constant.
   */
  readonly size: number;

  /**
   * Test whether the table has a particular record.
   *
   * @param id - The id of the record of interest.
   *
   * @returns `true` if the table has the record, `false` otherwise.
   *
   * #### Complexity
   * Constant.
   */
  has(id: string): boolean;

  /**
   * Get the record for a particular id in the table.
   *
   * @param id - The id of the record of interest.
   *
   * @returns The requested record, or `undefined` if a record with the
   *   given id does not exist in the table.
   *
   * #### Complexity
   * Constant.
   */
  get(id: string): IRecord<S> | undefined;

  /**
   * Create and insert a new record into the table.
   *
   * @param state - The initial state for the record.
   *
   * @returns The new record that was inserted into the table.
   *
   * #### Complexity
   * Constant.
   *
   * #### Notes
   * Once created, a record cannot be deleted.
   */
  insert(state: IRecord.UpdateState<S>): IRecord<S>;
}


/**
 * The namespace for the `ITable` interface statics.
 */
export
namespace ITable {
  /**
   * The arguments object for the `recordChanged` signal.
   */
  export
  interface IRecordChangedArgs<S extends Schema> extends IRecord.IChangedArgs<S> {
    /**
     * The id of the record that was changed.
     */
    readonly recordId: string;
  }
}
