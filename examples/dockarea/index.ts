/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import DockArea = phosphor.panels.DockArea;
import DockMode = phosphor.panels.DockMode;
import ITab = phosphor.panels.ITab;
import Panel = phosphor.panels.Panel;
import Tab = phosphor.panels.Tab;


class Content extends Panel {

  constructor(title: string) {
    super();
    this.node.classList.add('content');
    this.node.classList.add(title.toLowerCase());
    this.setMinSize(50, 50);
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

  area.addPanel(r1);

  area.addPanel(b1, DockMode.SplitRight, r1);
  area.addPanel(y1, DockMode.SplitBottom, b1);
  area.addPanel(g1, DockMode.SplitLeft, y1);

  area.addPanel(b2, DockMode.Bottom);

  area.addPanel(y2, DockMode.TabBefore, r1);
  area.addPanel(b3, DockMode.TabBefore, y2);
  area.addPanel(g2, DockMode.TabBefore, b2);
  area.addPanel(y3, DockMode.TabBefore, g2);
  area.addPanel(g3, DockMode.TabBefore, y3);
  area.addPanel(r2, DockMode.TabBefore, b1);
  area.addPanel(r3, DockMode.TabBefore, y1);

  area.attach(document.getElementById('main'));
  area.fit();

  window.onresize = () => area.fit();
}


window.onload = main;

} // module example
