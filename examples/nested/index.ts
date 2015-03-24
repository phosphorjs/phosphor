/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import ITab = phosphor.panels.ITab;
import Orientation = phosphor.panels.Orientation;
import Panel = phosphor.panels.Panel;
import SplitPanel = phosphor.panels.SplitPanel;
import Tab = phosphor.panels.Tab;
import TabPanel = phosphor.panels.TabPanel;


class Content extends Panel {

  constructor(title: string) {
    super();
    this.node.classList.add('content');
    this.node.classList.add(title.toLowerCase());
    this.setMinSize(50, 50);
    this._tab = new Tab(title);
  }

  get tab(): ITab {
    return this._tab;
  }

  private _tab: Tab;
}


function createTabs(index: number): TabPanel {
  var tabs = new TabPanel();
  tabs.addPanel(new Content('Red'));
  tabs.addPanel(new Content('Yellow'));
  tabs.addPanel(new Content('Blue'));
  tabs.addPanel(new Content('Green'));
  tabs.currentIndex = index;
  return tabs;
}


function main(): void {
  var sp1 = new SplitPanel(Orientation.Horizontal);
  var sp2 = new SplitPanel(Orientation.Vertical);
  var sp3 = new SplitPanel(Orientation.Vertical);

  sp2.addPanel(createTabs(0));
  sp2.addPanel(createTabs(1));

  sp3.addPanel(createTabs(2));
  sp3.addPanel(createTabs(3));

  sp1.addPanel(sp2);
  sp1.addPanel(sp3);

  sp1.attach(document.getElementById('main'));
  sp1.fit();

  window.onresize = () => sp1.fit();
}


window.onload = main;

} // module example
