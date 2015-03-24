/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import TabBar = phosphor.components.TabBar;

import render = phosphor.virtualdom.render;


function main(): void {
  var items = [
    { text: 'One', selected: true, closable: false },
    { text: 'Two', selected: false, closable: false },
    { text: 'Three', selected: false, closable: false },
    { text: 'Four', selected: false, closable: false },
    { text: 'Five', selected: false, closable: false },
    { text: 'Six', selected: false, closable: false },
    { text: 'Seven', selected: false, closable: false },
  ];
  render(TabBar({ items: items }), document.getElementById('main'));
}


window.onload = main;

} // module example
