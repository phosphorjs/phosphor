/*------------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|-----------------------------------------------------------------------------*/
import {
  VDOM
} from '@phosphor/vdom';

import {
  Widget
} from '@phosphor/widgets';


type TickData = {
  readonly title: string;
  readonly count: number;
}


const TickRow = (props: TickData) => {
  return (
    <tr>
      <td>{props.title}</td>
      <td>{props.count}</td>
    </tr>
  );
};


class TimeWidget extends Widget {

  constructor() {
    super();
    this.addClass('TimeWidget');
  }

  protected onBeforeAttach(): void {
    setInterval(() => this._tick(), 30);
  }

  protected onUpdateRequest(): void {
    VDOM.render(this.render(), this.node);
  }

  protected render() {
    let time = this._time;
    let now = this._now;
    return (
      <div>
        <h1>This page is updated every 30ms</h1>
        <h2>
          <span>UTC Time: </span>
          <span>{time.toUTCString()}</span>
        </h2>
        <h2>
          <span>Local Time: </span>
          <span>{time.toString()}</span>
        </h2>
        <h2>
          <span>Milliseconds Since Epoch: </span>
          <span>{now.toString()}</span>
        </h2>
        <table>
          <TickRow title='Hours' count={time.getHours()} />
          <TickRow title='Minutes' count={time.getMinutes()} />
          <TickRow title='Seconds' count={time.getSeconds()} />
        </table>
      </div>
    );
  }

  private _tick(): void {
    this._time = new Date();
    this._now = Date.now();
    this.update();
  }

  private _time = new Date();
  private _now = Date.now();
}


function main(): void {
  Widget.attach(new TimeWidget(), document.body);
}


window.onload = main;
