/*-----------------------------------------------------------------------------
| Copyright (c) 2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  ArrayExt
} from '@phosphor/algorithm';

import {
  CommandRegistry
} from '@phosphor/commands';

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
  BoxPanel, DockPanel, Widget
} from '@phosphor/widgets';

import {
  WSDatastoreAdapter
} from './wsadapter';

import {
  EDITOR_SCHEMA, CodeMirrorEditor
} from './widget';

import '../style/index.css';

let commands = new CommandRegistry();

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
    this._adapter = new WSDatastoreAdapter(wsFactory);
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
    let storeId = await this._adapter.createStoreId();
    this.datastore = Datastore.create({ id: storeId, schemas, adapter: this });
    this._adapter.setMessageHandler(this);
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
    this._adapter.broadcastTransactions([transaction]);
  }

  /**
   * Undo a transaction by id. This sends an undo message to the patch server,
   * but the undo is not actually done until the datastore recieves the
   * corresponding transaction and applies it.
   *
   * @param id: the transaction to undo.
   */
  undo(id: string): Promise<void> {
    return this._adapter.requestUndo(id);
  }

  /**
   * Redo a transaction by id.
   *
   * @param id: the transaction to redo.
   */
  redo(id: string): Promise<void> {
    return this._adapter.requestRedo(id);
  }

  /**
   * A callback for when a remote transaction is received by the server adapter.
   */
  get onRemoteTransaction(): ((transaction: Datastore.Transaction) => void) | null {
    return this._onRemoteTransaction;
  }
  set onRemoteTransaction(value: ((transaction: Datastore.Transaction) => void) | null) {
    this._onRemoteTransaction = value;
  }

  /**
   * A callback for when an undo is received by the server adapter.
   */
  get onUndo(): ((transaction: Datastore.Transaction) => void) | null {
    return this._onUndo;
  }
  set onUndo(value: ((transaction: Datastore.Transaction) => void) | null) {
    this._onUndo = value;
  }

  /**
   * A callback for when a redo is received by the server adapter.
   */
  get onRedo(): ((transaction: Datastore.Transaction) => void) | null {
    return this._onRedo;
  }
  set onRedo(value: ((transaction: Datastore.Transaction) => void) | null) {
    this._onRedo = value;
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
        if (this.onRemoteTransaction) {
          this.onRemoteTransaction(m.transaction);
        }
      } else {
        this._initialHistoryBacklog.push(m.transaction);
      }
    } else if (msg.type === 'history') {
      let m = msg as WSDatastoreAdapter.HistoryMessage;
      if (this.onRemoteTransaction) {
        for (let t of m.history.transactions) {
          this.onRemoteTransaction(t);
        }
      }
      if (!this._initialHistoryReceived) {
        this._initialHistoryReceived = true;
        if (this.onRemoteTransaction) {
          for (let t of this._initialHistoryBacklog) {
            this.onRemoteTransaction(t);
          }
        }
        this._initialHistory.resolve(undefined);
        this._initialHistoryBacklog = [];
      }
    } else if (msg.type === 'undo') {
      let m = msg as WSDatastoreAdapter.UndoMessage;
      if (this.onUndo) {
        this.onUndo(m.transaction);
      }
    } else if (msg.type === 'redo') {
      let m = msg as WSDatastoreAdapter.RedoMessage;
      if (this.onRedo) {
        this.onRedo(m.transaction);
      }
    }
  }

  dispose(): void {
    if (this._isDisposed) {
      return;
    }
    this._isDisposed = true;
  }

  get isDisposed(): boolean {
    return this._isDisposed;
  }

  private _adapter: WSDatastoreAdapter;
  datastore: Datastore;
  ready: Promise<void>;
  private _initialHistory = new PromiseDelegate<void>();
  private _initialHistoryReceived = false;
  private _initialHistoryBacklog: Datastore.Transaction[] = [];
  private _onRemoteTransaction: ((transaction: Datastore.Transaction) => void) | null = null
  private _onUndo: ((transaction: Datastore.Transaction) => void) | null = null
  private _onRedo: ((transaction: Datastore.Transaction) => void) | null = null
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

  commands.addCommand('undo', {
    label: 'Undo',
    execute: () => {
      let editor = ArrayExt.findFirstValue([e1, e2, e3], e => e.hasFocus());
      if (editor) {
        editor.undo();
      }
    }
  });
  commands.addCommand('redo', {
    label: 'Redo',
    execute: () => {
      let editor = ArrayExt.findFirstValue([e1, e2, e3], e => e.hasFocus());
      if (editor) {
        editor.redo();
      }
    }
  });
  commands.addKeyBinding({
    keys: ['Accel Z'],
    selector: 'body',
    command: 'undo'
  });

  commands.addKeyBinding({
    keys: ['Accel Shift Z'],
    selector: 'body',
    command: 'redo'
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    commands.processKeydownEvent(event);
  }, true);
}

window.onload = init;
