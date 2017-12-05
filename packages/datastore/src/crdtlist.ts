/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt, IIterable, IIterator, IRetroable, empty, iter, iterFn, retro
} from '@phosphor/algorithm';


/**
 * A container which implements a low-level CRDT list.
 *
 * https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type
 */
export
class CRDTList<T> implements IIterable<T>, IRetroable<T> {
  /**
   * Whether the list is empty.
   *
   * #### Complexity
   * Constant.
   */
  get isEmpty(): boolean {
    return this._values.length === 0;
  }

  /**
   * The length of the list.
   *
   * #### Complexity
   * Constant.
   */
  get length(): number {
    return this._values.length;
  }

  /**
   * Get an iterator over the object's values.
   *
   * @returns An iterator which yields the object's values.
   *
   * #### Complexity
   * Constant.
   */
  iter(): IIterator<T> {
    return iter(this._values);
  }

  /**
   * Get a reverse iterator over the object's values.
   *
   * @returns An iterator which yields the object's values in reverse.
   *
   * #### Complexity
   * Constant.
   */
  retro(): IIterator<T> {
    return retro(this._values);
  }

  /**
   * Get the value at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the sequence.
   *
   * @returns The value at the specified index or `undefined` if the
   *   index is out of range.
   *
   * #### Complexity
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  at(index: number): T | undefined {
    // Wrap negative indices.
    if (index < 0) {
      index += this._values.length;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._values.length) {
      return undefined;
    }

    // Return the value at the index.
    return this._values[index];
  }

  /**
   * Get the value for a specific identifier.
   *
   * @param id - The identifier of interest.
   *
   * @returns The value for the given identifier or `undefined` if the
   *   identifier is not contained in the sequence.
   *
   * #### Complexity
   * Logarithmic.
   */
  get(id: string): T | undefined {
    // Find the index for the given id.
    let i = ArrayExt.lowerBound(this._ids, id, CRDTList.compareIds);

    // Bail early if the id does not exist.
    if (i === this._ids.length || this._ids[i] !== id) {
      return undefined;
    }

    // Return the value for the given id.
    return this._values[i];
  }

  /**
   * Get the identifier at a specific index.
   *
   * @param index - The integer index of interest. Negative values are
   *   taken as an offset from the end of the sequence.
   *
   * @returns The identifier at the specified index or `undefined` if
   *   the index is out of range.
   *
   * #### Complexity
   * Constant.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   */
  idAt(index: number): string | undefined {
    // Wrap negative indices.
    if (index < 0) {
      index += this._ids.length;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._ids.length) {
      return undefined;
    }

    // Return the identifier at the index.
    return this._ids[index];
  }

  /**
   * Get the index for a specific identifier.
   *
   * @param id - The identifier of interest.
   *
   * @returns The index of the specified identifier if it exists in the
   *   sequence. Otherwise, the value `-i - 1` is returned where `i` is
   *   the index the identifier would occupy if added to the sequence.
   *
   * #### Complexity
   * Logarithmic.
   */
  idIndex(id: string): number {
    // Find the index for the given id.
    let i = ArrayExt.lowerBound(this._ids, id, CRDTList.compareIds);

    // Bail early if the id does not exist.
    if (i === this._ids.length || this._ids[i] !== id) {
      return -i - 1;
    }

    // Return the index for the given id.
    return i;
  }

  /**
   * Insert a value into the sequence.
   *
   * @param id - The identifier for the value.
   *
   * @param value - The value to insert into the sequence.
   *
   * @returns An `{ index, value }` pair where `index` is the current
   *   index of the value and `value` is the old value for the given
   *   identifier or `undefined` if the identifier was not contained
   *   in the sequence.
   *
   * #### Complexity
   * Linear.
   */
  insert(id: string, value: T): { index: number, value: T | undefined } {
    // Find the index for the given id.
    let i = ArrayExt.lowerBound(this._ids, id, CRDTList.compareIds);

    // Swap values if the id is already in the sequence.
    if (i < this._ids.length && this._ids[i] === id) {
      let old = this._values[i];
      this._values[i] = value;
      return { index: i, value: old };
    }

    // Insert the new id and value.
    ArrayExt.insert(this._ids, i, id);
    ArrayExt.insert(this._values, i, value);

    // Return the result.
    return { index: i, value: undefined };
  }

  /**
   * Remove the value for a specific id.
   *
   * @param id - The identifier of the value to remove.
   *
   * @returns An `{ index, value }` pair where `index` is the index
   *   of the value or `-1`, and `value` is the value for the given
   *   identifier or `undefined` if the identifier was not contained
   *   in the sequence.
   *
   * #### Complexity
   * Linear.
   */
  delete(id: string): { index: number, value: T | undefined } {
    // Find the index for the given id.
    let i = ArrayExt.lowerBound(this._ids, id, CRDTList.compareIds);

    // Bail early if the identifier was not found.
    if (i === this._ids.length || this._ids[i] !== id) {
      return { index: -1, value: undefined };
    }

    // Remove the id and value.
    ArrayExt.removeAt(this._ids, i);
    let value = ArrayExt.removeAt(this._values, i);

    // Return the result.
    return { index: i, value };
  }

  /**
   * Remove the value at a specific index.
   *
   * @param index - The index of the value to remove. Negative values
   *   are taken as an offset from the end of the sequence.
   *
   * @returns An `{ id, value }` pair where `id` is the identifier of
   *   the value or `undefined`, and `value` is the value at the given
   *   index or `undefined` if the index is out of range.
   *
   * #### Complexity
   * Linear.
   */
  remove(index: number): { id: string | undefined, value: T | undefined } {
    // Wrap negative indices.
    if (index < 0) {
      index += this._values.length;
    }

    // Bail early if the index is out of range.
    if (index < 0 || index >= this._values.length) {
      return { id: undefined, value: undefined };
    }

    // Remove the id and value.
    let id = ArrayExt.removeAt(this._ids, index);
    let value = ArrayExt.removeAt(this._values, index);

    // Return the result.
    return { id, value };
  }

  /**
   * Remove all values from the sequence.
   *
   * @returns A pair of `{ identifiers, values }` which hold the
   *   identifiers and values removed from the sequence in their
   *   original order.
   *
   * #### Complexity
   * Linear.
   */
  clear(): { ids: string[], values: T[] } {
    // Create shallow copies of the identifiers and values.
    let ids = this._ids.slice();
    let values = this._values.slice();

    // Clear the internal arrays.
    this._ids.length = 0;
    this._values.length = 0;

    // Return the result.
    return { ids, values };
  }

  private _ids: string[] = [];
  private _values: T[] = [];
}


/**
 * The namespace for the `CRDTList` class statics.
 */
export
namespace CRDTList {
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
   * @returns `< 0` if `a < b`, `> 0` if `a > b`, or `0` if `a = b`.
   */
  export
  function compareIds(a: string, b: string): number {
    return a < b ? -1 : b < a ? 1 : 0;
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
