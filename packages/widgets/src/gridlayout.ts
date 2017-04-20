/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, IIterator, each, map
} from '@phosphor/algorithm';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  AttachedProperty
} from '@phosphor/properties';

import {
  BoxEngine, BoxSizer
} from './boxengine';

import {
 Layout, LayoutItem
} from './layout';

import {
  Widget
} from './widget';


const DONT_SET_PARENT_MIN = true;


/**
 * A layout which arranges its widgets in a grid.
 */
export
class GridLayout extends Layout {
  /**
   * Construct a new grid layout.
   *
   * @param options - The options for initializing the layout.
   */
  constructor(options: GridLayout.IOptions = {}) {
    super();
    if (options.rowSpacing !== undefined) {
      this._rowSpacing = Private.clampSpacing(options.rowSpacing);
    }
    if (options.colSpacing !== undefined) {
      this._colSpacing = Private.clampSpacing(options.colSpacing);
    }
  }

  /**
   * Dispose of the resources held by the layout.
   */
  dispose(): void {
    // Dispose of the widgets and layout items.
    each(this._items, item => {
      let widget = item.widget;
      item.dispose();
      widget.dispose();
    });

    // Clear the layout state.
    this._box = null;
    this._items.length = 0;
    this._rowStarts.length = 0;
    this._colStarts.length = 0;
    this._rowSizers.length = 0;
    this._colSizers.length = 0;

    // Dispose of the rest of the layout.
    super.dispose();
  }

  /**
   *
   */
  get rowCount(): number {
    return this._rowSizers.length;
  }

  /**
   *
   */
  get colCount(): number {
    return this._colSizers.length;
  }

  /**
   * Get the row spacing for the grid layout.
   */
  get rowSpacing(): number {
    return this._rowSpacing;
  }

  /**
   * Set the row spacing for the grid layout.
   */
  set rowSpacing(value: number) {
    //
    value = Private.clampSpacing(value);

    //
    if (this._rowSpacing === value) {
      return;
    }

    //
    this._rowSpacing = value;

    //
    if (this.parent) {
      this.parent.fit();
    }
  }

  /**
   * Get the column spacing for the grid layout.
   */
  get colSpacing(): number {
    return this._colSpacing;
  }

  /**
   * Set the col spacing for the grid layout.
   */
  set colSpacing(value: number) {
    //
    value = Private.clampSpacing(value);

    //
    if (this._colSpacing === value) {
      return;
    }

    //
    this._colSpacing = value;

    //
    if (this.parent) {
      this.parent.fit();
    }
  }

  /**
   *
   */
  getRowStretch(index: number): number {
    //
    if (index < 0 || index >= this.rowCount) {
      return -1;
    }

    //
    return this._rowSizers[index].stretch;
  }

  /**
   *
   */
  setRowStretch(index: number, value: number): void {
    //
    if (index < 0 || index >= this.rowCount) {
      return;
    }

    //
    value = Math.max(0, Math.floor(value));

    //
    if (this._rowSizers[index].stretch === value) {
      return;
    }

    //
    this._rowSizers[index].stretch = value;

    //
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   *
   */
  getColStretch(index: number): number {
    //
    if (index < 0 || index >= this.colCount) {
      return -1;
    }

    //
    return this._colSizers[index].stretch;
  }

  /**
   *
   */
  setColStretch(index: number, value: number): void {
    //
    if (index < 0 || index >= this.colCount) {
      return;
    }

    //
    value = Math.max(0, Math.floor(value));

    //
    if (this._colSizers[index].stretch === value) {
      return;
    }

    //
    this._colSizers[index].stretch = value;

    //
    if (this.parent) {
      this.parent.update();
    }
  }

  /**
   * Create an iterator over the widgets in the layout.
   *
   * @returns A new iterator over the widgets in the layout.
   */
  iter(): IIterator<Widget> {
    return map(this._items, item => item.widget);
  }

  /**
   * Add a widget to the grid layout.
   *
   * @param widget - The widget to add to the layout.
   *
   * #### Notes
   * If the widget is already contained in the layout, this is no-op.
   */
  addWidget(widget: Widget): void {
    // Look up the index for the widget.
    let i = ArrayExt.findFirstIndex(this._items, it => it.widget === widget);

    // Bail if the widget is already in the layout.
    if (i !== -1) {
      return;
    }

    // Add the widget to the layout.
    this._items.push(new LayoutItem(widget));

    // TODO sync sizers and row/col count
    this._rebuild();

    // Attach the widget to the parent, if possible.
    if (this.parent) {
      this.attachWidget(widget);
    }
  }

  /**
   * Remove a widget from the grid layout.
   *
   * @param widget - The widget to remove from the layout.
   *
   * #### Notes
   * A widget is automatically removed from the layout when its `parent`
   * is set to `null`. This method should only be invoked directly when
   * removing a widget from a layout which has yet to be installed on a
   * parent widget.
   *
   * This method does *not* modify the widget's `parent`.
   */
  removeWidget(widget: Widget): void {
    // Look up the index for the widget.
    let i = ArrayExt.findFirstIndex(this._items, it => it.widget === widget);

    // Bail if the widget is not in the layout.
    if (i !== -1) {
      return;
    }

    // Remove the widget from the layout.
    let item = ArrayExt.removeAt(this._items, i)!;

    // TODO sync sizers and row/col count
    this._rebuild();

    // Detach the widget from the parent, if possible.
    if (this.parent) {
      this.detachWidget(widget);
    }

    // Dispose the layout item.
    item.dispose();
  }

  /**
   * Perform layout initialization which requires the parent widget.
   */
  protected init(): void {
    super.init();
    each(this, widget => { this.attachWidget(widget); });
  }

  /**
   * Attach a widget to the parent's DOM node.
   *
   * @param widget - The widget to attach to the parent.
   */
  protected attachWidget(widget: Widget): void {
    // Send a `'before-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeAttach);
    }

    // Add the widget's node to the parent.
    this.parent!.node.appendChild(widget.node);

    // Send an `'after-attach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterAttach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * Detach a widget from the parent's DOM node.
   *
   * @param widget - The widget to detach from the parent.
   */
  protected detachWidget(widget: Widget): void {
    // Send a `'before-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.BeforeDetach);
    }

    // Remove the widget's node from the parent.
    this.parent!.node.removeChild(widget.node);

    // Send an `'after-detach'` message if the parent is attached.
    if (this.parent!.isAttached) {
      MessageLoop.sendMessage(widget, Widget.Msg.AfterDetach);
    }

    // Post a fit request for the parent widget.
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    super.onBeforeShow(msg);
    this.parent!.update();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    super.onBeforeAttach(msg);
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-shown'` message.
   */
  protected onChildShown(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'child-hidden'` message.
   */
  protected onChildHidden(msg: Widget.ChildMessage): void {
    this.parent!.fit();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    if (this.parent!.isVisible) {
      this._update(msg.width, msg.height);
    }
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    if (this.parent!.isVisible) {
      this._update(-1, -1);
    }
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    if (this.parent!.isAttached) {
      this._fit();
    }
  }

  /**
   * Fit the layout to the total size required by the widgets.
   */
  private _fit(): void {
    // Reset the min sizes of the sizers.
    for (let i = 0, n = this.rowCount; i < n; ++i) {
      this._rowSizers[i].minSize = 0;
    }
    for (let i = 0, n = this.colCount; i < n; ++i) {
      this._colSizers[i].minSize = 0;
    }

    // Filter for the visible layout items.
    let items = this._items.filter(it => !it.isHidden);

    // Fit the layout items.
    for (let i = 0, n = items.length; i < n; ++i) {
      items[i].fit();
    }

    // Sort the items by row span.
    items.sort(Private.rowSpanCmp);

    // Update the min sizes of the row sizers.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Fetch the item.
      let item = items[i];

      // Get the row bounds for the item.
      let data = GridLayout.getData(item.widget);
      let r1 = data.row;
      let r2 = r1 + data.rowSpan - 1;

      // Distribute the minimum height to the sizers as needed.
      Private.distributeMin(this._rowSizers, r1, r2, item.minHeight);
    }

    // Sort the items by column span.
    items.sort(Private.colSpanCmp);

    // Update the min sizes of the column sizers.
    for (let i = 0, n = items.length; i < n; ++i) {
      // Fetch the item.
      let item = items[i];

      // Get the column bounds for the item.
      let data = GridLayout.getData(item.widget);
      let c1 = data.col;
      let c2 = c1 + data.colSpan - 1;

      // Distribute the minimum width to the sizers as needed.
      Private.distributeMin(this._colSizers, c1, c2, item.minWidth);
    }

    // Bail early if the parent min size doesn't need to be set.
    if (DONT_SET_PARENT_MIN) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
      return;
    }

    // Set up the computed min size.
    let minW = Math.max(0, this.colCount - 1) * this._colSpacing;
    let minH = Math.max(0, this.rowCount - 1) * this._rowSpacing;

    // Add the sizer minimums to the computed min size.
    for (let i = 0, n = this.rowCount; i < n; ++i) {
      minH += this._rowSizers[i].minSize;
    }
    for (let i = 0, n = this.colCount; i < n; ++i) {
      minW += this._colSizers[i].minSize;
    }

    // Update the box sizing and add it to the computed min size.
    let box = this._box = ElementExt.boxSizing(this.parent!.node);
    minW += box.horizontalSum;
    minH += box.verticalSum;

    // Update the parent's min size constraints.
    let style = this.parent!.node.style;
    style.minWidth = `${minW}px`;
    style.minHeight = `${minH}px`;

    // Set the dirty flag to ensure only a single update occurs.
    this._dirty = true;

    // Notify the ancestor that it should fit immediately. This may
    // cause a resize of the parent, fulfilling the required update.
    if (this.parent!.parent) {
      MessageLoop.sendMessage(this.parent!.parent!, Widget.Msg.FitRequest);
    }

    // If the dirty flag is still set, the parent was not resized.
    // Trigger the required update on the parent widget immediately.
    if (this._dirty) {
      MessageLoop.sendMessage(this.parent!, Widget.Msg.UpdateRequest);
    }
  }

  /**
   * Update the layout position and size of the widgets.
   *
   * The parent offset dimensions should be `-1` if unknown.
   */
  private _update(offsetWidth: number, offsetHeight: number): void {
    // Clear the dirty flag to indicate the update occurred.
    this._dirty = false;

    // Bail if there are no layout items.
    if (this.rowCount === 0 || this.colCount === 0) {
      return;
    }

    // Measure the parent if the offset dimensions are unknown.
    if (offsetWidth < 0) {
      offsetWidth = this.parent!.node.offsetWidth;
    }
    if (offsetHeight < 0) {
      offsetHeight = this.parent!.node.offsetHeight;
    }

    // Ensure the parent box sizing data is computed.
    if (!this._box) {
      this._box = ElementExt.boxSizing(this.parent!.node);
    }

    // Compute the layout area adjusted for border and padding.
    let top = this._box.paddingTop;
    let left = this._box.paddingLeft;
    let width = offsetWidth - this._box.horizontalSum;
    let height = offsetHeight - this._box.verticalSum;

    // Compute the total fixed row and column space.
    let fixedRowSpace = (this.rowCount - 1) * this._rowSpacing;
    let fixedColSpace = (this.colCount - 1) * this._colSpacing;

    // Distribute the available space to the box sizers.
    BoxEngine.calc(this._rowSizers, Math.max(0, height - fixedRowSpace));
    BoxEngine.calc(this._colSizers, Math.max(0, width - fixedColSpace));

    // Update the row start positions.
    for (let i = 0, pos = top, n = this.rowCount; i < n; ++i) {
      this._rowStarts[i] = pos;
      pos += this._rowSizers[i].size + this._rowSpacing;
    }

    // Update the column start positions.
    for (let i = 0, pos = left, n = this.colCount; i < n; ++i) {
      this._colStarts[i] = pos;
      pos += this._colSizers[i].size + this._colSpacing;
    }

    // Update the geometry of the layout items.
    for (let i = 0, n = this._items.length; i < n; ++i) {
      // Fetch the item.
      let item = this._items[i];

      // Ignore hidden items.
      if (item.isHidden) {
        continue;
      }

      // Fetch the cell bounds for the widget.
      let data = GridLayout.getData(item.widget);
      let r1 = data.row;
      let c1 = data.col;
      let r2 = r1 + data.rowSpan - 1;
      let c2 = c1 + data.colSpan - 1;

      // Compute the cell geometry.
      let x = this._colStarts[c1];
      let y = this._rowStarts[r1];
      let w = this._colStarts[c2] + this._colSizers[c2].size - x;
      let h = this._rowStarts[r2] + this._rowSizers[r2].size - y;

      // Update the geometry of the layout item.
      item.update(x, y, w, h);
    }
  }

  private _rebuild(): void {
    //
    let rowCount = 0;
    let colCount = 0;

    //
    each(this._items, item => {
      let data = GridLayout.getData(item.widget);
      rowCount = Math.max(rowCount, data.row + data.rowSpan);
      colCount = Math.max(colCount, data.col + data.colSpan);
    });

    while (this._rowSizers.length < rowCount) {
      this._rowSizers.push(new BoxSizer());
    }

    while (this._colSizers.length < colCount) {
      this._colSizers.push(new BoxSizer());
    }

    this._rowSizers.length = rowCount;
    this._colSizers.length = colCount;
  }

  private _dirty = false;
  private _rowSpacing = 4;
  private _colSpacing = 4;
  private _items: LayoutItem[] = [];
  private _rowStarts: number[] = [];
  private _colStarts: number[] = [];
  private _rowSizers: BoxSizer[] = [];
  private _colSizers: BoxSizer[] = [];
  private _box: ElementExt.IBoxSizing | null = null;
}


/**
 * The namespace for the `GridLayout` class statics.
 */
export
namespace GridLayout {
  /**
   * An options object for initializing a grid layout.
   */
  export
  interface IOptions {
    /**
     * The spacing between rows in the layout.
     *
     * The default is `4`.
     */
    rowSpacing?: number;

    /**
     * The spacing between columns in the layout.
     *
     * The default is `4`.
     */
    colSpacing?: number;
  }

  /**
   * An object which holds the grid layout data for a widget.
   */
  export
  interface ILayoutData {
    /**
     * The row index for the widget.
     */
    readonly row: number;

    /**
     * The column index for the widget.
     */
    readonly col: number;

    /**
     * The row span for the widget.
     */
    readonly rowSpan: number;

    /**
     * The column span for the widget.
     */
    readonly colSpan: number;
  }

  /**
   * Get the layout data for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @returns The layout data for the widget.
   */
  export
  function getData(widget: Widget): ILayoutData {
    return Private.dataProperty.get(widget);
  }

  /**
   * Set the layout data for the given widget.
   *
   * @param widget - The widget of interest.
   *
   * @param value - The value for the layout data.
   */
  export
  function setData(widget: Widget, value: Partial<ILayoutData>): void {
    Private.dataProperty.set(widget, Private.normalizeData(value));
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The property descriptor for the widget layout data.
   */
  export
  const dataProperty = new AttachedProperty<Widget, GridLayout.ILayoutData>({
    name: 'data',
    create: () => ({ row: 0, col: 1, rowSpan: 0, colSpan: 1 }),
    changed: onChildDataChanged
  });

  /**
   * Normalize the layout data for a partial data object.
   */
  export
  function normalizeData(data: Partial<GridLayout.ILayoutData>): GridLayout.ILayoutData {
    let row = Math.max(0, Math.floor(data.row || 0));
    let col = Math.max(0, Math.floor(data.col || 0));
    let rowSpan = Math.max(1, Math.floor(data.rowSpan || 0));
    let colSpan = Math.max(1, Math.floor(data.colSpan || 0));
    return { row, col, rowSpan, colSpan };
  }

  /**
   * Clamp a spacing value to an integer >= 0.
   */
  export
  function clampSpacing(value: number): number {
    return Math.max(0, Math.floor(value));
  }

  /**
   * A sort comparison function for row spans.
   */
  export
  function rowSpanCmp(a: LayoutItem, b: LayoutItem): number {
    let d1 = dataProperty.get(a.widget);
    let d2 = dataProperty.get(b.widget);
    return d1.rowSpan - d2.rowSpan;
  }

  /**
   * A sort comparison function for column spans.
   */
  export
  function colSpanCmp(a: LayoutItem, b: LayoutItem): number {
    let d1 = dataProperty.get(a.widget);
    let d2 = dataProperty.get(b.widget);
    return d1.colSpan - d2.colSpan;
  }

  /**
   *
   */
  export
  function distributeMin(sizers: BoxSizer[], i1: number, i2: number, minSize: number): void {
    //
    if (i2 < i1) {
      return;
    }

    //
    if (i1 === i2) {
      let sizer = sizers[i1];
      sizer.minSize = Math.max(sizer.minSize, minSize);
      return;
    }

    //
    let total = 0;
    for (let i = i1; i <= i2; ++i) {
      total += sizers[i].minSize;
    }

    //
    if (total >= minSize) {
      return;
    }

    //
    let part = (minSize - total) / (i2 - i1 + 1);
    for (let i = i1; i <= i2; ++i) {
      sizers[i].minSize += part;
    }
  }

  /**
   * The change handler for the child data property.
   */
  function onChildDataChanged(child: Widget): void {
    if (child.parent && child.parent.layout instanceof GridLayout) {
      (child.parent as any)._rebuild();
      child.parent.fit();
    }
  }
}
