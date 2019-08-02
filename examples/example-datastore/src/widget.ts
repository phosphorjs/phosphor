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
export const editorSchema = {
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
   * @param datastore: a datastore which holds an editor table using `editorSchema`.
   *
   * @param record: the record to watch in the editor table.
   */
  constructor(datastore: Datastore, record: string) {
    super();
    this.addClass('content');
    this._store = datastore;
    this._record = record;

    // Get initial values for the editor
    const editorTable = this._store.get(editorSchema);
    const initialValue = editorTable.get(record)!.text;
    const readOnly = editorTable.get(record)!.readOnly;

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
      // Update the readonly state
      this._editor.updateOptions({ readOnly: this._check.checked });
      // If this was a remote change, we are done.
      if (this._changeGuard) {
        return;
      }
      // Update the table to broadcast the change.
      const editorTable = this._store.get(editorSchema);
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
    const model = this._editor.getModel()!;
    model.onDidChangeContent(event => {
      // If this was a remote change, we are done.
      if (this._changeGuard) {
        return;
      }
      // If this was a local change, update the table.
      const editorTable = this._store.get(editorSchema);
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
    const model = this._editor.getModel()!;
    const c = change.change['editor'];
    if (c && c[this._record] && c[this._record].text) {
      const textChanges = c[this._record].text as TextField.Change;
      textChanges.forEach(textChange => {
        // Convert the change data to monaco range and inserted text.
        const start = model.getPositionAt(textChange.index)
        const end = model.getPositionAt(textChange.index + textChange.removed.length);
        const range = monaco.Range.fromPositions(start, end);

        // Construct the monaco operation.
        const op: monaco.editor.IIdentifiedSingleEditOperation = {
          text: textChange.inserted,
          range
        };
        // Apply the operation, setting the change guard so we can ignore
        // the change signals from monaco.
        this._changeGuard = true;
        model.pushEditOperations([], [op], () => null);
        this._changeGuard = false;
      });
    }

    // If the readonly state has changed, update the check box, setting the
    // change guard so we can ignore it in the onchange event.
    if(c && c[this._record] && c[this._record].readOnly) {
      this._changeGuard = true;
      const checkChange = c[this._record].readOnly as RegisterField.Change<boolean>;
      this._check.checked = checkChange.current;
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
