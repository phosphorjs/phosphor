/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import CodeMirrorFactory = phosphor.components.CodeMirrorFactory;

import render = phosphor.virtualdom.render;


function main(): void {
  var cm = CodeMirrorFactory({
    ref: 'cm',
    config: {
      value: "var text = 'This is CodeMirror.';",
      mode: 'javascript',
      lineNumbers: true,
      tabSize: 2,
    }
  });

  var refs = render(cm, document.getElementById('main'));
}

window.onload = main;

} // module example
