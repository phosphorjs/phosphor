/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Field
} from './fields';


/**
 * A type definition for a schema.
 *
 * #### Notes
 * The combination of schema `name` and `version` number form a unique
 * identifier for the schema.
 *
 * The datastore assumes that peers may safely collaborate on tables
 * which share the same `name` and `version`.
 *
 * The `version` number **must** be incremented whenever changes are
 * made to the fields, or undefined behavior will result.
 */
export
type Schema = {
  /**
   * The unique name for the schema.
   */
  readonly name: string;

  /**
   * The version number of the schema.
   */
  readonly version: number;

  /**
   * The field definitions for the schema.
   */
  readonly fields: { readonly [key: string]: Field };
};
