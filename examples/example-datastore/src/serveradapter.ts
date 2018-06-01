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
 * A patch object for the datastore.
 */
export
type Patch = {
  /**
   * The patch id.
   */
  readonly patchId: string;

  /**
   * The id of the datastore that generated the patch.
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
   * Create a new unique store ID.
   *
   * @returns A promise to the new store id.
   */
  createStoreId(): Promise<number>;

  /**
   * Create a new unique patch id.
   *
   * @returns A unique id to use for a new patch.
   */
  createPatchId(): string;

  /**
   * Register a handler for messages from the server adaptor.
   *
   * @param storeId - The store id of the patch handler.
   *
   * @param handler - The patch handler to register.
   *
   * @returns A disposable to use to unregister the handler.
   */
  registerPatchHandler(storeId: number, handler: IMessageHandler): IDisposable;

  /**
   * Broadcast a patch to all peer data stores.
   *
   * @param patch - The patch to broadcast to peers.
   */
  broadcastPatch(patch: Patch): void;

  /**
   * Fetch specific patches from history by their patch id.
   *
   * @param patchIds - The ids of the patches to fetch.
   *
   * @returns A promise to the patches that are fetched.
   */
  fetchPatches(patchIds: string[]): Promise<Patch[]>;
}
