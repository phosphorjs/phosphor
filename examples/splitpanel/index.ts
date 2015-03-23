/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Orientation = phosphor.panels.Orientation;
import Panel = phosphor.panels.Panel;
import SplitPanel = phosphor.panels.SplitPanel;


function createContent(name: string): Panel {
  var panel = new Panel();
  panel.node.classList.add(name);
  panel.setMinSize(50, 50);
  return panel;
}


function main(): void {
  var sp1 = new SplitPanel(Orientation.Vertical);
  var sp2 = new SplitPanel(Orientation.Horizontal);
  var sp3 = new SplitPanel(Orientation.Vertical);

  sp3.add(createContent('red'));
  sp3.add(createContent('green'));
  sp3.add(createContent('blue'));

  sp2.add(sp3);
  sp2.add(createContent('yellow'));
  sp2.add(createContent('red'));

  sp1.add(createContent('yellow'));
  sp1.add(createContent('blue'));
  sp1.add(sp2);
  sp1.add(createContent('green'));

  sp1.attach(document.getElementById('main'));
  sp1.fit();

  window.onresize = () => sp1.fit();
}

window.onload = main;

} // module example
