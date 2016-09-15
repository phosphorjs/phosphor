/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

import {
  Message
} from '../../lib/core/messaging';

import {
  TabPanel
} from '../../lib/ui/tabpanel';

import {
  Widget
} from '../../lib/ui/widget';

import '../../styles/base.css';

import '../index.css';


/**
 * A widget which disposes itself when closed.
 *
 * By default, a widget will only remove itself from the hierarchy.
 */
class ContentWidget extends Widget {

  constructor(title: string) {
    super();
    this.addClass('content');
    this.addClass(title.toLowerCase());
    this.title.label = title;
    this.title.closable = true;
  }

  protected onCloseRequest(msg: Message): void {
    this.dispose();
  }
}


/**
 * A title generator function.
 */
let nextTitle = (() => {
  let i = 0;
  let titles = ['Red', 'Yellow', 'Green', 'Blue'];
  return () => titles[i++ % titles.length];
})();


/**
 * Add a new content widget the the given tab panel.
 */
function addContent(panel: TabPanel): void {
  let content = new ContentWidget(nextTitle());
  panel.addWidget(content);
}


/**
 * The main application entry point.
 */
function main(): void {
  let panel = new TabPanel();
  panel.id = 'main';
  panel.title.label = 'Demo';
  panel.tabsMovable = true;

  let btn = document.createElement('button');
  btn.textContent = 'Add New Tab';
  btn.onclick = () => addContent(panel);

  let demoArea = new Widget();
  demoArea.title.label = 'Demo';
  demoArea.node.appendChild(btn);

  panel.addWidget(demoArea);

  Widget.attach(panel, document.body);

  window.onresize = () => { panel.update(); };
}


window.onload = main;
