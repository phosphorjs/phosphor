/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2017, PhosphorJS Contributors
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
import {
  ArrayExt
} from '@phosphor/algorithm';


/**
 * An object which manages a collection of variable sized sections.
 *
 * #### Notes
 * This class is used to manage the row and column sizes in a grid.
 */
export
class SectionList {
  /**
   * Construct a new section list.
   *
   * @param options - The options for initializing the list.
   */
  constructor(options: SectionList.IOptions) {
    this._baseSize = Math.max(0, Math.floor(options.baseSize));
  }

  /**
   * The size of new sections added to the list.
   *
   * #### Complexity
   * Constant.
   */
  get baseSize(): number {
    return this._baseSize;
  }

  /**
   * The total size of all sections in the list.
   *
   * #### Complexity
   * Constant.
   */
  get totalSize(): number {
    return this._totalSize;
  }

  /**
   * The total number of sections in the list.
   *
   * #### Complexity
   * Constant.
   */
  get sectionCount(): number {
    return this._sectionCount;
  }

  /**
   * Find the index of the section which covers the given offset.
   *
   * @param offset - The offset of the section of interest.
   *
   * @returns The index of the section which covers the given offset,
   *   or `-1` if the offset is out of range.
   *
   * #### Complexity
   * Logarithmic on the number of resized sections.
   */
  sectionIndex(offset: number): number {
    // Bail early if the offset is out of range.
    if (offset < 0 || offset >= this._totalSize || this._sectionCount === 0) {
      return -1;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return Math.floor(offset / this._baseSize);
    }

    // Find the modified section for the given offset.
    let i = ArrayExt.lowerBound(this._sections, offset, Private.offsetCmp);

    // Return the index of an exact match.
    if (i < this._sections.length && this._sections[i].offset <= offset) {
      return this._sections[i].index;
    }

    // Handle the case of no modified sections before the offset.
    if (i === 0) {
      return Math.floor(offset / this._baseSize);
    }

    // Compute the index from the previous modified section.
    let section = this._sections[i - 1];
    let span = offset - (section.offset + section.size);
    return section.index + Math.floor(span / this._baseSize) + 1;
  }

  /**
   * Find the offset of the section at the given index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The offset of the section at the given index, or `-1`
   *   if the index is out of range.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Complexity
   * Logarithmic on the number of resized sections.
   */
  sectionOffset(index: number): number {
    // Bail early if the index is out of range.
    if (index < 0 || index >= this._sectionCount) {
      return -1;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return index * this._baseSize;
    }

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Return the offset of an exact match.
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].offset;
    }

    // Handle the case of no modified sections before the index.
    if (i === 0) {
      return index * this._baseSize;
    }

    // Compute the offset from the previous modified section.
    let section = this._sections[i - 1];
    let span = index - section.index - 1;
    return section.offset + section.size + span * this._baseSize;
  }

  /**
   * Find the size of the section at the given index.
   *
   * @param index - The index of the section of interest.
   *
   * @returns The size of the section at the given index, or `-1`
   *   if the index is out of range.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Complexity
   * Logarithmic on the number of resized sections.
   */
  sectionSize(index: number): number {
    // Bail early if the index is out of range.
    if (index < 0 || index >= this._sectionCount) {
      return -1;
    }

    // Handle the simple case of no modified sections.
    if (this._sections.length === 0) {
      return this._baseSize;
    }

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Return the size of an exact match.
    if (i < this._sections.length && this._sections[i].index === index) {
      return this._sections[i].size;
    }

    // Return the base size for all other cases.
    return this._baseSize;
  }

  /**
   * Resize a section in the list.
   *
   * @param index - The index of the section to resize. This method
   *   is a no-op if this value is out of range.
   *
   * @param size - The new size of the section. This value will be
   *   clamped to an integer `>= 0`.
   *
   * #### Undefined Behavior
   * An `index` which is non-integral.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  resizeSection(index: number, size: number): void {
    // Bail early if the index is out of range.
    if (index < 0 || index >= this._sectionCount) {
      return;
    }

    // Clamp the size to an integer >= 0.
    size = Math.max(0, Math.floor(size));

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Update or create the modified section as needed.
    let delta: number;
    if (i < this._sections.length && this._sections[i].index === index) {
      let section = this._sections[i];
      delta = size - section.size;
      section.size = size;
    } else if (i === 0) {
      let offset = index * this._baseSize;
      ArrayExt.insert(this._sections, i, { index, offset, size });
      delta = size - this._baseSize;
    } else {
      let section = this._sections[i - 1];
      let span = index - section.index - 1;
      let offset = section.offset + section.size + span * this._baseSize;
      ArrayExt.insert(this._sections, i, { index, offset, size });
      delta = size - this._baseSize;
    }

    // Adjust the totals.
    this._totalSize += delta;

    // Update all modified sections after the resized section.
    for (let j = i + 1, n = this._sections.length; j < n; ++j) {
      this._sections[j].offset += delta;
    }
  }

  /**
   * Insert sections into the list.
   *
   * @param index - The index at which to insert the sections.
   *   This value will be clamped to the bounds of the list.
   *
   * @param count - The number of sections to insert. This method
   *   is a no-op if this value is `<= 0`.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  insertSections(index: number, count: number): void {
    // Bail early if there are no sections to insert.
    if (count <= 0) {
      return;
    }

    // Clamp the index to the bounds of the list.
    index = Math.max(0, Math.min(index, this._sectionCount));

    // Add the new sections to the totals.
    let span = count * this._baseSize;
    this._sectionCount += count;
    this._totalSize += span;

    // Bail early if there are no modified sections to update.
    if (this._sections.length === 0) {
      return;
    }

    // Find the modified section for the given index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Update all modified sections after the insert location.
    for (let n = this._sections.length; i < n; ++i) {
      let section = this._sections[i];
      section.index += count;
      section.offset += span;
    }
  }

  /**
   * Remove sections from the list.
   *
   * @param index - The index of the first section to remove.
   *   This method is a no-op if this value is out of range.
   *
   * @param count - The number of sections to remove. This method
   *   is a no-op if this value is `<= 0`.
   *
   * #### Undefined Behavior
   * An `index` or `count` which is non-integral.
   *
   * #### Complexity
   * Linear on the number of resized sections.
   */
  removeSections(index: number, count: number): void {
    // Bail early if there is nothing to remove.
    if (index < 0 || index >= this._sectionCount || count <= 0) {
      return;
    }

    // Clamp the count to the bounds of the list.
    count = Math.min(this._sectionCount - index, count);

    // Handle the simple case of no modified sections to update.
    if (this._sections.length === 0) {
      this._sectionCount -= count;
      this._totalSize -= count * this._baseSize;
      return;
    }

    // Handle the simple case of removing all sections.
    if (count === this._sectionCount) {
      this._totalSize = 0;
      this._sectionCount = 0;
      this._sections.length = 0;
      return;
    }

    // Find the modified section for the start index.
    let i = ArrayExt.lowerBound(this._sections, index, Private.indexCmp);

    // Find the modified section for the end index.
    let j = ArrayExt.lowerBound(this._sections, index + count, Private.indexCmp);

    // Remove the relevant modified sections.
    let removed = this._sections.splice(i, j - i);

    // Compute the total removed span.
    let span = (count - removed.length) * this._baseSize;
    for (let k = 0, n = removed.length; k < n; ++k) {
      span += removed[k].size;
    }

    // Adjust the totals.
    this._sectionCount -= count;
    this._totalSize -= span;

    // Update all modified sections after the removed span.
    for (let k = i, n = this._sections.length; k < n; ++k) {
      let section = this._sections[k];
      section.index -= count;
      section.offset -= span;
    }
  }

  /**
   * Remove all sections from the list.
   *
   * #### Complexity
   * Constant.
   */
  clear(): void {
    this._totalSize = 0;
    this._sectionCount = 0;
    this._sections.length = 0;
  }

  private _totalSize = 0;
  private _baseSize: number;
  private _sectionCount = 0;
  private _sections: Private.ISection[] = [];
}


/**
 * The namespace for the `SectionList` class statics.
 */
export
namespace SectionList {
  /**
   * An options object for initializing a section list.
   */
  export
  interface IOptions {
    /**
     * The size of new sections added to the list.
     */
    baseSize: number;
  }
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * An object which represents a modified section.
   */
  export
  interface ISection {
    /**
     * The index of the section.
     *
     * This is always `>= 0`.
     */
    index: number;

    /**
     * The offset of the section.
     */
    offset: number;

    /**
     * The size of the section.
     *
     * This is always `>= 0`.
     */
    size: number;
  }

  /**
   * A comparison function for searching by offset.
   */
  export
  function offsetCmp(section: ISection, offset: number): number {
    if (offset < section.offset) {
      return 1;
    }
    if (section.offset + section.size <= offset) {
      return -1;
    }
    return 0;
  }

  /**
   * A comparison function for searching by index.
   */
  export
  function indexCmp(section: ISection, index: number): number {
    return section.index - index;
  }
}
