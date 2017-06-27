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

import {
  IAction
} from './action';

import {
  Reducer
} from './reducer';


/**
 * A lightweight data store which mostly follows the redux pattern.
 *
 * #### Notes
 * The `S` type parameter is an interface defining the state shape.
 *
 * More information on redux can be found at: http://redux.js.org
 */
export
class DataStore<S> {
  /**
   * Construct a new data store.
   *
   * @param reducer - The root reducer function for the data store.
   *
   * @param state - The initial state for the data store.
   */
  constructor(reducer: Reducer<S>, state: S) {
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
   */
  get state(): S {
    return this._state;
  }

  /**
   * Dispatch an action to the data store.
   *
   * @param action - The action(s) to dispatch to the store.
   *
   * #### Notes
   * An array of actions will be dispatched atomically.
   *
   * The `changed` signal is emitted only once per dispatch.
   */
  dispatch(action: IAction | IAction[]): void {
    // Disallow recursive dispatch.
    if (this._dispatching) {
      throw new Error('Recursive dispatch detected.');
    }

    // Set the dispatch guard.
    this._dispatching = true;

    // Set up the new state variable.
    let state: S;

    // Invoke the reducer and compute the new state.
    try {
      if (Array.isArray(action)) {
        state = Private.reduceMany(this._reducer, this._state, action);
      } else {
        state = Private.reduceSingle(this._reducer, this._state, action);
      }
    } finally {
      this._dispatching = false;
    }

    // Bail early if there is no state change.
    if (this._state === state) {
      return;
    }

    // Update the internal state.
    this._state = state;

    // Emit the `changed` signal.
    this._changed.emit(undefined);
  }

  private _state: S;
  private _reducer: Reducer<S>;
  private _dispatching = false;
  private _changed = new Signal<this, void>(this);
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Reduce a single action and return the new state.
   */
  export
  function reduceSingle<S>(reducer: Reducer<S>, state: S, action: IAction): S {
    return reducer(state, action);
  }

  /**
   * Reduce an array of actions and return the final state.
   */
  export
  function reduceMany<S>(reducer: Reducer<S>, state: S, actions: IAction[]): S {
    for (let i = 0, n = actions.length; i < n; ++i) {
      state = reducer(state, actions[i]);
    }
    return state;
  }
}
