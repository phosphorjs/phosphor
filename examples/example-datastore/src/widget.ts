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

import * as CodeMirror from 'codemirror';

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
 * A widget which hosts a collaborative CodeMirror text editor.
 */
export class CodeMirrorEditor extends Panel {
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
    this._checkWidget.node.style.height = '24px';
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
      this._editor.setOption("readOnly", this._check.checked);
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
    this._editor = CodeMirror(this._editorWidget.node, {
      value: initialValue,
      lineNumbers: true,
    });

    // Listen for changes on the editor model.
    CodeMirror.on(this._editor.getDoc(), 'beforeChange', (doc, change) => {
      // If this was a remote change, we are done.
      if (this._changeGuard) {
        return;
      }
      let start = doc.indexFromPos(change.from);
      let end = doc.indexFromPos(change.to);
      let text = change.text.join('\n');
      // If this was a local change, update the table.
      datastore.beginTransaction();
      editorTable.update({
        [record]: {
          text: {
            index: start,
            remove: end - start,
            text: text,
          }
        }
      });
      datastore.endTransaction();
    });

    // Listen for changes on the datastore.
    datastore.changed.connect(this._onDatastoreChange, this);
  }


  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (msg.width >= 0 && msg.height >= 0) {
      this._editor.setSize(msg.width, msg.height - 24);
    } else if (this.isVisible) {
      this._editor.setSize(null, null);
    }
    this._editor.refresh();
  }

  /**
   * Handle a `after-show` message for the editor.
   */
  onAfterShow() {
    this._editor.refresh();
  }

  /**
   * Respond to a change on the datastore.
   */
  private _onDatastoreChange(store: Datastore, change: Datastore.IChangedArgs): void {
    // Ignore changes that have already been applied locally.
    if (change.storeId === store.id) {
      return;
    }
    let doc = this._editor.getDoc();
    // Apply text field changes to the editor.
    let c = change.change['editor'];
    if (c && c[this._record] && c[this._record].text) {
      let textChanges = c[this._record].text as TextField.Change;
      textChanges.forEach(tc => {
        // Convert the change data to codemirror range and inserted text.
        let from = doc.posFromIndex(tc.index);
        let to = doc.posFromIndex(tc.index + tc.removed.length);

        let replacement = tc.inserted;
        this._changeGuard = true;
        doc.replaceRange(replacement, from, to, '+input');
        this._changeGuard = false;
      });
      // Apply the operation, setting the change guard so we can ignore
      // the change signals from codemirror.
    }

    // If the readonly state has changed, update the check box, setting the
    // change guard so we can ignore it in the onchange event.
    if(c && c[this._record] && c[this._record].readOnly) {
      this._changeGuard = true;
      let checkChange = c[this._record].readOnly as RegisterField.Change<boolean>;
      this._check.checked = checkChange.current;
      // Update the readonly state
      this._editor.setOption("readOnly", this._check.checked);
      this._changeGuard = false;
    }
  }

  private _changeGuard: boolean = false;
  private _check: HTMLInputElement;
  private _checkWidget: Widget;
  private _editor: CodeMirror.Editor;
  private _editorWidget: Widget;
  private _record: string;
  private _store: Datastore;
}
