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
