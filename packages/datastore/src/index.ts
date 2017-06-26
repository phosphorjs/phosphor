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
 * A lightweight data store which largely follows the redux pattern.
 *
 * #### Notes
 * The `S` type parameter is an interface defining the state shape.
 *
 * The `A` type parameter is a union type of all actions supported
 * by the instance of the data store. This type parameter ensures
 * that compatable reducers and listeners are used with the store.
 *
 * More information on redux can be found at: http://redux.js.org
 */
export
class DataStore<S, A extends DataStore.IAction> {
  /**
   * Construct a new data store.
   *
   * @param reducer - The root reducer function for the data store.
   *
   * @param state - The initial state for the data store.
   */
  constructor(reducer: DataStore.Reducer<S, A>, state: S) {
    this._reducer = reducer;
    this._state = state;
  }

  /**
   * A signal emitted when the data store state is changed.
   */
  get changed(): ISignal<this, void> {
    return this._changed;
  }

  /**
   * The current state of the data store.
   *
   * #### Notes
   * The state **must** be treated as immutable.
   *
   * The only way to change the state is to dispatch an action.
   * See the redux docs for more info: http://redux.js.org
   */
  get state(): S {
    return this._state;
  }

  /**
   * Dispatch an action to the data store.
   *
   * @param action - The action to dispatch to the store.
   *
   * #### Notes
   * After the action is dispatched, the matching changed signals will
   * be emitted to allow the app to update itself for the new state.
   */
  dispatch(action: A): void {
    // Disallow recursive dispatch.
    if (this._dispatching) {
      throw new Error('Recursive dispatch detected.');
    }

    // Set the dispatch guard.
    this._dispatching = true;

    // Look up the root reducer.
    let reducer = this._reducer;

    // Invoke the reducer.
    try {
      this._state = reducer(this._state, action);
    } finally {
      this._dispatching = false;
    }

    // Emit the `changed` signal.
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
   *
   * #### Notes
   * Custom actions may be derived from this interface.
   */
  export
  interface IAction {
    /**
     * The type of the action.
     *
     * #### Notes
     * The data store treats `'*`' as a subscription wildcard, so
     * **it's best to not use that character as an action type.**
     */
    readonly type: string;
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
