/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * Test whether a client position lies within a node.
 */
export
function hitTest(node: HTMLElement, x: number, y: number): boolean {
  var rect = node.getBoundingClientRect();
  return x >= rect.left && x < rect.right && y >= rect.top && y < rect.bottom;
}

} // module phosphor.utility
