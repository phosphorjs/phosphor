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
   * Get the total number of sections in the list.
   *
   * #### Notes
   * This operation has `O(1)` complexity.
   */
  get count(): number {
    return this._root !== null ? this._root.count : 0;
  }

  /**
   * Get the total size of all sections in the list.
   *
   * #### Notes
   * This operation has `O(1)` complexity.
   */
  get size(): number {
    return this._root !== null ? this._root.size : 0;
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
    size = Math.max(0, size);
    if (this._root === null) {
      this._root = makeLeaf(count, size);
      return;
    }
    index = Math.floor(index);
    if (index < 0) {
      index = Math.max(0, index + this._root.count);
    } else {
      index = Math.min(index, this._root.count);
    }
    this._root = insert(this._root, index, count, size);
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
    // count = Math.floor(count);
    // if (count <= 0) {
    //   return;
    // }
    // index = Math.floor(index);
    // if (index < 0) {
    //   index = Math.max(0, index + this._root.count);
    // }
    // if (index >= this._root.count) {
    //   return;
    // }
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
    if (this._root === null) {
      return -1;
    }
    if (offset < 0 || offset >= this._root.size) {
      return -1;
    }
    return indexAt(this._root, offset);
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
    if (this._root === null) {
      return -1;
    }
    index = Math.floor(index);
    if (index < 0) {
      index += this._root.count;
    }
    if (index < 0 || index >= this._root.count) {
      return -1;
    }
    return offsetOf(this._root, index);
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
    if (this._root === null) {
      return -1;
    }
    index = Math.floor(index);
    if (index < 0) {
      index += this._root.count;
    }
    if (index < 0 || index >= this._root.count) {
      return -1;
    }
    return sizeOf(this._root, index);
  }

  private _root: ISpan = null;
}


/**
 * The node type used in the SectionList AVL tree.
 */
interface ISpan {
  /**
   * The total number of sections contained by the subtree.
   *
   * If the span is a leaf, this is the number of equal sized
   * sections covered by the span. This is always `> 0`.
   */
  count: number;

  /**
   * The total size of all sections contained by the subtree.
   *
   * If the span is a leaf, this is the total size of the equal sized
   * sections covered by the span and the individual section size can
   * be computed via `size / count`.
   */
  size: number;

  /**
   * The level of the span in the tree.
   *
   * A `0` level indicates the span is a leaf. This is always `>= 0`.
   */
  level: number;

  /**
   * The left subtree of the span.
   *
   * This will be null IFF the span is a leaf.
   */
  left: ISpan;

  /**
   * The right subtree of the span.
   *
   * This will be null IFF the span is a leaf.
   */
  right: ISpan;
}


/**
 *
 */
function makeLeaf(count: number, size: number): ISpan {
  return {
    count: count,
    size: count * size,
    level: 0,
    left: null,
    right: null,
  };
}


/**
 *
 */
function makeBranch(left: ISpan, right: ISpan): ISpan {
  return {
    count: left.count + right.count,
    size: left.size + right.size,
    level: Math.max(left.level, right.level) + 1,
    left: left,
    right: right,
  };
}


/**
 *
 */
function setBranch(span: ISpan, left: ISpan, right: ISpan): ISpan {
  span.count = left.count + right.count;
  span.size = left.size + right.size;
  span.level = Math.max(left.level, right.level) + 1;
  span.left = left;
  span.right = right;
  return span;
}


/**
 *
 */
function insert(span: ISpan, index: number, count: number, size: number): ISpan {
  if (span.level === 0) {
    if (size === span.size / span.count) {
      span.count += count;
      span.size += count * size;
      return span;
    }
    if (index === 0) {
      var left = makeLeaf(count, size);
      return makeBranch(left, span);
    }
    if (index >= span.count) {
      var right = makeLeaf(count, size);
      return makeBranch(span, right);
    }
    var rest = span.count - index;
    var each = span.size / span.count;
    var subLeft = makeLeaf(count, size);
    var subRight = makeLeaf(rest, each);
    var left = makeLeaf(index, each);
    var right = makeBranch(subLeft, subRight);
    return setBranch(span, left, right);
  }
  var left = span.left;
  if (index < left.count) {
    span.left = insert(left, index, count, size);
  } else {
    span.right = insert(span.right, index - left.count, count, size);
  }
  return rebalance(span);
}


/**
 *
 */
function rebalance(span: ISpan): ISpan {
  var left = span.left;
  var right = span.right;
  var d = left.level - right.level;
  if (d > 1) {
    var subLeft = left.left;
    var subRight = left.right;
    if (subLeft.level > subRight.level) {
      span.left = subLeft;
      span.right = setBranch(left, subRight, right);
    } else {
      span.left = setBranch(left, subLeft, subRight.left);
      span.right = setBranch(subRight, subRight.right, right);
    }
  } else if (d < -1) {
    var subLeft = right.left;
    var subRight = right.right;
    if (subLeft.level < subRight.level) {
      span.right = subRight;
      span.left = setBranch(right, left, subLeft);
    } else {
      span.right = setBranch(right, subLeft.right, subRight);
      span.left = setBranch(subLeft, left, subLeft.left);
    }
  }
  return setBranch(span, span.left, span.right);
}


/**
 * Find the index of the section which covers the given offset.
 *
 * The offset must be within range of the given span.
 */
function indexAt(span: ISpan, offset: number): number {
  var index = 0;
  while (span.level !== 0) {
    var left = span.left;
    if (offset < left.size) {
      span = left;
    } else {
      span = span.right;
      index += left.count;
      offset -= left.size;
    }
  }
  return index + Math.floor(offset * span.count / span.size);
}


/**
 * Find the offset of the section at the given index.
 *
 * The index must be an integer and with range of the given span.
 */
function offsetOf(span: ISpan, index: number): number {
  var offset = 0;
  while (span.level !== 0) {
    var left = span.left;
    if (index < left.count) {
      span = left;
    } else {
      span = span.right;
      index -= left.count;
      offset += left.size;
    }
  }
  return offset + index * span.size / span.count;
}


/**
 * Find the size of the section at the given index.
 *
 * The index must be an integer and with range of the given span.
 */
function sizeOf(span: ISpan, index: number): number {
  while (span.level !== 0) {
    var left = span.left;
    if (index < left.count) {
      span = left;
    } else {
      span = span.right;
      index -= left.count;
    }
  }
  return span.size / span.count;
}

} // module phosphor.utility
