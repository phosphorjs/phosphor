/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * The namespace for position related utilities.
 */
export
namespace Position {
  /**
   * The minimum position value.
   *
   * #### Notes
   * This position will compare less than all other positions.
   *
   * The `create` function will never return this position, which makes
   * it useful for representing a position before the start of a list.
   */
  export
  const MINIMUM = String.fromCharCode(0x00, 0x00);

  /**
   * The maximum position value.
   *
   * #### Notes
   * This position will compare greater than all other positions.
   *
   * The `create` function will never return this position, which makes
   * it useful for representing a position after the end of a list.
   */
  export
  const MAXIMUM = String.fromCharCode(0x00, 0x100);

  /**
   * Create a new position which sorts between two positions.
   *
   * @param id - The unique site id, as a byte string.
   *   This should have `length <= 15`.
   *
   * @param clock - The logical clock value, as a byte string.
   *   This should have `length <= 15`.
   *
   * @param pos1 - The first position of interest. This should
   *   compare less than the second position.
   *
   * @param pos2 - The second position of interest. This should
   *   compare greater than the first position.
   *
   * @returns A new position which sorts between the given positions.
   *
   * #### Undefined Behavior
   * An `id` or `clock` with `length > 15` or char codes `> 255`.
   *
   * A `pos1` which compares `>=` to `pos2`.
   */
  export
  function create(id: string, clock: string, pos1: string, pos2: string): string {
    let header = Private.createHeader(id, clock);
    let path = Private.createPath(pos1, pos2);
    return ''.concat(header, id, clock, path);
  }

  /**
   * Perform a 3-way comparison of two positions.
   *
   * @param pos1 - The first position of interest.
   *
   * @param pos2 - The second position of interest.
   *
   * @returns `< 0` if `pos1 < pos2`, `> 0` if `pos1 > pos2`,
   *   or `0` if the two positions are equal.
   *
   * #### Notes
   * This function first compares the path portion of the position,
   * followed by the site id, and finally the clock value.
   */
  export
  function compare(pos1: string, pos2: string): number {
    let i = Private.comparePath(pos1, pos2);
    if (i !== 0) {
      return i;
    }
    let j = Private.compareId(pos1, pos2);
    if (j !== 0) {
      return j;
    }
    let k = Private.compareClock(pos1, pos2);
    if (k !== 0) {
      return k;
    }
    return 0;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create the header byte for an id and clock value.
   */
  export
  function createHeader(id: string, clock: string): string {
    let a = id.length & 0x0F;
    let b = clock.length & 0x0F;
    return String.fromCharCode(a << 4 | b);
  }

  /**
   * Create a new path between the paths of the given positions.
   */
  export
  function createPath(pos1: string, pos2: string): string {
    // Set up an array to hold the path parts.
    let parts: number[] = [];

    // Look up the id sizes of the positions.
    let is1 = idSize(pos1);
    let is2 = idSize(pos2);

    // Look up the clock sizes of the positions.
    let cs1 = clockSize(pos1);
    let cs2 = clockSize(pos2);

    // Compute the path lengths of the positions.
    let n1 = pos1.length - cs1 - is1 - 1;
    let n2 = pos2.length - cs2 - is2 - 1;

    // Process the common path prefix.
    for (let i = 0, p1 = 0, p2 = 0, n = Math.max(n1, n2); i < n && p1 === p2; ++i) {
      // Get the path parts for the current index.
      p1 = i < n1 ? pos1.charCodeAt(1 + is1 + cs1 + i) : 0;
      p2 = i < n2 ? pos2.charCodeAt(1 + is2 + cs2 + i) : 0;

      // Create the path immediately if there is available space.
      if (p2 - p1 > 1) {
        parts.push(createPart(p1, p2));
        return String.fromCharCode(...parts);
      }

      // Otherwise, follow the left path.
      parts.push(p1);
    }

    // Find the next available left path.
    for (let i = parts.length; i < n1; ++i) {
      // Get the path part for the current index.
      let p = pos1.charCodeAt(1 + is1 + cs1 + i);

      // Create the path immediately if there is available space.
      if (p < 0xFF) {
        parts.push(createPart(p, 0x100));
        return String.fromCharCode(...parts);
      }

      // Otherwise, follow the path.
      parts.push(p);
    }

    // Add a new final part to the path.
    parts.push(createPart(0x00, 0x100));

    // Convert the parts into a path.
    return String.fromCharCode(...parts);
  }

  /**
   * Compare the paths of two position strings.
   */
  export
  function comparePath(pos1: string, pos2: string): number {
    // Get the byte sizes of the site ids.
    let is1 = idSize(pos1);
    let is2 = idSize(pos2);

    // Get the byte sizes of the clock values.
    let cs1 = clockSize(pos1);
    let cs2 = clockSize(pos2);

    // Compute the byte sizes of the paths.
    let ps1 = pos1.length - cs1 - is1 - 1;
    let ps2 = pos2.length - cs2 - is2 - 1;

    // Compare each byte of the path.
    for (let i = 0, n = Math.max(ps1, ps2); i < n; ++i) {
      let a = i < ps1 ? pos1.charCodeAt(1 + is1 + cs1 + i) : 0;
      let b = i < ps2 ? pos2.charCodeAt(1 + is2 + cs2 + i) : 0;
      if (a !== b) {
        return a - b;
      }
    }

    // The paths are equal.
    return 0;
  }

  /**
   * Compare the site ids of two position strings.
   */
  export
  function compareId(pos1: string, pos2: string): number {
    // Get the byte sizes of the site ids.
    let is1 = idSize(pos1);
    let is2 = idSize(pos2);

    // Different byte sizes equates to different magnitudes.
    if (is1 !== is2) {
      return is1 - is2;
    }

    // Compare each byte of the site ids.
    for (let i = 0; i < is1; ++i) {
      let a = pos1.charCodeAt(1 + i);
      let b = pos2.charCodeAt(1 + i);
      if (a !== b) {
        return a - b;
      }
    }

    // The site ids are equal.
    return 0;
  }

  /**
   * Compare the clock values of two position strings.
   */
  export
  function compareClock(pos1: string, pos2: string): number {
    // Get the byte sizes of the clock values.
    let cs1 = clockSize(pos1);
    let cs2 = clockSize(pos2);

    // Different byte sizes equates to different magnitudes.
    if (cs1 !== cs2) {
      return cs1 - cs2;
    }

    // Get the byte sizes of the site ids.
    let is1 = idSize(pos1);
    let is2 = idSize(pos2);

    // Compare each byte of the clock values.
    for (let i = 0; i < cs1; ++i) {
      let a = pos1.charCodeAt(1 + is1 + i);
      let b = pos2.charCodeAt(1 + is2 + i);
      if (a !== b) {
        return a - b;
      }
    }

    // The clock values are equal.
    return 0;
  }

  /**
   * Get the byte size of the site id in a position string.
   */
  function idSize(pos: string): number {
    return pos.charCodeAt(0) >> 4 & 0x0F;
  }

  /**
   * Get the byte size of the clock value in a position string.
   */
  function clockSize(pos: string): number {
    return pos.charCodeAt(0) >> 0 & 0x0F;
  }

  /**
   * Create a random path part between two values.
   *
   * @param a - The lower part boundary `< b - 1`, exclusive.
   *
   * @param b - The upper part boundary `> a + 1`, exclusive.
   *
   * @returns A random part between the two boundaries.
   */
  function createPart(a: number, b: number): number {
    // Generate a non-zero random variable that is biased to the front
    // of the range. This allows more space for subsequent inserts.
    do { var r = 0.3 * Math.random(); } while (r === 0);

    // Scale the random variable to the range.
    return a + Math.ceil(r * (b - a - 1));
  }
}
