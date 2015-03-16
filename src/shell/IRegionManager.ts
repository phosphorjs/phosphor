/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import ICollection = collections.ICollection;

import IDisposable = core.IDisposable;
import Signal = core.Signal;


/**
 * The arguments object for the `regionsChanged` signal.
 */
export
interface IRegionsChangedArgs {
  /**
   * The action which occurred: 'added' | 'removed'.
   */
  action: string;

  /**
   * The region involved in the change.
   */
  region: IRegion<any>;
}


/**
 * An object which manages a collection of regions.
 */
export
interface IRegionManager {
  /**
   * A signal emitted when a region is added or removed.
   */
  regionsChanged: Signal<IRegionManager, IRegionsChangedArgs>;

  /**
   * A read-only collection of regions in the manager.
   */
  regions: ICollection<IRegion<any>>;

  /**
   * Get the region for the given token.
   *
   * Returns undefined if no such region has been added.
   */
  region(name: string): IRegion<any>;

  /**
   * Add a region to the manager.
   *
   * If a region with the same token already exists, this is a no-op.
   *
   * Returns true if the region was added, false otherwise.
   */
  add(region: IRegion<any>): boolean;

  /**
   * Remove the a region from the manager.
   *
   * If a region for the token does not exist, this is a no-op.
   *
   * Returns true if the region was removed, false otherwise.
   */
  remove(name: string): boolean;

  /**
   * Register a static view factory to populate a region.
   *
   * When a region with the given token is added to the manager, the
   * factory will be invoked to create a view to add to the region.
   *
   * Returns a disposable which will unregister the factory.
   */
  registerView(name: string, factory: () => any, rank?: number): IDisposable;
}

} // module phosphor.shell
