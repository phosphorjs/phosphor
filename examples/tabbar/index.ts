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
    { id: '1', text: 'One', selected: true },
    { id: '2', text: 'Two' },
    { id: '3', text: 'Three' },
    { id: '4', text: 'Four' },
    { id: '5', text: 'Five' },
    { id: '6', text: 'Six' },
    { id: '7', text: 'Seven' },
  ];
  var host = document.getElementById('main');
  render(TabBar({ items: items, tabsMovable: true }), host);
}


window.onload = main;

} // module example
