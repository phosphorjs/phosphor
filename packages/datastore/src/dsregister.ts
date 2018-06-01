/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  DSHandler
} from './dshandler';

import {
  ValueField
} from './fields';


/**
 * A CRDT register for the datastore.
 *
 * #### Notes
 * This class is an implementation detail and is subject to change
 * without notice. This is not a public API. I mean it. Really.
 */
export
class DSRegister<T extends ReadonlyJSONValue = ReadonlyJSONValue> {
  /**
   * Construct a new datastore register.
   *
   * @param handler - The datastore handler object.
   *
   * @param schemaId - The id of the containing table.
   *
   * @param recordId - The id of the containing record.
   *
   * @param fieldName - The name of the containing field.
   */
  constructor(handler: DSHandler, schemaId: string, recordId: string, fieldName: string) {
    this._handler = handler;
    this._schemaId = schemaId;
    this._recordId = recordId;
    this._fieldName = fieldName;
    this._entry = Private.createInitialEntry<T>(handler, schemaId, fieldName);
  }

  /**
   * Get the current value of the register.
   *
   * @returns The current value of the register.
   */
  get(): T {
    return this._entry.value;
  }

  /**
   * Set the current value of the register.
   *
   * @param value - The current value for the register.
   */
  set(value: T): void {
    // Guard against disallowed mutations.
    this._handler.assertMutationsAllowed();

    // Fetch the current entry.
    let entry = this._entry;

    // Fetch the clock and store id.
    let clock = this._handler.clock;
    let storeId = this._handler.storeId;

    // Fetch the schema field.
    let field = this._handler.getField(this._schemaId, this._fieldName);

    // Create the new entry as appropriate.
    if (!field.undoable) {
      this._entry = { value, clock, storeId, next: null };
    } else if (entry.clock === clock && entry.storeId === storeId) {
      this._entry = { value, clock, storeId, next: entry.next };
    } else {
      this._entry = { value, clock, storeId, next: entry };
    }

    // Broadcast the change to peers.
    this._handler.broadcastRegisterChange(
      this._schemaId, this._recordId, this._fieldName, value
    );

    // Notify the user of the change.
    this._handler.notifyRegisterChange(
      this._schemaId, this._recordId, this._fieldName, entry.value, value
    );
  }

  private _schemaId: string;
  private _recordId: string;
  private _fieldName: string;
  private _handler: DSHandler;
  private _entry: Private.IEntry<T>;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which represents a register entry.
   */
  export
  interface IEntry<T extends ReadonlyJSONValue> {
    /**
     * The value for the entry.
     */
    readonly value: T;

    /**
     * The clock value when the entry was created.
     */
    readonly clock: number;

    /**
     * The id of the datastore which created the entry.
     */
    readonly storeId: number;

    /**
     * The next entry in the list.
     */
    next: IEntry<T> | null;
  }

  /**
   * Create the initial entry for a register.
   */
  export
  function createInitialEntry<T extends ReadonlyJSONValue>(handler: DSHandler, schemaId: string, fieldName: string): IEntry<T> {
    let field = handler.getField(schemaId, fieldName) as ValueField<T>;
    return { value: field.value, storeId: 0, clock: 0, next: null };
  }
}
