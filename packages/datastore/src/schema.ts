/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  AnyField
} from './field';


/**
 * A type definition for a table schema.
 *
 * #### Notes
 * The datastore assumes that peers may safely collaborate on tables
 * which share the same schema `id`.
 *
 * The schema `id` must be changed whenever changes are made to the
 * schema, or undefined behavior will result.
 */
export
type Schema = {
  /**
   * The unique identifier for the schema.
   */
  readonly id: string;

  /**
   * The field definitions for the schema.
   *
   * #### Notes
   * Field names cannot begin with `$` or `@`.
   */
  readonly fields: { readonly [name: string]: AnyField };
};

const invalidFielnameLeads = ['$', '@'];

/**
 * Validate a schema definition.
 */
export
function validateSchema(schema: Schema): string[] {
  const errors = [];
  // Ensure that field names do not begin with `$` or `@`.
  for (let name in schema.fields) {
    if (invalidFielnameLeads.indexOf(name[0]) !== -1) {
      errors.push(
        `Invalid field name: '${name}'. Cannot start field name with '${name[0]}'`
      );
    }
  }
  return errors;
}
