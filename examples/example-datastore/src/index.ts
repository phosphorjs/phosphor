/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import 'es6-promise/auto';  // polyfill Promise on IE

import {
  PromiseDelegate
} from '@phosphor/coreutils';

import {
  RegisterField, ListField, TextField, Datastore, Schema
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

import * as monaco from 'monaco-editor';

import '../style/index.css';

const rootSchema = {
  id: 'example-schema-root',
  fields: {
    toggle: new RegisterField<boolean>({value: false}),
    text: new TextField(),
    shownMessages: new ListField<string>(),
  }
};

const messageSchema = {
  id: 'example-schema-messages',
  fields: {
    message: new TextField(),
  }
};


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


class MonacoEditor extends Widget {
  /**
   *
   */
  constructor(datastore: Datastore) {
    super();
    this._store = datastore;

    const rootTable = this._store.get(rootSchema);
    const initialValue = rootTable.get('root')!.text;

    this._editor = monaco.editor.create(this.node, {
      value: initialValue,
      language: 'typescript'
    });
    let changeGuard = false;


    const model = this._editor.getModel()!;
    model.onDidChangeContent(event => {
      if (changeGuard) {
        return;
      }
      const rootTable = this._store.get(rootSchema);
      event.changes.forEach(change => {
        datastore.beginTransaction();
        rootTable.update({
          root: {
            text: {
              index: change.rangeOffset,
              remove: change.rangeLength,
              text: change.text,
            }
          }
        });
        datastore.endTransaction();
      });
    });
    datastore.changed.connect((_, change) => {
      if (change.storeId === datastore.id) {
        return;
      }
      const c = change.change['example-schema-root'];
      if (c && c.root && c.root.text) {
        const textChanges = c.root.text as TextField.Change;
        textChanges.forEach(textChange => {
          const start = model.getPositionAt(textChange.index)
          const end = model.getPositionAt(textChange.index + textChange.removed.length);
          const range = monaco.Range.fromPositions(start, end);

          const op: monaco.editor.IIdentifiedSingleEditOperation = {
            text: textChange.inserted,
            range
          };
          changeGuard = true;
          model.pushEditOperations([], [op], () => null);
          changeGuard = false;
        });
      }
    });
  }


  onResize() {
    this._editor.layout();
  }

  onAfterShow() {
    this._editor.layout();
  }

  private _store: Datastore;
  private _editor: monaco.editor.ICodeEditor;
}

async function init(): Promise<void> {

  const main = new ClearingHouse(
    () => new WebSocket('ws://localhost:8080'),
    [messageSchema, rootSchema]
  );

  await Promise.all([main.initialHistory, main.ready]);

  const store = main.datastore

  const rootTable = store.get(rootSchema);
  if (rootTable.isEmpty) {
    // Empty table -> Let us initialize some state
    store.beginTransaction();
    try {
      rootTable.update({
        root: {
          toggle: true,
        }
      });
    } finally {
      store.endTransaction();
    }
  }

  const e1 = new MonacoEditor(store);
  const e2 = new MonacoEditor(store);
  const e3 = new MonacoEditor(store);

  const dock = new DockPanel();
  dock.addWidget(e1);
  dock.addWidget(e2);
  dock.addWidget(e3);
  dock.id = 'dock';

  let box = new BoxPanel({ direction: 'left-to-right', spacing: 0 });
  box.id = 'main';
  box.addWidget(dock);

  Widget.attach(box, document.body);
}


function main(): void {
  init();
}


window.onload = main;
