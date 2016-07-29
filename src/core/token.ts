/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
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
 * an object which is useful for various type-safe runtime operations.
 *
 * #### Example
 * ``` typescript
 * interface IThing {
 *   value: number;
 * }
 *
 * const IThing = new Token<IThing>('my-module/IThing');
 *
 * // some runtime type registry
 * registry.registerFactory(IThing, () => { value: 42 });
 *
 * // later...
 * let thing = registry.getInstance(IThing);
 * thing.value; // 42
 * ```
 */
export
class Token<T> {
  /**
   * Construct a new token.
   *
   * @param name - A human readable name for the token.
   */
  constructor(name: string) {
    this._name = name;
  }

  /**
   * The human readable name for the token.
   *
   * #### Notes
   * This can be useful for debugging and logging.
   *
   * This is a read-only property.
   */
  get name(): string {
    return this._name;
  }

  private _name: string;
  private _tokenStructuralPropertyT: T;
}
