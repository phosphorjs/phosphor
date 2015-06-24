/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import IMessage = phosphor.core.IMessage;

import ResizeMessage = phosphor.widgets.ResizeMessage;
import Widget = phosphor.widgets.Widget;


class CodeMirrorWidget extends Widget {

  constructor(config?: CodeMirror.EditorConfiguration) {
    super();
    this.addClass('CodeMirrorWidget');
    this._editor = CodeMirror(this.node, config);
  }

  dispose(): void {
    this._editor = null;
    super.dispose();
  }

  get editor(): CodeMirror.Editor {
    return this._editor;
  }

  protected onAfterAttach(msg: IMessage): void {
    this._editor.refresh();
  }

  protected onResize(msg: ResizeMessage): void {
    this._editor.setSize(msg.width, msg.height);
  }

  private _editor: CodeMirror.Editor;
}


function main(): void {

  var cm = new CodeMirrorWidget({
    value: "var text = 'This is a CodeMirror widget.';",
    mode: 'javascript',
    lineNumbers: true,
    tabSize: 2,
    extraKeys: {"Ctrl-Space": "autocomplete"},
  });

  cm.attach(document.getElementById('main'));
  cm.fit();

  window.onresize = () => cm.fit();
}


window.onload = main;

} // module example
