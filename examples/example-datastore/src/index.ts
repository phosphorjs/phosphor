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
  editorSchema, MonacoEditor
} from './widget';

import '../style/index.css';


class ClearingHouse implements IMessageHandler {
  constructor(wsFactory: () => WebSocket, schemas: Schema[]) {
    this.adapter = new WSDatastoreAdapter(wsFactory);
    this.ready = this.init(schemas);
  }

  get initialHistory(): Promise<void> {
    return this._initialHistory.promise;
  }

  async init(schemas: Schema[]): Promise<void> {
    const storeId = await this.adapter.createStoreId();
    this.datastore = Datastore.create({ id: storeId, schemas, broadcastHandler: this });
    this.adapter.setMessageHandler(this);
  }

  processMessage(msg: Message): void {
    if (msg.type === 'datastore-transaction') {
      const m = msg as Datastore.TransactionMessage;
      console.log(m.transaction);
      this.adapter.broadcastTransactions([m.transaction]);
    } else if (msg.type === 'remote-transactions') {
      const m = msg as WSDatastoreAdapter.RemoteTransactionMessage;
      if (this._initialHistoryReceived) {
        MessageLoop.sendMessage(this.datastore, new Datastore.TransactionMessage(m.transaction));
      } else {
        this._initialHistoryBacklog.push(m.transaction);
      }
    } else if (msg.type === 'history') {
      const m = msg as WSDatastoreAdapter.HistoryMessage;
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


async function init(): Promise<void> {

  const serverConnection = new ClearingHouse(
    () => new WebSocket('ws://localhost:8080'),
    [editorSchema]
  );

  await Promise.all([serverConnection.initialHistory, serverConnection.ready]);

  const store = serverConnection.datastore

  const editorTable = store.get(editorSchema);
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

  const e1 = new MonacoEditor(store, 'e1');
  e1.title.label = 'First Document';
  const e2 = new MonacoEditor(store, 'e2');
  e2.title.label = 'Second Document';
  const e3 = new MonacoEditor(store, 'e3');
  e3.title.label = 'Third Document';

  const dock = new DockPanel({ spacing: 4 });
  dock.addWidget(e1);
  dock.addWidget(e2, { mode: 'split-right', ref: e1 });
  dock.addWidget(e3, { mode: 'split-bottom', ref: e2 });
  dock.id = 'dock';

  let box = new BoxPanel({ spacing: 2 });
  box.id = 'main';
  box.addWidget(dock);

  Widget.attach(box, document.body);
}

window.onload = init;
