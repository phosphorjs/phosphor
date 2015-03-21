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
import TabWidget = phosphor.widgets.TabWidget;
import Widget = phosphor.widgets.Widget;


class Content extends Widget {

  constructor(title: string) {
    super();
    this.classList.add('content');
    this.classList.add(title.toLowerCase());
    this._tab = new Tab(title);
  }

  get tab(): ITab {
    return this._tab;
  }

  private _tab: Tab;
}


function main(): void {
  var tw = new TabWidget();

  tw.addWidget(new Content('Red'));
  tw.addWidget(new Content('Yellow'));
  tw.addWidget(new Content('Blue'));
  tw.addWidget(new Content('Green'));

  tw.attach(document.getElementById('main'));
  tw.fitToHost();

  window.onresize = () => tw.fitToHost();
}


window.onload = main;

} // module example
