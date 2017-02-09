/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
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
   * Compute a fuzzy match for the given search text.
   *
   * @param source - The source text which should be searched.
   *
   * @param query - The query text to locate in the source text.
   *
   * @returns The match result object, or `null` if there is no match.
   *
   * #### Complexity
   * Linear on `source`.
   *
   * #### Notes
   * This scoring algorithm uses a sum-of-squares approach to determine
   * the score. In order for there to be a match, all of the characters
   * in `query` **must** appear in `source` in order. The index of each
   * matching character is squared and added to the score. This means
   * that early and consecutive character matches are preferred.
   *
   * The character match is performed with strict equality. It is case
   * sensitive and does not ignore whitespace. If those behaviors are
   * required, the text should be transformed before scoring.
   */
  export
  function fuzzySearch(source: string, query: string): fuzzySearch.IResult | null {
    let score = 0;
    let indices = new Array<number>(query.length);
    for (let i = 0, j = 0, n = query.length; i < n; ++i, ++j) {
      j = source.indexOf(query[i], j);
      if (j === -1) {
        return null;
      }
      indices[i] = j;
      score += j * j;
    }
    return { score, indices };
  }

  /**
   * The namespace for the `fuzzySearch` statics.
   */
  export
  namespace fuzzySearch {
    /**
     * The result of a fuzzy search.
     */
    export
    interface IResult {
      /**
       * A score which indicates the strength of the match.
       *
       * A lower score is better. Zero is the best possible score.
       */
      score: number;

      /**
       * The indices of the matched characters in the source text.
       *
       * The indices will appear in increasing order.
       */
      indices: number[];
    }
  }
}
