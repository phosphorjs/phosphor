/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDisposable
} from '@phosphor/disposable';

import {
  DataGrid
} from './datagrid';

import {
  SelectionModel
} from './selectionmodel';

import {
  getKeyboardLayout
} from '@phosphor/keyboard';

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
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): void;
  cancel(): void;
}

const DEFAULT_INVALID_INPUT_MESSAGE = "Invalid input!";

export
type CellDataType = 'string' | 'number' | 'integer' | 'boolean' | 'date' |
                    'string:option' | 'number:option' | 'integer:option'| 'date:option'|
                    'string:dynamic-option' | 'number:dynamic-option' | 'integer:dynamic-option' | 'date:dynamic-option';

export
interface ICellEditOptions {
  editor?: ICellEditor;
  validator?: ICellInputValidator;
  onCommit?: (response: ICellEditResponse) => void;
  onCancel?: () => void;
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

    if (!Number.isNaN(this.minLength) && value.length < this.minLength) {
      return {
        valid: false,
        message: `Text length must be greater than ${this.minLength}`
      };
    }

    if (!Number.isNaN(this.maxLength) && value.length > this.maxLength) {
      return {
        valid: false,
        message: `Text length must be less than ${this.maxLength}`
      };
    }

    if (this.pattern && !this.pattern.test(value)) {
      return {
        valid: false,
        message: `Text doesn't match the required pattern`
      };
    }

    return { valid: true };
  }

  minLength: number = Number.NaN;
  maxLength: number = Number.NaN;
  pattern: RegExp | null = null;
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
abstract class CellEditor implements ICellEditor, IDisposable {
  protected abstract startEditing(): void;
  protected abstract serialize(): any;

  /**
   * Whether the cell editor is disposed.
   */
  get isDisposed(): boolean {
    return this._disposed;
  }

  /**
   * Dispose of the resources held by cell editor handler.
   */
  dispose(): void {
    if (this._disposed) {
      return;
    }

    this._disposed = true;
    this._cell.grid.node.removeChild(this._viewportOccluder);
  }

  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): void {
    this._cell = cell;
    this._onCommit = options && options.onCommit;
    this._onCancel = options && options.onCancel;

    this._validator = (options && options.validator) ? options.validator : this.createValidatorBasedOnType();

    cell.grid.node.addEventListener('wheel', () => {
      this.updatePosition();
    });

    this._addContainer();

    this.updatePosition();
    this.startEditing();
  }

  cancel() {
    if (this._disposed) {
      return;
    }

    this.dispose();
    if (this._onCancel) {
      this._onCancel();
    }
  }

  protected createValidatorBasedOnType(): ICellInputValidator | undefined {
    const cell = this._cell;
    const metadata = cell.grid.dataModel!.metadata('body', cell.row, cell.column);

    switch (metadata && metadata.type) {
      case 'string':
        {
          const validator = new TextInputValidator();
          if (typeof(metadata!.format) === 'string') {
            const format = metadata!.format;
            switch (format) {
              case 'email':
                validator.pattern = new RegExp("^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$");
                break;
              case 'uuid':
                validator.pattern = new RegExp("[0-9a-fA-F]{8}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{4}\-[0-9a-fA-F]{12}");
                break;
              case 'uri':
                // TODO
                break;
              case 'binary':
                // TODO
                break;
            }
          }

          if (metadata!.constraint) {
            if (metadata!.constraint.minLength !== undefined) {
              validator.minLength = metadata!.constraint.minLength;
            }
            if (metadata!.constraint.maxLength !== undefined) {
              validator.maxLength = metadata!.constraint.maxLength;
            }
            if (typeof(metadata!.constraint.pattern) === 'string') {
              validator.pattern = new RegExp(metadata!.constraint.pattern);
            }
          }
          return validator;
        }
        break;
      case 'number':
        {
          const validator = new NumberInputValidator();
          if (metadata!.constraint) {
            if (metadata!.constraint.minimum !== undefined) {
              validator.min = metadata!.constraint.minimum;
            }
            if (metadata!.constraint.maximum !== undefined) {
              validator.max = metadata!.constraint.maximum;
            }
          }
          return validator;
        }
        break;
      case 'integer':
        {
          const validator = new IntegerInputValidator();
          if (metadata!.constraint) {
            if (metadata!.constraint.minimum !== undefined) {
              validator.min = metadata!.constraint.minimum;
            }
            if (metadata!.constraint.maximum !== undefined) {
              validator.max = metadata!.constraint.maximum;
            }
          }
          return validator;
        }
        break;
    }

    return undefined;
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

  protected commit(cursorMovement: SelectionModel.CursorMoveDirection = 'none'): boolean {
    let value;
    try {
      value = this.serialize();
    } catch (error) {
      console.error(error);
      return false;
    }

    this.dispose();

    if (this._onCommit) {
      this._onCommit({
        cell: this._cell,
        value: value,
        cursorMovement: cursorMovement
      });
    }

    return true;
  }

  protected _onCommit?: (response: ICellEditResponse) => void;
  protected _onCancel?: () => void;
  protected _cell: CellEditor.CellConfig;
  protected _validator: ICellInputValidator | undefined;
  protected _viewportOccluder: HTMLDivElement;
  protected _cellContainer: HTMLDivElement;
  protected _form: HTMLFormElement;
  private _validInput: boolean = true;
  private _disposed = false;
}

export
class TextCellEditor extends CellEditor {
  startEditing() {
    this._createWidget();

    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.value = this.deserialize(cellInfo.data);
    this._form.appendChild(this._input);
    this._input.select();
    this._input.focus();

    this._bindEvents();
  }

  _createWidget() {
    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');
    input.spellcheck = false;

    this._input = input;
  }

  _bindEvents() {
    this._input.addEventListener('keydown', this);
    this._input.addEventListener('blur', this);
    this._input.addEventListener('input', this);
  }

  _unbindEvents() {
    this._input.removeEventListener('keydown', this);
    this._input.removeEventListener('blur', this);
    this._input.removeEventListener('input', this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
      case 'input':
        this._onInput(event);
        break;
    }
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._input.focus();
    }
  }

  _onInput(event: Event) {
    this._input.setCustomValidity("");
    this.validInput = true;
  }

  protected serialize(): any {
    const value = this._input.value;

    if (value.trim() === '') {
      return null;
    }

    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        throw new Error('Invalid input');
      }
    }

    return value;
  }

  protected deserialize(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString();
  }

  dispose() {
    if (this.isDisposed) {
      return;
    }

    this._unbindEvents();

    super.dispose();
  }

  protected _input: HTMLInputElement;
}

export
class NumberCellEditor extends TextCellEditor {
  protected serialize(): any {
    let value = this._input.value;
    if (value.trim() === '') {
      return null;
    }

    let floatValue = Number.parseFloat(value);
    if (Number.isNaN(floatValue)) {
      this.validInput = false;
      this._input.setCustomValidity('Input must be valid number');
      this._form.reportValidity();
      throw new Error('Invalid input');
    }

    this._input.value = floatValue.toString();

    if (this._validator) {
      const result = this._validator.validate(this._cell, floatValue);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        throw new Error('Invalid input');
      }
    }

    return floatValue;
  }
}

export
class IntegerCellEditor extends NumberCellEditor {
  startEditing() {
    this._createWidget();
    this._input.type = 'number';

    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.value = this.deserialize(cellInfo.data);

    const metadata = cell.grid.dataModel!.metadata('body', cell.row, cell.column);
    const constraint = metadata.constraint;
    if (constraint) {
      if (constraint.minimum) {
        this._input.min = constraint.minimum;
      }
      if (constraint.maximum) {
        this._input.max = constraint.maximum;
      }
    }

    this._form.appendChild(this._input);
    this._input.select();
    this._input.focus();

    this._bindEvents();
  }

  protected serialize(): any {
    let value = this._input.value;
    if (value.trim() === '') {
      return null;
    }

    let intValue = Number.parseInt(value);
    if (Number.isNaN(intValue)) {
      this.validInput = false;
      this._input.setCustomValidity('Input must be valid number');
      this._form.reportValidity();
      throw new Error('Invalid input');
    }

    this._input.value = intValue.toString();

    if (this._validator) {
      const result = this._validator.validate(this._cell, intValue);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        throw new Error('Invalid input');
      }
    }

    return intValue;
  }
}

export
class DateCellEditor extends CellEditor {
  startEditing() {
    this._createWidget();

    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.value = this.deserialize(cellInfo.data);
    this._form.appendChild(this._input);
    this._input.focus();

    this._bindEvents();
  }

  _createWidget() {
    const input = document.createElement('input');
    input.type = 'date';
    input.pattern = "\d{4}-\d{2}-\d{2}";
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');

    this._input = input;
  }

  _bindEvents() {
    this._input.addEventListener('keydown', this);
    this._input.addEventListener('blur', this);
  }

  _unbindEvents() {
    this._input.removeEventListener('keydown', this);
    this._input.removeEventListener('blur', this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
    }
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._input.focus();
    }
  }

  protected serialize(): any {
    const value = this._input.value;

    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        throw new Error('Invalid input');
      }
    }

    return value;
  }

  protected deserialize(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString();
  }

  _input: HTMLInputElement;
}

export
class BooleanCellEditor extends CellEditor {
  startEditing() {
    this._createWidget();

    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.checked = this.deserialize(cellInfo.data);
    this._form.appendChild(this._input);
    this._input.focus();

    this._bindEvents();
  }

  _createWidget() {
    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('boolean-cell-editor');
    input.type = 'checkbox';
    input.spellcheck = false;

    this._input = input;
  }

  _bindEvents() {
    this._input.addEventListener('keydown', this);
    this._input.addEventListener('blur', this);
  }

  _unbindEvents() {
    this._input.removeEventListener('keydown', this);
    this._input.removeEventListener('blur', this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
    }
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._input.focus();
    }
  }

  protected serialize(): any {
    const value = this._input.checked;

    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        throw new Error('Invalid input');
      }
    }

    return value;
  }

  protected deserialize(value: any): any {
    if (value === null || value === undefined) {
      return false;
    }

    return value == true;
  }

  _input: HTMLInputElement;
}

export
class OptionCellEditor extends CellEditor {
  startEditing() {
    this._createWidget();

    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);
    this._select.value = this.deserialize(cellInfo.data);
    this._form.appendChild(this._select);
    this._select.focus();

    this._bindEvents();
  }

  _createWidget() {
    const cell = this._cell;
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

    this._select = select;
  }

  _bindEvents() {
    this._select.addEventListener('keydown', this);
    this._select.addEventListener('blur', this);
  }

  _unbindEvents() {
    this._select.removeEventListener('keydown', this);
    this._select.removeEventListener('blur', this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
    }
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._select.focus();
    }
  }

  protected serialize(): any {
    const value = this._select.value;

    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this.validInput = false;
        this._select.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        throw new Error('Invalid input');
      }
    }

    return value;
  }

  protected deserialize(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString();
  }

  _select: HTMLSelectElement;
}

export
class DynamicOptionCellEditor extends CellEditor {
  startEditing() {
    this._createWidget();

    const cell = this._cell;
    const cellInfo = this.getCellInfo(cell);
    this._input.value = this.deserialize(cellInfo.data);
    this._form.appendChild(this._input);
    this._input.select();
    this._input.focus();

    this._bindEvents();
  }

  _createWidget() {
    const cell = this._cell;
    const grid = cell.grid;
    const dataModel = grid.dataModel!;
    const rowCount = dataModel.rowCount('body');

    const listId = 'cell-editor-list';
    const list = document.createElement('datalist');
    list.id = listId;
    const input = document.createElement('input');
    input.classList.add('cell-editor');
    input.classList.add('input-cell-editor');
    const valueSet = new Set<string>();
    for (let r = 0; r < rowCount; ++r) {
      const data = dataModel.data('body', r, cell.column);
      if (data) {
        valueSet.add(data);
      }
    }
    valueSet.forEach((value: string) => {
      const option = document.createElement("option");
      option.value = value;
      option.text = value;
      list.appendChild(option);
    });
    this._form.appendChild(list);
    input.setAttribute('list', listId);

    this._input = input;
  }

  _bindEvents() {
    this._input.addEventListener('keydown', this);
    this._input.addEventListener('blur', this);
  }

  _unbindEvents() {
    this._input.removeEventListener('keydown', this);
    this._input.removeEventListener('blur', this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keydown':
        this._onKeyDown(event as KeyboardEvent);
        break;
      case 'blur':
        this._onBlur(event as FocusEvent);
        break;
    }
  }

  _onKeyDown(event: KeyboardEvent) {
    switch (getKeyboardLayout().keyForKeydownEvent(event)) {
      case 'Enter':
        this.commit(event.shiftKey ? 'up' : 'down');
        break;
      case 'Tab':
        this.commit(event.shiftKey ? 'left' : 'right');
        event.stopPropagation();
        event.preventDefault();
        break;
      case 'Escape':
        this.cancel();
        break;
      default:
        break;
    }
  }

  _onBlur(event: FocusEvent) {
    if (this.isDisposed) {
      return;
    }

    if (!this.commit()) {
      event.preventDefault();
      event.stopPropagation();
      this._input.focus();
    }
  }

  protected serialize(): any {
    const value = this._input.value;

    if (this._validator) {
      const result = this._validator.validate(this._cell, value);
      if (!result.valid) {
        this.validInput = false;
        this._input.setCustomValidity(result.message || DEFAULT_INVALID_INPUT_MESSAGE);
        this._form.reportValidity();
        throw new Error('Invalid input');
      }
    }

    return value;
  }

  protected deserialize(value: any): any {
    if (value === null || value === undefined) {
      return '';
    }

    return value.toString();
  }

  _input: HTMLInputElement;
}


export
namespace CellEditor {
  /**
   * An object which holds the configuration data for a cell.
   */
  export
  type CellConfig = {
    /**
     * The grid containing the cell.
     */
    readonly grid: DataGrid;
    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly column: number;
  };
}
