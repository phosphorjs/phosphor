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


/**
 *
 */
export
class DatastoreImpl {
  /**
   *
   */
  get id(): number {
    return 0;
  }

  /**
   *
   */
  get clock(): number {
    return 0;
  }

  /**
   *
   */
  assertMutationsAllowed(): void {

  }

  /**
   *
   */
  broadcastRecordCreate(schemaId: string, recordId: string): void {

  }

  /**
   *
   */
  notifyRecordCreate(schemaId: string, recordId: string): void {

  }

  /**
   *
   */
  broadcastRegisterChange(schemaId: string, recordId: string, fieldName: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyRegisterChange(schemaId: string, recordId: string, fieldName: string, previous: ReadonlyJSONValue, current: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  broadcastListRemove(schemaId: string, recordId: string, fieldName: string, valueId: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyListRemove(schemaId: string, recordId: string, fieldName: string, index: number, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  broadcastListInsert(schemaId: string, recordId: string, fieldName: string, valueId: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyListInsert(schemaId: string, recordId: string, fieldName: string, index: number, value: ReadonlyJSONValue): void {

  }
  
  /**
   *  
   */
  broadcastMapChange(schemaId: string, recordId: string, fieldName: string, key: string, value: ReadonlyJSONValue | undefined): void {

  }

  /**
   * 
   */
  notifyMapChange(schemaId: string, recordId: string, fieldName: string, key: string, previous: ReadonlyJSONValue | undefined, current: ReadonlyJSONValue | undefined): void {

  }
}


/**
 * The namespace for the `DatastoreImpl` class statics.
 */
export
namespace DatastoreImpl {
  /**
   * The minimum allowed store id.
   *
   * A store value of `0` indicates the initial default store.
   */
  export
  const MIN_STORE = 0x00000001;

  /**
   * The maximum allowed store id.
   */
  export
  const MAX_STORE = 0xFFFFFFFF;

  /**
   * The minimum allowed clock value.
   *
   * A clock value of `0` indicates the initial default clock.
   */
  export
  const MIN_CLOCK = 0x000000000001;

  /**
   * The maximum allowed clock value.
   */
  export
  const MAX_CLOCK = 0xFFFFFFFFFFFF;
}
