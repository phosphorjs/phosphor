/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * A generic pair of values.
 */
export
class Pair<T, U> {
  /**
   * Construct a new pair.
   */
  constructor(public first: T, public second: U) { }
}

} // module phosphor.utility
