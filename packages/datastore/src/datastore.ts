/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDBRoot
} from './dbroot';

import {
  IModelDB
} from './modeldb';


/**
 * An object which represents an action for a data store.
 *
 * #### Notes
 * Actions are dispatched to a data store to change the model state.
 */
export
interface IAction {
  /**
   * The type of the action.
   */
  readonly type: string;
}


/**
 * A concrete implementation of `IAction`.
 *
 * #### Notes
 * Custom actions may derive from this class.
 *
 * This class is useful for creating strongly-type actions which
 * are combined into a discriminated union, and used from within
 * a `switch` statement inside a handler.
 */
export
class Action<T extends string> implements IAction {
  /**
   * Construct a new action.
   *
   * @param type - The type of the action.
   */
  constructor(type: T) {
    this.type = type;
  }

  /**
   * The type of the action.
   */
  readonly type: T;
}


/**
 * A type alias for a handler function.
 *
 * @param db - The model db to modify.
 *
 * @param action - The action to perform on the model.
 *
 * #### Notes
 * Handlers are always invoked from within a db transaction.
 */
export
type Handler = (db: IModelDB, action: IAction) => void;


/**
 * An object which manages the mutable state of a model db.
 *
 * #### Notes
 * This class wraps a model db to provide a "redux-like" API where the
 * model state can only be changed by dispatching actions to the store.
 *
 * The store's action handler (analagous to a "reducer") is invoked
 * within a `db.transact()` block to enable it to modify the model.
 *
 * Consumers of the store do not have direct access the model db, and
 * therefore cannot modify its state without dispatching an action.
 */
export
class DataStore {
  /**
   * Construct a new data store.
   *
   * @param db - The model db which holds the application state.
   *
   * @param handler - The action handler for the store.
   */
  constructor(db: IModelDB, handler: Handler) {
    this._db = db;
    this._handler = handler;
  }

  // TODO expose canUndo/canRedo state?

  get state(): IDBRoot {
    return this._db.root;
  }

  /**
   * Dispatch an action to the data store.
   *
   * @param action - The action(s) to dispatch to the store.
   */
  dispatch(action: IAction | IAction[]): void {
    let db = this._db;
    let handler = this._handler;
    if (Array.isArray(action)) {
      db.transact(() => { for (let act of action) handler(db, act); });
    } else {
      db.transact(() => { handler(db, action); });
    }
  }

  private _db: IModelDB;
  private _handler: Handler;
}
