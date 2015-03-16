/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.di {


/**
 * A class type which declares its injection dependencies.
 */
export
interface IInjectable<T> {
  /**
   * The constructor signature for the class.
   */
  new(...args: any[]): T;

  /**
   * The type ids of the dependencies needed to instantiate the type.
   */
  $inject?: string[];
}

} // module phosphor.di
