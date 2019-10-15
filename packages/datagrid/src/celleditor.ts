import {
  Widget
} from '@phosphor/widgets';

import {
  DataGrid
} from './datagrid';

import { DataModel } from './datamodel';

import { SelectionModel } from './selectionmodel';

import { Signal, ISignal } from '@phosphor/signaling';

export
interface ICellInputValidatorResponse {
  valid: boolean;
  message?: string;
}

export
interface ICellInputValidator {
  validate(cell: CellEditor.CellConfig, value: any): ICellInputValidatorResponse;
}

export
interface ICellEditResponse {
  cell: CellEditor.CellConfig;
  value: any;
  cursorMovement: SelectionModel.CursorMoveDirection;
}

export
interface ICellEditor {
  edit(cell: CellEditor.CellConfig, validator?: ICellInputValidator): void;
  readonly onCommit: ISignal<this, ICellEditResponse>;
  readonly onCancel?: ISignal<this, void>;
}

const DEFAULT_INVALID_INPUT_MESSAGE = "Invalid input!";


export
class CellEditorController {
  private _getKey(cell: CellEditor.CellConfig): string {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : null;

    if (!metadata) {
      return 'undefined';
    }

    let key = '';

    if (metadata) {
      key = metadata.type;
    }

    if (metadata.constraint && metadata.constraint.enum) {
      key += ':enum';
    }

    return key;
  }

  createEditor(cell: CellEditor.CellConfig): ICellEditor | null {
    const key = this._getKey(cell);

    switch (key) {
      case 'string':
        return new TextCellEditor();
      case 'number':
        return new NumberCellEditor();
      case 'integer':
        return new IntegerCellEditor();
      case 'boolean':
        return new BooleanCellEditor();
      case 'date':
        return new DateCellEditor();
      case 'string:enum':
      case 'number:enum':
      case 'integer:enum':
      case 'date:enum':
        return new SelectCellEditor();
    }

    const data = cell.grid.dataModel ? cell.grid.dataModel.data('body', cell.row, cell.column) : undefined;
    if (!data || typeof data !== 'object') {
      return new TextCellEditor();
    }

    return null;
  }

  edit(cell: CellEditor.CellConfig, validator?: ICellInputValidator): boolean {
    const editor = this.createEditor(cell);
    if (editor) {
      editor.edit(cell, validator);
      return true;
    }

    return false;
  }
}

export
class PassInputValidator implements ICellInputValidator {
  validate(cell: CellEditor.CellConfig, value: any): ICellInputValidatorResponse {
    return { valid: true };
  }
}

export
class TextInputValidator implements ICellInputValidator {
  validate(cell: CellEditor.CellConfig, value: string): ICellInputValidatorResponse {
    if (typeof value !== 'string') {
      return {
        valid: false,
        message: 'Input must be valid text'
      };
    }

    return { valid: true };
  }
}

export
class IntegerInputValidator implements ICellInputValidator {
  validate(cell: CellEditor.CellConfig, value: number): ICellInputValidatorResponse {
    if (Number.isNaN(value) || (value % 1 !== 0)) {
      return {
        valid: false,
        message: 'Input must be valid integer'
      };
    }
    if (!Number.isNaN(this.min) && value < this.min) {
      return {
        valid: false,
        message: `Input must be greater than ${this.min}`
      };
    }

    if (!Number.isNaN(this.max) && value > this.max) {
      return {
        valid: false,
        message: `Input must be less than ${this.max}`
      };
    }

    return { valid: true };
  }

  min: number = Number.NaN;
  max: number = Number.NaN;
}

export
class NumberInputValidator implements ICellInputValidator {
  validate(cell: CellEditor.CellConfig, value: number): ICellInputValidatorResponse {
    if (Number.isNaN(value)) {
      return {
        valid: false,
        message: 'Input must be valid number'
      };
    }
    if (!Number.isNaN(this.min) && value < this.min) {
      return {
        valid: false,
        message: `Input must be greater than ${this.min}`
      };
    }

    if (!Number.isNaN(this.max) && value > this.max) {
      return {
        valid: false,
        message: `Input must be less than ${this.max}`
      };
    }

    return { valid: true };
  }

  min: number = Number.NaN;
  max: number = Number.NaN;
}


export
abstract class CellEditor implements ICellEditor {
  edit(cell: CellEditor.CellConfig, validator?: ICellInputValidator) {
    this._cell = cell;

    if (validator) {
      this._validator = validator;
    } else {
      const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : null;

      switch (metadata && metadata.type) {
        case 'string':
          this._validator = new TextInputValidator();
          break;
        case 'number':
          {
            const validator = new NumberInputValidator();
            if (metadata!.constraint) {
              if (metadata!.constraint.minimum) {
                validator.min = metadata!.constraint.minimum;
              }
              if (metadata!.constraint.maximum) {
                validator.max = metadata!.constraint.maximum;
              }
            }
            this._validator = validator;
          }
          break;
        case 'integer':
          {
            const validator = new IntegerInputValidator();
            if (metadata!.constraint) {
              if (metadata!.constraint.minimum) {
                validator.min = metadata!.constraint.minimum;
              }
              if (metadata!.constraint.maximum) {
                validator.max = metadata!.constraint.maximum;
              }
            }
            this._validator = validator;
          }
          break;
      }

    }

    cell.grid.node.addEventListener('wheel', () => {
      this.updatePosition();
    });

    this._addContainer();

    this.startEditing();
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

    this._form = document.createElement('form');
    this._form.className = 'cell-editor-form';
    this._cellContainer.appendChild(this._form);
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

  protected set validInput(value: boolean) {
    this._validInput = value;
    if (this._validInput) {
      this._cellContainer.classList.remove('invalid');
    } else {
      this._cellContainer.classList.add('invalid');
    }
  }

  protected get validInput(): boolean {
    return this._validInput;
  }

  get onCommit(): ISignal<this, ICellEditResponse> {
    return this._onCommit;
  }

  get onCancel(): ISignal<this, void> {
    return this._onCancel;
  }

  protected _onCommit = new Signal<this, ICellEditResponse>(this);
  protected _onCancel = new Signal<this, void>(this);
  protected _cell: CellEditor.CellConfig;
  protected _validator: ICellInputValidator | undefined;
  protected _viewportOccluder: HTMLDivElement;
  protected _cellContainer: HTMLDivElement;
  protected _form: HTMLFormElement;
  private _validInput: boolean = true;
}

export
class TextCellEditor extends CellEditor {
  startEditing() {
    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);

    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');
    input.spellcheck = false;
    input.required = false;

    input.value = cellInfo.data;

    this._input = input;

    this._form.appendChild(input);

    this.updatePosition();

    input.select();
    input.focus();

    input.addEventListener("keydown", (event) => {
      this._onKeyDown(event);
    });

    input.addEventListener("blur", (event) => {
      if (this._saveInput()) {
        this.endEditing();
        event.preventDefault();
        event.stopPropagation();
        this._input!.focus();
      }
    });

    input.addEventListener("input", (event) => {
      this._input!.setCustomValidity("");
      this.validInput = true;
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        if (this._saveInput(event.shiftKey ? 'up' : 'down')) {
          this.endEditing();
          event.preventDefault();
          event.stopPropagation();
        }
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _saveInput(cursorMovement: SelectionModel.CursorMoveDirection = 'none'): boolean {
    if (!this._input) {
      return false;
    }

    const value = this._input.value;
    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        return false;
      }
    }

    this._onCommit.emit({ cell: this._cell, value: value, cursorMovement: cursorMovement });

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
class NumberCellEditor extends CellEditor {
  startEditing() {
    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);

    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');
    input.spellcheck = false;
    input.required = false;

    const metadata = cell.grid.dataModel!.metadata('body', cell.row, cell.column);
    const constraint = metadata.constraint;
    if (constraint) {
      if (constraint.minimum) {
        input.min = constraint.minimum;
      }
      if (constraint.maximum) {
        input.max = constraint.maximum;
      }
    }

    input.value = cellInfo.data;

    this._input = input;

    this._form.appendChild(input);

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
      this.validInput = true;
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        if (this._saveInput('down')) {
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

  _saveInput(cursorMovement: SelectionModel.CursorMoveDirection = 'none'): boolean {
    if (!this._input) {
      return false;
    }

    let value = this._input.value;
    let floatValue = Number.parseFloat(value);
    if (Number.isNaN(floatValue)) {
      this._input.setCustomValidity('Input must be valid integer');
      this._form.reportValidity();
      return false;
    }

    this._input.value = floatValue.toString();

    if (this._validator) {
      const result = this._validator.validate(this._cell, floatValue);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        return false;
      }
    }

    this._onCommit.emit({ cell: this._cell, value: floatValue, cursorMovement: cursorMovement });

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
class IntegerCellEditor extends CellEditor {
  startEditing() {
    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);

    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');
    input.type = 'number';
    input.spellcheck = false;
    input.required = false;

    const metadata = cell.grid.dataModel!.metadata('body', cell.row, cell.column);
    const constraint = metadata.constraint;
    if (constraint) {
      if (constraint.minimum) {
        input.min = constraint.minimum;
      }
      if (constraint.maximum) {
        input.max = constraint.maximum;
      }
    }

    input.value = cellInfo.data;

    this._input = input;

    this._form.appendChild(input);

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
      this.validInput = true;
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        if (this._saveInput('down')) {
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

  _saveInput(cursorMovement: SelectionModel.CursorMoveDirection = 'none'): boolean {
    if (!this._input) {
      return false;
    }

    let value = this._input.value;
    let intValue = Number.parseInt(value);
    if (Number.isNaN(intValue)) {
      this._input.setCustomValidity('Input must be valid integer');
      this._form.reportValidity();
      return false;
    }

    this._input.value = intValue.toString();

    if (this._validator) {
      const result = this._validator.validate(this._cell, intValue);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        return false;
      }
    }

    this._onCommit.emit({ cell: this._cell, value: intValue, cursorMovement: cursorMovement });

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
class BooleanCellEditor extends CellEditor {
  startEditing() {
    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);

    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('boolean-cell-editor');
    input.type = 'checkbox';
    input.spellcheck = false;
    input.required = false;

    input.checked = cellInfo.data == true;

    this._input = input;
    this._form.appendChild(input);

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
      this.validInput = true;
    });
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (event.keyCode) {
      case 13: // return
        if (this._saveInput('down')) {
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

  _saveInput(cursorMovement: SelectionModel.CursorMoveDirection = 'none'): boolean {
    if (!this._input) {
      return false;
    }

    const value = this._input.checked;
    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        return false;
      }
    }

    this._onCommit.emit({ cell: this._cell, value: value, cursorMovement: cursorMovement });

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
class SelectCellEditor extends CellEditor {
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

    this._form.appendChild(select);

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
        this._saveInput('down');
        this.endEditing();
        break;
      case 27: // escape
        this.endEditing();
        break;
      default:
        break;
    }
  }

  _saveInput(cursorMovement: SelectionModel.CursorMoveDirection = 'none') {
    if (!this._select) {
      return;
    }

    const value = this._select.value;
    if (this._validator && ! this._validator.validate(this._cell, value)) {
      this.validInput = false;
      return;
    }

    this._onCommit.emit({ cell: this._cell, value: value, cursorMovement: cursorMovement });
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

    this._form.appendChild(input);

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

  _saveInput(cursorMovement: SelectionModel.CursorMoveDirection = 'none') {
    if (!this._input) {
      return;
    }

    const value = this._input.value;
    if (this._validator && !this._validator.validate(this._cell, value)) {
      this.validInput = false;
      return;
    }

    this._onCommit.emit({ cell: this._cell, value: value, cursorMovement: cursorMovement });
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
