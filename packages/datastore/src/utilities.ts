/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2018, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * Create a duplex string identifier.
 *
 * @param version - The datastore version for the duplex id.
 *
 * @param store - The datastore id for the duplex id.
 *
 * @returns A string duplex id for the given arguments.
 *
 * #### Notes
 * ID format: <6-byte version><4-byte storeId>
 */
export
function createDuplexId(version: number, store: number): string {
  // Split the version into 16-bit values.
  let vc = version & 0xFFFF;
  let vb = (((version - vc) / 0x10000) | 0) & 0xFFFF;
  let va = (((version - vb - vc) / 0x100000000) | 0) & 0xFFFF;

  // Split the store id into 16-bit values.
  let sb = store & 0xFFFF;
  let sa = (((store - sb) / 0x10000) | 0) & 0xFFFF;

  // Convert the parts into a string identifier duplex.
  return String.fromCharCode(va, vb, vc, sa, sb);
}


/**
 * Create a triplex string identifier between two boundaries.
 *
 * @param version - The datastore version for the triplex id.
 *
 * @param store - The datastore id for the triplex id.
 *
 * @param lower - The lower triplex boundary identifier or `''`
 *   to represent the lowest-most boundary.
 *
 * @param upper - The upper triplex boundary identifier or `''`
 *   to represent the upper-most boundary.
 *
 * @returns A new triplex identifier between the two boundaries.
 *
 * #### Notes
 * ID format: <6-byte path><6-byte version><4-byte storeId> * (N >= 1)
 */
export
function createTriplexId(version: number, store: number, lower: string, upper: string): string {
  // The maximum path in a triplex id.
  const MAX_PATH = 0xFFFFFFFFFFFF;

  // Set up the variable to hold the id.
  let id = '';

  // Fetch the triplet counts of the ids.
  let lowerCount = lower ? Private.idTripletCount(lower) : 0;
  let upperCount = upper ? Private.idTripletCount(upper) : 0;

  // Iterate over the id triplets.
  for (let i = 0, n = Math.max(lowerCount, upperCount); i < n; ++i) {
    // Fetch the lower identifier triplet, padding as needed.
    let lp: number;
    let lc: number;
    let ls: number;
    if (i >= lowerCount) {
      lp = 0;
      lc = 0;
      ls = 0;
    } else {
      lp = Private.idPathAt(lower, i);
      lc = Private.idVersionAt(lower, i);
      ls = Private.idStoreAt(lower, i);
    }

    // Fetch the upper identifier triplet, padding as needed.
    let up: number;
    let uc: number;
    let us: number;
    if (i >= upperCount) {
      up = upperCount === 0 ? MAX_PATH + 1 : 0;
      uc = 0;
      us = 0;
    } else {
      up = Private.idPathAt(upper, i);
      uc = Private.idVersionAt(upper, i);
      us = Private.idStoreAt(upper, i);
    }

    // If the triplets are the same, copy the triplet and continue.
    if (lp === up && lc === uc && ls === us) {
      id += Private.createTriplet(lp, lc, ls);
      continue;
    }

    // If the triplets are different, the well-ordered identifiers
    // assumption means that the lower triplet compares less than
    // the upper triplet. The task now is to find the nearest free
    // path slot among the remaining triplets.

    // If there is free space between the path portions of the
    // triplets, select a new path which falls between them.
    if (up - lp > 1) {
      let np = Private.randomPath(lp + 1, up - 1);
      id += Private.createTriplet(np, version, store);
      return id.slice();
    }

    // Otherwise, copy the left triplet and reset the upper count
    // to zero so that the loop chooses the nearest available path
    // slot after the current lower triplet.
    id += Private.createTriplet(lp, lc, ls);
    upperCount = 0;
  }

  // If this point is reached, the lower and upper identifiers share
  // the same path but diverge based on the version or store id. It is
  // safe to insert anywhere in an extra triplet.
  let np = Private.randomPath(1, MAX_PATH);
  id += Private.createTriplet(np, version, store);
  return id.slice();
}


/**
 * Create the multiple triplex identifiers.
 *
 * @param n - The number of identifiers to create.
 *
 * @param version - The datastore version.
 *
 * @param store - The datastore id.
 *
 * @param lower - The lower boundary identifier, exclusive.
 *
 * @param uppper - The upper boundary identifier, exclusive.
 *
 * @returns The requested identifiers.
 */
export
function createTriplexIds(n: number, version: number, store: number, lower: string, upper: string): string[] {
  // Initialize the identifiers array.
  let ids: string[] = [];

  // Loop the required number of times.
  while (ids.length < n) {
    // Create an identifier between the boundaries.
    let id = createTriplexId(version, store, lower, upper);

    // Add the identifier to the array.
    ids.push(id);

    // Update the lower boundary identifier.
    lower = id;
  }

  // Return the generated identifiers.
  return ids;
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * Create a string identifier triplet.
   *
   * @param path - The path value for the triplet.
   *
   * @param version - The version for the triplet.
   *
   * @param store - The store id for the triplet.
   *
   * @returns The string identifier triplet.
   */
  export
  function createTriplet(path: number, version: number, store: number): string {
    // Split the path into 16-bit values.
    let pc = path & 0xFFFF;
    let pb = (((path - pc) / 0x10000) | 0) & 0xFFFF;
    let pa = (((path - pb - pc) / 0x100000000) | 0) & 0xFFFF;

    // Split the version into 16-bit values.
    let vc = version & 0xFFFF;
    let vb = (((version - vc) / 0x10000) | 0) & 0xFFFF;
    let va = (((version - vb - vc) / 0x100000000) | 0) & 0xFFFF;

    // Split the store id into 16-bit values.
    let sb = store & 0xFFFF;
    let sa = (((store - sb) / 0x10000) | 0) & 0xFFFF;

    // Convert the parts into a string identifier triplet.
    return String.fromCharCode(pa, pb, pc, va, vb, vc, sa, sb);
  }

  /**
   * Get the total number of path triplets in an identifier.
   *
   * @param id - The identifier of interest.
   *
   * @returns The total number of triplets in the id.
   */
  export
  function idTripletCount(id: string): number {
    return id.length >> 3;
  }

  /**
   * Get the path value for a particular triplet.
   *
   * @param id - The string id of interest.
   *
   * @param i - The index of the triplet.
   *
   * @returns The path value for the specified triplet.
   */
  export
  function idPathAt(id: string, i: number): number {
    let j = i << 3;
    let a = id.charCodeAt(j + 0);
    let b = id.charCodeAt(j + 1);
    let c = id.charCodeAt(j + 2);
    return a * 0x100000000 + b * 0x10000 + c;
  }

  /**
   * Get the version for a particular triplet.
   *
   * @param id - The identifier of interest.
   *
   * @param i - The index of the triplet.
   *
   * @returns The version for the specified triplet.
   */
  export
  function idVersionAt(id: string, i: number): number {
    let j = i << 3;
    let a = id.charCodeAt(j + 3);
    let b = id.charCodeAt(j + 4);
    let c = id.charCodeAt(j + 5);
    return a * 0x100000000 + b * 0x10000 + c;
  }

  /**
   * Get the store id for a particular triplet.
   *
   * @param id - The identifier of interest.
   *
   * @param i - The index of the triplet.
   *
   * @returns The store id for the specified triplet.
   */
  export
  function idStoreAt(id: string, i: number): number {
    let j = i << 3;
    let a = id.charCodeAt(j + 6);
    let b = id.charCodeAt(j + 7);
    return a * 0x10000 + b;
  }

  /**
   * Pick a path in the leading bucket of an inclusive range.
   *
   * @param min - The minimum allowed path, inclusive.
   *
   * @param max - The maximum allowed path, inclusive.
   *
   * @returns A random path in the leading bucket of the range.
   */
  export
  function randomPath(min: number, max: number): number {
    return min + Math.round(Math.random() * Math.sqrt(max - min));
  }
}
