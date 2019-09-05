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
  BoxPanel, DockPanel, Widget
} from '@phosphor/widgets';

import {
  WSAdapter
} from './wsadapter';

import {
  EDITOR_SCHEMA, CodeMirrorEditor
} from './widget';

import '../style/index.css';

let commands = new CommandRegistry();

/**
 * Initialize the applicaiton.
 */
async function init(): Promise<void> {

  // Create a transaction server adapter, which is responsible for creating
  // a new datastore as well as managing its connection to the server.
  let adapter = new WSAdapter(
    () => new WebSocket(window.location.origin.replace(/^http/, 'ws')),
  );
  // Create the datastore.
  let store = await adapter.createStore([EDITOR_SCHEMA]);

  // The datastore may come prepopulated with a transaction history.
  // If it is empty, that means we are the first collaborator, in
  // which case we initialize it.
  let editorTable = store.get(EDITOR_SCHEMA);
  if (editorTable.isEmpty) {
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

  // Add commands for undo and redo.
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

  // Add keybindings for undo and redo.
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
