/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import ITab = phosphor.widgets.ITab;
import Orientation = phosphor.widgets.Orientation;
import SplitPanel = phosphor.widgets.SplitPanel;
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


function createTabs(index: number): TabPanel {
  var tabs = new TabPanel();
  tabs.tabBar.tabOverlap = 1;
  tabs.addWidget(new Content('Red'));
  tabs.addWidget(new Content('Yellow'));
  tabs.addWidget(new Content('Blue'));
  tabs.addWidget(new Content('Green'));
  tabs.currentIndex = index;
  return tabs;
}


function main(): void {
  var sp1 = new SplitPanel(Orientation.Horizontal);
  var sp2 = new SplitPanel(Orientation.Vertical);
  var sp3 = new SplitPanel(Orientation.Vertical);

  sp2.addWidget(createTabs(0));
  sp2.addWidget(createTabs(1));

  sp3.addWidget(createTabs(2));
  sp3.addWidget(createTabs(3));

  sp1.addWidget(sp2);
  sp1.addWidget(sp3);

  sp1.attach(document.getElementById('main'));
  sp1.fit();

  window.onresize = () => sp1.fit();
}


window.onload = main;

} // module example
