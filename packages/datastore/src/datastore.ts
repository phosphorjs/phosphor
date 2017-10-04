/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IIterable, IIterator, IRetroable, IterableOrArrayLike
} from '@phosphor/algorithm';

import {
  JSONArray, JSONObject, ReadonlyJSONValue, Token
} from '@phosphor/coreutils';

import {
  ISignal
} from '@phosphor/signaling';


/**
 * An object which represents an action for a data store.
 *
 * #### Notes
 * This class may be subclassed to create complex action types.
 */
export
class Action {
  /**
   * Construct a new action.
   *
   * @param type - The type of the action.
   */
  constructor(type: string) {
    this.type = type;
  }

  /**
   * The type of the action.
   *
   * #### Notes
   * The `type` of an action should be related directly to its actual
   * runtime type. This means that `type` can and will be used to cast
   * the action to the relevant derived `Action` subtype.
   */
  readonly type: string;
}


/**
 * A type alias for an action handler function.
 *
 * @param state - The data store which holds the state.
 *
 * @param action - The action to perform on the store.
 *
 * @returns Whether the given action was handled.
 */
export
type Handler = (store: IDataStore, action: Action) => boolean;


/**
 * A state store which enforces unidirectional dataflow.
 */
export
interface IDataStore {
  /**
   * A signal emitted when the data store changes.
   *
   * #### Notes
   * This signal is emitted asynchronously.
   */
  readonly changed: ISignal<IDataStore, IDataStore.IChangedArgs>;

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
   * Dispatch an action to the data store.
   *
   * @param action - The action(s) to dispatch to the store.
   *
   * @throws An exception if this method is called recursively.
   *
   * #### Notes
   * The data store state can only be modified during dispatch.
   */
  dispatch(action: Action | Action[]): void;

  /**
   * Add an action handler to the data store.
   *
   * @param handler - The action handler of interest.
   *
   * #### Notes
   * A message hook is invoked before a message is delivered to the
   * handler. If the hook returns `false`, no other hooks will be
   * invoked and the message will not be delivered to the handler.
   *
   * The most recently installed message hook is executed first.
   *
   * If the hook is already installed, this is a no-op.
   */
  addHandler(handler: Handler): void;

  /**
   *
   */
  removeHandler(handler: Handler): void;

  /**
   *
   */
  tables(): IIterator<ITable<ITable.Schema>>;

  /**
   * Create a new table.
   *
   * @param token - The token for the table.
   *
   * @param records - The initial records for the table.
   *
   * @returns The new db table populated with the initial records.
   *
   * @throws An exception if the table has already been created.
   */
  createTable<T extends ITable.Schema>(schema: T): ITable<T>;

  /**
   * Test whether a specific table has been created.
   *
   * @param token - The token for the table of interest.
   *
   * @returns `true` if the table has been created, `false` otherwise.
   */
  hasTable<T extends ITable.Schema>(schema: T): boolean;

  /**
   * Get the table for a specific token.
   *
   * @param token - The token for the table of interest.
   *
   * @returns The table for the specified token.
   *
   * @throws An exception the table has not yet been created.
   */
  getTable<T extends ITable.Schema>(schema: T): ITable<T>;

  /**
   * Delete a table from the model db.
   *
   * @param token - The token for the table to delete.
   *
   * @throws An exception the table has not yet been created.
   */
  deleteTable<T extends ITable.Schema>(schema: T): void;
}
