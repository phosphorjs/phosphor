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
  IRecord
} from './record';

import {
  Schema
} from './schema';

// import {
//   IServer
// } from './server';

import {
  ITable
} from './table';


/**
 * A multi-user collaborative data store.
 */
export
interface IDatastore {
  /**
   * The patch server which drives the data store.
   */
  // readonly server: IPatchServer;

  /**
   * Make changes to the the datastore.
   *
   * @param fn - The function that will edit the datastore. The unique
   *   patch id is provided as the first argument. All changes made by
   *   the function are associated with the given patch id.
   *
   * @returns The unique patch id.
   *
   * #### Notes
   * The datastore can only be modified during a patch operation.
   *
   * The patch function is invoked synchronously.
   */
  patch(fn: (patchId: string) => void): string;

  /**
   * Undo one or more patches to the datastore.
   *
   * @param patchId - The patch(es) to undo.
   *
   * @returns A promise which resolves when the action is complete.
   */
  undo(patchId: string | IterableOrArrayLike<string>): Promise<void>;

  /**
   * Redo one or more patches to the datastore.
   *
   * @param patchId - The patch(es) to redo.
   *
   * @returns A promise which resolves when the action is complete.
   */
  redo(patchId: string | IterableOrArrayLike<string>): Promise<void>;

  /**
   * Get the root record for a particular schema.
   *
   * @param schema - The schema of interest.
   *
   * @returns The root record for the given schema.
   */
  getRecord<S extends Schema>(schema: S): IRecord<S>;

  /**
   * Get the table for a particular schema.
   *
   * @param schema - The schema of interest.
   *
   * @returns The table for the given schema.
   */
  getTable<S extends Schema>(schema: S): ITable<S>;
}


/**
 *
 */
export
function createDatastore(): Promise<IDatastore> {
  throw '';
}
