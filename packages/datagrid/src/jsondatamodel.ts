
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  JSONObject, JSONArray
} from '@phosphor/coreutils';

import {
  DataModel
} from './datamodel';


export
class JSONDataModel extends DataModel {

  constructor(data: JSONArray, schema: JSONObject) {
    super();
    this._data = data;
    this._fields = Private.parseFields(schema.fields);
    this._primaryKey = Private.parsePrimaryKey(schema.primaryKey);
    this._missingValues = schema.missingValues || [];
  }

  rowCount(region: DataModel.RowRegion): number {
    if (region === 'body') {
      return this._data.length - 1;
    } else if (region === 'column-header') {
      return 1;
    }
    return 0;
  }

  columnCount(region: DataModel.ColumnRegion): number {
    if (region === 'body') {
      return this._fields.length - this._primaryKey.length;
    } else if (region === 'column-header') {
      return this._primaryKey.length;
    }
    return 0;
  }

  data(region: DataModel.CellRegion, row: number, column: number): any {
    if (region === 'row-header') {
      return this._data[row][this._fields[column]['name']];
    }
    if (region === 'column-header') {
      this._fields[column]['name'];
    }
    if (region === 'corner-header') {
      return '';
    }
    return this._data[row][this._fields[column]['name']];
  }

  private _data: JSONArray;
  private _fields: JSONDataModel.JSONField[];
  private _primaryKey: JSONDataModel.PrimaryKey;
  private _missingValues: JSONDataModel.MissingValues;
}


export
namespace JSONDataModel {

  export
  type PrimaryKey = string[];

  export
  type MissingValues = string[];

  export
  interface IJSONField extends DataModel.IField {

    format?: string;
    title?: string;
    description?: string;
    constraints?: JSONObject;
  }

  export
  class JSONField implements IJSONField {

    constructor(value: JSONObject) {
      this.name = value.name || '';
      this.type = value.type || 'string';
      this.format = value.format || '';
      this.title = value.title || '';
      this.description = value.description || '';
      this.constraints = value.constraints || null;
    }

    readonly name: string;

    readonly type: string;

    readonly format?: string;

    readonly title?: string;

    readonly description?: string;

    readonly constraints?: JSONObject | null;
  }

}


export
namespace Private {

  export
  function parseFields(fields: JSONArray): JSONDataModel.JSONField[] {
    let newFields = [];
    for (let field of fields) {
      newFields.push(new JSONDataModel.JSONField(field));
    }
    return newFields;
  }

  export
  function parsePrimaryKey(primaryKey: string | string[] | undefined) {
    if (typeof primaryKey === 'string') {
      return [primaryKey];
    } else if (typeof primaryKey === 'object') {
      return primaryKey;
    } else {
      return [];
    }
  }

}