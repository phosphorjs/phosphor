/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Field
} from './fields';


/**
 * An object which maintains a collection of records.
 */
export
interface ITable<T extends ITable.Schema> extends IIterable<ITable.Record<T>> {
  /**
   * A signal emitted when the table changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<ITable<T>, ReadonlyArray<ITable.Change<T>>>;

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
   * @returns The requested record, or `undefined` if the id is missing.
   *
   * #### Complexity
   * Constant.
   */
  get(id: string): ITable.Record<T> | undefined;

  /**
   * Create and insert a new record into the table.
   *
   * @param state - The initial state for the record.
   *
   * @returns The new record object that was added to the table.
   *
   * #### Complexity
   * Constant.
   */
  insert(state: ITable.InitialRecordState<T>): ITable.Record<T>;

  /**
   * Delete a record from the table.
   *
   * @param id - The id of the record to delete from the table.
   *
   * #### Complexity
   * Constant.
   */
  delete(id: string): void;

  /**
   * Remove multiple records from the table.
   *
   * @param ids - The iterable of ids to remove from the table.
   *
   * #### Complexity
   * Linear.
   */
  remove(ids: IterableOrArrayLike<string>): void;

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
   * A schema definition for a table.
   */
  export
  type Schema = {
    /**
     * The unique id for the schema.
     */
    readonly id: string;

    /**
     * The mapping of names to fields for the table records.
     *
     * #### Notes
     * Fields are converted to named properties on a record.
     *
     * The only reserved name is `@@id`. A table automatically
     * generates a unique `@@id` field for each record.
     */
    readonly fields: { readonly [key: string]: Field };
  };

  /**
   * A record definition for a table.
   */
  export
  type Record<T extends Schema> = { readonly '@@id': string } & {
    /**
     * The runtime properties of the record.
     */
    [K in keyof T['fields']]: T['fields'][K]['@@valueType'];
  };

  /**
   * The initial state for a record.
   */
  export
  type InitialRecordState<T extends Schema> = {
    /**
     * The initial state for the record.
     */
    [K in keyof T['fields']]?: T['fields'][K]['defaultValue'];
  };

  /**
   *
   */
  export
  type ChangedRecordState<T extends Schema> = {
    /**
     *
     */
    [K in keyof T['fields']]?: T['fields'][K]['@@changeType'];
  };

  /**
   *
   */
  export
  type TableChangedArgs<T extends Schema> = {
    /**
     *
     */
    readonly type: 'table-changed';

    /**
     *
     */
    readonly added: ReadonlyArray<string>;

    /**
     *
     */
    readonly removed: ReadonlyArray<string>;
  }

  /**
   *
   */
  export
  type RecordChangedArgs<T extends Schema> = {
    /**
     *
     */
    readonly type: 'record-changed';

    /**
     *
     */
    readonly recordId: string;

    /**
     *
     */
    readonly changes: ChangedRecordState<T>;
  };
}


let OutputAreaSchema = {
  id: '@jupyterlab/OutputArea',
  fields: {
    trusted: new BooleanField(),
    outputItemIds: new ListField<string>()
  }
}
