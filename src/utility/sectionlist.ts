/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.utility {

/**
 * An object which manages a collection of variable sized sections.
 *
 * A section list is commonly used to manage row heights in virtually
 * scrolling list controls. In such a control, most rows are uniform
 * height while a handful are variable sized.
 *
 * A section list has guaranteed `O(log(n))` worst-case performance for
 * most operations, where `n` is the number of variable sized sections.
 */
export
class SectionList {
  /**
   * Get the total size of all sections in the list.
   *
   * #### Notes
   * This operation has `O(1)` complexity.
   */
  get size(): number {
    return this._root.size;
  }

  /**
   * Get the total number of sections in the list.
   *
   * #### Notes
   * This operation has `O(1)` complexity.
   */
  get count(): number {
    return this._root.count;
  }

  /**
   * Insert new sections into the list.
   *
   * @param index - The index at which to insert the first section. If
   *   this value is negative, it is taken as an offset from the end of
   *   the list. If the resulting value is still negative, it is clamped
   *   to `0`. The value is also clamped to a maximum of `list.count`.
   *
   * @param count - The number of sections to insert. If this value is
   *   `<= 0`, this method is a no-op.
   *
   * @param size - The size of each section. This value is clamped to
   *   the range `[0, Infinity]`.
   *
   * #### Notes
   * This operation has `O(log(n))` complexity.
   */
  insert(index: number, count: number, size: number): void {
    count = Math.floor(count);
    if (count <= 0) {
      return;
    }
    index = Math.floor(index);
    if (index < 0) {
      index = Math.max(0, index + this._root.count);
    } else {
      index = Math.min(index, this._root.count);
    }
    size = Math.max(0, size);
    // TODO do the insert
  }

  /**
   * Remove existing sections from the list.
   *
   * @param index - The index of the first section to remove. If this
   *   value is negative, it is taken as an offset from the end of the
   *   list. If the resulting value is still negative, it is clamped to
   *   `0`. If this value is `>= list.count`, this method is a no-op.
   *
   * @param count - The number of sections to remove. If this value is
   *   `<= 0`, this method is a no-op. If this value is more than the
   *   the availble number of sections, the extra count is ignored.
   *
   * #### Notes
   * This operation has `O(log(n))` complexity.
   */
  remove(index: number, count: number): void {
    count = Math.floor(count);
    if (count <= 0) {
      return;
    }
    index = Math.floor(index);
    if (index < 0) {
      index = Math.max(0, index + this._root.count);
    }
    if (index >= this._root.count) {
      return;
    }
    // TODO do the remove
  }

  /**
   * Find the index of the section which covers the given offset.
   *
   * @param offset - The positive offset of interest.
   *
   * @returns The index of the section which covers the given offset,
   *   or `-1` if the offset is out of range.
   *
   * #### Notes
   * This operation has `O(log(n))` complexity.
   */
  indexAt(offset: number): number {
    var span = this._root;
    if (offset < 0 || offset >= span.size) {
      return -1;
    }
    var index = 0;
    outer: while (span.children !== null) {
      var children = span.children;
      for (var i = 0, n = children.length; i < n; ++i) {
        span = children[i];
        if (offset < span.size) {
          continue outer;
        }
        index += span.count;
        offset -= span.size;
      }
      return -1; // should never be reached
    }
    return index + Math.floor(offset * span.count / span.size);
  }

  /**
   * Find the offset of the section at the given index.
   *
   * @param index - The index of the section of interest. If this value
   *   is negative, it is taken as an offset from the end of the list.
   *
   * @returns The offset of the section at the given index, or `-1` if
   *   the index is out of range.
   *
   * #### Notes
   * This operation has `O(log(n))` complexity.
   */
  offsetOf(index: number): number {
    index = Math.floor(index);
    var span = this._root;
    if (index < 0) {
      index += span.count;
    }
    if (index < 0 || index >= span.count) {
      return -1;
    }
    var offset = 0;
    outer: while (span.children !== null) {
      var children = span.children;
      for (var i = 0, n = children.length; i < n; ++i) {
        span = children[i];
        if (index < span.count) {
          continue outer;
        }
        index -= span.count;
        offset += span.size;
      }
      return -1; // should never be reached
    }
    return offset + index * span.size / span.count;
  }

  /**
   * Find the size of the section at the given index.
   *
   * @param index - The index of the section of interest. If this value
   *   is negative, it is taken as an offset from the end of the list.
   *
   * @returns The size of the section at the given index, or `-1` if
   *   the index is out of range.
   *
   * #### Notes
   * This operation has `O(log(n))` complexity.
   */
  sizeOf(index: number): number {
    index = Math.floor(index);
    var span = this._root;
    if (index < 0) {
      index += span.count;
    }
    if (index < 0 || index >= span.count) {
      return -1;
    }
    outer: while (span.children !== null) {
      var children = span.children;
      for (var i = 0, n = children.length; i < n; ++i) {
        span = children[i];
        if (index < span.count) {
          continue outer;
        }
        index -= span.count;
      }
      return -1; // should never be reached
    }
    return span.size / span.count;
  }

  private _root = new Span();
}


/**
 * The node type used in the SectionList b-tree.
 */
class Span {
  /**
   * The total size of all sections contained by the subtree.
   *
   * If the span is a leaf, this is the total size of the equal sized
   * sections covered by the span and the individual section size can
   * be computed via `size / count`.
   */
  size = 0;

  /**
   * The total number of sections contained by the subtree.
   *
   * If the span is a leaf, this is the number of equal sized
   * sections covered by the span.
   *
   * This must only be `0` for the root span of an empty list.
   */
  count = 0;

  /**
   * The child spans of this span.
   *
   * If this is `null`, the span is a leaf. Except for the root span,
   * this array must be null or be filled from 50 - 100% capacity.
   */
  children: Span[] = null;
}

} // module phosphor.utility
