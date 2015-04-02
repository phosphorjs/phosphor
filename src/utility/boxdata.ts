/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * The box sizing data for an HTML element.
 */
export
interface IBoxData {
  /**
   * The top border width, in pixels.
   */
  borderTop: number;

  /**
   * The left border width, in pixels.
   */
  borderLeft: number;

  /**
   * The right border width, in pixels.
   */
  borderRight: number;

  /**
   * The bottom border width, in pixels.
   */
  borderBottom: number;

  /**
   * The top padding width, in pixels.
   */
  paddingTop: number;

  /**
   * The left padding width, in pixels.
   */
  paddingLeft: number;

  /**
   * The right padding width, in pixels.
   */
  paddingRight: number;

  /**
   * The bottom padding width, in pixels.
   */
  paddingBottom: number;

  /**
   * The sum of the vertical padding and border.
   */
  verticalSum: number;

  /**
   * The sum of the horizontal padding and border.
   */
  horizontalSum: number;

  /**
   * The minimum width, in pixels.
   */
  minWidth: number;

  /**
   * The minimum height, in pixels.
   */
  minHeight: number;

  /**
   * The maximum width, in pixels.
   */
  maxWidth: number;

  /**
   * The maximum height, in pixels.
   */
  maxHeight: number;
}


/**
 * Create a box data object for the given node.
 *
 * The values of the returned object are read only.
 */
export
function createBoxData(node: HTMLElement): IBoxData {
  var style = window.getComputedStyle(node);
  var bt = parseInt(style.borderTopWidth, 10) || 0;
  var bl = parseInt(style.borderLeftWidth, 10) || 0;
  var br = parseInt(style.borderRightWidth, 10) || 0;
  var bb = parseInt(style.borderBottomWidth, 10) || 0;
  var pt = parseInt(style.paddingTop, 10) || 0;
  var pl = parseInt(style.paddingLeft, 10) || 0;
  var pr = parseInt(style.paddingRight, 10) || 0;
  var pb = parseInt(style.paddingBottom, 10) || 0;
  var mw = parseInt(style.minWidth, 10) || 0;
  var mh = parseInt(style.minHeight, 10) || 0;
  var xw = parseInt(style.maxWidth, 10) || Infinity;
  var xh = parseInt(style.maxHeight, 10) || Infinity;
  var data = Object.create(boxDataProto);
  if (bt !== 0) data._bt = bt;
  if (bl !== 0) data._bl = bl;
  if (br !== 0) data._br = br;
  if (bb !== 0) data._bb = bb;
  if (pt !== 0) data._pt = pt;
  if (pl !== 0) data._pl = pl;
  if (pr !== 0) data._pr = pr;
  if (pb !== 0) data._pb = pb;
  if (mw !== 0) data._mw = mw;
  if (mh !== 0) data._mh = mh;
  if (xw !== Infinity) data._xw = xw;
  if (xh !== Infinity) data._xh = xh;
  return <IBoxData>data;
}


/**
 * The box data prototype object used by `createBoxData`.
 */
var boxDataProto: IBoxData = {
  get borderTop() { return this._bt; },
  get borderLeft() { return this._bl; },
  get borderRight() { return this._br; },
  get borderBottom() { return this._bb; },
  get paddingTop() { return this._pt; },
  get paddingLeft() { return this._pl; },
  get paddingRight() { return this._pr; },
  get paddingBottom() { return this._pb; },
  get verticalSum() { return this._bt + this._bb + this._pt + this._pb; },
  get horizontalSum() { return this._bl + this._br + this._pl + this._pr; },
  get minWidth() { return this._mw; },
  get minHeight() { return this._mh; },
  get maxWidth() { return this._xw; },
  get maxHeight() { return this._xh; },
  _bt: 0, _bl: 0, _br: 0, _bb: 0,
  _pt: 0, _pl: 0, _pr: 0, _pb: 0,
  _mw: 0, _mh: 0, _xw: 0, _xh: 0,
};

} // module phosphor.utility
