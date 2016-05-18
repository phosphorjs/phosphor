/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * Calculate the specificity of a single CSS selector.
 *
 * @param selector - The CSS selector of interest.
 *
 * @returns The specificity of the selector.
 *
 * #### Undefined Behavior
 * The selector is invalid or has multiple comma-separated selectors.
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
 * The computed result is cached, so subsequent calculations for the
 * same selector are extremely fast.
 */
export
function calculateSpecificity(selector: string): number {
  let result = Private.specificityCache[selector];
  if (result === void 0) {
    result = Private.calculateSingle(selector);
    Private.specificityCache[selector] = result;
  }
  return result;
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
  let result = Private.validityCache[selector];
  if (result === void 0) {
    try {
      Private.testElem.querySelector(selector);
      result = true;
    } catch (err) {
      result = false;
    }
    Private.validityCache[selector] = result;
  }
  return result;
}


/**
 * The namespace for the private module data.
 */
namespace Private {
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
  const PSEUDO_CLASS_RE = /^:[^\s\+>~#\.\[:]+/;

  /**
   * A regex which matches ignored characters at string start.
   */
  const IGNORE_RE = /^[\s\+>~\*]+/;

  /**
   * A regex which matches the negation pseudo-class globally.
   */
  const NEGATION_RE = /:not\(([^\)]+)\)/g;

  /**
   * A cached of computed selector specificity values.
   */
  export
  const specificityCache: { [key: string]: number } = Object.create(null);

  /**
   * A cached of computed selector validity.
   */
  export
  const validityCache: { [key: string]: boolean } = Object.create(null);

  /**
   * An empty element for testing selector validity.
   */
  export
  const testElem = document.createElement('div');

  /**
   * Calculate the specificity of a single selector.
   *
   * The behavior is undefined if the selector is invalid or has
   * multiple comma-separated selectors.
   */
  export
  function calculateSingle(selector: string): number {
    // Setup the aggregate counters.
    let a = 0;
    let b = 0;
    let c = 0;

    // Apply a regex to the front selector. If the match succeeds, that
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
      // a pseudo-class since this regex overlaps with the class regex.
      if (match(PSEUDO_ELEM_RE)) { c++; continue; }

      // Match a pseudo-class selector.
      if (match(PSEUDO_CLASS_RE)) { b++; continue; }

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
    return (a << 16) + (b << 8) + c;
  }
}
