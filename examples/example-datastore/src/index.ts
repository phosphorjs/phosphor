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
  Fields, Datastore, RegisterField, Schema, TextField
} from '@phosphor/datastore';

import {
  IMessageHandler, Message, MessageLoop
} from '@phosphor/messaging';

import {
  BoxPanel, DockPanel, Panel, Widget
} from '@phosphor/widgets';

import {
  WSDatastoreAdapter
} from './wsadapter';

import * as monaco from 'monaco-editor';

import '../style/index.css';

const rootSchema = {
  id: 'root',
  fields: {
    readOnly: Fields.Boolean(),
    text: new TextField()
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


class MonacoEditor extends Panel {
  /**
   *
   */
  constructor(datastore: Datastore, record: string) {
    super();
    this.addClass('content');
    this._store = datastore;
    this._record = record;

    const rootTable = this._store.get(rootSchema);
    const initialValue = rootTable.get(record)!.text;
    const readOnly = rootTable.get(record)!.readOnly;

    this._checkWidget = new Widget();
    this._checkWidget.addClass('read-only-check');
    this._checkWidget.node.textContent = 'Read Only';
    this._editorWidget = new Widget();
    this.addWidget(this._checkWidget);
    this.addWidget(this._editorWidget);

    this._check = document.createElement('input');
    this._check.type = 'checkbox';
    this._check.checked = readOnly;
    this._checkWidget.node.appendChild(this._check);
    this._check.onchange = () => {
      this._editor.updateOptions({ readOnly: this._check.checked });
      if (this._changeGuard) {
        return;
      }
      const rootTable = this._store.get(rootSchema);
      datastore.beginTransaction();
      rootTable.update({
        [record]: {
          readOnly: this._check.checked
        }
      });
      datastore.endTransaction();
    };
    datastore.changed.connect(this._onDatastoreChange, this);


    this._editor = monaco.editor.create(this.node, {
      value: initialValue,
      readOnly,
      lineNumbers: "off",
      theme: 'vs-dark',
      minimap: { enabled: false },
    });

    const model = this._editor.getModel()!;
    model.onDidChangeContent(event => {
      if (this._changeGuard) {
        return;
      }
      const rootTable = this._store.get(rootSchema);
      event.changes.forEach(change => {
        datastore.beginTransaction();
        rootTable.update({
          [record]: {
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
    datastore.changed.connect(this._onDatastoreChange, this);
  }


  onResize() {
    this._editor.layout();
  }

  onAfterShow() {
    this._editor.layout();
  }

  private _onDatastoreChange(store: Datastore, change: Datastore.IChangedArgs): void {
    if (change.storeId === store.id) {
      return;
    }
    const model = this._editor.getModel()!;
    const c = change.change['root'];
    if (c && c[this._record] && c[this._record].text) {
      const textChanges = c[this._record].text as TextField.Change;
      textChanges.forEach(textChange => {
        const start = model.getPositionAt(textChange.index)
        const end = model.getPositionAt(textChange.index + textChange.removed.length);
        const range = monaco.Range.fromPositions(start, end);

        const op: monaco.editor.IIdentifiedSingleEditOperation = {
          text: textChange.inserted,
          range
        };
        this._changeGuard = true;
        model.pushEditOperations([], [op], () => null);
        this._changeGuard = false;
      });
    }

    if(c && c[this._record] && c[this._record].readOnly) {
      this._changeGuard = true;
      this._check.checked = (c[this._record].readOnly as RegisterField.Change<boolean>).current;
      this._changeGuard = false;
    }
  }

  private _changeGuard: boolean = false;
  private _record: string;
  private _store: Datastore;
  private _editor: monaco.editor.ICodeEditor;
  private _editorWidget: Widget;
  private _checkWidget: Widget;
  private _check: HTMLInputElement;
}

async function init(): Promise<void> {

  const serverConnection = new ClearingHouse(
    () => new WebSocket('ws://localhost:8080'),
    [rootSchema]
  );

  await Promise.all([serverConnection.initialHistory, serverConnection.ready]);

  const store = serverConnection.datastore

  const rootTable = store.get(rootSchema);
  if (rootTable.isEmpty) {
    // Empty table -> Let us initialize some state
    store.beginTransaction();
    try {
      rootTable.update({
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
  dock.addWidget(e2);
  dock.addWidget(e3);
  dock.id = 'dock';

  let box = new BoxPanel({ spacing: 2 });
  box.id = 'main';
  box.addWidget(dock);

  Widget.attach(box, document.body);
}

window.onload = init;
