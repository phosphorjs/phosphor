/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.di {

/**
 * A lightweight dependency injection container.
 */
export
class Container implements IContainer {
  /**
   * Construct a new container.
   */
  constructor() { }

  /**
   * Test whether a type is registered with the container.
   */
  isRegistered<T>(token: IToken<T>): boolean {
    return this._registry.has(token);
  }

  /**
   * Register a type mapping with the container.
   *
   * An exception will be thrown if the type is already registered.
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
  registerType<T>(token: IToken<T>, type: IInjectable<T>, lifetime?: string): void {
    if (this._registry.has(token)) {
      throw new Error('token is already registered');
    }
    var lt = createLifetime<T>(lifetime || 'singleton');
    this._registry.set(token, { type: type, lifetime: lt });
  }

  /**
   * Register an instance mapping with the container.
   *
   * This is the same as a 'singleton' type registration, except
   * that the user creates the instance of the type beforehand.
   *
   * This will throw an exception if the token is already registered.
   */
  registerInstance<T>(token: IToken<T>, instance: T): void {
    if (this._registry.has(token)) {
      throw new Error('token is already registered');
    }
    var lt = new SingletonLifetime(instance);
    this._registry.set(token, { type: null, lifetime: lt });
  }

  /**
   * Resolve an instance for the given token or type.
   *
   * An error is thrown if no type mapping is registered for the
   * token or if the injection dependencies cannot be fulfilled.
   */
  resolve<T>(token: IToken<T> | IInjectable<T>): T {
    if (typeof token === 'function') {
      return this._resolveType(<IInjectable<T>>token, resolveKeyTick++);
    }
    return this._resolveToken(<IToken<T>>token, resolveKeyTick++);
  }

  /**
   * Resolve an instance for the given token.
   *
   * An error is thrown if the token is not registered.
   */
  private _resolveToken<T>(token: IToken<T>, key: number): T {
    var item: IRegistryItem<T> = this._registry.get(token);
    if (item === void 0) {
      throw new Error('`' + token.name + '` is not registered');
    }
    var instance = item.lifetime.get(key);
    if (instance) {
      return instance;
    }
    instance = this._resolveType(item.type, key);
    item.lifetime.set(key, instance);
    return instance;
  }

  /**
   * Resolve an instance of the given type.
   *
   * An error is thrown if the type dependencies cannot be fulfilled.
   */
  private _resolveType<T>(type: IInjectable<T>, key: number): T {
    var instance: T = Object.create(type.prototype);
    var deps = type.$inject;
    if (!deps || deps.length === 0) {
      return type.call(instance) || instance;
    }
    var args: any[] = [];
    for (var i = 0, n = deps.length; i < n; ++i) {
      args[i] = this._resolveToken(deps[i], key);
    }
    return type.apply(instance, args) || instance;
  }

  private _registry = new Map<IToken<any>, IRegistryItem<any>>();
}


/**
 * An internal resolve key counter.
 */
var resolveKeyTick = 0;


/**
 * An object which holds the data for a type registration.
 */
interface IRegistryItem<T> {
  /**
   * The type for the registration.
   */
  type: IInjectable<T>;

  /**
   * The lifetime for the registration.
   */
  lifetime: ILifetime<T>;
}


/**
 * An object which controls the resolve lifetime of a type.
 */
interface ILifetime<T> {
  /**
   * Get the cached object for the lifetime if one exists.
   */
  get(key: number): T;

  /**
   * Set the cached object for the lifetime if needed.
   */
  set(key: number, val: T): void;
}


/**
 * Create a lifetime object for the given string.
 */
function createLifetime<T>(lifetime: string): ILifetime<T> {
  if (lifetime === 'transient') {
    return transientInstance;
  }
  if (lifetime === 'singleton') {
    return new SingletonLifetime<T>();
  }
  if (lifetime === 'perresolve') {
    return new PerResolveLifetime<T>();
  }
  throw new Error('invalid lifetime: ' + lifetime);
}


/**
 * A lifetime which never caches its object.
 */
class TransientLifetime<T> implements ILifetime<T> {
  /**
   * Get the cached object for the lifetime.
   */
  get(key: number): T { return null; }

  /**
   * Set the cached object for the lifetime.
   */
  set(key: number, val: T): void { }
}


/**
 * Only a single transient lifetime instance is ever needed.
 */
var transientInstance = new TransientLifetime<any>();


/**
 * A lifetime which always caches its object.
 */
class SingletonLifetime<T> implements ILifetime<T> {
  /**
   * Construct a new singleton lifetime.
   */
  constructor(val: T = null) { this._val = val; }

  /**
   * Get the cached object for the lifetime if one exists.
   */
  get(key: number): T { return this._val; }

  /**
   * Set the cached object for the lifetime if needed.
   */
  set(key: number, val: T): void { this._val = val; }

  private _val: T;
}


/**
 * A lifetime which caches the instance on a per-resolve basis.
 */
class PerResolveLifetime<T> implements ILifetime<T> {
  /**
   * Get the cached object for the lifetime if one exists.
   */
  get(key: number): T { return this._key === key ? this._val : null; }

  /**
   * Set the cached object for the lifetime if needed.
   */
  set(key: number, val: T): void { this._key = key; this._val = val; }

  private _key = 0;
  private _val: T = null;
}

} // module phosphor.di
