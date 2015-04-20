/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import ITab = phosphor.widgets.ITab;
import Tab = phosphor.widgets.Tab;
import TabPanel = phosphor.widgets.TabPanel;
import Widget = phosphor.widgets.Widget;


class Content extends Widget {

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
  tabs.tabBar.tabOverlap = 1;

  tabs.addWidget(new Content('Red'));
  tabs.addWidget(new Content('Yellow'));
  tabs.addWidget(new Content('Blue'));
  tabs.addWidget(new Content('Green'));

  tabs.attach(document.getElementById('main'));
  tabs.fit();

  window.onresize = () => tabs.fit();
}


window.onload = main;

} // module example
