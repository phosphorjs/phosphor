/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Orientation = phosphor.enums.Orientation;

import ITab = phosphor.widgets.ITab;
import Splitter = phosphor.widgets.Splitter;
import Tab = phosphor.widgets.Tab;
import TabWidget = phosphor.widgets.TabWidget;
import Widget = phosphor.widgets.Widget;


class Content extends Widget {

  constructor(title: string) {
    super();
    this.classList.add('content');
    this.classList.add(title.toLowerCase());
    this.minWidth = 50;
    this.minHeight = 50;
    this._m_tab = new Tab(title);
  }

  get tab(): ITab {
    return this._m_tab;
  }

  private _m_tab: Tab;
}


function createTabWidget(index: number): TabWidget {
  var tw = new TabWidget();
  tw.addWidget(new Content('Red'));
  tw.addWidget(new Content('Yellow'));
  tw.addWidget(new Content('Blue'));
  tw.addWidget(new Content('Green'));
  tw.currentIndex = index;
  return tw;
}


function main(): void {
  var sp1 = new Splitter(Orientation.Horizontal);
  var sp2 = new Splitter(Orientation.Vertical);
  var sp3 = new Splitter(Orientation.Vertical);

  sp2.addWidget(createTabWidget(0));
  sp2.addWidget(createTabWidget(1));

  sp3.addWidget(createTabWidget(2));
  sp3.addWidget(createTabWidget(3));

  sp1.addWidget(sp2);
  sp1.addWidget(sp3);

  sp1.attach(document.getElementById('main'));
  sp1.fitToHost();

  window.onresize = () => sp1.fitToHost();
}


window.onload = main;

} // module example
