/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable
} from '@phosphor/algorithm';

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
   * A signal emitted when a record is created.
   */
  readonly recordCreated: ISignal<ITable<S>, string>;

  /**
   * A signal emitted when the state of a record has changed.
   */
  readonly recordChanged: ISignal<ITable<S>, ITable.IRecordChangedArgs<S>>;

  /**
   * The schema for the table.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly schema: S;

  /**
   * Whether the table is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly isEmpty: boolean;

  /**
   * The size of the table.
   *
   * #### Complexity
   * `O(1)`
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
   * `O(1)`
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
   * `O(1)`
   */
  get(id: string): IRecord<S> | undefined;

  /**
   * Create and insert a new record into the table.
   *
   * @param state - The initial state for the record.
   *
   * @returns The new record that was created.
   *
   * #### Complexity
   * `O(1)`
   *
   * #### Notes
   * Once created, a record cannot be deleted.
   */
  create(state: IRecord.UpdateState<S>): IRecord<S>;
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
  interface IRecordChangedArgs<S extends Schema> {
    /**
     * The unique id of the patch which generated the change.
     */
    readonly patchId: string;

    /**
     * The unique id of the record that was changed.
     */
    readonly recordId: string;

    /**
     * The partial change state for the record.
     */
    readonly changes: IRecord.ChangeState<S>;
  }
}
