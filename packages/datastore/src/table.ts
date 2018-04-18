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
  Field
} from './fields';


/**
 * A datastore object which holds a collection of records.
 */
export
interface ITable<S extends ITable.Schema> extends IIterable<ITable.Record<S>> {
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
   * Create a unique id which can be used for a new record.
   *
   * @returns A new id which is guaranteed to be unique for the table.
   *
   * #### Complexity
   * `O(1)`
   */
  newId(): string;

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
   * @returns The record for the specified id, or `undefined` if no
   *   such record exists.
   *
   * #### Complexity
   * `O(1)`
   */
  get(id: string): ITable.Record<S> | undefined;

  /**
   * Set the state of a record in the table.
   *
   * @param id - The id of the record of interest. If no such record
   *   exists, it will be created and added automatically.
   *
   * @param state - The partial state for updating the record.
   *
   * #### Complexity
   * `O(1)`
   */
  set(id: string, state: ITable.PartialRecordState<S>): void;
}


/**
 * The namespace for the `ITable` interface statics.
 */
export
namespace ITable {
  /**
   * A type definition for a schema.
   *
   * #### Notes
   * The datastore assumes that peers may safely collaborate on tables
   * which share the same schema `id`.
   *
   * The schema `id` **must** be changed whenever changes are made to
   * the schema, or undefined behavior **will** result.
   */
  export
  type Schema = {
    /**
     * The unique identifier for the schema.
     */
    readonly id: string;

    /**
     * The field definitions for the schema.
     */
    readonly fields: { readonly [key: string]: Field; };
  };

  /**
   * The extra state added to each record by the table.
   */
  export
  type ExtraRecordState = {
    /**
     * The unique id of the record.
     */
    readonly '@@id': string;
  };

  /**
   * A type alias for a record in a table.
   */
  export
  type Record<S extends Schema> = ExtraRecordState & {
    /**
     * The value state of a record.
     */
    readonly [K in keyof S['fields']]: S['fields'][K]['@@ValueType'];
  };

  /**
   * A type alias for the partial state of a record.
   */
  export
  type PartialRecordState<S extends Schema> = {
    /**
     * The partial state of a record.
     */
    readonly [K in keyof S['fields']]?: S['fields'][K]['@@PartialType'];
  };
}
