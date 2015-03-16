/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {


/**
 * An object which holds disposable resources.
 */
export
interface IDisposable {
  /**
   * Dispose of the resources held by the object.
   *
   * It is not safe to use an object after it has been disposed.
   */
  dispose(): void;
}

} // module phosphor.core
