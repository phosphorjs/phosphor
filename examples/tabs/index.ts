/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
'use strict';

import {
  Message
} from 'phosphor/lib/core/messaging';

import {
  TabPanel
} from 'phosphor/lib/ui/tabpanel';

import {
  ResizeMessage, Widget
} from 'phosphor/lib/ui/widget';

import 'phosphor/styles/base.css';
import '../index.css';


/**
 * A widget which hosts a CodeMirror editor.
 */
class CodeMirrorWidget extends Widget {

  constructor(config?: CodeMirror.EditorConfiguration) {
    super();
    this.addClass('CodeMirrorWidget');
    this._editor = CodeMirror(this.node, config);
  }

  get editor(): CodeMirror.Editor {
    return this._editor;
  }

  loadTarget(target: string): void {
    let doc = this._editor.getDoc();
    let xhr = new XMLHttpRequest();
    xhr.open('GET', target);
    xhr.onreadystatechange = () => doc.setValue(xhr.responseText);
    xhr.send();
  }

  protected onAfterAttach(msg: Message): void {
    this._editor.refresh();
  }

  protected onResize(msg: ResizeMessage): void {
    if (msg.width < 0 || msg.height < 0) {
      this._editor.refresh();
    } else {
      this._editor.setSize(msg.width, msg.height);
    }
  }

  private _editor: CodeMirror.Editor;
}


/**
 * A widget which disposes itself when closed.
 *
 * By default, a widget will only remove itself from the hierarchy.
 */
class ContentWidget extends Widget {

  constructor(title: string) {
    super();
    this.addClass('content');
    this.addClass(title.toLowerCase());
    this.title.label = title;
    this.title.closable = true;
  }

  protected onCloseRequest(msg: Message): void {
    this.dispose();
  }
}


/**
 * A title generator function.
 */
let nextTitle = (() => {
  let i = 0;
  let titles = ['Red', 'Yellow', 'Green', 'Blue'];
  return () => titles[i++ % titles.length];
})();


/**
 * Add a new content widget the the given tab panel.
 */
function addContent(panel: TabPanel): void {
  let content = new ContentWidget(nextTitle());
  panel.addWidget(content);
}


/**
 * The main application entry point.
 */
function main(): void {
  let panel = new TabPanel();
  panel.id = 'main';
  panel.title.label = 'Demo';
  panel.tabsMovable = true;

  let btn = document.createElement('button');
  btn.textContent = 'Add New Tab';
  btn.onclick = () => addContent(panel);

  let demoArea = new Widget();
  demoArea.title.label = 'Demo';
  demoArea.node.appendChild(btn);

  let cmSource = new CodeMirrorWidget({
    mode: 'text/typescript',
    lineNumbers: true,
    tabSize: 2
  });
  cmSource.loadTarget('./index.ts');
  cmSource.title.label = 'Source';

  panel.addWidget(demoArea);
  panel.addWidget(cmSource);

  Widget.attach(panel, document.body);

  window.onresize = () => { panel.update(); };
}


window.onload = main;
