/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import BoxLayout = phosphor.panels.BoxLayout;
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
  var ttbLayout = new BoxLayout(Direction.TopToBottom);
  ttbLayout.add(createContent('Top'));
  ttbLayout.add(createContent('To'));
  ttbLayout.add(createContent('Bottom'));
  ttbLayout.addStretch();

  var ttb = new Panel();
  ttb.node.classList.add('red');
  ttb.layout = ttbLayout;

  var bttLayout = new BoxLayout(Direction.BottomToTop);
  bttLayout.add(createContent('Top'));
  bttLayout.add(createContent('To'));
  bttLayout.add(createContent('Bottom'));
  bttLayout.addStretch();

  var btt = new Panel();
  btt.node.classList.add('green');
  btt.layout = bttLayout;

  var ltrLayout = new BoxLayout(Direction.LeftToRight);
  ltrLayout.add(createContent('Left'));
  ltrLayout.add(createContent('To'));
  ltrLayout.add(createContent('Right'));
  ltrLayout.addStretch();

  var ltr = new Panel();
  ltr.node.classList.add('yellow');
  ltr.layout = ltrLayout;

  var rtlLayout = new BoxLayout(Direction.RightToLeft);
  rtlLayout.add(createContent('Left'));
  rtlLayout.add(createContent('To'));
  rtlLayout.add(createContent('Right'));
  rtlLayout.addStretch();

  var rtl = new Panel();
  rtl.node.classList.add('blue');
  rtl.layout = rtlLayout;

  var rowLayout = new BoxLayout(Direction.LeftToRight);
  rowLayout.add(ttb);
  rowLayout.add(btt);

  var row = new Panel();
  row.layout = rowLayout;

  // var colLayout = new BoxLayout(Direction.TopToBottom);
  // colLayout.add(row);
  // colLayout.add(ltr);
  // colLayout.add(rtl);

  // var col = new Panel();
  // col.layout = colLayout;

  var col = row;
  col.attach(document.getElementById('main'));
  col.fit();
  (<any>window).col = col;
  window.onresize = () => col.fit();
}


window.onload = main;

} // module example
