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


/**
 * A thin caching wrapper around a 2D canvas rendering context.
 *
 * #### Notes
 * This class is mostly a transparent wrapper around a canvas rendering
 * context which improves performance when writing context state.
 *
 * For best performance, avoid reading state from the `gc`. Writes are
 * cached based on the previously written value.
 *
 * Unless otherwise specified, the API and semantics of this class are
 * identical to the builtin 2D canvas rendering context:
 * https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
 *
 * The wrapped canvas context should not be manipulated externally
 * until the wrapping `GraphicsContext` object is disposed.
 */
export
class GraphicsContext implements IDisposable {
  /**
   * Create a new graphics context object.
   *
   * @param context - The 2D canvas rendering context to wrap.
   */
  constructor(context: CanvasRenderingContext2D) {
    this._context = context;
    this._state = Private.State.create(context);
  }

  dispose(): void {
    // Bail if the gc is already disposed.
    if (this._disposed) {
      return;
    }

    // Mark the gc as disposed.
    this._disposed = true;

    // Pop any unrestored saves.
    while (this._state.next) {
      this._state = this._state.next;
      this._context.restore();
    }
  }

  get isDisposed(): boolean {
    return !this._disposed;
  }

  get fillStyle(): string | CanvasGradient | CanvasPattern {
    return this._context.fillStyle;
  }

  set fillStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._state.fillStyle !== value) {
      this._state.fillStyle = value;
      this._context.fillStyle = value;
    }
  }

  get strokeStyle(): string | CanvasGradient | CanvasPattern {
    return this._context.strokeStyle;
  }

  set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
    if (this._state.strokeStyle !== value) {
      this._state.strokeStyle = value;
      this._context.strokeStyle = value;
    }
  }

  get font(): string {
    return this._context.font;
  }

  set font(value: string) {
    if (this._state.font !== value) {
      this._state.font = value;
      this._context.font = value;
    }
  }

  get textAlign(): string {
    return this._context.textAlign;
  }

  set textAlign(value: string) {
    if (this._state.textAlign !== value) {
      this._state.textAlign = value;
      this._context.textAlign = value;
    }
  }

  get textBaseline(): string {
    return this._context.textBaseline;
  }

  set textBaseline(value: string) {
    if (this._state.textBaseline !== value) {
      this._state.textBaseline = value;
      this._context.textBaseline = value;
    }
  }

  get lineCap(): string {
    return this._context.lineCap;
  }

  set lineCap(value: string) {
    if (this._state.lineCap !== value) {
      this._state.lineCap = value;
      this._context.lineCap = value;
    }
  }

  get lineDashOffset(): number {
    return this._context.lineDashOffset;
  }

  set lineDashOffset(value: number) {
    if (this._state.lineDashOffset !== value) {
      this._state.lineDashOffset = value;
      this._context.lineDashOffset = value;
    }
  }

  get lineJoin(): string {
    return this._context.lineJoin;
  }

  set lineJoin(value: string) {
    if (this._state.lineJoin !== value) {
      this._state.lineJoin = value;
      this._context.lineJoin = value;
    }
  }

  get lineWidth(): number {
    return this._context.lineWidth;
  }

  set lineWidth(value: number) {
    if (this._state.lineWidth !== value) {
      this._state.lineWidth = value;
      this._context.lineWidth = value;
    }
  }

  get miterLimit(): number {
    return this._context.miterLimit;
  }

  set miterLimit(value: number) {
    if (this._state.miterLimit !== value) {
      this._state.miterLimit = value;
      this._context.miterLimit = value;
    }
  }

  get shadowBlur(): number {
    return this._context.shadowBlur;
  }

  set shadowBlur(value: number) {
    if (this._state.shadowBlur !== value) {
      this._state.shadowBlur = value;
      this._context.shadowBlur = value;
    }
  }

  get shadowColor(): string {
    return this._context.shadowColor;
  }

  set shadowColor(value: string) {
    if (this._state.shadowColor !== value) {
      this._state.shadowColor = value;
      this._context.shadowColor = value;
    }
  }

  get shadowOffsetX(): number {
    return this._context.shadowOffsetX;
  }

  set shadowOffsetX(value: number) {
    if (this._state.shadowOffsetX !== value) {
      this._state.shadowOffsetX = value;
      this._context.shadowOffsetX = value;
    }
  }

  get shadowOffsetY(): number {
    return this._context.shadowOffsetY;
  }

  set shadowOffsetY(value: number) {
    if (this._state.shadowOffsetY !== value) {
      this._state.shadowOffsetY = value;
      this._context.shadowOffsetY = value;
    }
  }

  get imageSmoothingEnabled(): boolean {
    return this._context.imageSmoothingEnabled;
  }

  set imageSmoothingEnabled(value: boolean) {
    if (this._state.imageSmoothingEnabled !== value) {
      this._state.imageSmoothingEnabled = value;
      this._context.imageSmoothingEnabled = value;
    }
  }

  get globalAlpha(): number {
    return this._context.globalAlpha;
  }

  set globalAlpha(value: number) {
    if (this._state.globalAlpha !== value) {
      this._state.globalAlpha = value;
      this._context.globalAlpha = value;
    }
  }

  get globalCompositeOperation(): string {
    return this._context.globalCompositeOperation;
  }

  set globalCompositeOperation(value: string) {
    if (this._state.globalCompositeOperation !== value) {
      this._state.globalCompositeOperation = value;
      this._context.globalCompositeOperation = value;
    }
  }

  getLineDash(): number[] {
    return this._context.getLineDash();
  }

  setLineDash(segments: number[]): void {
    this._context.setLineDash(segments);
  }

  rotate(angle: number): void {
    this._context.rotate(angle);
  }

  scale(x: number, y: number): void {
    this._context.scale(x, y);
  }

  transform(m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): void {
    this._context.transform(m11, m12, m21, m22, dx, dy);
  }

  translate(x: number, y: number): void {
    this._context.translate(x, y);
  }

  setTransform(m11: number, m12: number, m21: number, m22: number, dx: number, dy: number): void {
    this._context.setTransform(m11, m12, m21, m22, dx, dy);
  }

  save(): void {
    // Clone an push the current state to the stack.
    this._state = Private.State.push(this._state);

    // Save the wrapped context state.
    this._context.save();
  }

  restore(): void {
    // Bail if there is no state to restore.
    if (!this._state.next) {
      return;
    }

    // Pop the saved state from the stack.
    this._state = Private.State.pop(this._state);

    // Restore the wrapped context state.
    this._context.restore();
  }

  beginPath(): void {
    return this._context.beginPath();
  }

  closePath(): void {
    this._context.closePath();
  }

  isPointInPath(x: number, y: number, fillRule?: CanvasFillRule): boolean {
    let result: boolean;
    if (arguments.length === 2) {
      result = this._context.isPointInPath(x, y);
    } else {
      result = this._context.isPointInPath(x, y, fillRule);
    }
    return result;
  }

  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    if (arguments.length === 5) {
      this._context.arc(x, y, radius, startAngle, endAngle);
    } else {
      this._context.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    }
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    this._context.arcTo(x1, y1, x2, y2, radius);
  }

  bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this._context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, anticlockwise?: boolean): void {
    if (arguments.length === 7) {
      this._context.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
    } else {
      this._context.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
    }
  }

  lineTo(x: number, y: number): void {
    this._context.lineTo(x, y);
  }

  moveTo(x: number, y: number): void {
    this._context.moveTo(x, y);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this._context.quadraticCurveTo(cpx, cpy, x, y);
  }

  rect(x: number, y: number, w: number, h: number): void {
    this._context.rect(x, y, w, h);
  }

  clip(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._context.clip();
    } else {
      this._context.clip(fillRule);
    }
  }

  fill(fillRule?: CanvasFillRule): void {
    if (arguments.length === 0) {
      this._context.fill();
    } else {
      this._context.fill(fillRule);
    }
  }

  stroke(): void {
    this._context.stroke();
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    return this._context.clearRect(x, y, w, h);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    this._context.fillRect(x, y, w, h);
  }

  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._context.fillText(text, x, y);
    } else {
      this._context.fillText(text, x, y, maxWidth);
    }
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    this._context.strokeRect(x, y, w, h);
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    if (arguments.length === 3) {
      this._context.strokeText(text, x, y);
    } else {
      this._context.strokeText(text, x, y, maxWidth);
    }
  }

  measureText(text: string): TextMetrics {
    return this._context.measureText(text);
  }

  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    return this._context.createLinearGradient(x0, y0, x1, y1);
  }

  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient {
    return this._context.createRadialGradient(x0, y0, r0, x1, y1, r1);
  }

  createPattern(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement, repetition: string): CanvasPattern {
    return this._context.createPattern(image, repetition);
  }

  createImageData(imageData: ImageData): ImageData;
  createImageData(sw: number, sh: number): ImageData;
  createImageData() {
    return this._context.createImageData.apply(this._context, arguments);
  }

  getImageData(sx: number, sy: number, sw: number, sh: number): ImageData {
    return this._context.getImageData(sx, sy, sw, sh);
  }

  putImageData(imagedata: ImageData, dx: number, dy: number): void
  putImageData(imagedata: ImageData, dx: number, dy: number, dirtyX: number, dirtyY: number, dirtyWidth: number, dirtyHeight: number): void
  putImageData(): void {
    this._context.putImageData.apply(this._context, arguments);
  }

  drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, dstX: number, dstY: number): void;
  drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, dstX: number, dstY: number, dstW: number, dstH: number): void;
  drawImage(image: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap, srcX: number, srcY: number, srcW: number, srcH: number, dstX: number, dstY: number, dstW: number, dstH: number): void;
  drawImage(): void {
    this._context.drawImage.apply(this._context, arguments);
  }

  drawFocusIfNeeded(element: Element): void {
    this._context.drawFocusIfNeeded(element);
  }

  private _disposed = false;
  private _state: Private.State;
  private _context: CanvasRenderingContext2D;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * The index of next valid pool object.
   */
  let pi = -1;

  /**
   * A state object allocation pool.
   */
  const pool: State[] = [];

  /**
   * An object which holds the state for a gc.
   */
  export
  class State {
    /**
     * Create a gc state object from a 2D canvas context.
     */
    static create(context: CanvasRenderingContext2D): State {
      let state = pi < 0 ? new State() : pool[pi--];
      state.next = null;
      state.fillStyle = context.fillStyle;
      state.font = context.font;
      state.globalAlpha = context.globalAlpha;
      state.globalCompositeOperation = context.globalCompositeOperation;
      state.imageSmoothingEnabled = context.imageSmoothingEnabled;
      state.lineCap = context.lineCap;
      state.lineDashOffset = context.lineDashOffset;
      state.lineJoin = context.lineJoin;
      state.lineWidth = context.lineWidth;
      state.miterLimit = context.miterLimit;
      state.shadowBlur = context.shadowBlur;
      state.shadowColor = context.shadowColor;
      state.shadowOffsetX = context.shadowOffsetX;
      state.shadowOffsetY = context.shadowOffsetY;
      state.strokeStyle = context.strokeStyle;
      state.textAlign = context.textAlign;
      state.textBaseline = context.textBaseline;
      return state;
    }

    /**
     * Clone an existing gc state object and add it to the state stack.
     */
    static push(other: State): State {
      let state = pi < 0 ? new State() : pool[pi--];
      state.next = other;
      state.fillStyle = other.fillStyle;
      state.font = other.font;
      state.globalAlpha = other.globalAlpha;
      state.globalCompositeOperation = other.globalCompositeOperation;
      state.imageSmoothingEnabled = other.imageSmoothingEnabled;
      state.lineCap = other.lineCap;
      state.lineDashOffset = other.lineDashOffset;
      state.lineJoin = other.lineJoin;
      state.lineWidth = other.lineWidth;
      state.miterLimit = other.miterLimit;
      state.shadowBlur = other.shadowBlur;
      state.shadowColor = other.shadowColor;
      state.shadowOffsetX = other.shadowOffsetX;
      state.shadowOffsetY = other.shadowOffsetY;
      state.strokeStyle = other.strokeStyle;
      state.textAlign = other.textAlign;
      state.textBaseline = other.textBaseline;
      return state;
    }

    /**
     * Pop the next state object and return the current to the pool
     */
    static pop(state: State): State {
      state.fillStyle = '';
      state.strokeStyle = '';
      pool[++pi] = state;
      return state.next!;
    }

    next: State | null;

    fillStyle: string | CanvasGradient | CanvasPattern;
    font: string;
    globalAlpha: number;
    globalCompositeOperation: string;
    imageSmoothingEnabled: boolean;
    lineCap: string;
    lineDashOffset: number;
    lineJoin: string;
    lineWidth: number;
    miterLimit: number;
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetX: number;
    shadowOffsetY: number;
    strokeStyle: string | CanvasGradient | CanvasPattern;
    textAlign: string;
    textBaseline: string;

    private constructor() { }
  }
}
