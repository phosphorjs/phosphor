/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

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


/**
 * A concrete implementation of IDisposable.
 *
 * This will invoke a user provided callback when it is disposed.
 */
export
class Disposable implements IDisposable {
  /**
   * Construct a new disposable.
   */
  constructor(callback: () => void) {
    this._callback = callback;
  }

  /**
   * Dispose the object and invoke the user provided callback.
   */
  dispose(): void {
    var callback = this._callback;
    this._callback = null;
    if (callback) callback();
  }

  private _callback: () => void;
}

} // module phosphor.utility
