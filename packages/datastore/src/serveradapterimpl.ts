/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONObject, JSONObject, UUID, PromiseDelegate
} from '@phosphor/coreutils';

import {
  IDisposable, DisposableDelegate
} from '@phosphor/disposable';

import {
  IMessageHandler
} from '@phosphor/messaging';

import {
  IServerAdapter, IPatch, IPatchHistory, PatchHistoryMessage, RemotePatchMessage
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
  type IMessage = {
    header: {
      msgId: string;
      msgType: 'storeid-request' | 'storeid-reply' | 'patch-broadcast' | 'fetch-patch-request' | 'fetch-patch-reply';
      parentId?: string;
    };

    readonly content: ReadonlyJSONObject;
  }

  /**
   * 
   */
  export
  type IStoreIdMessageRequest = IMessage & {
    header: { msgType: 'storeid-request'};
    content: {};
  }

  /**
   * 
   */
  export
  type IStoreIdMessageReply = IMessage & {
    header: { msgType: 'storeid-reply'};
    content: {
      readonly storeId: number
    };
  }

  /**
   * 
   */
  export
  type IPatchBroadcastMessage = IMessage & {
    header: { msgType: 'patch-broadcast'};
    content: {
      readonly patch: IPatch;
    };
  }

  /**
   * 
   */
  export
  type IPatchFetchRequestMessage = IMessage & {
    header: { msgType: 'fetch-patch-request'};
    content: {
      readonly patchIds: ReadonlyArray<string>;
    };
  }

  /**
   * 
   */
  export
  type IPatchFetchReplyMessage = IMessage & {
    header: { msgType: 'fetch-patch-reply'};
    content: {
      readonly patches: IPatch[];
    };
  }

}




export
class WSServerAdapter implements IServerAdapter {
  /**
   *
   */
  constructor(ws: WebSocket) {
    this._ws = ws;
    this._ws.onmessage = this._onWSMessage;
    this._ws.onopen = this._onWSOpen;
    this._ws.onclose = this._onWSClose;
    this._ws.onerror = this._onWSClose;
    this._delegates = new Map<string, PromiseDelegate<WSAdapterMessages.IMessage>>();
    this._handlers = new Map<number, IMessageHandler>();
  }


  static createMessage(msgType: WSAdapterMessages.IMessage['header']['msgType'], content: ReadonlyJSONObject, parentId?: string): WSAdapterMessages.IMessage {
    const msgId = UUID.uuid4();
    return {
      header: {
        msgId,
        msgType,
        parentId,
      },
      content
    };
  }


  /**
   * Create a new, unique store id.
   *
   * @returns {Promise<number>} A promise to the new store id.
   */
  createStoreId(): Promise<number> {
    const msg = WSServerAdapter.createMessage(
      'storeid-request',
      {}
    );
    return this.handleRequestMessage(msg).then((reply: WSAdapterMessages.IStoreIdMessageReply) => {
      return reply.content.storeId;
    });
  }

  /**
   * 
   *
   * @param {number} storeId The store id of the patch handler.
   * @param {IMessageHandler} handler The patch handler to register.
   * @returns {IDisposable} Disposable to use to unregister the handler.
   */
  registerPatchHandler(storeId: number, handler: IMessageHandler): IDisposable {
    this._handlers.set(storeId, handler);
    // TODO: Fetch checkpoint + patch history
    // TODO: Record any patches that arrive while waiting for reply
    // TODO: On reply, send PatchHistoryMessage to handler
    return new DisposableDelegate(() => {
      this._handlers.delete(storeId);
    });
  }

  /**
   * 
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
    const msg = WSServerAdapter.createMessage(
      'patch-broadcast',
      { patch },
    );
    this._ws.send(JSON.stringify(msg));
    this.broadcast(patch);
    return patchId;
  }

  /**
   * 
   * 
   * @param {string[]} patchIds 
   * @returns {Promise<IPatch[]>} 
   */
  fetchPatches(patchIds: string[]): Promise<IPatch[]> {
    const msg = WSServerAdapter.createMessage(
      'fetch-patch-request',
      {
        patchIds
      }
    );
   return this.handleRequestMessage(msg).then((reply: WSAdapterMessages.IPatchFetchReplyMessage) => {
    return reply.content.patches;
   });
  }


  /**
   * Send a message to the server and resolve the reply message.
   */
  handleRequestMessage(msg: WSAdapterMessages.IMessage): Promise<WSAdapterMessages.IMessage> {
    const delegate = new PromiseDelegate<WSAdapterMessages.IMessage>();
    this._delegates.set(msg.header.msgId, delegate);
    this._ws.send(JSON.stringify(msg));
    return delegate.promise.then((reply) => {
      this._delegates.delete(msg.header.msgId);
      return reply;
    });
  }

  protected createPatchId(storeId: number): string {
    return `${storeId}:${UUID.uuid4()}`;
  }


  protected broadcast(patch: IPatch) {
    const message = new RemotePatchMessage(patch);
    this._handlers.forEach((handler, storeId) => {
      if (storeId === patch.storeId) {
        return;
      }
      handler.processMessage(message);
    });
  }


  private _onWSOpen(evt: Event) {
  }

  private _onWSMessage(evt: MessageEvent) {
    if (this._wsStopped) {
      // If the socket is being closed, ignore any messages
      return;
    }
    let msg = JSON.parse(evt.data) as WSAdapterMessages.IMessage;
    try {
      // TODO: Write a validator
      validate.validateMessage(msg);
    } catch (error) {
      console.error(`Invalid message: ${error.message}`);
      return;
    }

    let handled = false;
    let {msgId, msgType, parentId} = msg.header;

    if (parentId) {
      let delegate = this._delegates && this._delegates.get(parentId);
      if (delegate) {
        delegate.resolve(msg);
        handled = true;
      }
    }
    if (msgType === 'patch-broadcast') {
      // TODO: Ensure the if narrows the type implicitly
      this.broadcast((msg as WSAdapterMessages.IPatchBroadcastMessage).content.patch);
    }
  }

  private _onWSClose(evt: Event) {
  }


  _ws: WebSocket;
  _delegates: Map<string, PromiseDelegate<WSAdapterMessages.IMessage>>;
  _handlers: Map<number, IMessageHandler>;
}
