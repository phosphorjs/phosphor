/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

import SectionList = collections.SectionList;

import connect = core.connect;
import IMessage = core.IMessage;
import NodeBase = core.NodeBase;


/**
 * The class name added to ListView widgets.
 */
var LIST_VIEW_CLASS = 'p-ListView';

/**
 * The class name added to a list view row cavnvas.
 */
var CANVAS_CLASS = 'p-ListView-canvas';

/**
 * The class name added to a list view corner widget.
 */
var CORNER_CLASS = 'p-ListView-corner';

/**
 * The class name added to a list view row.
 */
var ROW_CLASS = 'p-ListView-row';


/**
 * A widget which manages a virtually scrolling list of rows.
 *
 * This widget must be subclassed to be useful. A subclass should call
 * `[insert|remove|resize]Row` methods to specify the rows in the data
 * set. A subclass should also reimplement the methods `renderRow` and
 * `releaseRow`, which are called to render the visible row contents.
 */
export
class ListView extends Widget {
  /**
   * Construct a new list view.
   */
  constructor() {
    super();
    this.addClass(LIST_VIEW_CLASS);
    this.setFlag(WidgetFlag.DisallowLayoutChange);

    this._canvas = new Widget();
    this._canvas.parent = this;
    this._canvas.addClass(CANVAS_CLASS);

    this._corner = new Widget();
    this._corner.hide();
    this._corner.parent = this;
    this._corner.addClass(CORNER_CLASS);

    this._hScrollBar = new ScrollBar(Orientation.Horizontal);
    this._hScrollBar.hide();
    this._hScrollBar.parent = this;

    this._vScrollBar = new ScrollBar(Orientation.Vertical);
    this._vScrollBar.hide();
    this._vScrollBar.parent = this;

    connect(this._hScrollBar, ScrollBar.sliderMoved, this, this._hsb_sliderMoved);
    connect(this._vScrollBar, ScrollBar.sliderMoved, this, this._vsb_sliderMoved);
  }

  /**
   * Get the total scrollable height of all rows in the list.
   */
  get scrollHeight(): number {
    return this._sections.size;
  }

  /**
   * Get the total number of rows in the list.
   */
  get rowCount(): number {
    return this._sections.count;
  }

  /**
   * Get the index of the row at the given offset position.
   *
   * @param pos - The offset position of the row of interest.
   *
   * @returns The index of the row, or `-1` if `pos` is out of range.
   */
  rowAt(pos: number): number {
    return this._sections.indexOf(pos);
  }

  /**
   * Get the height of the row at the given index.
   *
   * @param row - The index of the row of interest.
   *
   * @returns The height of the row, or `-1` if `row` is out of range.
   */
  rowHeight(row: number): number {
    return this._sections.sizeOf(row);
  }

  /**
   * Get the scroll position of the row at the given index.
   *
   * @param row - The index of the row of interest.
   *
   * @returns The position of the row, or `-1` if `row` is out of range.
   */
  rowPosition(row: number): number {
    return this._sections.offsetOf(row);
  }

  /**
   * Insert new rows into the list.
   *
   * @param index - The index at which to insert the first row. If this
   *   value is negative, it is taken as an offset from the end of the
   *   list. The value is clamped to the range `[0, list.rowCount]`.
   *
   * @param count - The number of rows to insert. If this value is
   *   `<= 0`, this method is a no-op.
   *
   * @param height - The height of each row. This value is clamped to
   *   the range `[0, Infinity]`.
   */
  insertRows(index: number, count:number, height: number): void {
    // TODO save/restore scroll position
    this._sections.insert(index, count, height);
    this._updateScrollBars();
    this.update();
  }

  /**
   * Remove existing rows from the list.
   *
   * @param index - The index of the first row to remove. If this value
   *   is negative, it is taken as an offset from the end of the list.
   *
   * @param count - The number of rows to remove. If this value is
   *   `<= 0`, this method is a no-op. If any of the rows are out
   *   of range, they will be ignored.
   */
  removeRows(index: number, count: number): void {
    // TODO save/restore scroll position
    this._sections.remove(index, count);
    this._updateScrollBars();
    this.update();
  }

  /**
   * Resize existing rows in the list.
   *
   * @param index - The index of the first row to resize. If this value
   *   is negative, it is taken as an offset from the end of the list.
   *
   * @param count - The number of rows to resize. If this value is
   *   `<= 0`, this method is a no-op. If any of the rows are out
   *   of range, they will be ignored.
   *
   * @param height - The new height of each row. This value is clamped
   *   to the range `[0, Infinity]`.
   */
  resizeRows(index: number, count: number, height: number): void {
    // TODO save/restore scroll position
    this._sections.resize(index, count, height);
    this._updateScrollBars();
    this.update();
  }

  /**
   * Render the roWw content for the given row index.
   *
   * @param index - The index of the row to be rendered.
   *
   * @param host - The node which which hosts the row content.
   *
   * #### Notes
   * This method is called automatically when the row is scrolled
   * into view. When the row scrolls out of view, the `releaseRow`
   * method will be called.
   *
   * User code should not manipulate the style or attributes of the
   * host. Only the child content of the host should be changed.
   *
   * The given host may be recycled, so if `releaseRow` does not clear
   * the child content, this method should be mindful that content for
   * an old row may be present in the host.
   *
   * Subclasses should reimplement this method.
   */
  protected renderRow(index: number, host: HTMLElement): void { }

  /**
   * Release the resources and content for the given row index.
   *
   * @param index - The index of the row to be released.
   *
   * @param host - The node which which hosts the row content.
   *
   * #### Notes
   * This method is called automatically when the row is scrolled
   * out of view. When the row scrolls into view, the `renderRow`
   * method will be called.
   *
   * User code should release an resources acquired for the row and
   * optionally remove the child content from the host.
   *
   * Subclasses should reimplement this method as needed.
   */
  protected releaseRow(index: number, host: HTMLElement): void { }

  /**
   * A method invoked on a 'resize' message.
   */
  protected onResize(msg: ResizeMessage): void {
    var box = this.boxSizing;
    var top = box.paddingTop;
    var left = box.paddingLeft;
    var width = msg.width - box.horizontalSum;
    var height = msg.height - box.verticalSum;
    this._canvas.setGeometry(left, top, width, height);
    this._updateScrollBars();
    this.update();
  }

  /**
   * A method invoked on an 'update-request' message.
   */
  protected onUpdateRequest(msg: IMessage): void {
    // Use the current scroll position and canvas height to
    // compute the span of rows which should be made visible.
    var last: number;
    var count: number;
    var canvas = this._canvas;
    var sections = this._sections;
    var offset = this._vScrollBar.value;
    var start = sections.indexOf(offset);
    if (start === -1) {
      last = -1;
      count = 0;
    } else {
      last = sections.indexOf(offset + canvas.height);
      if (last === -1) last = sections.count - 1;
      count = last - start + 1;
    }

    // Setup the reuse and recycle containers. Rows which are currently
    // rendered and are in-range of the new span will be reused. Rows
    // which are out-of-range will be recycled. Extra rows will be
    // disposed at the end of this method.
    var reuse = new Map<number, Row>();
    var recycle: Row[] = [];

    // Walk the currently rendered rows and classify each row as reuse
    // or recycle based on whether it is in range of the current span.
    var rows = this._visibleRows;
    for (var i = 0, n = rows.length; i < n; ++i) {
      var row = rows[i];
      if (row.index >= start && row.index <= last) {
        reuse.set(row.index, row);
      } else {
        this.releaseRow(row.index, row.node);
        recycle.push(row);
      }
    }

    // Iterate the current row span and update the visible rows array
    // with the current rows. Reuse and recycle when possible, create
    // new rows only when necessary. Update each visible row with its
    // new index, position, and size.
    var pos = sections.offsetOf(start) - offset;
    for (var i = 0; i < count; ++i) {
      var index = start + i;
      var size = sections.sizeOf(index);
      var row = reuse.get(index);
      if (row !== void 0) {
        rows[i] = row;
      } else if (recycle.length > 0) {
        row = rows[i] = recycle.pop();
        this.renderRow(index, row.node);
      } else {
        row = rows[i] = Row.acquire();
        canvas.node.appendChild(row.node);
        this.renderRow(index, row.node);
      }
      row.update(index, pos, size);
      pos += size;
    }

    // If the canvas shrinks in height, the visible rows array will
    // be too large. Clamp it down to the proper visible row count.
    rows.length = count;

    // Free any remaining unrecycled rows.
    for (var i = 0, n = recycle.length; i < n; ++i) {
      var row = recycle[i];
      canvas.node.removeChild(row.node);
      row.node.textContent = '';
      Row.release(row);
    }
  }

  /**
   * Update the range and positions of the scrollbars.
   */
  private _updateScrollBars(): void {
    // TODO handle horizontal scrollbar
    var box = this.boxSizing;
    var top = box.paddingTop;
    var left = box.paddingLeft;
    var width = this.width - box.horizontalSum;
    var height = this.height - box.verticalSum;
    if (height >= this._sections.size) {
      this._vScrollBar.hide();
    } else {
      var vsh = this._vScrollBar.sizeHint();
      var sbl = left + width - vsh.width;
      this._vScrollBar.setGeometry(sbl, top, vsh.width, height);
      this._vScrollBar.maximum = Math.max(0, this._sections.size - height);
      this._vScrollBar.pageSize = height;
      this._vScrollBar.show();
    }
  }

  /**
   * Handle the `sliderMoved` signal from the horizontal scroll bar.
   */
  private _hsb_sliderMoved(sender: ScrollBar, value: number): void {
    // TODO scroll horizontally
  }

  /**
   * Handle the `sliderMoved` signal from the vertical scroll bar.
   */
  private _vsb_sliderMoved(sender: ScrollBar, value: number): void {
    this.update();
  }

  private _canvas: Widget;
  private _corner: Widget;
  private _hScrollBar: ScrollBar;
  private _vScrollBar: ScrollBar;
  private _visibleRows: Row[] = [];
  private _sections = new SectionList();
}


/**
 * An object which represents a visible row in a list view.
 *
 * A row's node serves as a host for the user generated row content.
 */
class Row extends NodeBase {
  /**
   * The maximum number of free rows to keep in the pool.
   */
  static _freeMax = 1023;

  /**
   * The index of the first free row in the pool.
   */
  static _freeIndex = -1;

  /**
   * A pool of free row objects which may be reused.
   */
  static _freeList: Row[] = [];

  /**
   * A pool of free row objects which may be reused.
   */
  static acquire(): Row {
    return this._freeIndex < 0 ? new Row() : this._freeList[this._freeIndex--];
  }

  /**
   * Release a row back to the row pool.
   */
  static release(row: Row): void {
    if (this._freeIndex < this._freeMax) this._freeList[++this._freeIndex] = row;
  }

  /**
   * Construct a new row.
   */
  constructor() {
    super();
    this.addClass(ROW_CLASS);
    this._style = this.node.style;
    this._dataset = this.node.dataset;
  }

  /**
   * Get the index associated with the row.
   */
  get index(): number {
    return this._index;
  }

  /**
   * Update the index and sizing data for the row.
   */
  update(index: number, pos: number, size: number): void {
    this._dataset.row = index;
    this._style.top = pos + 'px';
    this._style.height = size + 'px';
    this._index = index;
  }

  private _index = -1;
  private _dataset: any;
  private _style: CSSStyleDeclaration;
}

} // module phosphor.widgets
