/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import ITab = phosphor.panels.ITab;
import Panel = phosphor.panels.Panel;
import Tab = phosphor.panels.Tab;
import TabPanel = phosphor.panels.TabPanel;


class Content extends Panel {

  constructor(title: string) {
    super();
    this.node.classList.add('content');
    this.node.classList.add(title.toLowerCase());
    this._tab = new Tab(title);
  }

  get tab(): ITab {
    return this._tab;
  }

  private _tab: Tab;
}


function main(): void {
  var tabs = new TabPanel();

  tabs.addPanel(new Content('Red'));
  tabs.addPanel(new Content('Yellow'));
  tabs.addPanel(new Content('Blue'));
  tabs.addPanel(new Content('Green'));

  tabs.attach(document.getElementById('main'));
  tabs.fit();

  window.onresize = () => tabs.fit();
}


window.onload = main;

} // module example
