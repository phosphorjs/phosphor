/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/


/**
 * An object which generates background colors for grid sections.
 *
 * #### Notes
 * A section striping object can be used to generate "zebra striping"
 * for rows and columns in a data grid.
 *
 * If the state of a striping object is changed in-place, the grid must
 * be manually refreshed in order to paint the new effective results.
 *
 * A striping object **must not** throw exceptions, and **must not**
 * mutate the data model or the data grid.
 */
export
interface ISectionStriping {
  /**
   * Get the background color for a specific index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The background color for the section, or an empty string.
   */
  sectionColor(index: number): string;
}


/**
 * A concrete implementation of `ISectionStriping`.
 *
 * #### Notes
 * This class supports striping based on even-odd indices.
 */
export
class EvenOddStriping implements ISectionStriping {
  /**
   * Construct a new even-odd striping object.
   *
   * @param options - The options for initializing the object.
   */
  constructor(options: EvenOddStriping.IOptions = {}) {
    this.evenColor = options.evenColor || '';
    this.oddColor = options.oddColor || '';
  }

  /**
   * The background color for even numbered sections.
   */
  evenColor: string;

  /**
   * The background color for odd numbered sections.
   */
  oddColor: string;

  /**
   * Get the background color for a specific index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The background color for the section, or an empty string.
   */
  sectionColor(index: number): string {
    return index % 2 === 0 ? this.evenColor : this.oddColor;
  }
}


/**
 * The namespace for the `EvenOddStriping` class statics.
 */
export
namespace EvenOddStriping {
  /**
   * An options object for initializing an even-odd striping object.
   */
  export
  interface IOptions {
    /**
     * The background color for even numbered sections.
     */
    evenColor?: string;

    /**
     * The background color for odd numbered sections.
     */
    oddColor?: string;
  }
}
