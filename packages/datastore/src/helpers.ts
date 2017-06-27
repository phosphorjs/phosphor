/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * An object which can be used as a table in a data store.
 *
 * #### Notes
 * This interface is convenient when creating normalized data stores
 * where objects are stored in top-level tables.
 */
export
interface ITable<T> {
  /**
   * A mapping of object id to object data.
   */
  readonly [id: string]: T;
}


/**
 * The namespace for table-related helper functions.
 */
export
namespace TableHelpers {
  /**
   * Create a new entry in a table.
   *
   * @param table - The table object of interest.
   *
   * @param id - The id for the entry.
   *
   * @param entry - The entry object to add to the table.
   *
   * @returns A new table with the added entry.
   *
   * @throws An error if the id already exists in the table.
   */
  export
  function createEntry<T>(table: ITable<T>, id: string, entry: T): ITable<T> {
    // Throw an error if the id already exists.
    if (id in table) {
      throw new Error(`Entry id '${id}' already exists in the table.`);
    }

    // Create a new table with the added entry.
    return { ...table, [id]: entry };
  }

  /**
   * Update an entry in a table.
   *
   * @param table - The table object of interest.
   *
   * @param id - The id for the entry.
   *
   * @param entry - The updated entry object.
   *
   * @returns A new table with the updated entry, or the original
   *   table if there is no effective change.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function updateEntry<T>(table: ITable<T>, id: string, entry: T): ITable<T> {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Entry id '${id}' does not exist in the table.`);
    }

    // Return the original table if there is no change.
    if (table[id] === entry) {
      return table;
    }

    // Create a new table with the updated entry.
    return { ...table, [id]: entry };
  }

  /**
   * Delete an entry from a a table.
   *
   * @param table - The table object of interest.
   *
   * @param id - The id for the entry.
   *
   * @returns A new table without the given entry.
   *
   * @throws An error if the id does not exist in the table.
   */
  export
  function deleteEntry<T>(table: ITable<T>, id: string): ITable<T> {
    // Throw an error if the id does not exist.
    if (!(id in table)) {
      throw new Error(`Entry id '${id}' does not exist in the table.`);
    }

    // Create a copy of the table.
    let copy: { [id: string]: T } = { ...table };

    // Delete the specified entry.
    delete copy[id];

    // Return the new table.
    return copy;
  }
}


/**
 * A function which generates UUID v4 identifiers.
 *
 * @returns A new UUID v4 string.
 *
 * #### Notes
 * This implementation complies with RFC 4122.
 *
 * This uses `window.crypto.getRandomValues` for random bytes.
 */
export
const uuid4 = (() => {
  // Look up the crypto object, with support for IE 11.
  const crypto = window.crypto || (window as any).msCrypto;

  // Create a 16 byte array to hold the random values.
  const bytes = new Uint8Array(16);

  // Create a look up table from bytes to hex strings.
  const lut = new Array<string>(256);

  // Pad the single character hex digits with a leading zero.
  for (let i = 0; i < 16; ++i) {
    lut[i] = '0' + i.toString(16);
  }

  // Populate the rest of the hex digits.
  for (let i = 16; i < 256; ++i) {
    lut[i] = i.toString(16);
  }

  // Return a function which generates the UUID.
  return () => {
    // Get a new batch of random values.
    crypto.getRandomValues(bytes);

    // Set the UUID version number to 4.
    bytes[6] = 0x40 | (bytes[6] & 0x0F);

    // Set the clock sequence bit to the RFC spec.
    bytes[8] = 0x80 | (bytes[8] & 0x3F);

    // Assemble the UUID string.
    return (
      lut[bytes[0]] +
      lut[bytes[1]] +
      lut[bytes[2]] +
      lut[bytes[3]] +
      '-'           +
      lut[bytes[4]] +
      lut[bytes[5]] +
      '-'           +
      lut[bytes[6]] +
      lut[bytes[7]] +
      '-'           +
      lut[bytes[8]] +
      lut[bytes[9]] +
      '-'           +
      lut[bytes[10]] +
      lut[bytes[11]] +
      lut[bytes[12]] +
      lut[bytes[13]] +
      lut[bytes[14]] +
      lut[bytes[15]]
    );
  };
})();
