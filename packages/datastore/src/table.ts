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
  Record
} from './record';

import {
  Schema
} from './schema';


/**
 * A datastore object which holds a collection of records.
 */
export
interface ITable<S extends Schema = Schema> extends IIterable<Record<S>> {
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
   * `O(log32 n)`
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
   * `O(log32 n)`
   */
  get(id: string): Record<S> | undefined;

  /**
   * Create a new record in the table.
   *
   * @param id - The id for the record. The default is a new UUIDv4.
   *
   * @returns A new record with the specified id.
   *
   * @throws An exception if a record for the given id already exists.
   *
   * #### Complexity
   * `O(log32 n)`
   */
  create(id?: string): Record<S>;
}


/**
 * The namespace for the `ITable` interface statics.
 */
export
namespace ITable {
  /**
   * A type alias for a table change set.
   */
  export
  type ChangeSet<S extends Schema> = {
    readonly [recordId: string]: Record.ChangeSet<S>;
  };
}
