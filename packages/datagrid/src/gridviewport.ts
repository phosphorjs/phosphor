/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message, sendMessage
} from '../core/messaging';

import {
  ResizeMessage, Widget, WidgetFlag, WidgetMessage
} from '../ui/widget';

import {
  CellRenderer, TextCellRenderer
} from './cellrenderer';

import {
  DataModel
} from './datamodel';

import {
  GridHeader
} from './gridheader';


/**
 * The class name added to grid viewport instance.
 */
const GRID_VIEWPORT_CLASS = 'p-GridViewport';

/**
 * The class name added to the canvas node of a grid viewport.
 */
const CANVAS_CLASS = 'p-GridViewport-canvas';


/**
 * A widget which renders the visible cells of a grid.
 *
 * #### Notes
 * User code will not normally interact with this class directly.
 *
 * The `DataGrid` class uses an instance of the class internally.
 *
 * This class is not designed to be subclassed.
 */
export
class GridViewport extends Widget {
  /**
   * Construct a new grid viewport.
   *
   * @param options - The options for initializing the viewport.
   */
  constructor(options: GridViewport.IOptions = {}) {
    super();
    this.addClass(GRID_VIEWPORT_CLASS);
    this.setFlag(WidgetFlag.DisallowLayout);

    // Create the default cell renderer. TODO `default` or `[default]`?
    this._cellRenderers['text'] = new TextCellRenderer();

    // Create the off-screen rendering buffer.
    this._buffer = document.createElement('canvas');
    this._buffer.width = 0;
    this._buffer.height = 0;

    // Create the on-screen rendering canvas.
    this._canvas = document.createElement('canvas');
    this._canvas.className = CANVAS_CLASS;
    this._canvas.width = 0;
    this._canvas.height = 0;
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0px';
    this._canvas.style.left = '0px';
    this._canvas.style.width = '0px';
    this._canvas.style.height = '0px';

    // Add the canvas to the widget node.
    this.node.appendChild(this._canvas);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    this._model = null;
    this._buffer = null;
    this._canvas = null;
    this._rowHeader = null;
    this._columnHeader = null;
    this._dirtyRegion = null;
    this._cellRenderers = null;
    super.dispose();
  }

  /**
   * Get the data model rendered by the viewport.
   */
  get model(): DataModel {
    return this._model;
  }

  /**
   * Set the data model rendered by the viewport.
   */
  set model(value: DataModel) {
    // Null and undefined are treated the same.
    value = value || null;

    // Do nothing if the model does not change.
    if (this._model === value) {
      return;
    }

    // Disconnect the signal handlers from the old model.
    if (this._model) {
      // TODO
    }

    // Connect the signal handlers for the new model.
    if (value) {
      // TODO
    }

    // Update the internal model reference.
    this._model = value;

    // Schedule an update of the viewport.
    this.update();
  }

  /**
   * Get the scroll X offset of the viewport.
   */
  get scrollX(): number {
    return this._scrollX;
  }

  /**
   * Set the scroll X offset of the viewport.
   */
  set scrollX(value: number) {
    this.scrollTo(value, this._scrollY);
  }

  /**
   * Get the scroll Y offset of the viewport.
   */
  get scrollY(): number {
    return this._scrollY;
  }

  /**
   * Set the scroll Y offset of the viewport.
   */
  set scrollY(value: number) {
    this.scrollTo(this._scrollX, value);
  }

  /**
   * Scroll the viewport by the specified delta.
   *
   * @param dx - The scroll X delta, in pixels.
   *
   * @param dy - The scroll Y delta, in pixels.
   */
  scrollBy(dx: number, dy: number): void {
    this.scrollTo(this._scrollX + dx, this._scrollY + dy);
  }

  /**
   * Scroll to the specified offset position.
   *
   * @param x - The scroll X offset, in pixels.
   *
   * @param y - The scroll Y offset, in pixels.
   *
   * #### Notes
   * Negative values will be clamped to zero.
   *
   * Fractional values will be rounded to the nearest integer.
   *
   * There is no practical upper limit to the scroll position.
   */
  scrollTo(x: number, y: number): void {
    // Coerce the desired scroll position to integers `>= 0`.
    x = Math.max(0, Math.round(x));
    y = Math.max(0, Math.round(y));

    // Compute the delta scroll amount.
    let dx = x - this._scrollX;
    let dy = y - this._scrollY;

    // Bail early if there is no effective scroll.
    if (dx === 0 && dy === 0) {
      return;
    }

    // Update the internal scroll position.
    this._scrollX = x;
    this._scrollY = y;

    // Bail early if the widget is not visible.
    if (!this.isVisible) {
      return;
    }

    // Get the current size of the canvas.
    let width = this._canvas.width;
    let height = this._canvas.height;

    // Bail early if the canvas is empty.
    if (width === 0 || height === 0) {
      return;
    }

    // Paint everything if either delta is larger than the viewport.
    if (Math.abs(dx) >= width || Math.abs(dy) >= height) {
      this._paint(0, 0, width, height);
      return;
    }

    // Setup the image blit variables.
    let srcX = 0;
    let srcY = 0;
    let dstX = 0;
    let dstY = 0;
    let imgW = width;
    let imgH = height;

    // Setup the dirty margin variables.
    let top = 0;
    let left = 0;
    let right = 0;
    let bottom = 0;

    // Compute the values for any horizontal scroll.
    if (dx < 0) {
      left = -dx;
      dstX = left;
      imgW = width - left;
    } else if (dx > 0) {
      right = dx;
      srcX = right;
      imgW = width - right;
    }

    // Compute the values for any vertical scroll.
    if (dy < 0) {
      top = -dy;
      dstY = top;
      imgH = height - top;
    } else if (dy > 0) {
      bottom = dy;
      srcY = bottom;
      imgH = height - bottom;
    }

    // Get the graphics context for the canvas.
    let gc = this._canvas.getContext('2d');

    // Blit the valid image data to the new location.
    gc.drawImage(this._canvas, srcX, srcY, imgW, imgH, dstX, dstY, imgW, imgH);

    // Paint the dirty region at the left, if needed.
    if (left > 0) {
      this._paint(0, 0, left, height);
    }

    // Paint the dirty region at the right, if needed.
    if (right > 0) {
      this._paint(width - right, 0, right, height);
    }

    // Paint the dirty region at the top, if needed.
    if (top > 0) {
      this._paint(left, 0, width - left - right, top);
    }

    // Paint the dirty region at the bottom, if needed.
    if (bottom > 0) {
      this._paint(left, height - bottom, width - left - right, bottom);
    }
  }

  /**
   * Get the cell renderer assigned to a given name.
   *
   * @param name - The name of the cell renderer of interest.
   *
   * @returns The cell renderer for the given name, or `undefined`.
   */
  getCellRenderer(name: string): CellRenderer {
    return this._cellRenderers[name];
  }

  /**
   * Set the cell renderer for a given name.
   *
   * @param name - The name of the cell renderer of interest.
   *
   * @param value - The cell renderer to assign to the name.
   *
   * #### Notes
   * The given renderer will override the previous renderer for the
   * specified name. If the renderer is `null` or `undefined`, the
   * previous renderer will be removed.
   */
  setCellRenderer(name: string, value: CellRenderer): void {
    // Null and undefined are treated the same.
    value = value || void 0;

    // Lookup the old renderer.
    let old = this._cellRenderers[name];

    // Do nothing if the renderer does not change.
    if (old === value) {
      return;
    }

    // Disconnect the signal handlers from the old renderer.
    if (old) {
      old.changed.disconnect(this._onCellRendererChanged, this);
    }

    // Connect the signal handlers to the new renderer.
    if (value) {
      value.changed.connect(this._onCellRendererChanged, this);
    }

    // Update the cell renderer map.
    if (value) {
      this._cellRenderers[name] = value;
    } else {
      delete this._cellRenderers[name];
    }

    // Schedule an update of the viewport
    this.update();
  }

  /**
   * A message handler invoked on an `'after-show'` message.
   */
  protected onAfterShow(msg: Message): void {
    this.fit();
  }

  /**
   * A message handler invoked on an `'after-attach'` message.
   */
  protected onAfterAttach(msg: Message): void {
    this.fit();
  }

  /**
   * A message handler invoked on an `'update-request'` message.
   */
  protected onUpdateRequest(msg: Message): void {
    // Do nothing if the widget is not visible.
    if (!this.isVisible) {
      return;
    }

    // Get the visible size of the canvas.
    let width = this._canvas.width;
    let height = this._canvas.height;

    // Bail early if the canvas has zero area.
    if (width === 0 || height === 0) {
      return;
    }

    // Paint the entire canvas.
    this._paint(0, 0, width, height);
  }

  /**
   * A message handler invoked on a `'fit-request'` message.
   */
  protected onFitRequest(msg: Message): void {
    // Do nothing if the widget is not visible.
    if (!this.isVisible) {
      return;
    }

    // Measure the node size.
    let width = Math.round(this.node.offsetWidth);
    let height = Math.round(this.node.offsetHeight);

    // Resize the canvas and buffer to fit.
    this._buffer.width = width;
    this._buffer.height = height;
    this._canvas.width = width;
    this._canvas.height = height;
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;

    // Repaint the viewport immediately.
    sendMessage(this, WidgetMessage.UpdateRequest);
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: ResizeMessage): void {
    // Bail early if the widget is not visible.
    if (!this.isVisible) {
      return;
    }

    // Unpack the message data.
    let { width, height } = msg;

    // Measure the node if the dimensions are unknown.
    if (width === -1) {
      width = this.node.offsetWidth;
    }
    if (height === -1) {
      height = this.node.offsetHeight;
    }

    // Round the dimensions to the nearest pixel.
    width = Math.round(width);
    height = Math.round(height);

    // Get the current size of the canvas.
    let oldWidth = this._canvas.width;
    let oldHeight = this._canvas.height;

    // Determine whether there is valid content to blit.
    let needBlit = oldWidth > 0 && oldHeight > 0 && width > 0 && height > 0;

    // Resize the off-screen buffer to the new size.
    this._buffer.width = width;
    this._buffer.height = height;

    // Blit the old contents into the buffer, if needed.
    if (needBlit) {
      let bufferGC = this._buffer.getContext('2d');
      bufferGC.drawImage(this._canvas, 0, 0);
    }

    // Resize the on-screen canvas to the new size.
    this._canvas.width = width;
    this._canvas.height = height;
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;

    // Blit the buffer contents into the canvas, if needed.
    if (needBlit) {
      let canvasGC = this._canvas.getContext('2d');
      canvasGC.drawImage(this._buffer, 0, 0);
    }

    // Compute the sizes of the dirty regions.
    let right = Math.max(0, width - oldWidth);
    let bottom = Math.max(0, height - oldHeight);

    // Paint the dirty region at the right, if needed.
    if (right > 0) {
      this._paint(oldWidth, 0, right, height);
    }

    // Paint the dirty region at the bottom, if needed.
    if (bottom > 0) {
      this._paint(0, oldHeight, width - right, bottom);
    }
  }

  /**
   * Paint the portion of the viewport contained within a rect.
   *
   * This is the primary painting entry point. This method invokes
   * all of the other grid drawing methods in the correct order.
   *
   * This method makes the following assumptions which **must** hold:
   * - The rect is expressed in integer viewport coordinates.
   * - The rect fits entirely within the visible viewport.
   */
  private _paint(rx: number, ry: number, rw: number, rh: number): void {
    // Warn and bail if recursive painting is detected.
    if (this._inPaint) {
      console.warn('Recursive paint detected.');
      return;
    }

    // Get the rendering context for the canvas.
    let gc = this._canvas.getContext('2d');

    // Clip to the dirty rect and execute the actual paint routine.
    try {
      gc.save();
      gc.beginPath();
      gc.rect(rx, ry, rw, rh);
      gc.clip();
      this._inPaint = true;
      this.__paint(rx, ry, rw, rh);
    } finally {
      this._inPaint = false;
      gc.restore();
    }
  }

  /**
   * The paint implementation method.
   *
   * This should **only** be called by the `_paint` method.
   */
  private __paint(rx: number, ry: number, rw: number, rh: number): void {
    // Get the rendering context for the canvas.
    let gc = this._canvas.getContext('2d');

    // Fill the dirty rect with the void space color.
    gc.fillStyle = '#D4D4D4';  // TODO make configurable.
    gc.fillRect(rx, ry, rw, rh);

    // Bail if there is no data model, row header, or column header.
    if (!this._model || !this._rowHeader || !this._columnHeader) {
      return;
    }

    // Fetch the row and column counts from the data model.
    let rowCount = this._model.rowCount();
    let colCount = this._model.columnCount();

    // Bail if the data model is empty.
    if (rowCount === 0 || colCount === 0) {
      return;
    }

    // Compute the upper-left cell index.
    let i1 = this._columnHeader.sectionAt(rx + this._scrollX);
    let j1 = this._rowHeader.sectionAt(ry + this._scrollY);

    // Bail if no cell intersects the origin. Since the scroll position
    // cannot be negative, it means no cells intersect the dirty rect.
    if (i1 < 0 || j1 < 0) {
      return;
    }

    // Compute the lower-right cell index. Note: the queried location
    // is 1 pixel beyond the specified dirty rect. This allows border
    // overdraw by neighboring cells when the dirty rect is aligned
    // with the trailing cell boundaries.
    let i2 = this._columnHeader.sectionAt(rx + rw + this._scrollX);
    let j2 = this._rowHeader.sectionAt(ry + rh + this._scrollY);

    // Use the last cell index if the region extends beyond the area
    // defined by the last cell boundary.
    i2 = i2 < 0 ? colCount - 1 : i2;
    j2 = j2 < 0 ? rowCount - 1 : j2;

    // Setup the initial parameters of the dirty region.
    let rgn = this._dirtyRegion;
    rgn.x = this._columnHeader.sectionPosition(i1) - this._scrollX;
    rgn.y = this._rowHeader.sectionPosition(j1) - this._scrollY;
    rgn.width = 0;
    rgn.height = 0;
    rgn.rowCount = 0;
    rgn.columnCount = 0;
    rgn.renderCount = 0;

    // Update the region with the visible column geometry.
    for (let i = 0, n = i2 - i1 + 1; i < n; ++i) {
      let s = this._columnHeader.sectionSize(i1 + i);
      if (s === 0) {
        continue;
      }
      let k = rgn.columnCount++;
      rgn.columns[k] = i1 + i;
      rgn.columnSizes[k] = s;
      rgn.width += s;
    }

    // Bail if there are no visible columns.
    if (rgn.columnCount === 0) {
      return;
    }

    // Update the region with the visible row geometry.
    for (let j = 0, n = j2 - j1 + 1; j < n; ++j) {
      let s = this._rowHeader.sectionSize(j1 + j);
      if (s === 0) {
        continue;
      }
      let k = rgn.rowCount++;
      rgn.rows[k] = j1 + j;
      rgn.rowSizes[k] = s;
      rgn.height += s;
    }

    // Bail if there are no visible rows.
    if (rgn.rowCount === 0) {
      return;
    }

    // Setup the cell data object for querying the data model.
    let data: DataModel.ICellData = {
      value: null,
      renderer: '',
      options: null
    };

    // Ensure there are sufficient renderer configs in the region.
    Private.ensureRendererConfigs(rgn);

    // Iterate over the columns in the region.
    for (let i = 0, x = rgn.x; i < rgn.columnCount; ++i) {

      // Lookup the column geometry.
      let column = rgn.columns[i];
      let width = rgn.columnSizes[i];

      // Iterate over the rows in the column.
      for (let j = 0, y = rgn.y; j < rgn.rowCount; ++j) {

        // Lookup the row geometry.
        let row = rgn.rows[j];
        let height = rgn.rowSizes[j];

        // Reset the cell data values.
        data.value = null;
        data.options = null;
        data.renderer = 'text'; // TODO: 'default' or '[default]'?

        // Fetch the model data for the cell.
        this._model.cellData(row, column, data);

        // Fetch the new cell renderer.
        let renderer = this._cellRenderers[data.renderer];

        // Do nothing if there is no renderer for the cell.
        // TODO: use an error cell renderer instead?
        if (!renderer) {
          continue;
        }

        // Update the region with the renderer for the cell.
        let k = rgn.renderCount++;
        rgn.cellRenderers[k] = renderer;

        // Update the cell renderer config.
        let config = rgn.rendererConfigs[k];
        config.x = x;
        config.y = y;
        config.width = width;
        config.height = height;
        config.row = row;
        config.column = column;
        config.value = data.value;
        config.options = data.options;

        // Increment the running Y coordinate.
        y += height;
      }

      // Increment the running X coordinate.
      x += width;
    }

    // Draw the grid background.
    Private.drawGridBackground(gc, rgn);

    // Draw the cell backgrounds.
    Private.drawCellBackgrounds(gc, rgn);

    // Draw the cell contents.
    Private.drawCellContents(gc, rgn);

    // Draw the grid lines.
    Private.drawGridLines(gc, rgn);

    // Draw the cell borders.
    Private.drawCellBorders(gc, rgn);
  }

  /**
   * Handle the `changed` signal of the cell renderers.
   */
  private _onCellRendererChanged(sender: CellRenderer): void { }

  private _scrollX = 0;
  private _scrollY = 0;
  private _inPaint = false;
  private _model: DataModel = null;
  private _buffer: HTMLCanvasElement;
  private _canvas: HTMLCanvasElement;
  private _rowHeader: GridHeader = null;
  private _columnHeader: GridHeader = null;
  private _dirtyRegion = new Private.Region();
  private _cellRenderers = Private.createRendererMap();
}


/**
 * The namespace for the `GridViewport` class statics.
 */
export
namespace GridViewport {
  /**
   * An options object for initializing a grid viewport.
   */
  export
  interface IOptions {

  }
}


/**
 * The namespace for the module private data.
 */
namespace Private {
  /**
   * An object which represents the dirty region of a grid.
   *
   * A dirty region is always aligned to whole-cell boundaries.
   */
  export
  class Region {
    /**
     * The X coordinate of the dirty region.
     *
     * This is the left coordinate of the first visible cell.
     */
    x = 0;

    /**
     * The Y coordinate of the dirty region.
     *
     * This is the top coordinate of the first visible cell.
     */
    y = 0;

    /**
     * The width of the dirty region.
     *
     * This is the total width of all visible columns in the region.
     */
    width = 0;

    /**
     * The height of the dirty region.
     *
     * This is the total height of all visible rows in the region.
     */
    height = 0;

    /**
     * The number of visible rows in the region.
     */
    rowCount = 0;

    /**
     * The number of visible columns in the region.
     */
    columnCount = 0;

    /**
     * The number of cells to be rendered in the region.
     *
     * This will be different from `rowCount * columnCount` when the
     * data model specifies renderers which have not be registered.
     */
    renderCount = 0;

    /**
     * The visible row indices in the region.
     *
     * Rows with zero size are omitted.
     *
     * Only the first `rowCount` elements are valid.
     */
    rows: number[] = [];

    /**
     * The visible column indices in the region.
     *
     * Columns with zero size are omitted.
     *
     * Only the first `columnCount` elements are valid.
     */
    columns: number[] = [];

    /**
     * The sizes of the rows in the region.
     *
     * Rows with zero size are omitted.
     *
     * Only the first `rowCount` elements are valid.
     */
    rowSizes: number[] = [];

    /**
     * The sizes of the columns in the region.
     *
     * Columns with zero size are omitted.
     *
     * Only the first `columnCount` elements are valid.
     */
    columnSizes: number[] = [];

    /**
     * The cell renderers for the cells in the region.
     *
     * Only the first `renderCount` elements are valid.
     */
    cellRenderers: CellRenderer[] = [];

    /**
     * The renderer configs for the cells in the region.
     *
     * Only the first `renderCount` elements are valid.
     */
    rendererConfigs: CellRenderer.IConfig[] = [];
  }

  /**
   * A type alias for a cell renderer map.
   */
  export
  type RendererMap = { [name: string]: CellRenderer };

  /**
   * Create a new renderer map for a grid viewport.
   */
  export
  function createRendererMap(): RendererMap {
    return Object.create(null);
  }

  /**
   * Ensure the region contains sufficient renderer configs.
   */
  export
  function ensureRendererConfigs(rgn: Region): void {
    let configs = rgn.rendererConfigs;
    let count = rgn.rowCount * rgn.columnCount;
    for (let n = configs.length; n < count; ++n) {
      configs[n] = {
        x: 0, y: 0, width: 0, height: 0,
        row: 0, column: 0, value: null, options: null
      };
    }
  }

  /**
   * Draw the grid background area for the given region.
   */
  export
  function drawGridBackground(gc: CanvasRenderingContext2D, rgn: Region): void {
    // Setup the renderering context
    gc.fillStyle = 'white';  // TODO make configurable

    // Fill the area with the background color
    gc.fillRect(rgn.x, rgn.y, rgn.width, rgn.height);
  }

  /**
   * Draw the grid lines for the given region.
   */
  export
  function drawGridLines(gc: CanvasRenderingContext2D, rgn: Region): void {
    // Store the current composite operation.
    let prevCompositeOp = gc.globalCompositeOperation;

    // Setup the rendering context.
    gc.lineWidth = 1;
    gc.lineCap = 'butt';
    gc.strokeStyle = '#DADADA';  // TODO make configurable
    gc.globalCompositeOperation = 'multiply';

    // Start the path for the grid lines.
    gc.beginPath();

    // Draw the vertical grid lines.
    let y1 = rgn.y;
    let y2 = rgn.y + rgn.height;
    for (let i = 0, x = rgn.x - 0.5; i < rgn.columnCount; ++i) {
      x += rgn.columnSizes[i];
      gc.moveTo(x, y1);
      gc.lineTo(x, y2);
    }

    // Draw the horizontal grid lines.
    let x1 = rgn.x;
    let x2 = rgn.x + rgn.width;
    for (let j = 0, y = rgn.y - 0.5; j < rgn.rowCount; ++j) {
      y += rgn.rowSizes[j];
      gc.moveTo(x1, y);
      gc.lineTo(x2, y);
    }

    // Stroke the path to render the lines.
    gc.stroke();

    // Restore the previous composite operation.
    gc.globalCompositeOperation = prevCompositeOp;
  }

  /**
   * Draw the backgrounds of the cells in the given region.
   */
  export
  function drawCellBackgrounds(gc: CanvasRenderingContext2D, rgn: Region): void {
    let { renderCount, cellRenderers, rendererConfigs } = rgn;
    for (let i = renderCount - 1; i >= 0; --i) {
      cellRenderers[i].drawBackground(gc, rendererConfigs[i]);
    }
  }

  /**
   * Draw the contents of the cells in the given region.
   */
  export
  function drawCellContents(gc: CanvasRenderingContext2D, rgn: Region): void {
    let { renderCount, cellRenderers, rendererConfigs } = rgn;
    for (let i = renderCount - 1; i >= 0; --i) {
      cellRenderers[i].drawContent(gc, rendererConfigs[i]);
    }
  }

  /**
   * Draw the borders of the cells in the given region.
   */
  export
  function drawCellBorders(gc: CanvasRenderingContext2D, rgn: Region): void {
    let { renderCount, cellRenderers, rendererConfigs } = rgn;
    for (let i = renderCount - 1; i >= 0; --i) {
      cellRenderers[i].drawBorder(gc, rendererConfigs[i]);
    }
  }
}
