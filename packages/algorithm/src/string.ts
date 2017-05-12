/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * The namespace for string-specific algorithms.
 */
export
namespace StringExt {
  /**
   * Find the indices of characters in a source text.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The characters to locate in the source text.
   *
   * @returns The matched indices, or `null` if there is no match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   *
   * #### Notes
   * In order for there to be a match, all of the characters in `query`
   * **must** appear in `source` in the order given by `query`.
   *
   * Characters are matched using strict `===` equality.
   */
  export
  function findIndices(source: string, query: string): number[] | null {
    let indices = new Array<number>(query.length);
    for (let i = 0, j = 0, n = query.length; i < n; ++i, ++j) {
      j = source.indexOf(query[i], j);
      if (j === -1) {
        return null;
      }
      indices[i] = j;
    }
    return indices;
  }

  /**
   * The result of a string match function.
   */
  export
  interface IMatchResult {
    /**
     * A score which indicates the strength of the match.
     *
     * The documentation of a given match function should specify
     * whether a lower or higher score is a stronger match.
     */
    score: number;

    /**
     * The indices of the matched characters in the source text.
     *
     * The indices will appear in increasing order.
     */
    indices: number[];
  }

  /**
   * A string matcher that looks for an exact match.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The characters to locate in the source text.
   *
   * @returns The match result, or `null` if there is no match.
   *   A lower `score` represents a stronger match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   */
  export
  function matchExact(source: string, query: string): IMatchResult | null {
    let matchIndex = source.indexOf(query);
    if (matchIndex === -1) { return null; }
    let score = matchIndex;
    let indices = [];
    for (var i=0; i < query.length; i++) {
      indices.push(matchIndex+i);
    }
    return { score, indices };
  }

  /**
   * A string matcher which uses a sum-of-squares algorithm.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The characters to locate in the source text.
   *
   * @returns The match result, or `null` if there is no match.
   *   A lower `score` represents a stronger match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   *
   * #### Notes
   * This scoring algorithm uses a sum-of-squares approach to determine
   * the score. In order for there to be a match, all of the characters
   * in `query` **must** appear in `source` in order. The index of each
   * matching character is squared and added to the score. This means
   * that early and consecutive character matches are preferred, while
   * late matches are heavily penalized.
   */
  export
  function matchSumOfSquares(source: string, query: string): IMatchResult | null {
    let indices = findIndices(source, query);
    if (!indices) {
      return null;
    }
    let score = 0;
    for (let i = 0, n = indices.length; i < n; ++i) {
      let j = indices[i];
      score += j * j;
    }
    return { score, indices };
  }

  /**
   * A string matcher which uses a sum-of-deltas algorithm.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The characters to locate in the source text.
   *
   * @returns The match result, or `null` if there is no match.
   *   A lower `score` represents a stronger match.
   *
   * #### Complexity
   * Linear on `sourceText`.
   *
   * #### Notes
   * This scoring algorithm uses a sum-of-deltas approach to determine
   * the score. In order for there to be a match, all of the characters
   * in `query` **must** appear in `source` in order. The delta between
   * the indices are summed to create the score. This means that groups
   * of matched characters are preferred, while fragmented matches are
   * penalized.
   */
  export
  function matchSumOfDeltas(source: string, query: string): IMatchResult | null {
    let indices = findIndices(source, query);
    if (!indices) {
      return null;
    }
    let score = 0;
    let last = -1;
    for (let i = 0, n = indices.length; i < n; ++i) {
      let j = indices[i];
      score += j - last - 1;
      last = j;
    }
    return { score, indices };
  }

  /**
   * Highlight the matched characters of a source text.
   *
   * @param source - The text which should be highlighted.
   *
   * @param indices - The indices of the matched characters. They must
   *   appear in increasing order and must be in bounds of the source.
   *
   * @param fn - The function to apply to the matched chunks.
   *
   * @returns An array of unmatched and highlighted chunks.
   */
  export
  function highlight<T>(source: string, indices: ReadonlyArray<number>, fn: (chunk: string) => T): Array<string | T> {
    // Set up the result array.
    let result: Array<string |T> = [];

    // Set up the counter variables.
    let k = 0;
    let last = 0;
    let n = indices.length;

    // Iterator over each index.
    while (k < n) {
      // Set up the chunk indices.
      let i = indices[k];
      let j = indices[k];

      // Advance the right chunk index until it's non-contiguous.
      while (++k < n && indices[k] === j + 1) {
        j++;
      }

      // Extract the unmatched text.
      if (last < i) {
        result.push(source.slice(last, i));
      }

      // Extract and highlight the matched text.
      if (i < j + 1) {
        result.push(fn(source.slice(i, j + 1)));
      }

      // Update the last visited index.
      last = j + 1;
    }

    // Extract any remaining unmatched text.
    if (last < source.length) {
      result.push(source.slice(last));
    }

    // Return the highlighted result.
    return result;
  }
}
