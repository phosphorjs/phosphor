/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  Message, MessageLoop
} from '@phosphor/messaging';

import {
  Widget
} from '@phosphor/widgets';

import {
  CellRenderer
} from './cellrenderer';

import {
  DataModel
} from './datamodel';

import {
  SectionList
} from './sectionlist';

import {
  ISectionStriping
} from './sectionstriping';


/**
 * A widget which renders the visible cells of a data grid.
 *
 * #### Notes
 * User code will not normally interact with this class directly.
 *
 * The `DataGrid` class uses an instance of this class internally.
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
    this.addClass('p-GridViewport');
    this.setFlag(Widget.Flag.DisallowLayout);

    // Set up the row and column sections lists.
    this._rowSections = new SectionList({ baseSize: 20 });
    this._colSections = new SectionList({ baseSize: 64 });
    this._rowHeaderSections = new SectionList({ baseSize: 64 });
    this._colHeaderSections = new SectionList({ baseSize: 20 });

    // Create the canvas and buffer objects.
    this._canvas = Private.createCanvas();
    this._buffer = Private.createCanvas();

    // Get the graphics contexts for the canvases.
    this._canvasGC = this._canvas.getContext('2d')!;
    this._bufferGC = this._buffer.getContext('2d')!;

    // Set up the on-screen canvas.
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0px';
    this._canvas.style.left = '0px';
    this._canvas.style.width = '0px';
    this._canvas.style.height = '0px';

    // Add the on-screen canvas to the widget node.
    this.node.appendChild(this._canvas);
  }

  /**
   * Dispose of the resources held by the widget.
   */
  dispose(): void {
    // TODO audit this method
    this._dataModel = null;
    super.dispose();
  }

  /**
   * Get the data model rendered by the viewport.
   */
  get dataModel(): DataModel | null {
    return this._dataModel;
  }

  /**
   * Set the data model rendered by the viewport.
   */
  set dataModel(value: DataModel | null) {
    // Do nothing if the model does not change.
    if (this._dataModel === value) {
      return;
    }

    // Disconnect the change handler from the old model.
    if (this._dataModel) {
      this._dataModel.changed.disconnect(this._onChanged, this);
    }

    // Connect the change handler for the new model.
    if (value) {
      value.changed.connect(this._onChanged, this);
    }

    // Update the internal model reference.
    this._dataModel = value;

    // Clear the section lists.
    this._rowSections.clear();
    this._colSections.clear();
    this._rowHeaderSections.clear();
    this._colHeaderSections.clear();

    // TODO reset cell spans and borders.

    // Populate the section lists.
    if (value) {
      this._rowSections.insertSections(0, value.rowCount);
      this._colSections.insertSections(0, value.colCount);
      this._rowHeaderSections.insertSections(0, value.rowHeaderCount);
      this._colHeaderSections.insertSections(0, value.colHeaderCount);
    }

    // Schedule a full update of the viewport.
    this.update();
  }

  /**
   * Get the row striping object for the viewport.
   */
  get rowStriping(): ISectionStriping | null {
    return this._rowStriping;
  }

  /**
   * Set the row striping object for the viewport.
   */
  set rowStriping(value: ISectionStriping | null) {
    // Bail if the striping object does not change.
    if (this._rowStriping === value) {
      return;
    }

    // Store the value and schedule an update of the viewport.
    this._rowStriping = value;
    this.update();
  }

  /**
   * Get the column striping object for the viewport.
   */
  get colStriping(): ISectionStriping | null {
    return this._colStriping;
  }

  /**
   * Set the column striping object for the viewport.
   */
  set colStriping(value: ISectionStriping | null) {
    // Bail if the striping object does not change.
    if (this._colStriping === value) {
      return;
    }

    // Store the value and schedule an update of the viewport.
    this._colStriping = value;
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

  }

  /**
   * Get the cell renderer assigned to a given data type.
   *
   * @param type - The cell data type of interest.
   *
   * @returns The cell renderer for the given type, or `undefined`.
   */
  getCellRenderer(type: string): CellRenderer | undefined {
    return this._cellRenderers[type];
  }

  /**
   * Set the cell renderer for a given data type.
   *
   * @param type - The cell data type handled by the renderer.
   *
   * @param value - The cell renderer to assign for the data type.
   *
   * #### Notes
   * The given renderer will override the previous renderer for the
   * specified type. If the renderer is `undefined`, the previous
   * renderer will be removed.
   */
  setCellRenderer(name: string, value: CellRenderer | undefined): void {
    // Do nothing if the renderer does not change.
    if (this._cellRenderers[name] === value) {
      return;
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
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    this.fit();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
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
    this._canvas.width = width;
    this._canvas.height = height;
    this._buffer.width = width;
    this._buffer.height = height;

    // Update the canvas style to the new size.
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;

    // Repaint the viewport immediately.
    MessageLoop.sendMessage(this, Widget.Msg.UpdateRequest);
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
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
      this._bufferGC.clearRect(0, 0, width, height);
      this._bufferGC.drawImage(this._canvas, 0, 0);
    }

    // Resize the on-screen canvas to the new size.
    this._canvas.width = width;
    this._canvas.height = height;

    // Update the style of the on-screen canvas.
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;

    // Blit the buffer contents into the canvas, if needed.
    if (needBlit) {
      this._canvasGC.clearRect(0, 0, width, height);
      this._canvasGC.drawImage(this._buffer, 0, 0);
    }

    // Bail if nothing needs to be painted.
    if (width === 0 || height === 0) {
      return;
    }

    // Paint the whole canvas if the old size was zero.
    if (oldWidth === 0 || oldHeight === 0) {
      this._paint(0, 0, width, height);
      return;
    }

    // Compute the sizes of the dirty regions.
    let right = width - oldWidth;
    let bottom = height - oldHeight;

    // Paint the dirty region to the right, if needed.
    if (right > 0) {
      this._paint(oldWidth, 0, right, height);
    }

    // Paint the dirty region to the bottom, if needed.
    if (bottom > 0 && width > right) {
      this._paint(0, oldHeight, width - right, bottom);
    }
  }

  /**
   * A signal handler for the data model `changed` signal.
   */
  private _onChanged(sender: DataModel, args: DataModel.ChangedArgs): void { }

  /**
   * Paint the grid content for the given dirty rect.
   *
   * The rect should be expressed in viewport coordinates.
   *
   * This is the primary paint entry point. The individual `_draw*`
   * methods should not be invoked directly. This method dispatches
   * to the drawing methods in the correct order.
   */
  private _paint(rx: number, ry: number, rw: number, rh: number): void {
    // Warn and bail if recursive painting is detected.
    if (this._inPaint) {
      console.warn('Recursive paint detected.');
      return;
    }

    let t1 = performance.now();
    // Execute the actual drawing logic.
    try {
      this._inPaint = true;
      this._draw(rx, ry, rw, rh);
    } finally {
      this._inPaint = false;
    }
    let t2 = performance.now();
    console.log('paint', t2 - t1);
  }

  /**
   * Get the visible main cell region for the dirty rect.
   *
   * If no cells intersect the rect, `null` is returned.
   *
   * The returned cell region is expressed in viewport coordinates and
   * is aligned to the cell boundaries. This means that the region may
   * be slightly larger than the dirty rect.
   */
  private _getMainCellRegion(rx: number, ry: number, rw: number, rh: number): Private.ICellRegion | null {
    // Get the visible content dimensions.
    let contentW = this._colSections.totalSize - this._scrollX;
    let contentH = this._rowSections.totalSize - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return null;
    }

    // Get the visible content origin.
    let contentX = this._rowHeaderSections.totalSize;
    let contentY = this._colHeaderSections.totalSize;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw < contentX) {
      return null;
    }
    if (ry + rh < contentY) {
      return null;
    }
    if (rx >= contentX + contentW) {
      return null;
    }
    if (ry >= contentY + contentH) {
      return null;
    }

    // Get the upper and lower bounds of the dirty content area.
    let x1 = Math.max(rx, contentX);
    let y1 = Math.max(ry, contentY);
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._rowSections.sectionIndex(y1 - contentY + this._scrollY);
    let c1 = this._colSections.sectionIndex(x1 - contentX + this._scrollX);
    let r2 = this._rowSections.sectionIndex(y2 - contentY + this._scrollY + 1);
    let c2 = this._colSections.sectionIndex(x2 - contentX + this._scrollX + 1);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._rowSections.sectionCount - 1;
    }
    if (c2 < 0) {
      c2 = this._colSections.sectionCount - 1;
    }

    // Covert the cell bounds back to visible coordinates.
    let x = this._colSections.sectionOffset(c1) + contentX - this._scrollX;
    let y = this._rowSections.sectionOffset(r1) + contentY - this._scrollY;

    // Set up the cell region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let colSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the col sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._colSections.sectionSize(i);
      colSizes[i - c1] = size;
      width += size;
    }

    // Return the computed cell region.
    return { x, y, width, height, r1, c1, r2, c2, rowSizes, colSizes };
  }

  /**
   * Draw the grid content for the given dirty rect.
   *
   * This method computes the diry cell regions and clipping rects,
   * and dispatches to the relevant `_draw*` methods.
   */
  private _draw(rx: number, ry: number, rw: number, rh: number): void {
    // Draw the void background for the dirty rect.
    this._drawVoidBackground(rx, ry, rw, rh, '#F3F3F3');

    // Get the main cell region for the dirty dirty rect.
    let rgn = this._getMainCellRegion(rx, ry, rw, rh);

    // Draw the main cell region if needed.
    if (rgn) {
      // Compute the dirty visible content bounds.
      let x1 = Math.max(rx, this._rowHeaderSections.totalSize);
      let y1 = Math.max(ry, this._colHeaderSections.totalSize);
      let x2 = Math.min(rx + rw, rgn.x + rgn.width);
      let y2 = Math.min(ry + rh, rgn.y + rgn.height);

      // Save the gc state.
      this._canvasGC.save();

      // Clip to the dirty visible content bounds.
      this._canvasGC.beginPath();
      this._canvasGC.rect(x1, y1, x2 - x1, y2 - y1);
      this._canvasGC.clip();

      // Draw the background for the cell region.
      this._drawBackground(rgn, '#FFFFFF');

      // Draw the row striping for the cell region.
      this._drawRowStriping(rgn);

      // Draw the col striping for the cell region.
      this._drawColStriping(rgn);

      // Draw the cell content for the cell region.
      this._drawCells(rgn);

      // Draw the grid lines for the cell region.
      this._drawGridLines(rgn, '#D4D4D4');

      // Draw the borders for the cell region.
      this._drawBorders(rgn);

      // Restore the gc state.
      this._canvasGC.restore();
    }
  }

  /**
   * Draw the void background for the dirty rect.
   */
  private _drawVoidBackground(rx: number, ry: number, rw: number, rh: number, color: string): void {
    // Bail if there is no void color.
    if (!color) {
      return;
    }

    // Fill the dirty rect with the void color.
    this._canvasGC.fillStyle = color;
    this._canvasGC.fillRect(rx, ry, rw, rh);
  }

  /**
   * Draw the background for the given cell region.
   */
  private _drawBackground(rgn: Private.ICellRegion, color: string): void {
    // Bail if there is no background color.
    if (!color) {
      return;
    }

    // Fill the cell region with the background color.
    this._canvasGC.fillStyle = color;
    this._canvasGC.fillRect(rgn.x, rgn.y, rgn.width, rgn.height);
  }

  /**
   * Draw the row striping for the given cell region.
   */
  private _drawRowStriping(rgn: Private.ICellRegion): void {
    // Bail if there is no row striping.
    if (!this._rowStriping) {
      return;
    }

    // Draw the row striping for the region.
    for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
      // Fetch the size of the row.
      let size = rgn.rowSizes[j];

      // Skip zero sized rows.
      if (size === 0) {
        continue;
      }

      // Get the color for the row.
      let color = this._rowStriping.sectionColor(rgn.r1 + j);

      // Skip rows with no color.
      if (!color) {
        y += size;
        continue;
      }

      // Fill the row with the color.
      this._canvasGC.fillStyle = color;
      this._canvasGC.fillRect(rgn.x, y - 1, rgn.width, size + 1);

      // Increment the running Y coordinate.
      y += size;
    }
  }

  /**
   * Draw the column striping for the given cell region.
   */
  private _drawColStriping(rgn: Private.ICellRegion): void {
    // Bail if there is no column striping.
    if (!this._colStriping) {
      return;
    }

    // Draw the column striping for the region.
    for (let x = rgn.x, i = 0, n = rgn.colSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let size = rgn.colSizes[i];

      // Skip zero sized columns.
      if (size === 0) {
        continue;
      }

      // Get the color for the column.
      let color = this._colStriping.sectionColor(rgn.c1 + i);

      // Skip columns with no color.
      if (!color) {
        x += size;
        continue;
      }

      // Fill the column with the color.
      this._canvasGC.fillStyle = color;
      this._canvasGC.fillRect(x - 1, rgn.y, size + 1, rgn.height);

      // Increment the running X coordinate.
      x += size;
    }
  }

  /**
   * Draw the cells for the given cell region.
   */
  private _drawCells(rgn: Private.ICellRegion): void {
    // Bail if there is no data model.
    let dataModel = this._dataModel;
    if (!dataModel) {
      return;
    }

    // Set up the cell config object for rendering.
    let config = new Private.CellConfig();
    config.dataModel = dataModel;

    // Loop over the columns in the region.
    for (let x = rgn.x, i = 0, n = rgn.colSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let width = rgn.colSizes[i];

      // Skip zero sized columns.
      if (width === 0) {
        continue;
      }

      // Loop over the rows in the column.
      for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
        // Fetch the size of the row.
        let height = rgn.rowSizes[j];

        // Skip zero sized rows.
        if (height === 0) {
          continue;
        }

        // Compute the current row and col.
        let row = rgn.r1 + j;
        let col = rgn.c1 + i;

        // Get the data for the cell.
        let data = dataModel.data(row, col);

        // Skip empty cells.
        if (!data) {
          y += height;
          continue;
        }

        // Look up the renderer for the cell.
        let renderer = this._cellRenderers[data.type];

        // Skip cells with no renderers.
        if (!renderer) {
          y += height;
          continue;
        }

        // Update the config for the current cell.
        config.x = x - 1;
        config.y = y - 1;
        config.width = width + 1;
        config.height = height + 1;
        config.row = row;
        config.col = col;
        config.data = data;

        // Render the cell.
        renderer.drawCell(this._canvasGC, config);

        // Increment the running Y coordinate.
        y += height;
      }

      // Increment the running X coordinate.
      x += width;
    }
  }

  /**
   * Draw the grid lines for the given cell region.
   */
  private _drawGridLines(rgn: Private.ICellRegion, color: string): void {
    // Bail if there is no grid line color.
    if (!color) {
      return;
    }

    // Start the path for the grid lines.
    this._canvasGC.beginPath();

    // Draw the grid lines for the rows.
    for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
      // Fetch the size of the row.
      let size = rgn.rowSizes[j];

      // Skip zero sized rows.
      if (size === 0) {
        continue;
      }

      // Compute the Y position of the line.
      let pos = y + size - 0.5;

      // Draw the 1px thick row line.
      this._canvasGC.moveTo(rgn.x, pos);
      this._canvasGC.lineTo(rgn.x + rgn.width, pos);

      // Increment the running Y coordinate.
      y += size;
    }

    // Draw the grid lines for the columns.
    for (let x = rgn.x, i = 0, n = rgn.colSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let size = rgn.colSizes[i];

      // Skip zero sized columns.
      if (size === 0) {
        continue;
      }

      // Compute the X position of the line.
      let pos = x + size - 0.5;

      // Draw the 1px thick column line.
      this._canvasGC.moveTo(pos, rgn.y);
      this._canvasGC.lineTo(pos, rgn.y + rgn.height);

      // Increment the running X coordinate.
      x += size;
    }

    // Set the canvas composition mode.
    let prevMode = this._canvasGC.globalCompositeOperation;
    // The `multiply` mode is buggy of Firefox on Windows:
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1333090
    this._canvasGC.globalCompositeOperation = 'multiply';  // TODO make configurable?

    // Stroke the path with the grid line color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();

    // Restore the composition mode.
    this._canvasGC.globalCompositeOperation = prevMode;
  }

  /**
   * Draw the borders for the given cell region.
   */
  private _drawBorders(rgn: Private.ICellRegion): void {
    // TODO...
  }

  private _scrollX = 0;
  private _scrollY = 0;
  private _inPaint = false;
  private _dataModel: DataModel | null = null;
  private _rowStriping: ISectionStriping | null = null;
  private _colStriping: ISectionStriping | null = null;
  private _rowSections: SectionList;
  private _colSections: SectionList;
  private _rowHeaderSections: SectionList;
  private _colHeaderSections: SectionList;
  private _canvas: HTMLCanvasElement;
  private _buffer: HTMLCanvasElement;
  private _canvasGC: CanvasRenderingContext2D;
  private _bufferGC: CanvasRenderingContext2D;
  private _cellRenderers = Private.createCellRendererMap();
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
  interface IOptions { }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for a cell renderer map.
   */
  export
  type CellRendererMap = { [name: string]: CellRenderer };

  /**
   * Create a new renderer map for a grid viewport.
   */
  export
  function createCellRendererMap(): CellRendererMap {
    return Object.create(null);
  }

  /**
   * Create a new zero-sized canvas element.
   */
  export
  function createCanvas(): HTMLCanvasElement {
    let canvas = document.createElement('canvas');
    canvas.width = 0;
    canvas.height = 0;
    return canvas;
  }

  /**
   * An object which represents a cell region.
   */
  export
  interface ICellRegion {
    /**
     * The X coordinate the of the region, in viewport coordinates.
     *
     * #### Notes
     * This is aligned to the first cell boundary.
     */
    x: number;

    /**
     * The Y coordinate the of the region, in viewport coordinates.
     *
     * #### Notes
     * This is aligned to the first cell boundary.
     */
    y: number;

    /**
     * The total width of the cell region.
     *
     * #### Notes
     * This is aligned to the cell boundaries.
     */
    width: number;

    /**
     * The total height of the cell region.
     *
     * #### Notes
     * This is aligned to the cell boundaries.
     */
    height: number;

    /**
     * The row index of the first cell in the region.
     */
    r1: number;

    /**
     * The col index of the first cell in the region.
     */
    c1: number;

    /**
     * The row index of the last cell in the region.
     */
    r2: number;

    /**
     * The col index of the last cell in the region.
     */
    c2: number;

    /**
     * The row sizes for the rows in the region.
     */
    rowSizes: number[];

    /**
     * The col sizes for the cols in the region.
     */
    colSizes: number[];
  }

  /**
   * An object which holds cell config data.
   */
  export
  class CellConfig implements CellRenderer.ICellConfig {
    /**
     * The X coordinate of the cell in viewport coordinates.
     */
    x = 0;

    /**
     * The Y coordinate of the cell in viewport coordinates.
     */
    y = 0;

    /**
     * The width of the cell.
     */
    width = 0;

    /**
     * The width of the cell.
     */
    height = 0;

    /**
     * The row index of the cell.
     */
    row = 0;

    /**
     * The col index of the cell.
     */
    col = 0;

    /**
     * The data model for the cell.
     */
    dataModel: DataModel = null!;

    /**
     * The data value for the cell.
     */
    data: DataModel.ICellData = null!;
  }
}
