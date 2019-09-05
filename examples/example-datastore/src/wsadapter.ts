/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  Datastore, IServerAdapter, Schema
} from '@phosphor/datastore';

import {
  WSAdapterMessages
} from './messages';

import {
  WSConnection
} from './wsbase';



/**
 * A websocket based adapter for a datastore.
 */
export
class WSAdapter extends WSConnection<WSAdapterMessages.IMessage, WSAdapterMessages.IMessage> implements IServerAdapter {
  /**
   * Create a new websocket adapter for a datastore.
   */
  constructor(wsFactory: WSConnection.WSFactory) {
    super(wsFactory);
    this._delegates = new Map<string, PromiseDelegate<WSAdapterMessages.IReplyMessage>>();
  }

  /**
   * Create a new datastore connected to the server.
   *
   * @param schemas - the schemas for the datastore.
   *
   * @returns a promise that resolves with the datastore that was created.
   *
   * #### Notes this does not resolve until the datastore is created
   * and its entire history has been applied.
   */
  async createStore(schemas: Schema[]): Promise<Datastore> {
    let storeId = await this._createStoreId();
    let datastore = Datastore.create({ id: storeId, schemas, adapter: this });
    let fetchMsg = WSAdapterMessages.createHistoryRequestMessage();
    let historyMsg = await this._requestMessageReply(fetchMsg);
    if (this.onRemoteTransaction) {
      for (let t of historyMsg.content.history.transactions) {
        this.onRemoteTransaction(t);
      }
    }
    return datastore;
  }

  /**
   * Broadcast a transaction to all datastores.
   *
   * @param transaction - the transaction to broadcast.
   */
  broadcast(transaction: Datastore.Transaction): void {
    let msg = WSAdapterMessages.createTransactionBroadcastMessage([transaction]);
    void this._requestMessageReply(msg);
  }

  /**
   * Request an undo by id.
   *
   * @param id - The id of the transaction to undo.
   *
   * @returns a promise that resolves when the undo is complete.
   */
  async undo(id: string): Promise<void> {
    let msg = WSAdapterMessages.createUndoRequestMessage(id);
    let reply = await this._requestMessageReply(msg);
    this._handleUndo(reply.content.transaction);
  }

  /**
   * Request a redo by id.
   *
   * @param id - The id of the transaction to redo.
   *
   * @returns a promise that resolves when the redo is complete.
   */
  async redo(id: string): Promise<void> {
    let msg = WSAdapterMessages.createRedoRequestMessage(id);
    let reply = await this._requestMessageReply(msg);
    this._handleRedo(reply.content.transaction);
  }

  /**
   * A callback for when a remote transaction is received by the server adapter.
   */
  get onRemoteTransaction(): ((transaction: Datastore.Transaction) => void) | null {
    return this._onRemoteTransaction;
  }
  set onRemoteTransaction(value: ((transaction: Datastore.Transaction) => void) | null) {
    this._onRemoteTransaction = value;
  }

  /**
   * A callback for when an undo is received by the server adapter.
   */
  get onUndo(): ((transaction: Datastore.Transaction) => void) | null {
    return this._onUndo;
  }
  set onUndo(value: ((transaction: Datastore.Transaction) => void) | null) {
    this._onUndo = value;
  }

  /**
   * A callback for when a redo is received by the server adapter.
   */
  get onRedo(): ((transaction: Datastore.Transaction) => void) | null {
    return this._onRedo;
  }
  set onRedo(value: ((transaction: Datastore.Transaction) => void) | null) {
    this._onRedo = value;
  }

  /**
   * Dispose of the resources held by the adapter.
   */
  dispose(): void {
    this._onRemoteTransaction = null;
    this._onUndo = null;
    this._onRedo = null;
    this._delegates.clear();
    super.dispose();
  }

  /**
   * Process messages received over the websocket.
   *
   * @param msg - The decoded message that was received.
   *
   * @returns Whether the message was handled.
   */
  protected handleMessage(msg: WSAdapterMessages.IMessage): boolean {
    try {
      // TODO: Write a validator?
      // validate.validateMessage(msg);
    } catch (error) {
      console.error(`Invalid message: ${error.message}`);
      return false;
    }

    if (WSAdapterMessages.isReply(msg)) {
      let delegate = this._delegates.get(msg.parentId!);
      if (delegate) {
        delegate.resolve(msg);
        return true;
      }
    }
    if (msg.msgType === 'transaction-broadcast') {
      this._handleTransactions(msg.content.transactions);
      return true;
    }
    if (msg.msgType === 'undo-reply') {
      this._handleUndo(msg.content.transaction);
      return true;
    }
    if (msg.msgType === 'redo-reply') {
      this._handleRedo(msg.content.transaction);
      return true;
    }
    return false;
  }

  /**
   * Create a new, unique store id.
   *
   * @returns A promise that resolves with the new store id.
   */
  private async _createStoreId(): Promise<number> {
    await this.ready;
    let msg = WSAdapterMessages.createStoreIdRequestMessage();
    let reply = await this._requestMessageReply(msg);
    return reply.content.storeId;
  }

  /**
   * Handle an undo message received over the websocket.
   */
  private _handleUndo(transaction: Datastore.Transaction): void {
    if (this.onUndo) {
      this.onUndo(transaction);
    }
  }

  /**
   * Handle an undo message received over the websocket.
   */
  private _handleRedo(transaction: Datastore.Transaction): void {
    if (this.onRedo) {
      this.onRedo(transaction);
    }
  }

  /**
   * Process transactions received over the websocket.
   */
  private _handleTransactions(transactions: ReadonlyArray<Datastore.Transaction>): void {
    if (this.isDisposed) {
      return;
    }
    if (this.onRemoteTransaction) {
      for (let t of transactions) {
        this.onRemoteTransaction(t);
      }
    }
  }

  /**
   * Send a message to the server and resolve the reply message.
   */
  private _requestMessageReply(msg: WSAdapterMessages.IStoreIdMessageRequest): Promise<WSAdapterMessages.IStoreIdMessageReply>
  private _requestMessageReply(msg: WSAdapterMessages.IUndoMessageRequest): Promise<WSAdapterMessages.IUndoMessageReply>
  private _requestMessageReply(msg: WSAdapterMessages.IRedoMessageRequest): Promise<WSAdapterMessages.IRedoMessageReply>
  private _requestMessageReply(msg: WSAdapterMessages.IHistoryRequestMessage): Promise<WSAdapterMessages.IHistoryReplyMessage>
  private _requestMessageReply(msg: WSAdapterMessages.ITransactionBroadcastMessage): Promise<WSAdapterMessages.ITransactionAckMessage>
  private _requestMessageReply(msg: WSAdapterMessages.IMessage): Promise<WSAdapterMessages.IReplyMessage> {
    let delegate = new PromiseDelegate<WSAdapterMessages.IReplyMessage>();
    this._delegates.set(msg.msgId, delegate);

    let promise = delegate.promise.then((reply) => {
      this._delegates.delete(msg.msgId);
      return reply;
    });

    this.sendMessage(msg);
    return promise;
  }

  private _delegates: Map<string, PromiseDelegate<WSAdapterMessages.IReplyMessage>>;
  private _onRemoteTransaction: ((transaction: Datastore.Transaction) => void) | null = null
  private _onUndo: ((transaction: Datastore.Transaction) => void) | null = null
  private _onRedo: ((transaction: Datastore.Transaction) => void) | null = null
}
