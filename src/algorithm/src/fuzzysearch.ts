/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2016, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * Compute a fuzzy match for the given search text.
 *
 * @param sourceText - The text which should be searched.
 *
 * @param queryText - The query text to locate in the source text.
 *
 * @returns The match result object, or `null` if there is no match.
 *
 * #### Complexity
 * Linear on `sourceText`.
 *
 * #### Notes
 * This scoring algorithm uses a sum-of-squares approach to determine
 * the score. In order for there to be a match, all of the characters
 * in `queryText` **must** appear in `sourceText` in order. The index
 * of each matching character is squared and added to the score. This
 * means that early and consecutive character matches are preferred.
 *
 * The character match is performed with strict equality. It is case
 * sensitive and does not ignore whitespace. If those behaviors are
 * required, the text should be transformed before scoring.
 */
export
function fuzzySearch(sourceText: string, queryText: string): fuzzySearch.ISearchResult | null {
  let score = 0;
  let indices = new Array<number>(queryText.length);
  for (let i = 0, j = 0, n = queryText.length; i < n; ++i, ++j) {
    j = sourceText.indexOf(queryText[i], j);
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
  interface ISearchResult {
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

  /**
   * Highlight the matched characters of a source string.
   *
   * @param source - The text which should be highlighted.
   *
   * @param indices - The indices of the matched characters. They must
   *   appear in increasing order and must be in bounds of the source.
   *
   * @returns A string with interpolated `<mark>` tags.
   */
  export
  function highlight(sourceText: string, indices: number[]): string {
    let k = 0;
    let last = 0;
    let result = '';
    let n = indices.length;
    while (k < n) {
      let i = indices[k];
      let j = indices[k];
      while (++k < n && indices[k] === j + 1) {
        j++;
      }
      let head = sourceText.slice(last, i);
      let chunk = sourceText.slice(i, j + 1);
      result += `${head}<mark>${chunk}</mark>`;
      last = j + 1;
    }
    return result + sourceText.slice(last);
  }
}
