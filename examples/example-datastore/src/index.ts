/*-----------------------------------------------------------------------------
| Copyright (c) 2019, PhosphorJS Contributors
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
  IMessageHandler, Message
} from '@phosphor/messaging';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  BoxPanel, DockPanel, Widget
} from '@phosphor/widgets';

import {
  WSDatastoreAdapter
} from './wsadapter';

import {
  EDITOR_SCHEMA, CodeMirrorEditor
} from './widget';

import '../style/index.css';


/**
 * A message handler that initializes communication with the patch server.
 */
class ClearingHouse implements IServerAdapter, IMessageHandler {
  /**
   * Construct a new clearing house.
   *
   * @param wsFactory: a callback that constructs a websocket.
   *
   * @param schemas: a list of schemas for the collaborator datastores.
   */
  constructor(wsFactory: () => WebSocket, schemas: Schema[]) {
    this.adapter = new WSDatastoreAdapter(wsFactory);
    this.ready = this.init(schemas);
  }

  /**
   * Fetch the initial history from the patch server.
   *
   * @returns a promise that resolves when the initial history has been fetched.
   */
  get initialHistory(): Promise<void> {
    return this._initialHistory.promise;
  }

  /**
   * Initialize the datastore.
   *
   * @param schemas: the schemas for the datastore.
   *
   * @returns a promise that resolves when the datastore is ready.
   */
  async init(schemas: Schema[]): Promise<void> {
    let storeId = await this.adapter.createStoreId();
    this.datastore = Datastore.create({ id: storeId, schemas, adapter: this });
    this.adapter.setMessageHandler(this);
  }

  /**
   * Broadcast a transaction from a datastore to collaborators.
   *
   * @param transaction - the transaction to broadcast to collaborators.
   *
   * #### Notes
   * This is expected to be called by a datastore, and not by any other
   * user. Direct invocations of this function may have unexpected results.
   */
  broadcast(transaction: Datastore.Transaction): void {
    this.adapter.broadcastTransactions([transaction]);
  }

  /**
   * Undo a transaction by id. This sends an undo message to the patch server,
   * but the undo is not actually done until the datastore recieves the
   * corresponding transaction and applies it.
   *
   * @param id: the transaction to undo.
   */
  undo(id: string): Promise<void> {
    return Promise.resolve(void 0);
  }

  /**
   * Redo a transaction by id.
   *
   * @param id: the transaction to redo.
   */
  redo(id: string): Promise<void> {
    return Promise.resolve(void 0);
  }

  /**
   * A signal that is fired when a transaction is received from the server.
   * Intended to be consumed by a datastore, though other objects may snoop
   * on the messages.
   */
  get received(): ISignal<this, IServerAdapter.IReceivedArgs> {
    return this._received;
  }

  /**
   * Message handler for the object.
   *
   * In particular, it handles patch messages from the server, and transaction
   * messages from the datastore, forwarding them as appropriate.
   */
  processMessage(msg: Message): void {
    if (msg.type === 'remote-transactions') {
      let m = msg as WSDatastoreAdapter.RemoteTransactionMessage;
      if (this._initialHistoryReceived) {
        this._received.emit({ type: 'transaction', transaction: m.transaction });
      } else {
        this._initialHistoryBacklog.push(m.transaction);
      }
    } else if (msg.type === 'history') {
      let m = msg as WSDatastoreAdapter.HistoryMessage;
      for (let t of m.history.transactions) {
        this._received.emit({ type: 'transaction', transaction: t });
      }
      if (!this._initialHistoryReceived) {
        this._initialHistoryReceived = true;
        for (let t of this._initialHistoryBacklog) {
          this._received.emit({ type: 'transaction', transaction: t });
        }
        this._initialHistory.resolve(undefined);
        this._initialHistoryBacklog = [];
      }
    }
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  adapter: WSDatastoreAdapter;
  datastore: Datastore;
  ready: Promise<void>;
  private _initialHistory = new PromiseDelegate<void>();
  private _initialHistoryReceived = false;
  private _initialHistoryBacklog: Datastore.Transaction[] = [];
  private _received = new Signal<this, IServerAdapter.IReceivedArgs>(this);
  private _isDisposed = false;
}


/**
 * Initialize the applicaiton.
 */
async function init(): Promise<void> {

  // Create a patch clearing house.
  let serverConnection = new ClearingHouse(
    () => new WebSocket(window.location.origin.replace(/^http/, 'ws')),
    [EDITOR_SCHEMA]
  );
  await Promise.all([serverConnection.initialHistory, serverConnection.ready]);

  // Possibly initialize the datastore.
  let store = serverConnection.datastore
  let editorTable = store.get(EDITOR_SCHEMA);
  if (editorTable.isEmpty) {
    // Empty table -> Let us initialize some state
    store.beginTransaction();
    try {
      editorTable.update({
        e1: {},
        e2: {},
        e3: {}
      });
    } finally {
      store.endTransaction();
    }
  }

  // Set up the text editors.
  let e1 = new CodeMirrorEditor(store, 'e1');
  e1.title.label = 'First Document';
  let e2 = new CodeMirrorEditor(store, 'e2');
  e2.title.label = 'Second Document';
  let e3 = new CodeMirrorEditor(store, 'e3');
  e3.title.label = 'Third Document';

  // Add the text editors to a dock panel.
  let dock = new DockPanel({ spacing: 4 });
  dock.addWidget(e1);
  dock.addWidget(e2, { mode: 'split-right', ref: e1 });
  dock.addWidget(e3, { mode: 'split-bottom', ref: e2 });
  dock.id = 'dock';

  // Add the dock panel to the document.
  let box = new BoxPanel({ spacing: 2 });
  box.id = 'main';
  box.addWidget(dock);

  window.onresize = () => { box.update(); };

  Widget.attach(box, document.body);
}

window.onload = init;
