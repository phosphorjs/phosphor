/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IAction
} from './action';


/**
 * A type alias for a reducer function.
 *
 * @param state - The current state of the application.
 *
 * @param action - The action to perform on the state.
 *
 * @returns The new state for the application.
 *
 * #### Notes
 * A reducer processes actions to update the data store state.
 */
export
type Reducer<S> = (state: S, action: IAction) => S;


/**
 * A type alias for a mapping of state branch to reducer.
 */
export
type ReducerMap<S> = { [K in keyof S]?: Reducer<S[K]>; };


/**
 * Create a single reducer from a mapping of reducers.
 *
 * @param reducers - A mapping of where each key is the name of a
 *   branch in the state object, and the value is a reducer to be
 *   applied to that branch.
 *
 * @returns A single combined reducer function.
 *
 * #### Notes
 * This function should only be used for state which is a vanilla
 * spreadable JS object.
 *
 * When the combined reducer is invoked, the new state is created by
 * applying each reducer in the map to its respective branch of the
 * state. State branches which are not included in the reducers map
 * are copied without modification into the result state.
 */
export
function combineReducers<S>(reducers: ReducerMap<S>): Reducer<S> {
  // https://github.com/Microsoft/TypeScript/issues/16780
  // Create a copy of the reducers map.
  reducers = { ...(reducers as any) } as ReducerMap<S>;

  // Return the combination reducer.
  return function combination(state: S, action: IAction): S {
    // https://github.com/Microsoft/TypeScript/issues/16780
    // Create a copy of the current state.
    let newState = { ...(state as any) } as S;

    // A flag tracking whether a change occurred.
    let changed = false;

    // Apply each reducer to the current state.
    for (let key in reducers) {
      // Look up the current reducer.
      let reducer = reducers[key];

      // Skip `undefined` reducers.
      if (!reducer) {
        continue;
      }

      // Look up the old state for the branch.
      let oldBranch = state[key];

      // Compute the new state for the branch.
      let newBranch = reducer(oldBranch, action);

      // Update the result state with the new branch.
      newState[key] = newBranch;

      // Update the changed flag.
      changed = changed || oldBranch !== newBranch;
    }

    // Return the new or old state based on the changed flag.
    return changed ? newState : state;
  }
}
