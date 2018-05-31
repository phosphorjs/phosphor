/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONObject, UUID, PromiseDelegate
} from '@phosphor/coreutils';

import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
  IMessageHandler
} from '@phosphor/messaging';

import {
  IServerAdapter, Patch, PatchHistory, PatchHistoryMessage, RemotePatchMessage
} from './serveradapter';


/**
 * 
 */
export
namespace WSAdapterMessages {

  /**
   * 
   */
  export
  type IBaseMessage = {
    msgId: string;
    msgType: (
      'storeid-request' | 'storeid-reply' | 'patch-broadcast' |
      'patch-history-request' | 'patch-history-reply' |
      'fetch-patch-request' | 'fetch-patch-reply'
    );
    parentId: undefined;

    readonly content: ReadonlyJSONObject;
  }

  export
  type IReplyMessage = IBaseMessage & {
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
  type IStoreIdMessageReply = IReplyMessage & {
    msgType: 'storeid-reply';
    content: {
      readonly storeId: number
    };
  }

  /**
   * 
   */
  export
  type IPatchBroadcastMessage = IBaseMessage & {
    msgType: 'patch-broadcast';
    content: {
      readonly patch: Patch;
    };
  }

  /**
   * 
   */
  export
  type IPatchHistoryRequestMessage = IBaseMessage & {
    msgType: 'patch-history-request';
    content: {};
  }

  /**
   * 
   */
  export
  type IPatchHistoryReply = IReplyMessage & {
    msgType: 'patch-history-reply';
    content: {
      patchHistory: PatchHistory
    };
  }

  /**
   * 
   */
  export
  type IPatchFetchRequestMessage = IBaseMessage & {
    msgType: 'fetch-patch-request';
    content: {
      readonly patchIds: ReadonlyArray<string>;
    };
  }

  /**
   * 
   */
  export
  type IPatchFetchReplyMessage = IReplyMessage & {
    msgType: 'fetch-patch-reply';
    content: {
      readonly patches: Patch[];
    };
  }

  /**
   * 
   */
  export
  type IMessage = (
    IStoreIdMessageRequest | IStoreIdMessageReply | IPatchBroadcastMessage |
    IPatchHistoryRequestMessage | IPatchHistoryReply |
    IPatchFetchRequestMessage | IPatchHistoryReply
  );


  /**
   * Create a WSServerAdapter message.
   *
   * @param {string} msgType The message type.
   * @param {ReadonlyJSONObject} content The content of the message.
   * @param {string} parentId An optional id of the parent of this message.
   * @returns {IPatchBroadcastMessage} The created message.
   */
  export
  function createMessage(msgType: IMessage['msgType'], content: ReadonlyJSONObject, parentId?: string): IMessage {
    const msgId = UUID.uuid4();
    return {
      msgId,
      msgType,
      parentId,
      content
    } as IMessage;
  }

  /**
   * Create a `'storeid-request'` message.
   *
   * @returns {IStoreIdMessageRequest} The created message.
   */
  export
  function createStoreIdRequestMessage(): IStoreIdMessageRequest {
    return createMessage('storeid-request', {}) as IStoreIdMessageRequest;
  }

  /**
   * Create a `'patch-broadcast'` message.
   *
   * @param {Patch} patch The patch of the message.
   * @returns {IPatchBroadcastMessage} The created message.
   */
  export
  function createPatchBroadcastMessage(patch: Patch): IPatchBroadcastMessage {
    return createMessage('patch-broadcast', { patch }) as IPatchBroadcastMessage;
  }

  /**
   * Create a `'patch-history-request'` message.
   *
   * @returns {IPatchHistoryRequestMessage} The created message.
   */
  export
  function createPatchHistoryRequestMessage(): IPatchHistoryRequestMessage {
    return createMessage('patch-history-request', {}) as IPatchHistoryRequestMessage;
  }

  /**
   * Create a `'fetch-patch-request'` message.
   *
   * @param {ReadonlyArray<string>} patchIds The patch ids of the message.
   * @returns {IPatchFetchRequestMessage} The created message.
   */
  export
  function createPatchFetchRequestMessage(patchIds: ReadonlyArray<string>): IPatchFetchRequestMessage {
    return createMessage('fetch-patch-request', { patchIds}) as IPatchFetchRequestMessage;
  }

}



/**
 *
 */
export
class WSServerAdapter implements IServerAdapter, IDisposable {
  /**
   *
   */
  constructor(wsFactory: () => WebSocket) {
    this._wsFactory = wsFactory;
    this._createSocket();
    this._delegates = new Map<string, PromiseDelegate<WSAdapterMessages.IReplyMessage>>();
    this._handlers = new Map<number, IMessageHandler>();
  }


  /**
   * Dispose of the resources held by the adapter.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._handlers.clear();
    this._clearSocket();
  }

  /**
   * Test whether the kernel has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }


  /**
   * Create a new, unique store id.
   *
   * @returns {Promise<number>} A promise to the new store id.
   */
  createStoreId(): Promise<number> {
    const msg = WSAdapterMessages.createStoreIdRequestMessage();
    return this.handleRequestMessage(msg).then((reply: WSAdapterMessages.IStoreIdMessageReply) => {
      return reply.content.storeId;
    });
  }

  /**
   * Register a handler for messages from the server adaptor.
   *
   * @param {number} storeId The store id of the patch handler.
   * @param {IMessageHandler} handler The patch handler to register.
   * @returns {IDisposable} Disposable to use to unregister the handler.
   */
  registerPatchHandler(storeId: number, handler: IMessageHandler): IDisposable {
    this._handlers.set(storeId, handler);
    const fetchMsg = WSAdapterMessages.createPatchHistoryRequestMessage();
    // TODO: Record any patches that arrive while waiting for reply
    this.handleRequestMessage(fetchMsg).then((historyMsg: WSAdapterMessages.IPatchHistoryReply) => {
      // TODO: Add any recorded patches that arrived
      const message = new PatchHistoryMessage(historyMsg.content.patchHistory);
      handler.processMessage(message);
    });
    return new DisposableDelegate(() => {
      this._handlers.delete(storeId);
    });
  }

  /**
   * Broadcast a patch to all data stores.
   *
   * @param {number} storeId The store id of the patch source.
   * @param {ReadonlyJSONObject} content The patch content.
   * @returns {string} The patch id of the broadcasted patch.
   */
  broadcastPatch(storeId: number, content: ReadonlyJSONObject): string {
    const patchId = this.createPatchId(storeId);
    const patch = {
      patchId,
      storeId,
      content,
    };
    const msg = WSAdapterMessages.createPatchBroadcastMessage(patch);
    this.sendMessage(msg);
    this.broadcastLocal(patch);
    return patchId;
  }

  /**
   * Fetch specific patches from history by their id.
   *
   * @param {string[]} patchIds The patch ids to fetch.
   * @returns {Promise<Patch[]>} A promise to the patches that are fetched.
   */
  fetchPatches(patchIds: string[]): Promise<Patch[]> {
    const msg = WSAdapterMessages.createPatchFetchRequestMessage(patchIds);
    return this.handleRequestMessage(msg).then((reply: WSAdapterMessages.IPatchFetchReplyMessage) => {
      return reply.content.patches;
    });
  }


  /**
   * Send a message to the server and resolve the reply message.
   */
  protected handleRequestMessage(msg: WSAdapterMessages.IStoreIdMessageRequest): Promise<WSAdapterMessages.IStoreIdMessageReply>
  protected handleRequestMessage(msg: WSAdapterMessages.IPatchFetchRequestMessage): Promise<WSAdapterMessages.IPatchFetchReplyMessage>
  protected handleRequestMessage(msg: WSAdapterMessages.IPatchHistoryRequestMessage): Promise<WSAdapterMessages.IPatchHistoryReply>
  protected handleRequestMessage(msg: WSAdapterMessages.IMessage): Promise<WSAdapterMessages.IReplyMessage> {
    const delegate = new PromiseDelegate<WSAdapterMessages.IReplyMessage>();
    this._delegates.set(msg.msgId, delegate);

    return delegate.promise.then((reply) => {
      this._delegates.delete(msg.msgId);
      return reply;
    });
  }

  protected sendMessage(msg: WSAdapterMessages.IMessage) {
    if (!this._ws || this._wsStopped) {
      throw new Error('Web socket not connected');
    } else {
      this._ws.send(JSON.stringify(msg));
    }
  }

  protected createPatchId(storeId: number): string {
    return `${storeId}:${UUID.uuid4()}`;
  }


  protected broadcastLocal(patch: Patch) {
    const message = new RemotePatchMessage(patch);
    this._handlers.forEach((handler, storeId) => {
      if (storeId === patch.storeId) {
        return;
      }
      handler.processMessage(message);
    });
  }

  /**
   * Create the kernel websocket connection and add socket status handlers.
   */
  private _createSocket = () => {
    this._wsStopped = false;
    this._ws = this._wsFactory();

    this._ws.onmessage = this._onWSMessage;
    this._ws.onopen = this._onWSOpen;
    this._ws.onclose = this._onWSClose;
    this._ws.onerror = this._onWSClose;
  }

  /**
   * Clear the socket state.
   */
  private _clearSocket(): void {
    this._wsStopped = true;
    if (this._ws !== null) {
      // Clear the websocket event handlers and the socket itself.
      this._ws.onopen = this._noOp;
      this._ws.onclose = this._noOp;
      this._ws.onerror = this._noOp;
      this._ws.onmessage = this._noOp;
      this._ws.close();
      this._ws = null;
    }
  }


  private _onWSOpen(evt: Event) {
    this._wsStopped = false;
  }

  private _onWSMessage(evt: MessageEvent) {
    if (this._wsStopped) {
      // If the socket is being closed, ignore any messages
      return;
    }
    let msg = JSON.parse(evt.data) as WSAdapterMessages.IMessage;
    try {
      // TODO: Write a validator
      // validate.validateMessage(msg);
    } catch (error) {
      console.error(`Invalid message: ${error.message}`);
      return;
    }

    let handled = false;

    if (msg.parentId) {
      let delegate = this._delegates && this._delegates.get(msg.parentId);
      if (delegate) {
        delegate.resolve(msg as WSAdapterMessages.IReplyMessage);
        handled = true;
      }
    }
    if (msg.msgType === 'patch-broadcast') {
      // TODO: Ensure the if branch narrows the type implicitly
      this.broadcastLocal(msg.content.patch);
      handled = true;
    }
    if (!handled) {
      console.log('Unhandled server adapter message.', msg);
    }
  }

  private _onWSClose(evt: Event) {
    if (this._wsStopped || !this._ws) {
      return;
    }
    // Clear the websocket event handlers and the socket itself.
    this._ws.onclose = this._noOp;
    this._ws.onerror = this._noOp;
    this._ws = null;
    this._wsStopped = true;
  }

  private _wsFactory: () => WebSocket;
  private _ws: WebSocket | null = null;
  private _wsStopped: boolean;
  private _isDisposed = false;
  private _delegates: Map<string, PromiseDelegate<WSAdapterMessages.IReplyMessage>>;
  private _handlers: Map<number, IMessageHandler>;
  private _noOp = () => { /* no-op */};
}
