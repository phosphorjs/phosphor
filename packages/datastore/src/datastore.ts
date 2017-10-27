/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IRecord
} from './record';

import {
  Schema
} from './schema';

import {
  IServer
} from './server';

import {
  ITable
} from './table';


/**
 *
 */
export
interface IDatastore {
  /**
   *
   */
  readonly server: IServer;

  /**
   *
   */
  undo(patchId: string | IterableOrArrayLike<T>): Promise<void>;

  /**
   *
   */
  redo(patchId: string | IterableOrArrayLike<T>): Promise<void>;

  /**
   *
   */
  patch(fn: (patchId: string) => void): string;

  /**
   *
   */
  roots(): IIterator<IRecord<Schema>>;

  /**
   *
   */
  tables(): IIterator<ITable<Schema>>;

  /**
   *
   */
  getRoot<S extends Schema>(schema: S): IRecord<S>;

  /**
   *
   */
  getTable<S extends Schema>(schema: S): ITable<S>;
}


/**
 *
 */
export
function createDatastore(server: IServer): Promise<IDatastore> { }
