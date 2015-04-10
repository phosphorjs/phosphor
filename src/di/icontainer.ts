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
  $inject?: IToken<any>[];
}


/**
 * An object which manages dependency injection.
 */
export
interface IContainer {
  /**
   * Test whether a type is registered with the container.
   */
  isRegistered<T>(token: IToken<T>): boolean;

  /**
   * Register a type mapping with the container.
   *
   * An exception will be thrown if the token is already registered.
   *
   * The allowed lifetimes are:
   *
   *   'singleton' - Only a single instance of the type is ever
   *      created, and that instance is shared by all objects
   *      which have a dependency on the given type id.
   *
   *   'transient' - A new instance of the type is created each
   *      time the dependency is fullfilled for an object which
   *      has a dependency on the given type id.
   *
   *   'perresolve' - A single instance of the type is created
   *      each time the `resolve` method is called, and that
   *      instance is shared by all objects which are created
   *      during the same resolve pass and have a dependency
   *      on the given type id.
   *
   * The default lifetime is 'singleton'.
   */
  registerType<T>(token: IToken<T>, type: IInjectable<T>, lifetime?: string): void;

  /**
   * Register an instance mapping with the container.
   *
   * This is the same as a 'singleton' type registration, except
   * that the user creates the instance of the type beforehand.
   *
   * This will throw an exception if the token is already registered.
   */
  registerInstance<T>(token: IToken<T>, instance: T): void;

  /**
   * Resolve an instance for the given token or type.
   *
   * An error is thrown if no type mapping is registered for the
   * token or if the injection dependencies cannot be fulfilled.
   */
  resolve<T>(token: IToken<T> | IInjectable<T>): T;
}


export
var IContainer = createToken<IContainer>('phosphor.di.IContainer');

} // module phosphor.di
