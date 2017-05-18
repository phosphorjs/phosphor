/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
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
  constructor(options: DataGrid.IOptions) {
    super();
    this.addClass('p-DataGrid');

    // Parse the simple options.
    this._style = options.style || DataGrid.defaultStyle;
    this._headerVisibility = options.headerVisibility || 'all';

    // Set up the cell renderer map.
    let fallback = options.defaultCellRenderer || new TextRenderer();
    this._cellRendererMap = new Private.CellRendererMap(fallback);

    // Set up the row and column sections lists.
    // TODO - allow base size configuration.
    this._rowSections = new SectionList({ baseSize: 20 });
    this._columnSections = new SectionList({ baseSize: 64 });
    this._rowHeaderSections = new SectionList({ baseSize: 96 });
    this._columnHeaderSections = new SectionList({ baseSize: 20 });

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
    // TODO - support custom scroll bars and scroll corner?
    this._viewport = new Widget();
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
    // TODO - audit this method.
    this._model = null;
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
      this._rowSections.insertSections(0, value.rowCount);
      this._columnSections.insertSections(0, value.columnCount);
      this._rowHeaderSections.insertSections(0, value.rowHeaderCount);
      this._columnHeaderSections.insertSections(0, value.columnHeaderCount);
    }

    // Reset the scroll position.
    this._scrollX = 0;
    this._scrollY = 0;

    // Sync the scroll bars with the viewport.
    this._syncScrollBarsWithViewport();

    // Schedule a repaint of the viewport.
    this.repaint();
  }

  /**
   * Get the style for the data grid.
   */
  get style(): DataGrid.IStyle {
    return this._style;
  }

  /**
   * Set the style for the data grid.
   */
  set style(value: DataGrid.IStyle) {
    // Bail if the style does not change.
    if (this._style === value) {
      return;
    }

    // Update the internal style.
    this._style = value;

    // Schedule a full repaint of the grid.
    this.repaint();
  }

  /**
   * Get the default cell renderer for the data grid.
   */
  get defaultCellRenderer(): CellRenderer {
    return this._cellRendererMap.fallback;
  }

  /**
   * Set the default cell renderer for the data grid.
   */
  set defaultCellRenderer(value: CellRenderer) {
    // Bail if the renderer does not change.
    if (this._cellRendererMap.fallback === value) {
      return;
    }

    // Update the internal renderer.
    this._cellRendererMap.fallback = value;

    // Schedule a full repaint of the grid.
    this.repaint();
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

    // Re-clamp the scroll position for the new page size.
    this._scrollX = Math.min(this._scrollX, this.maxScrollX);
    this._scrollY = Math.min(this._scrollY, this.maxScrollY);

    // Update the scroll bar visibility.
    this._updateScrollBarVisibility();

    // Re-sync the scroll bars with the viewport.
    this._syncScrollBarsWithViewport();

    // Schedule a full repaint of the grid.
    this.repaint();
  }

  /**
   * The scroll X offset of the viewport.
   */
  get scrollX(): number {
    return this._scrollX;
  }

  /**
   * The scroll Y offset of the viewport.
   */
  get scrollY(): number {
    return this._scrollY;
  }

  /**
   * The total width of the main cell content.
   *
   * #### Notes
   * This value does not include the width of the row headers.
   */
  get scrollWidth(): number {
    return this._columnSections.totalSize;
  }

  /**
   * The total height of the main cell content.
   *
   * #### Notes
   * This value does not include the height of the column headers.
   */
  get scrollHeight(): number {
    return this._rowSections.totalSize;
  }

  /**
   * The total width of the row headers.
   *
   * #### Notes
   * This will be `0` if the row headers are hidden.
   */
  get rowHeaderWidth(): number {
    if (this._headerVisibility === 'none') {
      return 0;
    }
    if (this._headerVisibility === 'column') {
      return 0;
    }
    return this._rowHeaderSections.totalSize;
  }

  /**
   * The total height of the column headers.
   *
   * #### Notes
   * This will be `0` if the column headers are hidden.
   */
  get columnHeaderHeight(): number {
    if (this._headerVisibility === 'none') {
      return 0;
    }
    if (this._headerVisibility === 'row') {
      return 0;
    }
    return this._columnHeaderSections.totalSize;
  }

  /**
   * The width of the visible portion of the main cell content.
   *
   * #### Notes
   * This value does not include the width of the row headers.
   */
  get pageWidth(): number {
    return Math.max(0, this._viewportWidth - this.rowHeaderWidth);
  }

  /**
   * The height of the visible portion of the main cell content.
   *
   * #### Notes
   * This value does not include the height of the column headers.
   */
  get pageHeight(): number {
    return Math.max(0, this._viewportHeight - this.columnHeaderHeight);
  }

  /**
   * The maximum scroll X position for the current grid dimensions.
   *
   * #### Notes
   * This value is `1px` less than the theoretical maximum to allow the
   * the right-most grid line to be clipped when the vertical scroll bar
   * is visible.
   */
  get maxScrollX(): number {
    return Math.max(0, this.scrollWidth - this.pageWidth - 1);
  }

  /**
   * The maximum scroll Y position for the current grid dimensions.
   *
   * #### Notes
   * This value is `1px` less than the theoretical maximum to allow the
   * the bottom-most grid line to be clipped when the horizontal scroll
   * bar is visible.
   */
  get maxScrollY(): number {
    return Math.max(0, this.scrollHeight - this.pageHeight - 1);
  }

  /**
   * Scroll the viewport by one page.
   *
   * @param - The desired direction of the scroll.
   */
  scrollByPage(dir: 'up' | 'down' | 'left' | 'right'): void {
    let dx = 0;
    let dy = 0;
    switch (dir) {
    case 'up':
      dy = -this.pageHeight;
      break;
    case 'down':
      dy = this.pageHeight;
      break;
    case 'left':
      dx = -this.pageWidth;
      break;
    case 'right':
      dx = this.pageWidth;
      break;
    default:
      throw 'unreachable';
    }
    this.scrollBy(dx, dy);
  }

  /**
   * Scroll the viewport by one cell-aligned step.
   *
   * @param - The desired direction of the scroll.
   */
  scrollByStep(dir: 'up' | 'down' | 'left' | 'right'): void {
    let r: number;
    let c: number;
    let x = this._scrollX;
    let y = this._scrollY;
    let rows = this._rowSections;
    let columns = this._columnSections;
    switch (dir) {
    case 'up':
      r = rows.sectionIndex(y - 1);
      y = r < 0 ? y : rows.sectionOffset(r);
      break;
    case 'down':
      r = rows.sectionIndex(y);
      y = r < 0 ? y : rows.sectionOffset(r) + rows.sectionSize(r);
      break;
    case 'left':
      c = columns.sectionIndex(x - 1);
      x = c < 0 ? x : columns.sectionOffset(c);
      break;
    case 'right':
      c = columns.sectionIndex(x);
      x = c < 0 ? x : columns.sectionOffset(c) + columns.sectionSize(c);
      break;
    default:
      throw 'unreachable';
    }
    this.scrollTo(x, y);
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
   * The scroll position will be clamped to the allowable range.
   *
   * Fractional values will be rounded to the nearest integer.
   */
  scrollTo(x: number, y: number): void {
    // Floor and clamp the position to the allowable range.
    x = Math.max(0, Math.min(Math.floor(x), this.maxScrollX));
    y = Math.max(0, Math.min(Math.floor(y), this.maxScrollY));

    // Always synchronize the scroll bar values.
    this._hScrollBar.value = x;
    this._vScrollBar.value = y;

    // Compute the delta scroll amount.
    let dx = x - this._scrollX;
    let dy = y - this._scrollY;

    // Bail early if there is no effective scroll.
    if (dx === 0 && dy === 0) {
      return;
    }

    // Bail early if the widget is not visible.
    if (!this.isVisible) {
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
    let contentX = this.rowHeaderWidth;
    let contentY = this.columnHeaderHeight;

    // Get the visible content dimensions.
    let contentWidth = width - contentX;
    let contentHeight = height - contentY;

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
        this._canvasGC.drawImage(this._canvas, x, y, w, h, x, y - dy, w, h);
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
        this._canvasGC.drawImage(this._canvas, x, y, w, h, x - dx, y, w, h);
        this._paint(dx < 0 ? contentX : width - dx, 0, Math.abs(dx), height);
      }
    }
  }

  /**
   * Look up the cell renderer for a specific key.
   *
   * @param key - The renderer key of interest.
   *
   * @returns The cell renderer which will be applied for the key.
   *
   * #### Notes
   * If the key does not match a renderer added via `setCellRenderer`,
   * the `defaultCellRenderer` will be returned.
   */
  getCellRenderer(key: DataGrid.IRendererKey): CellRenderer {
    let name = key.fieldName || '';
    let type = key.fieldType || '';
    return this._cellRendererMap.get(key.region, name, type);
  }

  /**
   * Set the cell renderer for a specific key.
   *
   * @param key - The renderer key of interest.
   *
   * @param renderer - The renderer to apply for the given key.
   *
   * #### Notes
   * This will replace an old renderer assigned to the same key.
   */
  setCellRenderer(key: DataGrid.IRendererKey, renderer: CellRenderer): void {
    // Coerce the field name and type.
    let name = key.fieldName || '';
    let type = key.fieldType || '';

    // Set the renderer in the map.
    this._cellRendererMap.set(key.region, name, type, renderer);

    // Schedule a full repaint of the grid.
    this.repaint();
  }

  /**
   * Clear all custom cell renderers from the data grid.
   *
   * #### Notes
   * This will not change the `defaultCellRenderer`.
   */
  clearCellRenderers(): void {
    // Clear the custom cell renderers.
    this._cellRendererMap.clear();

    // Schedule a full repaint of the grid.
    this.repaint();
  }

  /**
   * Schedule a full repaint of the data grid.
   *
   * #### Notes
   * This method is called automatically when changing the state of the
   * data grid. However, it may be called manually to repaint the grid
   * whenever external program state change necessitates an update.
   *
   * Multiple synchronous requests are collapsed into a single repaint.
   */
  repaint(): void {
    this._viewport.update();
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
    if (event.type === 'wheel') {
      this._evtWheel(event as WheelEvent);
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('wheel', this);
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('wheel', this);
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    // Update the scroll bar visibility.
    this._updateScrollBarVisibility();

    // Sync the scroll bars with the viewport.
    this._syncScrollBarsWithViewport();

    // Re-clamp the scroll position to the new page size.
    this.scrollTo(this._scrollX, this._scrollY);
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // Extract the delta X and Y movement.
    let dx = event.deltaX;
    let dy = event.deltaY;

    // Convert the delta values to pixel values.
    switch (event.deltaMode) {
    case 0:  // DOM_DELTA_PIXEL
      break;
    case 1:  // DOM_DELTA_LINE
      dx *= this._columnSections.baseSize;
      dy *= this._rowSections.baseSize;
      break;
    case 2:  // DOM_DELTA_PAGE
      dx *= this.pageWidth;
      dy *= this.pageHeight;
      break;
    default:
      throw 'unreachable';
    }

    // Test whether X scroll is needed.
    let needScrollX = (
      (dx < 0 && this.scrollX > 0) ||
      (dx > 0 && this.scrollX < this.maxScrollX)
    );

    // Test whether Y scroll is needed.
    let needScrollY = (
      (dy < 0 && this.scrollY > 0) ||
      (dy > 0 && this.scrollY < this.maxScrollY)
    );

    // Bail if no scrolling is needed.
    if (!needScrollX && !needScrollY) {
      return;
    }

    // Cancel the event if the grid is handling scrolling.
    event.preventDefault();
    event.stopPropagation();

    // Compute the desired scroll position.
    let x = Math.max(0, Math.min(this.scrollX + dx, this.maxScrollX));
    let y = Math.max(0, Math.min(this.scrollY + dy, this.maxScrollY));

    // Update the scroll bar values with the desired position.
    this._hScrollBar.value = x;
    this._vScrollBar.value = y;

    // Post a scroll request message to the viewport.
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest);
  }

  /**
   * Update the scroll bar visibility based on the viewport size.
   *
   * #### Notes
   * If the visibility of either scroll bar changes, a synchronous
   * fit-request will be dispatched to the data grid to immediately
   * resize the viewport.
   */
  private _updateScrollBarVisibility(): void {
    // Fetch the viewport dimensions.
    let sw = this.scrollWidth;
    let sh = this.scrollHeight;
    let pw = this.pageWidth;
    let ph = this.pageHeight;

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
    let needVScroll = aph < sh - 1;
    let needHScroll = apw < sw - 1;

    // Re-test the horizontal scroll if a vertical scroll is needed.
    if (needVScroll && !needHScroll) {
      needHScroll = (apw - vsw) < sw - 1;
    }

    // Re-test the vertical scroll if a horizontal scroll is needed.
    if (needHScroll && !needVScroll) {
      needVScroll = (aph - hsh) < sh - 1;
    }

    // Bail if neither scroll bar visibility will change.
    if (needVScroll === hasVScroll && needHScroll === hasHScroll) {
      return;
    }

    // Update the visibility of the scroll bars and corner widget.
    this._vScrollBar.setHidden(!needVScroll);
    this._hScrollBar.setHidden(!needHScroll);
    this._scrollCorner.setHidden(!needVScroll || !needHScroll);

    // Immediately re-fit the data grid to update the layout.
    MessageLoop.sendMessage(this, Widget.Msg.FitRequest);
  }

  /**
   * Synchronize the scroll bars with the viewport.
   */
  private _syncScrollBarsWithViewport(): void {
    this._hScrollBar.maximum = this.maxScrollX;
    this._hScrollBar.page = this.pageWidth;
    this._hScrollBar.value = this.scrollX;
    this._vScrollBar.maximum = this.maxScrollY;
    this._vScrollBar.page = this.pageHeight;
    this._vScrollBar.value = this.scrollY;
  }

  /**
   * Process a message sent to the viewport
   */
  private _processViewportMessage(msg: Message): void {
    switch (msg.type) {
    case 'resize':
      this._onViewportResize(msg as Widget.ResizeMessage);
      break;
    case 'scroll-request':
      this._onViewportScrollRequest(msg);
      break;
    case 'update-request':
      this._onViewportUpdateRequest(msg);
      break;
    case 'fit-request':
      this._onViewportFitRequest(msg);
      break;
    case 'before-show':
    case 'before-attach':
      this._viewport.fit();
      break;
    default:
      break;
    }
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

    // Expand the canvas if needed.
    this._expandCanvasIfNeeded(width, height);

    // Bail if nothing needs to be painted.
    if (width === 0 || height === 0) {
      return;
    }

    // Paint the whole viewport if the old size was zero.
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
   * A message hook invoked on a viewport `'scroll-request'` message.
   */
  private _onViewportScrollRequest(msg: Message): void {
    this.scrollTo(this._hScrollBar.value, this._vScrollBar.value);
  }

  /**
   * A message hook invoked on a viewport `'update-request'` message.
   */
  private _onViewportUpdateRequest(msg: Message): void {
    // Do nothing if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Get the visible size of the viewport.
    let width = this._viewportWidth;
    let height = this._viewportHeight;

    // Bail early if the viewport has zero area.
    if (width === 0 || height === 0) {
      return;
    }

    // Paint the entire viewport.
    this._paint(0, 0, width, height);
  }

  /**
   * A message hook invoked on a viewport `'fit-request'` message.
   */
  private _onViewportFitRequest(msg: Message): void {
    // Do nothing if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Measure the viewport node size.
    let width = Math.round(this._viewport.node.offsetWidth);
    let height = Math.round(this._viewport.node.offsetHeight);

    // Updated internal viewport size.
    this._viewportWidth = width;
    this._viewportHeight = height;

    // Expand the canvas and if needed.
    this._expandCanvasIfNeeded(width, height);

    // Repaint the entire viewport immediately.
    MessageLoop.sendMessage(this._viewport, Widget.Msg.UpdateRequest);
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
      this.scrollByPage(dir === 'decrement' ? 'up' : 'down');
    } else {
      this.scrollByPage(dir === 'decrement' ? 'left' : 'right');
    }
  }

  /**
   * Handle the `stepRequested` signal from a scroll bar.
   */
  private _onStepRequested(sender: ScrollBar, dir: 'decrement' | 'increment'): void {
    if (sender === this._vScrollBar) {
      this.scrollByStep(dir === 'decrement' ? 'up' : 'down');
    } else {
      this.scrollByStep(dir === 'decrement' ? 'left' : 'right');
    }
  }

  /**
   * A signal handler for the data model `changed` signal.
   */
  private _onModelChanged(sender: DataModel, args: DataModel.ChangedArgs): void {
    if (args.type !== 'cells-changed') {
      return;
    }

    let r1 = args.rowIndex;
    let c1 = args.columnIndex;
    let r2 = r1 + args.rowSpan - 1;
    let c2 = c1 + args.columnSpan - 1;

    let x1 = this._columnSections.sectionOffset(c1) - 1;
    let y1 = this._rowSections.sectionOffset(r1) - 1;

    let x2 = this._columnSections.sectionOffset(c2);
    let y2 = this._rowSections.sectionOffset(r2);

    x2 += this._columnSections.sectionSize(c2) - 1;
    y2 += this._rowSections.sectionSize(r2) - 1;

    x1 -= this._scrollX;
    y1 -= this._scrollY;

    x2 -= this._scrollX;
    y2 -= this._scrollY;

    x1 += this.rowHeaderWidth;
    x2 += this.rowHeaderWidth;
    y1 += this.columnHeaderHeight;
    y2 += this.columnHeaderHeight;

    let minX = this.rowHeaderWidth;
    let minY = this.columnHeaderHeight;
    let maxX = this._viewportWidth - 1;
    let maxY = this._viewportHeight - 1;

    if (x2 < minX || y2 < minY || x1 > maxX || y1 > maxY) {
      return;
    }

    x1 = Math.max(minX, x1);
    x2 = Math.min(x2, maxX);
    y1 = Math.max(minY, y1);
    y2 = Math.min(y2, maxY);

    this._paint(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
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
    let contentW = this._columnSections.totalSize - this._scrollX;
    let contentH = this._rowSections.totalSize - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this.rowHeaderWidth;
    let contentY = this.columnHeaderHeight;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw < contentX) {
      return;
    }
    if (ry + rh < contentY) {
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
    let r1 = this._rowSections.sectionIndex(y1 - contentY + this._scrollY);
    let c1 = this._columnSections.sectionIndex(x1 - contentX + this._scrollX);
    let r2 = this._rowSections.sectionIndex(y2 - contentY + this._scrollY + 1);
    let c2 = this._columnSections.sectionIndex(x2 - contentX + this._scrollX + 1);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._rowSections.sectionCount - 1;
    }
    if (c2 < 0) {
      c2 = this._columnSections.sectionCount - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._columnSections.sectionOffset(c1) + contentX - this._scrollX;
    let y = this._rowSections.sectionOffset(r1) + contentY - this._scrollY;

    // Set up the cell region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._columnSections.sectionSize(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Create the cell region object.
    let rgn: Private.ICellRegion = {
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

    // Draw the cell content for the cell region.
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
    let contentW = this.rowHeaderWidth;
    let contentH = this._rowSections.totalSize - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = this.columnHeaderHeight;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw < contentX) {
      return;
    }
    if (ry + rh < contentY) {
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
    let r1 = this._rowSections.sectionIndex(y1 - contentY + this._scrollY);
    let c1 = this._rowHeaderSections.sectionIndex(x1);
    let r2 = this._rowSections.sectionIndex(y2 - contentY + this._scrollY + 1);
    let c2 = this._rowHeaderSections.sectionIndex(x2 + 1);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._rowSections.sectionCount - 1;
    }
    if (c2 < 0) {
      c2 = this._rowHeaderSections.sectionCount - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._rowHeaderSections.sectionOffset(c1);
    let y = this._rowSections.sectionOffset(r1) + contentY - this._scrollY;

    // Set up the cell region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sectionSize(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Adjust the start column for the header offset.
    c1 -= this._rowHeaderSections.sectionCount;

    // Create the cell region object.
    let rgn: Private.ICellRegion = {
      region: 'row-header',
      xMin: x1, yMin: y1,
      xMax: x2, yMax: y2,
      x, y, width, height,
      row: r1, column: c1,
      rowSizes, columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the cell region.
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
    let contentW = this._columnSections.totalSize - this._scrollX;
    let contentH = this.columnHeaderHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this.rowHeaderWidth;
    let contentY = 0;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw < contentX) {
      return;
    }
    if (ry + rh < contentY) {
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
    let r1 = this._columnHeaderSections.sectionIndex(y1);
    let c1 = this._columnSections.sectionIndex(x1 - contentX + this._scrollX);
    let r2 = this._columnHeaderSections.sectionIndex(y2 + 1);
    let c2 = this._columnSections.sectionIndex(x2 - contentX + this._scrollX + 1);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._columnHeaderSections.sectionCount - 1;
    }
    if (c2 < 0) {
      c2 = this._columnSections.sectionCount - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._columnSections.sectionOffset(c1) + contentX - this._scrollX;
    let y = this._columnHeaderSections.sectionOffset(r1);

    // Set up the cell region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._columnHeaderSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._columnSections.sectionSize(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Adjust the start column for the header offset.
    r1 -= this._columnHeaderSections.sectionCount;

    // Create the cell region object.
    let rgn: Private.ICellRegion = {
      region: 'column-header',
      xMin: x1, yMin: y1,
      xMax: x2, yMax: y2,
      x, y, width, height,
      row: r1, column: c1,
      rowSizes, columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the cell region.
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
    let contentW = this.rowHeaderWidth;
    let contentH = this.columnHeaderHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = 0;

    // Bail if the dirty rect does not intersect the content area.
    if (rx + rw < contentX) {
      return;
    }
    if (ry + rh < contentY) {
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
    let r1 = this._columnHeaderSections.sectionIndex(y1);
    let c1 = this._rowHeaderSections.sectionIndex(x1);
    let r2 = this._columnHeaderSections.sectionIndex(y2 + 1);
    let c2 = this._rowHeaderSections.sectionIndex(x2 + 1);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._columnHeaderSections.sectionCount - 1;
    }
    if (c2 < 0) {
      c2 = this._rowHeaderSections.sectionCount - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._rowHeaderSections.sectionOffset(c1);
    let y = this._columnHeaderSections.sectionOffset(r1);

    // Set up the cell region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let columnSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._columnHeaderSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the column sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sectionSize(i);
      columnSizes[i - c1] = size;
      width += size;
    }

    // Adjust the start row and column for the header offset.
    r1 -= this._columnHeaderSections.sectionCount;
    c1 -= this._rowHeaderSections.sectionCount;

    // Create the cell region object.
    let rgn: Private.ICellRegion = {
      region: 'corner-header',
      xMin: x1, yMin: y1,
      xMax: x2, yMax: y2,
      x, y, width, height,
      row: r1, column: c1,
      rowSizes, columnSizes
    };

    // Draw the background.
    this._drawBackground(rgn, this._style.headerBackgroundColor);

    // Draw the cell content for the cell region.
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
   * Draw the background for the given cell region.
   */
  private _drawBackground(rgn: Private.ICellRegion, color: string | undefined): void {
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
   * Draw the row background for the given cell region.
   */
  private _drawRowBackground(rgn: Private.ICellRegion, colorFn: ((i: number) => string) | undefined): void {
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
        let y1 = Math.max(rgn.yMin, y - 1);
        let y2 = Math.min(y + size - 1, rgn.yMax);
        this._canvasGC.fillStyle = color;
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Increment the running Y coordinate.
      y += size;
    }
  }

  /**
   * Draw the column background for the given cell region.
   */
  private _drawColumnBackground(rgn: Private.ICellRegion, colorFn: ((i: number) => string) | undefined): void {
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
        let x1 = Math.max(rgn.xMin, x - 1);
        let x2 = Math.min(x + size - 1, rgn.xMax);
        this._canvasGC.fillStyle = color;
        this._canvasGC.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Increment the running X coordinate.
      x += size;
    }
  }

  /**
   * Draw the cells for the given cell region.
   */
  private _drawCells(rgn: Private.ICellRegion): void {
    // Bail if there is no data model.
    if (!this._model) {
      return;
    }

    // Set up a default empty field object.
    let emptyField: DataModel.IField = { name: '', type: '' };

    // Set up the cell config object for rendering.
    let config = {
      x: 0, y: 0, width: 0, height: 0, row: 0, column: 0,
      value: (null as any), field: emptyField
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

      // Get the field descriptor for the column.
      let field: DataModel.IField;
      try {
        field = this._model.field(column);
      } catch (err) {
        field = emptyField;
        console.error(err);
      }

      // Update the config for the current column.
      config.x = x - 1;
      config.width = width + 1;
      config.column = column;
      config.field = field;

      // Clear the buffer rect for the column.
      gc.clearRect(x, rgn.y, width, rgn.height);

      // Save the GC state.
      gc.save();

      // Look up the renderer for the column.
      let renderer = this._cellRendererMap.get(
        rgn.region, field.name, field.type
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
          value = this._model.data(row, column);
        } catch (err) {
          value = undefined;
          console.error(err);
        }

        // Update the config for the current cell.
        config.y = y - 1;
        config.height = height + 1;
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
      let x1 = Math.max(rgn.xMin, x - 1);
      let x2 = Math.min(x + width - 1, rgn.xMax);

      // Copy the off-screen buffer column into the on-screen canvas.
      //
      // This is *much* faster than drawing directly into the on-screen
      // canvas with a clip rect on the column. Managed column clipping
      // is required to prevent cell renderers from needing to set up a
      // clip rect for handling horizontal overflow text (slow!).
      this._canvasGC.drawImage(this._buffer,
        x1, y1, x2 - x1 + 1, y2 - y1 + 1,
        x1, y1, x2 - x1 + 1, y2 - y1 + 1
      );

      // Increment the running X coordinate.
      x += width;
    }

    // Dispose of the wrapped gc.
    gc.dispose();

    // Restore the final buffer gc state.
    this._bufferGC.restore();
  }

  /**
   * Draw the horizontal grid lines for the given cell region.
   */
  private _drawHorizontalGridLines(rgn: Private.ICellRegion, color: string | undefined): void {
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
   * Draw the vertical grid lines for the given cell region.
   */
  private _drawVerticalGridLines(rgn: Private.ICellRegion, color: string | undefined): void {
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

  /**
   * Ensure the canvas is at least the specified size.
   *
   * This method will retain the valid canvas content.
   */
  private _expandCanvasIfNeeded(width: number, height: number): void {
    // Bail if the canvas is larger than the specified size.
    if (this._canvas.width > width && this._canvas.height > height) {
      return;
    }

    // Compute the expanded canvas size.
    let exWidth = Math.ceil((width + 1) / 512) * 512;
    let exHeight = Math.ceil((height + 1) / 512) * 512;

    // Expand the buffer width if needed.
    if (this._buffer.width < width) {
      this._buffer.width = exWidth;
    }

    // Expand the buffer height if needed.
    if (this._buffer.height < height) {
      this._buffer.height = exHeight;
    }

    // Test whether there is valid content to blit.
    let needBlit = this._canvas.width > 0 && this._canvas.height > 0;

    // Copy the valid content into the buffer if needed.
    if (needBlit) {
      this._bufferGC.clearRect(0, 0, width, height);
      this._bufferGC.drawImage(this._canvas, 0, 0);
    }

    // Expand the canvas width if needed.
    if (this._canvas.width < width) {
      this._canvas.width = exWidth;
      this._canvas.style.width = `${exWidth}px`;
    }

    // Expand the canvas height of needed.
    if (this._canvas.height < height) {
      this._canvas.height = exHeight;
      this._canvas.style.height = `${exHeight}px`;
    }

    // Copy the valid content from the buffer if needed.
    if (needBlit) {
      this._canvasGC.clearRect(0, 0, width, height);
      this._canvasGC.drawImage(this._buffer, 0, 0);
    }
  }

  private _viewport: Widget;
  private _vScrollBar: ScrollBar;
  private _hScrollBar: ScrollBar;
  private _scrollCorner: Widget;

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

  private _scrollX = 0;
  private _scrollY = 0;
  private _inPaint = false;

  private _model: DataModel | null = null;

  private _style: DataGrid.IStyle;
  private _cellRendererMap: Private.CellRendererMap;
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
  interface IStyle {
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
  }

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
    style?: IStyle;

    /**
     * The header visibility for the data grid.
     *
     * The default is `'all'`.
     */
    headerVisibility?: HeaderVisibility;

    /**
     * The default cell renderer for the data grid.
     *
     * The default is a new `TextRenderer`.
     */
    defaultCellRenderer?: CellRenderer;
  }

  /**
   * The default theme for a data grid.
   */
  export
  const defaultStyle: DataGrid.IStyle = {
    voidColor: '#F3F3F3',
    backgroundColor: '#FFFFFF',
    gridLineColor: 'rgba(20, 20, 20, 0.15)',
    headerBackgroundColor: '#F3F3F3',
    headerGridLineColor: '#B5B5B5'
  };

  /**
   * A type alias for the data grid regions.
   */
  export
  type Region = 'row-header' | 'column-header' | 'corner-header' | 'body';

  /**
   * An object used as a key for getting/setting cell renderers.
   */
  export
  interface IRendererKey {
    /**
     * The grid region for which the cell renderer is applicable.
     */
    region: Region;

    /**
     * The field name for which the cell renderer is applicable.
     *
     * This is matched against the `IField.name` of the data model.
     *
     * If this is `undefined` or `''`, the cell renderer will apply
     * to all field names.
     */
    fieldName?: string;

    /**
     * The field type for which the cell renderer is applicable.
     *
     * This is matched against the `IField.type` of the data model.
     *
     * If this is `undefined` or `''`, the cell renderer will apply
     * to all field types.
     */
    fieldType?: string;
  }
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
   * An object which represents a cell region.
   */
  export
  interface ICellRegion {
    /**
     * The data grid region being drawn.
     */
    region: DataGrid.Region;

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
   * An object which manages the mapping of cell renderers.
   */
  export
  class CellRendererMap {
    /**
     * Construct a new cell renderer map.
     *
     * @param fallback - The cell renderer of last resort.
     */
    constructor(fallback: CellRenderer) {
      this.fallback = fallback;
    }

    /**
     * The cell renderer of last resort.
     */
    fallback: CellRenderer;

    /**
     * Look up a cell renderer for a column.
     *
     * @param region - The data grid region of interest.
     *
     * @param name - The field name of the column, or `''`.
     *
     * @param type - The field type of the column, or `''`.
     *
     * @returns The cell renderer for the column, or the fallback.
     *
     * #### Notes
     * An empty string for `name` or `type` acts as a wild card.
     */
    get(region: DataGrid.Region, name: string, type: string): CellRenderer {
      return (
        (name && type && this._map[`${region}|${name}|${type}`]) ||
        (name && this._map[`${region}|${name}|`]) ||
        (type && this._map[`${region}||${type}`]) ||
        (this._map[`${region}||`]) ||
        this.fallback
      );
    }

    /**
     * Set a cell renderer for a column.
     *
     * @param region - The data grid region of interest.
     *
     * @param name - The field name of the column, or `''`.
     *
     * @param type - The field type of the column, or `''`.
     *
     * @param renderer - The cell renderer to use for the column.
     *
     * #### Notes
     * An empty string for `name` or `type` acts as a wild card.
     */
    set(region: DataGrid.Region, name: string, type: string, renderer: CellRenderer): void {
      this._map[`${region}|${name}|${type}`] = renderer;
    }

    /**
     * Clear the mapped cell renderers.
     *
     * #### Notes
     * This will not affect the `fallback` renderer.
     */
    clear(): void {
      this._map = Object.create(null);
    }

    private _map: { [key: string]: CellRenderer } = Object.create(null);
  }
}
