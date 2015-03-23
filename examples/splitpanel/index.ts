/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Orientation = phosphor.enums.Orientation;

import Splitter = phosphor.widgets.Splitter;
import Widget = phosphor.widgets.Widget;


function createContentWidget(name: string): Widget {
  var w = new Widget();
  w.classList.add(name);
  w.minWidth = 50;
  w.minHeight = 50;
  return w;
}


function main(): void {
  var sp1 = new Splitter(Orientation.Vertical);
  var sp2 = new Splitter(Orientation.Horizontal);
  var sp3 = new Splitter(Orientation.Vertical);

  sp3.addWidget(createContentWidget('red'));
  sp3.addWidget(createContentWidget('green'));
  sp3.addWidget(createContentWidget('blue'));

  sp2.addWidget(sp3);
  sp2.addWidget(createContentWidget('yellow'));
  sp2.addWidget(createContentWidget('red'));

  sp1.addWidget(createContentWidget('yellow'));
  sp1.addWidget(createContentWidget('blue'));
  sp1.addWidget(sp2);
  sp1.addWidget(createContentWidget('green'));

  sp1.attach(document.getElementById('main'));
  sp1.fitToHost();

  window.onresize = () => sp1.fitToHost();
}

window.onload = main;

} // module example
