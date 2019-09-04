/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  IDisposable
} from '@phosphor/disposable';

import {
  Datastore
} from './datastore';

/**
 * An interface for a bridge between a datastore and a patch server.
 * Patch servers should expose an interface like this one, which mediates
 * outgoing patches from a given store, and delivers incoming patches to a
 * store.
 */
export
interface IServerAdapter extends IDisposable {
  /**
   * Broadcast a transaction from a datastore to collaborators.
   *
   * @param transaction - the transaction to broadcast to collaborators.
   *
   * #### Notes
   * This is expected to be called by a datastore, and not by any other
   * user. Direct invocations of this function may have unexpected results.
   */
  broadcast(transaction: Datastore.Transaction): void;

  /**
   * Undo a transaction by id. This sends an undo message to the patch server,
   * but the undo is not actually done until the datastore recieves the
   * corresponding transaction and applies it.
   *
   * @param id: the transaction to undo.
   */
  undo(id: string): Promise<void>;

  /**
   * Redo a transaction by id.
   *
   * @param id: the transaction to redo.
   */
  redo(id: string): Promise<void>;

  /**
   * A callback to be invoked when a remote transaction is received by the
   * server adapter.
   */
  onRemoteTransaction: ((transaction: Datastore.Transaction) => void) | null;

  /**
   * A callback to be invoked when an undo message is received by the server
   * adapter.
   */
  onUndo: ((transaction: Datastore.Transaction) => void) | null;

  /**
   * A callback to be invoked when an redo message is received by the server
   * adapter.
   */
  onRedo: ((transaction: Datastore.Transaction) => void) | null;
}
