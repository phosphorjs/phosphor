/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * An object which represents an action.
 *
 * #### Notes
 * Custom actions may implement this interface.
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
