/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.dom {

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
  if (bt !== 0) data._m_bt = bt;
  if (bl !== 0) data._m_bl = bl;
  if (br !== 0) data._m_br = br;
  if (bb !== 0) data._m_bb = bb;
  if (pt !== 0) data._m_pt = pt;
  if (pl !== 0) data._m_pl = pl;
  if (pr !== 0) data._m_pr = pr;
  if (pb !== 0) data._m_pb = pb;
  return <IBoxData>data;
}


/**
 * The box data prototype object used by `createBoxData`.
 */
var boxDataProto: IBoxData = {
  get borderTop() { return this._m_bt; },
  get borderLeft() { return this._m_bl; },
  get borderRight() { return this._m_br; },
  get borderBottom() { return this._m_bb; },
  get paddingTop() { return this._m_pt; },
  get paddingLeft() { return this._m_pl; },
  get paddingRight() { return this._m_pr; },
  get paddingBottom() { return this._m_pb; },
  get verticalSum() { return this._m_bt + this._m_bb + this._m_pt + this._m_pb; },
  get horizontalSum() { return this._m_bl + this._m_br + this._m_pl + this._m_pr; },
  _m_bt: 0, _m_bl: 0, _m_br: 0, _m_bb: 0, _m_pt: 0, _m_pl: 0, _m_pr: 0, _m_pb: 0,
};

} // module phosphor.dom
