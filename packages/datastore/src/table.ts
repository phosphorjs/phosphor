/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * A namespace for working with normalized tabular data stores.
 *
 * #### Notes
 * This namespace is a collection of types and helper functions which
 * are designed to make it easy to work with maximally flat immutable
 * data stores.
 *
 * All of the table manipulation functions in this namespace are pure,
 * and return a minimal shallow copy of the table with the new state.
 */
export
namespace Table {
  /**
   * A type alias for a scalar table value.
   */
  export
  type Value = string | number | boolean | null;

  /**
   * A type alias for a list table value.
   */
  export
  type List<T extends Value> = ReadonlyArray<T>;

  /**
   * A type alias for a record table value.
   */
  export
  type Record<K extends string> = { readonly [P in K]: Value; };

  /**
   * A type alias for a table which holds scalar values.
   */
  export
  type ValueTable<T extends Value> = { readonly [id: string]: T; };

  /**
   * A type alias for a table which holds lists.
   */
  export
  type ListTable<T extends Value> = { readonly [id: string]: List<T>; };

  /**
   * A type alias for a table which holds records.
   */
  export
  type RecordTable<T extends Record<keyof T>> = { readonly [id: string]: T; };

  /**
   * Insert a new entry into a table.
   *
   * @param table - The table of interest.
   *
   * @param id - The id for the entry.
   *
   * @param entry - The entry to add to the table.
   *
   * @returns A table with the inserted entry.
   *
   * @throws An error if the id already exists in the table.
   */
  export
  function insert<T extends Record<keyof T>>(table: RecordTable<T>, id: string, entry: T): RecordTable<T>;
  export
  function insert<T extends Value>(table: ListTable<T>, id: string, entry: T): ListTable<T>;
  export
  function insert<T extends Value>(table: ValueTable<T>, id: string, entry: T): ValueTable<T>;
  export
  function insert(table: any, id: string, entry: any): any {
    // Throw an error if the id already exists.
    if (id in table) {
      throw new Error(`Id '${id}' already exists in the table.`);
    }

    // Add the entry to the table.
    return { ...table, [id]: entry };
  }

  /**
   * Replace an entry in a table.
   *
   * @param table - The table of interest.
   *
   * @param id - The id of the entry.
   *
   * @param entry - The new entry object.
   *
   * @returns A table with the replaced entry.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function replace<T extends Record<keyof T>>(table: RecordTable<T>, id: string, entry: T): RecordTable<T>;
  export
  function replace<T extends Value>(table: ListTable<T>, id: string, entry: T): ListTable<T>;
  export
  function replace<T extends Value>(table: ValueTable<T>, id: string, entry: T): ValueTable<T>;
  export
  function replace(table: any, id: string, entry: any): any {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Id '${id}' does not exist in the table.`);
    }

    // Return the original table if there is no change.
    if (table[id] === entry) {
      return table;
    }

    // Replace the entry in the table.
    return { ...table, [id]: entry };
  }

  /**
   * Remove an entry from a table.
   *
   * @param table - The table of interest.
   *
   * @param id - The id of the entry.
   *
   * @returns A table without the specified entry.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function remove<T extends Record<keyof T>>(table: RecordTable<T>, id: string): RecordTable<T>;
  export
  function remove<T extends Value>(table: ListTable<T>, id: string): ListTable<T>;
  export
  function remove<T extends Value>(table: ValueTable<T>, id: string): ValueTable<T>;
  export
  function remove(table: any, id: string): any {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Id '${id}' does not exist in the table.`);
    }

    // Create a mutable copy of the table.
    let copy = { ...table };

    // Delete the specified entry.
    delete copy[id];

    // Return the updated table.
    return copy;
  }

  /**
   * Update the state of a record in a table.
   *
   * @param table - The table of interest.
   *
   * @param id - The id of the record.
   *
   * @param values - The values to update on the record.
   *
   * @returns A table with the updated record.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function update<T extends Record<keyof T>>(table: RecordTable<T>, id: string, values: Partial<T>): RecordTable<T> {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Id '${id}' does not exist in the table.`);
    }

    // https://github.com/Microsoft/TypeScript/issues/16780
    // Create a new record with the updated values.
    let record = { ...(table[id] as any), ...(values as any) } as T;

    // Update the record in the table.
    return { ...table, [id]: record };
  }

  /**
   * Append values to a list in a table.
   *
   * @param table - The table of interest.
   *
   * @param id - The id of the list.
   *
   * @param values - The values to append to the list.
   *
   * @returns A table with the updated list.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function append<T extends Value>(table: ListTable<T>, id: string, values: T[]): ListTable<T> {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Id '${id}' does not exist in the table.`);
    }

    // Create a new list with the updated values.
    let list = table[id].concat(values);

    // Update the list in the table.
    return { ...table, [id]: list };
  }

  /**
   * Prepend values to a list in a table.
   *
   * @param table - The table of interest.
   *
   * @param id - The id of the list.
   *
   * @param values - The values to prepend to the list.
   *
   * @returns A table with the updated list.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function prepend<T extends Value>(table: ListTable<T>, id: string, values: T[]): ListTable<T> {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Id '${id}' does not exist in the table.`);
    }

    // Create a new list with the updated values.
    let list = values.concat(table[id] as T[]);

    // Update the list in the table.
    return { ...table, [id]: list };
  }

  /**
   * Add/remove values to/from a list in a table.
   *
   * @param table - The table object of interest.
   *
   * @param id - The id of the list.
   *
   * @param index - The index to add/remove values.
   *
   * @param count - The number of elements to remove.
   *
   * @param values - The values to insert into the list.
   *
   * @returns A table with the updated list.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function splice<T extends Value>(table: ListTable<T>, id: string, index: number, count: number, values: T[]): ListTable<T> {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Id '${id}' does not exist in the table.`);
    }

    // Create a copy of the current list.
    let list = table[id].slice();

    // Mutate the copy.
    list.splice(index, count, ...values);

    // Update the list in the table.
    return { ...table, [id]: list };
  }
}
