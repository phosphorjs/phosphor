/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2019, PhosphorJS Contributors
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
    this._headerVisibility = options.headerVisibility || 'all';
    this._behaviors = options.behaviors || DataGrid.defaultBehaviors;
    this._cellRenderers = options.cellRenderers || new RendererMap();
    this._defaultRenderer = options.defaultRenderer || new TextRenderer();

    // Connect to the renderer map changed signal
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

    // Release the mouse.
    this._releaseMouse();

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

    // Release the mouse.
    this._releaseMouse();

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

    // Release the mouse.
    this._releaseMouse();

    // Sync the viewport.
    this._syncViewport();
  }

  /**
   * Get the behaviors for the data grid.
   */
  get behaviors(): DataGrid.Behaviors {
    return this._behaviors;
  }

  /**
   * Set the behaviors for the data grid.
   */
  set behaviors(value: DataGrid.Behaviors) {
    // Update the internal behaviors.
    this._behaviors = { ...value };

    // Release the mouse.
    this._releaseMouse();
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
    case 'mousemove':
      this._evtMouseMove(event as MouseEvent);
      break;
    case 'mousein':
      this._evtMouseIn(event as MouseEvent);
      break;
    case 'mouseout':
      this._evtMouseOut(event as MouseEvent);
      break;
    case 'mousedown':
      this._evtMouseDown(event as MouseEvent);
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
    case 'resize':
      this._refreshDPI();
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
    this._viewport.node.addEventListener('mousedown', this);
    this._viewport.node.addEventListener('mousemove', this);
    this._viewport.node.addEventListener('mousein', this);
    this._viewport.node.addEventListener('mouseout', this);
    this.node.addEventListener('wheel', this);
    window.addEventListener('resize', this);
    this._repaintContent();
    this._repaintOverlay();
  }

  /**
   * A message handler invoked on an `'after-detach'` message.
   */
  protected onAfterDetach(msg: Message): void {
    this._viewport.node.removeEventListener('mousedown', this);
    this._viewport.node.removeEventListener('mousemove', this);
    this._viewport.node.removeEventListener('mousein', this);
    this._viewport.node.removeEventListener('mouseout', this);
    this.node.removeEventListener('wheel', this);
    window.removeEventListener('resize', this);
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
      this._bufferGC.clearRect(0, 0, this._buffer.width, this._buffer.height);
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
      this._bufferGC.clearRect(0, 0, this._buffer.width, this._buffer.height);
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
    this._repaintContent();
    this._repaintOverlay();
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
    case 'overlay-paint-request':
      this._onViewportOverlayPaintRequest(msg);
      break;
    case 'section-resize-request':
      this._onViewportSectionResizeRequest(msg);
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

    // Paint the overlay immediately.
    this._paintOverlay();

    // Bail early if there is no dirty region.
    if (right <= 0 && bottom <= 0) {
      return;
    }

    // Paint the whole grid if the old size was zero.
    if (oldWidth === 0 || oldHeight === 0) {
      this._paintContent(0, 0, width, height);
      return;
    }

    // Paint the dirty region to the right, if needed.
    if (right > 0) {
      this._paintContent(oldWidth, 0, right, height);
    }

    // Paint the dirty region to the bottom, if needed.
    if (bottom > 0 && width > right) {
      this._paintContent(0, oldHeight, width - right, bottom);
    }
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
    let hw = this._headerWidth;
    let hh = this._headerHeight;

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
   * A message hook invoked on a viewport `'section-resize-request'` message.
   */
  private _onViewportSectionResizeRequest(msg: Message): void {
    // Bail early if no drag is in progress.
    if (!this._pressData) {
      return;
    }

    // Extract the press data.
    let { hitTest, clientX, clientY } = this._pressData;

    // Convert the mouse position to local coordinates.
    let rect = this._viewport.node.getBoundingClientRect();
    let x = clientX - rect.left;
    let y = clientY - rect.top;

    // Fetch the details for the hit test part.
    let pos: number;
    let delta: number;
    let index: number;
    let list: SectionList;
    switch (hitTest.part) {
    case 'column-header-h-resize-handle':
      pos = x + this._scrollX - this._headerWidth;
      delta = hitTest.x;
      index = hitTest.column;
      list = this._columnSections;
      break;
    case 'row-header-v-resize-handle':
      pos = y + this._scrollY - this._headerHeight;
      delta = hitTest.y;
      index = hitTest.row;
      list = this._rowSections;
      break;
    case 'column-header-v-resize-handle':
    case 'corner-header-v-resize-handle':
      pos = y;
      delta = hitTest.y;
      index = hitTest.row;
      list = this._columnHeaderSections;
      break;
    case 'row-header-h-resize-handle':
    case 'corner-header-h-resize-handle':
      pos = x;
      delta = hitTest.x;
      index = hitTest.column;
      list = this._rowHeaderSections;
      break;
    default:
      return;
    }

    // Fetch the offset of the section to resize.
    let offset = list.offsetOf(index);

    // Bail if that section no longer exists.
    if (offset < 0) {
      return;
    }

    // Resize the section to the target size.
    this._resizeSection(list, index, pos - delta - offset);
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
    if (this._scrollY === this._maxScrollY) {
      list.insert(index, span);
      this._scrollY = this._maxScrollY;
    } else {
      list.insert(index, span);
    }

    // Schedule a repaint of the content.
    this._repaintContent();

    // Schedule a repaint of the overlay.
    this._repaintOverlay();

    // Sync the scroll state after queueing the repaint.
    this._syncScrollState();
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
    if (this._scrollX === this._maxScrollX) {
      list.insert(index, span);
      this._scrollX = this._maxScrollX;
    } else {
      list.insert(index, span);
    }

    // Schedule a repaint of the content.
    this._repaintContent();

    // Schedule a repaint of the overlay.
    this._repaintOverlay();

    // Sync the scroll state after queueing the repaint.
    this._syncScrollState();
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
    if (this._scrollY === this._maxScrollY) {
      list.remove(index, span);
      this._scrollY = this._maxScrollY;
    } else {
      list.remove(index, span);
    }

    // Schedule a repaint of the content.
    this._repaintContent();

    // Schedule a repaint of the overlay.
    this._repaintOverlay();

    // Sync the scroll state after queueing the repaint.
    this._syncScrollState();
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
    if (this._scrollX === this._maxScrollX) {
      list.remove(index, span);
      this._scrollX = this._maxScrollX;
    } else {
      list.remove(index, span);
    }

    // Schedule a repaint of the content.
    this._repaintContent();

    // Schedule a repaint of the overlay.
    this._repaintOverlay();

    // Sync the scroll state after queueing the repaint.
    this._syncScrollState();
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
    let { region, rowIndex, columnIndex, rowSpan, columnSpan } = args;

    // Bail early if there are no cells to modify.
    if (rowSpan <= 0 && columnSpan <= 0) {
      return;
    }

    // Compute the changed cell bounds.
    let r1 = rowIndex;
    let c1 = columnIndex;
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
    this._repaintContent();
  }

  /**
   * Handle the `'mousedown'` event for the data grid.
   */
  private _evtMouseDown(event: MouseEvent): void {
    // Do nothing if the left mouse button is not pressed.
    if (event.button !== 0) {
      return;
    }

    // Bail early if the alt key is held.
    // TODO - support cell-level events with alt key
    if (event.altKey) {
      return;
    }

    // Extract the relevant event data.
    let { clientX, clientY, ctrlKey, shiftKey } = event;

    // Hit test the viewport.
    let hitTest = this._hitTest(clientX, clientY);

    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Clear the viewport cursor.
    this._viewport.node.style.cursor = '';

    // Fetch the mouse cursor.
    let cursor = Private.cursorForPart(hitTest.part);

    // Override the document cursor.
    let override = Drag.overrideCursor(cursor);

    // Set up the transient selection.
    let selection: SelectionModel.Region | null = null;

    // Handle the mouse selection if needed.
    if (this._selectionModel) {
      // Convert the hit test into a selection region.
      switch (hitTest.part) {
      case 'body-cell':
        selection = new SelectionModel.Region(hitTest.row, hitTest.column, 1, 1);
        break;
      case 'column-header-cell':
        selection = new SelectionModel.Region(0, hitTest.column, Infinity, 1);
        break;
      case 'row-header-cell':
        selection = new SelectionModel.Region(hitTest.row, 0, 1, Infinity);
        break;
      }
    }

    //
    if (selection) {
      this._repaintOverlay();
    }

    //
    if (selection && (!ctrlKey || shiftKey)) {
      this._selectionModel!.clear();
    }

    // //
    // if (selection && shiftKey) {

    // }

    // Set up the press data.
    this._pressData = {
      hitTest,
      clientX,
      clientY,
      ctrlKey,
      shiftKey,
      override,
      selection
    };

    // Add the extra document listeners.
    document.addEventListener('mousemove', this, true);
    document.addEventListener('mouseup', this, true);
    document.addEventListener('keydown', this, true);
    document.addEventListener('contextmenu', this, true);
  }

  /**
   * Handle the `'mouseup'` event for the data grid.
   */
  private _evtMouseUp(event: MouseEvent): void {
    // Bail early if a press is not in progress.
    if (!this._pressData) {
      return;
    }

    // Do nothing if the left mouse button is not released.
    if (event.button !== 0) {
      return;
    }

    // Stop the event when releasing the mouse.
    event.preventDefault();
    event.stopPropagation();

    //
    let model = this._selectionModel;
    let selection = this._pressData.selection;

    //
    if (model && selection) {
      model.select(selection);
    }

    // Finalize the mouse release.
    this._releaseMouse();

    // TODO - test for viewport hover?
  }

  /**
   * Handle the `'mousemove'` event for the data grid.
   */
  private _evtMouseMove(event: MouseEvent): void {
    // Stop the event propagation.
    event.preventDefault();
    event.stopPropagation();

    // Handle the hover behavior if a drag is not in progress.
    if (!this._pressData) {
      // Hit test the viewport.
      let hitTest = this._hitTest(event.clientX, event.clientY);

      // Fetch the mouse cursor.
      let cursor = Private.cursorForPart(hitTest.part);

      // Apply the cursor to the viewport.
      this._viewport.node.style.cursor = cursor;

      // Done
      return;
    }

    if (this._pressData.selection) {
      this._repaintOverlay();
    }

    // Update the press data with the current mouse position.
    this._pressData.clientX = event.clientX;
    this._pressData.clientY = event.clientY;

    // Dispatch the behavior based on the hit test part.
    switch (this._pressData.hitTest.part) {
    case 'row-header-h-resize-handle':
    case 'row-header-v-resize-handle':
    case 'column-header-h-resize-handle':
    case 'column-header-v-resize-handle':
    case 'corner-header-h-resize-handle':
    case 'corner-header-v-resize-handle':
      // Post a section resize request to prevent mouse event flooding.
      MessageLoop.postMessage(this._viewport, Private.SectionResizeRequest);
      break;
    }
  }

  /**
   * Handle the `'mousein'` event for the data grid.
   */
  private _evtMouseIn(event: MouseEvent): void {
    // Ignore the event when dragging.
    if (this._pressData) {
      return;
    }

    // Otherwise, treat the event the same as a mouse move.
    this._evtMouseMove(event);
  }

  /**
   * Handle the `'mouseout'` event for the data grid.
   */
  private _evtMouseOut(event: MouseEvent): void {
    // Ignore the event when dragging.
    if (this._pressData) {
      return;
    }

    // Otherwise, clear the viewport cursor.
    this._viewport.node.style.cursor = '';
  }

  /**
   * Handle the `'wheel'` event for the data grid.
   */
  private _evtWheel(event: WheelEvent): void {
    // TODO handle wheel while dragging.
    if (this._pressData) {
      return;
    }

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
   * Handle the `'keydown'` event for the data grid.
   */
  private _evtKeyDown(event: KeyboardEvent): void {
    // Bail early if a drag is not in progress.
    if (!this._pressData) {
      return;
    }

    // Stop input events during drag.
    event.preventDefault();
    event.stopPropagation();

    // Release the mouse if `Escape` is pressed.
    if (event.keyCode === 27) {
      this._releaseMouse();
    }
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

    // Schedule a repaint of the overlay.
    // TODO - right place for this?
    this._repaintOverlay();

    // Remove the extra document listeners.
    document.removeEventListener('mousemove', this, true);
    document.removeEventListener('mouseup', this, true);
    document.removeEventListener('keydown', this, true);
    document.removeEventListener('contextmenu', this, true);
  }

  /**
   * Hit test the viewport for the given client position.
   *
   * The client position must be within the viewport bounds.
   */
  private _hitTest(clientX: number, clientY: number): Private.HitTestResult {
    // Fetch the viewport rect.
    let rect = this._viewport.node.getBoundingClientRect();

    // Extract the rect coordinates.
    let { left, top, right, bottom } = rect;

    // Round the rect coordinates for sub-pixel positioning.
    left = Math.floor(left);
    top = Math.floor(top);
    right = Math.ceil(right);
    bottom = Math.ceil(bottom);

    // Bail early if the position is out of the viewport bounds.
    if (clientX < left || clientY < top) {
      throw '_hitTest() out of bounds';
    }
    if (clientX > right || clientY > bottom) {
      throw '_hitTest() out of bounds';
    }

    // Convert the mouse position into local coordinates.
    let lx = clientX - left;
    let ly = clientY - top;

    // Fetch the header and body dimensions.
    let hw = this._headerWidth;
    let hh = this._headerHeight;
    let bw = this._bodyWidth;
    let bh = this._bodyHeight;

    // Fetch the behaviors flags
    let rr = this._behaviors.resizableRows;
    let rc = this._behaviors.resizableColumns;
    let rrh = this._behaviors.resizableRowHeaders;
    let rch = this._behaviors.resizableColumnHeaders;

    // Fetch the size constants.
    let lrw = Private.LEADING_RESIZE_WIDTH;
    let trw = Private.TRAILING_RESIZE_WIDTH;

    // Check for a corner header hit.
    if (lx < hw && ly < hh) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx;
      let vy = ly;

      // Fetch the row and column index.
      let row = this._columnHeaderSections.indexOf(vy);
      let column = this._rowHeaderSections.indexOf(vx);

      // Fetch the cell offset position.
      let ox = this._rowHeaderSections.offsetOf(column);
      let oy = this._columnHeaderSections.offsetOf(row);

      // Fetch cell width and height.
      let w = this._rowHeaderSections.sizeOf(column);
      let h = this._columnHeaderSections.sizeOf(row);

      // Compute the leading and trailing positions.
      let x1 = vx - ox;
      let y1 = vy - oy;
      let x2 = ox + w - vx - 1;
      let y2 = oy + h - vy - 1;

      // Compute the hit test part and coordinates.
      let x: number;
      let y: number;
      let part: Private.HitTestPart;
      if (rrh && (column > 0 && x1 < lrw)) {
        part = 'corner-header-h-resize-handle';
        column--;
        x = x1;
        y = y1;
      } else if (rrh && (x2 < trw)) {
        part = 'corner-header-h-resize-handle';
        x = -x2;
        y = y1;
      } else if (rch && (row > 0 && y1 < lrw)) {
        part = 'corner-header-v-resize-handle';
        row--;
        x = x1;
        y = y1;
      } else if (rch && (y2 < trw)) {
        part = 'corner-header-v-resize-handle';
        x = x1;
        y = -y2;
      } else {
        part = 'corner-header-cell';
        x = x1;
        y = y1;
      }

      // Return the result.
      return { part, row, column, x, y };
    }

    // Check for a column header hit.
    if (ly < hh && lx < (hw + bw)) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx + this._scrollX - hw;
      let vy = ly

      // Fetch the row and column index.
      let row = this._columnHeaderSections.indexOf(vy);
      let column = this._columnSections.indexOf(vx);

      // Fetch the cell offset position.
      let ox = this._columnSections.offsetOf(column);
      let oy = this._columnHeaderSections.offsetOf(row);

      // Fetch the cell width and height.
      let w = this._columnSections.sizeOf(column);
      let h = this._columnHeaderSections.sizeOf(row);

      // Compute the leading and trailing positions.
      let x1 = vx - ox;
      let y1 = vy - oy;
      let x2 = ox + w - vx - 1;
      let y2 = oy + h - vy - 1;

      // Compute the hit test part and coordinates.
      let x: number;
      let y: number;
      let part: Private.HitTestPart;
      if (rc && (column > 0 && x1 < lrw)) {
        part = 'column-header-h-resize-handle';
        column--;
        x = x1;
        y = y1;
      } else if (rc && (x2 < trw)) {
        part = 'column-header-h-resize-handle';
        x = -x2;
        y = y1;
      } else if (rch && (row > 0 && y1 < lrw)) {
        part = 'column-header-v-resize-handle';
        row--;
        x = x1;
        y = y1;
      } else if (rch && (y2 < trw)) {
        part = 'column-header-v-resize-handle';
        x = x1;
        y = -y2;
      } else {
        part = 'column-header-cell';
        x = x1;
        y = y1;
      }

      // Return the result.
      return { part, row, column, x, y };
    }

    // Check for a row header hit.
    if (lx < hw && ly < (hh + bh)) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx
      let vy = ly + this._scrollY - hh;

      // Fetch the row and column index.
      let row = this._rowSections.indexOf(vy);
      let column = this._rowHeaderSections.indexOf(vx);

      // Fetch the cell offset position.
      let ox = this._rowHeaderSections.offsetOf(column);
      let oy = this._rowSections.offsetOf(row);

      // Fetch the cell width and height.
      let w = this._rowHeaderSections.sizeOf(column);
      let h = this._rowSections.sizeOf(row);

      // Compute the leading and trailing positions.
      let x1 = vx - ox;
      let y1 = vy - oy;
      let x2 = ox + w - vx - 1;
      let y2 = oy + h - vy - 1;

      // Compute the hit test part and coordinates.
      let x: number;
      let y: number;
      let part: Private.HitTestPart;
      if (rrh && (column > 0 && x1 < lrw)) {
        part = 'row-header-h-resize-handle';
        column--;
        x = x1;
        y = y1;
      } else if (rrh && (x2 < trw)) {
        part = 'row-header-h-resize-handle';
        x = -x2;
        y = y1;
      } else if (rr && (row > 0 && y1 < lrw)) {
        part = 'row-header-v-resize-handle';
        row--;
        x = x1;
        y = y1;
      } else if (rr && (y2 < trw)) {
        part = 'row-header-v-resize-handle';
        x = x1;
        y = -y2;
      } else {
        part = 'row-header-cell';
        x = x1;
        y = y1;
      }

      // Return the result.
      return { part, row, column, x, y };
    }

    // Check for a body hit.
    if (lx >= hw && lx < (hw + bw) && ly >= hh && ly < (hh + bh)) {
      // Convert to unscrolled virtual coordinates.
      let vx = lx + this._scrollX - hw
      let vy = ly + this._scrollY - hh;

      // Fetch the row and column index.
      let row = this._rowSections.indexOf(vy);
      let column = this._columnSections.indexOf(vx);

      // Fetch the cell offset position.
      let ox = this._rowHeaderSections.offsetOf(column);
      let oy = this._rowSections.offsetOf(row);

      // Compute the part coordinates.
      let x = vx - ox;
      let y = vy - oy;

      // Return the result.
      return { part: 'body-cell', row, column, x, y };
    }

    // Otherwise, it's a void space hit.
    return { part: 'void-space', row: -1, column: -1, x: -1, y: -1 };
  }

  /**
   * Resize a section in the given section list.
   *
   * #### Notes
   * This will update the scroll bars and repaint as needed.
   */
  private _resizeSection(list: SectionList, index: number, size: number): void {
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
    let vpWidth = this._viewportWidth;
    let vpHeight = this._viewportHeight;

    // If there is nothing to paint, sync the scroll state.
    if (!this._viewport.isVisible || vpWidth === 0 || vpHeight === 0) {
      this._syncScrollState();
      return;
    }

    // Paint the overlay.
    this._paintOverlay();

    // Compute the size delta.
    let delta = newSize - oldSize;

    // Paint the relevant dirty regions.
    switch (list) {
    case this._rowSections:
    {
      // Look up the column header height.
      let hh = this._headerHeight;

      // Compute the viewport offset of the section.
      let offset = list.offsetOf(index) + hh - this._scrollY;

      // Bail early if there is nothing to paint.
      if (hh >= vpHeight || offset > vpHeight) {
        break;
      }

      // Update the scroll position if the section is not visible.
      if (offset + oldSize <= hh) {
        this._scrollY += delta;
        break;
      }

      // Compute the paint origin of the section.
      let pos = Math.max(hh, offset);

      // Paint from the section onward if it spans the viewport.
      if (offset + oldSize >= vpHeight || offset + newSize >= vpHeight) {
        this._paintContent(0, pos, vpWidth, vpHeight - pos);
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
      if (offset + newSize <= hh) {
        sy = hh - delta;
        sh = vpHeight - sy;
        dy = hh;
      } else {
        sy = offset + oldSize;
        sh = vpHeight - sy;
        dy = sy + delta;
      }

      // Blit the valid content to the destination.
      this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

      // Repaint the section if needed.
      if (newSize > 0 && offset + newSize > hh) {
        this._paintContent(0, pos, vpWidth, offset + newSize - pos);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paintContent(0, vpHeight + delta, vpWidth, -delta);
      }

      // Done.
      break;
    }
    case this._columnSections:
    {
      // Look up the row header width.
      let hw = this._headerWidth;

      // Compute the viewport offset of the section.
      let offset = list.offsetOf(index) + hw - this._scrollX;

      // Bail early if there is nothing to paint.
      if (hw >= vpWidth || offset > vpWidth) {
        break;
      }

      // Update the scroll position if the section is not visible.
      if (offset + oldSize <= hw) {
        this._scrollX += delta;
        break;
      }

      // Compute the paint origin of the section.
      let pos = Math.max(hw, offset);

      // Paint from the section onward if it spans the viewport.
      if (offset + oldSize >= vpWidth || offset + newSize >= vpWidth) {
        this._paintContent(pos, 0, vpWidth - pos, vpHeight);
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
      if (offset + newSize <= hw) {
        sx = hw - delta;
        sw = vpWidth - sx;
        dx = hw;
      } else {
        sx = offset + oldSize;
        sw = vpWidth - sx;
        dx = sx + delta;
      }

      // Blit the valid content to the destination.
      this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

      // Repaint the section if needed.
      if (newSize > 0 && offset + newSize > hw) {
        this._paintContent(pos, 0, offset + newSize - pos, vpHeight);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paintContent(vpWidth + delta, 0, -delta, vpHeight);
      }

      // Done.
      break;
    }
    case this._rowHeaderSections:
    {
      // Look up the offset of the section.
      let offset = list.offsetOf(index);

      // Bail early if the section is fully outside the viewport.
      if (offset >= vpWidth) {
        break;
      }

      // Paint the entire tail if the section spans the viewport.
      if (offset + oldSize >= vpWidth || offset + newSize >= vpWidth) {
        this._paintContent(offset, 0, vpWidth - offset, vpHeight);
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
      this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

      // Repaint the header section if needed.
      if (newSize > 0) {
        this._paintContent(offset, 0, newSize, vpHeight);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paintContent(vpWidth + delta, 0, -delta, vpHeight);
      }

      // Done
      break;
    }
    case this._columnHeaderSections:
    {
      // Look up the offset of the section.
      let offset = list.offsetOf(index);

      // Bail early if the section is fully outside the viewport.
      if (offset >= vpHeight) {
        break;
      }

      // Paint the entire tail if the section spans the viewport.
      if (offset + oldSize >= vpHeight || offset + newSize >= vpHeight) {
        this._paintContent(0, offset, vpWidth, vpHeight - offset);
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
      this._blitContent(this._canvas, sx, sy, sw, sh, dx, dy);

      // Repaint the header section if needed.
      if (newSize > 0) {
        this._paintContent(0, offset, vpWidth, newSize);
      }

      // Paint the trailing space if needed.
      if (delta < 0) {
        this._paintContent(0, vpHeight + delta, vpWidth, -delta);
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

    // Draw the selections.
    this._drawSelections();

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
   * Draw the overlay selections for the data grid.
   */
  private _drawSelections(): void {
    // Bail early if there is no selection model.
    if (!this._selectionModel) {
      return;
    }

    // Bail early if the selection model is empty.
    if (this._selectionModel.isEmpty) {
      return;
    }

    // Get the first visible cell of the grid.
    let r1 = this._rowSections.indexOf(this._scrollY);
    let c1 = this._columnSections.indexOf(this._scrollX);

    // Bail early if there are no visible cells.
    if (r1 < 0 || c1 < 0) {
      return;
    }

    // Fetch the max row and column.
    let rMax = this._rowSections.count - 1;
    let cMax = this._columnSections.count - 1;

    // Get the last visible cell of the grid.
    let r2 = this._rowSections.indexOf(this._scrollY + this._pageHeight);
    let c2 = this._columnSections.indexOf(this._scrollX + this._pageWidth);

    // Clamp the last cell if the void space is visible.
    r2 = r2 < 0 ? rMax : r2;
    c2 = c2 < 0 ? cMax : c2;

    // Convert the boundary cells into a region.
    let bounds = new SelectionModel.Region(r1, c1, r2 - r1 + 1, c2 - c1 + 1);

    // Fetch the overlay gc.
    let gc = this._overlayGC;

    // Save the gc state.
    gc.save();

    // Set up the gc style.
    gc.fillStyle = 'rgba(0, 0, 255, 0.1)'; // TODO grid style
    gc.strokeStyle = 'rgb(0, 0, 255)';     // TODO grid style
    gc.lineWidth = 1;

    // Get the visible bounds of the grid body.
    let x = this._headerWidth;
    let y = this._headerHeight;
    let w = this._pageWidth;
    let h = this._pageHeight;

    // Set up the clipping rect.
    gc.beginPath();
    gc.rect(x, y, w, h);
    gc.clip();

    // Fetch the regions iterator.
    let it = this._selectionModel.regions();

    // Iterate over the selected regions.
    let region: SelectionModel.Region | undefined;
    while ((region = it.next()) !== undefined) {
      // Skip the region if it does not overlap the bounds.
      if (!region.overlaps(bounds)) {
        continue;
      }

      // Clamp the region to the limits.
      let r1 = Math.max(0, Math.min(region.row, rMax));
      let c1 = Math.max(0, Math.min(region.column, cMax));
      let r2 = Math.max(0, Math.min(region.lastRow, rMax));
      let c2 = Math.max(0, Math.min(region.lastColumn, cMax));

      // Get the origin point.
      let x1 = this._columnSections.offsetOf(c1);
      let y1 = this._rowSections.offsetOf(r1);

      // Get one pixel past the trailing point.
      let x2 = this._columnSections.offsetOf(c2);
      let y2 = this._rowSections.offsetOf(r2);
      x2 += this._columnSections.sizeOf(c2);
      y2 += this._rowSections.sizeOf(r2);

      // Offset the origin point by the scroll position.
      x1 -= this._scrollX - this._headerWidth;
      y1 -= this._scrollY - this._headerHeight;

      // Offset the trailing point by the scroll position.
      x2 -= this._scrollX - this._headerWidth;
      y2 -= this._scrollY - this._headerHeight;

      // Clamp the bounds to just outside of the clipping rect.
      // This prevents drawing issues when the virtual grid size
      // is large and entire rows or columns are selected.
      x1 = Math.max(x - 1, x1);
      y1 = Math.max(y - 1, y1);
      x2 = Math.min(x + w + 1, x2);
      y2 = Math.min(y + h + 1, y2);

      // Fill and stroke the rect for the selected region.
      gc.fillRect(x1, y1, x2 - x1, y2 - y1);
      gc.strokeRect(x1 - .5, y1 - .5, x2 - x1, y2 - y1);
    }

    // Restore the gc state.
    gc.restore();
  }

  /**
   * Draw the overlay cursor for the data grid.
   */
  private _drawCursor(): void {

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
    let sxx = this._hScrollBar.maximum;
    let syx = this._vScrollBar.maximum;

    // Fetch the header width and height.
    let hw = this._headerWidth;
    let hh = this._headerHeight;

    // Fetch the page width and height.
    let pw = this._pageWidth;
    let ph = this._pageHeight;

    // Fetch the virtual width and height.
    let vw = this._columnSections.length;
    let vh = this._rowSections.length;

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
      let w = hw + Math.min(pw, vw - sx);
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
      let h = hh + Math.min(ph, vh - sy);

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the column footer shadow if needed.
    if (sy < syx) {
      // Set up the gradient coordinates.
      let x0 = 0;
      let y0 = this._viewportHeight;
      let x1 = 0;
      let y1 = this._viewportHeight - shadow.size;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = 0;
      let y = this._viewportHeight - shadow.size;
      let w = hw + Math.min(pw, vw - sx);
      let h = shadow.size;

      // Fill the shadow rect with the fill style.
      gc.fillStyle = grad;
      gc.fillRect(x, y, w, h);
    }

    // Draw the row footer shadow if needed.
    if (sx < sxx) {
      // Set up the gradient coordinates.
      let x0 = this._viewportWidth;
      let y0 = 0;
      let x1 = x0 - shadow.size;
      let y1 = 0;

      // Create the gradient object.
      let grad = gc.createLinearGradient(x0, y0, x1, y1);

      // Set the gradient stops.
      grad.addColorStop(0, shadow.color1);
      grad.addColorStop(0.5, shadow.color2);
      grad.addColorStop(1, shadow.color3);

      // Set up the rect coordinates.
      let x = this._viewportWidth - shadow.size;
      let y = 0;
      let w = shadow.size;
      let h = hh + Math.min(ph, vh - sy);

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

  private _pressData: Private.PressData | null = null;
  private _dpiRatio = Math.ceil(window.devicePixelRatio);

  private _scrollX = 0;
  private _scrollY = 0;
  private _viewportWidth = 0;
  private _viewportHeight = 0;

  private _vScrollBarMinWidth = 0;
  private _hScrollBarMinHeight = 0;

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

  private _model: DataModel | null = null;
  private _selectionModel: SelectionModel | null = null;

  private _style: DataGrid.Style;
  private _cellRenderers: RendererMap;
  private _defaultRenderer: CellRenderer;
  private _behaviors: DataGrid.Behaviors;
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
   * An object which defines the behaviors of a data grid.
   */
  export
  type Behaviors = {
    /**
     * Whether rows are resizable by the user.
     */
    readonly resizableRows: boolean;

    /**
     * Whether columns are resizable by the user.
     */
    readonly resizableColumns: boolean;

    /**
     * Whether row header columns are resizable by the user.
     */
    readonly resizableRowHeaders: boolean;

    /**
     * Whether column header rows are resizable by the user.
     */
    readonly resizableColumnHeaders: boolean;

    // /**
    //  * Whether rows are movable by the user.
    //  */
    // readonly movableRows: boolean;

    // /**
    //  * Whether columns are movable by the user.
    //  */
    // readonly movableColumns: boolean;
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
     * The behaviors for the data grid.
     *
     * The default is `DataGrid.defaultBehaviors`.
     */
    behaviors?: Behaviors;

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
    headerGridLineColor: 'rgba(20, 20, 20, 0.25)',
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
  const defaultSizes: DataGrid.DefaultSizes = {
    rowHeight: 20,
    columnWidth: 64,
    rowHeaderWidth: 64,
    columnHeaderHeight: 20
  };

  /**
   * The default behaviors for the datagrid.
   */
  export
  const defaultBehaviors: DataGrid.Behaviors = {
    resizableRows: true,
    resizableColumns: true,
    resizableRowHeaders: true,
    resizableColumnHeaders: true
    // movableRows: true,
    // movableColumns: true
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
   * The minimum size for a section in the data grid.
   */
  export
  const MIN_SECTION_SIZE = 10;

  /**
   * The width of the header cell leading resize handle.
   */
  export
  const LEADING_RESIZE_WIDTH = 5;

  /**
   * The width of the header cell trailing resize handle.
   */
  export
  const TRAILING_RESIZE_WIDTH = 6;

  // /**
  //  * The width of the header cell grab handle.
  //  */
  // export
  // const GRAB_WIDTH = 5;

  /**
   * Clamp and normalize a section size.
   */
  export
  function clampSectionSize(size: number): number {
    return Math.max(MIN_SECTION_SIZE, Math.floor(size));
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
   * A type which designates the data grid hit test parts.
   */
  export
  type HitTestPart = (
    /**
     * The bulk space of a row header cell.
     */
    'row-header-cell' |

    /**
     * The horizontal resize handle of a row header cell.
     */
    'row-header-h-resize-handle' |

    /**
     * The vertical resize handle of a row header cell.
     */
    'row-header-v-resize-handle' |

    /**
     * The bulk space of a column header cell.
     */
    'column-header-cell' |

    /**
     * The horizontal resize handle of a column header cell.
     */
    'column-header-h-resize-handle' |

    /**
     * The vertical resize handle of a column header cell.
     */
    'column-header-v-resize-handle' |

    /**
     * The bulk space of a corner header cell.
     */
    'corner-header-cell' |

    /**
     * The horizontal resize handle of a corner header cell.
     */
    'corner-header-h-resize-handle' |

    /**
     * The vertical resize handle of a corner header cell.
     */
    'corner-header-v-resize-handle' |

    /**
     * The bulk space of a body cell.
     */
    'body-cell' |

    /**
     * The data grid void space.
     */
    'void-space'
  );

  /**
   * An object which holds the result of a grid hit test.
   */
  export
  type HitTestResult = {
    /**
     * The data grid part that was hit.
     */
    part: HitTestPart;

    /**
     * The row index of the cell that was hit.
     */
    row: number;

    /**
     * The column index of the cell that was hit.
     */
    column: number;

    /**
     * The X coordinate of the mouse in part coordinates.
     */
    x: number;

    /**
     * The Y coordinate of the mouse in part coordinates.
     */
    y: number;
  };

  /**
   * An object which holds the transient mouse press data.
   */
  export
  type PressData = {
    /**
     * The result of the mouse down hit test.
     */
    hitTest: HitTestResult;

    /**
     * The most recent client X position of the mouse.
     */
    clientX: number;

    /**
     * The most recent client Y position of the mouse.
     */
    clientY: number;

    /**
     * The cursor override.
     */
    override: IDisposable;
  };

  /**
   * Get the mouse cursor for a hit test part.
   */
  export
  function cursorForPart(part: HitTestPart): string {
    return cursorTable[part];
  }

  /**
   * A mapping of hit test part to mouse cursor.
   */
  const cursorTable = {
    'body-cell': '',
    'void-space': '',
    'row-header-cell': '',
    'column-header-cell': '',
    'corner-header-cell': '',
    'row-header-h-resize-handle': 'ew-resize',
    'column-header-h-resize-handle': 'ew-resize',
    'corner-header-h-resize-handle': 'ew-resize',
    'row-header-v-resize-handle': 'ns-resize',
    'column-header-v-resize-handle': 'ns-resize',
    'corner-header-v-resize-handle': 'ns-resize'
  };
}
