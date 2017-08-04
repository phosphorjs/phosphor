/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  ReadonlyJSONValue, Token
} from '@phosphor/coreutils';

import {
  IDBList
} from './dblist';

import {
  IDBMap
} from './dbmap';

import {
  DBRecord
} from './dbrecord';

import {
  IDBRoot
} from './dbroot';

import {
  IDBString
} from './dbstring';

import {
  IDBTable
} from './dbtable';


/**
 * An object which stores application state in a db-like fashion.
 */
export
interface IModelDB {
  /**
   * The db root of the model.
   */
  readonly root: IDBRoot;

  // TODO - notification for canUndo/canRedo state change.

  /**
   * Whether the model can currently undo a transaction.
   */
  readonly canUndo: boolean;

  /**
   * Whether the model can currently redo an undone transaction.
   */
  readonly canRedo: boolean;

  /**
   * Undo the most recent transaction to the model.
   *
   * #### Notes
   * This is a no-op if `canUndo` is false.
   */
  undo(): void;

  /**
   * Redo the most recent undo operation on the model.
   *
   * #### Notes
   * This is a no-op if `canRedo` is false.
   */
  redo(): void;

  /**
   * Execute a transaction on the db.
   *
   * @param fn - The function to invoke to execute the transaction.
   *
   * @throws An exception if this method is called recursively.
   *
   * #### Notes
   * The db state can only be modified from with a transaction.
   *
   * Each transaction forms an undo checkpoint.
   */
  transact(fn: () => void): void;

  /**
   * Create a new DB list.
   *
   * @param values - The initial values for the list.
   *
   * @returns A new db list with the initial values.
   */
  createList<T extends ReadonlyJSONValue>(values?: IterableOrArrayLike<T>): IDBList<T>;

  /**
   * Create a new DB map.
   *
   * @param items - The initial items for the map.
   *
   * @returns A new db map with the initial items.
   */
  createMap<T extends ReadonlyJSONValue>(items?: { [key: string]: T }): IDBMap<T>;

  /**
   * Create a new DB string.
   *
   * @param value - The initial value for the string.
   *
   * @returns A new db string with the initial value.
   */
  createString(value?: string): IDBString;

  /**
   * Create a new DB record.
   *
   * @param state - The initial state for the record.
   *
   * @returns A new db record with the initial state.
   */
  createRecord<T extends DBRecord.State>(state: T): DBRecord<T>;

  /**
   * Create a new db table.
   *
   * @param records - The initial records for the table.
   *
   * @returns A new db table with the initial records.
   */
  createTable<T extends DBRecord.State>(token: Token<T>, records?: IterableOrArrayLike<DBRecord<T>>): IDBTable<T>;
}
