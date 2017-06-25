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
   * Get a changed signal for a specific action type.
   *
   * @param type - The action type of interest.
   *
   * @returns A signal emitted after a matching action is dispatched.
   *
   * #### Notes
   * The `'*'` type can be used to get a signal which is emitted for
   * *any* change to the data store.
   */
  changed(type: A['type'] | '*'): ISignal<this, A> {
    return this._signals[type] || (this._signals[type] = new Signal<this, A>(this));
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

    // Look up the action-specific signal.
    let specific = this._signals[action.type];

    // Emit the action-specific signal if it exists.
    if (specific) {
      specific.emit(action);
    }

    // Look up the generic changed signal.
    let generic = this._signals['*'];

    // Emit the generic changed signal if it exists.
    if (generic) {
      generic.emit(action);
    }
  }

  private _state: S;
  private _dispatching = false;
  private _reducer: DataStore.Reducer<S, A>;
  private _signals = Private.createSignalMap<this, A>();
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


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for a string-keyed signal map.
   */
  export
  type SignalMap<T, U> = { [key: string]: Signal<T, U> };

  /**
   * Create a new empty signal map.
   */
  export
  function createSignalMap<T, U>(): SignalMap<T, U> {
    return Object.create(null);
  }
}
