/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import IList = collections.IList;

import Signal = core.Signal;


/**
 * The arguments object for region
 */
export
interface IViewsChangedArgs<T> {
  /**
   * The action which occurred 'added' | 'removed'.
   */
  action: string;

  /**
   * The index of the view.
   */
  index: number;

  /**
   * The view of interest
   */
  view: T;
}


/**
 * An object which manages a list of views.
 */
export
interface IRegion<T> {
  /**
   * A signal emitted when the region's views are modified.
   */
  viewsChanged: Signal<IRegion<T>, IViewsChangedArgs<T>>;

  /**
   * A signal emitted when the active views change.
   */
  // activeViewsChanged: Signal<IRegion<T>, void>;

  /**
   * The name of the region.
   */
  name: string;

  /**
   * A read-only list of views in the region.
   */
  views: IList<T>;

  /**
   * A read-only list of active views in the region.
   */
  // activeViews: IList<T>;

  /**
   * Add a view to the region.
   *
   * The rank is used to order the view within the region.
   *
   * If the view already exists in the region, this is a no-op.
   *
   * Returns true if the view was added, false otherwise.
   */
  add(view: T, rank?: number): boolean;

  /**
   * Remove a view from the region.
   *
   * If the view does not exist in the region, this is a no-op.
   *
   * Returns true if the view was removed, false otherwise.
   */
  remove(view: T): boolean;

  /**
   * Activate the given view.
   *
   * If the view does not exist in the region, this is a no-op.
   *
   * Returns true if the view was activated, false otherwise.
   */
  // activate(view: T): boolean;

  /**
   * Deactivate the given view.
   *
   * If the view does not exist in the region, this is a no-op.
   *
   * Returns true if the view was deactivated, false otherwise.
   */
  // deactivate(view: T): boolean;
}

} // module phosphor.shell
