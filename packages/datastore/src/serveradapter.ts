/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONObject
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  IMessageHandler, Message
} from '@phosphor/messaging';


/**
 *
 */
export
class PatchHistoryMessage extends Message {
  /**
   *
   */
  constructor(history: IPatchHistory) {
    super('patch-history');
    this.history = history;
  }

  /**
   *
   */
  readonly history: IPatchHistory;
}


/**
 *
 */
export
class RemotePatchMessage extends Message {
  /**
   *
   */
  constructor(patch: IPatch) {
    super('remote-patch');
    this.patch = patch;
  }

  /**
   *
   */
  readonly patch: IPatch;
}


/**
 *
 */
export
interface IPatch {
  /**
   *
   */
  readonly patchId: string;

  /**
   *
   */
  readonly storeId: number;

  /**
   *
   */
  readonly content: ReadonlyJSONObject;
}


/**
 *
 */
export
interface IPatchHistory {
  /**
   *
   */
  readonly checkpoint: ReadonlyJSONObject;

  /**
   *
   */
  readonly patches: ReadonlyArray<IPatch>;
}


/**
 *
 */
export
interface IServerAdapter {
  /**
   *
   */
  createStoreId(): Promise<number>;

  /**
   *
   */
  registerPatchHandler(storeId: number, handler: IMessageHandler): IDisposable;

  /**
   *
   */
  broadcastPatch(storeId: number, content: ReadonlyJSONObject): string;

  /**
   *
   */
  fetchPatches(patchIds: string[]): Promise<IPatch[]>;
}