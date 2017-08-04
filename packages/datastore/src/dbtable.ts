/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  Token
} from '@phosphor/coreutils';

import {
  ISignal
} from '@phosphor/signaling';

import {
  IDBObject
} from './dbobject';

import {
  DBRecord
} from './dbrecord';


/**
 * A db object which holds records.
 */
export
interface IDBTable<T extends DBRecord.State> extends IDBObject, IIterable<DBRecord<T>> {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<this, IDBTable.ChangedArgs<T>>;

  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'table';

  /**
   * The token associated with the table.
   *
   * #### Complexity
   * Constant.
   */
  token: Token<T>;

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
   * Get the record for a particular id the table.
   *
   * @param id - The record id of interest.
   *
   * @returns The record for the id or `undefined` if the id is not
   *   present in the table.
   *
   * #### Complexity
   * Constant.
   */
  get(id: string): DBRecord<T> | undefined;

  /**
   * Insert a new record into the table
   *
   * @param state - The initial state for the record.
   *
   * @returns The new record object which was inserted.
   *
   * #### Complexity
   * Constant.
   */
  insert(record: DBRecord<T> | IterableOrArrayLike<DBRecord<T>>): void;

  /**
   * Delete a record or records from the table.
   *
   * @param id - The id(s) of the record(s) to delete from the table.
   *
   * #### Complexity
   * Linear on # of deleted items.
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
 * The namespace for the `IDBTable` interface statics.
 */
export
namespace IDBTable {
  /**
   * The type of the db table state changed arguments.
   */
  export
  type StateChangedArgs<T extends DBRecord.State> = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'table:changed';

    /**
     * The records that were removed from the table.
     */
    readonly removed: ReadonlyArray<DBRecord<T>>;

    /**
     * The records that were added to the table.
     */
    readonly added: ReadonlyArray<DBRecord<T>>;
  };

  /**
   * The type of the db table record changed arguments.
   */
  export
  type RecordChangedArgs<T extends DBRecord.State> = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'table:record:changed';

    /**
     * The child record that was changed.
     */
    readonly child: DBRecord<T>;

    /**
     * The args for the child change.
     */
    readonly childArgs: DBRecord.ChangedArgs<T>;
  };

  /**
   * The type of the db table changed arguments.
   */
  export
  type ChangedArgs<T extends DBRecord.State> = (
    StateChangedArgs<T> | RecordChangedArgs<T>
  );
}
