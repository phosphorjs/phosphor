/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * A runtime object which captures compile-time type information.
 *
 * #### Notes
 * A token captures the compile-time type of an interface or class in
 * an object which can be used at runtime in a type-safe fashion.
 */
export
class Token<T> {
  /**
   * Construct a new token.
   *
   * @param name - A human readable name for the token.
   */
  constructor(name: string) {
    this.name = name;
    this._tokenStructuralPropertyT = null!;
  }

  /**
   * The human readable name for the token.
   *
   * #### Notes
   * This can be useful for debugging and logging.
   */
  readonly name: string;

  // @ts-ignore
  private _tokenStructuralPropertyT: T;
}
