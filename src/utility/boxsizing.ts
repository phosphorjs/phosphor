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
interface IBoxSizing {
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
}


/**
 * Create a box sizing object for the given node.
 *
 * The values of the returned object are read only.
 */
export
function createBoxSizing(node: HTMLElement): IBoxSizing {
  var proto = boxSizingProto;
  var style = window.getComputedStyle(node);
  var mw = parseInt(style.minWidth, 10) || proto._mw;
  var mh = parseInt(style.minHeight, 10) || proto._mh;
  var xw = parseInt(style.maxWidth, 10) || proto._xw;
  var xh = parseInt(style.maxHeight, 10) || proto._xh;
  var bt = parseInt(style.borderTopWidth, 10) || proto._bt;
  var bl = parseInt(style.borderLeftWidth, 10) || proto._bl;
  var br = parseInt(style.borderRightWidth, 10) || proto._br;
  var bb = parseInt(style.borderBottomWidth, 10) || proto._bb;
  var pt = parseInt(style.paddingTop, 10) || proto._pt;
  var pl = parseInt(style.paddingLeft, 10) || proto._pl;
  var pr = parseInt(style.paddingRight, 10) || proto._pr;
  var pb = parseInt(style.paddingBottom, 10) || proto._pb;
  var box = Object.create(proto);
  if (mw !== proto._mw) box._mw = mw;
  if (mh !== proto._mh) box._mh = mh;
  if (xw !== proto._xw) box._xw = xw;
  if (xh !== proto._xh) box._xh = xh;
  if (bt !== proto._bt) box._bt = bt;
  if (bl !== proto._bl) box._bl = bl;
  if (br !== proto._br) box._br = br;
  if (bb !== proto._bb) box._bb = bb;
  if (pt !== proto._pt) box._pt = pt;
  if (pl !== proto._pl) box._pl = pl;
  if (pr !== proto._pr) box._pr = pr;
  if (pb !== proto._pb) box._pb = pb;
  return <IBoxSizing>box;
}


/**
 * The box sizing prototype object used by `createBoxSizing`.
 */
var boxSizingProto = {
  get minWidth() { return this._mw; },
  get minHeight() { return this._mh; },
  get maxWidth() { return this._xw; },
  get maxHeight() { return this._xh; },
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
  _mw: 0, _mh: 0, _xw: Infinity, _xh: Infinity,
  _bt: 0, _bl: 0, _br: 0, _bb: 0,
  _pt: 0, _pl: 0, _pr: 0, _pb: 0,
};

} // module phosphor.utility
