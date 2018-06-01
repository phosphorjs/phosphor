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
 * A server adaptor object.
 */
export
interface IServerAdapter {
  /**
   * Create a new, unique store ID.
   *
   * @returns {Promise<number>} A promise to the new store id.
   */
  createStoreId(): Promise<number>;

  /**
   * Register a handler for messages from the server adaptor.
   *
   * @param {number} storeId The store id of the patch handler.
   * @param {IMessageHandler} handler The patch handler to register.
   * @returns {IDisposable} Disposable to use to unregister the handler.
   */
  registerPatchHandler(storeId: number, handler: IMessageHandler): IDisposable;

  /**
   * Broadcast a patch to all data stores.
   *
   * @param {number} storeId The store id of the patch source.
   * @param {ReadonlyJSONObject} content The patch content.
   * @returns {string} The patch id of the broadcasted patch.
   */
  broadcastPatch(storeId: number, content: ReadonlyJSONObject): string;

  /**
   * Fetch specific patches from history by their id.
   *
   * @param {string[]} patchIds The patch ids to fetch.
   * @returns {Promise<Patch[]>} A promise to the patches that are fetched.
   */
  fetchPatches(patchIds: string[]): Promise<Patch[]>;
}
