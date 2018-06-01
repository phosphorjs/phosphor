/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DSHandler
} from './dshandler';

import {
  DSList
} from './dslist';

import {
  DSMap
} from './dsmap';

import {
  DSRegister
} from './dsregister';

// import {
//   DSText
// } from './dstext';

import {
  Record
} from './record';

import {
  Schema
} from './schema';


/**
 * A datastore record implementation.
 */
export
namespace DSRecord {
  /**
   * A type alias for a record factory function.
   */
  export
  type Factory<S extends Schema> = (id: string) => Record<S>;

  /**
   * Create a factory function for creating new records.
   *
   * @param handler - The datastore handler object.
   *
   * @param schema - The schema for the records.
   *
   * @returns A factory function for creating new records.
   */
  export
  function createFactory<S extends Schema>(handler: DSHandler, schema: S): Factory<S> {
    // Create the record prototype.
    const prototype: any = {};

    // Fetch common properties.
    let schemaId = schema.id;
    let fields = schema.fields;

    // Create the prototype properties.
    for (let fieldName in fields) {
      let field = fields[fieldName];
      let key = field['@@ValueKey'];
      switch (field.type) {
      case 'list':
      case 'map':
      case 'text':
        Object.defineProperty(prototype, fieldName, {
          get: createPropertyGetter(key),
          enumerable: true,
          configurable: false
        });
        break;
      case 'value':
        Object.defineProperty(prototype, fieldName, {
          get: createRegisterGetter(key),
          set: createRegisterSetter(key),
          enumerable: true,
          configurable: false
        });
        break;
      default:
        throw 'unreachable';
      }
    }

    // Create the record factory function.
    function createRecord(recordId: string): Record<S> {
      let record = Object.create(prototype);
      record[Record.Id] = recordId;
      for (let fieldName in fields) {
        let field = fields[fieldName];
        let key = field['@@ValueKey'];
        switch (field.type) {
        case 'list':
          record[key] = new DSList(handler, schemaId, recordId, fieldName);
          break;
        case 'map':
          record[key] = new DSMap(handler, schemaId, recordId, fieldName);
          break;
        case 'text':
          //record[key] = new DSText(handler, schemaId, recordId, fieldName);
          break;
        case 'value':
          record[key] = new DSRegister(handler, schemaId, recordId, fieldName);
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
  function createPropertyGetter(key: symbol): () => any {
    return function() { return this[key]; };
  }

  /**
   * Create a getter function for a record register.
   */
  function createRegisterGetter(key: symbol): () => any {
    return function() { return (this[key] as DSRegister).get(); };
  }

  /**
   * Create a setter function for a record register.
   */
  function createRegisterSetter(key: symbol): (value: any) => void {
    return function(value: any) { (this[key] as DSRegister).set(value); };
  }
}
