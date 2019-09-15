/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONObject
} from '@phosphor/coreutils';

import {
  DataModel
} from './datamodel';


/**
 * A data model implementation for in-memory JSON data.
 */
export
class JSONModel extends DataModel {
  /**
   * Create a data model with static JSON data.
   *
   * @param options - The options for initializing the data model.
   */
  constructor(options: JSONModel.IOptions) {
    super();
    let split = Private.splitFields(options.schema);
    this._data = options.data;
    this._bodyFields = split.bodyFields;
    this._headerFields = split.headerFields;
    this._missingValues = Private.createMissingMap(options.schema);
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
    }
    return 1;  // TODO multiple column-header rows?
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
      return this._bodyFields.length;
    }
    return this._headerFields.length;
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
   *
   * #### Notes
   * A `missingValue` as defined by the schema is converted to `null`.
   */
  data(region: DataModel.CellRegion, row: number, column: number): any {
    // Set up the field and value variables.
    let field: JSONModel.Field;
    let value: any;

    // Look up the field and value for the region.
    switch (region) {
    case 'body':
      field = this._bodyFields[column];
      value = this._data[row][field.name];
      break;
    case 'column-header':
      field = this._bodyFields[column];
      value = field.title || field.name;
      break;
    case 'row-header':
      field = this._headerFields[column];
      value = this._data[row][field.name];
      break;
    case 'corner-header':
      field = this._headerFields[column];
      value = field.title || field.name;
      break;
    default:
      throw 'unreachable';
    }

    // Test whether the value is a missing value.
    let missing = (
      this._missingValues !== null &&
      typeof value === 'string' &&
      this._missingValues[value] === true
    );

    // Return the final value.
    return missing ? null : value;
  }

  /**
   * Get the metadata for a cell in the data model.
   *
   * @param region - The cell region of interest.
   *
   * @param row - The row index of the cell of of interest.
   *
   * @param column - The column index of the cell of interest.
   *
   * @returns The metadata for the cell.
   */
  metadata(region: DataModel.CellRegion, row: number, column: number): DataModel.Metadata {
    if (region === 'body' || region === 'column-header') {
      return this._bodyFields[column];
    }
    return this._headerFields[column];
  }

  private _data: JSONModel.DataSource;
  private _bodyFields: JSONModel.Field[];
  private _headerFields: JSONModel.Field[];
  private _missingValues: Private.MissingValuesMap | null;
}


/**
 * The namespace for the `JSONModel` class statics.
 */
export
namespace JSONModel {
  /**
   * An object which describes a column of data in the model.
   *
   * #### Notes
   * This is based on the JSON Table Schema specification:
   * https://specs.frictionlessdata.io/table-schema/
   */
  export
  type Field = {
    /**
     * The name of the column.
     *
     * This is used as the key to extract a value from a data record.
     * It is also used as the column header label, unless the `title`
     * property is provided.
     */
    readonly name: string;

    /**
     * The type of data held in the column.
     */
    readonly type?: string;

    /**
     * The format of the data in the column.
     */
    readonly format?: string;

    /**
     * The human readable name for the column.
     *
     * This is used as the label for the column header.
     */
    readonly title?: string;

    // TODO want/need support for any these?
    // description?: string;
    // constraints?: IConstraints;
    // rdfType?: string;
  };

  /**
   * An object when specifies the schema for a data model.
   *
   * #### Notes
   * This is based on the JSON Table Schema specification:
   * https://specs.frictionlessdata.io/table-schema/
   */
  export
  type Schema = {
    /**
     * The fields which describe the data model columns.
     *
     * Primary key fields are rendered as row header columns.
     */
    readonly fields: Field[];

    /**
     * The values to treat as "missing" data.
     *
     * Missing values are automatically converted to `null`.
     */
    readonly missingValues?: string[];

    /**
     * The field names which act as primary keys.
     *
     * Primary key fields are rendered as row header columns.
     */
    readonly primaryKey?: string | string[];

    // TODO want/need support for this?
    // foreignKeys?: IForeignKey[];
  };

  /**
   * A type alias for a data source for a JSON data model.
   *
   * A data source is an array of JSON object records which represent
   * the rows of the table. The keys of the records correspond to the
   * field names of the columns.
   */
  export
  type DataSource = ReadonlyArray<ReadonlyJSONObject>;

  /**
   * An options object for initializing a JSON data model.
   */
  export
  interface IOptions {
    /**
     * The schema for the for the data model.
     *
     * The schema should be treated as an immutable object.
     */
    schema: Schema;

    /**
     * The data source for the data model.
     *
     * The data model takes full ownership of the data source.
     */
    data: DataSource;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which holds the results of splitting schema fields.
   */
  export
  type SplitFieldsResult = {
    /**
     * The non-primary key fields to use for the grid body.
     */
    bodyFields: JSONModel.Field[];

    /**
     * The primary key fields to use for the grid headers.
     */
    headerFields: JSONModel.Field[];
  };

  /**
   * Split the schema fields into header and body fields.
   */
  export
  function splitFields(schema: JSONModel.Schema): SplitFieldsResult {
    // Normalize the primary keys.
    let primaryKeys: string[];
    if (schema.primaryKey === undefined) {
      primaryKeys = [];
    } else if (typeof schema.primaryKey === 'string') {
      primaryKeys = [schema.primaryKey];
    } else {
      primaryKeys = schema.primaryKey;
    }

    // Separate the fields for the body and header.
    let bodyFields: JSONModel.Field[] = [];
    let headerFields: JSONModel.Field[] = [];
    for (let field of schema.fields) {
      if (primaryKeys.indexOf(field.name) === -1) {
        bodyFields.push(field);
      } else {
        headerFields.push(field);
      }
    }

    // Return the separated fields.
    return { bodyFields, headerFields };
  }

  /**
   * A type alias for a missing value map.
   */
  export
  type MissingValuesMap = { [key: string]: boolean };

  /**
   * Create a missing values map for a schema.
   *
   * This returns `null` if there are no missing values.
   */
  export
  function createMissingMap(schema: JSONModel.Schema): MissingValuesMap | null {
    // Bail early if there are no missing values.
    if (!schema.missingValues || schema.missingValues.length === 0) {
      return null;
    }

    // Collect the missing values into a map.
    let result: MissingValuesMap = Object.create(null);
    for (let value of schema.missingValues) {
      result[value] = true;
    }

    // Return the populated map.
    return result;
  }
}
