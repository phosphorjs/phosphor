/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.domutil {

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
  var data = Object.create(boxDataProto);
  if (bt !== 0) data._bt = bt;
  if (bl !== 0) data._bl = bl;
  if (br !== 0) data._br = br;
  if (bb !== 0) data._bb = bb;
  if (pt !== 0) data._pt = pt;
  if (pl !== 0) data._pl = pl;
  if (pr !== 0) data._pr = pr;
  if (pb !== 0) data._pb = pb;
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
  _bt: 0, _bl: 0, _br: 0, _bb: 0, _pt: 0, _pl: 0, _pr: 0, _pb: 0,
};

} // module phosphor.domutil
