/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterator, iterValues
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue, UUID
} from '@phosphor/coreutils';

import {
  DatastoreImpl
} from './datastoreimpl';

import {
  ListImpl
} from './listimpl';

import {
  MapImpl
} from './mapimpl';

import {
  ITable
} from './table';

import {
  TextImpl
} from './textimpl';


/**
 * The concrete implementation of the `ITable` data store object.
 *
 * #### Notes
 * This class is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
class TableImpl<S extends ITable.Schema> implements ITable<S> {
  /**
   * Construct a new table implementation.
   *
   * @param store - The datastore which owns the table.
   *
   * @param schema - The schema for the table.
   */
  constructor(store: DatastoreImpl, schema: S) {
    this._store = store;
    this._schema = schema;
    this._factory = Private.createRecordFactory(store, schema);
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
    return this._size === 0;
  }

  /**
   * The size of the table.
   *
   * #### Complexity
   * `O(1)`
   */
  get size(): number {
    return this._size;
  }

  /**
   * Create an iterator over the records in the table.
   *
   * @returns A new iterator over the table records.
   *
   * #### Complexity
   * `O(1)`
   */
  iter(): IIterator<ITable.Record<S>> {
    return iterValues(this._records);
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
    return id in this._records;
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
  get(id: string): ITable.Record<S> | undefined {
    return this._records[id];
  }

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
  create(id = UUID.uuid4()): ITable.Record<S> {
    // Guard against disallowed mutations.
    this._store.assertMutationsAllowed();

    // Return the record if it already exists.
    if (id in this._records) {
      return this._records[id];
    }

    // Create the record.
    let factory = this._factory;
    let record = factory(id);

    // Add the record to the table.
    this._records[id] = record;
    this._size++;

    // Broadcast the change to peers.
    this._store.broadcastRecordCreate(this._schema.id, id);

    // Notify the user of the change.
    this._store.notifyRecordCreate(this._schema.id, id);

    // Return the record to the user.
    return record;
  }

  private _size = 0;
  private _schema: S;
  private _store: DatastoreImpl;
  private _factory: Private.RecordFactory<S>;
  private _records: { [id: string]: ITable.Record<S> } = Object.create(null);
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for a record factory function.
   */
  export
  type RecordFactory<S extends ITable.Schema> = (id: string) => ITable.Record<S>;

  /**
   * Create a factory function for creating new records.
   *
   * @param store - The datastore which owns the records.
   *
   * @param schema - The table schema for the records.
   *
   * @returns A factory function for creating new records.
   */
  export
  function createRecordFactory<S extends ITable.Schema>(store: DatastoreImpl, schema: S): RecordFactory<S> {
    // Create the record prototype.
    const prototype: any = {};

    // Create the prototype properties.
    for (let name in schema.fields) {
      let field = schema.fields[name];
      let key = field['@@ValueKey'];
      switch (field.type) {
      case 'primarykey':
      case 'list':
      case 'map':
      case 'text':
        Object.defineProperty(prototype, name, {
          get: createPropertyGetter(key),
          enumerable: true,
          configurable: false
        });
        break;
      case 'value':
        Object.defineProperty(prototype, name, {
          get: createRegisterGetter(key),
          set: createRegisterSetter(store, schema.id, name, key),
          enumerable: true,
          configurable: false
        });
        break;
      default:
        throw 'unreachable';
      }
    }

    // Create the record factory function.
    function createRecord(id: string): ITable.Record<S> {
      let record = Object.create(prototype);
      for (let name in schema.fields) {
        let field = schema.fields[name];
        let key = field['@@ValueKey'];
        switch (field.type) {
        case 'primarykey':
          record[key] = id;
          break;
        case 'list':
          record[key] = ListImpl.fromValue(
            store, schema.id, id, name, field.initialValue
          );
          break;
        case 'map':
          record[key] = MapImpl.fromValue(
            store, schema.id, id, name, field.initialValue
          );
          break;
        case 'text':
          record[key] = TextImpl.fromValue(
            store, schema.id, id, name, field.initialValue
          );
          break;
        case 'value':
          record[key] = createInitialRegisterEntry(field.initialValue);
          break;
        default:
          throw 'unreachable';
        }
      }
      return record;
    }

    // Return the record factory function.
    return createRecord;
  }

  /**
   * Create a getter function for a record property.
   */
  function createPropertyGetter(key: symbol): () => any {
    return function() { return this[key]; };
  }

  /**
   * Create a getter function for a record register property.
   */
  function createRegisterGetter(key: symbol): () => any {
    return function() { return (this[key] as IRegisterEntry).value; };
  }

  /**
   * Create a setter function for a record register property.
   */
  function createRegisterSetter(store: DatastoreImpl, schemaId: string, name: string, key: symbol): (value: any) => void {
    return function(value: any) {
      // Guard against disallowed mutations.
      store.assertMutationsAllowed();

      // Fetch the current register entry.
      let entry = this[key] as IRegisterEntry;

      // Fetch the clock and store id.
      let clock = store.clock;
      let storeId = store.id;

      // If the current entry has the same clock and store id, it means
      // the register is being updated again during the same patch. For
      // that case, replace the current entry.
      if (entry.clock === clock && entry.storeId === storeId) {
        this[key] = { value, clock, storeId, next: entry.next };
      } else {
        this[key] = { value, clock, storeId, next: entry };
      }

      // Broadcast the change to peers.
      store.broadcastRegisterChange(schemaId, this.id, name, value);

      // Notify the user of the change.
      store.notifyRegisterChange(schemaId, this.id, name, entry.value, value);
    };
  }

  /**
   * An object which represents an entry in a register.
   */
  interface IRegisterEntry {
    /**
     * The value for the entry.
     */
    readonly value: ReadonlyJSONValue;

    /**
     * The clock value when the entry was created.
     */
    readonly clock: number;

    /**
     * The id of the datastore which created the entry.
     */
    readonly storeId: number;

    /**
     * The next register entry in the list.
     */
    next: IRegisterEntry | null;
  }

  /**
   * Create a register entry for an initial value.
   */
  function createInitialRegisterEntry(value: ReadonlyJSONValue): IRegisterEntry {
    return { value, clock: 0, storeId: 0, next: null };
  }
}
