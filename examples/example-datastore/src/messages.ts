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
 *
 */
export
namespace WSAdapterMessages {

  /**
   *
   */
  export
  type IBaseMessage = JSONObject & {
    msgId: string;
    msgType: (
      'storeid-request' | 'storeid-reply'|
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
   *
   */
  export
  type IStoreIdMessageRequest = IBaseMessage & {
    msgType: 'storeid-request';
    content: {};
  }

  /**
   *
   */
  export
  type IStoreIdMessageReply = IBaseReplyMessage & {
    msgType: 'storeid-reply';
    content: {
      readonly storeId: number
    };
  }

  /**
   *
   */
  export
  type ITransactionBroadcastMessage = IBaseMessage & {
    msgType: 'transaction-broadcast';
    content: {
      readonly transactions: ReadonlyArray<Datastore.Transaction>;
    };
  }

  /**
   *
   */
  export
  type ITransactionAckMessage = IBaseReplyMessage & {
    msgType: 'transaction-ack';
    content: {
      readonly transactionIds: string[];
    };
  }

  /**
   *
   */
  export
  type IHistoryRequestMessage = IBaseMessage & {
    msgType: 'history-request';
    content: {};
  }

  /**
   *
   */
  export
  type IHistoryReplyMessage = IBaseReplyMessage & {
    msgType: 'history-reply';
    content: {
      history: TransactionHistory
    };
  }

  /**
   *
   */
  export
  type IReplyMessage = (
    IStoreIdMessageReply | ITransactionAckMessage |
    IHistoryReplyMessage
  );

  /**
   *
   */
  export
  type IMessage = (
    IStoreIdMessageRequest | ITransactionBroadcastMessage |
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
    const msgId = UUID.uuid4();
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
    const msgId = UUID.uuid4();
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
