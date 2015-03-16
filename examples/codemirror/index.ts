/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import CodeMirrorWidget = phosphor.widgets.CodeMirrorWidget;


function main(): void {
  var widget = new CodeMirrorWidget({
    value: "var text = 'This is CodeMirror.';",
    mode: 'javascript',
    lineNumbers: true,
    tabSize: 2,
  });

  widget.attach(document.getElementById('main'));
  widget.fitToHost();

  window.onresize = () => widget.fitToHost();
}


window.onload = main;

} // module example
