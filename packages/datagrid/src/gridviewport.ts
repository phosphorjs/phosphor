/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * A widget which renders the visible cells of a grid.
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
    this.setFlag(WidgetFlag.DisallowLayout);

    // Set up the row and column sections lists.
    this._rowSections = new GridSectionList({ baseSize: 20 });
    this._colSections = new GridSectionList({ baseSize: 60 });
    this._rowHeaderSections = new GridSectionList({ baseSize: 60 });
    this._colHeaderSections = new GridSectionList({ baseSize: 20 });

    // Create the canvas and buffer objects.
    this._canvas = Private.createCanvas();
    this._buffer = Private.createCanvas();

    // Get the graphics contexts for the canvases.
    this._canvasGC = this._canvas.getContext('2d');
    this._bufferGC = this._buffer.getContext('2d');

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
    // TODO audit this
    this._model = null;
    super.dispose();
  }

  /**
   * Get the data model rendered by the viewport.
   */
  get model(): IDataModel | null {
    return this._model;
  }

  /**
   * Set the data model rendered by the viewport.
   */
  set model(value: DataModel | null) {
    // Do nothing if the model does not change.
    if (this._model === value) {
      return;
    }

    // Disconnect the change handler from the old model.
    if (this._model) {
      this._model.changed.disconnect(this._onChanged, this);
    }

    // Connect the change handler for the new model.
    if (value) {
      value.changed.connect(this._onChanged, this);
    }

    // Update the internal model reference.
    this._model = value;

    // TODO
    // - re-initialize the section lists.
    // - clear the canvas with the void color

    // Schedule a full update of the viewport.
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
  getCellRenderer(type: string): ICellRenderer | undefined {
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
  setCellRenderer(name: string, value: ICellRenderer | undefined): void {
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
  private _onChanged(sender: IDataModel, args: IDataModel.ChangedArgs): void { }

  /**
   *
   */
  private _paint(rx: number, ry: number, rw: number, rh: number): void {
    // Warn and bail if recursive painting is detected.
    if (this._inPaint) {
      console.warn('Recursive paint detected.');
      return;
    }

    // Save the canvas context.
    this._canvasGC.save();

    // Clip the canvas to the diry rect.
    this._canvasGC.beginPath();
    this._canvasGC.rect(rx, ry, rw, rh);
    this._canvasGC.clip();

    // Execute the actual painting logic.
    try {
      this._inPaint = true;
      this._draw(rx, ry, rw, rh);
    } finally {
      this._inPaint = false;
      this._canvasGC.restore();
    }
  }

  /**
   *
   */
  private _draw(rx: number, ry: number, rw: number, rh: number): void {
    // Fill the dirty rect with the void space color.
    this._canvasGC.fillStyle = '#D4D4D4';  // TODO make configurable.
    this._canvasGC.fillRect(rx, ry, rw, rh);

    // Draw the background for the main area.
    this._drawMainBackground(rx, ry, rw, rh);

    // Draw the grid striping for the main area.
    this._drawMainStriping(rx, ry, rw, rh);

    // Draw the cell content for the main area.
    this._drawMainCells(rx, ry, rw, rh);

    // Draw the grid lines for the main area.
    this._drawMainLines(rx, ry, rw, rh);

    // Draw the borders for the main area.
    this._drawMainBorders(rx, ry, rw, rh);

    // Draw the background for the header area.
    this._drawHeaderBackground(rx, ry, rw, rh);

    // Draw the cell content for the header area.
    this._drawHeaderCells(rx, ry, rw, rh);

    // Draw the grid lines for the header area.
    this._drawHeaderLines(rx, ry, rw, rh);

    // Draw the borders for the header area.
    this._drawHeaderBorders(rx, ry, rw, rh);
  }

  /**
   *
   */
  private _drawMainBackground(rx: number, ry: number, rw: number, rh: number): void {
    // Fetch the visible content dimensions.
    let contentW = this._colSections.totalSize - this._scrollX;
    let contentH = this._rowSections.totalSize - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Fetch the visible content origin.
    let contentX = this._rowHeaderSections.totalSize;
    let contentY = this._colHeaderSections.totalSize;

    // Bail if the region is fully outside of the visible content.
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }
    if (rx + rw < contentX) {
      return;
    }
    if (ry + rh < contentY) {
      return;
    }

    // Clamp the dirty region to the content bounds.
    let x1 = Math.max(rx, contentX);
    let y1 = Math.max(ry, contentY);
    let x2 = Math.min(rx + rw, contentX + contentW);
    let y2 = Math.min(ry + rh, contentY + contentH);

    // Fill the computed area with the background color.
    this._canvasGC.fillStyle = '#FFFFFF';  // TODO make configurable
    this._canvasGC.fillRect(x1, y1, x2 - x1, y2 - y1);
  }

  /**
   *
   */
  private _drawMainStriping(rx: number, ry: number, rw: number, rh: number): void {

  }

  /**
   *
   */
  private _drawMainCells(rx: number, ry: number, rw: number, rh: number): void {

  }

  /**
   *
   */
  private _drawMainLines(rx: number, ry: number, rw: number, rh: number): void {

  }

  /**
   *
   */
  private _drawMainBorders(rx: number, ry: number, rw: number, rh: number): void {

  }

  /**
   *
   */
  private _drawHeaderBackground(rx: number, ry: number, rw: number, rh: number): void {
    // Fetch the header sizes.
    let headerW = this._rowHeaderSections.totalSize;
    let headerH = this._colHeaderSections.totalSize;

    // Bail if there are no headers to draw.
    if (rx >= headerW && ry >= headerH) {
      return;
    }

    // Draw a single rect across the row headers if possible.
    if (rx + rw <= headerW || ry >= headerH) {
      let width = Math.min(rx + rw, headerW) - rx;
      this._canvasGC.fillStyle = '#F3F3F3';  // TODO make configurable
      this._canvasGC.fillRect(rx, ry, width, rh);
      return;
    }

    // Draw a single rect across the col headers if possible.
    if (ry + rh <= headerH || rx >= headerW) {
      let height = Math.min(ry + rh, headerH) - ry;
      this._canvasGC.fillStyle = '#F3F3F3';  // TODO make configurable
      this._canvasGC.fillRect(rx, ry, rw, height);
      return;
    }

    // Compute the rect across the row headers.
    let x1 = rx;
    let y1 = ry;
    let w1 = Math.min(rx + rw, headerW) - rx;
    let h1 = rh;

    // Compute the rect across the col headers.
    let x2 = w1;
    let y2 = ry;
    let w2 = rx + rw - w1;
    let h2 = Math.min(ry + rh, headerH) - rh;

    // Draw the rects for the headers.
    this._canvasGC.fillStyle = '#F3F3F3';  // TODO make configurable
    this._canvasGC.fillRect(x1, y1, w1, h1);
    this._canvasGC.fillRect(x2, y2, w2, h2);
  }

  /**
   *
   */
  private _drawHeaderCells(rx: number, ry: number, rw: number, rh: number): void {

  }

  /**
   *
   */
  private _drawHeaderLines(rx: number, ry: number, rw: number, rh: number): void {

  }

  /**
   *
   */
  private _drawHeaderBorders(rx: number, ry: number, rw: number, rh: number): void {

  }

  private _scrollX = 0;
  private _scrollY = 0;
  private _inPaint = false;
  private _model: IDataModel = null;
  private _canvas: HTMLCanvasElement;
  private _buffer: HTMLCanvasElement;
  private _rowSections: GridSectionList;
  private _colSections: GridSectionList;
  private _rowHeaderSections: GridSectionList;
  private _colHeaderSections: GridSectionList;
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
  type CellRendererMap = { [name: string]: ICellRenderer };

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
}
