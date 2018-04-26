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
class DatastoreInternal {
  /**
   *
   */
  get id(): number {
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
  registerBroadcastListRemove(path: string, id: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  registerBroadcastListInsert(path: string, id: string, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  registerUserListRemove(path: string, index: number, value: ReadonlyJSONValue): void {

  }

  /**
   *
   */
  registerUserListInsert(path: string, index: number, value: ReadonlyJSONValue): void {

  }
}


/**
 *
 */
export
namespace DatastoreInternal {
  /**
   *
   */
  export
  interface IListSnapshot<T extends ReadonlyJSONValue> {
    /**
     *
     */
    readonly clock: number;

    /**
     *
     */
    readonly values: { readonly [id: string]: T };
  }

  /**
   *
   */
  export
  interface IListUpdate<T extends ReadonlyJSONValue> {
    /**
     *
     */
    readonly clock: number;

    /**
     *
     */
    readonly removed: { readonly [id: string]: T };

    /**
     *
     */
    readonly inserted: { readonly [id: string]: T };
  }
}
