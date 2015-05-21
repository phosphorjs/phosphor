/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.di {

/**
 * A token object which holds compile-time type information.
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
   * Get the human readable name for the token.
   */
  get name(): string {
    return this._name;
  }

  private _name: string;
  private _token_structural_property: any;
}

} // module phosphor.di
