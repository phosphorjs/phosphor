/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  PromiseDelegate, JSONValue
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';


/**
 * Abstract base for a class that sends/receives messages over websocket.
 */
export
abstract class WSConnection<T extends JSONValue, U extends JSONValue> implements IDisposable {
  /**
   * Create a new websocket based connection.
   */
  constructor(wsFactory: WSConnection.WSFactory) {
    this._wsFactory = wsFactory;
    this._ready = new PromiseDelegate<void>();
    this._createSocket();
  }


  /**
   * Dispose of the resources held by the adapter.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    this._clearSocket();
  }

  /**
   * Test whether the kernel has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * A promise that resolves once the connection is open.
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  /**
   * Send a message over the websocket.
   *
   * @param msg - The JSON value to send.
   *
   */
  protected sendMessage(msg: T) {
    if (!this._ws || this._wsStopped) {
      throw new Error('Web socket not connected');
    } else {
      this._ws.send(JSON.stringify(msg));
    }
  }

  /**
   * Handle a received, decoded WS message.
   *
   * @param msg - The decoded message that was received.
   *
   * @returns Whether the message was handled.
   */
  protected abstract handleMessage(msg: U): boolean;

  /**
   * Create the kernel websocket connection and add socket status handlers.
   */
  private _createSocket = () => {
    this._wsStopped = false;
    this._ws = this._wsFactory();

    this._ws.onmessage = this._onWSMessage.bind(this);
    this._ws.onopen = this._onWSOpen.bind(this);
    this._ws.onclose = this._onWSClose.bind(this);
    this._ws.onerror = this._onWSClose.bind(this);
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


  private _onWSOpen(evt: Event): void {
    this._wsStopped = false;
    this._ready.resolve(undefined);
  }

  private _onWSMessage(evt: MessageEvent) {
    if (this._wsStopped) {
      // If the socket is being closed, ignore any messages
      return;
    }
    let msg;
    try {
      msg = JSON.parse(evt.data) as U;
    } catch (error) {
      console.error(`Invalid message: ${error.message}`);
      return;
    }

    let handled = this.handleMessage(msg);
    if (!handled) {
      console.log('Unhandled websocket message.', msg);
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

  private _wsFactory: WSConnection.WSFactory;
  private _ws: WebSocket | null = null;
  private _wsStopped: boolean;
  private _isDisposed = false;
  private _ready: PromiseDelegate<void>;
  private _noOp = () => { /* no-op */};
}


/**
 * The namespace for WSConnection statics.
 */
export
namespace WSConnection {
  /**
   * A websocket factory function.
   */
  export
  type WSFactory = () => WebSocket;
}
