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
  ISignal
} from '@phosphor/signaling';

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
  broadcastTransaction(transaction: Datastore.Transaction): void;

  /**
   * Undo a transaction by id. This sends an undo message to the patch server,
   * but the undo is not actually done until the datastore recieves the
   * corresponding transaction and applies it.
   *
   * @param id: the transaction to undo.
   */
  undoTransaction(id: string): void;

  /**
   * Redo a transaction by id.
   *
   * @param id: the transaction to redo.
   */
  redoTransaction(id: string): void;

  /**
   * A signal that is fired when a transaction is received from the server.
   * Intended to be consumed by a datastore, though other objects may snoop
   * on the messages.
   */
  transactionReceived: ISignal<this, IServerAdapter.ITransactionArgs>;
}

/**
 * A namespace for IServerAdapter statics.
 */
export
namespace IServerAdapter {
  /**
   * A payload for a transaction received signal.
   */
  export
  interface ITransactionArgs {
    /**
     * The type of the transaction, either a user transaction,
     * or an undo or redo of a transaction.
     */
    type: 'transaction' | 'undo' | 'redo';

    /**
     * The payload transaction.
     */
    transaction: Datastore.Transaction;
  }
}



