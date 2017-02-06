/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  BoxPanel
} from '../../lib/ui/boxpanel';

import {
  Widget
} from '../../lib/ui/widget';

import '../../styles/base.css';

import '../index.css';


function main(): void {
  let red = new Widget();
  red.addClass('red');

  let yellow = new Widget();
  yellow.addClass('yellow');

  let green = new Widget();
  green.addClass('green');

  let blue = new Widget();
  blue.addClass('blue');

  let panel = new BoxPanel();
  panel.id = 'main';

  panel.addWidget(red);
  panel.addWidget(yellow);
  panel.addWidget(green);
  panel.addWidget(blue);

  window.onresize = () => { panel.update(); };

  Widget.attach(panel, document.body);
}


window.onload = main;
