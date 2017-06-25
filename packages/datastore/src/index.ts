/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ISignal, Signal
} from '@phosphor/signaling';


/**
 * A lightweight data store which follows the redux pattern.
 *
 * #### Notes
 * More information on redux can be found at: http://redux.js.org
 */
export
class DataStore<S extends object, A extends DataStore.IAction> {
  /**
   * Construct a new data store.
   *
   * @param reducer - The root reducer function for the store.
   */
  constructor(reducer: DataStore.Reducer<S, A>, state: S) {
    this._reducer = reducer;
    this._state = state;
  }

  /**
   * A signal emitted when the data store is changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * The current state of the data store.
   */
  get state(): S {
    return this._state;
  }

  /**
   * Dispatch an action to the data store.
   *
   * @param action - The action to dispatch to the store.
   */
  dispatch(action: A): void {
    // Do not allow recursive dispatch.
    if (this._dispatching) {
      throw new Error('Recursive dispatch detected.');
    }

    // Set the dispatch guard flag.
    this._dispatching = true;

    // Look up the root reducer.
    let reducer = this._reducer;

    // Invoke the reducer.
    try {
      this._state = reducer(this._state, action);
    } finally {
      this._dispatching = false;
    }

    // Emit the changed signal
    this._changed.emit(undefined);
  }

  private _state: S;
  private _dispatching = false;
  private _reducer: DataStore.Reducer<S, A>;
  private _changed = new Signal<this, void>(this);
}


/**
 * The namespace for the `DataStore` class statics.
 */
export
namespace DataStore {
  /**
   * An object which represents an action.
   */
  export
  interface IAction {
    /**
     * The type of the action.
     */
    type: string;
  }

  /**
   * A type alias for a reducer function.
   *
   * @param state - The current state of the application.
   *
   * @param action - The action to perform on the state.
   *
   * @returns The new state for the application.
   */
  export
  type Reducer<S, A extends IAction> = (state: S, action: A) => S;
}
