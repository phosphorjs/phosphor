/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * Test whether a client position lies within a node.
 *
 * @param node - The DOM node of interest.
 *
 * @param clientX - The client X coordinate of interest.
 *
 * @param clientY - The client Y coordinate of interest.
 *
 * @returns `true` if the node covers the position, `false` otherwise.
 *
 * #### Example
 * ```typescript
 * import { hitTest } from 'phosphor/lib/dom/query';
 *
 * let div = document.createElement('div');
 * div.style.position = 'absolute';
 * div.style.left = '0px';
 * div.style.top = '0px';
 * div.style.width = '100px';
 * div.style.height = '100px';
 * document.body.appendChild(div);
 *
 * hitTest(div, 50, 50);   // true
 * hitTest(div, 150, 150); // false
 * ```
 */
export
function hitTest(node: Element, clientX: number, clientY: number): boolean {
  let rect = node.getBoundingClientRect();
  return (
    clientX >= rect.left &&
    clientX < rect.right &&
    clientY >= rect.top &&
    clientY < rect.bottom
  );
}


/**
 * Vertically scroll an element into view if needed.
 *
 * @param area - The scroll area element.
 *
 * @param elem - The element of interest.
 *
 * #### Notes
 * This follows the "nearest" behavior of the native `scrollIntoView`
 * method, which is not supported by all browsers.
 * https://drafts.csswg.org/cssom-view/#element-scrolling-members
 *
 * If the element fully covers the visible area or is fully contained
 * within the visible area, no scrolling will take place. Otherwise,
 * the nearest edges of the area and element are aligned.
 *
 * #### Example
 * ```typescript
 * import { scrollIntoViewIfNeeded } from 'phosphor/lib/dom/query';
 *
 * let area = document.createElement('div');
 * let elem = document.createElement('div');
 *
 * // Style the scrollable area with a small height and a black border.
 * area.style.height = '100px';
 * area.style.overflow = 'auto';
 * area.style.border = '1px solid black';
 *
 * // Style the element of interest with a red border and some content.
 * elem.style.border = '1px solid red';
 * elem.textContent = 'visible content';
 *
 * // Add enough whitespace to to guarantee scrolling.
 * for (let i = 0; i < 50; i++) {
 *   area.appendChild(document.createElement('br'));
 * }
 *
 * // Attach the nodes to the DOM.
 * area.appendChild(elem);
 * document.body.appendChild(area);
 *
 * // Scroll to the element of interest.
 * scrollIntoViewIfNeeded(area, elem);
 * ```
 */
export
function scrollIntoViewIfNeeded(area: HTMLElement, elem: HTMLElement): void {
  let ar = area.getBoundingClientRect();
  let er = elem.getBoundingClientRect();
  if (er.top <= ar.top && er.bottom >= ar.bottom) {
    return;
  }
  if (er.top < ar.top && er.height <= ar.height) {
    area.scrollTop -= ar.top - er.top;
    return;
  }
  if (er.bottom > ar.bottom && er.height >= ar.height) {
    area.scrollTop -= ar.top - er.top;
    return;
  }
  if (er.top < ar.top && er.height > ar.height) {
    area.scrollTop -= ar.bottom - er.bottom;
    return;
  }
  if (er.bottom > ar.bottom && er.height < ar.height) {
    area.scrollTop -= ar.bottom - er.bottom;
    return;
  }
}
