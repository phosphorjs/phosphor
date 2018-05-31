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
   * A message class for `'patch-history'` messages.
   */
export
class PatchHistoryMessage extends Message {
  /**
   * Construct a new patch history message.
   *
   * @param history - The patch history
   */
  constructor(history: PatchHistory) {
    super('patch-history');
    this.history = history;
  }

  /**
   * The patch history
   */
  readonly history: PatchHistory;
}


/**
 * A message class for `'remote-patch'` messages.
 */
export
class RemotePatchMessage extends Message {
  /**
   * Construct a new remote patch message.
   *
   * @param patch - The patch object
   */
  constructor(patch: Patch) {
    super('remote-patch');
    this.patch = patch;
  }

  /**
   * The patch object.
   */
  readonly patch: Patch;
}


/**
 * A patch object for the data store.
 */
export
type Patch = {
  /**
   * The patch id.
   */
  readonly patchId: string;

  /**
   * The id of the data store that generated the patch.
   */
  readonly storeId: number;

  /**
   * The content representing the patch.
   */
  readonly content: ReadonlyJSONObject;
}


/**
 * A patch history object for the data store.
 */
export
type PatchHistory = {
  /**
   * The checkpoint that serves as the base of the patches.
   */
  readonly checkpoint: ReadonlyJSONObject;

  /**
   * The known patches since the last checkpoint.
   */
  readonly patches: ReadonlyArray<Patch>;
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
  fetchPatches(patchIds: string[]): Promise<Patch[]>;
}
