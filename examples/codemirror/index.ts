/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import CodeMirrorFactory = phosphor.lib.codemirror.CodeMirrorFactory;
import CodeMirrorWidget = phosphor.lib.codemirror.CodeMirrorWidget;

import render = phosphor.virtualdom.render;


function main(): void {

  var cm1 = new CodeMirrorWidget({
    value: "var text = 'This is a CodeMirror widget.';",
    mode: 'javascript',
    lineNumbers: true,
    tabSize: 2,
  });

  var cm2 = CodeMirrorFactory({
    config: {
      value: "var text = 'This is a CodeMirror component.';",
      mode: 'javascript',
      lineNumbers: true,
      tabSize: 2,
    },
  });

  cm1.attach(document.getElementById('col-1'));
  cm1.fit();

  window.onresize = () => cm1.fit();

  render(cm2, document.getElementById('col-2'));
}


window.onload = main;

} // module example
