/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import BoxPanel = phosphor.widgets.BoxPanel;
import Direction = phosphor.widgets.Direction;
import Widget = phosphor.widgets.Widget;


function createContent(text: string): Widget {
  var widget = new Widget();
  widget.node.classList.add('content');
  widget.node.innerHTML = '<span>' + text + '</span>';
  return widget;
}


function main(): void {
  var ttb = new BoxPanel(Direction.TopToBottom);
  ttb.node.classList.add('red');
  ttb.addWidget(createContent('Top'));
  ttb.addWidget(createContent('To'));
  ttb.addWidget(createContent('Bottom'));
  ttb.addStretch(0);

  var btt = new BoxPanel(Direction.BottomToTop);
  btt.node.classList.add('green');
  btt.addWidget(createContent('Top'));
  btt.addWidget(createContent('To'));
  btt.addWidget(createContent('Bottom'));
  btt.addStretch(0);

  var ltr = new BoxPanel(Direction.LeftToRight);
  ltr.node.classList.add('yellow');
  ltr.addWidget(createContent('Left'));
  ltr.addWidget(createContent('To'));
  ltr.addWidget(createContent('Right'));
  ltr.addStretch(0);

  var rtl = new BoxPanel(Direction.RightToLeft);
  rtl.node.classList.add('blue');
  rtl.addWidget(createContent('Left'));
  rtl.addWidget(createContent('To'));
  rtl.addWidget(createContent('Right'));
  rtl.addStretch(0);

  var row = new BoxPanel(Direction.LeftToRight);
  row.addWidget(ttb);
  row.addWidget(btt);

  var col = new BoxPanel(Direction.TopToBottom);
  col.addWidget(row);
  col.addWidget(ltr);
  col.addWidget(rtl);

  col.attach(document.getElementById('main'));
  col.fit();

  window.onresize = () => col.fit();
}


window.onload = main;

} // module example
