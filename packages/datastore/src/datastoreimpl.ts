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
  broadcastRegisterChange(schemaId: string, recordId: string, name: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyRegisterChange(schemaId: string, recordId: string, name: string, previous: ReadonlyJSONValue, current: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  broadcastListRemove(schemaId: string, recordId: string, name: string, valueId: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyListRemove(schemaId: string, recordId: string, name: string, index: number, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  broadcastListInsert(schemaId: string, recordId: string, name: string, valueId: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  notifyListInsert(schemaId: string, recordId: string, name: string, index: number, value: ReadonlyJSONValue): void {

  }
}


/**
 *
 */
export
namespace DatastoreImpl {
  /**
   * The minimum allowed store id.
   *
   * A store value of `0` indicates the initial default store.
   */
  const MIN_STORE = 0x00000001;

  /**
   * The maximum allowed store id.
   */
  const MAX_STORE = 0xFFFFFFFF;

  /**
   * The minimum allowed clock value.
   *
   * A clock value of `0` indicates the initial default clock.
   */
  const MIN_CLOCK = 0x000000000001;

  /**
   * The maximum allowed clock value.
   */
  const MAX_CLOCK = 0xFFFFFFFFFFFF;
}
