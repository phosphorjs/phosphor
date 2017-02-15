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
namespace DOM {
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
    let bt = parseFloat(style.borderTopWidth!) || 0;
    let bl = parseFloat(style.borderLeftWidth!) || 0;
    let br = parseFloat(style.borderRightWidth!) || 0;
    let bb = parseFloat(style.borderBottomWidth!) || 0;
    let pt = parseFloat(style.paddingTop!) || 0;
    let pl = parseFloat(style.paddingLeft!) || 0;
    let pr = parseFloat(style.paddingRight!) || 0;
    let pb = parseFloat(style.paddingBottom!) || 0;
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
    let minWidth = parseFloat(style.minWidth!) || 0;
    let minHeight = parseFloat(style.minHeight!) || 0;
    let maxWidth = parseFloat(style.maxWidth!) || Infinity;
    let maxHeight = parseFloat(style.maxHeight!) || Infinity;
    maxWidth = Math.max(minWidth, maxWidth);
    maxHeight = Math.max(minHeight, maxHeight);
    return { minWidth, minHeight, maxWidth, maxHeight };
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
  function scrollIntoViewIfNeeded(area: Element, element: Element): void {
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

  /**
   * Calculate the specificity of a single CSS selector.
   *
   * @param selector - The CSS selector of interest.
   *
   * @returns The specificity of the selector.
   *
   * #### Undefined Behavior
   * The selector is invalid.
   *
   * #### Notes
   * This is based on https://www.w3.org/TR/css3-selectors/#specificity
   *
   * A larger number represents a more specific selector.
   *
   * The smallest possible specificity is `0`.
   *
   * The result is represented as a hex number `0x<aa><bb><cc>` where
   * each component is the count of the respective selector clause.
   *
   * If the selector contains commas, only the first clause is used.
   *
   * The computed result is cached, so subsequent calculations for the
   * same selector are extremely fast.
   */
  export
  function calculateSpecificity(selector: string): number {
    if (selector in Private.specificityCache) {
      return Private.specificityCache[selector];
    }
    let result = Private.calculateSingle(selector);
    return Private.specificityCache[selector] = result;
  }

  /**
   * Test whether a selector is a valid CSS selector.
   *
   * @param selector - The CSS selector of interest.
   *
   * @returns `true` if the selector is valid, `false` otherwise.
   *
   * #### Notes
   * The computed result is cached, so subsequent tests for the same
   * selector are extremely fast.
   */
  export
  function isValidSelector(selector: string): boolean {
    if (selector in Private.validityCache) {
      return Private.validityCache[selector];
    }
    let result = true;
    try {
      Private.testElem.querySelector(selector);
    } catch (err) {
      result = false;
    }
    return Private.validityCache[selector] = result;
  }

  /**
   * Test whether an element matches a CSS selector.
   *
   * @param element - The element of interest.
   *
   * @param selector - The valid CSS selector of interest.
   *
   * @returns `true` if the element is a match, `false` otherwise.
   *
   * #### Notes
   * This function uses the builtin browser capabilities when possible,
   * falling back onto a document query otherwise.
   */
  export
  function matchesSelector(element: Element, selector: string): boolean {
    return Private.protoMatchFunc.call(element, selector);
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A type alias for an object hash.
   */
  export
  type StringMap<T> = { [key: string]: T };

  /**
   * A cache of computed selector specificity values.
   */
  export
  const specificityCache: StringMap<number> = Object.create(null);

  /**
   * A cache of computed selector validity.
   */
  export
  const validityCache: StringMap<boolean> = Object.create(null);

  /**
   * An empty element for testing selector validity.
   */
  export
  const testElem = document.createElement('div');

  /**
   * A cross-browser CSS selector matching prototype function.
   */
  export
  const protoMatchFunc: Function = (() => {
    let proto = Element.prototype as any;
    return (
      proto.matches ||
      proto.matchesSelector ||
      proto.mozMatchesSelector ||
      proto.msMatchesSelector ||
      proto.oMatchesSelector ||
      proto.webkitMatchesSelector ||
      (function(selector: string) {
        let elem = this as Element;
        let matches = elem.ownerDocument.querySelectorAll(selector);
        return Array.prototype.indexOf.call(matches, elem) !== -1;
      })
    );
  })();

  /**
   * Calculate the specificity of a single selector.
   *
   * The behavior is undefined if the selector is invalid.
   */
  export
  function calculateSingle(selector: string): number {
    // Ignore anything after the first comma.
    selector = selector.split(',', 1)[0];

    // Setup the aggregate counters.
    let a = 0;
    let b = 0;
    let c = 0;

    // Apply a regex to the front of the selector. If it succeeds, that
    // portion of the selector is removed. Returns a success/fail flag.
    function match(re: RegExp): boolean {
      let match = selector.match(re);
      if (match === null) {
        return false;
      }
      selector = selector.slice(match[0].length);
      return true;
    }

    // Replace the negation pseudo-class (which is ignored),
    // but keep its inner content (which is not ignored).
    selector = selector.replace(NEGATION_RE, ' $1 ');

    // Continue matching until the selector is consumed.
    while (selector.length > 0) {

      // Match an ID selector.
      if (match(ID_RE)) { a++; continue; }

      // Match a class selector.
      if (match(CLASS_RE)) { b++; continue; }

      // Match an attribute selector.
      if (match(ATTR_RE)) { b++; continue; }

      // Match a pseudo-element selector. This is done before matching
      // a pseudo-class since this regex overlaps with that regex.
      if (match(PSEUDO_ELEM_RE)) { c++; continue; }

      // Match a pseudo-class selector.
      if (match(PSEDUO_CLASS_RE)) { b++; continue; }

      // Match a plain type selector.
      if (match(TYPE_RE)) { c++; continue; }

      // Finally, match any ignored characters.
      if (match(IGNORE_RE)) { continue; }

      // At this point, the selector is assumed to be invalid.
      return 0;
    }

    // Clamp each component to a reasonable base.
    a = Math.min(a, 0xFF);
    b = Math.min(b, 0xFF);
    c = Math.min(c, 0xFF);

    // Combine the components into a single result.
    return (a << 16) | (b << 8) | c;
  }

  /**
   * A regex which matches an ID selector at string start.
   */
  const ID_RE = /^#[^\s\+>~#\.\[:]+/;

  /**
   * A regex which matches a class selector at string start.
   */
  const CLASS_RE = /^\.[^\s\+>~#\.\[:]+/;

  /**
   * A regex which matches an attribute selector at string start.
   */
  const ATTR_RE = /^\[[^\]]+\]/;

  /**
   * A regex which matches a type selector at string start.
   */
  const TYPE_RE = /^[^\s\+>~#\.\[:]+/;

  /**
   * A regex which matches a pseudo-element selector at string start.
   */
  const PSEUDO_ELEM_RE = /^(::[^\s\+>~#\.\[:]+|:first-line|:first-letter|:before|:after)/;

  /**
   * A regex which matches a pseudo-class selector at string start.
   */
  const PSEDUO_CLASS_RE = /^:[^\s\+>~#\.\[:]+/;

  /**
   * A regex which matches ignored characters at string start.
   */
  const IGNORE_RE = /^[\s\+>~\*]+/;

  /**
   * A regex which matches the negation pseudo-class globally.
   */
  const NEGATION_RE = /:not\(([^\)]+)\)/g;
}
