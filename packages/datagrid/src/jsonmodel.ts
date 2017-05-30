
/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  JSONObject, JSONArray, JSONExt
} from '@phosphor/coreutils';

import {
  DataModel
} from './datamodel';

/**
 * The number of column headers, which as assume is 1 for now.
 */
const COLUMN_HEADERS = 1;

/**
 * A DataModel for static JSON data with an associated JSON Table Schema.
 * 
 * #### Notes
 * This assumes the data is passed in a single time and is never changed.
 */
export
class JSONDataModel extends DataModel {
  /**
   * Create a data model with static JSON data.
   * 
   * @param data - An array of JSON records with the actual data.
   * @param schema - The JSON table schema.
   */
  constructor(data: JSONArray, schema: JSONObject) {
    super();
    this._data = JSONExt.deepCopy(data);
    this._fields = Private.parseFields(schema.fields as JSONArray);
    this._primaryKey = Private.parsePrimaryKey(schema.primaryKey as string | string[] | undefined);
    this._missingValues = schema.missingValues as string[] || [];
    this._keyCount = this._primaryKey.length;
  }

  /**
   * Get the row count for a region in the data model.
   *
   * @param region - The row region of interest.
   *
   * @returns - The row count for the region.
   */
  rowCount(region: DataModel.RowRegion): number {
    if (region === 'body') {
      return this._data.length;
    } else if (region === 'column-header') {
      // For now assume a a fixed number of column headers.
      return COLUMN_HEADERS;
    }
    return 0;
  }

  /**
   * Get the column count for a region in the data model.
   *
   * @param region - The column region of interest.
   *
   * @returns - The column count for the region.
   */
  columnCount(region: DataModel.ColumnRegion): number {
    if (region === 'body') {
      return this._fields.length - this._primaryKey.length;
    } else if (region === 'row-header') {
      return this._primaryKey.length;
    }
    return 0;
  }

  /**
   * Get the data value for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @param returns - The data value for the specified cell.
   */
  data(region: DataModel.CellRegion, row: number, column: number): any {
    let rowData: JSONObject;
    let columnName: string;
    let keyCount = this._keyCount;
    if (region === 'row-header') {
      rowData = this._data[row] as JSONObject;
      columnName = this._fields[column].name;
      return rowData[columnName];
    }
    if (region === 'column-header') {
      return this._fields[column + keyCount].name;
    }
    if (region === 'corner-header') {
      return '';
    }
    rowData = this._data[row] as JSONObject;
    columnName = this._fields[column + keyCount].name;
    return rowData[columnName];
  }

  private _data: JSONArray;
  private _fields: JSONDataModel.JSONField[];
  private _primaryKey: JSONDataModel.PrimaryKey;
  private _missingValues: JSONDataModel.MissingValues;
  private _keyCount: number;
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
    constraints?: JSONObject | null;
  }

  export
  class JSONField implements IJSONField {

    constructor(value: JSONObject) {
      this.name = value.name as string | undefined || '';
      this.type = value.type as string | undefined || 'string';
      this.format = value.format as string | undefined || '';
      this.title = value.title as string | undefined || '';
      this.description = value.description as string | undefined || '';
      this.constraints = value.constraints as JSONObject | undefined || null;
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
      newFields.push(new JSONDataModel.JSONField(field as JSONObject));
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