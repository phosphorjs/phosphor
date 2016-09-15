/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  DockPanel
} from '../../lib/ui/dockpanel';

import {
  Widget
} from '../../lib/ui/widget';

import '../../styles/base.css';

import '../index.css';



/**
 * Create a placeholder content widget.
 */
function createContent(title: string): Widget {
  let widget = new Widget();
  widget.addClass('content');
  widget.addClass(title.toLowerCase());

  widget.title.label = title;
  widget.title.closable = true;

  return widget;
}


/**
 * The main application entry point.
 */
function main(): void {
  let r1 = createContent('Red');
  let r2 = createContent('Red');
  let r3 = createContent('Red');

  let b1 = createContent('Blue');
  let b2 = createContent('Blue');

  let g1 = createContent('Green');
  let g2 = createContent('Green');
  let g3 = createContent('Green');

  let y1 = createContent('Yellow');
  let y2 = createContent('Yellow');

  let panel = new DockPanel();
  panel.id = 'main';

  panel.addWidget(b1);
  panel.addWidget(y1, { ref: b1, mode: 'split-bottom' });
  panel.addWidget(g1, { ref: y1, mode: 'split-left' });

  panel.addWidget(b2, { mode: 'split-bottom' });

  panel.addWidget(r1, { ref: g1, mode: 'tab-after' });
  panel.addWidget(g2, { ref: b2, mode: 'tab-before' });
  panel.addWidget(y2, { ref: g2, mode: 'tab-before' });
  panel.addWidget(g3, { ref: y2, mode: 'tab-before' });
  panel.addWidget(r2, { ref: b1, mode: 'tab-before' });
  panel.addWidget(r3, { ref: y1, mode: 'tab-before' });

  Widget.attach(panel, document.body);

  window.onresize = () => { panel.update(); };
}


window.onload = main;
