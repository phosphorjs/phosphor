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
  Datastore, Schema
} from '@phosphor/datastore';

import {
  IMessageHandler, Message, MessageLoop
} from '@phosphor/messaging';

import {
  BoxPanel, DockPanel, Widget
} from '@phosphor/widgets';

import {
  WSDatastoreAdapter
} from './wsadapter';

import {
  EDITOR_SCHEMA, MonacoEditor
} from './widget';

import '../style/index.css';


/**
 * A message handler that initializes communication with the patch server.
 */
class ClearingHouse implements IMessageHandler {
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
    this.datastore = Datastore.create({ id: storeId, schemas, broadcastHandler: this });
    this.adapter.setMessageHandler(this);
  }

  /**
   * Message handler for the object.
   *
   * In particular, it handles patch messages from the server, and transaction
   * messages from the datastore, forwarding them as appropriate.
   */
  processMessage(msg: Message): void {
    if (msg.type === 'datastore-transaction') {
      let m = msg as Datastore.TransactionMessage;
      this.adapter.broadcastTransactions([m.transaction]);
    } else if (msg.type === 'remote-transactions') {
      let m = msg as WSDatastoreAdapter.RemoteTransactionMessage;
      if (this._initialHistoryReceived) {
        MessageLoop.sendMessage(this.datastore, new Datastore.TransactionMessage(m.transaction));
      } else {
        this._initialHistoryBacklog.push(m.transaction);
      }
    } else if (msg.type === 'history') {
      let m = msg as WSDatastoreAdapter.HistoryMessage;
      for (let t of m.history.transactions) {
        MessageLoop.sendMessage(this.datastore, new Datastore.TransactionMessage(t));
      }
      if (!this._initialHistoryReceived) {
        this._initialHistoryReceived = true;
        for (let t of this._initialHistoryBacklog) {
          MessageLoop.sendMessage(this.datastore, new Datastore.TransactionMessage(t));
        }
        this._initialHistory.resolve(undefined);
        this._initialHistoryBacklog = [];
      }
    }
  }

  adapter: WSDatastoreAdapter;
  datastore: Datastore;
  ready: Promise<void>;
  private _initialHistory = new PromiseDelegate<void>();
  private _initialHistoryReceived = false;
  private _initialHistoryBacklog: Datastore.Transaction[] = [];
}


/**
 * Initialize the applicaiton.
 */
async function init(): Promise<void> {

  // Create a patch clearing house.
  let serverConnection = new ClearingHouse(
    () => new WebSocket('ws://localhost:8080'),
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
  let e1 = new MonacoEditor(store, 'e1');
  e1.title.label = 'First Document';
  let e2 = new MonacoEditor(store, 'e2');
  e2.title.label = 'Second Document';
  let e3 = new MonacoEditor(store, 'e3');
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

  Widget.attach(box, document.body);
}

window.onload = init;
