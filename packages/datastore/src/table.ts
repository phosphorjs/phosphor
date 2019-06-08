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
  Datastore
} from './datastore';

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
class Table<S extends Schema> implements IIterable<Record<S>> {
  /**
   * @internal
   *
   * Create a new datastore table.
   *
   * @param schema - The schema for the table.
   *
   * @param context - The datastore context.
   *
   * @returns A new datastore table.
   */
  static create<U extends Schema>(schema: U, context: Datastore.Context): Table<U> {
    return new Table<U>(schema, context);
  }

  /**
   * @internal
   *
   * Apply a patch to a datastore table.
   *
   * @param table - The table of interest.
   *
   * @param data - The patch to apply to the table.
   *
   * @returns The user-facing change to the table.
   */
  static patch<U extends Schema>(table: Table<U>, data: Table.Patch<U>): Table.Change<U> {
    // Create the change object.
    let tc: Table.MutableChange<U> = {};

    // Fetch common variables.
    let schema = table.schema;
    let records = table._records;
    let cmp = Private.recordIdCmp;

    // Iterate over the dataset.
    for (let id in data) {
      // Get or create the old record.
      let old = records.get(id, cmp) || Private.createRecord(schema, id);

      // Apply the patch and create the new record.
      let { record, change } = Private.applyPatch(schema, old, data[id]);

      // Replace the old record in the table.
      records.insert(record);

      // Update the change object.
      tc[id] = change;
    }

    // Return the change object.
    return tc;
  }

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
   * Update one or more records in the table.
   *
   * @param data - The data for updating the records.
   *
   * #### Notes
   * If a specified record does not exist, it will be created.
   *
   * This method may only be called during a datastore transaction.
   */
  update(data: Table.Update<S>): void {
    // Fetch the context.
    let context = this._context;

    // Ensure the update happens during a transaction.
    if (!context.inTransaction) {
      throw new Error('A table can only be updated during a transaction.');
    }

    // Fetch common variables.
    let schema = this.schema;
    let records = this._records;
    let cmp = Private.recordIdCmp;

    // Iterate over the data.
    for (let id in data) {
      // Get or create the old record.
      let old = records.get(id, cmp) || Private.createRecord(schema, id);

      // Apply the update and create the new record.
      let record = Private.applyUpdate(schema, old, data[id], context);

      // Replace the old record in the table.
      records.insert(record);
    }
  }

  /**
   * Construct a new datastore table.
   *
   * @param schema - The schema for the table.
   *
   * @param context - The datastore context.
   */
  private constructor(schema: S, context: Datastore.Context) {
    this.schema = schema;
    this._context = context;
  }

  private _context: Datastore.Context;
  private _records = new BPlusTree<Record<S>>(Private.recordCmp);
}


/**
 * The namespace for the `Table` class statics.
 */
export
namespace Table {
  /**
   * A type alias for the table update type.
   */
  export
  type Update<S extends Schema> = {
    readonly [recordId: string]: Record.Update<S>;
  };

  /**
   * A type alias for the table change type.
   */
  export
  type Change<S extends Schema> = {
    readonly [recordId: string]: Record.Change<S>;
  };

  /**
   * A type alias for the table patch type.
   */
  export
  type Patch<S extends Schema> = {
    readonly [recordId: string]: Record.Patch<S>;
  };

  /**
   * @internal
   *
   * A type alias for the table mutable change type.
   */
  export
  type MutableChange<S extends Schema> = {
    [recordId: string]: Record.MutableChange<S>;
  };

  /**
   * @internal
   *
   * A type alias for the table mutable patch type.
   */
  export
  type MutablePatch<S extends Schema> = {
    [recordId: string]: Record.MutablePatch<S>;
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A three-way record comparison function.
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

  /**
   * Create a new record object.
   *
   * @param schema - The schema for the record.
   *
   * @param id - The unique id for the record.
   *
   * @returns A new default initialized record.
   */
  export
  function createRecord<S extends Schema>(schema: S, id: string): Record<S> {
    // Create the record and metadata objects.
    let record: any = {};
    let metadata: any = {};

    // Set the base record state.
    record.$id = id;
    record['@@metadata'] = metadata;

    // Populate the record and metadata.
    for (let name in schema.fields) {
      let field = schema.fields[name];
      record[name] = field.createValue();
      metadata[name] = field.createMetadata();
    }

    // Return the new record.
    return record;
  }

  /**
   * Apply an update to a record.
   *
   * @param schema - The schema for the record.
   *
   * @param record - The record of interest.
   *
   * @param update - The update to apply to the record.
   *
   * @param context - The datastore context.
   *
   * @returns A new record with the update applied.
   */
  export
  function applyUpdate<S extends Schema>(schema: S, record: Record<S>, update: Record.Update<S>, context: Datastore.Context): Record<S> {
    // Fetch the version and store id.
    let version = context.version;
    let storeId = context.storeId;

    // Fetch or create the table change and patch.
    let tc = context.change[schema.id] || (context.change[schema.id] = {});
    let tp = context.patch[schema.id] || (context.patch[schema.id] = {});

    // Fetch or create the record change and patch.
    let rc = tc[record.$id] || (tc[record.$id] = {});
    let rp = tp[record.$id] || (tp[record.$id] = {});

    // Cast the record to a value object.
    let previous = record as Record.Value<S>;

    // Fetch the record metadata.
    let metadata = record['@@metadata'];

    // Create a clone of the record.
    let clone = { ...(record as any) };

    // Iterate over the update.
    for (let name in update) {
      // Fetch the relevant field.
      let field = schema.fields[name];

      // Apply the update for the field.
      let { value, change, patch } = field.applyUpdate({
        previous: previous[name],
        update: update[name]!,
        metadata: metadata[name],
        version,
        storeId
      });

      // Assign the new value to the clone.
      clone[name] = value;

      // Merge the change if needed.
      if (name in rc) {
        change = field.mergeChange(rc[name]!, change);
      }

      // Merge the patch if needed.
      if (name in rp) {
        patch = field.mergePatch(rp[name]!, patch);
      }

      // Update the record change and patch for the field.
      rc[name] = change;
      rp[name] = patch;
    }

    // Return the new record.
    return clone;
  }

  /**
   * A type alias for the result of a patch operation.
   */
  export
  type PatchResult<S extends Schema> = {
    /**
     * The new record object.
     */
    readonly record: Record<S>;

    /**
     * The user-facing change object.
     */
    readonly change: Record.Change<S>;
  };

  /**
   * Apply a patch to a record.
   *
   * @param schema - The schema for the record.
   *
   * @param record - The record of interest.
   *
   * @param patch - The patch to apply to the record.
   *
   * @return The result of applying the patch.
   */
  export
  function applyPatch<S extends Schema>(schema: S, record: Record<S>, patch: Record.Patch<S>): PatchResult<S> {
    // Create the change object.
    let rc: Record.MutableChange<S> = {};

    // Cast the record to a value object.
    let previous = record as Record.Value<S>;

    // Fetch the record metadata.
    let metadata = record['@@metadata'];

    // Create a clone of the record.
    let clone = { ...(record as any) };

    // Iterate over the patch.
    for (let name in patch) {
      // Fetch the relevant field.
      let field = schema.fields[name];

      // Apply the patch for the field.
      let { value, change } = field.applyPatch({
        previous: previous[name],
        patch: patch[name]!,
        metadata: metadata[name]
      });

      // Assign the new value to the clone.
      clone[name] = value;

      // Update the change object.
      rc[name] = change;
    }

    // Return the patch result.
    return { record: clone, change: rc };
  }
}
