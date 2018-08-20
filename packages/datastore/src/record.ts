/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ReadonlyJSONValue
} from '@phosphor/coreutils';

import {
  Field, ValueField
} from './fields';

import {
  List
} from './list';

import {
  Map
} from './map';

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
  Record.BaseState & Record.MutableState<S> & Record.ReadonlyState<S>
);


/**
 * The namespace for the `Record` type statics.
 */
export
namespace Record {
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
   * A type alias for the mutable state of a record.
   */
  export
  type MutableState<S extends Schema> = {
    [N in MutableFieldNames<S>]: S['fields'][N]['ValueType'];
  };

  /**
   * A type alias for the readnly state of a record.
   */
  export
  type ReadonlyState<S extends Schema> = {
    readonly [N in ReadonlyFieldNames<S>]: S['fields'][N]['ValueType'];
  };

  /**
   * A type alias for a record change set.
   */
  export
  type ChangeSet<S extends Schema> = {
    readonly [N in FieldNames<S>]?: S['fields'][N]['ChangeType'];
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
   * Create a factory function for creating new records.
   *
   * @param parent - The parent table object.
   *
   * @param schema - The schema for the records.
   *
   * @returns A factory function for creating new records.
   *
   * #### Notes
   * This function is an internal implementation detail.
   */
  export
  function createFactory<S extends Schema>(parent: Table, schema: S): Factory<S> {
    // Create the record prototype.
    const prototype: any = {};

    // Create the prototype properties.
    for (let fieldName in schema.fields) {
      let field = schema.fields[fieldName];
      switch (field.type) {
      case 'list':
      case 'map':
      case 'text':
        Object.defineProperty(prototype, fieldName, {
          get: createPropertyGetter(field),
          enumerable: true,
          configurable: false
        });
        break;
      case 'value':
        Object.defineProperty(prototype, fieldName, {
          get: createRegisterGetter(field),
          set: createRegisterSetter(field, fieldName),
          enumerable: true,
          configurable: false
        });
        break;
      default:
        throw 'unreachable';
      }
    }

    // Create the record factory function.
    function createRecord(id: string): Record<S> {
      let record = Object.create(prototype);
      record.$parent = parent;
      record.$id = id;
      for (let fieldName in schema.fields) {
        let field = schema.fields[fieldName];
        switch (field.type) {
        case 'list':
          record[field.uuid] = List.create(record, fieldName);
          break;
        case 'map':
          record[field.uuid] = Map.create(record, fieldName);
          break;
        case 'text':
          record[field.uuid] = Text.create(record, fieldName);
          break;
        case 'value':
          record[field.uuid] = null;
          break;
        default:
          throw 'unreachable';
        }
      }
      return record;
    }

    // Return the record factory function.
    return createRecord;
  }

  /**
   * Create a getter function for a record property.
   */
  function createPropertyGetter(field: Field): () => any {
    return function() { return this[field.uuid]; };
  }

  /**
   * Create a getter function for a record register.
   */
  function createRegisterGetter(field: ValueField): () => ReadonlyJSONValue {
    return function() {
      // Fetch the entry for the register.
      let entry = this[field.uuid] as IEntry | null;

      // Return the current or default value as appropriate.
      return entry ? entry.value : field.value;
    };
  }

  /**
   * Create a setter function for a record register.
   */
  function createRegisterSetter(field: ValueField, fieldName: string): (value: ReadonlyJSONValue) => void {
    return function(value: ReadonlyJSONValue) {
      // Fetch the relevant ancestors.
      let table = (this as Record).$parent;
      let store = table.parent;

      // Guard against disallowed mutations.
      store.mutationGuard();

      // Fetch the clock and store id.
      let clock = store.clock;
      let storeId = store.id;

      // Fetch the current entry for the register.
      let entry = this[field.uuid] as IEntry | null;

      // Fetch the previous value.
      let previous = entry ? entry.value : field.value;

      // Determine the next entry in the chain.
      let next = field.undoable ? entry : null;

      // Replace the current entry if it's during the same mutation.
      next = (next && next.clock === clock) ? next.next : next;

      // Create the new entry for the register.
      this[field.uuid] = { value, clock, storeId, next };

      // Notify the store of the mutation.
      store.processRegisterMutation(this, fieldName, previous, value);
    };
  }

  /**
   * An object which represents a register entry.
   */
  interface IEntry {
    /**
     * The value for the entry.
     */
    readonly value: ReadonlyJSONValue;

    /**
     * The clock value when the entry was created.
     */
    readonly clock: number;

    /**
     * The id of the data store which created the entry.
     */
    readonly storeId: number;

    /**
     * The next entry in the list.
     */
    next: IEntry | null;
  }
}
