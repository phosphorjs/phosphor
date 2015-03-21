/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.core {

/**
 * A concrete implementation of IDisposable.
 *
 * A Disposable invokes a user provided callback when disposed.
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

} // module phosphor.core
