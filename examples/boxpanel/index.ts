/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import clientViewportRect = phosphor.utility.clientViewportRect;

import BoxPanel = phosphor.widgets.BoxPanel;
import Direction = phosphor.widgets.Direction;
import Widget = phosphor.widgets.Widget;


function createContent(name: string): Widget {
  var widget = new Widget();
  widget.addClass('content');
  widget.addClass(name);
  return widget;
}


function main(): void {
  var red = createContent('red');
  var green = createContent('green');
  var blue = createContent('blue');
  var yellow = createContent('yellow');

  var panel = new BoxPanel();
  panel.addWidget(red, 1);
  panel.addWidget(green, 2);
  panel.addWidget(blue, 3);
  panel.addWidget(yellow, 1);

  panel.attach(document.getElementById('main'));

  var refresh = () => {
    if (clientViewportRect().width > 600) {
      panel.direction = Direction.LeftToRight;
    } else {
      panel.direction = Direction.TopToBottom;
    }
    panel.fit();
  };

  refresh();
  window.onresize = refresh;
}


window.onload = main;

} // module example
