/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  List
} from './list';

import {
  Map
} from './map';

import {
  Register
} from './register';

import {
  Schema
} from './schema';

import {
  Table
} from './table';

import {
  Text
} from './text';


/**
 * A type alias for a data store record.
 */
export
type Record<S extends Schema = Schema> = (
  Record.BaseState & Record.FieldState<S>
);


/**
 * The namespace for the `Record` type statics.
 */
export
namespace Record {
  /**
   * A type alias for the base state of a record.
   */
  export
  type BaseState = {
    /**
     * The parent of the record.
     */
    readonly $parent: Table;

    /**
     * The unique id of the record.
     */
    readonly $id: string;
  };

  /**
   * A type alias for the readonly state of a record.
   */
  export
  type FieldState<S extends Schema> = {
    readonly [N in keyof S['fields']]: S['fields'][N]['ValueType'];
  };

  /**
   * A type alias for a record change set.
   */
  export
  type ChangeSet<S extends Schema> = {
    readonly [N in keyof S['fields']]?: S['fields'][N]['ChangeType'];
  };

  /**
   * @internal
   *
   * A type alias for a record factory function.
   *
   * #### Notes
   * This type is an internal implementation detail.
   */
  export
  type Factory<S extends Schema> = (id: string) => Record<S>;

  /**
   * @internal
   *
   * Create a record factory function for a table.
   *
   * @param parent - The parent table of the records.
   *
   * @returns A factory function for creating new records.
   *
   * #### Notes
   * This function is an internal implementation detail.
   */
  export
  function createFactory<S extends Schema>(parent: Table<S>): Factory<S> {
    // Create the prototype.
    let prototype: any = {};

    // Fetch the schema.
    let schema = parent.schema;

    // Define the protoype properties.
    for (let name in schema.fields) {
      let field = schema.fields[name];
      Object.defineProperty(prototype, name, {
        get: createPropertyGetter(field.uuid),
        enumerable: true,
        configurable: false
      });
    }

    // Define the factory function.
    function createRecord(id: string): Record<S> {
      // Create the record object.
      let record = Object.create(prototype);

      // Initialize the base state.
      record.$parent = parent;
      record.$id = id;

      // Initialize the field state.
      for (let name in schema.fields) {
        let field = schema.fields[name];
        switch (field.type) {
        case 'list':
          record[field.uuid] = List.create(record, name);
          break;
        case 'map':
          record[field.uuid] = Map.create(record, name);
          break;
        case 'register':
          record[field.uuid] = Register.create(record, name);
          break;
        case 'text':
          record[field.uuid] = Text.create(record, name);
          break;
        default:
          throw 'unreachable';
        }
      }

      // Return the new record.
      return record;
    }

    // Return the factory function.
    return createRecord;
  }

  /**
   * Create a getter function for a record property.
   */
  function createPropertyGetter(uuid: string): () => any {
    return function() { return this[uuid]; };
  }
}
