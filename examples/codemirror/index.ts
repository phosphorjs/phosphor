/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import CodeMirrorWidget = phosphor.lib.CodeMirrorWidget;

import render = phosphor.virtualdom.render;


function main(): void {
  var cm = new CodeMirrorWidget({
    value: "var text = 'This is a CodeMirror widget.';",
    mode: 'javascript',
    lineNumbers: true,
    tabSize: 2,
  });

  cm.attach(document.getElementById('main'));
  cm.fit();

  window.onresize = () => cm.fit();
}


window.onload = main;

} // module example
