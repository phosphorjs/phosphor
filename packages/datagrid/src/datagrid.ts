/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  toArray
} from '@phosphor/algorithm';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ClipboardExt, ElementExt, Platform
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
  SelectionModel
} from './selectionmodel';

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
    this._expansionMode = options.expansionMode || 'none';
    this._headerVisibility = options.headerVisibility || 'all';
    this._cellRenderers = options.cellRenderers || new RendererMap();
    this._copyConfig = options.copyConfig || DataGrid.defaultCopyConfig;
    this._defaultRenderer = options.defaultRenderer || new TextRenderer();

    // Connect to the renderer map changed signal.
    this._cellRenderers.changed.connect(this._onRenderersChanged, this);

    // Parse the default sizes.
    let defaultSizes = options.defaultSizes || DataGrid.defaultSizes;
    let rh = Private.clampSectionSize(defaultSizes.rowHeight);
    let cw = Private.clampSectionSize(defaultSizes.columnWidth);
    let rhw = Private.clampSectionSize(defaultSizes.rowHeaderWidth);
    let chh = Private.clampSectionSize(defaultSizes.columnHeaderHeight);

    // Set up the sections lists.
    this._rowSections = new SectionList({ defaultSize: rh });
    this._columnSections = new SectionList({ defaultSize: cw });
    this._rowHeaderSections = new SectionList({ defaultSize: rhw });
    this._columnHeaderSections = new SectionList({ defaultSize: chh });

    // Create the canvas, buffer, and overlay objects.
    this._canvas = Private.createCanvas();
    this._buffer = Private.createCanvas();
    this._overlay = Private.createCanvas();

    // Get the graphics contexts for the canvases.
    this._canvasGC = this._canvas.getContext('2d')!;
    this._bufferGC = this._buffer.getContext('2d')!;
    this._overlayGC = this._overlay.getContext('2d')!;

    // Set up the on-screen canvas.
    this._canvas.style.position = 'absolute';
    this._canvas.style.top = '0px';
    this._canvas.style.left = '0px';
    this._canvas.style.width = '0px';
    this._canvas.style.height = '0px';

    // Set up the on-screen overlay.
    this._overlay.style.position = 'absolute';
    this._overlay.style.top = '0px';
    this._overlay.style.left = '0px';
    this._overlay.style.width = '0px';
    this._overlay.style.height = '0px';

    // Create the internal widgets for the data grid.
    this._viewport = new Widget();
    this._viewport.node.tabIndex = -1;
    this._viewport.node.style.outline = 'none';
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

    // Add the on-screen overlay to the viewport node.
    this._viewport.node.appendChild(this._overlay);

    // Install the message hooks.
    MessageLoop.installMessageHook(this._viewport, this);
    MessageLoop.installMessageHook(this._hScrollBar, this);
    MessageLoop.installMessageHook(this._vScrollBar, this);

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
    // Release the mouse.
    this._releaseMouse();

    // Dispose of the handlers.
    if (this._keyHandler) {
      this._keyHandler.dispose();
    }
    if (this._mouseHandler) {
      this._mouseHandler.dispose();
    }
    this._keyHandler = null;
    this._mouseHandler = null;

    // Clear the models.
    this._dataModel = null;
    this._selectionModel = null;

    // Clear the section lists.
    this._rowSections.clear();
    this._columnSections.clear();
    this._rowHeaderSections.clear();
    this._columnHeaderSections.clear();

    // Dispose of the base class.
    super.dispose();
  }

  /**
   * Get the data model for the data grid.
   */
  get dataModel(): DataModel | null {
    return this._dataModel;
  }

  /**
   * Set the data model for the data grid.
   *
   * #### Notes
   * This will automatically remove the current selection model.
   */
  set dataModel(value: DataModel | null) {
    // Do nothing if the model does not change.
    if (this._dataModel === value) {
      return;
    }

    // Release the mouse.
    this._releaseMouse();

    // Clear the selection model.
    this.selectionModel = null;

    // Disconnect the change handler from the old model.
    if (this._dataModel) {
      this._dataModel.changed.disconnect(this._onDataModelChanged, this);
    }

    // Connect the change handler for the new model.
    if (value) {
      value.changed.connect(this._onDataModelChanged, this);
    }

    // Update the internal model reference.
    this._dataModel = value;

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
   * Get the selection model for the data grid.
   */
  get selectionModel(): SelectionModel | null {
    return this._selectionModel;
  }

  /**
   * Set the selection model for the data grid.
   */
  set selectionModel(value: SelectionModel | null) {
    // Do nothing if the selection model does not change.
    if (this._selectionModel === value) {
      return;
    }

    // Release the mouse.
    this._releaseMouse();

    // Ensure the data models are a match.
    if (value && value.dataModel !== this._dataModel) {
      throw new Error('SelectionModel.dataModel !== DataGrid.dataModel');
    }

    // Disconnect the change handler from the old model.
    if (this._selectionModel) {
      this._selectionModel.changed.disconnect(this._onSelectionsChanged, this);
    }

    // Connect the change handler for the new model.
    if (value) {
      value.changed.connect(this._onSelectionsChanged, this);
    }

    // Update the internal selection model reference.
    this._selectionModel = value;

    // Schedule a repaint of the overlay.
    this._repaintOverlay();
  }

  /**
   * Get the key handler for the data grid.
   */
  get keyHandler(): DataGrid.IKeyHandler | null {
    return this._keyHandler;
  }

  /**
   * Set the key handler for the data grid.
   */
  set keyHandler(value: DataGrid.IKeyHandler | null) {
    this._keyHandler = value;
  }

  /**
   * Get the mouse handler for the data grid.
   */
  get mouseHandler(): DataGrid.IMouseHandler | null {
    return this._mouseHandler;
  }

  /**
   * Set the mouse handler for the data grid.
   */
  set mouseHandler(value: DataGrid.IMouseHandler | null) {
    // Bail early if the mouse handler does not change.
    if (this._mouseHandler === value) {
      return;
    }

    // Release the mouse.
    this._releaseMouse();

    // Update the internal mouse handler.
    this._mouseHandler = value;
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

    // Schedule a repaint of the content.
    this._repaintContent();

    // Schedule a repaint of the overlay.
    this._repaintOverlay();
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

    // Schedule a repaint of the grid content.
    this._repaintContent();
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

    // Schedule a repaint of the grid content.
    this._repaintContent();
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
  get defaultSizes(): DataGrid.DefaultSizes {
    let rowHeight = this._rowSections.defaultSize;
    let columnWidth = this._columnSections.defaultSize;
    let rowHeaderWidth = this._rowHeaderSections.defaultSize;
    let columnHeaderHeight = this._columnHeaderSections.defaultSize;
    return { rowHeight, columnWidth, rowHeaderWidth, columnHeaderHeight };
  }

  /**
   * Set the default sizes for the various sections of the data grid.
   */
  set defaultSizes(value: DataGrid.DefaultSizes) {
    // Clamp the sizes.
    let rh = Private.clampSectionSize(value.rowHeight);
    let cw = Private.clampSectionSize(value.columnWidth);
    let rhw = Private.clampSectionSize(value.rowHeaderWidth);
    let chh = Private.clampSectionSize(value.columnHeaderHeight);

    // Update the section default sizes.
    this._rowSections.defaultSize = rh;
    this._columnSections.defaultSize = cw;
    this._rowHeaderSections.defaultSize = rhw;
    this._columnHeaderSections.defaultSize = chh;

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the copy configuration for the data grid.
   */
  get copyConfig(): DataGrid.CopyConfig {
    return this._copyConfig;
  }

  /**
   * Set the copy configuration for the data grid.
   */
  set copyConfig(value: DataGrid.CopyConfig) {
    this._copyConfig = value;
  }

  /**
   * Get the expansion mode for the data grid.
   */
  get expansionMode(): DataGrid.ExpansionMode {
    return this._expansionMode;
  }

  /**
   * Set the expansion mode for the data grid.
   */
  set expansionMode(value: DataGrid.ExpansionMode) {
    // Bail early if the expansion mode does not change.
    if (value === this._expansionMode) {
      return;
    }

    // Update the internal mode.
    this._expansionMode = value;

    // Sync the viewport
    this._syncViewport();
  }

  /**
   * The virtual width of the row headers.
   */
  get headerWidth(): number {
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
   */
  get headerHeight(): number {
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
   *
   * #### Notes
   * This does *not* account for an expanded last column.
   */
  get bodyWidth(): number {
    return this._columnSections.length;
  }

  /**
   * The virtual height of the grid body.
   *
   * #### Notes
   * This does *not* account for an expanded last row.
   */
  get bodyHeight(): number {
    return this._rowSections.length;
  }

  /**
   * The virtual width of the entire grid.
   *
   * #### Notes
   * This does *not* account for an expanded last column.
   */
  get totalWidth(): number {
    return this.headerWidth + this.bodyWidth;
  }

  /**
   * The virtual height of the entire grid.
   *
   * #### Notes
   * This does *not* account for an expanded last row.
   */
  get totalHeight(): number {
    return this.headerHeight + this.bodyHeight;
  }

  /**
   * The actual width of the viewport.
   */
  get viewportWidth(): number {
    return this._viewportWidth;
  }

  /**
   * The actual height of the viewport.
   */
  get viewportHeight(): number {
    return this._viewportHeight;
  }

  /**
   * The width of the visible portion of the grid body.
   */
  get pageWidth(): number {
    return Math.max(0, this.viewportWidth - this.headerWidth);
  }

  /**
   * The height of the visible portion of the grid body.
   */
  get pageHeight(): number {
    return Math.max(0, this.viewportHeight - this.headerHeight);
  }

  /**
   * The current scroll X position of the viewport.
   */
  get scrollX(): number {
    return this._hScrollBar.value;
  }

  /**
   * The current scroll Y position of the viewport.
   */
  get scrollY(): number {
    return this._vScrollBar.value;
  }

  /**
   * The maximum scroll X position for the grid.
   */
  get maxScrollX(): number {
    return Math.max(0, this.bodyWidth - this.pageWidth - 1);
  }

  /**
   * The maximum scroll Y position for the grid.
   */
  get maxScrollY(): number {
    return Math.max(0, this.bodyHeight - this.pageHeight - 1);
  }

  /**
   * The viewport widget for the data grid.
   */
  get viewport(): Widget {
    return this._viewport;
  }

  /**
   * Scroll the grid to the specified row.
   *
   * @param row - The row index of the cell.
   *
   * #### Notes
   * This is a no-op if the row is already visible.
   */
  scrollToRow(row: number): void {
    // Fetch the row count.
    let nr = this._rowSections.count;

    // Bail early if there is no content.
    if (nr === 0) {
      return;
    }

    // Floor the row index.
    row = Math.floor(row);

    // Clamp the row index.
    row = Math.max(0, Math.min(row, nr - 1));

    // Get the virtual bounds of the row.
    let y1 = this._rowSections.offsetOf(row);
    let y2 = this._rowSections.extentOf(row);

    // Get the virtual bounds of the viewport.
    let vy1 = this._scrollY;
    let vy2 = this._scrollY + this.pageHeight - 1;

    // Set up the delta variables.
    let dy = 0;

    // Compute the delta Y scroll.
    if (y1 < vy1) {
      dy = y1 - vy1 - 10;
    } else if (y2 > vy2) {
      dy = y2 - vy2 + 10;
    }

    // Bail early if no scroll is needed.
    if (dy === 0) {
      return;
    }

    // Scroll by the computed delta.
    this.scrollBy(0, dy);
  }

  /**
   * Scroll the grid to the specified column.
   *
   * @param column - The column index of the cell.
   *
   * #### Notes
   * This is a no-op if the column is already visible.
   */
  scrollToColumn(column: number): void {
    // Fetch the column count.
    let nc = this._columnSections.count;

    // Bail early if there is no content.
    if (nc === 0) {
      return;
    }

    // Floor the column index.
    column = Math.floor(column);

    // Clamp the column index.
    column = Math.max(0, Math.min(column, nc - 1));

    // Get the virtual bounds of the column.
    let x1 = this._columnSections.offsetOf(column);
    let x2 = this._columnSections.extentOf(column);

    // Get the virtual bounds of the viewport.
    let vx1 = this._scrollX;
    let vx2 = this._scrollX + this.pageWidth - 1;

    // Set up the delta variables.
    let dx = 0;

    // Compute the delta X scroll.
    if (x1 < vx1) {
      dx = x1 - vx1 - 10;
    } else if (x2 > vx2) {
      dx = x2 - vx2 + 10;
    }

    // Bail early if no scroll is needed.
    if (dx === 0) {
      return;
    }

    // Scroll by the computed delta.
    this.scrollBy(dx, 0);
  }

  /**
   * Scroll the grid to the specified cell.
   *
   * @param row - The row index of the cell.
   *
   * @param column - The column index of the cell.
   *
   * #### Notes
   * This is a no-op if the cell is already visible.
   */
  scrollToCell(row: number, column: number): void {
    // Fetch the row and column count.
    let nr = this._rowSections.count;
    let nc = this._columnSections.count;

    // Bail early if there is no content.
    if (nr === 0 || nc === 0) {
      return;
    }

    // Floor the cell index.
    row = Math.floor(row);
    column = Math.floor(column);

    // Clamp the cell index.
    row = Math.max(0, Math.min(row, nr - 1));
    column = Math.max(0, Math.min(column, nc - 1));

    // Get the virtual bounds of the cell.
    let x1 = this._columnSections.offsetOf(column);
    let x2 = this._columnSections.extentOf(column);
    let y1 = this._rowSections.offsetOf(row);
    let y2 = this._rowSections.extentOf(row);

    // Get the virtual bounds of the viewport.
    let vx1 = this._scrollX;
    let vx2 = this._scrollX + this.pageWidth - 1;
    let vy1 = this._scrollY;
    let vy2 = this._scrollY + this.pageHeight - 1;

    // Set up the delta variables.
    let dx = 0;
    let dy = 0;

    // Compute the delta X scroll.
    if (x1 < vx1) {
      dx = x1 - vx1 - 10;
    } else if (x2 > vx2) {
      dx = x2 - vx2 + 10;
    }

    // Compute the delta Y scroll.
    if (y1 < vy1) {
      dy = y1 - vy1 - 10;
    } else if (y2 > vy2) {
      dy = y2 - vy2 + 10;
    }

    // Bail early if no scroll is needed.
    if (dx === 0 && dy === 0) {
      return;
    }

    // Scroll by the computed delta.
    this.scrollBy(dx, dy);
  }

  /**
   * Scroll the grid to the current cursor position.
   *
   * #### Notes
   * This is a no-op if the cursor is already visible or
   * if there is no selection model installed on the grid.
   */
  scrollToCursor(): void {
    // Bail early if there is no selection model.
    if (!this._selectionModel) {
      return;
    }

    // Fetch the cursor row and column.
    let row = this._selectionModel.cursorRow;
    let column = this._selectionModel.cursorColumn;

    // Scroll to the cursor cell.
    this.scrollToCell(row, column);
  }

  /**
   * Scroll the viewport by the specified amount.
   *
   * @param dx - The X scroll amount.
   *
   * @param dy - The Y scroll amount.
   */
  scrollBy(dx: number, dy: number): void {
    this.scrollTo(this.scrollX + dx, this.scrollY + dy);
  }

  /**
   * Scroll the viewport by one page.
   *
   * @param dir - The desired direction of the scroll.
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
    this.scrollTo(this.scrollX + dx, this.scrollY + dy);
  }

  /**
   * Scroll the viewport by one cell-aligned step.
   *
   * @param dir - The desired direction of the scroll.
   */
  scrollByStep(dir: 'up' | 'down' | 'left' | 'right'): void {
    let r: number;
    let c: number;
    let x = this.scrollX;
    let y = this.scrollY;
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
    this.scrollTo(x, y);
  }

  /**
   * Scroll to the specified offset position.
   *
   * @param x - The desired X position.
   *
   * @param y - The desired Y position.
   */
  scrollTo(x: number, y: number): void {
    // Floor and clamp the position to the allowable range.
    x = Math.max(0, Math.min(Math.floor(x), this.maxScrollX));
    y = Math.max(0, Math.min(Math.floor(y), this.maxScrollY));

    // Update the scroll bar values with the desired position.
    this._hScrollBar.value = x;
    this._vScrollBar.value = y;

    // Post a scroll request message to the viewport.
    MessageLoop.postMessage(this._viewport, Private.ScrollRequest);
  }

  /**
   * Get the row count for a particular region in the data grid.
   *
   * @param region - The row region of interest.
   *
   * @returns The row count for the specified region.
   */
  rowCount(region: DataModel.RowRegion): number {
    let count: number;
    if (region === 'body') {
      count = this._rowSections.count;
    } else {
      count = this._columnHeaderSections.count;
    }
    return count;
  }

  /**
   * Get the column count for a particular region in the data grid.
   *
   * @param region - The column region of interest.
   *
   * @returns The column count for the specified region.
   */
  columnCount(region: DataModel.RowRegion): number {
    let count: number;
    if (region === 'body') {
      count = this._columnSections.count;
    } else {
      count = this._rowHeaderSections.count;
    }
    return count;
  }

  /**
   * Get the row at a virtual offset in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param offset - The virtual offset of the row of interest.
   *
   * @returns The index of the row, or `-1` if the offset is out of range.
   *
   * #### Notes
   * This method accounts for an expanded last row.
   */
  rowAt(region: DataModel.RowRegion, offset: number): number {
    // Bail early if the offset is negative.
    if (offset < 0) {
      return -1;
    }

    // Return early for the column header region.
    if (region === 'column-header') {
      return this._columnHeaderSections.indexOf(offset);
    }

    // Fetch the index.
    let index = this._rowSections.indexOf(offset);

    // Return early if the section is found.
    if (index >= 0) {
      return index;
    }

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';

    // Return the last row if the offset is in the expanded range.
    if (elr && ph > bh && offset < (this._rowSections.length + ph - bh)) {
      return this._rowSections.count - 1;
    }

    // Otherwise, the offset is out of range.
    return -1;
  }

  /**
   * Get the column at a virtual offset in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param offset - The virtual offset of the column of interest.
   *
   * @returns The index of the column, or `-1` if the offset is out of range.
   *
   * #### Notes
   * This method accounts for an expanded last column.
   */
  columnAt(region: DataModel.ColumnRegion, offset: number): number {
    if (offset < 0) {
      return -1;
    }

    // Return early for the row header region.
    if (region === 'row-header') {
      return this._rowHeaderSections.indexOf(offset);
    }

    // Fetch the index.
    let index = this._columnSections.indexOf(offset);

    // Return early if the section is found.
    if (index >= 0) {
      return index;
    }

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elc = em === 'last-column' || em === 'both';

    // Return the last column if the offset is in the expanded range.
    if (elc && pw > bw && offset < (this._columnSections.length + pw - bw)) {
      return this._columnSections.count - 1;
    }

    // Otherwise, the offset is out of range.
    return -1;
  }

  /**
   * Get the offset of a row in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param index - The index of the row of interest.
   *
   * @returns The offset of the row, or `-1` if the index is out of range.
   *
   * #### Notes
   * An expanded last row has no effect on the return value.
   */
  rowOffset(region: DataModel.RowRegion, index: number): number {
    let offset: number;
    if (region === 'body') {
      offset = this._rowSections.offsetOf(index);
    } else {
      offset = this._columnHeaderSections.offsetOf(index);
    }
    return offset;
  }

  /**
   * Get the offset of a column in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param index - The index of the column of interest.
   *
   * @returns The offset of the column, or `-1` if the index is out of range.
   *
   * #### Notes
   * An expanded last column has no effect on the return value.
   */
  columnOffset(region: DataModel.ColumnRegion, index: number): number {
    let offset: number;
    if (region === 'body') {
      offset = this._columnSections.offsetOf(index);
    } else {
      offset = this._rowHeaderSections.offsetOf(index);
    }
    return offset;
  }

  /**
   * Get the size of a row in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param index - The index of the row of interest.
   *
   * @returns The size of the row, or `-1` if the index is out of range.
   *
   * #### Notes
   * This method accounts for an expanded last row.
   */
  rowSize(region: DataModel.RowRegion, index: number): number {
    // Return early for the column header region.
    if (region === 'column-header') {
      return this._columnHeaderSections.sizeOf(index);
    }

    // Fetch the row size.
    let size = this._rowSections.sizeOf(index);

    // Bail early if the index is out of bounds.
    if (size < 0) {
      return size;
    }

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

    // Adjust the size for the expanded last row if needed.
    if (elr && ph > bh && index === (this._rowSections.count - 1)) {
      size += ph - bh;
    }

    // Return the size.
    return size;
  }

  /**
   * Get the size of a column in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param index - The index of the column of interest.
   *
   * @returns The size of the column, or `-1` if the index is out of range.
   *
   * #### Notes
   * This method accounts for an expanded last column.
   */
  columnSize(region: DataModel.ColumnRegion, index: number): number {
    // Return early for the row header region.
    if (region === 'row-header') {
      return this._rowHeaderSections.sizeOf(index);
    }

    // Fetch the column size.
    let size = this._columnSections.sizeOf(index);

    // Bail early if the index is out of bounds.
    if (size < 0) {
      return size;
    }

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elc = em === 'last-column' || em === 'both';

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

    // Adjust the size for the expanded last column if needed.
    if (elc && pw > bw && index === (this._columnSections.count - 1)) {
      size += pw - bw;
    }

    // Return the size.
    return size;
  }

  /**
   * Resize a row in the data grid.
   *
   * @param region - The region which holds the row of interest.
   *
   * @param index - The index of the row of interest.
   *
   * @param size - The desired size of the row.
   */
  resizeRow(region: DataModel.RowRegion, index: number, size: number): void {
    let msg = new Private.RowResizeRequest(region, index, size);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Resize a column in the data grid.
   *
   * @param region - The region which holds the column of interest.
   *
   * @param index - The index of the column of interest.
   *
   * @param size - The desired size of the column.
   */
  resizeColumn(region: DataModel.ColumnRegion, index: number, size: number): void {
    let msg = new Private.ColumnResizeRequest(region, index, size);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Reset modified rows to their default size.
   *
   * @param region - The row region of interest.
   */
  resetRows(region: DataModel.RowRegion | 'all'): void {
    switch (region) {
    case 'all':
      this._rowSections.reset();
      this._columnHeaderSections.reset();
      break;
    case 'body':
      this._rowSections.reset();
      break;
    case 'column-header':
      this._columnHeaderSections.reset();
      break;
    default:
      throw 'unreachable';
    }
    this._repaintContent();
    this._repaintOverlay();
  }

  /**
   * Reset modified columns to their default size.
   *
   * @param region - The column region of interest.
   */
  resetColumns(region: DataModel.ColumnRegion | 'all'): void {
    switch (region) {
    case 'all':
      this._columnSections.reset();
      this._rowHeaderSections.reset();
      break;
    case 'body':
      this._columnSections.reset();
      break;
    case 'row-header':
      this._rowHeaderSections.reset();
      break;
    default:
      throw 'unreachable';
    }
    this._repaintContent();
    this._repaintOverlay();
  }

  /**
   * Map a client position to local viewport coordinates.
   *
   * @param clientX - The client X position of the mouse.
   *
   * @param clientY - The client Y position of the mouse.
   *
   * @returns The local viewport coordinates for the position.
   */
  mapToLocal(clientX: number, clientY: number): { lx: number, ly: number } {
    // Fetch the viewport rect.
    let rect = this._viewport.node.getBoundingClientRect();

    // Extract the rect coordinates.
    let { left, top } = rect;

    // Round the rect coordinates for sub-pixel positioning.
    left = Math.floor(left);
    top = Math.floor(top);

    // Convert to local coordinates.
    let lx = clientX - left;
    let ly = clientY - top;

    // Return the local coordinates.
    return { lx, ly };
  }

  /**
   * Map a client position to virtual grid coordinates.
   *
   * @param clientX - The client X position of the mouse.
   *
   * @param clientY - The client Y position of the mouse.
   *
   * @returns The virtual grid coordinates for the position.
   */
  mapToVirtual(clientX: number, clientY: number): { vx: number, vy: number } {
    // Convert to local coordiates.
    let { lx, ly } = this.mapToLocal(clientX, clientY);

    // Convert to virtual coordinates.
    let vx = lx + this.scrollX - this.headerWidth;
    let vy = ly + this.scrollY - this.headerHeight;

    // Return the local coordinates.
    return { vx, vy };
  }

  /**
   * Hit test the viewport for the given client position.
   *
   * @param clientX - The client X position of the mouse.
   *
   * @param clientY - The client Y position of the mouse.
   *
   * @returns The hit test result, or `null` if the client
   *   position is out of bounds.
   *
   * #### Notes
   * This method accounts for an expanded last row and/or column.
   */
  hitTest(clientX: number, clientY: number): DataGrid.HitTestResult {
    // Convert the mouse position into local coordinates.
    let { lx, ly } = this.mapToLocal(clientX, clientY);

    // Fetch the header and body dimensions.
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
    let ph = this.pageHeight;
    let pw = this.pageWidth;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';
    let elc = em === 'last-column' || em === 'both';

    // Adjust the body width for an expanded last column.
    if (elc && pw > bw) {
      bw = pw;
    }

    // Adjust the body height for an expanded last row.
    if (elr && ph > bh) {
      bh = ph;
    }

    // Check for a corner header hit.
    if (lx >= 0 && lx < hw && ly >= 0 && ly < hh) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx;
      let vy = ly;

      // Fetch the row and column index.
      let row = this.rowAt('column-header', vy);
      let column = this.columnAt('row-header', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('row-header', column);
      let oy = this.rowOffset('column-header', row);

      // Fetch cell width and height.
      let width = this.columnSize('row-header', column);
      let height = this.rowSize('column-header', row);

      // Compute the leading and trailing positions.
      let x = vx - ox;
      let y = vy - oy;

      // Return the hit test result.
      return { region: 'corner-header', row, column, x, y, width, height };
    }

    // Check for a column header hit.
    if (ly >= 0 && ly < hh && lx >= 0 && lx < (hw + bw)) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx + this._scrollX - hw;
      let vy = ly

      // Fetch the row and column index.
      let row = this.rowAt('column-header', vy);
      let column = this.columnAt('body', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('body', column);
      let oy = this.rowOffset('column-header', row);

      // Fetch the cell width and height.
      let width = this.columnSize('body', column);
      let height = this.rowSize('column-header', row);

      // Compute the leading and trailing positions.
      let x = vx - ox;
      let y = vy - oy;

      // Return the hit test result.
      return { region: 'column-header', row, column, x, y, width, height };
    }

    // Check for a row header hit.
    if (lx >= 0 && lx < hw && ly >= 0 && ly < (hh + bh)) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx
      let vy = ly + this._scrollY - hh;

      // Fetch the row and column index.
      let row = this.rowAt('body', vy);
      let column = this.columnAt('row-header', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('row-header', column);
      let oy = this.rowOffset('body', row);

      // Fetch the cell width and height.
      let width = this.columnSize('row-header', column);
      let height = this.rowSize('body', row);

      // Compute the leading and trailing positions.
      let x = vx - ox;
      let y = vy - oy;

      // Return the hit test result.
      return { region: 'row-header', row, column, x, y, width, height };
    }

    // Check for a body hit.
    if (lx >= hw && lx < (hw + bw) && ly >= hh && ly < (hh + bh)) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx + this._scrollX - hw
      let vy = ly + this._scrollY - hh;

      // Fetch the row and column index.
      let row = this.rowAt('body', vy);
      let column = this.columnAt('body', vx);

      // Fetch the cell offset position.
      let ox = this.columnOffset('body', column);
      let oy = this.rowOffset('body', row);

      // Fetch the cell width and height.
      let width = this.columnSize('body', column);
      let height = this.rowSize('body', row);

      // Compute the part coordinates.
      let x = vx - ox;
      let y = vy - oy;

      // Return the result.
      return { region: 'body', row, column, x, y, width, height };
    }

    // Otherwise, it's a void space hit.
    let row = -1;
    let column = -1;
    let x = -1;
    let y = -1;
    let width = -1;
    let height = -1;

    // Return the hit test result.
    return { region: 'void', row, column, x, y, width, height };
  }

  /**
   * Copy the current selection to the system clipboard.
   *
   * #### Notes
   * The grid must have a data model and a selection model.
   *
   * The behavior can be configured via `DataGrid.copyConfig`.
   */
  copyToClipboard(): void {
    // Fetch the data model.
    let dataModel = this._dataModel;

    // Bail early if there is no data model.
    if (!dataModel) {
      return;
    }

    // Fetch the selection model.
    let selectionModel = this._selectionModel;

    // Bail early if there is no selection model.
    if (!selectionModel) {
      return;
    }

    // Coerce the selections to an array.
    let selections = toArray(selectionModel.selections());

    // Bail early if there are no selections.
    if (selections.length === 0) {
      return;
    }

    // Alert that multiple selections cannot be copied.
    if (selections.length > 1) {
      alert('Cannot copy multiple grid selections.');
      return;
    }

    // Fetch the model counts.
    let br = dataModel.rowCount('body');
    let bc = dataModel.columnCount('body');

    // Bail early if there is nothing to copy.
    if (br === 0 || bc === 0) {
      return;
    }

    // Unpack the selection.
    let { r1, c1, r2, c2 } = selections[0];

    // Clamp the selection to the model bounds.
    r1 = Math.max(0, Math.min(r1, br - 1));
    c1 = Math.max(0, Math.min(c1, bc - 1));
    r2 = Math.max(0, Math.min(r2, br - 1));
    c2 = Math.max(0, Math.min(c2, bc - 1));

    // Ensure the limits are well-orderd.
    if (r2 < r1) [r1, r2] = [r2, r1];
    if (c2 < c1) [c1, c2] = [c2, c1];

    // Fetch the header counts.
    let rhc = dataModel.columnCount('row-header');
    let chr = dataModel.rowCount('column-header');

    // Unpack the copy config.
    let separator = this._copyConfig.separator;
    let format = this._copyConfig.format;
    let headers = this._copyConfig.headers;
    let warningThreshold = this._copyConfig.warningThreshold;

    // Compute the number of cells to be copied.
    let rowCount = r2 - r1 + 1;
    let colCount = c2 - c1 + 1;
    switch (headers) {
    case 'none':
      rhc = 0;
      chr = 0;
      break;
    case 'row':
      chr = 0;
      colCount += rhc;
      break;
    case 'column':
      rhc = 0;
      rowCount += chr;
      break;
    case 'all':
      rowCount += chr;
      colCount += rhc;
      break;
    default:
      throw 'unreachable';
    }

    // Compute the total cell count.
    let cellCount = rowCount * colCount;

    // Allow the user to cancel a large copy request.
    if (cellCount > warningThreshold) {
      let msg = `Copying ${cellCount} cells may take a while. Continue?`;
      if (!window.confirm(msg)) {
        return;
      }
    }

    // Set up the format args.
    let args = {
      region: 'body' as DataModel.CellRegion,
      row: 0,
      column: 0,
      value: null as any,
      metadata: {} as DataModel.Metadata
    };

    // Allocate the array of rows.
    let rows = new Array<string[]>(rowCount);

    // Iterate over the rows.
    for (let j = 0; j < rowCount; ++j) {
      // Allocate the array of cells.
      let cells = new Array<string>(colCount);

      // Iterate over the columns.
      for (let i = 0; i < colCount; ++i) {
        // Set up the format variables.
        let region: DataModel.CellRegion;
        let row: number;
        let column: number;

        // Populate the format variables.
        if (j < chr && i < rhc) {
          region = 'corner-header';
          row = j;
          column = i;
        } else if (j < chr) {
          region = 'column-header';
          row = j;
          column = i - rhc + c1;
        } else if (i < rhc) {
          region = 'row-header';
          row = j - chr + r1;
          column = i;
        } else {
          region = 'body';
          row = j - chr + r1;
          column = i - rhc + c1;
        }

        // Populate the format args.
        args.region = region;
        args.row = row;
        args.column = column;
        args.value = dataModel.data(region, row, column);
        args.metadata = dataModel.metadata(region, column);

        // Format the cell.
        cells[i] = format(args);
      }

      // Save the row of cells.
      rows[j] = cells;
    }

    // Convert the cells into lines.
    let lines = rows.map(cells => cells.join(separator));

    // Convert the lines into text.
    let text = lines.join('\n');

    // Copy the text to the clipboard.
    ClipboardExt.copyText(text);
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
    // Process viewport messages.
    if (handler === this._viewport) {
      this._processViewportMessage(msg);
      return true;
    }

    // Process horizontal scroll bar messages.
    if (handler === this._hScrollBar && msg.type === 'activate-request') {
      this.activate();
      return false;
    }

    // Process vertical scroll bar messages.
    if (handler === this._vScrollBar && msg.type === 'activate-request') {
      this.activate();
      return false;
    }

    // Ignore all other messages.
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
    case 'keydown':
      this._evtKeyDown(event as KeyboardEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
      break;
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mouseup':
      this._evtMouseUp(event as MouseEvent);
      break;
    case 'mouseleave':
      this._evtMouseLeave(event as MouseEvent);
      break;
    case 'contextmenu':
      this._evtContextMenu(event as MouseEvent);
      break;
    case 'wheel':
      this._evtWheel(event as WheelEvent);
      break;
    case 'resize':
      this._refreshDPI();
      break;
    }
  }

  /**
   * A message handler invoked on an `'activate-request'` message.
   */
  protected onActivateRequest(msg: Message): void {
    this.viewport.node.focus();
  }

  /**
   * A message handler invoked on a `'before-attach'` message.
   */
  protected onBeforeAttach(msg: Message): void {
    window.addEventListener('resize', this);
    this.node.addEventListener('wheel', this);
    this._viewport.node.addEventListener('keydown', this);
    this._viewport.node.addEventListener('mousedown', this);
    this._viewport.node.addEventListener('mousemove', this);
    this._viewport.node.addEventListener('mouseleave', this);
    this._viewport.node.addEventListener('contextmenu', this);
    this._repaintContent();
    this._repaintOverlay();
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    window.removeEventListener('resize', this);
    this.node.removeEventListener('wheel', this);
    this._viewport.node.removeEventListener('keydown', this);
    this._viewport.node.removeEventListener('mousedown', this);
    this._viewport.node.removeEventListener('mousemove', this);
    this._viewport.node.removeEventListener('mouseleave', this);
    this._viewport.node.removeEventListener('contextmenu', this);
    this._releaseMouse();
  }

  /**
   * A message handler invoked on a `'before-show'` message.
   */
  protected onBeforeShow(msg: Message): void {
    this._repaintContent();
    this._repaintOverlay();
  }

  /**
   * A message handler invoked on a `'resize'` message.
   */
  protected onResize(msg: Widget.ResizeMessage): void {
    this._syncScrollState();
  }

  /**
   * Schedule a repaint of all of the grid content.
   */
  private _repaintContent(): void {
    let msg = new Private.PaintRequest('all', 0, 0, 0, 0);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Schedule a repaint of specific grid content.
   */
  private _repaintRegion(region: DataModel.CellRegion, r1: number, c1: number, r2: number, c2: number): void {
    let msg = new Private.PaintRequest(region, r1, c1, r2, c2);
    MessageLoop.postMessage(this._viewport, msg);
  }

  /**
   * Schedule a repaint of the overlay.
   */
  private _repaintOverlay(): void {
    MessageLoop.postMessage(this._viewport, Private.OverlayPaintRequest);
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

    // Compute the maximum canvas size for the given width and height.
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
    this._overlayGC.setTransform(1, 0, 0, 1, 0, 0);

    // Resize the buffer if needed.
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

    // Copy the valid canvas content into the buffer if needed.
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

    // Copy the valid canvas content from the buffer if needed.
    if (needBlit) {
      this._canvasGC.drawImage(this._buffer, 0, 0);
    }

    // Copy the valid overlay content into the buffer if needed.
    if (needBlit) {
      this._bufferGC.drawImage(this._overlay, 0, 0);
    }

    // Resize the overlay width if needed.
    if (curW < width) {
      this._overlay.width = expW;
      this._overlay.style.width = `${expW / this._dpiRatio}px`;
    } else if (curW > maxW) {
      this._overlay.width = maxW;
      this._overlay.style.width = `${maxW / this._dpiRatio}px`;
    }

    // Resize the overlay height if needed.
    if (curH < height) {
      this._overlay.height = expH;
      this._overlay.style.height = `${expH / this._dpiRatio}px`;
    } else if (curH > maxH) {
      this._overlay.height = maxH;
      this._overlay.style.height = `${maxH / this._dpiRatio}px`;
    }

    // Copy the valid overlay content from the buffer if needed.
    if (needBlit) {
      this._overlayGC.drawImage(this._buffer, 0, 0);
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
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
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
    this._vScrollBar.maximum = this.maxScrollY;
    this._vScrollBar.page = this.pageHeight;
    this._hScrollBar.maximum = this.maxScrollX;
    this._hScrollBar.page = this.pageWidth;

    // Re-clamp the scroll position.
    this._scrollTo(this._scrollX, this._scrollY);
  }

  /**
   * Sync the viewport to the given scroll position.
   *
   * #### Notes
   * This schedules a full repaint and syncs the scroll state.
   */
  private _syncViewport(): void {
    this._repaintContent();
    this._repaintOverlay();
    this._syncScrollState();
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
    case 'paint-request':
      this._onViewportPaintRequest(msg as Private.PaintRequest);
      break;
    case 'overlay-paint-request':
      this._onViewportOverlayPaintRequest(msg);
      break;
    case 'row-resize-request':
      this._onViewportRowResizeRequest(msg as Private.RowResizeRequest);
      break;
    case 'column-resize-request':
      this._onViewportColumnResizeRequest(msg as Private.ColumnResizeRequest);
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

    // Resize the canvas if needed.
    this._resizeCanvasIfNeeded(width, height);

    // Bail early if there is nothing to paint.
    if (width === 0 || height === 0) {
      return;
    }

    // Paint the whole grid if the old size was zero.
    if (oldWidth === 0 || oldHeight === 0) {
      this._paintContent(0, 0, width, height);
      this._paintOverlay();
      return;
    }

    // Fetch the expansion state.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';
    let elc = em === 'last-column' || em === 'both';

    // Paint the right edge as needed.
    if (elc && this.pageWidth > this.bodyWidth) {
      let bx = this._columnSections.offsetOf(this._columnSections.count - 1);
      let x = Math.min(this.headerWidth + bx, oldWidth);
      this._paintContent(x, 0, width - x, height);
    } else if (width > oldWidth) {
      this._paintContent(oldWidth, 0, width - oldWidth, height);
    }

    // Paint the bottom edge as needed.
    if (elr && this.pageHeight > this.bodyHeight) {
      let by = this._rowSections.offsetOf(this._rowSections.count - 1);
      let y = Math.min(this.headerHeight + by, oldHeight);
      this._paintContent(0, y, width, height - y);
    } else if (height > oldHeight) {
      this._paintContent(0, oldHeight, width, height - oldHeight);
    }

    // Paint the overlay.
    this._paintOverlay();
  }

  /**
   * A message hook invoked on a viewport `'scroll-request'` message.
   */
  private _onViewportScrollRequest(msg: Message): void {
    this._scrollTo(this._hScrollBar.value, this._vScrollBar.value);
  }

  /**
   * A message hook invoked on a viewport `'paint-request'` message.
   */
  private _onViewportPaintRequest(msg: Private.PaintRequest): void {
    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Bail early if the viewport has zero area.
    if (this._viewportWidth === 0 || this._viewportHeight === 0) {
      return;
    }

    // Set up the paint limits.
    let xMin = 0;
    let yMin = 0;
    let xMax = this._viewportWidth - 1;
    let yMax = this._viewportHeight - 1;

    // Fetch the scroll position.
    let sx = this._scrollX;
    let sy = this._scrollY;

    // Fetch the header dimensions.
    let hw = this.headerWidth;
    let hh = this.headerHeight;

    // Fetch the section lists.
    let rs = this._rowSections;
    let cs = this._columnSections;
    let rhs = this._rowHeaderSections;
    let chs = this._columnHeaderSections;

    // Unpack the message data.
    let { region, r1, c1, r2, c2 } = msg;

    // Set up the paint variables.
    let x1: number;
    let y1: number;
    let x2: number;
    let y2: number;

    // Fill the paint variables based on the paint region.
    switch (region) {
    case 'all':
      x1 = xMin;
      y1 = yMin;
      x2 = xMax;
      y2 = yMax;
      break;
    case 'body':
      r1 = Math.max(0, Math.min(r1, rs.count));
      c1 = Math.max(0, Math.min(c1, cs.count));
      r2 = Math.max(0, Math.min(r2, rs.count));
      c2 = Math.max(0, Math.min(c2, cs.count));
      x1 = cs.offsetOf(c1) - sx + hw;
      y1 = rs.offsetOf(r1) - sy + hh;
      x2 = cs.extentOf(c2) - sx + hw;
      y2 = rs.extentOf(r2) - sy + hh;
      break;
    case 'row-header':
      r1 = Math.max(0, Math.min(r1, rs.count));
      c1 = Math.max(0, Math.min(c1, rhs.count));
      r2 = Math.max(0, Math.min(r2, rs.count));
      c2 = Math.max(0, Math.min(c2, rhs.count));
      x1 = rhs.offsetOf(c1);
      y1 = rs.offsetOf(r1) - sy + hh;
      x2 = rhs.extentOf(c2);
      y2 = rs.extentOf(r2) - sy + hh;
      break;
    case 'column-header':
      r1 = Math.max(0, Math.min(r1, chs.count));
      c1 = Math.max(0, Math.min(c1, cs.count));
      r2 = Math.max(0, Math.min(r2, chs.count));
      c2 = Math.max(0, Math.min(c2, cs.count));
      x1 = cs.offsetOf(c1) - sx + hw;
      y1 = chs.offsetOf(r1);
      x2 = cs.extentOf(c2) - sx + hw;
      y2 = chs.extentOf(r2);
      break;
    case 'corner-header':
      r1 = Math.max(0, Math.min(r1, chs.count));
      c1 = Math.max(0, Math.min(c1, rhs.count));
      r2 = Math.max(0, Math.min(r2, chs.count));
      c2 = Math.max(0, Math.min(c2, rhs.count));
      x1 = rhs.offsetOf(c1);
      y1 = chs.offsetOf(r1);
      x2 = rhs.extentOf(c2);
      y2 = chs.extentOf(r2);
      break;
    default:
      throw 'unreachable';
    }

    // Bail early if the dirty rect is outside the bounds.
    if (x2 < xMin || y2 < yMin || x1 > xMax || y1 > yMax) {
      return;
    }

    // Clamp the dirty rect to the paint bounds.
    x1 = Math.max(xMin, Math.min(x1, xMax));
    y1 = Math.max(yMin, Math.min(y1, yMax));
    x2 = Math.max(xMin, Math.min(x2, xMax));
    y2 = Math.max(yMin, Math.min(y2, yMax));

    // Paint the content of the dirty rect.
    this._paintContent(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
  }

  /**
   * A message hook invoked on a viewport `'overlay-paint-request'` message.
   */
  private _onViewportOverlayPaintRequest(msg: Message): void {
    // Bail early if the viewport is not visible.
    if (!this._viewport.isVisible) {
      return;
    }

    // Bail early if the viewport has zero area.
    if (this._viewportWidth === 0 || this._viewportHeight === 0) {
      return;
    }

    // Paint the content of the overlay.
    this._paintOverlay();
  }

  /**
   * A message hook invoked on a viewport `'row-resize-request'` message.
   */
  private _onViewportRowResizeRequest(msg: Private.RowResizeRequest): void {
    if (msg.region === 'body') {
      this._resizeRow(msg.index, msg.size);
    } else {
      this._resizeColumnHeader(msg.index, msg.size);
    }
  }

  /**
   * A message hook invoked on a viewport `'column-resize-request'` message.
   */
  private _onViewportColumnResizeRequest(msg: Private.ColumnResizeRequest): void {
    if (msg.region === 'body') {
      this._resizeColumn(msg.index, msg.size);
    } else {
      this._resizeRowHeader(msg.index, msg.size);
    }
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
  private _onDataModelChanged(sender: DataModel, args: DataModel.ChangedArgs): void {
    switch (args.type) {
    case 'rows-inserted':
      this._onRowsInserted(args);
      break;
    case 'columns-inserted':
      this._onColumnsInserted(args);
      break;
    case 'rows-removed':
      this._onRowsRemoved(args);
      break;
    case 'columns-removed':
      this._onColumnsRemoved(args);
      break;
    case 'rows-moved':
      this._onRowsMoved(args);
      break;
    case 'columns-moved':
      this._onColumnsMoved(args);
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
   * A signal handler for the selection model `changed` signal.
   */
  private _onSelectionsChanged(sender: SelectionModel): void {
    this._repaintOverlay();
  }

  /**
   * Handle rows being inserted in the data model.
   */
  private _onRowsInserted(args: DataModel.RowsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to insert.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._rowSections;
    } else {
      list = this._columnHeaderSections;
    }

    // Insert the span, maintaining the scroll position as needed.
    if (this._scrollY === this.maxScrollY && this.maxScrollY > 0) {
      list.insert(index, span);
      this._scrollY = this.maxScrollY;
    } else {
      list.insert(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle columns being inserted into the data model.
   */
  private _onColumnsInserted(args: DataModel.ColumnsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to insert.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._columnSections;
    } else {
      list = this._rowHeaderSections;
    }

    // Insert the span, maintaining the scroll position as needed.
    if (this._scrollX === this.maxScrollX && this.maxScrollX > 0) {
      list.insert(index, span);
      this._scrollX = this.maxScrollX;
    } else {
      list.insert(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle rows being removed from the data model.
   */
  private _onRowsRemoved(args: DataModel.RowsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to remove.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._rowSections;
    } else {
      list = this._columnHeaderSections;
    }

    // Bail if the index or is invalid
    if (index < 0 || index >= list.count) {
      return;
    }

    // Remove the span, maintaining the scroll position as needed.
    if (this._scrollY === this.maxScrollY && this.maxScrollY > 0) {
      list.remove(index, span);
      this._scrollY = this.maxScrollY;
    } else {
      list.remove(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle columns being removed from the data model.
   */
  private _onColumnsRemoved(args: DataModel.ColumnsChangedArgs): void {
    // Unpack the arg data.
    let { region, index, span } = args;

    // Bail early if there are no sections to remove.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._columnSections;
    } else {
      list = this._rowHeaderSections;
    }

    // Bail if the index or is invalid
    if (index < 0 || index >= list.count) {
      return;
    }

    // Remove the span, maintaining the scroll position as needed.
    if (this._scrollX === this.maxScrollX && this.maxScrollX > 0) {
      list.remove(index, span);
      this._scrollX = this.maxScrollX;
    } else {
      list.remove(index, span);
    }

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Handle rows moving in the data model.
   */
  private _onRowsMoved(args: DataModel.RowsMovedArgs): void {
    // Unpack the arg data.
    let { region, index, span, destination } = args;

    // Bail early if there are no sections to move.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._rowSections;
    } else {
      list = this._columnHeaderSections;
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
    let r1 = Math.min(index, destination);

    // Compute the last affected index.
    let r2 = Math.max(index + span - 1, destination + span - 1);

    // Move the sections in the list.
    list.move(index, span, destination);

    // Schedule a repaint of the dirty cells.
    if (region === 'body') {
      this._repaintRegion('body', r1, 0, r2, Infinity);
      this._repaintRegion('row-header', r1, 0, r2, Infinity);
    } else {
      this._repaintRegion('column-header', r1, 0, r2, Infinity);
      this._repaintRegion('corner-header', r1, 0, r2, Infinity);
    }

    // Schedule a repaint of the overlay.
    this._repaintOverlay();
  }

  /**
   * Handle columns moving in the data model.
   */
  private _onColumnsMoved(args: DataModel.ColumnsMovedArgs): void {
    // Unpack the arg data.
    let { region, index, span, destination } = args;

    // Bail early if there are no sections to move.
    if (span <= 0) {
      return;
    }

    // Look up the relevant section list.
    let list: SectionList;
    if (region === 'body') {
      list = this._columnSections;
    } else {
      list = this._rowHeaderSections;
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

    // Move the sections in the list.
    list.move(index, span, destination);

    // Compute the first affected index.
    let c1 = Math.min(index, destination);

    // Compute the last affected index.
    let c2 = Math.max(index + span - 1, destination + span - 1);

    // Schedule a repaint of the dirty cells.
    if (region === 'body') {
      this._repaintRegion('body', 0, c1, Infinity, c2);
      this._repaintRegion('column-header', 0, c1, Infinity, c2);
    } else {
      this._repaintRegion('row-header', 0, c1, Infinity, c2);
      this._repaintRegion('corner-header', 0, c1, Infinity, c2);
    }

    // Schedule a repaint of the overlay.
    this._repaintOverlay();
  }

  /**
   * Handle cells changing in the data model.
   */
  private _onCellsChanged(args: DataModel.CellsChangedArgs): void {
    // Unpack the arg data.
    let { region, row, column, rowSpan, columnSpan } = args;

    // Bail early if there are no cells to modify.
    if (rowSpan <= 0 && columnSpan <= 0) {
      return;
    }

    // Compute the changed cell bounds.
    let r1 = row;
    let c1 = column;
    let r2 = r1 + rowSpan - 1;
    let c2 = c1 + columnSpan - 1;

    // Schedule a repaint of the cell content.
    this._repaintRegion(region, r1, c1, r2, c2);
  }

  /**
   * Handle a full data model reset.
   */
  private _onModelReset(args: DataModel.ModelResetArgs): void {
    // Look up the various current section counts.
    let nr = this._rowSections.count;
    let nc = this._columnSections.count;
    let nrh = this._rowHeaderSections.count;
    let nch = this._columnHeaderSections.count;

    // Compute the delta count for each region.
    let dr = this._dataModel!.rowCount('body') - nr;
    let dc = this._dataModel!.columnCount('body') - nc;
    let drh = this._dataModel!.columnCount('row-header') - nrh;
    let dch = this._dataModel!.rowCount('column-header') - nch;

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
    this._repaintContent();
  }

  /**
   * Handle the `'keydown'` event for the data grid.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    } else if (this._keyHandler) {
      this._keyHandler.onKeyDown(this, event);
    }
  }

  /**
   * Handle the `'mousedown'` event for the data grid.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Ignore everything except the left mouse button.
    if (event.button !== 0) {
      return;
    }

    // Activate the grid.
    this.activate();

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Add the extra document listeners.
    document.addEventListener('keydown', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('mousedown', this, true);
    document.addEventListener('mousemove', this, true);
    document.addEventListener('contextmenu', this, true);

    // Flip the mousedown flag.
    this._mousedown = true;

    // Dispatch to the mouse handler.
    if (this._mouseHandler) {
      this._mouseHandler.onMouseDown(this, event);
    }
  }

  /**
   * Handle the `'mousemove'` event for the data grid.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Stop the event propagation if the mouse is down.
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Bail if there is no mouse handler.
    if (!this._mouseHandler) {
      return;
    }

    // Dispatch to the mouse handler.
    if (this._mousedown) {
      this._mouseHandler.onMouseMove(this, event);
    } else {
      this._mouseHandler.onMouseHover(this, event);
    }
  }

  /**
   * Handle the `'mouseup'` event for the data grid.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Ignore everything except the left mouse button.
    if (event.button !== 0) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Dispatch to the mouse handler.
    if (this._mouseHandler) {
      this._mouseHandler.onMouseUp(this, event);
    }

    // Release the mouse.
    this._releaseMouse();
  }

  /**
   * Handle the `'mouseleave'` event for the data grid.
   */
  private _evtMouseLeave(event: MouseEvent): void {
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    } else if (this._mouseHandler) {
      this._mouseHandler.onMouseLeave(this, event);
    }
  }

  /**
   * Handle the `'contextmenu'` event for the data grid.
   */
  private _evtContextMenu(event: MouseEvent): void {
    if (this._mousedown) {
      event.preventDefault();
      event.stopPropagation();
    } else if (this._mouseHandler) {
      this._mouseHandler.onContextMenu(this, event);
    }
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // Ignore the event if `accel` is held.
    if (Platform.accelKey(event)) {
      return;
    }

    // Bail early if there is no mouse handler.
    if (!this._mouseHandler) {
      return;
    }

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Dispatch to the mouse handler.
    this._mouseHandler.onWheel(this, event);
  }

  /**
   * Release the mouse grab.
   */
  private _releaseMouse(): void {
    // Clear the mousedown flag.
    this._mousedown = false;

    // Relase the mouse handler.
    if (this._mouseHandler) {
      this._mouseHandler.release();
    }

    // Remove the document listeners.
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('mousedown', this, true);
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Refresh the dpi ratio.
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

    // Schedule a repaint of the content.
    this._repaintContent();

    // Schedule a repaint of the overlay.
    this._repaintOverlay();

    // Update the canvas size for the new dpi ratio.
    this._resizeCanvasIfNeeded(this._viewportWidth, this._viewportHeight);

    // Ensure the canvas style is scaled for the new ratio.
    this._canvas.style.width = `${this._canvas.width / this._dpiRatio}px`;
    this._canvas.style.height = `${this._canvas.height / this._dpiRatio}px`;

    // Ensure the overlay style is scaled for the new ratio.
    this._overlay.style.width = `${this._overlay.width / this._dpiRatio}px`;
    this._overlay.style.height = `${this._overlay.height / this._dpiRatio}px`;
  }

  /**
   * Resize a row section immediately.
   */
  private _resizeRow(index: number, size: number): void {
    // Look up the target section list.
    let list = this._rowSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = Private.clampSectionSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Fetch the expansion state.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';

    // If the last row needs expanding, paint from the index down.
    if (elr && this.pageHeight > this.bodyHeight) {
      let y = this.headerHeight + this._rowSections.offsetOf(index);
      this._paintContent(0, y, vw, vh - y);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the column header height.
    let hh = this.headerHeight;

    // Compute the viewport offset of the section.
    let offset = list.offsetOf(index) + hh - this._scrollY;

    // Bail early if there is nothing to paint.
    if (hh >= vh || offset >= vh) {
      this._syncScrollState();
      return;
    }

    // Update the scroll position if the section is not visible.
    if (offset + oldSize <= hh) {
      this._scrollY += delta;
      this._syncScrollState();
      return;
    }

    // Compute the paint origin of the section.
    let pos = Math.max(hh, offset);

    // Paint from the section onward if it spans the viewport.
    if (offset + oldSize >= vh || offset + newSize >= vh) {
      this._paintContent(0, pos, vw, vh - pos);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the X blit dimensions.
    let sx = 0;
    let sw = vw;
    let dx = 0;

    // Compute the Y blit dimensions.
    let sy: number;
    let sh: number;
    let dy: number;
    if (offset + newSize <= hh) {
      sy = hh - delta;
      sh = vh - sy;
      dy = hh;
    } else {
      sy = offset + oldSize;
      sh = vh - sy;
      dy = sy + delta;
    }

    // Blit the valid content to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the section if needed.
    if (newSize > 0 && offset + newSize > hh) {
      this._paintContent(0, pos, vw, offset + newSize - pos);
    }

    // Paint the trailing space if needed.
    if (delta < 0) {
      this._paintContent(0, vh + delta, vw, -delta);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state.
    this._syncScrollState();
  }

  /**
   * Resize a column section immediately.
   */
  private _resizeColumn(index: number, size: number): void {
    // Look up the target section list.
    let list = this._columnSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = Private.clampSectionSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Fetch the expansion state.
    let em = this._expansionMode;
    let elc = em === 'last-column' || em === 'both';

    // If the last column needs expanding, paint from the index right.
    if (elc && this.pageWidth > this.bodyWidth) {
      let x = this.headerWidth + this._columnSections.offsetOf(index);
      this._paintContent(x, 0, vw - x, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the row header width.
    let hw = this.headerWidth;

    // Compute the viewport offset of the section.
    let offset = list.offsetOf(index) + hw - this._scrollX;

    // Bail early if there is nothing to paint.
    if (hw >= vw || offset >= vw) {
      this._syncScrollState();
      return;
    }

    // Update the scroll position if the section is not visible.
    if (offset + oldSize <= hw) {
      this._scrollX += delta;
      this._syncScrollState();
      return;
    }

    // Compute the paint origin of the section.
    let pos = Math.max(hw, offset);

    // Paint from the section onward if it spans the viewport.
    if (offset + oldSize >= vw || offset + newSize >= vw) {
      this._paintContent(pos, 0, vw - pos, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the Y blit dimensions.
    let sy = 0;
    let sh = vh;
    let dy = 0;

    // Compute the X blit dimensions.
    let sx: number;
    let sw: number;
    let dx: number;
    if (offset + newSize <= hw) {
      sx = hw - delta;
      sw = vw - sx;
      dx = hw;
    } else {
      sx = offset + oldSize;
      sw = vw - sx;
      dx = sx + delta;
    }

    // Blit the valid content to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the section if needed.
    if (newSize > 0 && offset + newSize > hw) {
      this._paintContent(pos, 0, offset + newSize - pos, vh);
    }

    // Paint the trailing space if needed.
    if (delta < 0) {
      this._paintContent(vw + delta, 0, -delta, vh);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state after painting.
    this._syncScrollState();
  }

  /**
   * Resize a row header section immediately.
   */
  private _resizeRowHeader(index: number, size: number): void {
    // Look up the target section list.
    let list = this._rowHeaderSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = Private.clampSectionSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the offset of the section.
    let offset = list.offsetOf(index);

    // Bail early if the section is fully outside the viewport.
    if (offset >= vw) {
      this._syncScrollState();
      return;
    }

    // Paint the entire tail if the section spans the viewport.
    if (offset + oldSize >= vw || offset + newSize >= vw) {
      this._paintContent(offset, 0, vw - offset, vh);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the blit content dimensions.
    let sx = offset + oldSize;
    let sy = 0;
    let sw = vw - sx;
    let sh = vh;
    let dx = sx + delta;
    let dy = 0;

    // Blit the valid contents to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the header section if needed.
    if (newSize > 0) {``
      this._paintContent(offset, 0, newSize, vh);
    }

    // Paint the trailing space if needed.
    if (delta < 0) {
      this._paintContent(vw + delta, 0, -delta, vh);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state after painting.
    this._syncScrollState();
  }

  /**
   * Resize a column header section immediately.
   */
  private _resizeColumnHeader(index: number, size: number): void {
    // Look up the target section list.
    let list = this._columnHeaderSections;

    // Bail early if the index is out of range.
    if (index < 0 || index >= list.count) {
      return;
    }

    // Look up the old size of the section.
    let oldSize = list.sizeOf(index);

    // Normalize the new size of the section.
    let newSize = Private.clampSectionSize(size);

    // Bail early if the size does not change.
    if (oldSize === newSize) {
      return;
    }

    // Resize the section in the list.
    list.resize(index, newSize);

    // Get the current size of the viewport.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vw === 0 || vh === 0) {
      this._syncScrollState();
      return;
    }

    // Paint the overlay.
    this._paintOverlay();

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Look up the offset of the section.
    let offset = list.offsetOf(index);

    // Bail early if the section is fully outside the viewport.
    if (offset >= vh) {
      this._syncScrollState();
      return;
    }

    // Paint the entire tail if the section spans the viewport.
    if (offset + oldSize >= vh || offset + newSize >= vh) {
      this._paintContent(0, offset, vw, vh - offset);
      this._paintOverlay();
      this._syncScrollState();
      return;
    }

    // Compute the blit content dimensions.
    let sx = 0;
    let sy = offset + oldSize;
    let sw = vw;
    let sh = vh - sy;
    let dx = 0;
    let dy = sy + delta;

    // Blit the valid contents to the destination.
    this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

    // Repaint the header section if needed.
    if (newSize > 0) {
      this._paintContent(0, offset, vw, newSize);
    }

    // Paint the trailing space if needed.
    if (delta < 0) {
      this._paintContent(0, vh + delta, vw, -delta);
    }

    // Paint the overlay.
    this._paintOverlay();

    // Sync the scroll state after painting.
    this._syncScrollState();
  }

  /**
   * Scroll immediately to the specified offset position.
   */
  private _scrollTo(x: number, y: number): void {
    // Floor and clamp the position to the allowable range.
    x = Math.max(0, Math.min(Math.floor(x), this.maxScrollX));
    y = Math.max(0, Math.min(Math.floor(y), this.maxScrollY));

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
    let contentX = this.headerWidth;
    let contentY = this.headerHeight;

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
      this._paintContent(0, 0, width, height);
      this._paintOverlay();
      return;
    }

    // Update the internal Y scroll position.
    this._scrollY = y;

    // Scroll the Y axis if needed. If the scroll distance exceeds
    // the visible height, paint everything. Otherwise, blit the
    // valid content and paint the dirty region.
    if (dy !== 0 && contentHeight > 0) {
      if (Math.abs(dy) >= contentHeight) {
        this._paintContent(0, contentY, width, contentHeight);
      } else {
        let x = 0;
        let y = dy < 0 ? contentY : contentY + dy;
        let w = width;
        let h = contentHeight - Math.abs(dy);
        this._blitContent(this._canvas, x, y, w, h, x, y - dy);
        this._paintContent(0, dy < 0 ? contentY : height - dy, width, Math.abs(dy));
      }
    }

    // Update the internal X scroll position.
    this._scrollX = x;

    // Scroll the X axis if needed. If the scroll distance exceeds
    // the visible width, paint everything. Otherwise, blit the
    // valid content and paint the dirty region.
    if (dx !== 0 && contentWidth > 0) {
      if (Math.abs(dx) >= contentWidth) {
        this._paintContent(contentX, 0, contentWidth, height);
      } else {
        let x = dx < 0 ? contentX : contentX + dx;
        let y = 0;
        let w = contentWidth - Math.abs(dx);
        let h = height;
        this._blitContent(this._canvas, x, y, w, h, x - dx, y);
        this._paintContent(dx < 0 ? contentX : width - dx, 0, Math.abs(dx), height);
      }
    }

    // Paint the overlay.
    this._paintOverlay();
  }

  /**
   * Blit content into the on-screen grid canvas.
   *
   * The rect should be expressed in viewport coordinates.
   *
   * This automatically accounts for the dpi ratio.
   */
  private _blitContent(source: HTMLCanvasElement, x: number, y: number, w: number, h: number, dx: number, dy: number): void {
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
   * The rect should be expressed in valid viewport coordinates.
   *
   * This is the primary paint entry point. The individual `_draw*`
   * methods should not be invoked directly. This method dispatches
   * to the drawing methods in the correct order.
   */
  private _paintContent(rx: number, ry: number, rw: number, rh: number): void {
    // Scale the canvas and buffe GC for the dpi ratio.
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
   * Paint the overlay content for the entire grid.
   *
   * This is the primary overlay paint entry point. The individual
   * `_draw*` methods should not be invoked directly. This method
   * dispatches to the drawing methods in the correct order.
   */
  private _paintOverlay(): void {
    // Scale the overlay GC for the dpi ratio.
    this._overlayGC.setTransform(this._dpiRatio, 0, 0, this._dpiRatio, 0, 0);

    // Clear the overlay of all content.
    this._overlayGC.clearRect(0, 0, this._overlay.width, this._overlay.height);

    // Draw the body selections.
    this._drawBodySelections();

    // Draw the row header selections.
    this._drawRowHeaderSelections();

    // Draw the column header selections.
    this._drawColumnHeaderSelections();

    // Draw the cursor.
    this._drawCursor();

    // Draw the shadows.
    this._drawShadows();
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
    let contentX = this.headerWidth;
    let contentY = this.headerHeight;

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

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let bw = this.bodyWidth;
    let ph = this.pageHeight;
    let pw = this.pageWidth;

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

    // Fetch the max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = maxRow;
    }
    if (c2 < 0) {
      c2 = maxColumn;
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

    // Fetch the expansion state.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';
    let elc = em === 'last-column' || em === 'both';

    // Adjust the geometry if the last row needs expanding.
    if (elr && ph > bh && r2 === maxRow) {
      let dh = this.pageHeight - this.bodyHeight;
      rowSizes[rowSizes.length - 1] += dh;
      height += dh;
      y2 += dh;
    }

    // Adjust the geometry if the last column needs expanding.
    if (elc && pw > bw && c2 === maxColumn) {
      let dw = this.pageWidth - this.bodyWidth;
      columnSizes[columnSizes.length - 1] += dw;
      width += dw;
      x2 += dw;
    }

    // Create the paint region object.
    let rgn: Private.PaintRegion = {
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
    let contentW = this.headerWidth;
    let contentH = this.bodyHeight - this._scrollY;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = 0;
    let contentY = this.headerHeight;

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

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

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

    // Fetch max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._rowHeaderSections.count - 1;

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = maxRow;
    }
    if (c2 < 0) {
      c2 = maxColumn;
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

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';

    // Adjust the geometry if the last row needs expanding.
    if (elr && ph > bh && r2 === maxRow) {
      let dh = this.pageHeight - this.bodyHeight;
      rowSizes[rowSizes.length - 1] += dh;
      height += dh;
      y2 += dh;
    }

    // Create the paint region object.
    let rgn: Private.PaintRegion = {
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
    let contentW = this.bodyWidth - this._scrollX;
    let contentH = this.headerHeight;

    // Bail if there is no content to draw.
    if (contentW <= 0 || contentH <= 0) {
      return;
    }

    // Get the visible content origin.
    let contentX = this.headerWidth;
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

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

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

    // Fetch the max row and column.
    let maxRow = this._columnHeaderSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Handle a dirty content area larger than the cell count.
    if (r2 < 0) {
      r2 = maxRow;
    }
    if (c2 < 0) {
      c2 = maxColumn;
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

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elc = em === 'last-column' || em === 'both';

    // Adjust the geometry if the last column needs expanding.
    if (elc && pw > bw && c2 === maxColumn) {
      let dw = this.pageWidth - this.bodyWidth;
      columnSizes[columnSizes.length - 1] += dw;
      width += dw;
      x2 += dw;
    }

    // Create the paint region object.
    let rgn: Private.PaintRegion = {
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
    let contentW = this.headerWidth;
    let contentH = this.headerHeight;

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
    let rgn: Private.PaintRegion = {
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
  private _drawBackground(rgn: Private.PaintRegion, color: string | undefined): void {
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
  private _drawRowBackground(rgn: Private.PaintRegion, colorFn: ((i: number) => string) | undefined): void {
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
  private _drawColumnBackground(rgn: Private.PaintRegion, colorFn: ((i: number) => string) | undefined): void {
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
  private _drawCells(rgn: Private.PaintRegion): void {
    // Bail if there is no data model.
    if (!this._dataModel) {
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
        metadata = this._dataModel.metadata(rgn.region, column);
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
          value = this._dataModel.data(rgn.region, row, column);
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
      this._blitContent(this._buffer, x1, y1, x2 - x1 + 1, y2 - y1 + 1, x1, y1);

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
  private _drawHorizontalGridLines(rgn: Private.PaintRegion, color: string | undefined): void {
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

    // Fetch the geometry.
    let bh = this.bodyHeight;
    let ph = this.pageHeight;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';

    // Fetch the number of grid lines to be drawn.
    let n = rgn.rowSizes.length;

    // Adjust the count down if the last line shouldn't be drawn.
    if (elr && ph > bh && (rgn.row + n === this._rowSections.count)) {
      n -= 1;
    }

    // Draw the horizontal grid lines.
    for (let y = rgn.y, j = 0; j < n; ++j) {
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
  private _drawVerticalGridLines(rgn: Private.PaintRegion, color: string | undefined): void {
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

    // Fetch the geometry.
    let bw = this.bodyWidth;
    let pw = this.pageWidth;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elc = em === 'last-column' || em === 'both';

    // Fetch the number of grid lines to be drawn.
    let n = rgn.columnSizes.length;

    // Adjust the count down if the last line shouldn't be drawn.
    if (elc && pw > bw && (rgn.column + n === this._columnSections.count)) {
      n -= 1;
    }

    // Draw the vertical grid lines.
    for (let x = rgn.x, i = 0; i < n; ++i) {
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
   * Draw the body selections for the data grid.
   */
  private _drawBodySelections(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there are no selections.
    if (!model || model.isEmpty) {
      return;
    }

    // Fetch the selection colors.
    let fill = this._style.selectionFillColor;
    let stroke = this._style.selectionBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch the scroll geometry.
    let sx = this._scrollX;
    let sy = this._scrollY;

    // Get the first visible cell of the grid.
    let r1 = this._rowSections.indexOf(sy);
    let c1 = this._columnSections.indexOf(sx);

    // Bail early if there are no visible cells.
    if (r1 < 0 || c1 < 0) {
      return;
    }

    // Fetch the extra geometry.
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
    let pw = this.pageWidth;
    let ph = this.pageHeight;
    let hw = this.headerWidth;
    let hh = this.headerHeight;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';
    let elc = em === 'last-column' || em === 'both';

    // Get the last visible cell of the grid.
    let r2 = this._rowSections.indexOf(sy + ph);
    let c2 = this._columnSections.indexOf(sx + pw);

    // Fetch the max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Clamp the last cell if the void space is visible.
    r2 = r2 < 0 ? maxRow : r2;
    c2 = c2 < 0 ? maxColumn : c2;

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the body clipping rect.
    gc.beginPath();
    gc.rect(hw, hh, pw, ph);
    gc.clip();

    // Set up the gc style.
    if (fill) {
      gc.fillStyle = fill;
    }
    if (stroke) {
      gc.strokeStyle = stroke;
      gc.lineWidth = 1;
    }

    // Iterate over the selections.
    let it = model.selections();
    let s: SelectionModel.Selection | undefined;
    while ((s = it.next()) !== undefined) {
      // Skip the section if it's not visible.
      if (s.r1 < r1 && s.r2 < r1) {
        continue;
      }
      if (s.r1 > r2 && s.r2 > r2) {
        continue
      }
      if (s.c1 < c1 && s.c2 < c1) {
        continue;
      }
      if (s.c1 > c2 && s.c2 > c2) {
        continue
      }

      // Clamp the cell to the model bounds.
      let sr1 = Math.max(0, Math.min(s.r1, maxRow));
      let sc1 = Math.max(0, Math.min(s.c1, maxColumn));
      let sr2 = Math.max(0, Math.min(s.r2, maxRow));
      let sc2 = Math.max(0, Math.min(s.c2, maxColumn));

      // Swap index order if needed.
      let tmp: number;
      if (sr1 > sr2) {
        tmp = sr1;
        sr1 = sr2;
        sr2 = tmp;
      }
      if (sc1 > sc2) {
        tmp = sc1;
        sc1 = sc2;
        sc2 = tmp;
      }

      // Convert to pixel coordinates.
      let x1 = this._columnSections.offsetOf(sc1) - sx + hw;
      let y1 = this._rowSections.offsetOf(sr1) - sy + hh;
      let x2 = this._columnSections.extentOf(sc2) - sx + hw;
      let y2 = this._rowSections.extentOf(sr2) - sy + hh;

      // Adjust the trailing X coordinate for column expansion.
      if (elc && pw > bw && sc2 === maxColumn) {
        x2 = hw + pw - 1;
      }

      // Adjust the trailing Y coordinate for row expansion.
      if (elr && ph > bh && sr2 === maxRow) {
        y2 = hh + ph - 1;
      }

      // Clamp the bounds to just outside of the clipping rect.
      x1 = Math.max(hw - 1, x1);
      y1 = Math.max(hh - 1, y1);
      x2 = Math.min(hw + pw + 1, x2);
      y2 = Math.min(hh + ph + 1, y2);

      // Skip zero sized ranges.
      if (x2 < x1 || y2 < y1) {
        continue;
      }

      // Fill the rect if needed.
      if (fill) {
        gc.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
      }

      // Stroke the rect if needed.
      if (stroke) {
        gc.strokeRect(x1 - .5, y1 - .5, x2 - x1 + 1, y2 - y1 + 1);
      }
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the row header selections for the data grid.
   */
  private _drawRowHeaderSelections(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there are no selections.
    if (!model || model.isEmpty) {
      return;
    }

    // Bail early if the row headers are not visible.
    if (this.headerWidth === 0 || this.pageHeight === 0) {
      return;
    }

    // Fetch the selection colors.
    let fill = this._style.headerSelectionFillColor;
    let stroke = this._style.headerSelectionBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch common geometry.
    let sy = this._scrollY;
    let bh = this.bodyHeight;
    let ph = this.pageHeight;
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let rs = this._rowSections;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the header clipping rect.
    gc.beginPath();
    gc.rect(0, hh, hw, ph);
    gc.clip();

    // Set up the gc style.
    if (fill) {
      gc.fillStyle = fill;
    }
    if (stroke) {
      gc.strokeStyle = stroke;
      gc.lineWidth = 1;
    }

    // Fetch the max row.
    let maxRow = rs.count - 1;

    // Fetch the visible rows.
    let r1 = rs.indexOf(sy);
    let r2 = rs.indexOf(sy + ph - 1);
    r2 = r2 < 0 ? maxRow : r2;

    // Iterate over the visible rows.
    for (let j = r1; j <= r2; ++j) {
      // Skip rows which aren't selected.
      if (!model.isRowSelected(j)) {
        continue;
      }

      // Get the dimensions of the row.
      let y = rs.offsetOf(j) - sy + hh;
      let h = rs.sizeOf(j);

      // Adjust the height for row expansion.
      if (elr && ph > bh && j === maxRow) {
        h = hh + ph - y;
      }

      // Skip zero sized rows.
      if (h === 0) {
        continue;
      }

      // Fill the rect if needed.
      if (fill) {
        gc.fillRect(0, y, hw, h);
      }

      // Draw the border if needed.
      if (stroke) {
        gc.beginPath();
        gc.moveTo(hw - .5, y - 1);
        gc.lineTo(hw - .5, y + h);
        gc.stroke();
      }
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the column header selections for the data grid.
   */
  private _drawColumnHeaderSelections(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there are no selections.
    if (!model || model.isEmpty) {
      return;
    }

    // Bail early if the column headers are not visible.
    if (this.headerHeight === 0 || this.pageWidth === 0) {
      return;
    }

    // Fetch the selection colors.
    let fill = this._style.headerSelectionFillColor;
    let stroke = this._style.headerSelectionBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch common geometry.
    let sx = this._scrollX;
    let bw = this.bodyWidth;
    let pw = this.pageWidth;
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let cs = this._columnSections;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elc = em === 'last-column' || em === 'both';

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the header clipping rect.
    gc.beginPath();
    gc.rect(hw, 0, pw, hh);
    gc.clip();

    // Set up the gc style.
    if (fill) {
      gc.fillStyle = fill;
    }
    if (stroke) {
      gc.strokeStyle = stroke;
      gc.lineWidth = 1;
    }

    // Fetch the max column.
    let maxCol = cs.count - 1;

    // Fetch the visible columns.
    let c1 = cs.indexOf(sx);
    let c2 = cs.indexOf(sx + pw - 1);
    c2 = c2 < 0 ? maxCol : c2;

    // Iterate over the visible columns.
    for (let i = c1; i <= c2; ++i) {
      // Skip columns which aren't selected.
      if (!model.isColumnSelected(i)) {
        continue;
      }

      // Get the dimensions of the column.
      let x = cs.offsetOf(i) - sx + hw;
      let w = cs.sizeOf(i);

      // Adjust the width for column expansion.
      if (elc && pw > bw && i === maxCol) {
        w = hw + pw - x;
      }

      // Skip zero sized columns.
      if (w === 0) {
        continue;
      }

      // Fill the rect if needed.
      if (fill) {
        gc.fillRect(x, 0, w, hh);
      }

      // Draw the border if needed.
      if (stroke) {
        gc.beginPath();
        gc.moveTo(x - 1, hh - .5);
        gc.lineTo(x + w, hh - .5);
        gc.stroke();
      }
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the overlay cursor for the data grid.
   */
  private _drawCursor(): void {
    // Fetch the selection model.
    let model = this._selectionModel;

    // Bail early if there is no cursor.
    if (!model || model.isEmpty || model.selectionMode !== 'cell') {
      return;
    }

    // Extract the style information.
    let fill = this._style.cursorFillColor;
    let stroke = this._style.cursorBorderColor;

    // Bail early if there is nothing to draw.
    if (!fill && !stroke) {
      return;
    }

    // Fetch the cursor location.
    let row = model.cursorRow;
    let column = model.cursorColumn;

    // Fetch the max row and column.
    let maxRow = this._rowSections.count - 1;
    let maxColumn = this._columnSections.count - 1;

    // Bail early if the cursor is out of bounds.
    if (row < 0 || row > maxRow) {
      return;
    }
    if (column < 0 || column > maxColumn) {
      return;
    }

    // Fetch geometry.
    let sx = this._scrollX;
    let sy = this._scrollY;
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;
    let pw = this.pageWidth;
    let ph = this.pageHeight;
    let hw = this.headerWidth;
    let hh = this.headerHeight;
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // Fetch the expansion flags.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';
    let elc = em === 'last-column' || em === 'both';

    // Get the cursor bounds in viewport coordinates.
    let x1 = this._columnSections.offsetOf(column) - sx + hw;
    let x2 = this._columnSections.extentOf(column) - sx + hw;
    let y1 = this._rowSections.offsetOf(row) - sy + hh;
    let y2 = this._rowSections.extentOf(row) - sy + hh;

    // Adjust the trailing X coordinate for an expanding last column.
    if (elc && pw > bw && column === maxColumn) {
      x2 = vw - 1;
    }

    // Adjust the trailing Y coordinate for an expanding last row.
    if (elr && ph > bh && row === maxRow) {
      y2 = vh - 1;
    }

    // Skip zero sized cursors.
    if (x2 < x1 || y2 < y1) {
      return;
    }

    // Bail early if the cursor is off the screen.
    if ((x1 - 1) >= vw || (y1 - 1) >= vh || (x2 + 1) < hw || (y2 + 1) < hh) {
      return;
    }

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the body clipping rect.
    gc.beginPath();
    gc.rect(hw, hh, pw, ph);
    gc.clip();

    // Clear any existing overlay content.
    gc.clearRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);

    // Fill the cursor rect if needed.
    if (fill) {
      // Set up the fill style.
      gc.fillStyle = fill;

      // Fill the cursor rect.
      gc.fillRect(x1, y1, x2 - x1 + 1, y2 - y1 + 1)
    }

    // Stroke the cursor border if needed.
    if (stroke) {
      // Set up the stroke style.
      gc.strokeStyle = stroke;
      gc.lineWidth = 2;

      // Stroke the cursor rect.
      gc.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the overlay shadows for the data grid.
   */
  private _drawShadows(): void {
    // Fetch the scroll shadow from the style.
    let shadow = this._style.scrollShadow;

    // Bail early if there is no shadow to draw.
    if (!shadow) {
      return;
    }

    // Fetch the scroll position.
    let sx = this._scrollX;
    let sy = this._scrollY;

    // Fetch maximum scroll position.
    let sxMax = this.maxScrollX;
    let syMax = this.maxScrollY;

    // Fetch the header width and height.
    let hw = this.headerWidth;
    let hh = this.headerHeight;

    // Fetch the page width and height.
    let pw = this.pageWidth;
    let ph = this.pageHeight;

    // Fetch the viewport width and height.
    let vw = this._viewportWidth;
    let vh = this._viewportHeight;

    // Fetch the body width and height.
    let bw = this.bodyWidth;
    let bh = this.bodyHeight;

    // Fetch the expansion mode.
    let em = this._expansionMode;
    let elr = em === 'last-row' || em === 'both';
    let elc = em === 'last-column' || em === 'both';

    // Adjust the body size for row and column expansion.
    if (elr && ph > bh) {
      bh = ph;
    }
    if (elc && pw > bw) {
      bw = pw;
    }

    // Fetch the gc object.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Draw the column header shadow if needed.
    if (sy > 0) {
      // Set up the gradient coordinates.
      let x0 = 0;
      let y0 = hh;
      let x1 = 0;
      let y1 = y0 + shadow.size;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = 0;
      let y = hh;
      let w = hw + Math.min(pw, bw - sx);
      let h = shadow.size;

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the row header shadow if needed.
    if (sx > 0) {
      // Set up the gradient coordinates.
      let x0 = hw;
      let y0 = 0;
      let x1 = x0 + shadow.size;
      let y1 = 0;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = hw;
      let y = 0;
      let w = shadow.size;
      let h = hh + Math.min(ph, bh - sy);

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the column footer shadow if needed.
    if (sy < syMax) {
      // Set up the gradient coordinates.
      let x0 = 0;
      let y0 = vh;
      let x1 = 0;
      let y1 = vh - shadow.size;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = 0;
      let y = vh - shadow.size;
      let w = hw + Math.min(pw, bw - sx);
      let h = shadow.size;

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the row footer shadow if needed.
    if (sx < sxMax) {
      // Set up the gradient coordinates.
      let x0 = vw;
      let y0 = 0;
      let x1 = vw - shadow.size;
      let y1 = 0;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = vw - shadow.size;
      let y = 0;
      let w = shadow.size;
      let h = hh + Math.min(ph, bh - sy);

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Restore the gc state.
    gc.restore();
  }

  private _viewport: Widget;
  private _vScrollBar: ScrollBar;
  private _hScrollBar: ScrollBar;
  private _scrollCorner: Widget;

  private _scrollX = 0;
  private _scrollY = 0;
  private _viewportWidth = 0;
  private _viewportHeight = 0;

  private _mousedown = false;
  private _keyHandler: DataGrid.IKeyHandler | null = null;
  private _mouseHandler: DataGrid.IMouseHandler | null = null;

  private _vScrollBarMinWidth = 0;
  private _hScrollBarMinHeight = 0;
  private _dpiRatio = Math.ceil(window.devicePixelRatio);

  private _canvas: HTMLCanvasElement;
  private _buffer: HTMLCanvasElement;
  private _overlay: HTMLCanvasElement;
  private _canvasGC: CanvasRenderingContext2D;
  private _bufferGC: CanvasRenderingContext2D;
  private _overlayGC: CanvasRenderingContext2D;

  private _rowSections: SectionList;
  private _columnSections: SectionList;
  private _rowHeaderSections: SectionList;
  private _columnHeaderSections: SectionList;

  private _dataModel: DataModel | null = null;
  private _selectionModel: SelectionModel | null = null;

  private _style: DataGrid.Style;
  private _cellRenderers: RendererMap;
  private _defaultRenderer: CellRenderer;
  private _copyConfig: DataGrid.CopyConfig;
  private _expansionMode: DataGrid.ExpansionMode;
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

    /**
     * The fill color for a selection.
     */
    readonly selectionFillColor?: string;

    /**
     * The border color for a selection.
     */
    readonly selectionBorderColor?: string;

    /**
     * The fill color for the cursor.
     */
    readonly cursorFillColor?: string;

    /**
     * The border color for the cursor.
     */
    readonly cursorBorderColor?: string;

    /**
     * The fill color for a header selection.
     */
    readonly headerSelectionFillColor?: string;

    /**
     * The border color for a header selection.
     */
    readonly headerSelectionBorderColor?: string;

    /**
     * The drop shadow effect when the grid is scrolled.
     */
    readonly scrollShadow?: {
      /**
       * The size of the shadow, in pixels.
       */
      readonly size: number;

      /**
       * The first color stop for the shadow.
       */
      readonly color1: string;

      /**
       * The second color stop for the shadow.
       */
      readonly color2: string;

      /**
       * The third color stop for the shadow.
       */
      readonly color3: string;
    };
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
   * A type alias for the expansion mode of the data grid.
   */
  export
  type ExpansionMode = 'none' | 'last-row' | 'last-column' | 'both';

  /**
   * A type alias for the arguments to a copy format function.
   */
  export
  type CopyFormatArgs = {
    /**
     * The cell region for the value.
     */
    region: DataModel.CellRegion;

    /**
     * The row index of the value.
     */
    row: number;

    /**
     * The column index of the value.
     */
    column: number;

    /**
     * The value of the cell.
     */
    value: any;

    /**
     * The metadata for the column.
     */
    metadata: DataModel.Metadata;
  };

  /**
   * A type alias for a copy format function.
   */
  export
  type CopyFormatFunc = (args: CopyFormatArgs) => string;

  /**
   * A type alias for the data grid copy config.
   */
  export
  type CopyConfig = {
    /**
     * The separator to use between values.
     */
    readonly separator: string;

    /**
     * The headers to included in the copied output.
     */
    readonly headers: 'none' | 'row' | 'column' | 'all';

    /**
     * The function for formatting the data values.
     */
    readonly format: CopyFormatFunc;

    /**
     * The cell count threshold for a copy to be considered "large".
     */
    readonly warningThreshold: number;
  };

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

    /**
     * The copy configuration data for the grid.
     *
     * The default is `DataGrid.defaultCopyConfig`.
     */
    copyConfig?: CopyConfig;

    /**
     * The expansion mode for the data grid.
     *
     * The default is `'none'`.
     */
    expansionMode?: ExpansionMode;
  }

  /**
   * An object which handles keydown events for the data grid.
   */
  export
  interface IKeyHandler extends IDisposable {
    /**
     * Handle the key down event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The keydown event of interest.
     *
     * #### Notes
     * This will not be called if the mouse button is pressed.
     */
    onKeyDown(grid: DataGrid, event: KeyboardEvent): void;
  }

  /**
   * An object which handles mouse events for the data grid.
   */
  export
  interface IMouseHandler extends IDisposable {
    /**
     * Release any resources acquired during a mouse press.
     *
     * #### Notes
     * This method is called when the mouse should be released
     * independent of a mouseup event, such as an early detach.
     */
    release(): void;

    /**
     * Handle the mouse hover event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse hover event of interest.
     */
    onMouseHover(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse leave event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse hover event of interest.
     */
    onMouseLeave(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse down event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse down event of interest.
     */
    onMouseDown(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse move event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse move event of interest.
     */
    onMouseMove(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the mouse up event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The mouse up event of interest.
     */
    onMouseUp(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the context menu event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The context menu event of interest.
     */
    onContextMenu(grid: DataGrid, event: MouseEvent): void;

    /**
     * Handle the wheel event for the data grid.
     *
     * @param grid - The data grid of interest.
     *
     * @param event - The wheel event of interest.
     */
    onWheel(grid: DataGrid, event: WheelEvent): void;
  }

  /**
   * An object which holds the result of a grid hit test.
   */
  export
  type HitTestResult = {
    /**
     * The region of the data grid that was hit.
     */
    readonly region: DataModel.CellRegion | 'void';

    /**
     * The row index of the cell that was hit.
     *
     * This is `-1` for the `void` region.
     */
    readonly row: number;

    /**
     * The column index of the cell that was hit.
     *
     * This is `-1` for the `void` region.
     */
    readonly column: number;

    /**
     * The X coordinate of the mouse in cell coordinates.
     *
     * This is `-1` for the `void` region.
     */
    readonly x: number;

    /**
     * The Y coordinate of the mouse in cell coordinates.
     *
     * This is `-1` for the `void` region.
     */
    readonly y: number;

    /**
     * The width of the cell.
     *
     * This is `-1` for the `void` region.
     */
    readonly width: number;

    /**
     * The height of the cell.
     *
     * This is `-1` for the `void` region.
     */
    readonly height: number;
  };

  /**
   * A generic format function for the copy handler.
   *
   * @param args - The format args for the function.
   *
   * @returns The string representation of the value.
   *
   * #### Notes
   * This function uses `String()` to coerce values to a string.
   */
  export
  function copyFormatGeneric(args: CopyFormatArgs): string {
    if (args.value === null || args.value === undefined) {
      return '';
    }
    return String(args.value);
  }

  /**
   * The default theme for a data grid.
   */
  export
  const defaultStyle: Style = {
    voidColor: '#F3F3F3',
    backgroundColor: '#FFFFFF',
    gridLineColor: 'rgba(20, 20, 20, 0.15)',
    headerBackgroundColor: '#F3F3F3',
    headerGridLineColor: 'rgba(20, 20, 20, 0.25)',
    selectionFillColor: 'rgba(49, 119, 229, 0.2)',
    selectionBorderColor: 'rgba(0, 107, 247, 1.0)',
    cursorBorderColor: 'rgba(0, 107, 247, 1.0)',
    headerSelectionFillColor: 'rgba(20, 20, 20, 0.1)',
    headerSelectionBorderColor: 'rgba(0, 107, 247, 1.0)',
    scrollShadow: {
      size: 10,
      color1: 'rgba(0, 0, 0, 0.20',
      color2: 'rgba(0, 0, 0, 0.05',
      color3: 'rgba(0, 0, 0, 0.00' }
  };

  /**
   * The default sizes for a data grid.
   */
  export
  const defaultSizes: DefaultSizes = {
    rowHeight: 20,
    columnWidth: 64,
    rowHeaderWidth: 64,
    columnHeaderHeight: 20
  };

  /**
   * The default copy config for a data grid.
   */
  export
  const defaultCopyConfig: CopyConfig = {
    separator: '\t',
    format: copyFormatGeneric,
    headers: 'none',
    warningThreshold: 1e6
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
   * A singleton `overlay-paint-request` conflatable message.
   */
  export
  const OverlayPaintRequest = new ConflatableMessage('overlay-paint-request');

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
   * Clamp a section size to the limits.
   */
  export
  function clampSectionSize(size: number): number {
    return Math.max(10, Math.floor(size));
  }

  /**
   * An object which represents a region to be painted.
   */
  export
  type PaintRegion = {
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
  };

  /**
   * A conflatable message which merges dirty paint regions.
   */
  export
  class PaintRequest extends ConflatableMessage {
    /**
     * Construct a new paint request messages.
     *
     * @param region - The cell region for the paint.
     *
     * @param r1 - The top-left row of the dirty region.
     *
     * @param c1 - The top-left column of the dirty region.
     *
     * @param r2 - The bottom-right row of the dirty region.
     *
     * @param c2 - The bottom-right column of the dirty region.
     */
    constructor(region: DataModel.CellRegion | 'all', r1: number, c1: number, r2: number, c2: number) {
      super('paint-request');
      this._region = region;
      this._r1 = r1;
      this._c1 = c1;
      this._r2 = r2;
      this._c2 = c2;
    }

    /**
     * The cell region for the paint.
     */
    get region(): DataModel.CellRegion | 'all' {
      return this._region;
    }

    /**
     * The top-left row of the dirty region.
     */
    get r1(): number {
      return this._r1;
    }

    /**
     * The top-left column of the dirty region.
     */
    get c1(): number {
      return this._c1;
    }

    /**
     * The bottom-right row of the dirty region.
     */
    get r2(): number {
      return this._r2;
    }

    /**
     * The bottom-right column of the dirty region.
     */
    get c2(): number {
      return this._c2;
    }

    /**
     * Conflate this message with another paint request.
     */
    conflate(other: PaintRequest): boolean {
      // Bail early if the request is already painting everything.
      if (this._region === 'all') {
        return true;
      }

      // Any region can conflate with the `'all'` region.
      if (other._region === 'all') {
        this._region = 'all';
        return true;
      }

      // Otherwise, do not conflate with a different region.
      if (this._region !== other._region) {
        return false;
      }

      // Conflate the region to the total boundary.
      this._r1 = Math.min(this._r1, other._r1);
      this._c1 = Math.min(this._c1, other._c1);
      this._r2 = Math.max(this._r2, other._r2);
      this._c2 = Math.max(this._c2, other._c2);
      return true;
    }

    private _region: DataModel.CellRegion | 'all';
    private _r1: number;
    private _c1: number;
    private _r2: number;
    private _c2: number;
  }

  /**
   * A conflatable message for resizing rows.
   */
  export
  class RowResizeRequest extends ConflatableMessage {
    /**
     * Construct a new row resize request.
     *
     * @param region - The row region which holds the section.
     *
     * @param index - The index of row in the region.
     *
     * @param size - The target size of the section.
     */
    constructor(region: DataModel.RowRegion, index: number, size: number) {
      super('row-resize-request');
      this._region = region;
      this._index = index;
      this._size = size;
    }

    /**
     * The row region which holds the section.
     */
    get region(): DataModel.RowRegion {
      return this._region;
    }

    /**
     * The index of the row in the region.
     */
    get index(): number {
      return this._index;
    }

    /**
     * The target size of the section.
     */
    get size(): number {
      return this._size;
    }

    /**
     * Conflate this message with another row resize request.
     */
    conflate(other: RowResizeRequest): boolean {
      if (this._region !== other._region || this._index !== other._index) {
        return false;
      }
      this._size = other._size;
      return true;
    }

    private _region: DataModel.RowRegion;
    private _index: number;
    private _size: number;
  }

  /**
   * A conflatable message for resizing columns.
   */
  export
  class ColumnResizeRequest extends ConflatableMessage {
    /**
     * Construct a new column resize request.
     *
     * @param region - The column region which holds the section.
     *
     * @param index - The index of column in the region.
     *
     * @param size - The target size of the section.
     */
    constructor(region: DataModel.ColumnRegion, index: number, size: number) {
      super('column-resize-request');
      this._region = region;
      this._index = index;
      this._size = size;
    }

    /**
     * The column region which holds the section.
     */
    get region(): DataModel.ColumnRegion {
      return this._region;
    }

    /**
     * The index of the column in the region.
     */
    get index(): number {
      return this._index;
    }

    /**
     * The target size of the section.
     */
    get size(): number {
      return this._size;
    }

    /**
     * Conflate this message with another column resize request.
     */
    conflate(other: ColumnResizeRequest): boolean {
      if (this._region !== other._region || this._index !== other._index) {
        return false;
      }
      this._size = other._size;
      return true;
    }

    private _region: DataModel.ColumnRegion;
    private _index: number;
    private _size: number;
  }
}
