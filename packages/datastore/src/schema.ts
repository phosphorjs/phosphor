/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ListField
} from './listfield';

import {
  MapField
} from './mapfield';

import {
  TextField
} from './textfield';

import {
  ValueField
} from './valuefield';


/**
 * A type alias for the field types supported by a data store.
 */
export
type Field = ListField | MapField | TextField | ValueField;


/**
 * A type definition for a schema.
 *
 * #### Notes
 * The datastore assumes that peers may safely collaborate on tables
 * and records which share the same schema `id`.
 *
 * The schema `id` **must** be changed whenever changes are made to
 * the schema, or undefined behavior will result.
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
  readonly fields: { readonly [key: string]: Field };
};
