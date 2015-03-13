/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import IInjectable = require('./IInjectable');

export = Container;


/**
 * A lightweight dependency injection container.
 */
class Container {
  /**
   * Construct a new container.
   */
  constructor() { }

  /**
   * Test whether a type id is registered with the container.
   */
  isRegistered(id: string): boolean {
    return id in this._m_registry;
  }

  /**
   * Register a type mapping with the container.
   *
   * An exception will be thrown if the type id is already registered.
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
  registerType(id: string, type: IInjectable<any>, lifetime?: string): void {
    if (id in this._m_registry) {
      throw new Error('id is already registered');
    }
    var lt = createLifetime(lifetime || 'singleton');
    this._m_registry[id] = { type: type, lifetime: lt };
  }

  /**
   * Register an instance mapping with the container.
   *
   * This is the same as a 'singleton' type registration, except
   * that the user creates the instance of the type beforehand.
   *
   * This will throw an exception if the type id is already registered.
   */
  registerInstance(id: string, instance: any): void {
    if (id in this._m_registry) {
      throw new Error('id is already registered');
    }
    var lt = new SingletonLifetime(instance);
    this._m_registry[id] = { type: null, lifetime: lt };
  }

  /**
   * Resolve an instance of the type registered for a type id.
   *
   * An error is thrown if no type is registered for the type id.
   */
  resolve(id: string): any;

  /**
   * Create an instance of the type injected with its dependencies.
   *
   * An error is thrown if the type dependencies cannot be fulfilled.
   */
  resolve<T>(type: IInjectable<T>): T;

  /**
   * Resolve an instance of a type or type id.
   */
  resolve(id: string | IInjectable<any>): any {
    var instance: any;
    var key = resolveKeyTick++;
    if (typeof id === 'string') {
      instance = this._resolveId(id, key);
    } else {
      instance = this._resolveType(id, key);
    }
    return instance;
  }

  /**
   * Resolve an instance for the given type id.
   *
   * An error is thrown if the type id is not registered.
   */
  private _resolveId(id: string, key: number): any {
    var item = this._m_registry[id];
    if (!item) {
      throw new Error('`' + id + '` is not registered');
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
  private _resolveType(type: IInjectable<any>, key: number): any {
    var deps = type.$inject;
    var instance = Object.create(type.prototype);
    if (!deps || deps.length === 0) {
      return type.call(instance) || instance;
    }
    var args: any[] = [];
    for (var i = 0, n = deps.length; i < n; ++i) {
      args[i] = this._resolveId(deps[i], key);
    }
    return type.apply(instance, args) || instance;
  }

  private _m_registry: { [key: string]: IRegistryItem } = Object.create(null);
}


/**
 * An internal resolve key counter.
 */
var resolveKeyTick = 0;


/**
 * An object which holds the data for a type registration.
 */
interface IRegistryItem {
  /**
   * The type for the registration.
   */
  type: IInjectable<any>;

  /**
   * The lifetime for the registration.
   */
  lifetime: ILifetime;
}


/**
 * An object which controls the resolve lifetime of a type.
 */
interface ILifetime {
  /**
   * Get the cached object for the lifetime if one exists.
   */
  get(key: number): any;

  /**
   * Set the cached object for the lifetime if needed.
   */
  set(key: number, val: any): void;
}


/**
 * Create a lifetime object for the given string.
 */
function createLifetime(lifetime: string): ILifetime {
  if (lifetime === 'transient') {
    return transientInstance;
  }
  if (lifetime === 'singleton') {
    return new SingletonLifetime();
  }
  if (lifetime === 'perresolve') {
    return new PerResolveLifetime();
  }
  throw new Error('invalid lifetime: ' + lifetime);
}


/**
 * A lifetime which never caches its object.
 */
class TransientLifetime implements ILifetime {
  /**
   * Get the cached object for the lifetime.
   */
  get(key: number): any { return null; }

  /**
   * Set the cached object for the lifetime.
   */
  set(key: number, val: any): void { }
}


/**
 * Only a single transient lifetime instance is ever needed.
 */
var transientInstance = new TransientLifetime();


/**
 * A lifetime which always caches its object.
 */
class SingletonLifetime implements ILifetime {
  /**
   * Construct a new singleton lifetime.
   */
  constructor(val: any = null) { this._m_val = val; }

  /**
   * Get the cached object for the lifetime if one exists.
   */
  get(key: number): any { return this._m_val; }

  /**
   * Set the cached object for the lifetime if needed.
   */
  set(key: number, val: any): void { this._m_val = val; }

  private _m_val: any;
}


/**
 * A lifetime which caches the instance on a per-resolve basis.
 */
class PerResolveLifetime implements ILifetime {
  /**
   * Get the cached object for the lifetime if one exists.
   */
  get(key: number): any { return this._m_key === key ? this._m_val : null; }

  /**
   * Set the cached object for the lifetime if needed.
   */
  set(key: number, val: any): void { this._m_key = key; this._m_val = val; }

  private _m_key = 0;
  private _m_val: any = null;
}
