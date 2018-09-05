/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, StringExt
} from '@phosphor/algorithm';

import {
  BPlusTree
} from '@phosphor/collections';

import {
  UUID
} from '@phosphor/coreutils';

import {
  Record
} from './record';

import {
  Schema
} from './schema';

import {
  Store
} from './store';


/**
 * A data store object which holds a collection of records.
 */
export
class Table<S extends Schema = Schema> implements IIterable<Record<S>> {
  /**
   * @internal
   *
   * Create a new data store table.
   *
   * @param parent - The parent of the table.
   *
   * @param schema - The schema for the table.
   *
   * @returns A new data store table.
   *
   * #### Notes
   * This method is an internal implementation detail.
   */
  static create<U extends Schema = Schema>(parent: Store, schema: U): Table<U> {
    return new Table<U>(parent, schema);
  }

  /**
   * The parent of the table.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly parent: Store;

  /**
   * The schema for the table.
   *
   * #### Complexity
   * `O(1)`
   */
  readonly schema: S;

  /**
   * The version number of the table.
   *
   * #### Complexity
   * `O(1)`
   */
  get version(): number {
    return this._version;
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
   * `O(log32 n)`
   */
  iter(): IIterator<Record<S>> {
    return this._records.iter();
  }

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
  has(id: string): boolean {
    return this._records.has(id, Private.recordIdCmp);
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
   * `O(log32 n)`
   */
  get(id: string): Record<S> | undefined {
    return this._records.get(id, Private.recordIdCmp);
  }

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
  create(id = UUID.uuid4()): Record<S> {
    // Guard against disallowed mutations.
    this.parent.mutationGuard();

    // Throw an exception if the record already exists.
    if (this.has(id)) {
      throw new Error(`Record '${id}' already exists.`);
    }

    // Bump the version number.
    let version = this._version++;

    // Create the record.
    let record = this._factory(id);

    // Insert the record into the table.
    this._records.insert(record);

    // Notify the store of the mutation.
    this.parent.processRecordCreation(this, id);

    // Return the record to the user.
    return record;
  }

  /**
   * Construct a new data store table.
   *
   * @param parent - The parent store object.
   *
   * @param schema - The schema for the table.
   */
  private constructor(parent: Store, schema: S) {
    this.parent = parent;
    this.schema = schema;
    this._factory = Record.createFactory(this, schema);
  }

  private _version = 0;
  private _factory: Record.Factory<S>;
  private _records = new BPlusTree<Record<S>>(Private.recordCmp);
}


/**
 * The namespace for the `Table` class statics.
 */
export
namespace Table {
  /**
   * A type alias for a table change set.
   */
  export
  type ChangeSet<S extends Schema> = {
    readonly [recordId: string]: Record.ChangeSet<S>;
  };
}


/**
 * The namespace for the module implementation details.
 */
export
namespace Private {
  /**
   * A three-way comparison function for records.
   */
  export
  function recordCmp<S extends Schema>(a: Record<S>, b: Record<S>): number {
    return StringExt.cmp(a.$id, b.$id);
  }

  /**
   * A three-way record id comparison function.
   */
  export
  function recordIdCmp<S extends Schema>(record: Record<S>, id: string): number {
    return StringExt.cmp(record.$id, id);
  }
}
