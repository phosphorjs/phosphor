/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * Get the currently visible viewport rect in page coordinates.
 */
export
function clientViewportRect(): Rect {
  var elem = document.documentElement;
  var x = window.pageXOffset;
  var y = window.pageYOffset;
  var w = x + elem.clientWidth;
  var h = y + elem.clientHeight;
  return new Rect(x, y, w, h);
}

} // module phosphor.utility
