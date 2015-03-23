/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import BoxPanel = phosphor.panels.BoxPanel;
import Direction = phosphor.panels.Direction;
import Panel = phosphor.panels.Panel;


function createContent(text: string): Panel {
  var panel = new Panel();
  panel.node.classList.add('content');
  panel.node.innerHTML = '<span>' + text + '</span>';
  panel.setMinMaxSize(60, 25, Infinity, 25);
  return panel;
}


function main(): void {
  var ttb = new BoxPanel(Direction.TopToBottom);
  ttb.node.classList.add('red');
  ttb.add(createContent('Top'));
  ttb.add(createContent('To'));
  ttb.add(createContent('Bottom'));
  ttb.addStretch();

  var btt = new BoxPanel(Direction.BottomToTop);
  btt.node.classList.add('green');
  btt.add(createContent('Top'));
  btt.add(createContent('To'));
  btt.add(createContent('Bottom'));
  btt.addStretch();

  var ltr = new BoxPanel(Direction.LeftToRight);
  ltr.node.classList.add('yellow');
  ltr.add(createContent('Left'));
  ltr.add(createContent('To'));
  ltr.add(createContent('Right'));
  ltr.addStretch();

  var rtl = new BoxPanel(Direction.RightToLeft);
  rtl.node.classList.add('blue');
  rtl.add(createContent('Left'));
  rtl.add(createContent('To'));
  rtl.add(createContent('Right'));
  rtl.addStretch();

  var row = new BoxPanel(Direction.LeftToRight);
  row.add(ttb);
  row.add(btt);

  var col = new BoxPanel(Direction.TopToBottom);
  col.add(row);
  col.add(ltr);
  col.add(rtl);

  col.attach(document.getElementById('main'));
  col.fit();

  window.onresize = () => col.fit();
}


window.onload = main;

} // module example
