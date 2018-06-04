/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator
} from '@phosphor/algorithm';

import {
  TreeMap
} from "@phosphor/collections";

import {
  UUID
} from '@phosphor/coreutils';

import {
  DSHandler
} from './dshandler';

import {
  DSRecord
} from './dsrecord';

import {
  Record
} from './record';

import {
  Schema
} from './schema';

import {
  ITable
} from './table';


/**
 * A datastore table implementation.
 *
 * #### Notes
 * This class is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
class DSTable<S extends Schema> implements ITable<S> {
  /**
   * Construct a new datastore table.
   *
   * @param handler - The datastore handler object.
   *
   * @param schema - The schema for the table.
   */
  constructor(handler: DSHandler, schema: S) {
    this._handler = handler;
    this._schema = schema;
    this._factory = DSRecord.createFactory(handler, schema);
  }

  /**
   * The schema for the table.
   *
   * #### Complexity
   * `O(1)`
   */
  get schema(): S {
    return this._schema;
  }

  /**
   * Whether the table is empty.
   *
   * #### Complexity
   * `O(1)`
   */
  get isEmpty(): boolean {
    return this._records.isEmpty;
  }

  /**
   * The size of the table.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._records.size;
  }

  /**
   * Create an iterator over the records in the table.
   *
   * @returns A new iterator over the table records.
   *
   * #### Complexity
   * `O(1)`
   */
  iter(): IIterator<Record<S>> {
    return this._records.values();
  }

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
  has(id: string): boolean {
    return this._records.has(id);
  }

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
  get(id: string): Record<S> | undefined {
    return this._records.get(id);
  }

  /**
   * Create a new record in the table.
   *
   * @param id - The id for the record. The default is a new uuid4.
   **
   * @returns A new record with the specified id.
   *
   * @throws An exception if a record for the given id already exists.
   *
   * #### Complexity
   * `O(1)`
   */
  create(id = UUID.uuid4()): Record<S> {
    // Guard against disallowed mutations.
    this._handler.assertMutationsAllowed();

    // Throw an exception if the record already exists.
    if (this._records.has(id)) {
      throw new Error(`Record '${id}' already exists.`);
    }

    // Create the record.
    let record = this._factory(id);

    // Add the record to the table.
    this._records.set(id, record);

    // Broadcast the change to peers.
    this._handler.broadcastRecordCreate(this._schema.id, id);

    // Notify the user of the change.
    this._handler.notifyRecordCreate(this._schema.id, id);

    // Return the record to the user.
    return record;
  }

  private _schema: S;
  private _handler: DSHandler;
  private _factory: DSRecord.Factory<S>;
  private _records = new TreeMap<string, Record<S>>(Private.strCmp);
}

  // /**
  //  *
  //  */
  // broadcastRecordCreate(schemaId: string, recordId: string): void {
  //   this._ensureBroadcastRecordChanges(schemaId, recordId);
  // }

  // /**
  //  *
  //  */
  // notifyRecordCreate(schemaId: string, recordId: string): void {
  //   this._ensureNotifyRecordChanges(schemaId, recordId);
  // }

/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A 3-way string comparison function.
   */
  export
  function strCmp(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
  }
}
