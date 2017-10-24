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
  FieldSet
} from './fields';

import {
  IRecord
} from './record';


/**
 * An object which maintains a collection of records.
 */
export
interface ITable<T extends FieldSet> extends IIterable<IRecord<T>> {
  /**
   * A signal emitted when the state of the table changes.
   */
  readonly tableChanged: ISignal<ITable<T>, ITable.IChangedArgs>;

  /**
   * A signal emitted when the state of a record changes.
   */
  readonly recordChanged: ISignal<ITable<T>, IRecord.IChangedArgs<T>>;

  /**
   * The field set for the table.
   *
   * #### Complexity
   * Constant.
   */
  readonly fields: T;

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
   * @param id - The record id of interest.
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
   * @param id - The record id of interest.
   *
   * @returns The requested record, or `undefined` if the id is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(id: string): IRecord<T> | undefined;

  /**
   * Insert a new record into the table.
   *
   * @param state - The partial initial state for the record.
   *
   * @returns The new record object that was added to the table.
   *
   * #### Complexity
   * Constant.
   */
  insert(state: IRecord.UpdateState<T>): IRecord<T>;

  /**
   * Delete one or more records from the table.
   *
   * @param id - The id(s) of the record(s) to delete from the table.
   *
   * #### Complexity
   * Constant.
   */
  delete(id: string | IterableOrArrayLike<string>): void;

  /**
   * Clear all records from the table.
   *
   * #### Complexity
   * Linear.
   */
  clear(): void;
}


/**
 * The namespace for the `ITable` interface statics.
 */
export
namespace ITable {
  /**
   * The arguments object for the `tableChanged` signal.
   */
  export
  interface IChangedArgs {
    /**
     * The type of the table change.
     */
    readonly type: 'record-inserted' | 'record-deleted';

    /**
     * The unique id of the patch which generated the change.
     */
    readonly patchId: string;

    /**
     * The unique id of the record which was inserted or deleted.
     */
    readonly recordId: string;
  }
}
