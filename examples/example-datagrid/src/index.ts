/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import 'es6-promise/auto';  // polyfill Promise on IE

import {
  DataGrid, DataModel, TextRenderer
} from '@phosphor/datagrid';

import {
  DockPanel, StackedPanel, Widget
} from '@phosphor/widgets';

import '../style/index.css';


class LargeDataModel extends DataModel {

  readonly rowCount = 100000000000;
  readonly columnCount = 100000000000;
  readonly rowHeaderCount = 3;
  readonly columnHeaderCount = 3;

  data(row: number, column: number): any {
    if (column < 0 && row >= 0) {
      return `R: ${row}, ${column}`;
    }
    if (row < 0 && column >= 0) {
      return `C: ${row}, ${column}`;
    }
    if (row < 0 && column < 0) {
      return `N: ${row}, ${column}`;
    }
    return `(${row}, ${column})`;
  }
}


class RandomDataModel extends DataModel {

  static genPoint(): number {
    return Math.random() * 10 - 2;
  }

  readonly rowCount = 80;
  readonly columnCount = 80;
  readonly rowHeaderCount = 1;
  readonly columnHeaderCount = 1;

  constructor() {
    super();
    for (let i = 0, n = this.rowCount * this.columnCount; i < n; ++i) {
      this._data[i] = i / n;
    }
    setInterval(this._tick, 30);
  }

  data(row: number, column: number): any {
    if (row < 0 && column < 0) {
      return `Corner`;
    }
    if (row < 0) {
      return `C: ${column}`;
    }
    if (column < 0) {
      return `R: ${row}`;
    }
    return this._data[row * this.columnCount + column];
  }

  private _tick = () => {
    let i = Math.floor(Math.random() * (this.rowCount * this.columnCount - 1));
    let r = Math.floor(i / this.columnCount);
    let c = i - r * this.columnCount;
    this._data[i] = (this._data[i] + 0.1) % 1;
    this.emitChanged({
      type: 'cells-changed',
      rowIndex: r,
      columnIndex: c,
      rowSpan: 1,
      columnSpan: 1
    });
  };

  private _data: number[] = [];
}


const formatDecimal: TextRenderer.CellFunc<string> = config => {
  return config.value.toFixed(2);
};


const heatMapJet: TextRenderer.CellFunc<string> = config => {
  let value = config.value * 2 - 1;
  let r = Math.floor(Jet.red(value) * 255);
  let g = Math.floor(Jet.green(value) * 255);
  let b = Math.floor(Jet.blue(value) * 255);
  return `rgb(${r}, ${g}, ${b})`;
};


namespace Jet {
  export
  function red(gray: number): number {
    return base(gray - 0.5);
  }

  export
  function green(gray: number): number {
    return base(gray);
  }

  export
  function blue(gray: number): number {
    return base(gray + 0.5);
  }

  function interpolate(val: number, y0: number, x0: number, y1: number, x1: number): number {
    return (val - x0) * (y1 - y0) / (x1 - x0) + y0;
  }

  function base(val: number): number {
    if (val <= -0.75) {
      return 0;
    }
    if ( val <= -0.25 ) {
      return interpolate(val, 0.0, -0.75, 1.0, -0.25);
    }
    if ( val <= 0.25 ) {
      return 1.0;
    }
    if ( val <= 0.75 ) {
      return interpolate(val, 1.0, 0.25, 0.0, 0.75);
    }
    return 0.0;
  }
}


function createWrapper(content: Widget, title: string): Widget {
  let wrapper = new StackedPanel();
  wrapper.addClass('content-wrapper');
  wrapper.addWidget(content);
  wrapper.title.label = title;
  return wrapper;
}


function main(): void {

  let model1 = new LargeDataModel();
  let model2 = new LargeDataModel();
  let model3 = new RandomDataModel();
  let model4 = new RandomDataModel();

  let blueStripeStyle: DataGrid.IStyle = {
    ...DataGrid.defaultStyle,
    rowBackgroundColor: i => i % 2 === 0 ? 'rgba(138, 172, 200, 0.3)' : '',
    columnBackgroundColor: i => i % 2 === 0 ? 'rgba(100, 100, 100, 0.1)' : ''
  };

  let brownStripeStyle: DataGrid.IStyle = {
    ...DataGrid.defaultStyle,
    rowBackgroundColor: i => i % 2 === 0 ? 'rgba(204, 156, 0, 0.2)' : '',
    columnBackgroundColor: i => i % 2 === 0 ? 'rgba(153, 135, 77, 0.2)' : ''
  };

  let fgColorFloatRenderer = new TextRenderer({
    font: 'bold 12px sans-serif',
    textColor: heatMapJet,
    formatter: formatDecimal,
    horizontalAlignment: 'right'
  });

  let bgColorFloatRenderer = new TextRenderer({
    backgroundColor: heatMapJet,
    formatter: formatDecimal,
    horizontalAlignment: 'right'
  });

  let grid1 = new DataGrid({ style: blueStripeStyle });
  grid1.model = model1;

  let grid2 = new DataGrid({ style: brownStripeStyle });
  grid2.model = model2;

  let grid3 = new DataGrid();
  grid3.setCellRenderer({ region: 'body' }, fgColorFloatRenderer);
  grid3.model = model3;

  let grid4 = new DataGrid();
  grid4.setCellRenderer({ region: 'body' }, bgColorFloatRenderer);
  grid4.model = model4;

  let wrapper1 = createWrapper(grid1, 'Large Data 1');
  let wrapper2 = createWrapper(grid2, 'Large Data 2');
  let wrapper3 = createWrapper(grid3, 'Random Data 1');
  let wrapper4 = createWrapper(grid4, 'Random Data 2');

  let dock = new DockPanel();
  dock.id = 'dock';

  dock.addWidget(wrapper1);
  dock.addWidget(wrapper2, { mode: 'split-right', ref: wrapper1 });
  dock.addWidget(wrapper3, { mode: 'split-bottom', ref: wrapper1 });
  dock.addWidget(wrapper4, { mode: 'split-bottom', ref: wrapper2 });

  window.onresize = () => { dock.update(); };

  Widget.attach(dock, document.body);
}


window.onload = main;
