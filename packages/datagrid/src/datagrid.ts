/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  IDisposable
} from '@phosphor/disposable';

import {
  ElementExt
} from '@phosphor/domutils';

import {
  Drag
} from '@phosphor/dragdrop';

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

    // Set up the cell renderer map.
    if (options.cellRenderers) {
      this._cellRenderers = options.cellRenderers;
    } else {
      let defaultRenderer = new TextRenderer();
      this._cellRenderers = new RendererMap({ defaultRenderer });
    }

    // Connect to the renderer map changed signal
    this._cellRenderers.changed.connect(this._onRenderersChanged, this);

    // Parse the base sizes for the section lists.
    let brh = 20;
    let bcw = 64;
    let brhw = 64;
    let bchh = 20;
    if (options.baseRowHeight !== undefined) {
      brh = options.baseRowHeight;
    }
    if (options.baseColumnWidth !== undefined) {
      bcw = options.baseColumnWidth;
    }
    if (options.baseRowHeaderWidth !== undefined) {
      brhw = options.baseRowHeaderWidth;
    }
    if (options.baseColumnHeaderHeight !== undefined) {
      bchh = options.baseColumnHeaderHeight;
    }

    // Set up the row and column sections lists.
    this._rowSections = new SectionList({ baseSize: brh });
    this._columnSections = new SectionList({ baseSize: bcw });
    this._rowHeaderSections = new SectionList({ baseSize: brhw });
    this._columnHeaderSections = new SectionList({ baseSize: bchh });

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
    this._releaseMouse();
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
      this._rowSections.insertSections(0, value.rowCount('body'));
      this._columnSections.insertSections(0, value.columnCount('body'));
      this._rowHeaderSections.insertSections(0, value.columnCount('row-header'));
      this._columnHeaderSections.insertSections(0, value.rowCount('column-header'));
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

    // Sync the viewport.
    this._syncViewport();
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
   * The total height of the body rows.
   *
   * #### Notes
   * This value does not include the height of the column headers.
   */
  get totalRowHeight(): number {
    return this._rowSections.totalSize;
  }

  /**
   * The total width of the body columns.
   *
   * #### Notes
   * This value does not include the width of the row headers.
   */
  get totalColumnWidth(): number {
    return this._columnSections.totalSize;
  }

  /**
   * The total width of the row headers.
   *
   * #### Notes
   * This will be `0` if the row headers are hidden.
   */
  get totalRowHeaderWidth(): number {
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
  get totalColumnHeaderHeight(): number {
    if (this._headerVisibility === 'none') {
      return 0;
    }
    if (this._headerVisibility === 'row') {
      return 0;
    }
    return this._columnHeaderSections.totalSize;
  }

  /**
   * The total width of the grid content.
   *
   * #### Notes
   * If the grid widget is sized larger than this width, a horizontal
   * scroll bar will not be shown.
   */
  get totalContentWidth(): number {
    return this.totalRowHeaderWidth + this.totalColumnWidth;
  }

  /**
   * The total height of the grid content.
   *
   * #### Notes
   * If the grid widget is sized larger than this height, a vertical
   * scroll bar will not be shown.
   */
  get totalContentHeight(): number {
    return this.totalColumnHeaderHeight + this.totalRowHeight;
  }

  /**
   * The width of the visible portion of the data grid.
   *
   * #### Notes
   * This value does not include the width of the scroll bar.
   */
  get viewportWidth(): number {
    return this._viewportWidth;
  }

  /**
   * The height of the visible portion of the data grid.
   *
   * #### Notes
   * This value does not include the height of the scroll bar.
   */
  get viewportHeight(): number {
    return this._viewportHeight;
  }

  /**
   * The width of the visible portion of the body cells.
   *
   * #### Notes
   * This value does not include the width of the row headers.
   */
  get pageWidth(): number {
    return Math.max(0, this._viewportWidth - this.totalRowHeaderWidth);
  }

  /**
   * The height of the visible portion of the body cells.
   *
   * #### Notes
   * This value does not include the height of the column headers.
   */
  get pageHeight(): number {
    return Math.max(0, this._viewportHeight - this.totalColumnHeaderHeight);
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
    return Math.max(0, this.totalColumnWidth - this.pageWidth - 1);
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
    return Math.max(0, this.totalRowHeight - this.pageHeight - 1);
  }

  /**
   * Get the base height of the body rows.
   *
   * #### Notes
   * This is the height of rows which have not been resized.
   */
  get baseRowHeight(): number {
    return this._rowSections.baseSize;
  }

  /**
   * Set the base height of the body rows.
   *
   * #### Notes
   * This is the height of rows which have not been resized.
   */
  set baseRowHeight(value: number) {
    this._setBaseSize(this._rowSections, value);
  }

  /**
   * Get the base width of the body columns.
   *
   * #### Notes
   * This is the width of columns which have not been resized.
   */
  get baseColumnWidth(): number {
    return this._columnSections.baseSize;
  }

  /**
   * Set the base width of the body columns.
   *
   * #### Notes
   * This is the width of columns which have not been resized.
   */
  set baseColumnWidth(value: number) {
    this._setBaseSize(this._columnSections, value);
  }

  /**
   * Get the base width of the row header columns.
   *
   * #### Notes
   * This is the width of row headers which have not been resized.
   */
  get baseRowHeaderWidth(): number {
    return this._rowHeaderSections.baseSize;
  }

  /**
   * Set the base width of the row header columns.
   *
   * #### Notes
   * This is the width of row headers which have not been resized.
   */
  set baseRowHeaderWidth(value: number) {
    this._setBaseSize(this._rowHeaderSections, value);
  }

  /**
   * Get the base height of the column header rows.
   *
   * #### Notes
   * This is the height of column headers which have not been resized.
   */
  get baseColumnHeaderHeight(): number {
    return this._columnHeaderSections.baseSize;
  }

  /**
   * Set the base height of the column header rows.
   *
   * #### Notes
   * This is the height of column headers which have not been resized.
   */
  set baseColumnHeaderHeight(value: number) {
    this._setBaseSize(this._columnHeaderSections, value);
  }

  /**
   * Get the height of a body row.
   *
   * @param index - The index of the body row of interest.
   *
   * @return The height of the row, or `-1` if `index` is invalid.
   */
  rowHeight(index: number): number {
    return this._rowSections.sectionSize(index);
  }

  /**
   * Get the width of a body column.
   *
   * @param index - The index of the body column of interest.
   *
   * @return The width of the column, or `-1` if `index` is invalid.
   */
  columnWidth(index: number): number {
    return this._columnSections.sectionSize(index);
  }

  /**
   * Get the width of a row header column.
   *
   * @param index - The index of the row header column of interest.
   *
   * @return The width of the column, or `-1` if `index` is invalid.
   */
  rowHeaderWidth(index: number): number {
    return this._rowHeaderSections.sectionSize(index);
  }

  /**
   * Get the height of a column header row.
   *
   * @param index - The index of the column header row of interest.
   *
   * @return The height of the row, or `-1` if `index` is invalid.
   */
  columnHeaderHeight(index: number): number {
    return this._columnHeaderSections.sectionSize(index);
  }

  /**
   * Resize a body row.
   *
   * @param index - The index of the body row of interest.
   *
   * @param size - The new height for the row.
   *
   * #### Notes
   * This is a no-op if `index` is invalid.
   */
  resizeRow(index: number, size: number): void {
    this._resizeSection(this._rowSections, index, size);
  }

  /**
   * Resize a body column.
   *
   * @param index - The index of the body column of interest.
   *
   * @param size - The new width for the column.
   *
   * #### Notes
   * This is a no-op if `index` is invalid.
   */
  resizeColumn(index: number, size: number): void {
    this._resizeSection(this._columnSections, index, size);
  }

  /**
   * Resize a row header column.
   *
   * @param index - The index of the row header column of interest.
   *
   * @param size - The new width for the row header column.
   *
   * #### Notes
   * This is a no-op if `index` is invalid.
   */
  resizeRowHeader(index: number, size: number): void {
    this._resizeSection(this._rowHeaderSections, index, size);
  }

  /**
   * Resize a column header row.
   *
   * @param index - The index of the column header row of interest.
   *
   * @param size - The new height for the column header row.
   *
   * #### Notes
   * This is a no-op if `index` is invalid.
   */
  resizeColumnHeader(index: number, size: number): void {
    this._resizeSection(this._columnHeaderSections, index, size);
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

    // If there is a paint pending, ensure it paints everything.
    if (this._paintPending) {
      this._scrollX = x;
      this._scrollY = y;
      this.repaint();
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
    let contentX = this.totalRowHeaderWidth;
    let contentY = this.totalColumnHeaderHeight;

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
   * Schedule a repaint of the data grid.
   *
   * @param x - The viewport X coordinate of the dirty rect.
   *
   * @param y - The viewport Y coordinate of the dirty rect.
   *
   * @param w - The width of the dirty rect.
   *
   * @param h - The height of the dirty rect.
   *
   * #### Notes
   * This method is called automatically when changing the state of the
   * data grid. However, it may be called manually to repaint the grid
   * whenever external program state change necessitates an update.
   *
   * Multiple synchronous requests are collapsed into a single repaint.
   *
   * The no-argument form of this method will repaint the entire grid.
   */
  repaint(): void;
  repaint(x: number, y: number, width: number, height: number): void;
  repaint(): void {
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
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'wheel':
      this._evtWheel(event as WheelEvent);
      break;
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'contextmenu':
      event.preventDefault();
      event.stopPropagation();
      break;
    }
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    this.node.addEventListener('wheel', this);
    this.node.addEventListener('mousedown', this);
    this._viewport.node.addEventListener('mousemove', this);
    this.repaint(); // TODO actually need to fit the viewport ?
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this.node.removeEventListener('wheel', this);
    this.node.removeEventListener('mousedown', this);
    this._viewport.node.removeEventListener('mousemove', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    this.repaint(); // TODO actually need to fit the viewport ?
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    this._syncScrollState();
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
    let sw = this.totalColumnWidth;
    let sh = this.totalRowHeight;
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

    // If the visibility changes, immediately refit the grid.
    if (needVScroll !== hasVScroll || needHScroll !== hasHScroll) {
      this._vScrollBar.setHidden(!needVScroll);
      this._hScrollBar.setHidden(!needHScroll);
      this._scrollCorner.setHidden(!needVScroll || !needHScroll);
      MessageLoop.sendMessage(this, Widget.Msg.FitRequest);
    }

    // Update the scroll bar limits.
    this._vScrollBar.maximum = this.maxScrollY;
    this._vScrollBar.page = this.pageHeight;
    this._hScrollBar.maximum = this.maxScrollX;
    this._hScrollBar.page = this.pageWidth;

    // Re-clamp the scroll position.
    this.scrollTo(this._scrollX, this._scrollY);
  }

  /**
   * Sync the viewport to the given scroll position.
   *
   * #### Notes
   * This schedules a full repaint and syncs the scroll state.
   */
  private _syncViewport(): void {
    // Schedule a full repaint of the viewport.
    this.repaint();

    // Sync the scroll state after requesting the repaint.
    this._syncScrollState();
  }

  /**
   * Set the base size for the given section list.
   *
   * #### Notes
   * This will update the scroll bars and repaint as needed.
   */
  private _setBaseSize(list: SectionList, size: number): void {
    // Normalize the size.
    size = Math.max(0, Math.floor(size));

    // Bail early if the size does not change.
    if (list.baseSize === size) {
      return;
    }

    // Update the list base size.
    list.baseSize = size;

    // Sync the viewport
    this._syncViewport();
  }

  /**
   * Resize a section in the given section list.
   *
   * #### Notes
   * This will update the scroll bars and repaint as needed.
   */
  private _resizeSection(list: SectionList, index: number, size: number): void {
    // Bail early if the index is out of range.
    if (index < 0 || index >= list.sectionCount) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sectionSize(index);

    // Normalize the new size of the section.
    let newSize = Math.max(0, Math.floor(size));

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resizeSection(index, newSize);

    // Get the current size of the viewport.
    let vpWidth = this._viewportWidth;
    let vpHeight = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vpWidth === 0 || vpHeight === 0) {
      this._syncScrollState();
      return;
    }

    // If a paint is already pending, sync the viewport.
    if (this._paintPending) {
      this._syncViewport();
      return;
    }

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Paint the relevant dirty regions.
    switch (list) {
    case this._rowSections:
    {
      // Look up the column header height.
      let chh = this.totalColumnHeaderHeight;

      // Compute the viewport offset of the section.
      let offset = list.sectionOffset(index) + chh - this._scrollY;

      // Bail early if there is nothing to paint.
      if (chh >= vpHeight || offset > vpHeight) {
        break;
      }

      // Update the scroll position if the section is not visible.
      if (offset + oldSize <= chh) {
        this._scrollY += delta;
        break;
      }

      // Compute the paint origin of the section.
      let pos = Math.max(chh, offset);

      // Paint from the section onward if it spans the viewport.
      if (offset + oldSize >= vpHeight || offset + newSize >= vpHeight) {
        this._paint(0, pos, vpWidth, vpHeight - pos);
        break;
      }

      // Compute the X blit dimensions.
      let sx = 0;
      let sw = vpWidth;
      let dx = 0;

      // Compute the Y blit dimensions.
      let sy: number;
      let sh: number;
      let dy: number;
      if (offset + newSize <= chh) {
        sy = chh - delta;
        sh = vpHeight - sy;
        dy = chh;
      } else {
        sy = offset + oldSize;
        sh = vpHeight - sy;
        dy = sy + delta;
      }

      // Blit the valid content to the destination.
      this._canvasGC.drawImage(this._canvas, sx, sy, sw, sh, dx, dy, sw, sh);

      // Repaint the section if needed.
      if (newSize > 0 && offset + newSize > chh) {
        this._paint(0, pos, vpWidth, offset + newSize - pos);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paint(0, vpHeight + delta, vpWidth, -delta);
      }

      // Done.
      break;
    }
    case this._columnSections:
    {
      // Look up the row header width.
      let rhw = this.totalRowHeaderWidth;

      // Compute the viewport offset of the section.
      let offset = list.sectionOffset(index) + rhw - this._scrollX;

      // Bail early if there is nothing to paint.
      if (rhw >= vpWidth || offset > vpWidth) {
        break;
      }

      // Update the scroll position if the section is not visible.
      if (offset + oldSize <= rhw) {
        this._scrollX += delta;
        break;
      }

      // Compute the paint origin of the section.
      let pos = Math.max(rhw, offset);

      // Paint from the section onward if it spans the viewport.
      if (offset + oldSize >= vpWidth || offset + newSize >= vpWidth) {
        this._paint(pos, 0, vpWidth - pos, vpHeight);
        break;
      }

      // Compute the Y blit dimensions.
      let sy = 0;
      let sh = vpHeight;
      let dy = 0;

      // Compute the X blit dimensions.
      let sx: number;
      let sw: number;
      let dx: number;
      if (offset + newSize <= rhw) {
        sx = rhw - delta;
        sw = vpWidth - sx;
        dx = rhw;
      } else {
        sx = offset + oldSize;
        sw = vpWidth - sx;
        dx = sx + delta;
      }

      // Blit the valid content to the destination.
      this._canvasGC.drawImage(this._canvas, sx, sy, sw, sh, dx, dy, sw, sh);

      // Repaint the section if needed.
      if (newSize > 0 && offset + newSize > rhw) {
        this._paint(pos, 0, offset + newSize - pos, vpHeight);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paint(vpWidth + delta, 0, -delta, vpHeight);
      }

      // Done.
      break;
    }
    case this._rowHeaderSections:
    {
      // Look up the offset of the section.
      let offset = list.sectionOffset(index);

      // Bail early if the section is fully outside the viewport.
      if (offset >= vpWidth) {
        break;
      }

      // Paint the entire tail if the section spans the viewport.
      if (offset + oldSize >= vpWidth || offset + newSize >= vpWidth) {
        this._paint(offset, 0, vpWidth - offset, vpHeight);
        break;
      }

      // Compute the blit content dimensions.
      let sx = offset + oldSize;
      let sy = 0;
      let sw = vpWidth - sx;
      let sh = vpHeight;
      let dx = sx + delta;
      let dy = 0;

      // Blit the valid contents to the destination.
      this._canvasGC.drawImage(this._canvas, sx, sy, sw, sh, dx, dy, sw, sh);

      // Repaint the header section if needed.
      if (newSize > 0) {
        this._paint(offset, 0, newSize, vpHeight);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paint(vpWidth + delta, 0, -delta, vpHeight);
      }

      // Done
      break;
    }
    case this._columnHeaderSections:
    {
      // Look up the offset of the section.
      let offset = list.sectionOffset(index);

      // Bail early if the section is fully outside the viewport.
      if (offset >= vpHeight) {
        break;
      }

      // Paint the entire tail if the section spans the viewport.
      if (offset + oldSize >= vpHeight || offset + newSize >= vpHeight) {
        this._paint(0, offset, vpWidth, vpHeight - offset);
        break;
      }

      // Compute the blit content dimensions.
      let sx = 0;
      let sy = offset + oldSize;
      let sw = vpWidth;
      let sh = vpHeight - sy;
      let dx = 0;
      let dy = sy + delta;

      // Blit the valid contents to the destination.
      this._canvasGC.drawImage(this._canvas, sx, sy, sw, sh, dx, dy, sw, sh);

      // Repaint the header section if needed.
      if (newSize > 0) {
        this._paint(0, offset, vpWidth, newSize);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paint(0, vpHeight + delta, vpWidth, -delta);
      }

      // Done
      break;
    }
    default:
      throw 'unreachable';
    }

    // Sync the scroll state after painting.
    this._syncScrollState();
  }

  /**
   * Hit test the grid headers for a resize handle.
   */
  private _hitTestResizeHandles(clientX: number, clientY: number): Private.IResizeHandle | null {
    // Look up the header dimensions.
    let rhw = this.totalRowHeaderWidth;
    let chh = this.totalColumnHeaderHeight;

    // Convert the mouse position into local coordinates.
    let rect = this._viewport.node.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // Bail early if the mouse is not over a grid header.
    if (x >= rhw && y >= chh) {
      return null;
    }

    // Test for a match in the corner header first.
    if (x <= rhw + 2 && y <= chh + 2) {
      // Set up the resize index data.
      let data: { index: number, delta: number } | null = null;

      // Check for a column match if applicable.
      if (y <= chh) {
        data = Private.findResizeIndex(this._rowHeaderSections, x);
      }

      // Return the column match if found.
      if (data) {
        return { type: 'header-column', index: data.index, delta: data.delta };
      }

      // Check for a row match if applicable.
      if (x <= rhw) {
        data = Private.findResizeIndex(this._columnHeaderSections, y);
      }

      // Return the row match if found.
      if (data) {
        return { type: 'header-row', index: data.index, delta: data.delta };
      }

      // Otherwise, there was no match.
      return null;
    }

    // Test for a match in the column header second.
    if (y <= chh) {
      // Convert the position into unscrolled coordinates.
      let pos = x + this._scrollX - rhw;

      // Check for a match.
      let data = Private.findResizeIndex(this._columnSections, pos);

      // Return the column match if found.
      if (data) {
        return { type: 'body-column', index: data.index, delta: data.delta };
      }

      // Otherwise, there was no match.
      return null;
    }

    // Test for a match in the row header last.
    if (x <= rhw) {
      // Convert the position into unscrolled coordinates.
      let pos = y + this._scrollY - chh;

      // Check for a match.
      let data = Private.findResizeIndex(this._rowSections, pos);

      // Return the row match if found.
      if (data) {
        return { type: 'body-row', index: data.index, delta: data.delta };
      }

      // Otherwise, there was no match.
      return null;
    }

    // Otherwise, there was no match.
    return null;
  }

  /**
   * Handle the `'keydown'` event for the data grid.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Stop input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) {
      this._releaseMouse();
    }
  }

  /**
   * Handle the `'mousedown'` event for the data grid.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if the left mouse button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Extract the client position.
    let { clientX, clientY } = event;

    // Hit test the grid headers for a resize handle.
    let handle = this._hitTestResizeHandles(clientX, clientY);

    // Bail early if no resize handle is pressed.
    if (!handle) {
      return;
    }

    // Stop the event when a resize handle is pressed.
    event.preventDefault();
    event.stopPropagation();

    // Look up the cursor for the handle.
    let cursor = Private.cursorForHandle(handle);

    // Override the document cursor.
    let override = Drag.overrideCursor(cursor);

    // Set up the press data.
    this._pressData = { handle, clientX, clientY, override };

    // Add the extra document listeners.
    document.addEventListener('mousemove', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('keydown', this, true);
    document.addEventListener('contextmenu', this, true);
  }

  /**
   * Handle the `mousemove` event for the data grid.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // If a drag is not in progress, the event is for the viewport.
    if (!this._pressData) {
      // Hit test the grid headers for a resize handle.
      let handle = this._hitTestResizeHandles(event.clientX, event.clientY);

      // Update the viewport cursor.
      this._viewport.node.style.cursor = Private.cursorForHandle(handle);

      // Done.
      return;
    }

    // Otherwise, the event is for the drag in progress.

    // Stop the event.
    event.preventDefault();
    event.stopPropagation();

    // Update the press data with the current mouse position.
    this._pressData.clientX = event.clientX;
    this._pressData.clientY = event.clientY;

    // Post a section resize request message to the viewport.
    MessageLoop.postMessage(this._viewport, Private.SectionResizeRequest);
  }

  /**
   * Handle the `mouseup` event for the data grid.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Do nothing if the left mouse button is not released.
    if (event.button !== 0) {
      return;
    }

    // Stop the event when releasing the mouse.
    event.preventDefault();
    event.stopPropagation();

    // Finalize the mouse release.
    this._releaseMouse();
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // Do nothing if a drag is in progress.
    if (this._pressData) {
      return;
    }

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
   * Release the mouse grab for the data grid.
   */
  private _releaseMouse(): void {
    // Bail early if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Clear the press data and cursor override.
    this._pressData.override.dispose();
    this._pressData = null;

    // Remove the extra document listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Process a message sent to the viewport
   */
  private _processViewportMessage(msg: Message): void {
    switch (msg.type) {
    case 'scroll-request':
      this._onViewportScrollRequest(msg);
      break;
    case 'section-resize-request':
      this._onViewportSectionResizeRequest(msg);
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
    this.scrollTo(this._hScrollBar.value, this._vScrollBar.value);
  }

  /**
   * A message hook invoked on a `'section-resize-request'` message.
   */
  private _onViewportSectionResizeRequest(msg: Message): void {
    // Bail early if a drag is not in progress.
    if (!this._pressData) {
      return;
    }

    // Extract the relevant press data.
    let { handle, clientX, clientY } = this._pressData;

    // Convert the client position to viewport coordinates.
    let rect = this._viewport.node.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // Look up the section list and convert to section position.
    let pos: number;
    let list: SectionList;
    switch (handle.type) {
    case 'body-row':
      pos = y + this._scrollY - this.totalColumnHeaderHeight;
      list = this._rowSections;
      break;
    case 'body-column':
      pos = x + this._scrollX - this.totalRowHeaderWidth;
      list = this._columnSections;
      break;
    case 'header-row':
      pos = y;
      list = this._columnHeaderSections;
      break;
    case 'header-column':
      pos = x;
      list = this._rowHeaderSections;
      break;
    default:
      throw 'unreachable';
    }

    // Look up the offset for the handle.
    let offset = list.sectionOffset(handle.index);

    // Bail if the handle no longer exists.
    if (offset < 0) {
      return;
    }

    // Compute the new size for the section.
    let size = Math.max(4, pos - handle.delta - offset);

    // Resize the section to the computed size.
    this._resizeSection(list, handle.index, size);
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

    // Compute the sizes of the dirty regions.
    let right = width - oldWidth;
    let bottom = height - oldHeight;

    // Bail if nothing needs to be painted.
    if (right <= 0 && bottom <= 0) {
      return;
    }

    // If there is a paint pending, ensure it paints everything.
    if (this._paintPending) {
      this.repaint();
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
    if (isRemove && (index < 0 || index >= list.sectionCount)) {
      return;
    }

    // Compute the paint offset and handle region-specific behavior.
    let offset: number;
    if (region !== 'body') {
      // Compute the paint offset.
      if (index >= list.sectionCount) {
        offset = list.totalSize;
      } else {
        offset = list.sectionOffset(index);
      }

      // Remove or insert the sections as needed.
      if (isRemove) {
        list.removeSections(index, span);
      } else {
        list.insertSections(index, span);
      }
    } else {
      // Look up the initial scroll geometry.
      let scrollPos1: number;
      let maxScrollPos1: number;
      if (isRows) {
        scrollPos1 = this._scrollY;
        maxScrollPos1 = this.maxScrollY;
      } else {
        scrollPos1 = this._scrollX;
        maxScrollPos1 = this.maxScrollX;
      }

      // Look up the target position.
      let targetPos: number;
      if (index >= list.sectionCount) {
        targetPos = list.totalSize;
      } else {
        targetPos = list.sectionOffset(index);
      }

      // Remove or Insert the sections and save the pre- and post- size.
      let size1 = list.totalSize;
      if (isRemove) {
        list.removeSections(index, span);
      } else {
        list.insertSections(index, span);
      }
      let size2 = list.totalSize;

      // Fetch the new max scroll position.
      let maxScrollPos2: number;
      if (isRows) {
        maxScrollPos2 = this.maxScrollY;
      } else {
        maxScrollPos2 = this.maxScrollX;
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
        offset = this.totalColumnHeaderHeight;
      } else {
        this._scrollX = scrollPos2;
        offset = this.totalRowHeaderWidth;
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
      this.repaint(x, y, w, h);
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
    if (index < 0 || index >= list.sectionCount) {
      return;
    }

    // Clamp the move span to the limit.
    span = Math.min(span, list.sectionCount - index);

    // Clamp the destination index to the limit.
    destination = Math.min(Math.max(0, destination), list.sectionCount - span);

    // Bail early if there is no effective move.
    if (index === destination) {
      return;
    }

    // Compute the first affected index.
    let i1 = Math.min(index, destination);

    // Compute the last affected index.
    let i2 = Math.max(index + span - 1, destination + span - 1);

    // Compute the first paint boundary.
    let p1 = list.sectionOffset(i1);

    // Compute the last paint boundary.
    let p2: number;
    if (i2 >= list.sectionCount - 1) {
      p2 = list.totalSize - 1;
    } else {
      p2 = list.sectionOffset(i2 + 1) - 1;
    }

    // Move the sections in the list.
    list.moveSections(index, span, destination);

    // Fetch the row header and column header sizes.
    let rhw = this.totalRowHeaderWidth;
    let chh = this.totalColumnHeaderHeight;

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
        yMin = chh;
        y1 = chh + p1 - this._scrollY;
        y2 = chh + p2 - this._scrollY;
      } else {
        xMin = rhw;
        x1 = rhw + p1 - this._scrollX;
        x2 = rhw + p2 - this._scrollX;
      }
      break;
    case 'row-header':
      xMax = Math.min(rhw - 1, xMax);
      x1 = p1;
      x2 = p2;
      break;
    case 'column-header':
      yMax = Math.min(chh - 1, yMax);
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
      this.repaint(x, y, w, h);
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
    if (rowIndex >= rList.sectionCount || columnIndex >= cList.sectionCount) {
      return;
    }

    // Look up the unscrolled top-left corner of the range.
    let x1 = cList.sectionOffset(columnIndex);
    let y1 = rList.sectionOffset(rowIndex);

    // Look up the unscrolled bottom-right corner of the range.
    let x2: number;
    let y2: number;
    if (columnIndex + columnSpan >= cList.sectionCount) {
      x2 = cList.totalSize - 1;
    } else {
      x2 = cList.sectionOffset(columnIndex + columnSpan) - 1;
    }
    if (rowIndex + rowSpan >= rList.sectionCount) {
      y2 = rList.totalSize - 1;
    } else {
      y2 = rList.sectionOffset(rowIndex + rowSpan) - 1;
    }

    // Fetch the row header and column header sizes.
    let rhw = this.totalRowHeaderWidth;
    let chh = this.totalColumnHeaderHeight;

    // Set up the initial paint limits.
    let xMin = 0;
    let yMin = 0;
    let xMax = this._viewportWidth - 1;
    let yMax = this._viewportHeight - 1;

    // Adjust the limits and paint region.
    switch (region) {
    case 'body':
      xMin = rhw;
      yMin = chh;
      x1 += rhw - this._scrollX;
      x2 += rhw - this._scrollX;
      y1 += chh - this._scrollY;
      y2 += chh - this._scrollY;
      break;
    case 'row-header':
      yMin = chh;
      xMax = Math.min(rhw - 1, xMax);
      y1 += chh - this._scrollY;
      y2 += chh - this._scrollY;
      break;
    case 'column-header':
      xMin = rhw;
      yMax = Math.min(chh - 1, yMax);
      x1 += rhw - this._scrollX;
      x2 += rhw - this._scrollX;
      break;
    case 'corner-header':
      xMax = Math.min(rhw - 1, xMax);
      yMax = Math.min(chh - 1, yMax);
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
      this.repaint(x, y, w, h);
    }
  }

  /**
   * Handle a full data model reset.
   */
  private _onModelReset(args: DataModel.IModelResetArgs): void {
    // Look up the various current section counts.
    let nr = this._rowSections.sectionCount;
    let nc = this._columnSections.sectionCount;
    let nrh = this._rowHeaderSections.sectionCount;
    let nch = this._columnHeaderSections.sectionCount;

    // Compute the delta count for each region.
    let dr = this._model!.rowCount('body') - nr;
    let dc = this._model!.columnCount('body') - nc;
    let drh = this._model!.columnCount('row-header') - nrh;
    let dch = this._model!.rowCount('column-header') - nch;

    // Update the row sections, if needed.
    if (dr > 0) {
      this._rowSections.insertSections(nr, dr);
    } else if (dr < 0) {
      this._rowSections.removeSections(nr + dr, -dr);
    }

    // Update the column sections, if needed.
    if (dc > 0) {
      this._columnSections.insertSections(nc, dc);
    } else if (dc < 0) {
      this._columnSections.removeSections(nc + dc, -dc);
    }

    // Update the row header sections, if needed.
    if (drh > 0) {
      this._rowHeaderSections.insertSections(nrh, drh);
    } else if (drh < 0) {
      this._rowHeaderSections.removeSections(nrh + drh, -drh);
    }

    // Update the column header sections, if needed.
    if (dch > 0) {
      this._columnHeaderSections.insertSections(nch, dch);
    } else if (dch < 0) {
      this._columnHeaderSections.removeSections(nch + dch, -dch);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * A signal handler for the renderer map `changed` signal.
   */
  private _onRenderersChanged(): void {
    this.repaint();
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
    let contentX = this.totalRowHeaderWidth;
    let contentY = this.totalColumnHeaderHeight;

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
    let r1 = this._rowSections.sectionIndex(y1 - contentY + this._scrollY);
    let c1 = this._columnSections.sectionIndex(x1 - contentX + this._scrollX);
    let r2 = this._rowSections.sectionIndex(y2 - contentY + this._scrollY);
    let c2 = this._columnSections.sectionIndex(x2 - contentX + this._scrollX);

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

    // Set up the paint region size variables.
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
    let contentW = this.totalRowHeaderWidth;
    let contentH = this._rowSections.totalSize - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = this.totalColumnHeaderHeight;

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
    let r1 = this._rowSections.sectionIndex(y1 - contentY + this._scrollY);
    let c1 = this._rowHeaderSections.sectionIndex(x1);
    let r2 = this._rowSections.sectionIndex(y2 - contentY + this._scrollY);
    let c2 = this._rowHeaderSections.sectionIndex(x2);

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

    // Set up the paint region size variables.
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
    let contentW = this._columnSections.totalSize - this._scrollX;
    let contentH = this.totalColumnHeaderHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this.totalRowHeaderWidth;
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
    let r1 = this._columnHeaderSections.sectionIndex(y1);
    let c1 = this._columnSections.sectionIndex(x1 - contentX + this._scrollX);
    let r2 = this._columnHeaderSections.sectionIndex(y2);
    let c2 = this._columnSections.sectionIndex(x2 - contentX + this._scrollX);

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

    // Set up the paint region size variables.
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
    let contentW = this.totalRowHeaderWidth;
    let contentH = this.totalColumnHeaderHeight;

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
    let r1 = this._columnHeaderSections.sectionIndex(y1);
    let c1 = this._rowHeaderSections.sectionIndex(x1);
    let r2 = this._columnHeaderSections.sectionIndex(y2);
    let c2 = this._rowHeaderSections.sectionIndex(x2);

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

    // Set up the paint region size variables.
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
      let renderer = this._cellRenderers.get(rgn.region, metadata);

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
  private _pressData: Private.IPressData | null = null;

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

  private _style: DataGrid.IStyle;
  private _cellRenderers: RendererMap;
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
     * The base height for rows in the data grid.
     *
     * The default is `20`.
     */
    baseRowHeight?: number;

    /**
     * The base width for columns in the data grid.
     *
     * The default is `64`.
     */
    baseColumnWidth?: number;

    /**
     * The base width for row headers in the data grid.
     *
     * The default is `64`.
     */
    baseRowHeaderWidth?: number;

    /**
     * The base height for column headers in the data grid.
     *
     * The default is `20`.
     */
    baseColumnHeaderHeight?: number;

    /**
     * The cell renderer map for the data grid.
     *
     * The default is a new renderer map with a default `TextRenderer`.
     */
    cellRenderers?: RendererMap;
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
    headerGridLineColor: 'rgba(20, 20, 20, 0.25)'
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
   * A singleton `section-resize-request` conflatable message.
   */
  export
  const SectionResizeRequest = new ConflatableMessage('section-resize-request');

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
   * An object which represents a virtual resize handle.
   */
  export
  interface IResizeHandle {
    /**
     * The type of the resize handle.
     */
    type: 'body-row' | 'body-column' | 'header-row' | 'header-column';

    /**
     * The index of the handle in the region.
     */
    index: number;

    /**
     * The delta between the queried position and handle position.
     */
    delta: number;
  }

  /**
   * An object which stores the mouse press data.
   */
  export
  interface IPressData {
    /**
     * The resize handle which was pressed.
     */
    handle: IResizeHandle;

    /**
     * The most recent client X position of the mouse.
     */
    clientX: number;

    /**
     * The most recent client Y position of the mouse.
     */
    clientY: number;

    /**
     * The disposable which will clear the override cursor.
     */
    override: IDisposable;
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

  /**
   * Find the index of the resize handle at the given position.
   *
   * This accounts for `3px` of space on either side of a grid line,
   * for a total of `7px` handle width.
   *
   * Returns the `{ index, delta }` match or `null`.
   */
  export
  function findResizeIndex(list: SectionList, pos: number): { index: number, delta: number } | null {
    // Bail early if the list is empty or the position is invalid.
    if (list.sectionCount === 0 || pos < 0) {
      return null;
    }

    // Compute the delta from the end of the list.
    let d1 = pos - (list.totalSize - 1);

    // Bail if the position is out of range.
    if (d1 > 3) {
      return null;
    }

    // Test whether the hover is just past the last section.
    if (d1 >= 0) {
      return { index: list.sectionCount - 1, delta: d1 };
    }

    // Find the section at the given position.
    let i = list.sectionIndex(pos);

    // Look up the offset for the section.
    let offset = list.sectionOffset(i);

    // Compute the delta to the previous border.
    let d2 = pos - (offset - 1);

    // Test whether the position hovers the previous border.
    if (i > 0 && d2 <= 3) {
      return { index: i - 1, delta: d2 };
    }

    // Look up the size of the section.
    let size = list.sectionSize(i);

    // Compute the delta to the next border.
    let d3 = (size + offset - 1) - pos;

    // Test whether the position hovers the section border.
    if (d3 <= 3) {
      return { index: i, delta: -d3 };
    }

    // Otherwise, no resize border is hovered.
    return null;
  }

  /**
   * Get the cursor to use for a resize handle.
   */
  export
  function cursorForHandle(handle: IResizeHandle | null): string {
    return handle ? cursorMap[handle.type] : '';
  }

  /**
   * A mapping of resize handle types to cursor values.
   */
  const cursorMap = {
    'body-row': 'ns-resize',
    'body-column': 'ew-resize',
    'header-row': 'ns-resize',
    'header-column': 'ew-resize'
  };
}
