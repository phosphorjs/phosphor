/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
    ICellEditor,
    CellEditor,
    CellDataType,
    ICellEditOptions,
    TextCellEditor,
    NumberCellEditor,
    IntegerCellEditor,
    BooleanCellEditor,
    DateCellEditor,
    OptionCellEditor,
    DynamicOptionCellEditor
} from './celleditor';

import { DataModel } from './datamodel';

export
interface ICellEditorController {
  setEditor(identifier: CellDataType | DataModel.Metadata, editor: ICellEditor | Resolver): void;
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): boolean;
  cancel(): void;
}

/**
 * A type alias for a cell editor config function.
 *
 * This type is used to compute a value from a cell config object.
 */
export
type ConfigFunc<T> = (config: CellEditor.CellConfig) => T;

/**
 * A type alias for a cell editor config option.
 *
 * A config option can be a static value or a config function.
 */
export
type ConfigOption<T> = T | ConfigFunc<T>;

/**
 * A type alias for a cell editor resolver function.
 */
export
type Resolver = ConfigFunc<ICellEditor | undefined>;

/**
 * Resolve a config option for a cell editor.
 *
 * @param option - The config option to resolve.
 *
 * @param config - The cell config object.
 *
 * @returns The resolved value for the option.
 */
export
function resolveOption<T>(option: ConfigOption<T>, config: CellEditor.CellConfig): T {
  return typeof option === 'function' ? option(config) : option;
}

export
class CellEditorController implements ICellEditorController {
  edit(cell: CellEditor.CellConfig, options?: ICellEditOptions): boolean {
    const grid = cell.grid;

    if (!grid.editable) {
      console.error('Grid cannot be edited!');
      return false;
    }

    this.cancel();

    if (options && options.editor) {
      this._editor = options.editor;
      options.editor.edit(cell, options);
      return true;
    }

    const editor = this._getEditor(cell);
    if (editor) {
      this._editor = editor;
      editor.edit(cell, options);
      return true;
    }

    return false;
  }

  cancel(): void {
    if (this._editor) {
      this._editor.cancel();
      this._editor = null;
    }
  }

  private _getDataTypeKey(cell: CellEditor.CellConfig): string {
    const metadata = cell.grid.dataModel ? cell.grid.dataModel.metadata('body', cell.row, cell.column) : null;

    if (!metadata) {
      return 'undefined';
    }

    let key = '';

    if (metadata) {
      key = metadata.type;
    }

    if (metadata.constraint && metadata.constraint.enum) {
      if (metadata.constraint.enum === 'dynamic') {
        key += ':dynamic-option';
      } else {
        key += ':option';
      }
    }

    return key;
  }

  private _objectToKey(object: any): string {
    let str = '';
    for (let key in object) {
      const value = object[key];
      if (typeof value === 'object') {
        str += `${key}:${this._objectToKey(value)}`;
      } else {
        str += `[${key}:${value}]`;
      }
    }

    return str;
  }

  private _metadataIdentifierToKey(metadata: DataModel.Metadata): string {
    return this._objectToKey(metadata);
  }

  private _metadataMatchesIdentifier(metadata: DataModel.Metadata, identifier: DataModel.Metadata): boolean {
    for (let key in identifier) {
      if (!metadata.hasOwnProperty(key)) {
        return false;
      }

      const identifierValue = identifier[key];
      const metadataValue = metadata[key];
      if (typeof identifierValue === 'object') {
        if (!this._metadataMatchesIdentifier(metadataValue, identifierValue)) {
          return false;
        }
      } else if (metadataValue !== identifierValue) {
        return false;
      }
    }

    return true;
  }

  private _getMetadataBasedEditor(cell: CellEditor.CellConfig): ICellEditor | undefined {
    let editorMatched: ICellEditor | undefined;
    const metadata = cell.grid.dataModel!.metadata('body', cell.row, cell.column);
    if (metadata) {
      this._metadataBasedOverrides.forEach((value) => {
        if (!editorMatched) {
          let [identifier, editor] = value;
          if (this._metadataMatchesIdentifier(metadata, identifier)) {
            editorMatched = resolveOption(editor, cell);
          }
        }
      });
    }

    return editorMatched;
  }

  private _getEditor(cell: CellEditor.CellConfig): ICellEditor | undefined {
    const dtKey = this._getDataTypeKey(cell);

    if (this._typeBasedOverrides.has(dtKey)) {
      let editor = this._typeBasedOverrides.get(dtKey);
      return resolveOption(editor!, cell);
    } else if (this._metadataBasedOverrides.size > 0) {
      const editor = this._getMetadataBasedEditor(cell);
      if (editor) {
        return editor;
      }
    }

    switch (dtKey) {
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
      case 'string:option':
      case 'number:option':
      case 'integer:option':
      case 'date:option':
        return new OptionCellEditor();
      case 'string:dynamic-option':
      case 'number:dynamic-option':
      case 'integer:dynamic-option':
      case 'date:dynamic-option':
        return new DynamicOptionCellEditor();
    }

    const data = cell.grid.dataModel!.data('body', cell.row, cell.column);
    if (!data || typeof data !== 'object') {
      return new TextCellEditor();
    }

    return undefined;
  }

  setEditor(identifier: CellDataType | DataModel.Metadata, editor: ICellEditor | Resolver) {
    if (typeof identifier === 'string') {
      this._typeBasedOverrides.set(identifier, editor);
    } else {
      const key = this._metadataIdentifierToKey(identifier);
      this._metadataBasedOverrides.set(key, [identifier, editor]);
    }
  }

  private _editor: ICellEditor | null = null;
  private _typeBasedOverrides: Map<string, ICellEditor | Resolver> = new Map();
  private _metadataBasedOverrides: Map<string, [DataModel.Metadata, ICellEditor | Resolver]> = new Map();
}
