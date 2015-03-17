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
interface IToken<T> {
  /**
   * A human readable name for the token.
   */
  name: string;

  /**
   * A hidden property which makes a token structurally unique.
   */
  __itoken_structural_property: any;
}


/**
 * Create a token with the given name.
 */
export
function createToken<T>(name: string): IToken<T> {
  return Object.freeze({ name: name });
}

} // module phosphor.di
