/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import DockMode = phosphor.enums.DockMode;

import DockArea = phosphor.widgets.DockArea;
import ITab = phosphor.widgets.ITab;
import Tab = phosphor.widgets.Tab;
import Widget = phosphor.widgets.Widget;


class Content extends Widget {

  constructor(title: string) {
    super();
    this.classList.add('content');
    this.classList.add(title.toLowerCase());
    this.minWidth = 50;
    this.minHeight = 50;
    this._tab = new Tab(title);
    this._tab.closable = true;
  }

  get tab(): ITab {
    return this._tab;
  }

  private _tab: Tab;
}


function main(): void {
  var area = new DockArea();

  var r1 = new Content('Red');
  var r2 = new Content('Red');
  var r3 = new Content('Red');

  var b1 = new Content('Blue');
  var b2 = new Content('Blue');
  var b3 = new Content('Blue');

  var g1 = new Content('Green');
  var g2 = new Content('Green');
  var g3 = new Content('Green');

  var y1 = new Content('Yellow');
  var y2 = new Content('Yellow');
  var y3 = new Content('Yellow');

  area.addWidget(r1);

  area.addWidget(b1, DockMode.SplitRight, r1);
  area.addWidget(y1, DockMode.SplitBottom, b1);
  area.addWidget(g1, DockMode.SplitLeft, y1);

  area.addWidget(b2, DockMode.Bottom);

  area.addWidget(y2, DockMode.TabBefore, r1);
  area.addWidget(b3, DockMode.TabBefore, y2);
  area.addWidget(g2, DockMode.TabBefore, b2);
  area.addWidget(y3, DockMode.TabBefore, g2);
  area.addWidget(g3, DockMode.TabBefore, y3);
  area.addWidget(r2, DockMode.TabBefore, b1);
  area.addWidget(r3, DockMode.TabBefore, y1);

  area.attach(document.getElementById('main'));
  area.fitToHost();

  window.onresize = () => area.fitToHost();
}


window.onload = main;

} // module example
