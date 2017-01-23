/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * The namespace for DOM related utilities.
 */
export
namespace DOMUtil {
  /**
   * An object which holds the border and padding data for an element.
   */
  export
  interface IBoxSizing {
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
     * The sum of horizontal border and padding.
     */
    horizontalSum: number;

    /**
     * The sum of vertical border and padding.
     */
    verticalSum: number;
  }

  /**
   * Compute the box sizing for an element.
   *
   * @param element - The element of interest.
   *
   * @returns The box sizing data for the specified element.
   */
  export
  function boxSizing(element: Element): IBoxSizing {
    let style = window.getComputedStyle(element);
    let bt = parseInt(style.borderTopWidth!, 10) || 0;
    let bl = parseInt(style.borderLeftWidth!, 10) || 0;
    let br = parseInt(style.borderRightWidth!, 10) || 0;
    let bb = parseInt(style.borderBottomWidth!, 10) || 0;
    let pt = parseInt(style.paddingTop!, 10) || 0;
    let pl = parseInt(style.paddingLeft!, 10) || 0;
    let pr = parseInt(style.paddingRight!, 10) || 0;
    let pb = parseInt(style.paddingBottom!, 10) || 0;
    let hs = bl + pl + pr + br;
    let vs = bt + pt + pb + bb;
    return {
      borderTop: bt,
      borderLeft: bl,
      borderRight: br,
      borderBottom: bb,
      paddingTop: pt,
      paddingLeft: pl,
      paddingRight: pr,
      paddingBottom: pb,
      horizontalSum: hs,
      verticalSum: vs
    };
  }

  /**
   * An object which holds the min and max size data for an element.
   */
  export
  interface ISizeLimits {
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
   * Compute the size limits for an element.
   *
   * @param element - The element of interest.
   *
   * @returns The size limit data for the specified element.
   */
  export
  function sizeLimits(element: Element): ISizeLimits {
    let style = window.getComputedStyle(element);
    return {
      minWidth: parseInt(style.minWidth!, 10) || 0,
      minHeight: parseInt(style.minHeight!, 10) || 0,
      maxWidth: parseInt(style.maxWidth!, 10) || Infinity,
      maxHeight: parseInt(style.maxHeight!, 10) || Infinity
    };
  }

  /**
   * Test whether a client position lies within an element.
   *
   * @param element - The DOM element of interest.
   *
   * @param clientX - The client X coordinate of interest.
   *
   * @param clientY - The client Y coordinate of interest.
   *
   * @returns Whether the point is within the given element.
   */
  export
  function hitTest(element: Element, clientX: number, clientY: number): boolean {
    let rect = element.getBoundingClientRect();
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
   * @param element - The element of interest.
   *
   * #### Notes
   * This follows the "nearest" behavior of the native `scrollIntoView`
   * method, which is not supported by all browsers.
   * https://drafts.csswg.org/cssom-view/#element-scrolling-members
   *
   * If the element fully covers the visible area or is fully contained
   * within the visible area, no scrolling will take place. Otherwise,
   * the nearest edges of the area and element are aligned.
   */
  export
  function scrollIntoViewIfNeeded(area: HTMLElement, element: HTMLElement): void {
    let ar = area.getBoundingClientRect();
    let er = element.getBoundingClientRect();
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
}
