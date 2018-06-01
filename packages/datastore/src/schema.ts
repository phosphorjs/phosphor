/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Field
} from './fields';


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
   */
  readonly fields: { readonly [name: string]: Field };
};
