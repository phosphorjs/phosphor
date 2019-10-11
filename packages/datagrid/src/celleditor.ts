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
  returnPressed: boolean;
};

export
interface ICellInputValidatorResponse {
  valid: boolean;
  message?: string;
};

export
interface ICellInputValidator {
  validate(cell: CellEditor.CellConfig, value: any): ICellInputValidatorResponse;
};

const DEFAULT_INVALID_INPUT_MESSAGE = "Invalid input!";

export
class CellEditorController {
  registerEditor(editor: CellEditor) {
    this._editors.push(editor);
  }

  edit(cell: CellEditor.CellConfig, validator?: ICellInputValidator): Promise<ICellEditResponse> {
    const numEditors = this._editors.length;
    for (let i = numEditors - 1; i >= 0; --i) {
      const editor = this._editors[i];
      if (editor.canEdit(cell)) {
        return editor.edit(cell, validator);
      }
    }

    const data = cell.grid.dataModel ? cell.grid.dataModel.data('body', cell.row, cell.column) : undefined;
    if (!data || typeof data !== 'object') {
      const editor = new TextCellEditor();
      return editor.edit(cell, validator);
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

  edit(cell: CellEditor.CellConfig, validator?: ICellInputValidator): Promise<ICellEditResponse> {
    return new Promise<ICellEditResponse>((resolve, reject) => {
      this._cell = cell;
      this._validator = validator;
      this._resolve = resolve;
      this._reject = reject;

      cell.grid.node.addEventListener('wheel', () => {
        this.updatePosition();
      });

      this._addContainer();

      this.startEditing();
    });
  }

  protected getCellInfo(cell: CellEditor.CellConfig) {
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

  private _addContainer() {
    this._viewportOccluder = document.createElement('div');
    this._viewportOccluder.className = 'cell-editor-occluder';
    this._cell.grid.node.appendChild(this._viewportOccluder);

    this._cellContainer = document.createElement('div');
    this._cellContainer.className = 'cell-editor-container';
    this._viewportOccluder.appendChild(this._cellContainer);
  }

  protected abstract startEditing(): void;

  protected updatePosition(): void {
    const grid = this._cell.grid;
    const cellInfo = this.getCellInfo(this._cell);
    const headerHeight = grid.headerHeight;
    const headerWidth = grid.headerWidth;

    this._viewportOccluder.style.top = headerHeight + 'px';
    this._viewportOccluder.style.left = headerWidth + 'px';
    this._viewportOccluder.style.width = (grid.viewportWidth - headerWidth) + 'px';
    this._viewportOccluder.style.height = (grid.viewportHeight - headerHeight) + 'px';

    this._cellContainer.style.left = (cellInfo.x - 1 - headerWidth) + 'px';
    this._cellContainer.style.top = (cellInfo.y - 1 - headerHeight) + 'px';
    this._cellContainer.style.width = (cellInfo.width + 1) + 'px';
    this._cellContainer.style.height = (cellInfo.height + 1) + 'px';
    this._cellContainer.style.visibility = 'visible';
  }

  protected endEditing(): void {
    this._cell.grid.node.removeChild(this._viewportOccluder);
  }

  protected _resolve: {(response: ICellEditResponse): void };
  protected _reject: {(reason: any): void };
  protected _cell: CellEditor.CellConfig;
  protected _validator: ICellInputValidator | undefined;
  protected _viewportOccluder: HTMLDivElement;
  protected _cellContainer: HTMLDivElement;
}

export
class TextCellEditor extends CellEditor {
  canEdit(cell: CellEditor.CellConfig): boolean {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : {};
    return metadata.type === 'string';
  }

  startEditing() {
    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);

    const form = document.createElement('form');
    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');
    input.spellcheck = false;
    input.required = false;

    input.value = cellInfo.data;

    this._input = input;

    form.appendChild(input);
    this._cellContainer.appendChild(form);

    this.updatePosition();

    input.select();
    input.focus();

    input.addEventListener("keydown", (event) => {
      this._onKeyDown(event);
    });

    input.addEventListener("blur", (event) => {
      if (this._saveInput()) {
        this.endEditing();
      }
    });

    input.addEventListener("input", (event) => {
      this._input!.setCustomValidity("");
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        if (this._saveInput(true)) {
          this.endEditing();
        }
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _saveInput(returnPressed: boolean = false): boolean {
    if (!this._input) {
      return false;
    }

    const value = this._input.value;
    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._input.checkValidity();
        return false;
      }
    }

    this._resolve({ cell: this._cell, value: this._input!.value, returnPressed: returnPressed });

    return true;
  }

  endEditing() {
    if (!this._input) {
      return;
    }

    this._input = null;

    super.endEditing();
  }

  _input: HTMLInputElement | null;
}

export
class EnumCellEditor extends CellEditor {
  canEdit(cell: CellEditor.CellConfig): boolean {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : {};
    return metadata.constraint && metadata.constraint.enum;
  }

  startEditing() {
    const cell = this._cell;
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

    this._cellContainer.appendChild(select);

    this.updatePosition();
    select.focus();

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
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        this._saveInput(true);
        this.endEditing();
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _saveInput(returnPressed: boolean = false) {
    if (!this._select) {
      return;
    }

    const value = this._select.value;
    if (this._validator && ! this._validator.validate(this._cell, value)) {
      return;
    }

    this._resolve({ cell: this._cell, value: value, returnPressed: returnPressed });
  }

  endEditing() {
    if (!this._select) {
      return;
    }

    this._select = null;

    super.endEditing();
  }

  _select: HTMLSelectElement | null;
}

export
class DateCellEditor extends CellEditor {
  canEdit(cell: CellEditor.CellConfig): boolean {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : {};
    return metadata.type === 'date';
  }

  startEditing() {
    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);

    const input = document.createElement('input');
    input.type = 'date';
    input.pattern = "\d{4}-\d{2}-\d{2}";
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');
    input.spellcheck = false;

    input.value = cellInfo.data;

    this._input = input;

    this._cellContainer.appendChild(input);

    this.updatePosition();

    input.select();
    input.focus();

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
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        this._saveInput();
        this.endEditing();
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _saveInput(returnPressed: boolean = false) {
    if (!this._input) {
      return;
    }

    const value = this._input.value;
    if (this._validator && !this._validator.validate(this._cell, value)) {
      return;
    }

    this._resolve({ cell: this._cell, value: this._input!.value, returnPressed: returnPressed });
  }

  endEditing() {
    if (!this._input) {
      return;
    }

    this._input = null;

    super.endEditing();
  }

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
