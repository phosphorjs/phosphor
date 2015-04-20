/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Orientation = phosphor.widgets.Orientation;
import SplitPanel = phosphor.widgets.SplitPanel;
import Widget = phosphor.widgets.Widget;


function createContent(name: string): Widget {
  var widget = new Widget();
  widget.node.classList.add('content');
  widget.node.classList.add(name);
  return widget;
}


function main(): void {
  var sp1 = new SplitPanel(Orientation.Vertical);
  var sp2 = new SplitPanel(Orientation.Horizontal);
  var sp3 = new SplitPanel(Orientation.Vertical);

  sp3.addWidget(createContent('red'));
  sp3.addWidget(createContent('green'));
  sp3.addWidget(createContent('blue'));

  sp2.addWidget(sp3);
  sp2.addWidget(createContent('yellow'));
  sp2.addWidget(createContent('red'));

  sp1.addWidget(createContent('yellow'));
  sp1.addWidget(createContent('blue'));
  sp1.addWidget(sp2);
  sp1.addWidget(createContent('green'));

  sp1.attach(document.getElementById('main'));
  sp1.fit();

  window.onresize = () => sp1.fit();
}


window.onload = main;

} // module example
