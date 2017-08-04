/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable
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

import {
  IDBTable
} from './dbtable';


/**
 * A db object which holds db tables and acts as the model root.
 */
export
interface IDBRoot extends IDBObject, IIterable<IDBTable<{}>> {
  /**
   * A signal emitted when the object changes.
   *
   * #### Notes
   * The changed signal is emitted asynchronously.
   */
  readonly changed: ISignal<this, IDBRoot.ChangedArgs>;

  /**
   * The db type of the object.
   *
   * #### Complexity
   * Constant.
   */
  readonly dbType: 'root';

  /**
   * Test whether the root has a specific table.
   *
   * @param token - The token for the table of interest.
   *
   * @returns `true` if the root has the table, `false` otherwise.
   */
  has<T extends DBRecord.State>(token: Token<T>): boolean;

  /**
   * Get the table for a specific token.
   *
   * @param token - The token for the table of interest.
   *
   * @returns The table for the specified token.
   *
   * @throws An exception if the table does not exist.
   */
  get<T extends DBRecord.State>(token: Token<T>): IDBTable<T>;

  /**
   * Insert a table into the root.
   *
   * @param table - The table to insert into in the root.
   *
   * @throws An exception if the table already exists.
   */
  insert<T extends DBRecord.State>(table: IDBTable<T>): void;

  /**
   * Delete a table from the root.
   *
   * @param token - The token for the table to delete.
   *
   * @throws An exception if the table does not exist.
   */
  delete<T extends DBRecord.State>(token: Token<T>): void;
}


/**
 * The namespace for the `IDBRoot` interface statics.
 */
export
namespace IDBRoot {
  /**
   * The type of the db root state changed arguments.
   */
  export
  type StateChangedArgs = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'root:changed';

    /**
     * The tables that were removed from the root.
     */
    readonly removed: ReadonlyArray<IDBTable<{}>>;

    /**
     * The tables that were added to the root.
     */
    readonly added: ReadonlyArray<IDBTable<{}>>;
  };

  /**
   * The type of the db root table changed arguments.
   */
  export
  type TableChangedArgs = IDBObject.ChangedArgs & {
    /**
     * The type of the change.
     */
    readonly type: 'root:table:changed';

    /**
     * The child table that was changed.
     */
    readonly child: IDBTable<{}>;

    /**
     * The args for the child change.
     */
    readonly childArgs: IDBTable.ChangedArgs<{}>;
  };

  /**
   * The type of the db root changed arguments.
   */
  export
  type ChangedArgs = StateChangedArgs | TableChangedArgs;
}
