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
  Widget
} from '@phosphor/widgets';

import {
  WSDatastoreAdapter
} from './wsadapter';

import * as monaco from 'monaco-editor';


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


class MyView extends Widget {
  /**
   *
   */
  constructor(datastore: Datastore) {
    super();
    this._store = datastore;
    this._chk = document.createElement('input');
    this._chk.setAttribute('type', 'checkbox');
    this._chk.onchange = this._onChkChange.bind(this);
    this._div = document.createElement('div');
    this.node.appendChild(this._chk);
    this.node.appendChild(this._div);
    const editorDiv = document.getElementById('container') as HTMLDivElement;

    const rootTable = this._store.get(rootSchema);
    const initialValue = rootTable.get('root')!.text;

    this._editor = monaco.editor.create(editorDiv, {
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
      datastore.beginTransaction();
      event.changes.forEach(change => {
        rootTable.update({
          root: {
            text: {
              index: change.rangeOffset,
              remove: change.rangeLength,
              text: change.text,
            }
          }
        });
      });
      datastore.endTransaction();
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

  onUpdateRequest() {
    const rootTable = this._store.get(rootSchema);
    const messageTable = this._store.get(messageSchema);
    const rootRecord = rootTable.get('root')!;
    this._chk.checked = rootRecord.toggle;
    this._div.innerHTML = '';
    for (let msgId of rootRecord.shownMessages) {
      const msgRecord = messageTable.get(msgId);
      if (msgRecord === undefined) {
        const entry = document.createElement('div');
        entry.innerText = '<Missing message>';
        entry.className = 'message message-missing';
        this._div.appendChild(entry);
      } else {
        let entry = this._textareas[msgId];
        if (entry === undefined) {
          entry = this._textareas[msgId] = document.createElement('textarea');
          entry.className = 'message';
          entry.oninput = () => {
            this._onTextInput(msgId);
          }
        }
        entry.value = msgRecord.message;
        this._div.appendChild(entry);
      }
    }
  }

  private _onChkChange(evt: Event) {
    const rootTable = this._store.get(rootSchema);
    this._store.beginTransaction();
    try {
      rootTable.update({
        [rootTable.get('root')!.$id]: {
          toggle: this._chk.checked,
        }
      })
    } finally {
      this._store.endTransaction();
    }
  }

  private _onTextInput(msgId: string) {
    const messageTable = this._store.get(messageSchema);
    const msgRecord = messageTable.get(msgId)!;
    const entry = this._textareas[msgId]!;
    this._store.beginTransaction();
    try {
      messageTable.update({
        [msgId]: { message: {
          index: 0,
          remove: msgRecord.message.length,
          text: entry.value,
        }}
      });
    } finally {
      this._store.endTransaction();
    }
  }

  private _store: Datastore;
  private _chk: HTMLInputElement;
  private _div: HTMLDivElement;
  private _editor: monaco.editor.ICodeEditor;
  private _textareas: {[key: string]: HTMLTextAreaElement | undefined} = {};
}

async function init(): Promise<void> {

  const main = new ClearingHouse(
    () => new WebSocket('ws://localhost:8080'),
    [messageSchema, rootSchema]
  );

  await Promise.all([main.initialHistory, main.ready]);

  const store = main.datastore

  const messageTable = store.get(messageSchema);
  const rootTable = store.get(rootSchema);
  if (rootTable.isEmpty) {
    // Empty table -> Let us initialize some state
    store.beginTransaction();
    try {
      messageTable.update({
        msg0: {
          message: { index: 0, remove: 0, text: 'This is entry 0' }
        },
        msg1: {
          message: { index: 0, remove: 0, text: 'And this is entry 1' }
        },
        msg2: {
          message: { index: 0, remove: 0, text: 'This message is not shown' }
        },
        'other-msg-id': {
          message: { index: 0, remove: 0, text: 'This entry has a different kind of ID' }
        }
      });
      rootTable.update({
        root: {
          toggle: true,
          shownMessages: {
            index: 0,
            remove: 0,
            values: ['msg1', 'msg0', 'other-msg-id']
          }
        }
      });
    } finally {
      store.endTransaction();
    }
  }

  const widget = new MyView(store);
  widget.update();
  store.changed.connect((_, change) => {
    if (change.storeId !== store.id) {
      widget.update();
    }
  });
  Widget.attach(widget, document.body);
}


function main(): void {
  init();
}


window.onload = main;
