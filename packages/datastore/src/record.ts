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
type Record<S extends Schema> = Record.Base<S> & Record.Value<S>;


/**
 * The namespace for the `Record` type statics.
 */
export
namespace Record {
  /**
   * A type alias for the record base type.
   */
  export
  type Base<S extends Schema> = {
    /**
     * The unique id of the record.
     */
    readonly $id: string;

    /**
     * @internal
     *
     * The metadata for the record.
     */
    readonly '@@metadata': Metadata<S>;
  };

  /**
   * A type alias for the record value type.
   */
  export
  type Value<S extends Schema> = {
    readonly [N in keyof S['fields']]: S['fields'][N]['ValueType'];
  };

  /**
   * A type alias for the record update type.
   */
  export
  type Update<S extends Schema> = {
    readonly [N in keyof S['fields']]?: S['fields'][N]['UpdateType'];
  };

  /**
   * A type alias for the record change type.
   */
  export
  type Change<S extends Schema> = {
    readonly [N in keyof S['fields']]?: S['fields'][N]['ChangeType'];
  };

  /**
   * A type alias for the record patch type.
   */
  export
  type Patch<S extends Schema> = {
    readonly [N in keyof S['fields']]?: S['fields'][N]['PatchType'];
  };

  /**
   * @internal
   *
   * A type alias for the record metadata type.
   */
  export
  type Metadata<S extends Schema> = {
    readonly [N in keyof S['fields']]: S['fields'][N]['MetadataType'];
  };

  /**
   * @internal
   *
   * A type alias for the record mutable change type.
   */
  export
  type MutableChange<S extends Schema> = {
    [N in keyof S['fields']]?: S['fields'][N]['ChangeType'];
  };

  /**
   * @internal
   *
   * A type alias for the record mutable patch type.
   */
  export
  type MutablePatch<S extends Schema> = {
    [N in keyof S['fields']]?: S['fields'][N]['PatchType'];
  };
}
