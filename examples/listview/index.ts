/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import ListView = phosphor.widgets.ListView;


class MyListView extends ListView {

  refresh(num: number): void {
    this.removeRows(0, this.rowCount);
    var min = Math.floor(Math.max(10, num * 0.001));
    while (num > 0) {
      var count = Math.max(1, Math.min(min, Math.floor(Math.random() * num)));
      var index = Math.random() * this.rowCount;
      var size = Math.random() * 100 + 20
      this.insertRows(Math.floor(index), count, Math.floor(size));
      num -= count;
    }
  }

  protected renderRow(index: number, host: HTMLElement): void {
    host.textContent = 'row: ' + index;
  }
}


function main(): void {

  var list = new MyListView();

  list.attach(document.getElementById('main'));
  list.fit();

  window.onresize = () => list.fit();

  var input = <HTMLInputElement>document.getElementById('row-input');

  var refresh = () => {
    var count = parseInt(input.value);
    if (isNaN(count) || count < 0) {
      count = 100;
    }
    input.value = count + '';
    list.refresh(count);
  };

  input.onchange = refresh;

  refresh();
}


window.onload = main;

} // module example
