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
  IIterator
} from '@phosphor/algorithm';

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
  ISignal, Signal
} from '@phosphor/signaling';

import {
  DSTable
} from './dstable';

import {
  ListField, TextField
} from './fields';

import {
  Schema
} from './schema';

import {
  IServerAdapter, PatchHistoryMessage, RemotePatchMessage
} from './serveradapter';

import {
  IStore
} from './store';

import {
  ITable
} from './table';


/**
 *
 */
export
class DSStore implements IMessageHandler, IStore {
  /**
   *
   */
  constructor(adapter: IServerAdapter, storeId: number, schemas: Schema[]) {
    this._adapter = adapter;
    this._storeId = storeId;
  }

  get changed(): ISignal<DSStore, IStore.IChangedArgs> {
    throw '';
  }

  /**
   *
   */
  get id(): number {
    return this._storeId;
  }

  /**
   *
   */
  get clock(): number {
    return this._clock;
  }

  undo(): Promise<void> {
    throw '';
  }

  redo(): Promise<void> {
    throw '';
  }

  iter(): IIterator<ITable> {
    throw '';
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
  processMutation(mutation: DSStore.Mutation): void {

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
 * The namespace for the `DSStore` class statics.
 */
export
namespace DSStore {
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

  /**
   * 
   */
  export
  type RecordMutation = {
    /**
     * 
     */
    readonly type: 'record';

    /**
     * 
     */
    readonly schemaId: string;

    /**
     * 
     */
    readonly recordId: string;
  };

  /**
   * 
   */
  export
  type RegisterMutation = {
    /**
     * 
     */
    readonly type: 'register';
    
    /**
     * 
     */
    readonly schemaId: string;

    /**
     * 
     */
    readonly recordId: string;

    /**
     * 
     */
    readonly fieldName: string;

    /**
     * 
     */
    readonly previousValue: ReadonlyJSONValue;

    /**
     * 
     */
    readonly currentValue: ReadonlyJSONValue;
  };

  /**
   * 
   */
  export
  type ListMutation = {
    /**
     * 
     */
    readonly type: 'list';
    
    /**
     * 
     */
    readonly schemaId: string;

    /**
     * 
     */
    readonly recordId: string;

    /**
     * 
     */
    readonly fieldName: string;

    /**
     * 
     */
    readonly removed: { readonly [id: string]: ReadonlyJSONValue };

    /**
     * 
     */
    readonly inserted: { readonly [id: string]: ReadonlyJSONValue };

    /**
     * 
     */
    readonly ordered: ListField.ChangeArray<ReadonlyJSONValue>; 
  };

  /**
   * 
   */
  export
  type MapMutation = {
    /**
     * 
     */
    readonly type: 'map';
    
    /**
     * 
     */
    readonly schemaId: string;

    /**
     * 
     */
    readonly recordId: string;

    /**
     * 
     */
    readonly fieldName: string;

    /**
     * 
     */
    readonly previousValues: { readonly [id: string]: ReadonlyJSONValue | undefined };

    /**
     * 
     */
    readonly currentValues: { readonly [id: string]: ReadonlyJSONValue | undefined };
  };

  /**
   * 
   */
  export
  type TextMutation = {
    /**
     * 
     */
    readonly type: 'text';
    
    /**
     * 
     */
    readonly schemaId: string;

    /**
     * 
     */
    readonly recordId: string;

    /**
     * 
     */
    readonly fieldName: string;

    /**
     * 
     */
    readonly removedText: { readonly [id: string]: string };

    /**
     * 
     */
    readonly insertedText: { readonly [id: string]: string };

    /**
     * 
     */
    readonly orderedChanges: TextField.ChangeArray;
  };

  /**
   * 
   */
  export
  type Mutation = (
    RecordMutation | 
    RegisterMutation | 
    ListMutation | 
    MapMutation | 
    TextMutation
  );
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
