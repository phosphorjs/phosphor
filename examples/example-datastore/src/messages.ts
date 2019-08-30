/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONObject, UUID, JSONObject
} from '@phosphor/coreutils';

import {
  Datastore
} from '@phosphor/datastore';


/**
 * A patch history object for the datastore.
 */
export
type TransactionHistory = {
  /**
   * All known transactions.
   */
  readonly transactions: ReadonlyArray<Datastore.Transaction>;
}


/**
 * A namespace for messages for communicating with the patch server.
 */
export
namespace WSAdapterMessages {

  /**
   * A base message for the patch server.
   */
  export
  type IBaseMessage = JSONObject & {
    msgId: string;
    msgType: (
      'storeid-request' | 'storeid-reply'|
      'undo-request' | 'undo-reply' |
      'redo-request' | 'redo-reply' |
      'transaction-broadcast' | 'transaction-ack' |
      'history-request' | 'history-reply' |
      'fetch-transaction-request' | 'fetch-transaction-reply'
    );
    parentId: undefined;

    readonly content: ReadonlyJSONObject;
  }

  export
  type IBaseReplyMessage = IBaseMessage & {
    parentId: string;
  }

  /**
   * A message representing a request for a unique store ID from the server.
   */
  export
  type IStoreIdMessageRequest = IBaseMessage & {
    msgType: 'storeid-request';
    content: {};
  }

  /**
   * A reply from the server containing a unique store ID.
   */
  export
  type IStoreIdMessageReply = IBaseReplyMessage & {
    msgType: 'storeid-reply';
    content: {
      readonly storeId: number
    };
  }

  /**
   * A message representing a request to undo a transaction.
   */
  export
  type IUndoMessageRequest = IBaseMessage & {
    msgType: 'undo-request';
    content: {
      readonly transactionId: string;
    };
  }

  /**
   * A reply from the server containing a transaction to undo.
   */
  export
  type IUndoMessageReply = IBaseReplyMessage & {
    msgType: 'undo-reply';
    content: {
      readonly transaction: Datastore.Transaction
    };
  }

  /**
   * A message representing a request to redo a transaction.
   */
  export
  type IRedoMessageRequest = IBaseMessage & {
    msgType: 'redo-request';
    content: {
      readonly transactionId: string;
    };
  }

  /**
   * A reply from the server containing a transaction to redo.
   */
  export
  type IRedoMessageReply = IBaseReplyMessage & {
    msgType: 'redo-reply';
    content: {
      readonly transaction: Datastore.Transaction
    }
  }

  /**
   * A message from a client broadcasting a transaction.
   */
  export
  type ITransactionBroadcastMessage = IBaseMessage & {
    msgType: 'transaction-broadcast';
    content: {
      readonly transactions: ReadonlyArray<Datastore.Transaction>;
    };
  }

  /**
   * A message from the server acknowledging receipt of a transaction.
   */
  export
  type ITransactionAckMessage = IBaseReplyMessage & {
    msgType: 'transaction-ack';
    content: {
      readonly transactionIds: string[];
    };
  }

  /**
   * A request from a client for the patch history from the server.
   */
  export
  type IHistoryRequestMessage = IBaseMessage & {
    msgType: 'history-request';
    content: {};
  }

  /**
   * A response from the server with the patch history.
   */
  export
  type IHistoryReplyMessage = IBaseReplyMessage & {
    msgType: 'history-reply';
    content: {
      history: TransactionHistory
    };
  }

  /**
   * A base reply message from the server.
   */
  export
  type IReplyMessage = (
    IStoreIdMessageReply | ITransactionAckMessage |
    IUndoMessageReply | IRedoMessageReply |
    IHistoryReplyMessage
  );

  /**
   * A WSAdapter message.
   */
  export
  type IMessage = (
    IStoreIdMessageRequest | ITransactionBroadcastMessage |
    IUndoMessageRequest | IRedoMessageRequest |
    IHistoryRequestMessage | IReplyMessage
  );


  /**
   * Create a WSServerAdapter message.
   *
   * @param {string} msgType The message type.
   * @param {ReadonlyJSONObject} content The content of the message.
   * @param {string} parentId An optional id of the parent of this message.
   * @returns {ITransactionBroadcastMessage} The created message.
   */
  export
  function createMessage<T extends IMessage>(
    msgType: T['msgType'],
    content?: T['content'],
    parentId?: string
  ): T {
    let msgId = UUID.uuid4();
    if (content === undefined) {
      content = {};
    }
    return {
      msgId,
      msgType,
      parentId,
      content,
    } as T;
  }


  /**
   * Create a WSServerAdapter message.
   *
   * @param {string} msgType The message type.
   * @param {ReadonlyJSONObject} content The content of the message.
   * @param {string} parentId The id of the parent of this reply.
   * @returns {ITransactionBroadcastMessage} The created message.
   */
  export
  function createReply<T extends IBaseReplyMessage>(
    msgType: T['msgType'],
    content: T['content'],
    parentId: string
  ): T {
    let msgId = UUID.uuid4();
    return {
      msgId,
      msgType,
      parentId,
      content
    } as T;
  }

  /**
   * Create a `'storeid-request'` message.
   *
   * @returns {IStoreIdMessageRequest} The created message.
   */
  export
  function createStoreIdRequestMessage(): IStoreIdMessageRequest {
    return createMessage('storeid-request', {});
  }

  /**
   * Create a `'storeid-reply'` message.
   * 
   * @param {string} parentId The id of the parent of this reply.
   * @param {string} storeId The assigned storeId.
   * @returns {IStoreIdMessageReply} The created message.
   */
  export
  function createStoreIdReplyMessage(parentId: string, storeId: number): IStoreIdMessageReply {
    return createReply('storeid-reply', {storeId}, parentId);
  }

  /**
   * Create a `'undo-request'` message.
   *
   * @returns {IUndoMessageRequest} The created message.
   */
  export
  function createUndoRequestMessage(id: string): IUndoMessageRequest {
    return createMessage<IUndoMessageRequest>('undo-request', { transactionId: id });
  }

  /**
   * Create a `'undo-reply'` message.
   * 
   * @param {string} parentId The id of the parent of this reply.
   * @param {string} storeId The assigned storeId.
   * @returns {IStoreIdMessageReply} The created message.
   */
  export
  function createUndoReplyMessage(parentId: string, transaction: Datastore.Transaction): IUndoMessageReply {
    return createReply('undo-reply', { transaction: transaction as any }, parentId);
  }

  /**
   * Create a `'redo-request'` message.
   *
   * @returns {IRedoMessageRequest} The created message.
   */
  export
  function createRedoRequestMessage(id: string): IRedoMessageRequest {
    return createMessage('redo-request', { transactionId: id });
  }

  /**
   * Create a `'undo-reply'` message.
   * 
   * @param {string} parentId The id of the parent of this reply.
   * @param {string} storeId The assigned storeId.
   * @returns {IStoreIdMessageReply} The created message.
   */
  export
  function createRedoReplyMessage(parentId: string, transaction: Datastore.Transaction): IRedoMessageReply {
    return createReply('redo-reply', { transaction: transaction as any }, parentId);
  }

  /**
   * Create a `'transaction-broadcast'` message.
   *
   * @param {Datastore.Transaction[]} transactions The transactions of the message.
   * @returns {ITransactionBroadcastMessage} The created message.
   */
  export
  function createTransactionBroadcastMessage(transactions: Datastore.Transaction[]): ITransactionBroadcastMessage {
    // TS complains about not being able to cast Transaction[] to JSONArray
    // so for now cast to any:
    return createMessage('transaction-broadcast', { transactions: transactions as any });
  }

  /**
   * Create a `'transaction-ack'` message.
   *
   * @param {string} parentId The id of the parent of this reply.
   * @param {string[]} transactionIds The ids of the acknowledged transactions.
   * @returns {ITransactionBroadcastMessage} The created message.
   */
  export
  function createTransactionAckMessage(parentId: string, transactionIds: string[]): ITransactionAckMessage {

    return createReply('transaction-ack', { transactionIds }, parentId);
  }

  /**
   * Create a `'history-request'` message.
   *
   * @returns {IHistoryRequestMessage} The created message.
   */
  export
  function createHistoryRequestMessage(): IHistoryRequestMessage {
    return createMessage('history-request', {});
  }

  /**
   * Create a `'history-reply'` message.
   *
   * @param {string} parentId The id of the parent of this reply.
   * @param {History} history The history of this reply.
   * @returns {IHistoryRequestMessage} The created message.
   */
  export
  function createHistoryReplyMessage(parentId: string, history: TransactionHistory): IHistoryReplyMessage {
    return createReply('history-reply', { history } as any, parentId);
  }

  export
  function isReply(message: IMessage): message is IReplyMessage {
    return message.parentId !== undefined;
  }

}
