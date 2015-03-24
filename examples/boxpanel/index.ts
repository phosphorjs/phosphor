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
  ttb.addPanel(createContent('Top'));
  ttb.addPanel(createContent('To'));
  ttb.addPanel(createContent('Bottom'));
  ttb.addStretch();

  var btt = new BoxPanel(Direction.BottomToTop);
  btt.node.classList.add('green');
  btt.addPanel(createContent('Top'));
  btt.addPanel(createContent('To'));
  btt.addPanel(createContent('Bottom'));
  btt.addStretch();

  var ltr = new BoxPanel(Direction.LeftToRight);
  ltr.node.classList.add('yellow');
  ltr.addPanel(createContent('Left'));
  ltr.addPanel(createContent('To'));
  ltr.addPanel(createContent('Right'));
  ltr.addStretch();

  var rtl = new BoxPanel(Direction.RightToLeft);
  rtl.node.classList.add('blue');
  rtl.addPanel(createContent('Left'));
  rtl.addPanel(createContent('To'));
  rtl.addPanel(createContent('Right'));
  rtl.addStretch();

  var row = new BoxPanel(Direction.LeftToRight);
  row.addPanel(ttb);
  row.addPanel(btt);

  var col = new BoxPanel(Direction.TopToBottom);
  col.addPanel(row);
  col.addPanel(ltr);
  col.addPanel(rtl);

  col.attach(document.getElementById('main'));
  col.fit();

  window.onresize = () => col.fit();
}


window.onload = main;

} // module example
