/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  JSONPrimitive, JSONValue
} from '@phosphor/coreutils';


/**
 * A namespace for working with normalized tabular data stores.
 *
 * #### Notes
 * This namespace is a collection of types and helper functions which
 * are designed to make it easy to work with maximally flat immutable
 * data stores.
 */
export
namespace Table {
  /**
   * A type alias for a primitive list.
   */
  export
  type List<T extends JSONPrimitive> = ReadonlyArray<T>;

  /**
   * A type alias for a primitive record.
   */
  export
  type Record<K extends string> = { readonly [P in K]: JSONPrimitive; };

  /**
   * A type alias for a table which holds primitive lists.
   */
  export
  type ListTable<T extends JSONPrimitive> = { readonly [id: string]: List<T>; };

  /**
   * A type alias for a table which holds primitive records.
   */
  export
  type RecordTable<T extends Record<keyof T>> = { readonly [id: string]: T; };

  /**
   * A type alias for a table which holds arbitrary JSON.
   *
   * #### Notes
   * Since JSON can be arbitrarily nested, the user is responsible for
   * making immutable changes to the JSON, and then using an 'update'
   * operation to replace the old value atomically.
   */
  export
  type JSONTable<T extends JSONValue> = { readonly [id: string]: T; };

  /**
   * A table operation for inserting a new entry.
   *
   * An exception is thrown if the entry already exists.
   */
  export
  type InsertOp<T> = {
    /**
     * The type of the operation.
     */
    readonly type: 'insert';

    /**
     * The id for the new entry.
     */
    readonly id: string;

    /**
     * The value to add to the table.
     */
    readonly value: T;
  };

  /**
   * A table operation for replacing an existing entry.
   *
   * An exception is thrown if the entry does not exist.
   */
  export
  type ReplaceOp<T> = {
    /**
     * The type of the operation.
     */
    readonly type: 'replace';

    /**
     * The id of the entry to replace.
     */
    readonly id: string;

    /**
     * The new value for the entry.
     */
    readonly value: T;
  };

  /**
   * A table operation for deleting an existing entry.
   *
   * An exception is thrown if the entry does not exist.
   */
  export
  type DeleteOp<T> = {
    /**
     * The type of the operation.
     */
    readonly type: 'delete';

    /**
     * The id of the entry to delete.
     */
    readonly id: string;
  };

  /**
   * A table operation for updating a record.
   *
   * An exception is thrown if the record does not exist.
   */
  export
  type UpdateOp<T> = {
    /**
     * The type of the operation.
     */
    readonly type: 'update';

    /**
     * The id of the record to update.
     */
    readonly id: string;

    /**
     * The new state to apply to the record.
     */
    readonly value: Partial<T>;
  };

  /**
   * A table operation for appending to a list.
   *
   * An exception is thrown if the list does not exist.
   */
  export
  type AppendOp<T> = {
    /**
     * The type of the operation.
     */
    readonly type: 'append';

    /**
     * The id of the list to update.
     */
    readonly id: string;

    /**
     * The values to append to the list.
     */
    readonly values: T[];
  };

  /**
   * A table operation for prepending to a list.
   *
   * An exception is thrown if the list does not exist.
   */
  export
  type PrependOp<T> = {
    /**
     * The type of the operation.
     */
    readonly type: 'prepend';

    /**
     * The id of the list to update.
     */
    readonly id: string;

    /**
     * The values to prepend to the list.
     */
    readonly values: T[];
  };

  /**
   * A table operation for splicing a a list.
   *
   * An exception is thrown if the list does not exist.
   */
  export
  type SpliceOp<T> = {
    /**
     * The type of the operation.
     */
    readonly type: 'splice';

    /**
     * The id of the list to update.
     */
    readonly id: string;

    /**
     * The index of the splice.
     */
    readonly index: number;

    /**
     * The number of elements to remove.
     */
    readonly count: number;

    /**
     * The elements to insert.
     */
    readonly values: T[];
  };

  /**
   * A type alias of the basic table operations.
   */
  export
  type BasicOp<T> = InsertOp<T> | ReplaceOp<T> | DeleteOp<T>;

  /**
   * A type alias of record operations.
   */
  export
  type RecordOp<T> = UpdateOp<T>;

  /**
   * A type alias of list operations.
   */
  export
  type ListOp<T> = AppendOp<T> | PrependOp<T> | SpliceOp<T>;

  /**
   * A type alias of operations for JSON tables.
   */
  export
  type JSONTableOp<T> = BasicOp<T>;

  /**
   * A type alias of operations for record tables.
   */
  export
  type RecordTableOp<T> = BasicOp<T> | RecordOp<T>;

  /**
   * A type alias of records for list tables.
   */
  export
  type ListTableOp<T> = BasicOp<T> | ListOp<T>;

  /**
   * A type alias of all possible table operations.
   */
  export
  type AnyTableOp<T> = BasicOp<T> | RecordOp<T> | ListOp<T>;

  /**
   * Create a new 'insert' operation.
   *
   * @param id - The id of the entry to insert.
   *
   * @param value - The value for the entry.
   *
   * @returns A new 'insert' operation.
   */
  export
  function $insert<T>(id: string, value: T): InsertOp<T> {
    return { type: 'insert', id, value };
  }

  /**
   * Create a new 'replace' operation.
   *
   * @param id - The id of the entry to replace.
   *
   * @param value - The new value for the entry.
   *
   * @returns A new 'replace' operation.
   */
  export
  function $replace<T>(id: string, value: T): ReplaceOp<T> {
    return { type: 'replace', id, value };
  }

  /**
   * Create a new 'delete' operation.
   *
   * @param id - The id of the entry to delete.
   *
   * @returns A new 'delete' operation.
   */
  export
  function $delete<T>(id: string): DeleteOp<T> {
    return { type: 'delete', id };
  }

  /**
   * Create a new 'update' operation.
   *
   * @param id - The id of the record to update.
   *
   * @param value - The new state for the record.
   *
   * @returns A new 'update' operation.
   */
  export
  function $update<T>(id: string, value: Partial<T>): UpdateOp<T> {
    return { type: 'update', id, value };
  }

  /**
   * Create a new 'append' operation.
   *
   * @param id - The id of the list to update.
   *
   * @param values - The values to append.
   *
   * @returns A new 'append' operation.
   */
  export
  function $append<T>(id: string, values: T[]): AppendOp<T> {
    return { type: 'append', id, values };
  }

  /**
   * Create a new 'prepend' operation.
   *
   * @param id - The id of the list to update.
   *
   * @param values - The values to prepend.
   *
   * @returns A new 'prepend' operation.
   */
  export
  function $prepend<T>(id: string, values: T[]): PrependOp<T> {
    return { type: 'prepend', id, values };
  }

  /**
   * Create a new 'splice' operation.
   *
   * @param id - The id of the list to update.
   *
   * @param index - The index of the splice.
   *
   * @param count - The number of elements to remove.
   *
   * @param values - The values to insert.
   *
   * @returns A new 'splice' operation.
   */
  export
  function $splice<T>(id: string, index: number, count: number, values: T[]): SpliceOp<T> {
    return { type: 'splice', id, index, count, values };
  }

  /**
   * Apply a sequence of operations to a table.
   *
   * @param table - The table to modify.
   *
   * @param ops - The operations to apply to the table.
   *
   * @returns A new table with the applied operations.
   */
  export
  function apply<T extends JSONValue>(table: JSONTable<T>, ops: JSONTableOp<T>[]): JSONTable<T>;
  export
  function apply<T extends Record<keyof T>>(table: RecordTable<T>, ops: RecordTableOp<T>[]): RecordTable<T>;
  export
  function apply<T extends JSONPrimitive>(table: ListTable<T>, ops: ListTableOp<T>[]): ListTable<T>;
  export
  function apply(table: any, ops: AnyTableOp<any>[]): any {
    // Create a shallow copy of the table.
    let newTable = { ...table };

    // Apply the op(s) to the new table.
    for (let i = 0, n = ops.length; i < n; ++i) {
      Private.apply(table, newTable, ops[i]);
    }

    // Return the new table.
    return newTable;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Apply a single operation to a table.
   */
  export
  function apply(oldTable: any, newTable: any, op: Table.AnyTableOp<any>): any {
    switch (op.type) {
    case 'insert':
      doInsert(oldTable, newTable, op);
      break;
    case 'replace':
      doReplace(oldTable, newTable, op);
      break;
    case 'delete':
      doDelete(oldTable, newTable, op);
      break;
    case 'update':
      doUpdate(oldTable, newTable, op);
      break;
    case 'append':
      doAppend(oldTable, newTable, op);
      break;
    case 'prepend':
      doPrepend(oldTable, newTable, op);
      break;
    case 'splice':
      doSplice(oldTable, newTable, op);
      break;
    default:
      throw 'unreachable';
    }
  }

  /**
   * Throw an exception if an id is not in the table.
   */
  function ensureExists(table: any, id: string): void {
    if (!(id in table)) {
      throw new Error(`Id '${id}' does not exist in the table.`);
    }
  }

  /**
   * Throw an exception if an id is already in the table.
   */
  function ensureMissing(table: any, id: string): void {
    if (id in table) {
      throw new Error(`Id '${id}' already exists in the table.`);
    }
  }

  /**
   * Handle the 'insert' operation.
   */
  function doInsert(oldTable: any, newTable: any, op: Table.InsertOp<any>): void {
    ensureMissing(oldTable, op.id);
    newTable[op.id] = op.value;
  }

  /**
   * Handle the 'replace' operation.
   */
  function doReplace(oldTable: any, newTable: any, op: Table.ReplaceOp<any>): void {
    ensureExists(oldTable, op.id);
    newTable[op.id] = op.value;
  }

  /**
   * Handle the 'delete' operation.
   */
  function doDelete(oldTable: any, newTable: any, op: Table.DeleteOp<any>): void {
    ensureExists(oldTable, op.id);
    delete newTable[op.id];
  }

  /**
   * Handle the 'update' operation.
   */
  function doUpdate(oldTable: any, newTable: any, op: Table.UpdateOp<any>): void {
    ensureExists(oldTable, op.id);
    newTable[op.id] = { ...oldTable[op.id], ...op.value };
  }

  /**
   * Handle the 'append' operation.
   */
  function doAppend(oldTable: any, newTable: any, op: Table.AppendOp<any>): void {
    ensureExists(oldTable, op.id);
    newTable[op.id] = [...oldTable[op.id], ...op.values];
  }

  /**
   * Handle the 'prepend' operation.
   */
  function doPrepend(oldTable: any, newTable: any, op: Table.PrependOp<any>): void {
    ensureExists(oldTable, op.id);
    newTable[op.id] = [...op.values, ...oldTable[op.id]];
  }

  /**
   * Handle the 'splice' operation.
   */
  function doSplice(oldTable: any, newTable: any, op: Table.SpliceOp<any>): void {
    ensureExists(oldTable, op.id);
    let list = oldTable[op.id].slice();
    list.splice(op.index, op.count, ...op.values);
    newTable[op.id] = list;
  }
}
