/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, IIterator, empty, iterFn
} from '@phosphor/algorithm';


/**
 * The namespace for CRDT utilities.
 *
 * https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type
 */
export
namespace CRDTUtils {
  /**
   * The minimum allowed site value for identifier creation.
   */
  export
  const MIN_SITE = 0x0000;

  /**
   * The maximum allowed site value for identifier creation.
   */
  export
  const MAX_SITE = 0xFFFF;

  /**
   * The minimum allowed clock value for identifier creation.
   */
  export
  const MIN_CLOCK = 0x00000000;

  /**
   * The maximum allowed clock value for identifier creation.
   */
  export
  const MAX_CLOCK = 0xFFFFFFFF;

  /**
   * Perform a three-way comparison on two identifiers.
   *
   * @param a - The first identifier of interest.
   *
   * @param b - The second identifier of interest.
   *
   * @returns `-1` if `a < b`, `1` if `a > b`, or `0` if `a == b`.
   */
  export
  function compareIds(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
  }

  /**
   * Create identifiers between two boundary identifiers.
   *
   * @param options - The options for creating the identifiers.
   *
   * @returns An iterator which generates the requested number of
   *   identifiers between the specified boundaries.
   *
   * @throws An exception if the `site` or `clock` values are out of
   *   range, or if the boundary identifiers are malformed.
   *
   * #### Notes
   * The spacing between the generated identifiers is random.
   */
  export
  function createIds(options: createIds.IOptions): IIterator<string> {
    // Parse the options.
    let { n, site, clock, lower, upper } = options;

    // Validate the site value.
    if (site < MIN_SITE || site > MAX_SITE) {
      throw new Error('Invalid site id.');
    }

    // Validate the clock value.
    if (clock < MIN_CLOCK || clock > MAX_CLOCK) {
      throw new Error('Invalid clock value.');
    }

    // Validate the lower boundary identifier.
    if (lower && lower.length % 4 !== 0) {
      throw new Error('Malformed lower boundary identifier.');
    }

    // Validate the upper boundary identifier.
    if (upper && upper.length % 4 !== 0) {
      throw new Error('Malformed upper boundary identifier.');
    }

    // Compare the identifiers.
    let k = (lower && upper) ? compareIds(lower, upper) : -1;

    // Ensure the boundary identifiers are not equal.
    if (k === 0) {
      throw new Error('Boundary identifiers are equal.');
    }

    // Ensure the boundary identifiers are well ordered.
    if (k > 0) {
      throw new Error('Boundary identifiers are badly ordered.');
    }

    // Bail early if there is nothing to generate.
    if (n <= 0) {
      return empty<string>();
    }

    // Parse the boundary identifiers into a numeric representation.
    let plid = lower ? Private.parseId(lower) : [];
    let puid = upper ? Private.parseId(upper) : [];

    // Extract the path portions of the identifiers.
    let a = Private.extractPath(plid);
    let b = Private.extractPath(puid);

    // Set up the path padding values.
    let ap = 0x0000;
    let bp = upper ? 0x0000 : 0xFFFF;

    // Pad the paths to equal lengths.
    while (a.length < b.length) { a.push(ap); }
    while (b.length < a.length) { b.push(bp); }

    // Compute the distance between the paths.
    let d = Private.pathDistance(a, b);

    // Set up the base identifier prefix.
    let prefix: number[] = [];

    // If the path distance is zero, create a new suffix path branch.
    if (d === 0) {
      prefix = plid.slice();
      a = [0x0000];
      b = [0xFFFF];
      bp = 0xFFFF;
      d = 0xFFFF;
    }

    // Pad the paths until there is sufficient space between them.
    let space = d - 1;
    while (space < n) {
      a.push(ap);
      b.push(bp);
      space = Private.pathDistance(a, b) - 1;
    }

    // Create the identifier suffix.
    let suffix = Private.combinePath(a, site, clock);

    // Create the base identifier.
    let base = prefix.concat(suffix);

    // Compute the maximum iteration step size.
    let step = Math.min(Math.floor(space / n), 64);

    // Return an iterator which generates the ids.
    return iterFn(() => {
      // Stop iteration if there are no more identifiers to generate.
      if (n <= 0) {
        return undefined;
      }

      // Decrement the remaining iteration count.
      n--;

      // Compute the increment amount between `1` and `step` inclusive.
      let amt = Math.max(1, Math.round(Math.random() * step));

      // Increment the identifier by the computed amount.
      Private.incrementPath(base, amt);

      // Return the string form of the identifier.
      return String.fromCharCode(...base);
    });
  }

  /**
   * The namespace for the `createIds` function statics.
   */
  export
  namespace createIds {
    /**
     * The options for creating identifiers.
     */
    export
    interface IOptions {
      /**
       * The number of identifiers to generate.
       */
      n: number;

      /**
       * The site id for the new identifiers.
       */
      site: number;

      /**
       * The clock value for the new identifiers.
       */
      clock: number;

      /**
       * The lower boundary identifier.
       *
       * The default is the smallest possible identifier.
       */
      lower?: string;

      /**
       * The upper boundary identifier.
       *
       * The default is the largest possible identifier.
       */
      upper?: string;
    }
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Parse an id string into its numeric representation.
   */
  export
  function parseId(id: string): number[] {
    let result: number[] = [];
    for (let i = 0, n = id.length; i < n; ++i) {
      result[i] = id.charCodeAt(i);
    }
    return result;
  }

  /**
   * Extract the path portion of a numeric id.
   */
  export
  function extractPath(id: number[]): number[] {
    return ArrayExt.slice(id, { step: 4 });
  }

  /**
   * Combine a path, site, and clock into a numeric id.
   */
  export
  function combinePath(path: number[], site: number, clock: number): number[] {
    let cb = clock & 0xFFFF;
    let ca = (clock - cb) / 0x10000;
    let result: number[] = [];
    for (let i = 0; i < path.length; ++i) {
      result.push(path[i], site, ca, cb);
    }
    return result;
  }

  /**
   * Compute the distance between two equal-length paths.
   */
  export
  function pathDistance(a: number[], b: number[]): number {
    let result = 0;
    for (let i = 0, n = a.length; i < n; ++i) {
      result += (b[i] - a[i]) * Math.pow(0x10000, n - i - 1);
    }
    return result;
  }

  /**
   * Increment the path portion of an identifier by a given amount.
   *
   * @param id - The numeric identifier to modify.
   *
   * @param n - The amount to increment `<= 0x7FFF0000`.
   *
   * @returns The remainder of the increment, or `0`.
   */
  export
  function incrementPath(id: number[], n: number): number {
    for (let i = id.length - 4; i >= 0 && n > 0; i -= 4) {
      n += id[i];
      id[i] = n & 0xFFFF;
      n >>= 16;
    }
    return n;
  }
}
