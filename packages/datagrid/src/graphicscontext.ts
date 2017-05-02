/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/

// /**
//  *
//  */
// export
// class GraphicsContext {
//   constructor(gc: CanvasRenderingContext2D) {
//     this._gc = gc;
//     this._fillStyle = gc.fillStyle;
//     this._font = gc.font;
//     this._globalAlpha = gc.globalAlpha;
//     this._globalCompositeOperation = gc.globalCompositeOperation;
//     this._imageSmoothingEnabled = gc.imageSmoothingEnabled;
//     this._lineCap = gc.lineCap;
//     this._lineDashOffset = gc.lineDashOffset;
//     this._lineJoin = gc.lineJoin;
//     this._lineWidth = gc.lineWidth;
//     this._miterLimit = gc.miterLimit;
//     this._shadowBlur =
//     this._shadowColor =
//     this._shadowOffsetX =
//     this._shadowOffsetY =
//     this._strokeStyle =
//     this._textAlign =
//     this._textBaseline =
//     this._mozImageSmoothingEnabled =
//     this._webkitImageSmoothingEnabled =
//     this._oImageSmoothingEnabled =
//   }


//   get fillStyle(): string | CanvasGradient | CanvasPattern {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get font(): string {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get globalAlpha(): number {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get globalCompositeOperation(): string {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get imageSmoothingEnabled(): boolean {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get lineCap(): string {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get lineDashOffset(): number {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get lineJoin(): string {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get lineWidth(): number {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get miterLimit(): number {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get shadowBlur(): number {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get shadowColor(): string {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get shadowOffsetX(): number {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get shadowOffsetY(): number {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get strokeStyle(): string | CanvasGradient | CanvasPattern {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get textAlign(): string {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   get textBaseline(): string {
//     return this._;
//   }

//   set (value: ) {
//     if (this._ === value) {
//       return;
//     }
//     this._ = this._gc. = value;
//   }

//   beginPath(): void;
//   clearRect(x: number, y: number, w: number, h: number): void;
//   clip(fillRule?: string): void;
//   createImageData(imageDataOrSw: number | ImageData, sh?: number): ImageData;
//   createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
//   createPattern(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, repetition: string): CanvasPattern;
//   createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient;
//   drawFocusIfNeeded(element: Element): void;
//   drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, offsetX: number, offsetY: number, width?: number, height?: number, canvasOffsetX?: number, canvasOffsetY?: number, canvasImageWidth?: number, canvasImageHeight?: number): void;
//   fill(fillRule?: string): void;
//   fillRect(x: number, y: number, w: number, h: number): void;
//   fillText(text: string, x: number, y: number, maxWidth?: number): void;
//   getImageData(sx: number, sy: number, sw: number, sh: number): ImageData;
//   getLineDash(): number[];
//   isPointInPath(x: number, y: number, fillRule?: string): boolean;
//   measureText(text: string): TextMetrics;
//   putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX?: number, dirtyY?: number, dirtyWidth?: number, dirtyHeight?: number): void;
//   restore(): void;
//   rotate(angle: number): void;
//   save(): void;
//   scale(x: number, y: number): void;
//   setLineDash(segments: number[]): void;
//   setTransform(m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): void;
//   stroke(path?: Path2D): void;
//   strokeRect(x: number, y: number, w: number, h: number): void;
//   strokeText(text: string, x: number, y: number, maxWidth?: number): void;
//   transform(m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): void;
//   translate(x: number, y: number): void;
//   arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
//   arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
//   bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
//   closePath(): void;
//   ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void;
//   lineTo(x: number, y: number): void;
//   moveTo(x: number, y: number): void;
//   quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
//   rect(x: number, y: number, w: number, h: number): void;

//   private _gc: CanvasRenderingContext2D;
//   private _fillStyle: string | CanvasGradient | CanvasPattern;
//   private _font: string;
//   private _globalAlpha: number;
//   private _globalCompositeOperation: string;
//   private _imageSmoothingEnabled: boolean;
//   private _lineCap: string;
//   private _lineDashOffset: number;
//   private _lineJoin: string;
//   private _lineWidth: number;
//   private _miterLimit: number;
//   private _shadowBlur: number;
//   private _shadowColor: string;
//   private _shadowOffsetX: number;
//   private _shadowOffsetY: number;
//   private _strokeStyle: string | CanvasGradient | CanvasPattern;
//   private _textAlign: string;
//   private _textBaseline: string;
// }
