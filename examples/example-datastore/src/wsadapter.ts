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
  IMessageHandler, Message
} from '@phosphor/messaging';

import {
  Datastore
} from '@phosphor/datastore';

import {
  WSAdapterMessages, TransactionHistory
} from './messages';

import {
  WSConnection
} from './wsbase';



/**
 * A websocket based adapter for a datastore.
 */
export
class WSDatastoreAdapter extends WSConnection<WSAdapterMessages.IMessage, WSAdapterMessages.IMessage> {
  /**
   * Create a new websocket adapter for a datastore.
   */
  constructor(wsFactory: WSConnection.WSFactory) {
    super(wsFactory);
    this._delegates = new Map<string, PromiseDelegate<WSAdapterMessages.IReplyMessage>>();
  }


  /**
   * Dispose of the resources held by the adapter.
   */
  dispose(): void {
    this._handler = null;
    super.dispose();
  }


  /**
   * Create a new, unique store id.
   *
   * @returns {Promise<number>} A promise to the new store id.
   */
  async createStoreId(): Promise<number> {
    await this.ready;
    const msg = WSAdapterMessages.createStoreIdRequestMessage();
    const reply = await this._requestMessageReply(msg);
    return reply.content.storeId;
  }

  /**
   * Set the handler for messages from the server adaptor.
   *
   * @param {number} storeId - The store id of the handler.
   * @param {IMessageHandler} handler - The transaction handler to register.
   */
  setMessageHandler(handler: IMessageHandler) {
    this._handler = handler;
    if (this._unhandledTransactions.length > 0) {
      this._handleTransactions(this._unhandledTransactions);
      this._unhandledTransactions = [];
    }
    const fetchMsg = WSAdapterMessages.createHistoryRequestMessage();
    this._requestMessageReply(fetchMsg).then((historyMsg: WSAdapterMessages.IHistoryReplyMessage) => {
      const message = new WSDatastoreAdapter.HistoryMessage(historyMsg.content.history);
      handler.processMessage(message);
    });
  }

  /**
   * Broadcast transactions to all datastores.
   *
   * @param {Datastore.Transaction[]} transactions The transactions to broadcast.
   */
  async broadcastTransactions(transactions: Datastore.Transaction[]): Promise<string[]> {
    const msg = WSAdapterMessages.createTransactionBroadcastMessage(transactions);
    const reply = await this._requestMessageReply(msg);
    return reply.content.transactionIds;
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
      let delegate = this._delegates && this._delegates.get(msg.parentId!);
      if (delegate) {
        delegate.resolve(msg);
        return true;
      }
    }
    if (msg.msgType === 'transaction-broadcast') {
      this._handleTransactions(msg.content.transactions);
      return true;
    }
    return false;
  }

  /**
   * Process transactions received over the websocket.
   */
  private _handleTransactions(transactions: ReadonlyArray<Datastore.Transaction>) {
    if (this._handler === null) {
      if (this.isDisposed) {
        return;
      }
      this._unhandledTransactions.push(...transactions);
      return;
    }
    for (let t of transactions) {
      const message = new WSDatastoreAdapter.RemoteTransactionMessage(t);
      this._handler.processMessage(message);
    }
  }


  /**
   * Send a message to the server and resolve the reply message.
   */
  private _requestMessageReply(msg: WSAdapterMessages.IStoreIdMessageRequest): Promise<WSAdapterMessages.IStoreIdMessageReply>
  private _requestMessageReply(msg: WSAdapterMessages.IHistoryRequestMessage): Promise<WSAdapterMessages.IHistoryReplyMessage>
  private _requestMessageReply(msg: WSAdapterMessages.ITransactionBroadcastMessage): Promise<WSAdapterMessages.ITransactionAckMessage>
  private _requestMessageReply(msg: WSAdapterMessages.IMessage): Promise<WSAdapterMessages.IReplyMessage> {
    const delegate = new PromiseDelegate<WSAdapterMessages.IReplyMessage>();
    this._delegates.set(msg.msgId, delegate);

    const promise = delegate.promise.then((reply) => {
      this._delegates.delete(msg.msgId);
      return reply;
    });

    this.sendMessage(msg);

    return promise;
  }

  private _delegates: Map<string, PromiseDelegate<WSAdapterMessages.IReplyMessage>>;
  private _handler: IMessageHandler | null = null;
  private _unhandledTransactions: Datastore.Transaction[] = [];
}


/**
 * The namespace for WSDatastoreAdapter statics.
 */
export
namespace WSDatastoreAdapter {

  /**
   * A message class for `'history'` messages.
   */
  export
  class HistoryMessage extends Message {
    /**
     * Construct a new history message.
     *
     * @param history - The patch history
     */
    constructor(history: TransactionHistory) {
      super('history');
      this.history = history;
    }

    /**
     * The patch history
     */
    readonly history: TransactionHistory;
  }


  /**
   * A message class for `'remote-transactions'` messages.
   */
  export
  class RemoteTransactionMessage extends Message {
    /**
     * Construct a new remote transactions message.
     *
     * @param transaction - The transaction object
     */
    constructor(transaction: Datastore.Transaction) {
      super('remote-transactions');
      this.transaction = transaction;
    }

    /**
     * The patch object.
     */
    readonly transaction: Datastore.Transaction;
  }
}
