/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  Message
} from '../../lib/core/messaging';

import {
  Panel
} from '../../lib/ui/panel';

import {
  SplitPanel
} from '../../lib/ui/splitpanel';

import {
  TabPanel
} from '../../lib/ui/tabpanel';

import {
  ResizeMessage, Widget
} from '../../lib/ui/widget';

import '../../styles/base.css';

import '../index.css';

import './index.css';


/**
 * A widget which uses CSS flexbox to layout its children.
 */
class MyVBox extends Panel {

  constructor() {
    super();
    this.addClass('my-vbox');
  }
}


/**
 * A widget which logs its resize messages.
 */
class MyResizeWidget extends Widget {
  // All widgets will receive a resize message when their parent
  // determines that they have likely been resized. If the current
  // size of the widget is known, it will be passed as part of the
  // message. Otherwise, the size parameters will be `-1`, and the
  // the node will need to be measured to get the current size.
  //
  // The current size will typically be known when the parent of
  // the widget is an absolute Phosphor layout panel, and will be
  // unknown when the parent is a widget which uses CSS to layout
  // its children.
  protected onResize(msg: ResizeMessage): void {
    let w = msg.width;
    let h = msg.height;
    console.log(this.node.className, 'width:', w, 'height:', h);
  }
}


/**
 * Create a placeholder content widget.
 */
function createContent(name: string): Widget {
  let widget = new MyResizeWidget();
  widget.addClass('content');
  widget.addClass(name);
  return widget;
}


/**
 * The main application entry point.
 */
function main(): void {
  let red = createContent('red');
  let yellow = createContent('yellow');
  let green = createContent('green');

  let blue1 = createContent('blue');
  let blue2 = createContent('blue');
  let blue3 = createContent('blue');
  let blue4 = createContent('blue');

  let split = new SplitPanel();
  split.addWidget(blue1);
  split.addWidget(blue2);
  split.addWidget(blue3);
  split.addWidget(blue4);

  let box = new MyVBox();
  box.addWidget(red);
  box.addWidget(split);
  box.addWidget(yellow);
  box.addWidget(green);
  box.title.label = 'Demo';


  let panel = new TabPanel();
  panel.id = 'main';
  panel.addWidget(box);

  Widget.attach(panel, document.body);

  window.onresize = () => { panel.update(); };
}


window.onload = main;
