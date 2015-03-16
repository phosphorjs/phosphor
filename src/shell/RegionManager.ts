/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import Disposable = core.Disposable;
import IDisposable = core.IDisposable;
import Signal = core.Signal;


/**
 * A concrete implementation of IRegionManager.
 */
export
class RegionManager implements IRegionManager {
  /**
   * A signal emitted when a region is added or removed.
   */
  regionsChanged = new Signal<IRegionManager, IRegionsChangedArgs>();

  /**
   * Construct a new region manager.
   */
  constructor() { }

  /**
   * A read-only collection of regions in the manager.
   */
  get regions(): IRegionCollection {
    return new RegionsCollection(this._m_regions);
  }

  /**
   * Get the region for the given token.
   *
   * Returns undefined if no such region has been added.
   */
  region(name: string): IRegion<any> {
    return this._m_regions.get(name);
  }

  /**
   * Add a region to the manager.
   *
   * If a region with the same token already exists, this is a no-op.
   *
   * Returns true if the region was added, false otherwise.
   */
  add(region: IRegion<any>): boolean {
    var name = region.name;
    if (this._m_regions.has(name)) {
      return false;
    }
    this._m_regions.set(name, region);
    var factories = this._m_factories.get(name);
    if (factories) {
      factories.forEach(item => item.addViewTo(region));
    }
    this._m_regionsChanged.emit(this, { action: 'added', region: region });
    return true;
  }

  /**
   * Remove the a region from the manager.
   *
   * If a region for the token does not exist, this is a no-op.
   *
   * Returns true if the region was removed, false otherwise.
   */
  remove(name: string): boolean {
    var region = this._m_regions.get(name);
    if (!region) {
      return false;
    }
    this._m_regions.delete(name);
    this._m_regionsChanged.emit(this, { action: 'removed', region: region });
    return true;
  }

  /**
   * Register a static view factory to populate a region.
   *
   * When a region with the given token is added to the manager, the
   * factory will be invoked to create a view to add to the region.
   *
   * Returns a disposable which will unregister the factory.
   */
  registerView(name: string, factory: () => any, rank?: number): IDisposable {
    var item = new FactoryItem(factory, rank);
    var factories = this._m_factories.get(name);
    if (factories) {
      factories.push(item);
    } else {
      this._m_factories.set(name, [item]);
    }
    var region = this._m_regions.get(name);
    if (region) {
      item.addViewTo(region);
    }
    return new Disposable(() => this._unregisterView(name, item));
  }

  /**
   * Remove a previously registered view factory from the manager.
   */
  private _unregisterView(name: string, item: FactoryItem<T>): void {
    var factories = this._m_factories.get(name);
    if (!factories) {
      return;
    }
    var i = factories.indexOf(item);
    if (i !== -1) factories.splice(i, 1);
    if (factories.length === 0) {
      this._m_factories.delete(name);
    }
  }

  private _m_regions = new Map<string, IRegion<any>>();
  private _m_factories = new Map<string, FactoryItem<any>[]>();
}


/**
 * A concrete implementation of IRegionCollection.
 */
class RegionsCollection implements IRegionCollection {
  /**
   * Construct a new region collection.
   */
  constructor(regions: Map<string, IRegion<any>>) {
    this._m_regions = regions;
  }

  /**
   * Test whether the collection contains the given region.
   */
  contains(region: IRegion<any>): boolean {
    return this._m_regions.get(region.token) === region;
  }

  /**
   * Invoke a callback for each region in the collection.
   */
  forEach(callback: (region: IRegion<any>) => void): void {
    this._m_regions.forEach(region => { callback(region); });
  }

  private _m_regions: Map<string, IRegion<any>>;
}


/**
 * An object which holds the view factory data.
 */
class FactoryItem<T> {
  /**
   * Construct a new factory item.
   */
  constructor(factory: () => T, rank: number) {
    this._m_factory = factory;
    this._m_rank = rank;
  }

  /**
   * Create a view and add it to the given region.
   */
  addViewTo(region: IRegion<T>): void {
    var factory = this._m_factory;
    region.add(factory(), this._m_rank);
  }

  private _m_factory: () => T;
  private _m_rank: number;
}

} // module phosphor.shell
