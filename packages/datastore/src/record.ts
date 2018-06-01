/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Schema
} from './schema';


/**
 * A type alias for a datastore record.
 */
export
type Record<S extends Schema> = (
  Record.BaseState & Record.MutableState<S> & Record.ReadonlyState<S>
);


/**
 * The namespace for the `Record` type statics.
 */
export
namespace Record {
  /**
   * A symbol for accesssing the id of a record.
   */
  export
  const Id = Symbol();

  /**
   * A type alias which extracts the field names from a schema.
   */
  export
  type FieldNames<S extends Schema> = keyof S['fields'];

  /**
   * A type alias which extracts the mutable field names from a schema.
   */
  export
  type MutableFieldNames<S extends Schema> = {
    [N in FieldNames<S>]: S['fields'][N]['type'] extends 'value' ? N : never;
  }[FieldNames<S>];

  /**
   * A type alias which extracts the readonly field names from a schema.
   */
  export
  type ReadonlyFieldNames<S extends Schema> = {
    [N in FieldNames<S>]: S['fields'][N]['type'] extends 'value' ? never : N;
  }[FieldNames<S>];

  /**
   * A type alias for the base state of a record.
   */
  export
  type BaseState = {
    readonly [Id]: string;
  };

  /**
   * A type alias for the mutable state of a record.
   */
  export
  type MutableState<S extends Schema> = {
    [N in MutableFieldNames<S>]: S['fields'][N]['@@ValueType'];
  };

  /**
   * A type alias for the readnly state of a record.
   */
  export
  type ReadonlyState<S extends Schema> = {
    readonly [N in ReadonlyFieldNames<S>]: S['fields'][N]['@@ValueType'];
  };

  /**
   * A type alias for a record change set.
   */
  export
  type ChangeSet<S extends Schema> = {
    readonly [N in FieldNames<S>]?: S['fields'][N]['@@ChangeType'];
  };
}
