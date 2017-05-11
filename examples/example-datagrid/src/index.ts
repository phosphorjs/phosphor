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
  readonly colCount = 100000000000;
  readonly rowHeaderCount = 3;
  readonly colHeaderCount = 3;

  data(row: number, col: number): any {
    if (col < 0 && row >= 0) {
      return `Row: ${row}, ${col}`;
    }
    if (row < 0 && col >= 0) {
      return `Col: ${row}, ${col}`;
    }
    if (row < 0 && col < 0) {
      return `Corner: ${row}, ${col}`;
    }
    return `(${row}, ${col})`;
  }
}


class RandomDataModel extends DataModel {

  static genPoint(): number {
    return Math.random() * 10 - 2;
  }

  readonly rowCount = 80;
  readonly colCount = 80;
  readonly rowHeaderCount = 1;
  readonly colHeaderCount = 1;

  constructor() {
    super();
    for (let i = 0, n = this.rowCount * this.colCount; i < n; ++i) {
      this._data[i] = RandomDataModel.genPoint();
    }
    setInterval(this._tick, 30);
  }

  data(row: number, col: number): any {
    if (row < 0) {
      return `Col: ${col}`;
    }
    if (col < 0) {
      return `Row: ${row}`;
    }
    return this._data[row * this.colCount + col];
  }

  private _tick = () => {
    let r = Math.floor(Math.random() * (this.rowCount - 1))
    let c = Math.floor(Math.random() * (this.colCount - 1))
    this._data[r * this.colCount + c] = RandomDataModel.genPoint();
    this.emitChanged({
      type: 'cells-changed',
      rowIndex: r,
      colIndex: c,
      rowSpan: 1,
      colSpan: 1
    });
  };

  private _data: number[] = [];
}


const formatDecimal: TextRenderer.CellFunc<string> = config => {
  return config.value.toFixed(2);
};


const negativeRed: TextRenderer.CellFunc<string> = config => {
  return config.value < 0 ? '#FF0000' : '#000000';
};


const headMapJet: TextRenderer.CellFunc<string> = config => {
  let value = (config.value + 2) / 5 - 1;
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


function main(): void {

  let model1 = new LargeDataModel();
  let model2 = new LargeDataModel();
  let model3 = new RandomDataModel();
  let model4 = new RandomDataModel();

  let myStyle: DataGrid.IStyle = {
    ...DataGrid.defaultStyle,
    rowBackgroundColor: i => i % 2 === 0 ? 'rgba(138, 172, 200, 0.3)' : '',
    colBackgroundColor: i => i % 2 === 0 ? 'rgba(100, 100, 100, 0.1)' : ''
  };

  let floatRenderer1 = new TextRenderer({
    textColor: negativeRed,
    formatter: formatDecimal,
    horizontalAlignment: 'right'
  });

  let floatRenderer2 = new TextRenderer({
    backgroundColor: headMapJet,
    formatter: formatDecimal,
    horizontalAlignment: 'right'
  });

  let grid1 = new DataGrid({ style: myStyle });
  grid1.model = model1;

  let grid2 = new DataGrid({ style: myStyle });
  grid2.model = model2;

  let grid3 = new DataGrid({ cellRenderer: floatRenderer1 });
  grid3.model = model3;

  let grid4 = new DataGrid({ cellRenderer: floatRenderer2 });
  grid4.model = model4;

  let wrapper1 = new StackedPanel();
  wrapper1.addClass('content-wrapper');
  wrapper1.addWidget(grid1);
  wrapper1.title.label = 'My Data Model 1';

  let wrapper2 = new StackedPanel();
  wrapper2.addClass('content-wrapper');
  wrapper2.addWidget(grid2);
  wrapper2.title.label = 'My Data Model 2';

  let wrapper3 = new StackedPanel();
  wrapper3.addClass('content-wrapper');
  wrapper3.addWidget(grid3);
  wrapper3.title.label = 'My Data Model 3';

  let wrapper4 = new StackedPanel();
  wrapper4.addClass('content-wrapper');
  wrapper4.addWidget(grid4);
  wrapper4.title.label = 'My Data Model 4';

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
