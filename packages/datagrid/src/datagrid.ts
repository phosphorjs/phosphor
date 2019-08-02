/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ElementExt
} from '@phosphor/domutils';

import {
  ConflatableMessage, IMessageHandler, Message, MessageLoop
} from '@phosphor/messaging';

import {
  GridLayout, ScrollBar, Widget
} from '@phosphor/widgets';

import {
  CellRenderer
} from './cellrenderer';

import {
  DataModel
} from './datamodel';

import {
  GraphicsContext
} from './graphicscontext';

import {
  RendererMap
} from './renderermap';

import {
  SectionList
} from './sectionlist';

import {
  TextRenderer
} from './textrenderer';


/**
 * A widget which implements a high-performance tabular data grid.
 *
 * #### Notes
 * A data grid is implemented as a composition of child widgets. These
 * child widgets are considered an implementation detail. Manipulating
 * the child widgets of a data grid directly is undefined behavior.
 *
 * This class is not designed to be subclassed.
 */
export
class DataGrid extends Widget {
  /**
   * Construct a new data grid.
   *
   * @param options - The options for initializing the data grid.
   */
  constructor(options: DataGrid.IOptions = {}) {
    super();
    this.addClass('p-DataGrid');

    // Parse the simple options.
    this._style = options.style || DataGrid.defaultStyle;
    this._headerVisibility = options.headerVisibility || 'all';
    this._cellRenderers = options.cellRenderers || new RendererMap();
    this._defaultRenderer = options.defaultRenderer || new TextRenderer();

    // Connect to the renderer map changed signal
    this._cellRenderers.changed.connect(this._onRenderersChanged, this);

    // Parse the default sizes.
    let defaultSizes = options.defaultSizes || DataGrid.defaultSizes;
    let rh = defaultSizes.rowHeight;
    let cw = defaultSizes.columnWidth;
    let rhw = defaultSizes.rowHeaderWidth;
    let chh = defaultSizes.columnHeaderHeight;

    // Set up the sections lists.
    this._rowSections = new SectionList({ defaultSize: rh });
    this._columnSections = new SectionList({ defaultSize: cw });
    this._rowHeaderSections = new SectionList({ defaultSize: rhw });
    this._columnHeaderSections = new SectionList({ defaultSize: chh });

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

    // Create the internal widgets for the data grid.
    this._viewport = new Widget();
    this._viewport.node.style.cursor = 'inherit';
    this._vScrollBar = new ScrollBar({ orientation: 'vertical' });
    this._hScrollBar = new ScrollBar({ orientation: 'horizontal' });
    this._scrollCorner = new Widget();

    // Add the extra class names to the child widgets.
    this._viewport.addClass('p-DataGrid-viewport');
    this._vScrollBar.addClass('p-DataGrid-scrollBar');
    this._hScrollBar.addClass('p-DataGrid-scrollBar');
    this._scrollCorner.addClass('p-DataGrid-scrollCorner');

    // Add the on-screen canvas to the viewport node.
    this._viewport.node.appendChild(this._canvas);

    // Install the message hook for the viewport.
    MessageLoop.installMessageHook(this._viewport, this);

    // Hide the scroll bars and corner from the outset.
    this._vScrollBar.hide();
    this._hScrollBar.hide();
    this._scrollCorner.hide();

    // Connect to the scroll bar signals.
    this._vScrollBar.thumbMoved.connect(this._onThumbMoved, this);
    this._hScrollBar.thumbMoved.connect(this._onThumbMoved, this);
    this._vScrollBar.pageRequested.connect(this._onPageRequested, this);
    this._hScrollBar.pageRequested.connect(this._onPageRequested, this);
    this._vScrollBar.stepRequested.connect(this._onStepRequested, this);
    this._hScrollBar.stepRequested.connect(this._onStepRequested, this);

    // Set the layout cell config for the child widgets.
    GridLayout.setCellConfig(this._viewport, { row: 0, column: 0 });
    GridLayout.setCellConfig(this._vScrollBar, { row: 0, column: 1 });
    GridLayout.setCellConfig(this._hScrollBar, { row: 1, column: 0 });
    GridLayout.setCellConfig(this._scrollCorner, { row: 1, column: 1 });

    // Create the layout for the data grid.
    let layout = new GridLayout({
      rowCount: 2,
      columnCount: 2,
      rowSpacing: 0,
      columnSpacing: 0,
      fitPolicy: 'set-no-constraint'
    });

    // Set the stretch factors for the grid.
    layout.setRowStretch(0, 1);
    layout.setRowStretch(1, 0);
    layout.setColumnStretch(0, 1);
    layout.setColumnStretch(1, 0);

    // Add the child widgets to the layout.
    layout.addWidget(this._viewport);
    layout.addWidget(this._vScrollBar);
    layout.addWidget(this._hScrollBar);
    layout.addWidget(this._scrollCorner);

    // Install the layout on the data grid.
    this.layout = layout;
  }

  /**
   * Dispose of the resources held by the widgets.
   */
  dispose(): void {
    this._model = null;
    this._rowSections.clear();
    this._columnSections.clear();
    this._rowHeaderSections.clear();
    this._columnHeaderSections.clear();
    super.dispose();
  }

  /**
   * Get the data model for the data grid.
   */
  get model(): DataModel | null {
    return this._model;
  }

  /**
   * Set the data model for the data grid.
   */
  set model(value: DataModel | null) {
    // Do nothing if the model does not change.
    if (this._model === value) {
      return;
    }

    // Disconnect the change handler from the old model.
    if (this._model) {
      this._model.changed.disconnect(this._onModelChanged, this);
    }

    // Connect the change handler for the new model.
    if (value) {
      value.changed.connect(this._onModelChanged, this);
    }

    // Update the internal model reference.
    this._model = value;

    // Clear the section lists.
    this._rowSections.clear();
    this._columnSections.clear();
    this._rowHeaderSections.clear();
    this._columnHeaderSections.clear();

    // Populate the section lists.
    if (value) {
      this._rowSections.insert(0, value.rowCount('body'));
      this._columnSections.insert(0, value.columnCount('body'));
      this._rowHeaderSections.insert(0, value.columnCount('row-header'));
      this._columnHeaderSections.insert(0, value.rowCount('column-header'));
    }

    // Reset the scroll position.
    this._scrollX = 0;
    this._scrollY = 0;

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the style for the data grid.
   */
  get style(): DataGrid.Style {
    return this._style;
  }

  /**
   * Set the style for the data grid.
   */
  set style(value: DataGrid.Style) {
    // Bail if the style does not change.
    if (this._style === value) {
      return;
    }

    // Update the internal style.
    this._style = { ...value };

    // Schedule a full repaint of the grid.
    this._repaint();
  }

  /**
   * Get the cell renderer map for the data grid.
   */
  get cellRenderers(): RendererMap {
    return this._cellRenderers;
  }

  /**
   * Set the cell renderer map for the data grid.
   */
  set cellRenderers(value: RendererMap) {
    // Bail if the renderer map does not change.
    if (this._cellRenderers === value) {
      return;
    }

    // Disconnect the old map.
    this._cellRenderers.changed.disconnect(this._onRenderersChanged, this);

    // Connect the new map.
    value.changed.connect(this._onRenderersChanged, this);

    // Update the internal renderer map.
    this._cellRenderers = value;

    // Schedule a full repaint of the grid.
    this._repaint();
  }

  /**
   * Get the default cell renderer for the data grid.
   */
  get defaultRenderer(): CellRenderer {
    return this._defaultRenderer;
  }

  /**
   * Set the default cell renderer for the data grid.
   */
  set defaultRenderer(value: CellRenderer) {
    // Bail if the renderer does not change.
    if (this._defaultRenderer === value) {
      return;
    }

    // Update the internal renderer.
    this._defaultRenderer = value;

    // Schedule a full repaint of the grid.
    this._repaint();
  }

  /**
   * Get the header visibility for the data grid.
   */
  get headerVisibility(): DataGrid.HeaderVisibility {
    return this._headerVisibility;
  }

  /**
   * Set the header visibility for the data grid.
   */
  set headerVisibility(value: DataGrid.HeaderVisibility) {
    // Bail if the visibility does not change.
    if (this._headerVisibility === value) {
      return;
    }

    // Update the internal visibility.
    this._headerVisibility = value;

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the default sizes for the various sections of the data grid.
   */
  get baseSizes(): DataGrid.DefaultSizes {
    let rowHeight = this._rowSections.defaultSize;
    let columnWidth = this._columnSections.defaultSize;
    let rowHeaderWidth = this._rowHeaderSections.defaultSize;
    let columnHeaderHeight = this._columnHeaderSections.defaultSize;
    return { rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight };
  }

  /**
   * Set the base sizes for the various sections of the data grid.
   */
  set baseSizes(value: DataGrid.DefaultSizes) {
    this._rowSections.defaultSize = value.rowHeight;
    this._columnSections.defaultSize = value.columnWidth;
    this._rowHeaderSections.defaultSize = value.rowHeaderWidth;
    this._columnHeaderSections.defaultSize = value.columnHeaderHeight;
    this._syncViewport();
  }

  /**
   * Process a message sent to the widget.
   *
   * @param msg - The message sent to the widget.
   */
  processMessage(msg: Message): void {
    // Ignore child show/hide messages. The data grid controls the
    // visibility of its children, and will manually dispatch the
    // fit-request messages as a result of visibility change.
    if (msg.type === 'child-shown' || msg.type === 'child-hidden') {
      return;
    }

    // Recompute the scroll bar minimums before the layout refits.
    if (msg.type === 'fit-request') {
      let vsbLimits = ElementExt.sizeLimits(this._vScrollBar.node);
      let hsbLimits = ElementExt.sizeLimits(this._hScrollBar.node);
      this._vScrollBarMinWidth = vsbLimits.minWidth;
      this._hScrollBarMinHeight = hsbLimits.minHeight;
    }

    // Process all other messages as normal.
    super.processMessage(msg);
  }

  /**
   * Intercept a message sent to a message handler.
   *
   * @param handler - The target handler of the message.
   *
   * @param msg - The message to be sent to the handler.
   *
   * @returns `true` if the message should continue to be processed
   *   as normal, or `false` if processing should cease immediately.
   */
  messageHook(handler: IMessageHandler, msg: Message): boolean {
    if (handler === this._viewport) {
      this._processViewportMessage(msg);
    }
    return true;
  }

  /**
   * Handle the DOM events for the data grid.
   *
   * @param event - The DOM event sent to the data grid.
   *
   * #### Notes
   * This method implements the DOM `EventListener` interface and is
   * called in response to events on the data grid's DOM node. It
   * should not be called directly by user code.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
    case 'wheel':
      this._evtWheel(event as WheelEvent);
      break;
    case 'resize':
      this._refreshDPI();
      break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('wheel', this);
    window.addEventListener('resize', this);
    this._repaint();
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('wheel', this);
    window.removeEventListener('resize', this);
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    this._repaint();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    this._syncScrollState();
  }

  /**
   * The virtual width of the row headers.
   *
   * This will be `0` if the row headers are hidden.
   */
  private get _headerWidth(): number {
    if (this._headerVisibility === 'none') {
      return 0;
    }
    if (this._headerVisibility === 'column') {
      return 0;
    }
    return this._rowHeaderSections.length;
  }

  /**
   * The virtual height of the column headers.
   *
   * This will be `0` if the column headers are hidden.
   */
  private get _headerHeight(): number {
    if (this._headerVisibility === 'none') {
      return 0;
    }
    if (this._headerVisibility === 'row') {
      return 0;
    }
    return this._columnHeaderSections.length;
  }

  /**
   * The virtual width of the grid body.
   */
  private get _bodyWidth(): number {
    return this._columnSections.length;
  }

  /**
   * The virtual height of the grid body.
   */
  private get _bodyHeight(): number {
    return this._rowSections.length;
  }

  /**
   * The width of the visible portion of the body cells.
   */
  private get _pageWidth(): number {
    return Math.max(0, this._viewportWidth - this._headerWidth);
  }

  /**
   * The height of the visible portion of the body cells.
   */
  private get _pageHeight(): number {
    return Math.max(0, this._viewportHeight - this._headerHeight);
  }

  /**
   * The maximum scroll X position for the current grid dimensions.
   *
   * #### Notes
   * This value is `1px` less than the theoretical maximum to allow the
   * the right-most grid line to be clipped when the vertical scroll bar
   * is visible.
   */
  private get _maxScrollX(): number {
    return Math.max(0, this._bodyWidth - this._pageWidth - 1);
  }

  /**
   * The maximum scroll Y position for the current grid dimensions.
   *
   * #### Notes
   * This value is `1px` less than the theoretical maximum to allow the
   * the bottom-most grid line to be clipped when the horizontal scroll
   * bar is visible.
   */
  private get _maxScrollY(): number {
    return Math.max(0, this._bodyHeight - this._pageHeight - 1);
  }

  /**
   * Scroll the viewport by the specified amount.
   */
  private _scrollBy(dx: number, dy: number): void {
    this._scrollTo(this._hScrollBar.value + dx, this._vScrollBar.value + dy);
  }

  /**
   * Scroll the viewport by one page.
   */
  private _scrollByPage(dir: 'up' | 'down' | 'left' | 'right'): void {
    let dx = 0;
    let dy = 0;
    let x = this._hScrollBar.value;
    let y = this._vScrollBar.value;
    switch (dir) {
    case 'up':
      dy = -this._pageHeight;
      break;
    case 'down':
      dy = this._pageHeight;
      break;
    case 'left':
      dx = -this._pageWidth;
      break;
    case 'right':
      dx = this._pageWidth;
      break;
    default:
      throw 'unreachable';
    }
    this._scrollTo(x + dx, y + dy);
  }

  /**
   * Scroll the viewport by one cell-aligned step.
   *
   * @param - The desired direction of the scroll.
   */
  private _scrollByStep(dir: 'up' | 'down' | 'left' | 'right'): void {
    let r: number;
    let c: number;
    let x = this._hScrollBar.value;
    let y = this._vScrollBar.value;
    let rows = this._rowSections;
    let columns = this._columnSections;
    switch (dir) {
    case 'up':
      r = rows.indexOf(y - 1);
      y = r < 0 ? y : rows.offsetOf(r);
      break;
    case 'down':
      r = rows.indexOf(y);
      y = r < 0 ? y : rows.offsetOf(r) + rows.sizeOf(r);
      break;
    case 'left':
      c = columns.indexOf(x - 1);
      x = c < 0 ? x : columns.offsetOf(c);
      break;
    case 'right':
      c = columns.indexOf(x);
      x = c < 0 ? x : columns.offsetOf(c) + columns.sizeOf(c);
      break;
    default:
      throw 'unreachable';
    }
    this._scrollTo(x, y);
  }

  /**
   * Scroll to the specified offset position.
   */
  private _scrollTo(x: number, y: number): void {
    // Floor and clamp the position to the allowable range.
    x = Math.max(0, Math.min(Math.floor(x), this._maxScrollX));
    y = Math.max(0, Math.min(Math.floor(y), this._maxScrollY));

    // Update the scroll bar values with the desired position.
    this._hScrollBar.value = x;
    this._vScrollBar.value = y;

    // Post a scroll request message to the viewport.
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest);
  }

  /**
   * Schedule a repaint of the data grid.
   */
  private _repaint(): void;
  private _repaint(x: number, y: number, w: number, h: number): void;
  private _repaint(): void {
    // Parse the arguments.
    let x: number;
    let y: number;
    let w: number;
    let h: number;
    switch (arguments.length) {
    case 0:
      x = 0;
      y = 0;
      w = this._viewportWidth;
      h = this._viewportHeight;
      break;
    case 4:
      x = Math.floor(arguments[0]);
      y = Math.floor(arguments[1]);
      w = Math.floor(arguments[2]);
      h = Math.floor(arguments[3]);
      break;
    default:
      throw 'unreachable';
    }

    // Bail early if there is nothing to paint.
    if (w <= 0 || h <= 0) {
      return;
    }

    // Set the paint pending flag.
    this._paintPending = true;

    // Create the paint request message.
    let msg = new Private.PaintRequest(x, y, x + w - 1, y + h - 1);

    // Post the paint request to the viewport.
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Refresh the internal dpi ratio.
   *
   * This will update the canvas size and schedule a repaint if needed.
   */
  private _refreshDPI(): void {
    // Get the best integral value for the dpi ratio.
    let dpiRatio = Math.ceil(window.devicePixelRatio);

    // Bail early if the computed dpi ratio has not changed.
    if (this._dpiRatio === dpiRatio) {
      return;
    }

    // Update the internal dpi ratio.
    this._dpiRatio = dpiRatio;

    // Schedule a full repaint of the grid.
    this._repaint();

    // Update the canvas size for the new dpi ratio.
    this._resizeCanvasIfNeeded(this._viewportWidth, this._viewportHeight);

    // Ensure the canvas style is scaled for the new ratio.
    this._canvas.style.width = `${this._canvas.width / this._dpiRatio}px`;
    this._canvas.style.height = `${this._canvas.height / this._dpiRatio}px`;
  }

  /**
   * Ensure the canvas is at least the specified size.
   *
   * This method will retain the valid canvas content.
   */
  private _resizeCanvasIfNeeded(width: number, height: number): void {
    // Scale the size by the dpi ratio.
    width = width * this._dpiRatio;
    height = height * this._dpiRatio;

    // Compute the maximum canvas size for the given width.
    let maxW = (Math.ceil((width + 1) / 512) + 1) * 512;
    let maxH = (Math.ceil((height + 1) / 512) + 1) * 512;

    // Get the current size of the canvas.
    let curW = this._canvas.width;
    let curH = this._canvas.height;

    // Bail early if the canvas size is within bounds.
    if (curW >= width && curH >= height && curW <= maxW && curH <= maxH) {
      return;
    }

    // Compute the expanded canvas size.
    let expW = maxW - 512;
    let expH = maxH - 512;

    // Set the transforms to the identity matrix.
    this._canvasGC.setTransform(1, 0, 0, 1, 0, 0);
    this._bufferGC.setTransform(1, 0, 0, 1, 0, 0);

    // Resize the buffer width if needed.
    if (curW < width) {
      this._buffer.width = expW;
    } else if (curW > maxW) {
      this._buffer.width = maxW;
    }

    // Resize the buffer height if needed.
    if (curH < height) {
      this._buffer.height = expH;
    } else if (curH > maxH) {
      this._buffer.height = maxH;
    }

    // Test whether there is content to blit.
    let needBlit = curH > 0 && curH > 0 && width > 0 && height > 0;

    // Copy the valid content into the buffer if needed.
    if (needBlit) {
      this._bufferGC.drawImage(this._canvas, 0, 0);
    }

    // Resize the canvas width if needed.
    if (curW < width) {
      this._canvas.width = expW;
      this._canvas.style.width = `${expW / this._dpiRatio}px`;
    } else if (curW > maxW) {
      this._canvas.width = maxW;
      this._canvas.style.width = `${maxW / this._dpiRatio}px`;
    }

    // Resize the canvas height if needed.
    if (curH < height) {
      this._canvas.height = expH;
      this._canvas.style.height = `${expH / this._dpiRatio}px`;
    } else if (curH > maxH) {
      this._canvas.height = maxH;
      this._canvas.style.height = `${maxH / this._dpiRatio}px`;
    }

    // Copy the valid content from the buffer if needed.
    if (needBlit) {
      this._canvasGC.drawImage(this._buffer, 0, 0);
    }
  }

  /**
   * Sync the scroll bars and scroll state with the viewport.
   *
   * #### Notes
   * If the visibility of either scroll bar changes, a synchronous
   * fit-request will be dispatched to the data grid to immediately
   * resize the viewport.
   */
  private _syncScrollState(): void {
    // Fetch the viewport dimensions.
    let bw = this._bodyWidth;
    let bh = this._bodyHeight;
    let pw = this._pageWidth;
    let ph = this._pageHeight;

    // Get the current scroll bar visibility.
    let hasVScroll = !this._vScrollBar.isHidden;
    let hasHScroll = !this._hScrollBar.isHidden;

    // Get the minimum sizes of the scroll bars.
    let vsw = this._vScrollBarMinWidth;
    let hsh = this._hScrollBarMinHeight;

    // Get the page size as if no scroll bars are visible.
    let apw = pw + (hasVScroll ? vsw : 0);
    let aph = ph + (hasHScroll ? hsh : 0);

    // Test whether scroll bars are needed for the adjusted size.
    let needVScroll = aph < bh - 1;
    let needHScroll = apw < bw - 1;

    // Re-test the horizontal scroll if a vertical scroll is needed.
    if (needVScroll && !needHScroll) {
      needHScroll = (apw - vsw) < bw - 1;
    }

    // Re-test the vertical scroll if a horizontal scroll is needed.
    if (needHScroll && !needVScroll) {
      needVScroll = (aph - hsh) < bh - 1;
    }

    // If the visibility changes, immediately refit the grid.
    if (needVScroll !== hasVScroll || needHScroll !== hasHScroll) {
      this._vScrollBar.setHidden(!needVScroll);
      this._hScrollBar.setHidden(!needHScroll);
      this._scrollCorner.setHidden(!needVScroll || !needHScroll);
      MessageLoop.sendMessage(this, Widget.Msg.FitRequest);
    }

    // Update the scroll bar limits.
    this._vScrollBar.maximum = this._maxScrollY;
    this._vScrollBar.page = this._pageHeight;
    this._hScrollBar.maximum = this._maxScrollX;
    this._hScrollBar.page = this._pageWidth;

    // Re-clamp the scroll position.
    this._scroll(this._scrollX, this._scrollY);
  }

  /**
   * Sync the viewport to the given scroll position.
   *
   * #### Notes
   * This schedules a full repaint and syncs the scroll state.
   */
  private _syncViewport(): void {
    // Schedule a full repaint of the viewport.
    this._repaint();

    // Sync the scroll state after requesting the repaint.
    this._syncScrollState();
  }

  /**
   * Process a message sent to the viewport
   */
  private _processViewportMessage(msg: Message): void {
    switch (msg.type) {
    case 'scroll-request':
      this._onViewportScrollRequest(msg);
      break;
    case 'resize':
      this._onViewportResize(msg as Widget.ResizeMessage);
      break;
    case 'paint-request':
      this._onViewportPaintRequest(msg as Private.PaintRequest);
      break;
    default:
      break;
    }
  }

  /**
   * A message hook invoked on a viewport `'scroll-request'` message.
   */
  private _onViewportScrollRequest(msg: Message): void {
    this._scroll(this._hScrollBar.value, this._vScrollBar.value);
  }

  /**
   * A message hook invoked on a viewport `'resize'` message.
   */
  private _onViewportResize(msg: Widget.ResizeMessage): void {
    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Unpack the message data.
    let { width, height } = msg;

    // Measure the viewport node if the dimensions are unknown.
    if (width === -1) {
      width = this._viewport.node.offsetWidth;
    }
    if (height === -1) {
      height = this._viewport.node.offsetHeight;
    }

    // Round the dimensions to the nearest pixel.
    width = Math.round(width);
    height = Math.round(height);

    // Get the current size of the viewport.
    let oldWidth = this._viewportWidth;
    let oldHeight = this._viewportHeight;

    // Updated internal viewport size.
    this._viewportWidth = width;
    this._viewportHeight = height;

    // Resize the canvas if needed.
    this._resizeCanvasIfNeeded(width, height);

    // Compute the sizes of the dirty regions.
    let right = width - oldWidth;
    let bottom = height - oldHeight;

    // Bail if nothing needs to be painted.
    if (right <= 0 && bottom <= 0) {
      return;
    }

    // If there is a paint pending, ensure it paints everything.
    if (this._paintPending) {
      this._repaint();
      return;
    }

    // Paint the whole viewport if the old size was zero.
    if (oldWidth === 0 || oldHeight === 0) {
      this._paint(0, 0, width, height);
      return;
    }

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
   * A message hook invoked on a viewport `'paint-request'` message.
   */
  private _onViewportPaintRequest(msg: Private.PaintRequest): void {
    // Clear the paint pending flag.
    this._paintPending = false;

    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Bail early if the viewport has zero area.
    if (this._viewportWidth === 0 || this._viewportHeight === 0) {
      return;
    }

    // Compute the paint bounds.
    let xMin = 0;
    let yMin = 0;
    let xMax = this._viewportWidth - 1;
    let yMax = this._viewportHeight - 1;

    // Unpack the message data.
    let { x1, y1, x2, y2 } = msg;

    // Bail early if the dirty rect is outside the bounds.
    if (x2 < xMin || y2 < yMin || x1 > xMax || y1 > yMax) {
      return;
    }

    // Clamp the dirty rect to the paint bounds.
    x1 = Math.max(xMin, Math.min(x1, xMax));
    y1 = Math.max(yMin, Math.min(y1, yMax));
    x2 = Math.max(xMin, Math.min(x2, xMax));
    y2 = Math.max(yMin, Math.min(y2, yMax));

    // Paint the dirty rect.
    this._paint(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
  }

  /**
   * Handle the `thumbMoved` signal from a scroll bar.
   */
  private _onThumbMoved(sender: ScrollBar): void {
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest);
  }

  /**
   * Handle the `pageRequested` signal from a scroll bar.
   */
  private _onPageRequested(sender: ScrollBar, dir: 'decrement' | 'increment'): void {
    if (sender === this._vScrollBar) {
      this._scrollByPage(dir === 'decrement' ? 'up' : 'down');
    } else {
      this._scrollByPage(dir === 'decrement' ? 'left' : 'right');
    }
  }

  /**
   * Handle the `stepRequested` signal from a scroll bar.
   */
  private _onStepRequested(sender: ScrollBar, dir: 'decrement' | 'increment'): void {
    if (sender === this._vScrollBar) {
      this._scrollByStep(dir === 'decrement' ? 'up' : 'down');
    } else {
      this._scrollByStep(dir === 'decrement' ? 'left' : 'right');
    }
  }

  /**
   * A signal handler for the data model `changed` signal.
   */
  private _onModelChanged(sender: DataModel, args: DataModel.ChangedArgs): void {
    switch (args.type) {
    case 'rows-removed':
    case 'rows-inserted':
    case 'columns-removed':
    case 'columns-inserted':
      this._onSectionsChanged(args);
      break;
    case 'rows-moved':
    case 'columns-moved':
      this._onSectionsMoved(args);
      break;
    case 'cells-changed':
      this._onCellsChanged(args);
      break;
    case 'model-reset':
      this._onModelReset(args);
      break;
    default:
      throw 'unreachable';
    }
  }

  /**
   * Handle sections changing in the data model.
   */
  private _onSectionsChanged(args: DataModel.IRowsChangedArgs | DataModel.IColumnsChangedArgs): void {
    // TODO clean up this method. It's ugly.

    // Unpack the arg data.
    let { region, type, index, span } = args;

    // Bail early if there are no sections to insert.
    if (span <= 0) {
      return;
    }

    // Determine the behavior of the change type.
    let isRows = type === 'rows-inserted' || type === 'rows-removed';
    let isRemove = type === 'rows-removed' || type === 'columns-removed';

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = isRows ? this._rowSections : this._columnSections;
    } else {
      list = isRows ? this._columnHeaderSections : this._rowHeaderSections;
    }

    // Bail if the index is out of range.
    if (isRemove && (index < 0 || index >= list.count)) {
      return;
    }

    // Compute the paint offset and handle region-specific behavior.
    let offset: number;
    if (region !== 'body') {
      // Compute the paint offset.
      if (index >= list.count) {
        offset = list.length;
      } else {
        offset = list.offsetOf(index);
      }

      // Remove or insert the sections as needed.
      if (isRemove) {
        list.remove(index, span);
      } else {
        list.insert(index, span);
      }
    } else {
      // Look up the initial scroll geometry.
      let scrollPos1: number;
      let maxScrollPos1: number;
      if (isRows) {
        scrollPos1 = this._scrollY;
        maxScrollPos1 = this._maxScrollY;
      } else {
        scrollPos1 = this._scrollX;
        maxScrollPos1 = this._maxScrollX;
      }

      // Look up the target position.
      let targetPos: number;
      if (index >= list.count) {
        targetPos = list.length;
      } else {
        targetPos = list.offsetOf(index);
      }

      // Remove or Insert the sections and save the pre- and post- size.
      let size1 = list.length;
      if (isRemove) {
        list.remove(index, span);
      } else {
        list.insert(index, span);
      }
      let size2 = list.length;

      // Fetch the new max scroll position.
      let maxScrollPos2: number;
      if (isRows) {
        maxScrollPos2 = this._maxScrollY;
      } else {
        maxScrollPos2 = this._maxScrollX;
      }

      // Adjust the scroll position as needed.
      let scrollPos2: number;
      if (scrollPos1 === 0) {
        scrollPos2 = 0;
      } else if (scrollPos1 === maxScrollPos1) {
        scrollPos2 = maxScrollPos2;
      } else if (isRemove && targetPos <= scrollPos1) {
        let delta = Math.min(scrollPos1 - targetPos, size1 - size2);
        scrollPos2 = Math.min(scrollPos1 - delta, maxScrollPos2);
      } else if (targetPos <= scrollPos1) {
        scrollPos2 = Math.min(scrollPos1 + size2 - size1, maxScrollPos2);
      } else {
        scrollPos2 = scrollPos1;
      }

      // Update the scroll position and compute the paint offset.
      if (isRows) {
        this._scrollY = scrollPos2;
        offset = this._headerHeight;
      } else {
        this._scrollX = scrollPos2;
        offset = this._headerWidth;
      }

      // Adjust the paint offset if the scroll position did not change.
      if (scrollPos1 === scrollPos2) {
        offset = Math.max(offset, offset + targetPos - scrollPos1);
      }
    }

    // Compute the dirty area.
    let x = isRows ? 0 : offset;
    let y = isRows ? offset : 0;
    let w = this._viewportWidth - x;
    let h = this._viewportHeight - y;

    // Schedule a repaint of the dirty area, if needed.
    if (w > 0 && h > 0) {
      this._repaint(x, y, w, h);
    }

    // Sync the scroll state after queueing the repaint.
    this._syncScrollState();
  }

  /**
   * Handle sections moving in the data model.
   */
  private _onSectionsMoved(args: DataModel.IRowsMovedArgs | DataModel.IColumnsMovedArgs): void {
    // Unpack the arg data.
    let { region, type, index, span, destination } = args;

    // Bail early if there are no sections to move.
    if (span <= 0) {
      return;
    }

    // Determine the behavior of the change type.
    let isRows = type === 'rows-moved';

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = isRows ? this._rowSections : this._columnSections;
    } else {
      list = isRows ? this._columnHeaderSections : this._rowHeaderSections;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Clamp the move span to the limit.
    span = Math.min(span, list.count - index);

    // Clamp the destination index to the limit.
    destination = Math.min(Math.max(0, destination), list.count - span);

    // Bail early if there is no effective move.
    if (index === destination) {
      return;
    }

    // Compute the first affected index.
    let i1 = Math.min(index, destination);

    // Compute the last affected index.
    let i2 = Math.max(index + span - 1, destination + span - 1);

    // Compute the first paint boundary.
    let p1 = list.offsetOf(i1);

    // Compute the last paint boundary.
    let p2: number;
    if (i2 >= list.count - 1) {
      p2 = list.length - 1;
    } else {
      p2 = list.offsetOf(i2 + 1) - 1;
    }

    // Move the sections in the list.
    list.move(index, span, destination);

    // Fetch the row header and column header sizes.
    let hw = this._headerWidth;
    let hh = this._headerHeight;

    // Set up the initial paint limits.
    let xMin = 0;
    let yMin = 0;
    let xMax = this._viewportWidth - 1;
    let yMax = this._viewportHeight - 1;

    // Set up the initial paint region.
    let x1 = xMin;
    let y1 = yMin;
    let x2 = xMax;
    let y2 = yMax;

    // Adjust the limits and paint region.
    switch (region) {
    case 'body':
      if (isRows) {
        yMin = hh;
        y1 = hh + p1 - this._scrollY;
        y2 = hh + p2 - this._scrollY;
      } else {
        xMin = hw;
        x1 = hw + p1 - this._scrollX;
        x2 = hw + p2 - this._scrollX;
      }
      break;
    case 'row-header':
      xMax = Math.min(hw - 1, xMax);
      x1 = p1;
      x2 = p2;
      break;
    case 'column-header':
      yMax = Math.min(hh - 1, yMax);
      y1 = p1;
      y2 = p2;
      break;
    default:
      throw 'unreachable';
    }

    // Bail early if the paint limits are empty.
    if (xMax < xMin || yMax < yMin) {
      return;
    }

    // Bail early if the dirty region is out of range.
    if (x2 < xMin || x1 > xMax || y2 < yMin || y1 > yMax) {
      return;
    }

    // Compute the dirty area.
    let x = Math.max(xMin, x1);
    let y = Math.max(yMin, y1);
    let w = Math.min(x2, xMax) - x + 1;
    let h = Math.min(y2, yMax) - y + 1;

    // Schedule a repaint of the dirty area, if needed.
    if (w > 0 && h > 0) {
      this._repaint(x, y, w, h);
    }
  }

  /**
   * Handle cells changing in the data model.
   */
  private _onCellsChanged(args: DataModel.ICellsChangedArgs): void {
    // Unpack the arg data.
    let { region, rowIndex, columnIndex, rowSpan, columnSpan } = args;

    // Bail early if there are no cells to modify.
    if (rowSpan <= 0 && columnSpan <= 0) {
      return;
    }

    // Look up the relevant row and column lists.
    let rList: SectionList;
    let cList: SectionList;
    switch (region) {
    case 'body':
      rList = this._rowSections;
      cList = this._columnSections;
      break;
    case 'row-header':
      rList = this._rowSections;
      cList = this._rowHeaderSections;
      break;
    case 'column-header':
      rList = this._columnHeaderSections;
      cList = this._columnSections;
      break;
    case 'corner-header':
      rList = this._columnHeaderSections;
      cList = this._rowHeaderSections;
      break;
    default:
      throw 'unreachable';
    }

    // Bail early if the changed cells are out of range.
    if (rowIndex >= rList.count || columnIndex >= cList.count) {
      return;
    }

    // Look up the unscrolled top-left corner of the range.
    let x1 = cList.offsetOf(columnIndex);
    let y1 = rList.offsetOf(rowIndex);

    // Look up the unscrolled bottom-right corner of the range.
    let x2: number;
    let y2: number;
    if (columnIndex + columnSpan >= cList.count) {
      x2 = cList.length - 1;
    } else {
      x2 = cList.offsetOf(columnIndex + columnSpan) - 1;
    }
    if (rowIndex + rowSpan >= rList.count) {
      y2 = rList.length - 1;
    } else {
      y2 = rList.offsetOf(rowIndex + rowSpan) - 1;
    }

    // Fetch the row header and column header sizes.
    let hw = this._headerWidth;
    let hh = this._headerHeight;

    // Set up the initial paint limits.
    let xMin = 0;
    let yMin = 0;
    let xMax = this._viewportWidth - 1;
    let yMax = this._viewportHeight - 1;

    // Adjust the limits and paint region.
    switch (region) {
    case 'body':
      xMin = hw;
      yMin = hh;
      x1 += hw - this._scrollX;
      x2 += hw - this._scrollX;
      y1 += hh - this._scrollY;
      y2 += hh - this._scrollY;
      break;
    case 'row-header':
      yMin = hh;
      xMax = Math.min(hw - 1, xMax);
      y1 += hh - this._scrollY;
      y2 += hh - this._scrollY;
      break;
    case 'column-header':
      xMin = hw;
      yMax = Math.min(hh - 1, yMax);
      x1 += hw - this._scrollX;
      x2 += hw - this._scrollX;
      break;
    case 'corner-header':
      xMax = Math.min(hw - 1, xMax);
      yMax = Math.min(hh - 1, yMax);
      break;
    default:
      throw 'unreachable';
    }

    // Bail early if the paint limits are empty.
    if (xMax < xMin || yMax < yMin) {
      return;
    }

    // Bail early if the dirty region is out of range.
    if (x2 < xMin || x1 > xMax || y2 < yMin || y1 > yMax) {
      return;
    }

    // Compute the dirty area.
    let x = Math.max(xMin, x1);
    let y = Math.max(yMin, y1);
    let w = Math.min(x2, xMax) - x + 1;
    let h = Math.min(y2, yMax) - y + 1;

    // Schedule a repaint of the dirty area, if needed.
    if (w > 0 && h > 0) {
      this._repaint(x, y, w, h);
    }
  }

  /**
   * Handle a full data model reset.
   */
  private _onModelReset(args: DataModel.IModelResetArgs): void {
    // Look up the various current section counts.
    let nr = this._rowSections.count;
    let nc = this._columnSections.count;
    let nrh = this._rowHeaderSections.count;
    let nch = this._columnHeaderSections.count;

    // Compute the delta count for each region.
    let dr = this._model!.rowCount('body') - nr;
    let dc = this._model!.columnCount('body') - nc;
    let drh = this._model!.columnCount('row-header') - nrh;
    let dch = this._model!.rowCount('column-header') - nch;

    // Update the row sections, if needed.
    if (dr > 0) {
      this._rowSections.insert(nr, dr);
    } else if (dr < 0) {
      this._rowSections.remove(nr + dr, -dr);
    }

    // Update the column sections, if needed.
    if (dc > 0) {
      this._columnSections.insert(nc, dc);
    } else if (dc < 0) {
      this._columnSections.remove(nc + dc, -dc);
    }

    // Update the row header sections, if needed.
    if (drh > 0) {
      this._rowHeaderSections.insert(nrh, drh);
    } else if (drh < 0) {
      this._rowHeaderSections.remove(nrh + drh, -drh);
    }

    // Update the column header sections, if needed.
    if (dch > 0) {
      this._columnHeaderSections.insert(nch, dch);
    } else if (dch < 0) {
      this._columnHeaderSections.remove(nch + dch, -dch);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * A signal handler for the renderer map `changed` signal.
   */
  private _onRenderersChanged(): void {
    this._repaint();
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // Do nothing if a drag is in progress.
    // if (this._pressData) {
    //   return;
    // }

    // Do nothing if the `Ctrl` key is held.
    if (event.ctrlKey) {
      return;
    }

    // Mark the event as handled.
    event.preventDefault();
    event.stopPropagation();

    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;

    // Convert the delta values to pixel values.
    switch (event.deltaMode) {
    case 0:  // DOM_DELTA_PIXEL
      break;
    case 1:  // DOM_DELTA_LINE
      dx *= this._columnSections.defaultSize;
      dy *= this._rowSections.defaultSize;
      break;
    case 2:  // DOM_DELTA_PAGE
      dx *= this._pageWidth;
      dy *= this._pageHeight;
      break;
    default:
      throw 'unreachable';
    }

    // Scroll by the desired amount.
    this._scrollBy(dx, dy);
  }

  /**
   * Scroll immediately to the specified offset position.
   */
  private _scroll(x: number, y: number): void {
    // Floor and clamp the position to the allowable range.
    x = Math.max(0, Math.min(Math.floor(x), this._maxScrollX));
    y = Math.max(0, Math.min(Math.floor(y), this._maxScrollY));

    // Synchronize the scroll bar values.
    this._hScrollBar.value = x;
    this._vScrollBar.value = y;

    // Compute the delta scroll amount.
    let dx = x - this._scrollX;
    let dy = y - this._scrollY;

    // Bail early if there is no effective scroll.
    if (dx === 0 && dy === 0) {
      return;
    }

    // If there is a paint pending, ensure it paints everything.
    if (this._paintPending) {
      this._scrollX = x;
      this._scrollY = y;
      this._repaint();
      return;
    }

    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      this._scrollX = x;
      this._scrollY = y;
      return;
    }

    // Get the current size of the viewport.
    let width = this._viewportWidth;
    let height = this._viewportHeight;

    // Bail early if the viewport is empty.
    if (width === 0 || height === 0) {
      this._scrollX = x;
      this._scrollY = y;
      return;
    }

    // Get the visible content origin.
    let contentX = this._headerWidth;
    let contentY = this._headerHeight;

    // Get the visible content dimensions.
    let contentWidth = width - contentX;
    let contentHeight = height - contentY;

    // Bail early if there is no content to draw.
    if (contentWidth <= 0 && contentHeight <= 0) {
      this._scrollX = x;
      this._scrollY = y;
      return;
    }

    // Compute the area which needs painting for the `dx` scroll.
    let dxArea = 0;
    if (dx !== 0 && contentWidth > 0) {
      if (Math.abs(dx) >= contentWidth) {
        dxArea = contentWidth * height;
      } else {
        dxArea = Math.abs(dx) * height;
      }
    }

    // Compute the area which needs painting for the `dy` scroll.
    let dyArea = 0;
    if (dy !== 0 && contentHeight > 0) {
      if (Math.abs(dy) >= contentHeight) {
        dyArea = width * contentHeight;
      } else {
        dyArea = width * Math.abs(dy);
      }
    }

    // If the area sum is larger than the total, paint everything.
    if ((dxArea + dyArea) >= (width * height)) {
      this._scrollX = x;
      this._scrollY = y;
      this._paint(0, 0, width, height);
      return;
    }

    // Update the internal Y scroll position.
    this._scrollY = y;

    // Scroll the Y axis if needed. If the scroll distance exceeds
    // the visible height, paint everything. Otherwise, blit the
    // valid content and paint the dirty region.
    if (dy !== 0 && contentHeight > 0) {
      if (Math.abs(dy) >= contentHeight) {
        this._paint(0, contentY, width, contentHeight);
      } else {
        let x = 0;
        let y = dy < 0 ? contentY : contentY + dy;
        let w = width;
        let h = contentHeight - Math.abs(dy);
        this._blit(this._canvas, x, y, w, h, x, y - dy);
        this._paint(0, dy < 0 ? contentY : height - dy, width, Math.abs(dy));
      }
    }

    // Update the internal X scroll position.
    this._scrollX = x;

    // Scroll the X axis if needed. If the scroll distance exceeds
    // the visible width, paint everything. Otherwise, blit the
    // valid content and paint the dirty region.
    if (dx !== 0 && contentWidth > 0) {
      if (Math.abs(dx) >= contentWidth) {
        this._paint(contentX, 0, contentWidth, height);
      } else {
        let x = dx < 0 ? contentX : contentX + dx;
        let y = 0;
        let w = contentWidth - Math.abs(dx);
        let h = height;
        this._blit(this._canvas, x, y, w, h, x - dx, y);
        this._paint(dx < 0 ? contentX : width - dx, 0, Math.abs(dx), height);
      }
    }
  }

  /**
   * Blit content into the on-screen canvas.
   *
   * The rect should be expressed in viewport coordinates.
   *
   * This automatically accounts for the dpi ratio.
   */
  private _blit(source: HTMLCanvasElement, x: number, y: number, w: number, h: number, dx: number, dy: number): void {
    // Scale the blit coordinates by the dpi ratio.
    x *= this._dpiRatio;
    y *= this._dpiRatio;
    w *= this._dpiRatio;
    h *= this._dpiRatio;
    dx *= this._dpiRatio;
    dy *= this._dpiRatio;

    // Save the current gc state.
    this._canvasGC.save();

    // Set the transform to the identity matrix.
    this._canvasGC.setTransform(1, 0, 0, 1, 0, 0);

    // Draw the specified content.
    this._canvasGC.drawImage(source, x, y, w, h, dx, dy, w, h);

    // Restore the gc state.
    this._canvasGC.restore();
  }

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

    // Execute the actual drawing logic.
    try {
      this._inPaint = true;
      this._draw(rx, ry, rw, rh);
    } finally {
      this._inPaint = false;
    }
  }

  /**
   * Draw the grid content for the given dirty rect.
   *
   * This method dispatches to the relevant `_draw*` methods.
   */
  private _draw(rx: number, ry: number, rw: number, rh: number): void {
    // Scale the canvas and buffer GC for the dpi ratio.
    this._canvasGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0);
    this._bufferGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0);

    // Clear the dirty rect of all content.
    this._canvasGC.clearRect(rx, ry, rw, rh);

    // Draw the void region.
    this._drawVoidRegion(rx, ry, rw, rh);

    // Draw the body region.
    this._drawBodyRegion(rx, ry, rw, rh);

    // Draw the row header region.
    this._drawRowHeaderRegion(rx, ry, rw, rh);

    // Draw the column header region.
    this._drawColumnHeaderRegion(rx, ry, rw, rh);

    // Draw the corner header region.
    this._drawCornerHeaderRegion(rx, ry, rw, rh);
  }

  /**
   * Draw the void region for the dirty rect.
   */
  private _drawVoidRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Look up the void color.
    let color = this._style.voidColor;

    // Bail if there is no void color.
    if (!color) {
      return;
    }

    // Fill the dirty rect with the void color.
    this._canvasGC.fillStyle = color;
    this._canvasGC.fillRect(rx, ry, rw, rh);
  }

  /**
   * Draw the body region which intersects the dirty rect.
   */
  private _drawBodyRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._columnSections.length - this._scrollX;
    let contentH = this._rowSections.length - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this._headerWidth;
    let contentY = this._headerHeight;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Get the upper and lower bounds of the dirty content area.
    let x1 = Math.max(rx, contentX);
    let y1 = Math.max(ry, contentY);
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._rowSections.indexOf(y1 - contentY + this._scrollY);
    let c1 = this._columnSections.indexOf(x1 - contentX + this._scrollX);
    let r2 = this._rowSections.indexOf(y2 - contentY + this._scrollY);
    let c2 = this._columnSections.indexOf(x2 - contentX + this._scrollX);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._rowSections.count - 1;
    }
    if (c2 < 0) {
      c2 = this._columnSections.count - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._columnSections.offsetOf(c1) + contentX - this._scrollX;
    let y = this._rowSections.offsetOf(r1) + contentY - this._scrollY;

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._columnSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Create the paint region object.
    let rgn: Private.IPaintRegion = {
      region: 'body',
      xMin: x1, yMin: y1,
      xMax: x2, yMax: y2,
      x, y, width, height,
      row: r1, column: c1,
      rowSizes, columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.backgroundColor);

    // Draw the row background.
    this._drawRowBackground(rgn, this._style.rowBackgroundColor);

    // Draw the column background.
    this._drawColumnBackground(rgn, this._style.columnBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(rgn,
      this._style.horizontalGridLineColor ||
      this._style.gridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(rgn,
      this._style.verticalGridLineColor ||
      this._style.gridLineColor
    );
  }

  /**
   * Draw the row header region which intersects the dirty rect.
   */
  private _drawRowHeaderRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._headerWidth;
    let contentH = this._rowSections.length - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = this._headerHeight;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Get the upper and lower bounds of the dirty content area.
    let x1 = rx;
    let y1 = Math.max(ry, contentY);
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._rowSections.indexOf(y1 - contentY + this._scrollY);
    let c1 = this._rowHeaderSections.indexOf(x1);
    let r2 = this._rowSections.indexOf(y2 - contentY + this._scrollY);
    let c2 = this._rowHeaderSections.indexOf(x2);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._rowSections.count - 1;
    }
    if (c2 < 0) {
      c2 = this._rowHeaderSections.count - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._rowHeaderSections.offsetOf(c1);
    let y = this._rowSections.offsetOf(r1) + contentY - this._scrollY;

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Create the paint region object.
    let rgn: Private.IPaintRegion = {
      region: 'row-header',
      xMin: x1, yMin: y1,
      xMax: x2, yMax: y2,
      x, y, width, height,
      row: r1, column: c1,
      rowSizes, columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(rgn,
      this._style.headerHorizontalGridLineColor ||
      this._style.headerGridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(rgn,
      this._style.headerVerticalGridLineColor ||
      this._style.headerGridLineColor
    );
  }

  /**
   * Draw the column header region which intersects the dirty rect.
   */
  private _drawColumnHeaderRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._columnSections.length - this._scrollX;
    let contentH = this._headerHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this._headerWidth;
    let contentY = 0;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Get the upper and lower bounds of the dirty content area.
    let x1 = Math.max(rx, contentX);
    let y1 = ry;
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._columnHeaderSections.indexOf(y1);
    let c1 = this._columnSections.indexOf(x1 - contentX + this._scrollX);
    let r2 = this._columnHeaderSections.indexOf(y2);
    let c2 = this._columnSections.indexOf(x2 - contentX + this._scrollX);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._columnHeaderSections.count - 1;
    }
    if (c2 < 0) {
      c2 = this._columnSections.count - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._columnSections.offsetOf(c1) + contentX - this._scrollX;
    let y = this._columnHeaderSections.offsetOf(r1);

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._columnHeaderSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._columnSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Create the paint region object.
    let rgn: Private.IPaintRegion = {
      region: 'column-header',
      xMin: x1, yMin: y1,
      xMax: x2, yMax: y2,
      x, y, width, height,
      row: r1, column: c1,
      rowSizes, columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(rgn,
      this._style.headerHorizontalGridLineColor ||
      this._style.headerGridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(rgn,
      this._style.headerVerticalGridLineColor ||
      this._style.headerGridLineColor
    );
  }

  /**
   * Draw the corner header region which intersects the dirty rect.
   */
  private _drawCornerHeaderRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._headerWidth;
    let contentH = this._headerHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = 0;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw <= contentX) {
      return;
    }
    if (ry + rh <= contentY) {
      return;
    }
    if (rx >= contentX + contentW) {
      return;
    }
    if (ry >= contentY + contentH) {
      return;
    }

    // Get the upper and lower bounds of the dirty content area.
    let x1 = rx;
    let y1 = ry;
    let x2 = Math.min(rx + rw - 1, contentX + contentW - 1);
    let y2 = Math.min(ry + rh - 1, contentY + contentH - 1);

    // Convert the dirty content bounds into cell bounds.
    let r1 = this._columnHeaderSections.indexOf(y1);
    let c1 = this._rowHeaderSections.indexOf(x1);
    let r2 = this._columnHeaderSections.indexOf(y2);
    let c2 = this._rowHeaderSections.indexOf(x2);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._columnHeaderSections.count - 1;
    }
    if (c2 < 0) {
      c2 = this._rowHeaderSections.count - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._rowHeaderSections.offsetOf(c1);
    let y = this._columnHeaderSections.offsetOf(r1);

    // Set up the paint region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._columnHeaderSections.sizeOf(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sizeOf(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Create the paint region object.
    let rgn: Private.IPaintRegion = {
      region: 'corner-header',
      xMin: x1, yMin: y1,
      xMax: x2, yMax: y2,
      x, y, width, height,
      row: r1, column: c1,
      rowSizes, columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the paint region.
    this._drawCells(rgn);

    // Draw the horizontal grid lines.
    this._drawHorizontalGridLines(rgn,
      this._style.headerHorizontalGridLineColor ||
      this._style.headerGridLineColor
    );

    // Draw the vertical grid lines.
    this._drawVerticalGridLines(rgn,
      this._style.headerVerticalGridLineColor ||
      this._style.headerGridLineColor
    );
  }

  /**
   * Draw the background for the given paint region.
   */
  private _drawBackground(rgn: Private.IPaintRegion, color: string | undefined): void {
    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    // Unpack the region.
    let { xMin, yMin, xMax, yMax } = rgn;

    // Fill the region with the specified color.
    this._canvasGC.fillStyle = color;
    this._canvasGC.fillRect(xMin, yMin, xMax - xMin + 1, yMax - yMin + 1);
  }

  /**
   * Draw the row background for the given paint region.
   */
  private _drawRowBackground(rgn: Private.IPaintRegion, colorFn: ((i: number) => string) | undefined): void {
    // Bail if there is no color function.
    if (!colorFn) {
      return;
    }

    // Compute the X bounds for the row.
    let x1 = Math.max(rgn.xMin, rgn.x);
    let x2 = Math.min(rgn.x + rgn.width - 1, rgn.xMax);

    // Draw the background for the rows in the region.
    for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
      // Fetch the size of the row.
      let size = rgn.rowSizes[j];

      // Skip zero sized rows.
      if (size === 0) {
        continue;
      }

      // Get the background color for the row.
      let color = colorFn(rgn.row + j);

      // Fill the row with the background color if needed.
      if (color) {
        let y1 = Math.max(rgn.yMin, y);
        let y2 = Math.min(y + size - 1, rgn.yMax);
        this._canvasGC.fillStyle = color;
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Increment the running Y coordinate.
      y += size;
    }
  }

  /**
   * Draw the column background for the given paint region.
   */
  private _drawColumnBackground(rgn: Private.IPaintRegion, colorFn: ((i: number) => string) | undefined): void {
    // Bail if there is no color function.
    if (!colorFn) {
      return;
    }

    // Compute the Y bounds for the column.
    let y1 = Math.max(rgn.yMin, rgn.y);
    let y2 = Math.min(rgn.y + rgn.height - 1, rgn.yMax);

    // Draw the background for the columns in the region.
    for (let x = rgn.x, i = 0, n = rgn.columnSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let size = rgn.columnSizes[i];

      // Skip zero sized columns.
      if (size === 0) {
        continue;
      }

      // Get the background color for the column.
      let color = colorFn(rgn.column + i);

      // Fill the column with the background color if needed.
      if (color) {
        let x1 = Math.max(rgn.xMin, x);
        let x2 = Math.min(x + size - 1, rgn.xMax);
        this._canvasGC.fillStyle = color;
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Increment the running X coordinate.
      x += size;
    }
  }

  /**
   * Draw the cells for the given paint region.
   */
  private _drawCells(rgn: Private.IPaintRegion): void {
    // Bail if there is no data model.
    if (!this._model) {
      return;
    }

    // Set up the cell config object for rendering.
    let config = {
      x: 0, y: 0, width: 0, height: 0,
      region: rgn.region, row: 0, column: 0,
      metadata: DataModel.emptyMetadata, value: (null as any)
    };

    // Save the buffer gc before wrapping.
    this._bufferGC.save();

    // Wrap the buffer gc for painting the cells.
    let gc = new GraphicsContext(this._bufferGC);

    // Compute the actual Y bounds for the cell range.
    let y1 = Math.max(rgn.yMin, rgn.y);
    let y2 = Math.min(rgn.y + rgn.height - 1, rgn.yMax);

    // Loop over the columns in the region.
    for (let x = rgn.x, i = 0, n = rgn.columnSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let width = rgn.columnSizes[i];

      // Skip zero sized columns.
      if (width === 0) {
        continue;
      }

      // Compute the column index.
      let column = rgn.column + i;

      // Get the metadata for the column.
      let metadata: DataModel.Metadata;
      try {
        metadata = this._model.metadata(rgn.region, column);
      } catch (err) {
        metadata = DataModel.emptyMetadata;
        console.error(err);
      }

      // Update the config for the current column.
      config.x = x;
      config.width = width;
      config.column = column;
      config.metadata = metadata;

      // Clear the buffer rect for the column.
      gc.clearRect(x, rgn.y, width, rgn.height);

      // Save the GC state.
      gc.save();

      // Look up the renderer for the column.
      let renderer = (
        this._cellRenderers.get(rgn.region, metadata) || this._defaultRenderer
      );

      // Prepare the cell renderer for drawing the column.
      try {
        renderer.prepare(gc, config);
      } catch (err) {
        console.error(err);
      }

      // Loop over the rows in the column.
      for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
        // Fetch the size of the row.
        let height = rgn.rowSizes[j];

        // Skip zero sized rows.
        if (height === 0) {
          continue;
        }

        // Compute the row index.
        let row = rgn.row + j;

        // Get the data value for the cell.
        let value: any;
        try {
          value = this._model.data(rgn.region, row, column);
        } catch (err) {
          value = undefined;
          console.error(err);
        }

        // Update the config for the current cell.
        config.y = y;
        config.height = height;
        config.row = row;
        config.value = value;

        // Save the GC state.
        gc.save();

        // Paint the cell into the off-screen buffer.
        try {
          renderer.paint(gc, config);
        } catch (err) {
          console.error(err);
        }

        // Restore the GC state.
        gc.restore();

        // Increment the running Y coordinate.
        y += height;
      }

      // Restore the GC state.
      gc.restore();

      // Compute the actual X bounds for the column.
      let x1 = Math.max(rgn.xMin, x);
      let x2 = Math.min(x + width - 1, rgn.xMax);

      // Blit the off-screen buffer column into the on-screen canvas.
      //
      // This is *much* faster than drawing directly into the on-screen
      // canvas with a clip rect on the column. Managed column clipping
      // is required to prevent cell renderers from needing to set up a
      // clip rect for handling horizontal overflow text (slow!).
      this._blit(this._buffer, x1, y1, x2 - x1 + 1, y2 - y1 + 1, x1, y1);

      // Increment the running X coordinate.
      x += width;
    }

    // Dispose of the wrapped gc.
    gc.dispose();

    // Restore the final buffer gc state.
    this._bufferGC.restore();
  }

  /**
   * Draw the horizontal grid lines for the given paint region.
   */
  private _drawHorizontalGridLines(rgn: Private.IPaintRegion, color: string | undefined): void {
    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    // Compute the X bounds for the horizontal lines.
    let x1 = Math.max(rgn.xMin, rgn.x);
    let x2 = Math.min(rgn.x + rgn.width, rgn.xMax + 1);

    // Begin the path for the grid lines.
    this._canvasGC.beginPath();

    // Set the line width for the grid lines.
    this._canvasGC.lineWidth = 1;

    // Draw the horizontal grid lines.
    for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
      // Fetch the size of the row.
      let size = rgn.rowSizes[j];

      // Skip zero sized rows.
      if (size === 0) {
        continue;
      }

      // Compute the Y position of the line.
      let pos = y + size - 1;

      // Draw the line if it's in range of the dirty rect.
      if (pos >= rgn.yMin && pos <= rgn.yMax) {
        this._canvasGC.moveTo(x1, pos + 0.5);
        this._canvasGC.lineTo(x2, pos + 0.5);
      }

      // Increment the running Y coordinate.
      y += size;
    }

    // Stroke the lines with the specified color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();
  }

  /**
   * Draw the vertical grid lines for the given paint region.
   */
  private _drawVerticalGridLines(rgn: Private.IPaintRegion, color: string | undefined): void {
    // Bail if there is no color to draw.
    if (!color) {
      return;
    }

    // Compute the Y bounds for the vertical lines.
    let y1 = Math.max(rgn.yMin, rgn.y);
    let y2 = Math.min(rgn.y + rgn.height, rgn.yMax + 1);

    // Begin the path for the grid lines
    this._canvasGC.beginPath();

    // Set the line width for the grid lines.
    this._canvasGC.lineWidth = 1;

    // Draw the vertical grid lines.
    for (let x = rgn.x, i = 0, n = rgn.columnSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let size = rgn.columnSizes[i];

      // Skip zero sized columns.
      if (size === 0) {
        continue;
      }

      // Compute the X position of the line.
      let pos = x + size - 1;

      // Draw the line if it's in range of the dirty rect.
      if (pos >= rgn.xMin && pos <= rgn.xMax) {
        this._canvasGC.moveTo(pos + 0.5, y1);
        this._canvasGC.lineTo(pos + 0.5, y2);
      }

      // Increment the running X coordinate.
      x += size;
    }

    // Stroke the lines with the specified color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();
  }

  private _viewport: Widget;
  private _vScrollBar: ScrollBar;
  private _hScrollBar: ScrollBar;
  private _scrollCorner: Widget;

  private _inPaint = false;
  private _paintPending = false;  // TODO: would like to get rid of this flag
  private _dpiRatio = Math.ceil(window.devicePixelRatio);

  private _scrollX = 0;
  private _scrollY = 0;
  private _viewportWidth = 0;
  private _viewportHeight = 0;

  private _vScrollBarMinWidth = 0;
  private _hScrollBarMinHeight = 0;

  private _canvas: HTMLCanvasElement;
  private _buffer: HTMLCanvasElement;
  private _canvasGC: CanvasRenderingContext2D;
  private _bufferGC: CanvasRenderingContext2D;

  private _rowSections: SectionList;
  private _columnSections: SectionList;
  private _rowHeaderSections: SectionList;
  private _columnHeaderSections: SectionList;

  private _model: DataModel | null = null;

  private _style: DataGrid.Style;
  private _cellRenderers: RendererMap;
  private _defaultRenderer: CellRenderer;
  private _headerVisibility: DataGrid.HeaderVisibility;
}


/**
 * The namespace for the `DataGrid` class statics.
 */
export
namespace DataGrid {
  /**
   * An object which defines the style for a data grid.
   *
   * #### Notes
   * All style colors support the full CSS color syntax.
   */
  export
  type Style = {
    /**
     * The void color for the data grid.
     *
     * This is the base fill color for the entire data grid.
     */
    readonly voidColor?: string;

    /**
     * The background color for the body cells.
     *
     * This color is layered on top of the `voidColor`.
     */
    readonly backgroundColor?: string;

    /**
     * A function which returns the background color for a row.
     *
     * This color is layered on top of the `backgroundColor` and can
     * be used to implement "zebra striping" of the grid rows.
     */
    readonly rowBackgroundColor?: (index: number) => string;

    /**
     * A function which returns the background color for a column.
     *
     * This color is layered on top of the `backgroundColor` and can
     * be used to implement "zebra striping" of the grid columns.
     */
    readonly columnBackgroundColor?: (index: number) => string;

    /**
     * The color for the grid lines of the body cells.
     *
     * The grid lines are draw on top of the cell contents.
     */
    readonly gridLineColor?: string;

    /**
     * The color for the vertical grid lines of the body cells.
     *
     * This overrides the `gridLineColor` option.
     */
    readonly verticalGridLineColor?: string;

    /**
     * The color for the horizontal grid lines of the body cells.
     *
     * This overrides the `gridLineColor` option.
     */
    readonly horizontalGridLineColor?: string;

    /**
     * The background color for the header cells.
     *
     * This color is layered on top of the `voidColor`.
     */
    readonly headerBackgroundColor?: string;

    /**
     * The color for the grid lines of the header cells.
     *
     * The grid lines are draw on top of the cell contents.
     */
    readonly headerGridLineColor?: string;

    /**
     * The color for the vertical grid lines of the header cells.
     *
     * This overrides the `headerGridLineColor` option.
     */
    readonly headerVerticalGridLineColor?: string;

    /**
     * The color for the horizontal grid lines of the header cells.
     *
     * This overrides the `headerGridLineColor` option.
     */
    readonly headerHorizontalGridLineColor?: string;
  };

  /**
   * An object which defines the default sizes for a data grid.
   */
  export
  type DefaultSizes = {
    /**
     * The default height of a row.
     */
    readonly rowHeight: number;

    /**
     * The default width of a column.
     */
    readonly columnWidth: number;

    /**
     * The default width of a row header.
     */
    readonly rowHeaderWidth: number;

    /**
     * The default height of a column header.
     */
    readonly columnHeaderHeight: number;
  };

  /**
   * A type alias for the supported header visibility modes.
   */
  export
  type HeaderVisibility = 'all' | 'row' | 'column' | 'none';

  /**
   * An options object for initializing a data grid.
   */
  export
  interface IOptions {
    /**
     * The style for the data grid.
     *
     * The default is `DataGrid.defaultStyle`.
     */
    style?: Style;

    /**
     * The default sizes for the data grid.
     *
     * The default is `DataGrid.defaultSizes`.
     */
    defaultSizes?: DefaultSizes;

    /**
     * The header visibility for the data grid.
     *
     * The default is `'all'`.
     */
    headerVisibility?: HeaderVisibility;

    /**
     * The cell renderer map for the data grid.
     *
     * The default is an empty renderer map.
     */
    cellRenderers?: RendererMap;

    /**
     * The default cell renderer for the data grid.
     *
     * The default is a new `TextRenderer`.
     */
    defaultRenderer?: CellRenderer;
  }

  /**
   * The default theme for a data grid.
   */
  export
  const defaultStyle: DataGrid.Style = {
    voidColor: '#F3F3F3',
    backgroundColor: '#FFFFFF',
    gridLineColor: 'rgba(20, 20, 20, 0.15)',
    headerBackgroundColor: '#F3F3F3',
    headerGridLineColor: 'rgba(20, 20, 20, 0.25)'
  };

  /**
   * The default sizes for a data grid.
   */
  export
  const defaultSizes: DataGrid.DefaultSizes = {
    rowHeight: 20,
    columnWidth: 64,
    rowHeaderWidth: 64,
    columnHeaderHeight: 20
  };
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A singleton `scroll-request` conflatable message.
   */
  export
  const ScrollRequest = new ConflatableMessage('scroll-request');

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
   * An object which represents a region to be painted.
   */
  export
  interface IPaintRegion {
    /**
     * The min X coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    xMin: number;

    /**
     * The min Y coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    yMin: number;

    /**
     * The max X coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    xMax: number;

    /**
     * The max Y coordinate the of the dirty viewport rect.
     *
     * #### Notes
     * The data grid must not draw outside of this boundary.
     */
    yMax: number;

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
     * The total width of the region.
     *
     * #### Notes
     * This is aligned to the cell boundaries.
     */
    width: number;

    /**
     * The total height of the region.
     *
     * #### Notes
     * This is aligned to the cell boundaries.
     */
    height: number;

    /**
     * The cell region being painted.
     */
    region: DataModel.CellRegion;

    /**
     * The row index of the first cell in the region.
     */
    row: number;

    /**
     * The column index of the first cell in the region.
     */
    column: number;

    /**
     * The row sizes for the rows in the region.
     */
    rowSizes: number[];

    /**
     * The column sizes for the columns in the region.
     */
    columnSizes: number[];
  }

  /**
   * A conflatable message which merges dirty paint rects.
   */
  export
  class PaintRequest extends ConflatableMessage {
    /**
     * Construct a new paint request messages.
     *
     * @param x1 - The top-left X coordinate of the rect.
     *
     * @param y1 - The top-left Y coordinate of the rect.
     *
     * @param x2 - The bottom-right X coordinate of the rect.
     *
     * @param y2 - The bottom-right Y coordinate of the rect.
     */
    constructor(x1: number, y1: number, x2: number, y2: number) {
      super('paint-request');
      this._x1 = x1;
      this._y1 = y1;
      this._x2 = Math.max(x1, x2);
      this._y2 = Math.max(y1, y2);
    }

    /**
     * The top-left X coordinate of the rect.
     */
    get x1(): number {
      return this._x1;
    }

    /**
     * The top-left Y coordinate of the rect.
     */
    get y1(): number {
      return this._y1;
    }

    /**
     * The bottom-right X coordinate of the rect.
     */
    get x2(): number {
      return this._x2;
    }

    /**
     * The bottom-right Y coordinate of the rect.
     */
    get y2(): number {
      return this._y2;
    }

    /**
     * Conflate this message with another paint request.
     */
    conflate(other: PaintRequest): boolean {
      this._x1 = Math.min(this._x1, other._x1);
      this._y1 = Math.min(this._y1, other._y1);
      this._x2 = Math.max(this._x2, other._x2);
      this._y2 = Math.max(this._y2, other._y2);
      return true;
    }

    private _x1: number;
    private _y1: number;
    private _x2: number;
    private _y2: number;
  }
}
