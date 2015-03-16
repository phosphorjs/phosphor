/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Direction = phosphor.enums.Direction;

import BoxLayout = phosphor.layout.BoxLayout;

import Widget = phosphor.widgets.Widget;


function createContentWidget(text: string): Widget {
  var w = new Widget();
  w.classList.add('content');
  w.minHeight = 25;
  w.maxHeight = 25;
  w.minWidth = 50;
  w.node.innerHTML = '<span>' + text + '</span>';
  return w;
}


function main(): void {
  var ttbLayout = new BoxLayout(Direction.TopToBottom);
  ttbLayout.addWidget(createContentWidget('Top'));
  ttbLayout.addWidget(createContentWidget('To'));
  ttbLayout.addWidget(createContentWidget('Bottom'));
  ttbLayout.addStretch();

  var ttb = new Widget();
  ttb.classList.add('red');
  ttb.layout = ttbLayout;

  var bttLayout = new BoxLayout(Direction.BottomToTop);
  bttLayout.addWidget(createContentWidget('Top'));
  bttLayout.addWidget(createContentWidget('To'));
  bttLayout.addWidget(createContentWidget('Bottom'));
  bttLayout.addStretch();

  var btt = new Widget();
  btt.classList.add('green');
  btt.layout = bttLayout;

  var ltrLayout = new BoxLayout(Direction.LeftToRight);
  ltrLayout.addWidget(createContentWidget('Left'));
  ltrLayout.addWidget(createContentWidget('To'));
  ltrLayout.addWidget(createContentWidget('Right'));
  ltrLayout.addStretch();

  var ltr = new Widget();
  ltr.classList.add('yellow');
  ltr.layout = ltrLayout;

  var rtlLayout = new BoxLayout(Direction.RightToLeft);
  rtlLayout.addWidget(createContentWidget('Left'));
  rtlLayout.addWidget(createContentWidget('To'));
  rtlLayout.addWidget(createContentWidget('Right'));
  rtlLayout.addStretch();

  var rtl = new Widget();
  rtl.classList.add('blue');
  rtl.layout = rtlLayout;

  var rowLayout = new BoxLayout(Direction.LeftToRight);
  rowLayout.addWidget(ttb);
  rowLayout.addWidget(btt);

  var row = new Widget();
  row.layout = rowLayout;

  var colLayout = new BoxLayout(Direction.TopToBottom);
  colLayout.addWidget(row);
  colLayout.addWidget(ltr);
  colLayout.addWidget(rtl);

  var col = new Widget();
  col.layout = colLayout;

  col.attach(document.getElementById('main'));
  col.fitToHost();

  window.onresize = () => col.fitToHost();
}


window.onload = main;

} // module example
