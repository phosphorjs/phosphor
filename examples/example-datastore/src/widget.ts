/*-----------------------------------------------------------------------------
| Copyright (c) 2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Fields, Datastore, RegisterField, TextField
} from '@phosphor/datastore';

import {
  Panel, Widget
} from '@phosphor/widgets';

import * as monaco from 'monaco-editor';

/**
 * A schema for an editor model. Currently contains two fields, the current
 * value and whether the model is read only. Other fields could include
 * language, mimetype, and collaborator cursors.
 */
export const EDITOR_SCHEMA = {
  id: 'editor',
  fields: {
    readOnly: Fields.Boolean(),
    text: new TextField()
  }
};

/**
 * A widget which hosts a collaborative monaco text editor.
 */
export class MonacoEditor extends Panel {
  /**
   * Create a new editor widget.
   *
   * @param datastore: a datastore which holds an editor table using `EDITOR_SCHEMA`.
   *
   * @param record: the record to watch in the editor table.
   */
  constructor(datastore: Datastore, record: string) {
    super();
    this.addClass('content');
    this._store = datastore;
    this._record = record;

    // Get initial values for the editor
    let editorTable = this._store.get(EDITOR_SCHEMA);
    let initialValue = editorTable.get(record)!.text;
    let readOnly = editorTable.get(record)!.readOnly;

    // Set up the DOM structure
    this._editorWidget = new Widget();
    this._checkWidget = new Widget();
    this._checkWidget.addClass('read-only-check');
    this._checkWidget.node.textContent = 'Read Only';
    this._check = document.createElement('input');
    this._check.type = 'checkbox';
    this._check.checked = readOnly;
    this._checkWidget.node.appendChild(this._check);

    this.addWidget(this._checkWidget);
    this.addWidget(this._editorWidget);

    // Listen to changes in the checkbox.
    this._check.onchange = () => {
      // If this was a remote change, we are done.
      if (this._changeGuard) {
        return;
      }
      // Update the readonly state
      this._editor.updateOptions({ readOnly: this._check.checked });
      // Update the table to broadcast the change.
      let editorTable = this._store.get(EDITOR_SCHEMA);
      datastore.beginTransaction();
      editorTable.update({
        [record]: {
          readOnly: this._check.checked
        }
      });
      datastore.endTransaction();
    };

    // Create the editor instance.
    this._editor = monaco.editor.create(this.node, {
      value: initialValue,
      readOnly,
      lineNumbers: 'off',
      theme: 'vs-dark',
      minimap: { enabled: false },
    });

    // Listen for changes on the editor model.
    let model = this._editor.getModel()!;
    model.onDidChangeContent(event => {
      // If this was a remote change, we are done.
      if (this._changeGuard) {
        return;
      }
      // If this was a local change, update the table.
      let editorTable = this._store.get(EDITOR_SCHEMA);
      event.changes.forEach(change => {
        datastore.beginTransaction();
        editorTable.update({
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

    // Listen for changes on the datastore.
    datastore.changed.connect(this._onDatastoreChange, this);
  }


  /**
   * Handle a resize event for the editor.
   */
  onResize() {
    this._editor.layout();
  }

  /**
   * Handle a `after-show` message for the editor.
   */
  onAfterShow() {
    this._editor.layout();
  }

  /**
   * Respond to a change on the datastore.
   */
  private _onDatastoreChange(store: Datastore, change: Datastore.IChangedArgs): void {
    // Ignore changes that have already been applied locally.
    if (change.storeId === store.id) {
      return;
    }
    // Apply text field changes to the monaco editor.
    let c = change.change['editor'];
    if (c && c[this._record] && c[this._record].text) {
      let model = this._editor.getModel()!;
      let textChanges = c[this._record].text as TextField.Change;
      let ops = textChanges.map(tc => {
        // Convert the change data to monaco range and inserted text.
        let start = model.getPositionAt(tc.index)
        let end = model.getPositionAt(tc.index + tc.removed.length);
        let range = monaco.Range.fromPositions(start, end);
        let text = tc.inserted;

        // Return the monaco operation.
        return { text, range } as monaco.editor.IIdentifiedSingleEditOperation;
      });
      // Apply the operation, setting the change guard so we can ignore
      // the change signals from monaco.
      this._changeGuard = true;
      model.pushEditOperations([], ops, () => null);
      this._changeGuard = false;
    }

    // If the readonly state has changed, update the check box, setting the
    // change guard so we can ignore it in the onchange event.
    if(c && c[this._record] && c[this._record].readOnly) {
      this._changeGuard = true;
      let checkChange = c[this._record].readOnly as RegisterField.Change<boolean>;
      this._check.checked = checkChange.current;
      // Update the readonly state
      this._editor.updateOptions({ readOnly: this._check.checked });
      this._changeGuard = false;
    }
  }

  private _changeGuard: boolean = false;
  private _check: HTMLInputElement;
  private _checkWidget: Widget;
  private _editor: monaco.editor.ICodeEditor;
  private _editorWidget: Widget;
  private _record: string;
  private _store: Datastore;
}
