/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  DataGrid
} from './datagrid';


/**
 * An implementation of `IStriping` based on even-odd indices.
 */
export
class EvenOddStriping implements DataGrid.IStriping {
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
   * @param index - The index of the relevant section.
   *
   * @returns The background color for the section, or `''`.
   */
  backgroundColor(index: number): string {
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
