/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 *
 */
export
class PromiseDelegate<T> {
  /**
   *
   */
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  /**
   *
   */
  readonly promise: Promise<T>;

  /**
   *
   */
  resolve(value: T): void {
    this._resolve.call(undefined, value);
  }

  /**
   *
   */
  reject(error: any): void {
    this._reject.call(undefined, error);
  }

  private _resolve: (value: T) => void;
  private _reject: (error: any) => void;
}
