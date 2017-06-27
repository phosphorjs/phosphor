/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * An object which represents an action for a data store.
 *
 * #### Notes
 * Actions are dispatched to a data store to change its state.
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
 * a `switch` statement inside a reducer.
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
