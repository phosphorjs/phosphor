/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * A thin caching wrapper around a 2D canvas rendering context.
 *
 * #### Notes
 * This class is mostly a transparent wrapper around a canvas rendering
 * context which improves performance when reading and writing context
 * state.
 *
 * Unless otherwise specified, the API and semantics of this class are
 * identical to the builtin 2D canvas rendering context:
 * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 *
 * For optimal performance, user code should avoid assigning values to
 * the gc which will be coerced by the underlying rendering context.
 */
export
class GraphicsContext {
  /**
   * Wrap a new graphics context around an existing 2D canvas gc.
   *
   * @param gc - The 2D canvas rendering context to wrap.
   *
   * @returns A new graphics context wrapper.
   *
   * #### Notes
   * The `gc` should not be manipulated externally until the context
   * object is no longer used, or the cached values may be incorrect.
   */
  static wrap(gc: CanvasRenderingContext2D): GraphicsContext {
    let result = new GraphicsContext();
    result._gc = gc;
    result._fillStyle = gc.fillStyle;
    result._font = gc.font;
    result._globalAlpha = gc.globalAlpha;
    result._globalCompositeOperation = gc.globalCompositeOperation;
    result._imageSmoothingEnabled = gc.imageSmoothingEnabled;
    result._lineCap = gc.lineCap;
    result._lineDashOffset = gc.lineDashOffset;
    result._lineJoin = gc.lineJoin;
    result._lineWidth = gc.lineWidth;
    result._miterLimit = gc.miterLimit;
    result._shadowBlur = gc.shadowBlur;
    result._shadowColor = gc.shadowColor;
    result._shadowOffsetX = gc.shadowOffsetX;
    result._shadowOffsetY = gc.shadowOffsetY;
    result._strokeStyle = gc.strokeStyle;
    result._textAlign = gc.textAlign;
    result._textBaseline = gc.textBaseline;
    return result;
  }

  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this._fillStyle;
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._fillStyle === value) {
      return;
    }
    this._gc.fillStyle = value;
    this._fillStyle = this._gc.fillStyle;
  }

  get font(): string {
    return this._font;
  }

  set font(value: string) {
    if (this._font === value) {
      return;
    }
    this._gc.font = value;
    this._font = this._gc.font;
  }

  get globalAlpha(): number {
    return this._globalAlpha;
  }

  set globalAlpha(value: number) {
    if (this._globalAlpha === value) {
      return;
    }
    this._gc.globalAlpha = value;
    this._globalAlpha = this._gc.globalAlpha;
  }

  get globalCompositeOperation(): string {
    return this._globalCompositeOperation;
  }

  set globalCompositeOperation(value: string) {
    if (this._globalCompositeOperation === value) {
      return;
    }
    this._gc.globalCompositeOperation = value;
    this._globalCompositeOperation = this._gc.globalCompositeOperation;
  }

  get imageSmoothingEnabled(): boolean {
    return this._imageSmoothingEnabled;
  }

  set imageSmoothingEnabled(value: boolean) {
    if (this._imageSmoothingEnabled === value) {
      return;
    }
    this._gc.imageSmoothingEnabled = value;
    this._imageSmoothingEnabled = this._gc.imageSmoothingEnabled;
  }

  get lineCap(): string {
    return this._lineCap;
  }

  set lineCap(value: string) {
    if (this._lineCap === value) {
      return;
    }
    this._gc.lineCap = value;
    this._lineCap = this._gc.lineCap;
  }

  get lineDashOffset(): number {
    return this._lineDashOffset;
  }

  set lineDashOffset(value: number) {
    if (this._lineDashOffset === value) {
      return;
    }
    this._gc.lineDashOffset = value;
    this._lineDashOffset = this._gc.lineDashOffset;
  }

  get lineJoin(): string {
    return this._lineJoin;
  }

  set lineJoin(value: string) {
    if (this._lineJoin === value) {
      return;
    }
    this._gc.lineJoin = value;
    this._lineJoin = this._gc.lineJoin;
  }

  get lineWidth(): number {
    return this._lineWidth;
  }

  set lineWidth(value: number) {
    if (this._lineWidth === value) {
      return;
    }
    this._gc.lineWidth = value;
    this._lineWidth = this._gc.lineWidth;
  }

  get miterLimit(): number {
    return this._miterLimit;
  }

  set miterLimit(value: number) {
    if (this._miterLimit === value) {
      return;
    }
    this._gc.miterLimit = value;
    this._miterLimit = this._gc.miterLimit;
  }

  get shadowBlur(): number {
    return this._shadowBlur;
  }

  set shadowBlur(value: number) {
    if (this._shadowBlur === value) {
      return;
    }
    this._gc.shadowBlur = value;
    this._shadowBlur = this._gc.shadowBlur;
  }

  get shadowColor(): string {
    return this._shadowColor;
  }

  set shadowColor(value: string) {
    if (this._shadowColor === value) {
      return;
    }
    this._gc.shadowColor = value;
    this._shadowColor = this._gc.shadowColor;
  }

  get shadowOffsetX(): number {
    return this._shadowOffsetX;
  }

  set shadowOffsetX(value: number) {
    if (this._shadowOffsetX === value) {
      return;
    }
    this._gc.shadowOffsetX = value;
    this._shadowOffsetX = this._gc.shadowOffsetX;
  }

  get shadowOffsetY(): number {
    return this._shadowOffsetY;
  }

  set shadowOffsetY(value: number) {
    if (this._shadowOffsetY === value) {
      return;
    }
    this._gc.shadowOffsetY = value;
    this._shadowOffsetY = this._gc.shadowOffsetY;
  }

  get strokeStyle(): string | CanvasGradient | CanvasPattern {
    return this._strokeStyle;
  }

  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._strokeStyle === value) {
      return;
    }
    this._gc.strokeStyle = value;
    this._strokeStyle = this._gc.strokeStyle;
  }

  get textAlign(): string {
    return this._textAlign;
  }

  set textAlign(value: string) {
    if (this._textAlign === value) {
      return;
    }
    this._gc.textAlign = value;
    this._textAlign = this._gc.textAlign;
  }

  get textBaseline(): string {
    return this._textBaseline;
  }

  set textBaseline(value: string) {
    if (this._textBaseline === value) {
      return;
    }
    this._gc.textBaseline = value;
    this._textBaseline = this._gc.textBaseline;
  }

  beginPath(): void {
    return this._gc.beginPath();
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    return this._gc.clearRect(x, y, w, h);
  }

  clip(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._gc.clip();
    } else {
      this._gc.clip(fillRule);
    }
  }

  createImageData(imageDataOrSw: number | ImageData, sh?: number): ImageData {
    let result: ImageData;
    if (arguments.length === 1) {
      result = this._gc.createImageData(imageDataOrSw);
    } else {
      result = this._gc.createImageData(imageDataOrSw, sh);
    }
    return result;
  }

  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    return this._gc.createLinearGradient(x0, y0, x1, y1);
  }

  createPattern(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, repetition: string): CanvasPattern {
    return this._gc.createPattern(image, repetition);
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    return this._gc.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  drawFocusIfNeeded(element: Element): void {
    this._gc.drawFocusIfNeeded(element);
  }

  drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, dstX: number, dstY: number): void;
  drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, dstX: number, dstY: number, dstW: number, dstH: number): void;
  drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, srcX: number, srcY: number, srcW: number, srcH: number, dstX: number, dstY: number, dstW: number, dstH: number): void;
  drawImage(): void {
    this._gc.drawImage.apply(this._gc, arguments);
  }

  fill(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._gc.fill();
    } else {
      this._gc.fill(fillRule);
    }
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this._gc.fillRect(x, y, w, h);
  }

  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._gc.fillText(text, x, y);
    } else {
      this._gc.fillText(text, x, y, maxWidth);
    }
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    return this._gc.getImageData(sx, sy, sw, sh);
  }

  getLineDash(): number[] {
    return this._gc.getLineDash();
  }

  isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean {
    let result: boolean;
    if (arguments.length === 2) {
      result = this._gc.isPointInPath(x, y);
    } else {
      result = this._gc.isPointInPath(x, y, fillRule);
    }
    return result;
  }

  measureText(text: string): TextMetrics {
    return this._gc.measureText(text);
  }

  putImageData(imagedata: ImageData, dx: number, dy: number): void
  putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void
  putImageData(): void {
    this._gc.putImageData.apply(this._gc, arguments);
  }

  restore(): void {
    // Bail early if there is no saved state.
    if (!this._next) {
      return;
    }

    // Pop the saved state from the stack.
    let next = this._next;
    this._next = next._next;

    // Update the internal state to the previous state.
    this._fillStyle = next._fillStyle;
    this._font = next._font;
    this._globalAlpha = next._globalAlpha;
    this._globalCompositeOperation = next._globalCompositeOperation;
    this._imageSmoothingEnabled = next._imageSmoothingEnabled;
    this._lineCap = next._lineCap;
    this._lineDashOffset = next._lineDashOffset;
    this._lineJoin = next._lineJoin;
    this._lineWidth = next._lineWidth;
    this._miterLimit = next._miterLimit;
    this._shadowBlur = next._shadowBlur;
    this._shadowColor = next._shadowColor;
    this._shadowOffsetX = next._shadowOffsetX;
    this._shadowOffsetY = next._shadowOffsetY;
    this._strokeStyle = next._strokeStyle;
    this._textAlign = next._textAlign;
    this._textBaseline = next._textBaseline;

    // Restore the actual gc state.
    this._gc.restore();
  }

  rotate(angle: number): void {
    this._gc.rotate(angle);
  }

  save(): void {
    // Create a new object to hold the saved state.
    let next = new GraphicsContext();

    // Push the saved state to the stack.
    next._next = this._next;
    this._next = next;

    // Fill the saved state with the current state.
    next._fillStyle = this._fillStyle;
    next._font = this._font;
    next._globalAlpha = this._globalAlpha;
    next._globalCompositeOperation = this._globalCompositeOperation;
    next._imageSmoothingEnabled = this._imageSmoothingEnabled;
    next._lineCap = this._lineCap;
    next._lineDashOffset = this._lineDashOffset;
    next._lineJoin = this._lineJoin;
    next._lineWidth = this._lineWidth;
    next._miterLimit = this._miterLimit;
    next._shadowBlur = this._shadowBlur;
    next._shadowColor = this._shadowColor;
    next._shadowOffsetX = this._shadowOffsetX;
    next._shadowOffsetY = this._shadowOffsetY;
    next._strokeStyle = this._strokeStyle;
    next._textAlign = this._textAlign;
    next._textBaseline = this._textBaseline;

    // Save the actual gc state.
    this._gc.save();
  }

  scale(x: number, y: number): void {
    this._gc.scale(x, y);
  }

  setLineDash(segments: number[]): void {
    this._gc.setLineDash(segments);
  }

  setTransform(m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): void {
    this._gc.setTransform(m11, m12, m21, m22, dx, dy);
  }

  stroke(path?: Path2D): void {
    if (arguments.length === 0) {
      this._gc.stroke();
    } else {
      this._gc.stroke(path);
    }
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this._gc.strokeRect(x, y, w, h);
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._gc.strokeText(text, x, y);
    } else {
      this._gc.strokeText(text, x, y, maxWidth);
    }
  }

  transform(m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): void {
    this._gc.transform(m11, m12, m21, m22, dx, dy);
  }

  translate(x: number, y: number): void {
    this._gc.translate(x, y);
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    if (arguments.length === 5) {
      this._gc.arc(x, y, radius, startAngle, endAngle);
    } else {
      this._gc.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this._gc.arcTo(x1, y1, x2, y2, radius);
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this._gc.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  closePath(): void {
    this._gc.closePath();
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    if (arguments.length === 7) {
      this._gc.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
    } else {
      this._gc.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    }
  }

  lineTo(x: number, y: number): void {
    this._gc.lineTo(x, y);
  }

  moveTo(x: number, y: number): void {
    this._gc.moveTo(x, y);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this._gc.quadraticCurveTo(cpx, cpy, x, y);
  }

  rect(x: number, y: number, w: number, h: number): void {
    this._gc.rect(x, y, w, h);
  }

  private constructor() { }

  private _fillStyle: string | CanvasGradient | CanvasPattern;
  private _font: string;
  private _globalAlpha: number;
  private _globalCompositeOperation: string;
  private _imageSmoothingEnabled: boolean;
  private _lineCap: string;
  private _lineDashOffset: number;
  private _lineJoin: string;
  private _lineWidth: number;
  private _miterLimit: number;
  private _shadowBlur: number;
  private _shadowColor: string;
  private _shadowOffsetX: number;
  private _shadowOffsetY: number;
  private _strokeStyle: string | CanvasGradient | CanvasPattern;
  private _textAlign: string;
  private _textBaseline: string;
  private _gc: CanvasRenderingContext2D = null!;
  private _next: GraphicsContext | null = null;
}
