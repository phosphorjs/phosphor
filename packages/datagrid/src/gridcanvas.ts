/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
// import {
//   Message
// } from '../core/messaging';

// import {
//   ISignal
// } from '../core/signaling';

// import {
//   ResizeMessage, Widget, WidgetFlag
// } from '../ui/widget';

// import {
//   DataModel
// } from './datamodel';

// import {
//   GridHeader
// } from './gridheader';


// /**
//  * The class name added to grid canvas instance.
//  */
// const GRID_CANVAS_CLASS = 'p-GridCanvas';

// /**
//  * The class name added to a grid canvas canvas node.
//  */
// const CANVAS_CLASS = 'p-GridCanvas-canvas';


// /**
//  *
//  */
// export
// class GridCanvas extends Widget {
//   /**
//    * Construct a new gird canvas.
//    */
//   constructor(options: GridCanvas.IOptions = {}) {
//     super();
//     this.addClass(GRID_CANVAS_CLASS);
//     this.setFlag(WidgetFlag.DisallowLayout);

//     // Parse the options.

//     // Create the offscreen rendering buffer.
//     this._buffer = document.createElement('canvas');
//     this._buffer.width = 0;
//     this._buffer.height = 0;

//     // Create the onscreen canvas.
//     this._canvas = document.createElement('canvas');
//     this._canvas.className = CANVAS_CLASS;
//     this._canvas.width = 0;
//     this._canvas.height = 0;
//     this._canvas.style.position = 'absolute';
//     this._canvas.style.top = '0px';
//     this._canvas.style.left = '0px';
//     this._canvas.style.width = '0px';
//     this._canvas.style.height = '0px';

//     // Attach the canvas to the widget node.
//     this.node.appendChild(this._canvas);
//   }

//   /**
//    * Get the data model rendered by the canvas.
//    */
//   get model(): DataModel {
//     return this._model;
//   }

//   /**
//    * Set the data model rendered by the canvas.
//    */
//   set model(value: DataModel) {
//     // Null and undefined are treated the same.
//     value = value || null;

//     // Do nothing if the model does not change.
//     if (this._model === value) {
//       return;
//     }

//     // Disconnect the signal handlers from the old model.
//     if (this._model) {
//       // TODO
//     }

//     // Connect the signal handlers for the new model.
//     if (value) {
//       // TODO
//     }

//     // Update the internal model reference.
//     this._model = value;

//     // Schedule an update of the canvas.
//     this.update();
//   }

//   /**
//    *
//    */
//   get scrollX(): number {
//     return this._scrollX;
//   }

//   /**
//    *
//    */
//   get scrollY(): number {
//     return this._scrollY;
//   }

//   /**
//    *
//    */
//   scroll(x: number, y: number): void {

//   }

//   /**
//    *
//    */
//   scrollBy(dx: number, dy: number): void {

//   }

//   /**
//    * A message handler invoked on an `'after-show'` message.
//    */
//   protected onAfterShow(msg: Message): void {
//     this.update();
//   }

//   /**
//    * A message handler invoked on an `'after-attach'` message.
//    */
//   protected onAfterAttach(msg: Message): void {
//     this.update();
//   }

//   /**
//    * A message handler invoked on an `'update-request'` message.
//    */
//   protected onUpdateRequest(msg: Message): void {
//     // Do nothing if the canvas is not visible.
//     if (!this.isVisible) {
//       return;
//     }

//     // Get the visible size of the canvas.
//     let width = this._canvas.width;
//     let height = this._canvas.height;

//     // Do nothing if the canvas has zero area.
//     if (width === 0 || height === 0) {
//       return;
//     }

//     // Draw the entire canvas.
//     this._draw(0, 0, width, height);
//   }

//   /**
//    * A message handler invoked on a `'resize'` message.
//    */
//   protected onResize(msg: ResizeMessage): void {
//     // Unpack the message data.
//     let { width, height } = msg;

//     // Measure the node if the dimensions are unknown.
//     if (width === -1) {
//       width = this.node.offsetWidth;
//     }
//     if (height === -1) {
//       height = this.node.offsetHeight;
//     }

//     // Round the dimensions to the nearest pixel.
//     width = Math.round(width);
//     height = Math.round(height);

//     // Get the rendering contexts for the buffer and canvas.
//     let bufferGC = this._buffer.getContext('2d');
//     let canvasGC = this._canvas.getContext('2d');

//     // Get the current size of the canvas.
//     let oldWidth = this._canvas.width;
//     let oldHeight = this._canvas.height;

//     // Determine whether there is valid content to blit.
//     let needBlit = oldWidth > 0 && oldHeight > 0 && width > 0 && height > 0;

//     // Resize the offscreen buffer to the new size.
//     this._buffer.width = width;
//     this._buffer.height = height;

//     // Blit the old contents into the buffer, if needed.
//     if (needBlit) {
//       bufferGC.drawImage(this._canvas, 0, 0);
//     }

//     // Resize the onscreen canvas to the new size.
//     this._canvas.width = width;
//     this._canvas.height = height;
//     this._canvas.style.width = `${width}px`;
//     this._canvas.style.height = `${height}px`;

//     // Blit the buffer contents into the canvas, if needed.
//     if (needBlit) {
//       canvasGC.drawImage(this._buffer, 0, 0);
//     }

//     // Compute the sizes of the dirty regions.
//     let right = Math.max(0, width - oldWidth);
//     let bottom = Math.max(0, height - oldHeight);

//     // Draw the dirty region at the right, if needed.
//     if (right > 0) {
//       this._draw(oldWidth, 0, right, height);
//     }

//     // Draw the dirty region at the bottom, if needed.
//     if (bottom > 0) {
//       this._draw(0, oldHeight, width - right, bottom);
//     }
//   }

//   /**
//    * Draw the portion of the canvas contained within the given rect.
//    *
//    * The rect should be fully contained within the visible canvas.
//    */
//   private _draw(rx: number, ry: number, rw: number, rh: number): void {
//     // Get the rendering context for the canvas.
//     let gc = this._canvas.getContext('2d');

//     // Fill the dirty rect with the void space color.
//     gc.fillStyle = '#D4D4D4';  // TODO make configurable.
//     gc.fillRect(rx, ry, rw, rh);

//     // // Bail if there is no model, cells, or sections.
//     // if (!this._model || !this._rowSections || !this._columnSections) {
//     //   return;
//     // }

//     // Compute the upper right cell index.
//     let i1 = Private.columnAt(rx + this._scrollX);
//     let j1 = Private.rowAt(ry + this._scrollY);

//     // Compute the lower right cell index.
//     let i2 = Private.columnAt(rx + rw + this._scrollX - 1);
//     let j2 = Private.rowAt(ry + rh + this._scrollY - 1);

//     // Bail if the rect does not intersect any cells.
//     if ((i1 < 0 && i2 < 0) || (j1 < 0 && j2 < 0)) {
//       return;
//     }

//     // Clamp the cells to the index limits.
//     if (i1 === -1) {
//       i1 = 0;
//     }
//     if (i2 === -1) {
//       i2 = 40;  // TODO use last column index.
//     }
//     if (j1 === -1) {
//       j1 = 0;
//     }
//     if (j2 === -1) {
//       j2 = 40;  // TODO use last column index.
//     }

//     i2 = Math.min(i2, 30);
//     j2 = Math.min(j2, 50);

//     // Compute the origin of the cell bounding box.
//     let x = Private.columnPosition(i1) - this._scrollX;
//     let y = Private.rowPosition(j1) - this._scrollY;

//     // Setup the dirty region.
//     let rgn = this._region;
//     rgn.x = x;
//     rgn.y = y;
//     rgn.width = 0;
//     rgn.height = 0;
//     rgn.startColumn = i1;
//     rgn.endColumn = i2;
//     rgn.startRow = j1;
//     rgn.endRow = j2;

//     // Update the column sizes and bounding box width.
//     for (let i = 0, n = i2 - i1 + 1; i < n; ++i) {
//       let s = Private.columnSize(i1 + i);
//       rgn.columnSizes[i] = s;
//       rgn.width += s;
//     }

//     // Update the row sizes and bounding box height.
//     for (let j = 0, n = j2 - j1 + 1; j < n; ++j) {
//       let s = Private.rowSize(j1 + j);
//       rgn.rowSizes[j] = s;
//       rgn.height += s;
//     }

//     // Draw the cell contents from back to front.
//     this._drawBackground(gc, rgn);
//     this._drawGridLines(gc, rgn);
//     this._drawCells(gc, rgn);
//     this._drawPaintRect(gc, rgn);
//   }

//   /**
//    * Draw the canvas background for the given rect.
//    */
//   private _drawBackground(gc: CanvasRenderingContext2D, rgn: Private.DirtyRegion): void {
//     // Setup the drawing style.
//     gc.fillStyle = 'white';  // TODO make configurable

//     // Fill the dirty rect with the background color.
//     gc.fillRect(rgn.x, rgn.y, rgn.width, rgn.height);
//   }

//   /**
//    * Draw the gridlines for the given rect.
//    */
//   private _drawGridLines(gc: CanvasRenderingContext2D, rgn: Private.DirtyRegion): void {
//     // Setup the drawing style.
//     gc.lineWidth = 1;
//     gc.lineCap = 'butt';
//     gc.strokeStyle = 'gray';  // TODO make configurable

//     // Start the path for the grid lines.
//     gc.beginPath();

//     // Draw the vertical grid lines.
//     let y1 = rgn.y;
//     let y2 = rgn.y + rgn.height;
//     let x = rgn.x - 0.5;  // align to pixel boundary
//     let nCols = rgn.endColumn - rgn.startColumn + 1;
//     for (let i = 0; i < nCols; ++i) {
//       x += rgn.columnSizes[i];
//       gc.moveTo(x, y1);
//       gc.lineTo(x, y2);
//     }

//     // Draw the horizontal grid lines.
//     let x1 = rgn.x;
//     let x2 = rgn.x + rgn.width;
//     let y = rgn.y - 0.5;  // align to pixel boundary
//     let nRows = rgn.endRow - rgn.startRow + 1;
//     for (let j = 0; j < nRows; ++j) {
//       y += rgn.rowSizes[j];
//       gc.moveTo(x1, y);
//       gc.lineTo(x2, y);
//     }

//     // Stroke the path to render the lines.
//     gc.stroke();
//   }

//   /**
//    *
//    */
//   private _drawCells(gc: CanvasRenderingContext2D, rgn: Private.DirtyRegion): void {
//     gc.fillStyle = 'black';
//     gc.font = '10px sans-serif';
//     let x = rgn.x;
//     let nRows = rgn.endRow - rgn.startRow + 1;
//     let nCols = rgn.endColumn - rgn.startColumn + 1;
//     for (let i = 0; i < nCols; ++i) {
//       let y = rgn.y;
//       for (let j = 0; j < nRows; ++j) {
//         let h = rgn.rowSizes[j];
//         gc.fillText(`Cell ${rgn.startRow + j}, ${rgn.startColumn + i}`, x, y + h / 2);
//         y += h;
//       }
//       x += rgn.columnSizes[i];
//     }
//   }

//   /**
//    *
//    */
//   private _drawPaintRect(gc: CanvasRenderingContext2D, rgn: Private.DirtyRegion): void {
//     // let gc = this._canvas.getContext('2d');
//     // gc.beginPath();
//     // gc.rect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
//     // gc.lineWidth = 1;
//     // gc.strokeStyle = Private.nextColor();
//     // gc.stroke();
//   }

//   /**
//    *
//    */
//   private _onRowsResized(): void {

//   }

//   /**
//    *
//    */
//   private _onColumnsResized(): void {

//   }

//   private _scrollX = 0;
//   private _scrollY = 0;
//   private _model: DataModel = null;
//   private _buffer: HTMLCanvasElement;
//   private _canvas: HTMLCanvasElement;
//   private _region = new Private.DirtyRegion();
//   private _rowSections: Private.ISectionSpan[] = [];
//   private _columnSections: Private.ISectionSpan[] = [];
// }


// /**
//  * The namespace for the `GridCanvas` class statics.
//  */
// export
// namespace GridCanvas {
//   /**
//    * An options object for initializing a grid canvas.
//    */
//   export
//   interface IOptions {

//   }
// }


// /**
//  * The namespace for the module private data.
//  */
// namespace Private {
//   /**
//    *
//    */
//   export
//   class DirtyRegion {
//     /**
//      *
//      */
//     x = 0;

//     /**
//      *
//      */
//     y = 0;

//     /**
//      *
//      */
//     width = 0;

//     /**
//      *
//      */
//     height = 0;

//     /**
//      *
//      */
//     startRow = 0;

//     /**
//      *
//      */
//     endRow = 0;

//     /**
//      *
//      */
//     startColumn = 0;

//     /**
//      *
//      */
//     endColumn = 0;

//     /**
//      *
//      */
//     rowSizes: number[] = [];

//     /**
//      *
//      */
//     columnSizes: number[] = [];
//   }

//   /**
//    * An object which represents a group of like-sized sections.
//    */
//   export
//   interface ISectionSpan {
//     /**
//      * The starting index of the span.
//      *
//      * This is always `>= 0`.
//      */
//     index: number;

//     /**
//      * The offset of the span.
//      *
//      * This is always `>= 0`.
//      */
//     offset: number;

//     /**
//      * The number of sections in the span.
//      *
//      * This is always `> 0`.
//      */
//     count: number;

//     /**
//      * The size of each section in the span.
//      *
//      * This is always `>= 0`.
//      */
//     size: number;
//   }

//   /**
//    *
//    */
//   export
//   function sectionIndex(sections: ISectionSpan[], offset: number): number {

//   }

//   /**
//    *
//    */
//   export
//   function sectionOffset(sections: ISectionSpan[], index: number): number {

//   }

//   /**
//    *
//    */
//   export
//   function sectionSize(sections: ISectionSpan[], index: number): number {

//   }
// }
