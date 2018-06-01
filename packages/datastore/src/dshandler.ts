/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  TreeMap
} from '@phosphor/collections';

import {
  ReadonlyJSONValue, JSONObject
} from '@phosphor/coreutils';

import {
  IMessageHandler, Message
} from '@phosphor/messaging';

import {
  DSTable
} from './dstable';

import {
  Schema
} from './schema';

import {
  IServerAdapter
} from './serveradapter';


/**
 *
 */
export
class DSHandler implements IMessageHandler {
  /**
   *
   */
  constructor(adapter: IServerAdapter, storeId: number, schemas: Schema[]) {
    this._adapter = adapter;
    this._storeId = storeId;
  }

  /**
   *
   */
  get storeId(): number {
    return this._storeId;
  }

  /**
   *
   */
  get clock(): number {
    return this._clock;
  }

  /**
   *
   */
  mutate(message: string, fn: (patchId: string) => void): void {
    if (this._inMutate) {
      throw new Error('Recursive mutate detected.');
    }

    let patchId = this._adapter.createPatchId();

    this._inMutate = true;

    try {
      fn(patchId);
    } catch (e) {
      console.error(e);
    }

    if (this._broadcastChanges) {
      this._adapter.broadcastPatch({
        patchId, storeId: this._storeId, content: this._broadcastChanges
      });
      this._broadcastChanges = null;
    }

    if (this._notifyChanges) {
      this._notifySignal.emit(this._notifyChanges);
      this._notifyChanges = null;
    }

    this._inMutate = false;
  }

  /**
   *
   */
  getTable(schemaId: string): DSTable<Schema> {
    let table = this._tables.get(schemaId);
    if (!table) {
      throw new Error(`Schema '${schemaId}' does not exist.`);
    }
    return table;
  }

  /**
   *
   */
  assertMutationsAllowed(): void {
    if (this._inMutate) {
      return;
    }
    throw new Error('Datastore changes must be made from within `mutate`.');
  }

  /**
   *
   */
  broadcastRecordCreate(schemaId: string, recordId: string): void {

  }

  /**
   *
   */
  notifyRecordCreate(schemaId: string, recordId: string): void {

  }

  /**
   *
   */
  broadcastRegisterChange(schemaId: string, recordId: string, fieldName: string, current: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyRegisterChange(schemaId: string, recordId: string, fieldName: string, previous: ReadonlyJSONValue, current: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  broadcastListRemove(schemaId: string, recordId: string, fieldName: string, valueId: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyListRemove(schemaId: string, recordId: string, fieldName: string, index: number, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  broadcastListInsert(schemaId: string, recordId: string, fieldName: string, valueId: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyListInsert(schemaId: string, recordId: string, fieldName: string, index: number, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  broadcastMapChange(schemaId: string, recordId: string, fieldName: string, key: string, current: ReadonlyJSONValue | undefined): void {

  }

  /**
   *
   */
  notifyMapChange(schemaId: string, recordId: string, fieldName: string, key: string, previous: ReadonlyJSONValue | undefined, current: ReadonlyJSONValue | undefined): void {

  }

  /**
   *
   */
  processMessage(msg: Message): void {

  }

  private _ensureNotifyChanges(schemaId: string, recordId: string): JSONObject {
    let base = this._notifyChanges;
    if (!base) {
      base = this._notifyChanges = {};
    }
    let table = base[schemaId] as JSONObject;
    if (!table) {
      table = base[schemaId] = {};
    }
    let record = table[recordId] as JSONObject;
    if (!record) {
      record = table[recordId] = {};
    }
    return record;
  }

  private _ensureBroadcastChanges(schemaId: string, recordId: string): JSONObject {
    let base = this._broadcastChanges;
    if (!base) {
      base = this._broadcastChanges = {};
    }
    let table = base[schemaId] as JSONObject;
    if (!table) {
      table = base[schemaId] = {};
    }
    let record = table[recordId] as JSONObject;
    if (!record) {
      record = table[recordId] = {};
    }
    return record;
  }

  private _clock = 0;
  private _storeId: number;
  private _inMutate = false;
  private _adapter: IServerAdapter;
  private _notifyChanges: JSONObject | null = null;
  private _broadcastChanges: JSONObject | null = null;
  private _tables = new TreeMap<string, DSTable<Schema>>(Private.strCmp);
}


/**
 * The namespace for the `DSHandler` class statics.
 */
export
namespace DSHandler {
  /**
   * The minimum allowed store id.
   *
   * A store value of `0` indicates the initial default store.
   */
  export
  const MIN_STORE = 0x00000001;

  /**
   * The maximum allowed store id.
   */
  export
  const MAX_STORE = 0xFFFFFFFF;

  /**
   * The minimum allowed clock value.
   *
   * A clock value of `0` indicates the initial default clock.
   */
  export
  const MIN_CLOCK = 0x000000000001;

  /**
   * The maximum allowed clock value.
   */
  export
  const MAX_CLOCK = 0xFFFFFFFFFFFF;

  type BroadcastStoreChanges = {
    [schemaId: string]: BroadcastTableChanges;
  };

  type BroadcastTableChanges = {
    [recordId: string]: BroadcastRecordChanges;
  };

  type BroadcastRecordChanges = {
    [fieldName: string]: BroadCastFieldChange;
  };

  type BroadCastFieldChange = (
    BroadcastRegisterChange |
    BroadcastListChange |
    BroadcastMapChange
  );

  type BroadcastRegisterChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    value: T;
  };

  type BroadcastListChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    remove: { [valueId: string]: T };
    insert: { [valueId: string]: T };
  };

  type BroadcastMapChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    items: { [key: string]: T | undefined };
  };
}


/**
 *
 */
namespace Private {
  /**
   *
   */
  export
  function strCmp(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
  }
}
