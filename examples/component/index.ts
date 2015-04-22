/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module example {

import Component = phosphor.virtualdom.Component;
import Elem = phosphor.virtualdom.Elem;
import IData = phosphor.virtualdom.IData;
import createFactory = phosphor.virtualdom.createFactory;
import dom = phosphor.virtualdom.dom;
import render = phosphor.virtualdom.render;


var div = dom.div;
var h1 = dom.h1;
var h2 = dom.h2;
var li = dom.li;
var span = dom.span;


interface ITicksData extends IData {
  title: string;
  count: number;
}


class TicksComponent extends Component<ITicksData> {

  static tagName = 'ul';

  protected render(): Elem[] {
    var data = this.data;
    var items = [li(data.title)];
    for (var i = 0, n = data.count; i <= n; ++i) {
      items.push(li(i +''));
    }
    return items;
  }
}

var Ticks = createFactory(TicksComponent);


interface ITimeData extends IData {
  time: Date;
  now: number;
}


class TimeComponent extends Component<ITimeData> {

  static className = 'TimeComponent';

  protected render(): Elem[] {
    var data = this.data;
    var time = data.time;
    var now = data.now;
    return [
      h1('This page is updated every 30ms'),
      h2('UTC Time: ', span(time.toUTCString())),
      h2('Local Time: ', span(time.toString())),
      h2('Milliseconds Since Epoch: ', span(now.toString())),
      div({ className: 'waterfall' },
        Ticks({ title: 'Hours', count: time.getHours() }),
        Ticks({ title: 'Minutes', count: time.getMinutes() }),
        Ticks({ title: 'Seconds', count: time.getSeconds() })
      )
    ];
  }
}

var Time = createFactory(TimeComponent);


function main(): void {
  var main = document.getElementById('main');
  setInterval(() => {
    var time = new Date();
    var now = Date.now();
    render(Time({ time: time, now: now }), main);
  }, 30);
}


window.onload = main;

} // module example
