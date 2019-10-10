import {
  Widget
} from '@phosphor/widgets';

import {
  DataGrid
} from './datagrid';
import { DataModel } from './datamodel';

export
interface ICellEditResponse {
  cell: CellEditor.CellConfig;
  value: any;
};

export
class CellEditorController {
  registerEditor(editor: CellEditor) {
    this._editors.push(editor);
  }

  edit(cell: CellEditor.CellConfig, validator?: any): Promise<ICellEditResponse> {
    const numEditors = this._editors.length;
    for (let i = numEditors - 1; i >= 0; --i) {
      const editor = this._editors[i];
      if (editor.canEdit(cell)) {
        return editor.edit(cell);
      }
    }

    const data = cell.grid.dataModel ? cell.grid.dataModel.data('body', cell.row, cell.column) : undefined;
    if (!data || typeof data !== 'object') {
      const editor = new TextCellEditor();
      return editor.edit(cell);
    }

    return new Promise<ICellEditResponse>((resolve, reject) => {
      reject('Editor not found');
    });
  }

  private _editors: CellEditor[] = [];
}

export
abstract class CellEditor {
  abstract canEdit(cell: CellEditor.CellConfig): boolean;
  abstract edit(cell: CellEditor.CellConfig): Promise<ICellEditResponse>;

  getCellInfo(cell: CellEditor.CellConfig) {
    const { grid, row, column } = cell;
    const data = grid.dataModel!.data('body', row, column);

    const columnX = grid.headerWidth - grid.scrollX + grid.columnOffset('body', column);
    const rowY = grid.headerHeight - grid.scrollY + grid.rowOffset('body', row);
    const width = grid.columnSize('body', column);
    const height = grid.rowSize('body', row);

    return {
      grid: grid,
      row: row,
      column: column,
      data: data,
      x: columnX,
      y: rowY,
      width: width,
      height: height
    };
  }

  updatePosition() {
  }

  endEditing() {
  }
}

export
class TextCellEditor extends CellEditor {
  canEdit(cell: CellEditor.CellConfig): boolean {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : {};
    return metadata.type === 'string';
  }

  edit(cell: CellEditor.CellConfig): Promise<ICellEditResponse> {
    return new Promise<ICellEditResponse>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

      this._cell = cell;
      const grid = cell.grid;
      const cellInfo = this.getCellInfo(cell);

      const input = document.createElement('input');
      input.classList.add('cell-editor');
      input.classList.add('input-cell-editor');
      input.spellcheck = false;

      input.value = cellInfo.data;

      this._input = input;

      grid.node.appendChild(input);

      this.updatePosition();

      input.select();

      input.addEventListener("keydown", (event) => {
        this._onKeyDown(event);
      });

      input.addEventListener("blur", (event) => {
        this._saveInput();
        this.endEditing();
      });

      grid.node.addEventListener('wheel', () => {
        this.updatePosition();
      });
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        this._saveInput();
        this.endEditing();
        this._cell.grid.selectionModel!.incrementCursor();
        this._cell.grid.scrollToCursor();
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _isCellFullyVisible(cellInfo: any): boolean {
    const grid = cellInfo.grid;

    return cellInfo.x >= grid.headerWidth && (cellInfo.x + cellInfo.width) <= grid.viewportWidth + 1 &&
      cellInfo.y >= grid.headerHeight && (cellInfo.y + cellInfo.height) <= grid.viewportHeight + 1;
  }

  _saveInput() {
    if (!this._input) {
      return;
    }

    this._resolve({ cell: this._cell, value: this._input!.value });
  }

  updatePosition() {
    if (!this._input) {
      return;
    }

    const cellInfo = this.getCellInfo(this._cell);
    const input = this._input;

    if (!this._isCellFullyVisible(cellInfo)) {
      input.style.visibility = 'hidden';
    } else {
      input.style.left = (cellInfo.x - 1) + 'px';
      input.style.top = (cellInfo.y - 1) + 'px';
      input.style.width = (cellInfo.width + 1) + 'px';
      input.style.height = (cellInfo.height + 1) + 'px';
      input.style.visibility = 'visible';
      input.focus();
    }
  }

  endEditing() {
    if (!this._input) {
      return;
    }

    this._input.style.display = 'none';
    //this._input.remove();
    this._input = null;
    this._cell.grid.viewport.node.focus();
  }

  _resolve: {(response: ICellEditResponse): void };
  _reject: {(reason: any): void };
  _cell: CellEditor.CellConfig;
  _input: HTMLInputElement | null;
}

export
class EnumCellEditor extends CellEditor {
  canEdit(cell: CellEditor.CellConfig): boolean {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : {};
    return metadata.constraint && metadata.constraint.enum;
  }

  edit(cell: CellEditor.CellConfig): Promise<ICellEditResponse> {
    return new Promise<ICellEditResponse>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

      this._cell = cell;
      const grid = cell.grid;
      const cellInfo = this.getCellInfo(cell);
      const metadata = cell.grid.dataModel!.metadata('body', cell.row, cell.column);
      const items = metadata.constraint.enum;

      const select = document.createElement('select');
      select.classList.add('cell-editor');
      select.classList.add('select-cell-editor');
      for (let item of items) {
        const option = document.createElement("option");
        option.value = item;
        option.text = item;
        select.appendChild(option);
      }

      select.value = cellInfo.data;

      this._select = select;

      grid.node.appendChild(select);

      this.updatePosition();

      select.addEventListener("keydown", (event) => {
        this._onKeyDown(event);
      });

      select.addEventListener("blur", (event) => {
        this._saveInput();
        this.endEditing();
      });

      select.addEventListener("change", (event) => {
        this._saveInput();
        this.endEditing();
      });

      grid.node.addEventListener('wheel', () => {
        this.updatePosition();
      });
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        this._saveInput();
        this.endEditing();
        this._cell.grid.selectionModel!.incrementCursor();
        this._cell.grid.scrollToCursor();
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _isCellFullyVisible(cellInfo: any): boolean {
    const grid = cellInfo.grid;

    return cellInfo.x >= grid.headerWidth && (cellInfo.x + cellInfo.width) <= grid.viewportWidth + 1 &&
      cellInfo.y >= grid.headerHeight && (cellInfo.y + cellInfo.height) <= grid.viewportHeight + 1;
  }

  _saveInput() {
    if (!this._select) {
      return;
    }

    this._resolve({ cell: this._cell, value: this._select!.value });
  }

  updatePosition() {
    if (!this._select) {
      return;
    }

    const cellInfo = this.getCellInfo(this._cell);
    const input = this._select;

    if (!this._isCellFullyVisible(cellInfo)) {
      input.style.visibility = 'hidden';
    } else {
      input.style.left = (cellInfo.x - 1) + 'px';
      input.style.top = (cellInfo.y - 1) + 'px';
      input.style.width = (cellInfo.width + 1) + 'px';
      input.style.height = (cellInfo.height + 1) + 'px';
      input.style.visibility = 'visible';
      input.focus();
    }
  }

  endEditing() {
    if (!this._select) {
      return;
    }

    this._select.style.display = 'none';
    //this._select.remove();
    this._select = null;
    this._cell.grid.viewport.node.focus();
  }

  _resolve: {(response: ICellEditResponse): void };
  _reject: {(reason: any): void };
  _cell: CellEditor.CellConfig;
  _select: HTMLSelectElement | null;
}

export
class DateCellEditor extends CellEditor {
  canEdit(cell: CellEditor.CellConfig): boolean {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : {};
    return metadata.type === 'date';
  }

  edit(cell: CellEditor.CellConfig): Promise<ICellEditResponse> {
    return new Promise<ICellEditResponse>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;

      this._cell = cell;
      const grid = cell.grid;
      const cellInfo = this.getCellInfo(cell);

      const input = document.createElement('input');
      input.type = 'date';
      input.pattern = "\d{4}-\d{2}-\d{2}";
      input.classList.add('cell-editor');
      input.classList.add('input-cell-editor');
      input.spellcheck = false;

      input.value = cellInfo.data;

      this._input = input;

      grid.node.appendChild(input);

      this.updatePosition();

      input.select();

      input.addEventListener("keydown", (event) => {
        this._onKeyDown(event);
      });

      input.addEventListener("blur", (event) => {
        this._saveInput();
        this.endEditing();
      });

      input.addEventListener("change", (event) => {
        this._saveInput();
        //this.endEditing();
      });

      grid.node.addEventListener('wheel', () => {
        this.updatePosition();
      });
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        this._saveInput();
        this.endEditing();
        this._cell.grid.selectionModel!.incrementCursor();
        this._cell.grid.scrollToCursor();
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _isCellFullyVisible(cellInfo: any): boolean {
    const grid = cellInfo.grid;

    return cellInfo.x >= grid.headerWidth && (cellInfo.x + cellInfo.width) <= grid.viewportWidth + 1 &&
      cellInfo.y >= grid.headerHeight && (cellInfo.y + cellInfo.height) <= grid.viewportHeight + 1;
  }

  _saveInput() {
    if (!this._input) {
      return;
    }

    this._resolve({ cell: this._cell, value: this._input!.value });
  }

  updatePosition() {
    if (!this._input) {
      return;
    }

    const cellInfo = this.getCellInfo(this._cell);
    const input = this._input;

    if (!this._isCellFullyVisible(cellInfo)) {
      input.style.visibility = 'hidden';
    } else {
      input.style.left = (cellInfo.x - 1) + 'px';
      input.style.top = (cellInfo.y - 1) + 'px';
      input.style.width = (cellInfo.width + 1) + 'px';
      input.style.height = (cellInfo.height + 1) + 'px';
      input.style.visibility = 'visible';
      input.focus();
    }
  }

  endEditing() {
    if (!this._input) {
      return;
    }

    this._input.style.display = 'none';
    //this._input.remove();
    this._input = null;
    this._cell.grid.viewport.node.focus();
  }

  _resolve: {(response: ICellEditResponse): void };
  _reject: {(reason: any): void };
  _cell: CellEditor.CellConfig;
  _input: HTMLInputElement | null;
}

export
namespace CellEditor {
  export
  interface IOptions extends Widget.IOptions {
    grid: DataGrid;
    row: number;
    column: number;
  }

  export
  interface IInputOptions extends IOptions {
  }

  /**
   * An object which holds the configuration data for a cell.
   */
  export
  type CellConfig = {
    readonly grid: DataGrid;
    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly column: number;

    /**
     * The metadata for the cell.
     */
    readonly metadata: DataModel.Metadata;
  };
}
