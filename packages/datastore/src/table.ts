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
  Field, PrimaryKeyField
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
   * Create a new record in the table.
   *
   * @param id - The id for the record. The default is a new uuid4.
   *
   * @returns A new record with the specified id.
   *
   * #### Notes
   * If a record with the specified id already exists, the existing
   * record is returned.
   *
   * #### Complexity
   * `O(1)`
   */
  create(id?: string): ITable.Record<S>;
}


/**
 * The namespace for the `ITable` interface statics.
 */
export
namespace ITable {
  /**
   * A type definition for a table schema.
   *
   * #### Notes
   * The datastore assumes that peers may safely collaborate on tables
   * which share the same schema `id`.
   *
   * The schema `id` must be changed whenever changes are made to the
   * schema, or undefined behavior will result.
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
    readonly fields: {
      /**
       * A single `id` primary key field is required.
       */
      readonly id: PrimaryKeyField;

      /**
       * Any additional fields may be defined.
       */
      readonly [name: string]: Field;
    };
  };

  /**
   * A type alias which extracts the field names from a schema.
   */
  export
  type FieldNames<S extends Schema> = keyof S['fields'];

  /**
   * A type alias which extracts the mutable field names from a schema.
   */
  export
  type MutableFieldNames<S extends Schema> = {
    [N in FieldNames<S>]: S['fields'][N]['type'] extends 'value' ? N : never;
  }[FieldNames<S>];

  /**
   * A type alias which extracts the readonly field names from a schema.
   */
  export
  type ReadonlyFieldNames<S extends Schema> = {
    [N in FieldNames<S>]: S['fields'][N]['type'] extends 'value' ? never : N;
  }[FieldNames<S>];

  /**
   * A type alias for the mutable state of a record in a table.
   */
  export
  type MutableRecordState<S extends Schema> = {
    [N in MutableFieldNames<S>]: S['fields'][N]['@@ValueType'];
  };

  /**
   * A type alias for the readnly state of a record in a table.
   */
  export
  type ReadonlyRecordState<S extends Schema> = {
    readonly [N in ReadonlyFieldNames<S>]: S['fields'][N]['@@ValueType'];
  };

  /**
   * A type alias for a record in a table.
   */
  export
  type Record<S extends Schema> = (
    MutableRecordState<S> & ReadonlyRecordState<S>
  );

  /**
   * A type alias for changes to a record.
   */
  export
  type RecordChange<S extends Schema> = {
    readonly [N in FieldNames<S>]?: S['fields'][N]['@@ChangeType'];
  };

  /**
   * A type alias for a table change set.
   */
  export
  type ChangeSet<S extends Schema> = {
    readonly [recordId: string]: RecordChange<S>;
  };
}
