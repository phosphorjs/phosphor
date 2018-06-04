/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
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
  ReadonlyJSONValue, ReadonlyJSONObject
} from '@phosphor/coreutils';

import {
  IMessageHandler, Message
} from '@phosphor/messaging';

import {
  Signal
} from '@phosphor/signaling';

import {
  IDatastore
} from './datastore';

import {
  DSTable
} from './dstable';

import {
  ListField
} from './fields';

import {
  Schema
} from './schema';

import {
  IServerAdapter, PatchHistoryMessage, RemotePatchMessage
} from './serveradapter';


/**
 *
 */
export
class DSHandler implements IMessageHandler {
  /**
   *
   */
  constructor(adapter: IServerAdapter, storeId: number, schemas: Schema[], notifySignal: Signal<IDatastore, IDatastore.ChangeSet>) {
    this._adapter = adapter;
    this._storeId = storeId;
    this._notifySignal = notifySignal;
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

    this._clock++;

    let patchId = this._adapter.createPatchId();

    this._inMutate = true;

    try {
      fn(patchId);
    } catch (e) {
      console.error(e);
    }

    if (this._broadcastChanges) {
      let content = this._broadcastChanges as ReadonlyJSONObject;
      this._adapter.broadcastPatch({ patchId, storeId: this._storeId, content});
      this._broadcastChanges = null;
    }

    if (this._notifyChanges) {
      let changes = this._notifyChanges as IDatastore.ChangeSet;
      this._notifySignal.emit(changes);
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
  processMessage(msg: Message): void {
    switch (msg.type) {
    case 'remote-patch':
      break;
    case 'patch-history':
      break;
    }
  }

  /**
   *
   */
  broadcastRecordCreate(schemaId: string, recordId: string): void {
    this._ensureBroadcastRecordChanges(schemaId, recordId);
  }

  /**
   *
   */
  notifyRecordCreate(schemaId: string, recordId: string): void {
    this._ensureNotifyRecordChanges(schemaId, recordId);
  }

  /**
   *
   */
  broadcastRegisterChange(schemaId: string, recordId: string, fieldName: string, current: ReadonlyJSONValue): void {
    let recordChanges = this._ensureBroadcastRecordChanges(schemaId, recordId);
    let registerChange = recordChanges[fieldName] as DSHandler.BroadcastRegisterChange;
    if (registerChange) {
      registerChange.value = current;
    } else {
      recordChanges[fieldName] = { value: current };
    }
  }

  /**
   *
   */
  notifyRegisterChange(schemaId: string, recordId: string, fieldName: string, previous: ReadonlyJSONValue, current: ReadonlyJSONValue): void {
    let recordChanges = this._ensureNotifyRecordChanges(schemaId, recordId);
    let registerChange = recordChanges[fieldName] as DSHandler.NotifyRegisterChange;
    if (registerChange) {
      registerChange.previous = previous;
      registerChange.current = current;
    } else {
      recordChanges[fieldName] = { previous, current };
    }
  }

  /**
   *
   */
  broadcastListRemove(schemaId: string, recordId: string, fieldName: string, valueId: string, value: ReadonlyJSONValue): void {
    let recordChanges = this._ensureBroadcastRecordChanges(schemaId, recordId);
    let listChange = recordChanges[fieldName] as DSHandler.BroadcastListChange;
    if (!listChange) {
      listChange = recordChanges[fieldName] = { remove: {}, insert: {} };
    }
    listChange.remove[valueId] = value;
  }

  /**
   *
   */
  notifyListRemove(schemaId: string, recordId: string, fieldName: string, index: number, value: ReadonlyJSONValue): void {
    let recordChanges = this._ensureNotifyRecordChanges(schemaId, recordId);
    let listChange = recordChanges[fieldName] as DSHandler.NotifyListChange;
    if (!listChange) {
      listChange = recordChanges[fieldName] = [];
    }
    listChange.push({ type: 'remove', index, value });
  }

  /**
   *
   */
  broadcastListInsert(schemaId: string, recordId: string, fieldName: string, valueId: string, value: ReadonlyJSONValue): void {
    let recordChanges = this._ensureBroadcastRecordChanges(schemaId, recordId);
    let listChange = recordChanges[fieldName] as DSHandler.BroadcastListChange;
    if (!listChange) {
      listChange = recordChanges[fieldName] = { remove: {}, insert: {} };
    }
    listChange.insert[valueId] = value;
  }

  /**
   *
   */
  notifyListInsert(schemaId: string, recordId: string, fieldName: string, index: number, value: ReadonlyJSONValue): void {
    let recordChanges = this._ensureNotifyRecordChanges(schemaId, recordId);
    let listChange = recordChanges[fieldName] as DSHandler.NotifyListChange;
    if (!listChange) {
      listChange = recordChanges[fieldName] = [];
    }
    listChange.push({ type: 'insert', index, value });
  }

  /**
   *
   */
  broadcastMapChange(schemaId: string, recordId: string, fieldName: string, key: string, current: ReadonlyJSONValue | undefined): void {
    let recordChanges = this._ensureBroadcastRecordChanges(schemaId, recordId);
    let mapChange = recordChanges[fieldName] as DSHandler.BroadcastMapChange;
    if (!mapChange) {
      mapChange = recordChanges[fieldName] = { items: {} };
    }
    mapChange.items[key] = current;
  }

  /**
   *
   */
  notifyMapChange(schemaId: string, recordId: string, fieldName: string, key: string, previous: ReadonlyJSONValue | undefined, current: ReadonlyJSONValue | undefined): void {
    let recordChanges = this._ensureNotifyRecordChanges(schemaId, recordId);
    let mapChange = recordChanges[fieldName] as DSHandler.NotifyMapChange;
    if (!mapChange) {
      mapChange = recordChanges[fieldName] = { previous: {}, current: {} };
    }
    if (!(key in mapChange.previous)) {
      mapChange.previous[key] = previous;
    }
    mapChange.current[key] = current;
  }

  private _ensureBroadcastRecordChanges(schemaId: string, recordId: string): DSHandler.BroadcastRecordChanges {
    let base = this._broadcastChanges;
    if (!base) {
      base = this._broadcastChanges = {};
    }
    let table = base[schemaId];
    if (!table) {
      table = base[schemaId] = {};
    }
    let record = table[recordId];
    if (!record) {
      record = table[recordId] = {};
    }
    return record;
  }

  private _ensureNotifyRecordChanges(schemaId: string, recordId: string): DSHandler.NotifyRecordChanges {
    let base = this._notifyChanges;
    if (!base) {
      base = this._notifyChanges = {};
    }
    let table = base[schemaId];
    if (!table) {
      table = base[schemaId] = {};
    }
    let record = table[recordId];
    if (!record) {
      record = table[recordId] = {};
    }
    return record;
  }

  private _clock = 0;
  private _storeId: number;
  private _inMutate = false;
  private _adapter: IServerAdapter;
  private _tables = new TreeMap<string, DSTable<Schema>>(Private.strCmp);
  private _notifyChanges: DSHandler.NotifyStoreChanges | null = null;
  private _broadcastChanges: DSHandler.BroadcastStoreChanges | null = null;
  private _notifySignal: Signal<IDatastore, IDatastore.ChangeSet>;
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

  export
  type BroadcastStoreChanges = {
    [schemaId: string]: BroadcastTableChanges;
  };

  export
  type BroadcastTableChanges = {
    [recordId: string]: BroadcastRecordChanges;
  };

  export
  type BroadcastRecordChanges = {
    [fieldName: string]: BroadcastFieldChange;
  };

  export
  type BroadcastFieldChange = (
    BroadcastRegisterChange |
    BroadcastListChange |
    BroadcastMapChange
  );

  export
  type BroadcastRegisterChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    value: T;
  };

  export
  type BroadcastListChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    remove: { [valueId: string]: T };
    insert: { [valueId: string]: T };
  };

  export
  type BroadcastMapChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    items: { [key: string]: T | undefined };
  };

  export
  type NotifyStoreChanges = {
    [schemaId: string]: NotifyTableChanges;
  };

  export
  type NotifyTableChanges = {
    [recordId: string]: NotifyRecordChanges;
  };

  export
  type NotifyRecordChanges = {
    [fieldName: string]: NotifyFieldChange;
  };

  export
  type NotifyFieldChange = (
    NotifyRegisterChange |
    NotifyListChange |
    NotifyMapChange
  );

  export
  type NotifyRegisterChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    previous: T;
    current: T;
  };

  export
  type NotifyListChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> =
    ListField.IChange<ReadonlyJSONValue>[];

  export
  type NotifyMapChange<T extends ReadonlyJSONValue = ReadonlyJSONValue> = {
    previous: { [key: string]: T | undefined };
    current: { [key: string]: T | undefined };
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
