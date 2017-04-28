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
  DataModel
} from './datamodel';

import {
  SectionList
} from './sectionlist';


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

    // Parse the options.
    this._cellRenderer = options.cellRenderer;
    this._theme = options.theme || DataGrid.defaultTheme;

    // Set up the row and column sections lists.
    // TODO - allow base size configuration.
    this._rowSections = new SectionList({ baseSize: 20 });
    this._colSections = new SectionList({ baseSize: 64 });
    this._rowHeaderSections = new SectionList({ baseSize: 96 });
    this._colHeaderSections = new SectionList({ baseSize: 20 });

    // Create the canvas and buffer objects.
    this._canvas = Private.createCanvas();
    this._buffer = Private.createCanvas();

    // Get the graphics contexts for the canvases.
    this._canvasGC = this._canvas.getContext('2d', { alpha: false })!;
    this._bufferGC = this._buffer.getContext('2d', { alpha: false })!;

    // Set up the on-screen canvas.
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0px';
    this._canvas.style.left = '0px';
    this._canvas.style.width = '0px';
    this._canvas.style.height = '0px';

    // Create the internal widgets for the data grid.
    // TODO - support custom scroll bars and corner?
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

    // Set the layout cell configs for the child widgets.
    GridLayout.setCellConfig(this._viewport, { row: 0, col: 0 });
    GridLayout.setCellConfig(this._vScrollBar, { row: 0, col: 1 });
    GridLayout.setCellConfig(this._hScrollBar, { row: 1, col: 0 });
    GridLayout.setCellConfig(this._scrollCorner, { row: 1, col: 1 });

    // Create the layout for the data grid.
    let layout = new GridLayout({
      rowCount: 2,
      colCount: 2,
      rowSpacing: 0,
      colSpacing: 0,
      fitPolicy: 'set-no-constraint'
    });

    // Set the stretch factors for the grid.
    layout.setRowStretch(0, 1);
    layout.setColStretch(0, 1);
    layout.setRowStretch(1, 0);
    layout.setColStretch(1, 0);

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
    this._colSections.clear();
    this._rowHeaderSections.clear();
    this._colHeaderSections.clear();

    // Populate the section lists.
    if (value) {
      this._rowSections.insertSections(0, value.rowCount);
      this._colSections.insertSections(0, value.colCount);
      this._rowHeaderSections.insertSections(0, value.rowHeaderCount);
      this._colHeaderSections.insertSections(0, value.colHeaderCount);
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
   * Get the cell renderer for the data grid.
   */
  get cellRenderer(): DataGrid.ICellRenderer {
    return this._cellRenderer;
  }

  /**
   * Set the cell renderer for the data grid.
   */
  set cellRenderer(value: DataGrid.ICellRenderer) {
    if (this._cellRenderer !== value) {
      this._cellRenderer = value;
      this.repaint();
    }
  }

  /**
   * Get the theme for the data grid.
   */
  get theme(): DataGrid.ITheme {
    return this._theme;
  }

  /**
   * Set the theme for the data grid.
   */
  set theme(value: DataGrid.ITheme) {
    if (this._theme !== value) {
      this._theme = value;
      this.repaint();
    }
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
    return this._colSections.totalSize;
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
   * The width of the visible portion of the main cell content.
   *
   * #### Notes
   * This value does not include the width of the row headers.
   */
  get pageWidth(): number {
    return Math.max(0, this._canvas.width - this._rowHeaderSections.totalSize);
  }

  /**
   * The height of the visible portion of the main cell content.
   *
   * #### Notes
   * This value does not include the height of the column headers.
   */
  get pageHeight(): number {
    return Math.max(0, this._canvas.height - this._colHeaderSections.totalSize);
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

  // /**
  //  * The total width of the row headers.
  //  */
  // get rowHeaderWidth(): number {
  //   return this._rowHeaderSections.totalSize;
  // }

  // /**
  //  * The total height of the column headers.
  //  */
  // get colHeaderHeight(): number {
  //   return this._colHeaderSections.totalSize;
  // }

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
    let cols = this._colSections;
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
      c = cols.sectionIndex(x - 1);
      x = c < 0 ? x : cols.sectionOffset(c);
      break;
    case 'right':
      c = cols.sectionIndex(x);
      x = c < 0 ? x : cols.sectionOffset(c) + cols.sectionSize(c);
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

    // Get the current size of the canvas.
    let width = this._canvas.width;
    let height = this._canvas.height;

    // Bail early if the canvas is empty.
    if (width === 0 || height === 0) {
      this._scrollX = x;
      this._scrollY = y;
      return;
    }

    // Get the visible content origin.
    let contentX = this._rowHeaderSections.totalSize;
    let contentY = this._colHeaderSections.totalSize;

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

    // Resize the canvas and buffer to fit.
    this._canvas.width = width;
    this._canvas.height = height;
    this._buffer.width = width;
    this._buffer.height = height;

    // Update the canvas style to the new size.
    this._canvas.style.width = `${width}px`;
    this._canvas.style.height = `${height}px`;

    // Repaint the viewport immediately.
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
  private _onModelChanged(sender: DataModel, args: DataModel.ChangedArgs): void { }

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

    // Draw the void space region.
    this._drawVoidSpaceRegion(rx, ry, rw, rh);

    // Draw the main area region.
    this._drawMainCellRegion(rx, ry, rw, rh);

    // Draw the row header region.
    this._drawRowHeaderRegion(rx, ry, rw, rh);

    // Draw the column header region.
    this._drawColHeaderRegion(rx, ry, rw, rh);

    // Draw the corner header region.
    this._drawCornerHeaderRegion(rx, ry, rw, rh);
  }

  /**
   * Draw the void space region which intersects the dirty rect.
   */
  private _drawVoidSpaceRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Look up the void space color.
    let voidSpaceColor = this._theme.voidSpaceColor;

    // Fill the dirty rect with the void space color if needed.
    if (voidSpaceColor) {
      this._canvasGC.fillStyle = voidSpaceColor;
      this._canvasGC.fillRect(rx, ry, rw, rh);
    }
  }

  /**
   * Draw the main cell region which intersects the dirty rect.
   */
  private _drawMainCellRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._colSections.totalSize - this._scrollX;
    let contentH = this._rowSections.totalSize - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this._rowHeaderSections.totalSize;
    let contentY = this._colHeaderSections.totalSize;

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

    // Convert the cell bounds back to visible coordinates.
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

    // Create the cell region object.
    let rgn = { x, y, width, height, r1, c1, rowSizes, colSizes };

    // Save the gc state.
    this._canvasGC.save();

    // Clip to the dirty visible content bounds.
    this._canvasGC.beginPath();
    this._canvasGC.rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    this._canvasGC.clip();

    // Look up the background color.
    let bgColor = this._theme.backgroundColor;

    // Fill the region with the background color if needed.
    if (bgColor) {
      this._canvasGC.fillStyle = bgColor;
      this._canvasGC.fillRect(x, y, width, height);
    }

    // Look up the grid striping parameters.
    let rowStripeColor = this._theme.rowStripeColor;
    let colStripeColor = this._theme.colStripeColor;

    // Draw the row striping if needed.
    if (rowStripeColor) {
      this._drawRowStriping(rgn, rowStripeColor);
    }

    // Draw the column striping if needed.
    if (colStripeColor) {
      this._drawColStriping(rgn, colStripeColor);
    }

    // Draw the cell content for the cell region.
    this._drawCells(rgn);

    // Look up the grid line colors.
    let glColor = this._theme.gridLineColor;
    let glHColor = this._theme.horizontalGridLineColor || glColor;
    let glVColor = this._theme.verticalGridLineColor || glColor;

    // Draw the horizontal grid lines if needed.
    if (glHColor) {
      this._drawHorizontalGridLines(rgn, glHColor);
    }

    // Draw the vertical grid lines if needed.
    if (glVColor) {
      this._drawVerticalGridLines(rgn, glVColor);
    }

    // Look up the border line colors.
    let blColor = this._theme.borderLineColor;
    let blRColor = this._theme.rightBorderLineColor || blColor;
    let blBColor = this._theme.bottomBorderLineColor || blColor;

    // Draw the bottom border line if needed.
    if (blBColor && r2 === this._rowSections.sectionCount - 1) {
      this._drawBottomBorderLine(rgn, blBColor);
    }

    // Draw the right border line if needed.
    if (blRColor && c2 === this._colSections.sectionCount - 1) {
      this._drawRightBorderLine(rgn, blRColor);
    }

    // Restore the gc state.
    this._canvasGC.restore();
  }

  /**
   * Draw the row header region which intersects the dirty rect.
   */
  private _drawRowHeaderRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._rowHeaderSections.totalSize;
    let contentH = this._rowSections.totalSize - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = this._colHeaderSections.totalSize;

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
    let colSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._rowSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the col sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sectionSize(i);
      colSizes[i - c1] = size;
      width += size;
    }

    // Adjust the start column for the header offset.
    c1 -= this._rowHeaderSections.sectionCount;

    // Create the cell region object.
    let rgn = { x, y, width, height, r1, c1, rowSizes, colSizes };

    // Save the gc state.
    this._canvasGC.save();

    // Clip to the dirty visible content bounds.
    this._canvasGC.beginPath();
    this._canvasGC.rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    this._canvasGC.clip();

    // Look up the background color.
    let bgColor = (
      this._theme.rowHeaderBackgroundColor ||
      this._theme.headerBackgroundColor
    );

    // Fill the region with the background color if needed.
    if (bgColor) {
      this._canvasGC.fillStyle = bgColor;
      this._canvasGC.fillRect(x, y, width, height);
    }

    // Draw the cell content for the cell region.
    this._drawCells(rgn);

    // Look up the grid line colors.
    let glColor = this._theme.headerGridLineColor;
    let glHColor = this._theme.rowHeaderHorizontalGridLineColor || glColor;
    let glVColor = this._theme.rowHeaderVerticalGridLineColor || glColor;

    // Draw the horizontal grid lines if needed.
    if (glHColor) {
      this._drawHorizontalGridLines(rgn, glHColor);
    }

    // Draw the vertical grid lines if needed.
    if (glVColor) {
      this._drawVerticalGridLines(rgn, glVColor);
    }

    // Look up the border line colors.
    let blColor = this._theme.rowHeaderBorderLineColor;
    let blRColor = this._theme.rowHeaderRightBorderLineColor || blColor;
    let blBColor = this._theme.rowHeaderBottomBorderLineColor || blColor;

    // Draw the bottom border line if needed.
    if (blBColor && r2 === this._rowSections.sectionCount - 1) {
      this._drawBottomBorderLine(rgn, blBColor);
    }

    // Draw the right border line if needed.
    if (blRColor && c2 === this._rowHeaderSections.sectionCount - 1) {
      this._drawRightBorderLine(rgn, blRColor);
    }

    // Restore the gc state.
    this._canvasGC.restore();
  }

  /**
   * Draw the column header region which intersects the dirty rect.
   */
  private _drawColHeaderRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._colSections.totalSize - this._scrollX;
    let contentH = this._colHeaderSections.totalSize;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this._rowHeaderSections.totalSize;
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
    let r1 = this._colHeaderSections.sectionIndex(y1);
    let c1 = this._colSections.sectionIndex(x1 - contentX + this._scrollX);
    let r2 = this._colHeaderSections.sectionIndex(y2 + 1);
    let c2 = this._colSections.sectionIndex(x2 - contentX + this._scrollX + 1);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._colHeaderSections.sectionCount - 1;
    }
    if (c2 < 0) {
      c2 = this._colSections.sectionCount - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._colSections.sectionOffset(c1) + contentX - this._scrollX;
    let y = this._colHeaderSections.sectionOffset(r1);

    // Set up the cell region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let colSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._colHeaderSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the col sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._colSections.sectionSize(i);
      colSizes[i - c1] = size;
      width += size;
    }

    // Adjust the start column for the header offset.
    r1 -= this._colHeaderSections.sectionCount;

    // Create the cell region object.
    let rgn = { x, y, width, height, r1, c1, rowSizes, colSizes };

    // Save the gc state.
    this._canvasGC.save();

    // Clip to the dirty visible content bounds.
    this._canvasGC.beginPath();
    this._canvasGC.rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    this._canvasGC.clip();

    // Look up the background color.
    let bgColor = (
      this._theme.colHeaderBackgroundColor ||
      this._theme.headerBackgroundColor
    );

    // Fill the region with the background color if needed.
    if (bgColor) {
      this._canvasGC.fillStyle = bgColor;
      this._canvasGC.fillRect(x, y, width, height);
    }

    // Draw the cell content for the cell region.
    this._drawCells(rgn);

    // Look up the grid line colors.
    let glColor = this._theme.headerGridLineColor;
    let glHColor = this._theme.colHeaderHorizontalGridLineColor || glColor;
    let glVColor = this._theme.colHeaderVerticalGridLineColor || glColor;

    // Draw the horizontal grid lines if needed.
    if (glHColor) {
      this._drawHorizontalGridLines(rgn, glHColor);
    }

    // Draw the vertical grid lines if needed.
    if (glVColor) {
      this._drawVerticalGridLines(rgn, glVColor);
    }

    // Look up the border line colors.
    let blColor = this._theme.colHeaderBorderLineColor;
    let blRColor = this._theme.colHeaderRightBorderLineColor || blColor;
    let blBColor = this._theme.colHeaderBottomBorderLineColor || blColor;

    // Draw the bottom border line if needed.
    if (blBColor && r2 === this._colHeaderSections.sectionCount - 1) {
      this._drawBottomBorderLine(rgn, blBColor);
    }

    // Draw the right border line if needed.
    if (blRColor && c2 === this._colSections.sectionCount - 1) {
      this._drawRightBorderLine(rgn, blRColor);
    }

    // Restore the gc state.
    this._canvasGC.restore();
  }

  /**
   * Draw the corner header region which intersects the dirty rect.
   */
  private _drawCornerHeaderRegion(rx: number, ry: number, rw: number, rh: number): void {
    // Get the visible content dimensions.
    let contentW = this._rowHeaderSections.totalSize;
    let contentH = this._colHeaderSections.totalSize;

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
    let r1 = this._colHeaderSections.sectionIndex(y1);
    let c1 = this._rowHeaderSections.sectionIndex(x1);
    let r2 = this._colHeaderSections.sectionIndex(y2 + 1);
    let c2 = this._rowHeaderSections.sectionIndex(x2 + 1);

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = this._colHeaderSections.sectionCount - 1;
    }
    if (c2 < 0) {
      c2 = this._rowHeaderSections.sectionCount - 1;
    }

    // Convert the cell bounds back to visible coordinates.
    let x = this._rowHeaderSections.sectionOffset(c1);
    let y = this._colHeaderSections.sectionOffset(r1);

    // Set up the cell region size variables.
    let width = 0;
    let height = 0;

    // Allocate the section sizes arrays.
    let rowSizes = new Array<number>(r2 - r1 + 1);
    let colSizes = new Array<number>(c2 - c1 + 1);

    // Get the row sizes for the region.
    for (let j = r1; j <= r2; ++j) {
      let size = this._colHeaderSections.sectionSize(j);
      rowSizes[j - r1] = size;
      height += size;
    }

    // Get the col sizes for the region.
    for (let i = c1; i <= c2; ++i) {
      let size = this._rowHeaderSections.sectionSize(i);
      colSizes[i - c1] = size;
      width += size;
    }

    // Adjust the start row and column for the header offset.
    r1 -= this._colHeaderSections.sectionCount;
    c1 -= this._rowHeaderSections.sectionCount;

    // Create the cell region object.
    let rgn = { x, y, width, height, r1, c1, rowSizes, colSizes };

    // Save the gc state.
    this._canvasGC.save();

    // Clip to the dirty visible content bounds.
    this._canvasGC.beginPath();
    this._canvasGC.rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    this._canvasGC.clip();

    // Look up the background color.
    let bgColor = (
      this._theme.cornerHeaderBackgroundColor ||
      this._theme.headerBackgroundColor
    );

    // Fill the region with the background color if needed.
    if (bgColor) {
      this._canvasGC.fillStyle = bgColor;
      this._canvasGC.fillRect(x, y, width, height);
    }

    // Draw the cell content for the cell region.
    this._drawCells(rgn);

    // Look up the grid line colors.
    let glColor = this._theme.headerGridLineColor;
    let glHColor = this._theme.cornerHeaderHorizontalGridLineColor || glColor;
    let glVColor = this._theme.cornerHeaderVerticalGridLineColor || glColor;

    // Draw the horizontal grid lines if needed.
    if (glHColor) {
      this._drawHorizontalGridLines(rgn, glHColor);
    }

    // Draw the vertical grid lines if needed.
    if (glVColor) {
      this._drawVerticalGridLines(rgn, glVColor);
    }

    // Look up the border line colors.
    let blColor = this._theme.cornerHeaderBorderLineColor;
    let blRColor = this._theme.cornerHeaderRightBorderLineColor || blColor;
    let blBColor = this._theme.cornerHeaderBottomBorderLineColor || blColor;

    // Draw the bottom border line if needed.
    if (blBColor && r2 === this._rowHeaderSections.sectionCount - 1) {
      this._drawBottomBorderLine(rgn, blBColor);
    }

    // Draw the right border line if needed.
    if (blRColor && c2 === this._colHeaderSections.sectionCount - 1) {
      this._drawRightBorderLine(rgn, blRColor);
    }

    // Restore the gc state.
    this._canvasGC.restore();
  }

  /**
   * Draw the row striping for the given cell region.
   */
  private _drawRowStriping(rgn: Private.ICellRegion, stripeColor: (i: number) => string): void {
    // Draw the striping for the rows in the region.
    for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
      // Fetch the size of the row.
      let size = rgn.rowSizes[j];

      // Skip zero sized rows.
      if (size === 0) {
        continue;
      }

      // Get the stripe color for the row.
      let color = stripeColor(rgn.r1 + j);

      // Skip rows with no stripe color.
      if (!color) {
        y += size;
        continue;
      }

      // Fill the row with the stripe color.
      this._canvasGC.fillStyle = color;
      this._canvasGC.fillRect(rgn.x, y - 1, rgn.width, size + 1);

      // Increment the running Y coordinate.
      y += size;
    }
  }

  /**
   * Draw the column striping for the given cell region.
   */
  private _drawColStriping(rgn: Private.ICellRegion, stripeColor: (i: number) => string): void {
    // Draw the striping for the columns in the region.
    for (let x = rgn.x, i = 0, n = rgn.colSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let size = rgn.colSizes[i];

      // Skip zero sized columns.
      if (size === 0) {
        continue;
      }

      // Get the stripe color for the column.
      let color = stripeColor(rgn.c1 + i);

      // Skip columns with no stripe color.
      if (!color) {
        x += size;
        continue;
      }

      // Fill the column with the stripe color.
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
    if (!this._model) {
      return;
    }

    // Set up the cell config object for rendering.
    let config = {
      x: 0, y: 0, width: 0, height: 0, row: 0, col: 0,
      value: (null as any), field: (null as DataModel.IField | null)
    };

    // Loop over the columns in the region.
    for (let x = rgn.x, i = 0, n = rgn.colSizes.length; i < n; ++i) {
      // Fetch the size of the column.
      let width = rgn.colSizes[i];

      // Skip zero sized columns.
      if (width === 0) {
        continue;
      }

      // Compute the column index.
      let col = rgn.c1 + i;

      // Get the field descriptor for the column.
      let field = this._model.field(col);

      // Update the config for the current column.
      config.x = x - 1;
      config.width = width + 1;
      config.col = col;
      config.field = field;

      // Loop over the rows in the column.
      for (let y = rgn.y, j = 0, n = rgn.rowSizes.length; j < n; ++j) {
        // Fetch the size of the row.
        let height = rgn.rowSizes[j];

        // Skip zero sized rows.
        if (height === 0) {
          continue;
        }

        // Compute the row index.
        let row = rgn.r1 + j;

        // Get the data value for the cell.
        let value = this._model.data(row, col);

        // Update the config for the current cell.
        config.y = y - 1;
        config.height = height + 1;
        config.row = row;
        config.value = value;

        // Draw the cell.
        this._cellRenderer.drawCell(this._canvasGC, config);

        // Increment the running Y coordinate.
        y += height;
      }

      // Increment the running X coordinate.
      x += width;
    }
  }

  /**
   * Draw the horizontal grid lines for the given cell region.
   */
  private _drawHorizontalGridLines(rgn: Private.ICellRegion, color: string): void {
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
      let pos = y + size - 0.5;

      // Draw the 1px thick row line.
      this._canvasGC.moveTo(rgn.x, pos);
      this._canvasGC.lineTo(rgn.x + rgn.width, pos);

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
  private _drawVerticalGridLines(rgn: Private.ICellRegion, color: string): void {
    // Begin the path for the grid lines
    this._canvasGC.beginPath();

    // Set the line width for the grid lines.
    this._canvasGC.lineWidth = 1;

    // Draw the vertical grid lines.
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

    // Stroke the lines with the specified color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();
  }

  /**
   * Draw the right border line for the cell region.
   */
  private _drawRightBorderLine(rgn: Private.ICellRegion, color: string): void {
    // Begin the path for the border line.
    this._canvasGC.beginPath();

    // Set the line width for the border line.
    this._canvasGC.lineWidth = 1;

    // Draw the border line.
    this._canvasGC.moveTo(rgn.x + rgn.width - 0.5, rgn.y);
    this._canvasGC.lineTo(rgn.x + rgn.width - 0.5, rgn.y + rgn.height);

    // Stroke the line with the specified color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();
  }

  /**
   * Draw the bottom border line for the cell region.
   */
  private _drawBottomBorderLine(rgn: Private.ICellRegion, color: string): void {
    // Begin the path for the border line.
    this._canvasGC.beginPath();

    // Set the line width for the border line.
    this._canvasGC.lineWidth = 1;

    // Draw the border line.
    this._canvasGC.moveTo(rgn.x, rgn.y + rgn.height - 0.5);
    this._canvasGC.lineTo(rgn.x + rgn.width, rgn.y + rgn.height - 0.5);

    // Stroke the line with the specified color.
    this._canvasGC.strokeStyle = color;
    this._canvasGC.stroke();
  }

  private _viewport: Widget;
  private _vScrollBar: ScrollBar;
  private _hScrollBar: ScrollBar;
  private _scrollCorner: Widget;

  private _vScrollBarMinWidth = 0;
  private _hScrollBarMinHeight = 0;

  private _canvas: HTMLCanvasElement;
  private _buffer: HTMLCanvasElement;
  private _canvasGC: CanvasRenderingContext2D;
  private _bufferGC: CanvasRenderingContext2D;

  private _rowSections: SectionList;
  private _colSections: SectionList;
  private _rowHeaderSections: SectionList;
  private _colHeaderSections: SectionList;

  private _scrollX = 0;
  private _scrollY = 0;
  private _inPaint = false;

  private _model: DataModel | null = null;

  private _cellRenderer: DataGrid.ICellRenderer;
  private _theme: DataGrid.ITheme;
}


/**
 * The namespace for the `DataGrid` class statics.
 */
export
namespace DataGrid {
  /**
   * An object which renders the cells of a data grid.
   *
   * #### Notes
   * If the predefined cell renderers are insufficient for a particular
   * use case, a custom cell renderer can be defined which implements
   * this interface.
   *
   * A cell renderer **must not** throw exceptions, and **must not**
   * mutate the data model or the data grid.
   */
  export
  interface ICellRenderer {
    /**
     * Draw the content for a cell.
     *
     * @param gc - The graphics context to use for drawing.
     *
     * @param config - The configuration data for the cell.
     *
     * #### Notes
     * The grid renders cells in column-major order. For performance,
     * it **does not** apply a clipping rect to the cell bounds before
     * it invokes the renderer, **nor** does it save/restore the `gc`.
     *
     * The renderer should assume that the fill, stroke, and text style
     * of the `gc` have been arbitrarily modified, but that the rest of
     * the `gc` state remains in the default state.
     *
     * If the renderer modifies any `gc` state aside from the fill,
     * stroke, and text style, it **must** restore the `gc` on exit.
     *
     * The renderer **must not** draw outside the cell bounding box.
     */
    drawCell(gc: CanvasRenderingContext2D, config: ICellConfig): void;
  }

  /**
   * An object which holds the configuration data for a cell.
   */
  export
  interface ICellConfig {
    /**
     * The X coordinate of the cell bounding rectangle.
     *
     * #### Notes
     * This is the viewport coordinate of the rect, and is aligned to
     * the cell boundary. It may be negative if the cell is partially
     * off-screen.
     */
    readonly x: number;

    /**
     * The Y coordinate of the cell bounding rectangle.
     *
     * #### Notes
     * This is the viewport coordinate of the rect, and is aligned to
     * the cell boundary. It may be negative if the cell is partially
     * off-screen.
     */
    readonly y: number;

    /**
     * The width of the cell bounding rectangle.
     *
     * #### Notes
     * This value is aligned to the cell boundary. It may extend past
     * the viewport bounds if the cell is partially off-screen.
     */
    readonly width: number;

    /**
     * The width of the cell bounding rectangle.
     *
     * #### Notes
     * This value is aligned to the cell boundary. It may extend past
     * the viewport bounds if the cell is partially off-screen.
     */
    readonly height: number;

    /**
     * The row index of the cell.
     */
    readonly row: number;

    /**
     * The column index of the cell.
     */
    readonly col: number;

    /**
     * The data value for the cell.
     */
    readonly value: any;

    /**
     * The field descriptor for the column, or `null`.
     */
    readonly field: DataModel.IField | null;
  }

  /**
   * An object which defines the data grid theme.
   *
   * #### Notes
   * A theme provides the styling for the parts of data grid which
   * are independent of the cell renderer.
   *
   * Theme colors support the full CSS color syntax.
   *
   * The data grid **does not** supply its own default colors for
   * theme elements. If the theme does not provide a color for an
   * element, that particular element will not be drawn.
   *
   * A grid theme **must not** throw exceptions, and **must not**
   * mutate the data model or the data grid.
   */
  export
  interface ITheme {
    /**
     * The background color for the the entire data grid.
     */
    readonly voidSpaceColor?: string;

    /**
     * The background color for the main cell area.
     */
    readonly backgroundColor?: string;

    /**
     * A function which returns the background color for a row.
     */
    readonly rowStripeColor?: (index: number) => string;

    /**
     * A function which returns the background color for a column.
     */
    readonly colStripeColor?: (index: number) => string;

    /**
     * The grid line color for the main cell area.
     *
     * This applies to both horizontal and vertical lines.
     */
    readonly gridLineColor?: string;

    /**
     * The vertical grid line color for the main cell area.
     *
     * This overrides `gridLineColor` for vertical lines.
     */
    readonly verticalGridLineColor?: string;

    /**
     * The horizontal grid line color for the main cell area.
     *
     * This overrides `gridLineColor` for horizontal lines.
     */
    readonly horizontalGridLineColor?: string;

    /**
     * The line color for the border of the main cell area.
     *
     * This applies to both the right and bottom border lines.
     */
    readonly borderLineColor?: string;

    /**
     * The line color for the right border of the main cell area.
     *
     * This border draws on top of the right-most grid line.
     */
    readonly rightBorderLineColor?: string;

    /**
     * The line color for the bottom border of the main cell area.
     *
     * This border draws on top of the bottom-most grid line.
     */
    readonly bottomBorderLineColor?: string;

    /**
     * The background color for the grid headers.
     *
     * This applies to all of row, column, and corner headers.
     */
    readonly headerBackgroundColor?: string;

    /**
     * The grid line color for the grid headers.
     *
     * This applies to all of row, column, and corner headers.
     */
    readonly headerGridLineColor?: string;

    /**
     * The background color for the row header area.
     *
     * This overrides `headerBackgroundColor` for row headers.
     */
    readonly rowHeaderBackgroundColor?: string;

    /**
     * The vertical grid line color for the row header area.
     *
     * This overrides `headerGridLineColor` for vertical lines.
     */
    readonly rowHeaderVerticalGridLineColor?: string;

    /**
     * The horizontal grid line color for the row header area.
     *
     * This overrides `headerGridLineColor` for horizontal lines.
     */
    readonly rowHeaderHorizontalGridLineColor?: string;

    /**
     * The line color for the border of the row header area.
     *
     * This applies to both the right and bottom border lines.
     */
    readonly rowHeaderBorderLineColor?: string;

    /**
     * The line color for the right border of the row header area.
     *
     * This border draws on top of the right-most grid line.
     */
    readonly rowHeaderRightBorderLineColor?: string;

    /**
     * The line color for the bottom border of the row header area.
     *
     * This border draws on top of the bottom-most grid line.
     */
    readonly rowHeaderBottomBorderLineColor?: string;

    /**
     * The background color for the column header area.
     *
     * This overrides `headerBackgroundColor` for column headers.
     */
    readonly colHeaderBackgroundColor?: string;

    /**
     * The vertical grid line color for the column header area.
     *
     * This overrides `headerGridLineColor` for vertical lines.
     */
    readonly colHeaderVerticalGridLineColor?: string;

    /**
     * The horizontal grid line color for the column header area.
     *
     * This overrides `headerGridLineColor` for horizontal lines.
     */
    readonly colHeaderHorizontalGridLineColor?: string;

    /**
     * The line color for the border of the column header area.
     *
     * This applies to both the right and bottom border lines.
     */
    readonly colHeaderBorderLineColor?: string;

    /**
     * The line color for the right border of the column header area.
     *
     * This border draws on top of the right-most grid line.
     */
    readonly colHeaderRightBorderLineColor?: string;

    /**
     * The line color for the bottom border of the column header area.
     *
     * This border draws on top of the bottom-most grid line.
     */
    readonly colHeaderBottomBorderLineColor?: string;

    /**
     * The background color for the corner header area.
     *
     * This overrides `headerBackgroundColor` for corner headers.
     */
    readonly cornerHeaderBackgroundColor?: string;

    /**
     * The vertical grid line color for the corner header area.
     *
     * This overrides `headerGridLineColor` for vertical lines.
     */
    readonly cornerHeaderVerticalGridLineColor?: string;

    /**
     * The horizontal grid line color for the corner header area.
     *
     * This overrides `headerGridLineColor` for horizontal lines.
     */
    readonly cornerHeaderHorizontalGridLineColor?: string;

    /**
     * The line color for the border of the corner header area.
     *
     * This applies to both the right and bottom border lines.
     */
    readonly cornerHeaderBorderLineColor?: string;

    /**
     * The line color for the right border of the corner header area.
     *
     * This border draws on top of the right-most grid line.
     */
    readonly cornerHeaderRightBorderLineColor?: string;

    /**
     * The line color for the bottom border of the corner header area.
     *
     * This border draws on top of the bottom-most grid line.
     */
    readonly cornerHeaderBottomBorderLineColor?: string;
  }

  /**
   * An options object for initializing a data grid.
   */
  export
  interface IOptions {
    /**
     * The cell renderer for the data grid.
     */
    cellRenderer: ICellRenderer;

    /**
     * The grid theme for the data grid.
     *
     * The default is `DataGrid.defaultTheme`.
     */
    theme?: ITheme;
  }

  /**
   * The default theme for a data grid.
   */
  export
  const defaultTheme: DataGrid.ITheme = {
    voidSpaceColor: '#F3F3F3',
    backgroundColor: '#FFFFFF',
    gridLineColor: 'rgba(20, 20, 20, 0.15)',
    headerBackgroundColor: '#F3F3F3',
    headerGridLineColor: '#B5B5B5',
    rowHeaderBorderLineColor: '#A0A0A0',
    colHeaderBorderLineColor: '#A0A0A0'
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
     * The row sizes for the rows in the region.
     */
    rowSizes: number[];

    /**
     * The col sizes for the cols in the region.
     */
    colSizes: number[];
  }
}
