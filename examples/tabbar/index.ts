/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import TabBar = phosphor.widgets.TabBar;


function main(): void {
  var tb = new TabBar();
  tb.minTabWidth = 100;

  tb.addTab('One');
  tb.addTab('Two');
  tb.addTab('Three');
  tb.addTab('Four');
  tb.addTab('Five');
  tb.addTab('Six');
  tb.addTab('Seven');

  tb.attach(document.getElementById('main'));
  tb.fitToHost();

  window.onresize = () => tb.fitToHost();
}


window.onload = main;

} // module example
