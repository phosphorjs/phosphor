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
   * @param baseSize - The size of new sections added to the list.
   *   This value will be clamped to an integer `>= 0`.
   */
  constructor(baseSize: number) {
    this._baseSize = Math.max(0, Math.floor(baseSize));
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

    // Handle the simple case of no mods.
    if (this._mods.length === 0) {
      return Math.floor(offset / this._baseSize);
    }

    // Find the mod for the given offset.
    let i = ArrayExt.lowerBound(this._mods, offset, Private.offsetCmp);

    // Return the modified index for an exact match.
    if (i < this._mods.length && this._mods[i].offset <= offset) {
      return this._mods[i].index;
    }

    // Handle the case of no modifiers before the offset.
    if (i === 0) {
      return Math.floor(offset / this._baseSize);
    }

    // Compute the index from the previous modifier.
    let mod = this._mods[i - 1];
    let span = offset - (mod.offset + mod.size);
    return mod.index + Math.floor(span / this._baseSize) + 1;
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

    // Handle the simple case of no mods.
    if (this._mods.length === 0) {
      return index * this._baseSize;
    }

    // Find the mod for the given index.
    let i = ArrayExt.lowerBound(this._mods, index, Private.indexCmp);

    // Return the modified offset for an exact match.
    if (i < this._mods.length && this._mods[i].index === index) {
      return this._mods[i].offset;
    }

    // Handle the case of no modifiers before the index.
    if (i === 0) {
      return index * this._baseSize;
    }

    // Compute the offset from the previous modifier.
    let mod = this._mods[i - 1];
    let span = index - mod.index - 1;
    return mod.offset + mod.size + span * this._baseSize;
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

    // Handle the simple case of no mods.
    if (this._mods.length === 0) {
      return this._baseSize;
    }

    // Find the mod for the given index.
    let i = ArrayExt.lowerBound(this._mods, index, Private.indexCmp);

    // Return the modified size for an exact match.
    if (i < this._mods.length && this._mods[i].index === index) {
      return this._mods[i].size;
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

    // Find the mod for the given index.
    let i = ArrayExt.lowerBound(this._mods, index, Private.indexCmp);

    // Update or create the mod as needed.
    let delta: number;
    if (i < this._mods.length && this._mods[i].index === index) {
      let mod = this._mods[i];
      delta = size - mod.size;
      mod.size = size;
    } else if (i === 0) {
      let offset = index * this._baseSize;
      ArrayExt.insert(this._mods, i, { index, offset, size });
      delta = size;
    } else {
      let mod = this._mods[i - 1];
      let span = index - mod.index - 1;
      let offset = mod.offset + mod.size + span * this._baseSize;
      ArrayExt.insert(this._mods, i, { index, offset, size });
      delta = size;
    }

    // Update all mods after the resize.
    for (let j = i + 1, n = this._mods.length; j < n; ++j) {
      this._mods[j].offset += delta;
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

    // Bail early if there are no mods to update.
    if (this._mods.length === 0) {
      return;
    }

    // Find the mod for the given index.
    let i = ArrayExt.lowerBound(this._mods, index, Private.indexCmp);

    // Update all mods after the insert location.
    for (let n = this._mods.length; i < n; ++i) {
      let mod = this._mods[i];
      mod.index += count;
      mod.offset += span;
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

    // Clamp the count to the list bounds.
    count = Math.min(this._sectionCount - index, count);

    // Handle the simple case of no mods to update.
    if (this._mods.length === 0) {
      this._sectionCount -= count;
      this._totalSize -= count * this._baseSize;
      return;
    }

    // Handle the simple case of removing all sections.
    if (count === this._sectionCount) {
      this._sectionCount = 0;
      this._totalSize = 0;
      this._mods.length = 0;
      return;
    }

    // Find the mod for the start index.
    let i = ArrayExt.lowerBound(this._mods, index, Private.indexCmp);

    // Find the mod for the end index.
    let j = ArrayExt.lowerBound(this._mods, index + count, Private.indexCmp);

    // Remove the old mods.
    let old = this._mods.splice(i, j - i);

    // Compute the total removed span.
    let span = (count - old.length) * this._baseSize;
    for (let k = 0, n = old.length; k < n; ++k) {
      span += old[k].size;
    }

    // Adjust the totals.
    this._sectionCount -= count;
    this._totalSize -= span;

    // Update all mods after the removed span.
    for (let k = i, n = this._mods.length; k < n; ++k) {
      let mod = this._mods[k];
      mod.index -= count;
      mod.offset -= span;
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
    this._mods.length = 0;
  }

  private _totalSize = 0;
  private _sectionCount = 0;
  private _baseSize: number;
  private _mods: Private.ISectionMod[] = [];
}


/**
 * The namespace for the module implementation details.
 */
namespace Private {
  /**
   * A span object used by the SectionList.
   */
  export
  interface ISectionMod {
    /**
     * The index of the modified section.
     *
     * This is always `>= 0`.
     */
    index: number;

    /**
     * The offset of the modified section.
     */
    offset: number;

    /**
     * The size of the modified section.
     *
     * This is always `>= 0`.
     */
    size: number;
  }

  /**
   * A comparison function for searching by offset.
   */
  export
  function offsetCmp(mod: ISectionMod, offset: number): number {
    if (mod.offset > offset) {
      return 1;
    }
    if (mod.offset + mod.size <= offset) {
      return -1;
    }
    return 0;
  }

  /**
   * A comparison function for searching by index.
   */
  export
  function indexCmp(mod: ISectionMod, index: number): number {
    return mod.index - index;
  }
}
