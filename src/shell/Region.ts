/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.shell {

import lowerBound = algorithm.lowerBound;

import Signal = core.Signal;


/**
 * A concrete implementaion of IRegion.
 */
export
class Region<T> implements IRegion<T> {
  /**
   * A signal emitted when the region's views are modified.
   */
  viewsChanged = new Signal<IRegion<T>, IViewsChangedArgs<T>>();

  /**
   * A signal emitted when the active views change.
   */
  //activeViewsChanged = new Signal<IRegion<T>, void>();

  /**
   * Construct a new region.
   */
  constructor(name: string) {
    this._m_name = name;
  }

  /**
   * The name of the region.
   */
  get token(): string {
    return this._m_name;
  }

  /**
   * A read-only collection of views in the region.
   */
  get views(): IViewCollection<T> {
    return new ViewItemCollection(this._m_items);
  }

  /**
   * A read-only collection of active views in the region.
   */
  get activeViews(): IViewCollection<T> {
    return new ViewItemCollection<T>([]);
  }

  /**
   * Add a view to the region.
   *
   * The rank is used to order the view within the region.
   *
   * If the view already exists in the region, this is a no-op.
   *
   * Returns true if the view was added, false otherwise.
   */
  add(view: T, rank = 100): boolean {
    if (algo.find(this._m_items, it => it.view === view)) {
      return false;
    }
    var item = new ViewItem(view, rank);
    var index = algo.insortLower(this._m_items, item, itemCompare);
    this.viewAdded(index, view);
    return true;
  }

  /**
   * Remove a view from the region.
   *
   * If the view does not exist in the region, this is a no-op.
   *
   * Returns true if the view was removed, false otherwise.
   */
  remove(view: T): boolean {
    var index = algo.findIndex(this._m_items, it => it.view === view);
    if (index === -1) {
      return false;
    }
    this._m_items.splice(index, 1);
    this.viewRemoved(index, view);
    return true;
  }

  /**
   * Activate the given view.
   *
   * If the view does not exist in the region, this is a no-op.
   *
   * Returns true if the view was activated, false otherwise.
   */
  activate(view: T): boolean {
    return false;
  }

  /**
   * Deactivate the given view.
   *
   * If the view does not exist in the region, this is a no-op.
   *
   * Returns true if the view was deactivated, false otherwise.
   */
  deactivate(view: T): boolean {
    return false;
  }

  /**
   * A method invoked when a view is added to the region.
   *
   * Subclass should reimplement this method as needed.
   */
  protected viewAdded(index: number, view: T): void {
    var args = { action: 'added', index: index, view: view };
    this._m_viewsChanged.emit(this, args);
  }

  /**
   * A method invoked when a view is removed from the region.
   *
   * Subclass should reimplement this method as needed.
   */
  protected viewRemoved(index: number, view: T): void {
    var args = { action: 'removed', index: index, view: view };
    this._m_viewsChanged.emit(this, args);
  }

  /**
   * Emit the `activeViewsChanged` signal.
   *
   * Subclasses may invoke this method as needed.
   */
  protected emitActiveViewsChanged(): void {
    this._m_activeViewsChanged.emit(this, void 0);
  }

  private _m_name: string;
  private _m_items: ViewItem<T>[] = [];
  private _m_viewsChanged = new Signal<IRegion<T>, IViewsChangedArgs<T>>();
  private _m_activeViewsChanged = new Signal<IRegion<T>, void>();
}


/**
 * The view item id counter.
 */
var viewItemIdTick = 0;


/**
 * An object which holds item data for a region view.
 */
class ViewItem<T> {
  /**
   * The view object.
   */
  view: T;

  /**
   * The rank of the view.
   */
  rank: number;

  /**
   * The unique id number of the view item.
   *
   * This is used to break rank ties and guarantee sort order.
   */
  id = viewItemIdTick++;

  /**
   * Construct a new view item.
   */
  constructor(view: T, rank: number) {
    this.view = view;
    this.rank = rank;
  }
}


/**
 * The comparison function for sorting view items.
 */
function itemCompare<T>(a: ViewItem<T>, b: ViewItem<T>): number {
  return a.rank - b.rank || a.id - b.id;
}


/**
 * A list
 */
class ViewItemList<T> implements IList<T> {
  /**
   * Construct a new view item list.
   */
  constructor(items: ViewItem<T>[]) {
    this._m_items = items;
  }

  /**
   * True if the list has elements, false otherwise.
   */
  get empty(): boolean {
    return this._m_items.length === 0;
  }

  /**
   * The number of elements in the list.
   */
  get size(): number {
    return this._m_items.length;
  }

  /**
   * Get an iterator for the elements in the list.
   */
  iterator(): IIterator<T> {
    return this._m_items.iterator();
  }

  /**
   * Test whether the list contains the given value.
   */
  contains(value: T): boolean {
    return this._m_items.contains(value);
  }

  /**
   * Add a value to the list.
   *
   * This method always throws.
   */
  add(value: T): boolean {
    throw new Error('list is read only');
  }

  /**
   * Remove a value from the list.
   *
   * This method always throws.
   */
  remove(value: T): boolean {
    throw new Error('list is read only');
  }

  /**
   * Remove all elements from the list.
   *
   * This method always throws.
   */
  clear(): void {
    throw new Error('list is read only');
  }

  /**
   * Returns an array containing all elements in the list.
   */
  toArray(): T[] {
    return this._m_items.toArray();
  }

  private _m_items: ViewItem<T>[];
}

} // module phosphor.shell
