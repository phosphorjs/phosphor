/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.collections {

/**
 * An object which manages a collection of variable sized sections.
 *
 * A section list is commonly used to manage row heights in virtually
 * scrolling list controls. In such a control, most rows are uniform
 * height while a handful of rows are variable sized.
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
   * Find the index of the section which covers the given offset.
   *
   * @param offset - The positive offset position of interest.
   *
   * @returns The index of the section which covers the given offset,
   *   or `-1` if the offset is out of range.
   *
   * #### Notes
   * This operation has `O(log(n))` complexity.
   */
  indexOf(offset: number): number {
    if (this._root === null || offset < 0 || offset >= this._root.size) {
      return -1;
    }
    return indexOf(this._root, offset);
  }

  /**
   * Find the offset position of the section at the given index.
   *
   * @param index - The index of the section of interest. If this value
   *   is negative, it is taken as an offset from the end of the list.
   *
   * @returns The offset position of the section at the given index, or
   *   `-1` if the index is out of range.
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

  /**
   * Insert new sections into the list.
   *
   * @param index - The index at which to insert the first section. If
   *   this value is negative, it is taken as an offset from the end of
   *   the list. The value is clamped to the range `[0, list.count]`.
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
      this._root = createLeaf(count, count * size);
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
   *   list. The value is clamped to the range `[0, Infinity]`. If
   *   the value is `>= list.count` this method is a no-op.
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
    this._root = remove(this._root, index, count);
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
 * Create a new leaf span with the given count and total size.
 */
function createLeaf(count: number, size: number): ISpan {
  return { count: count, size: size, level: 0, left: null, right: null };
}


/**
 * Create a new branch span from the given left and right children.
 */
function createBranch(left: ISpan, right: ISpan): ISpan {
  var count = left.count + right.count;
  var size = left.size + right.size;
  var level = Math.max(left.level, right.level) + 1;
  return { count: count, size: size, level: level, left: left, right: right };
}


/**
 * Update a span to be branch with the given left and right children.
 *
 * This returns the updated span as a convenience.
 */
function updateBranch(span: ISpan, left: ISpan, right: ISpan): ISpan {
  span.count = left.count + right.count;
  span.size = left.size + right.size;
  span.level = Math.max(left.level, right.level) + 1;
  span.left = left;
  span.right = right;
  return span;
}


/**
 * Find the index of the section which covers the given offset.
 *
 * The offset must be within range of the given span.
 */
function indexOf(span: ISpan, offset: number): number {
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
 * The index must be an integer and within range of the given span.
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
 * The index must be an integer and within range of the given span.
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


/**
 * Insert new sections into the given subtree.
 *
 * The index must be an integer within range of the span, and the
 * count must be an integer greater than zero.
 *
 * The return value is the span which should take the place of the
 * original span in the tree. Due to tree rebalancing, this may or
 * may not be the same as the original span.
 */
function insert(span: ISpan, index: number, count: number, size: number): ISpan {
  // If the span is a leaf, the insert target has been found. There are
  // four possibilities for the insert: extend, before, after, and split.
  if (span.level === 0) {
    // If the size of each new section is the same as the current size,
    // the existing span can be extended by simply adding the sections.
    if (size === span.size / span.count) {
      span.count += count;
      span.size += count * size;
      return span;
    }
    // If the index is zero, the new span goes before the current span,
    // which requires a new branch node to be added to the tree.
    if (index === 0) {
      return createBranch(createLeaf(count, count * size), span);
    }
    // If the index is greater than the span count, the new span goes
    // after the current span, which also requires a new branch node.
    if (index >= span.count) {
      return createBranch(span, createLeaf(count, count * size));
    }
    // Otherwise, the current span must be split and the new span
    // added to the middle. This requires several new nodes.
    var rest = span.count - index;
    var each = span.size / span.count;
    var subLeft = createLeaf(count, count * size);
    var subRight = createLeaf(rest, rest * each);
    var newLeft = createLeaf(index, index * each);
    var newRight = createBranch(subLeft, subRight);
    return updateBranch(span, newLeft, newRight);
  }
  // Otherwise, recurse down the appropriate branch.
  if (index < span.left.count) {
    span.left = insert(span.left, index, count, size);
  } else {
    span.right = insert(span.right, index - span.left.count, count, size);
  }
  // Always rebalance the branch after an insert.
  return rebalance(span);
}


/**
 * Remove a number of sections from the given subtree.
 *
 * The index must be an integer within range of the span, and the
 * count must be an integer greater than zero. If the count is more
 * than the availble number of sections, the extra count is ignored.
 *
 * The return value is the span which should take the place of the
 * original span in the tree. Due to tree rebalancing, this may or
 * may not be the same as the original span. It may also be null.
 */
function remove(span: ISpan, index: number, count: number): ISpan {
  // If the range covers the entire span, there is no need to do
  // any extra checking, since the whole subtree can be removed.
  if (index === 0 && count >= span.count) {
    return null;
  }
  // If the span is a leaf, then sections are removed starting at
  // the index. Any extra count is ignored and the span's size is
  // updated to reflect its new count. The clause above ensures
  // that the count is always greater than zero.
  if (span.level === 0) {
    var rest = span.count - Math.min(span.count - index, count);
    span.size = (span.size / span.count) * rest;
    span.count = rest;
    return span;
  }
  // Otherwise, remove the sections from the children of the branch
  // recursively. The range will either cross both of the children
  // or be contained completely by one of them.
  if (index < span.left.count && index + count > span.left.count) {
    var extra = index + count - span.left.count;
    span.left = remove(span.left, index, count);
    span.right = remove(span.right, 0, extra);
  } else if (index < span.left.count) {
    span.left = remove(span.left, index, count);
  } else {
    span.right = remove(span.right, index - span.left.count, count);
  }
  // After the remove, either child may be null, but not both. The
  // first clause of this function handles the case where the range
  // covers the entire span. If one child was deleted, the remaining
  // child is hoisted to become the current span.
  if (span.left === null) {
    span = span.right;
  } else if (span.right === null) {
    span = span.left;
  }
  // If the span is still a branch, it must be rebalanced. If the
  // removed range was large, it's possible that the span's balance
  // factor exceeds the [-2, 2] threshold, in which case it must be
  // rebalanced multiple times.
  if (span.level > 0) {
    do {
      span = rebalance(span);
    } while (Math.abs(span.left.level - span.right.level) > 1);
  }
  return span;
}


/**
 * Rebalance a span so that it maintains the AVL balance invariant.
 *
 * The given span must be a branch. If the span is already balanced,
 * no rotations will be made. The branch data is always updated to
 * be current based on the current children.
 *
 * This assumes the balance factor for the span will be within the
 * range of [-2, 2]. If the balance factor is outside this range,
 * the branch will need to be rebalanced multiple times in order
 * to maintain the AVL balance invariant.
 *
 * The return value is the span which should take the place of the
 * original span in the tree, and may or may not be a different span.
 *
 * Four unbalanced conditions are possible:
 *
 * Left-Left
 * -------------------------------------
 *        span                span
 *        /  \                /  \
 *       /    \              /    \
 *      1      D            2      1
 *     / \          =>     / \    / \
 *    /   \               A   B  C   D
 *   2     C
 *  / \
 * A   B
 *
 * Left-Right
 * -------------------------------------
 *     span                span
 *     /  \                /  \
 *    /    \              /    \
 *   1      D            1      2
 *  / \          =>     / \    / \
 * A   \               A   B  C   D
 *      2
 *     / \
 *    B   C
 *
 * Right-Right
 * -------------------------------------
 *   span                     span
 *   /  \                     /  \
 *  /    \                   /    \
 * A      1                 1      2
 *       / \        =>     / \    / \
 *      /   \             A   B  C   D
 *     B     2
 *          / \
 *         C   D
 *
 * Right-Left
 * -------------------------------------
 *   span                   span
 *   /  \                   /  \
 *  /    \                 /    \
 * A      1               2      1
 *       / \      =>     / \    / \
 *      /   \           A   B  C   D
 *     2     D
 *    / \
 *   B   C
 */
function rebalance(span: ISpan): ISpan {
  var left = span.left;
  var right = span.right;
  var balance = left.level - right.level;
  if (balance > 1) {
    var subLeft = left.left;
    var subRight = left.right;
    if (subLeft.level > subRight.level) {
      // Left-Left
      span.left = subLeft;
      span.right = updateBranch(left, subRight, right);
    } else {
      // Left-Right
      span.left = updateBranch(left, subLeft, subRight.left);
      span.right = updateBranch(subRight, subRight.right, right);
    }
  } else if (balance < -1) {
    var subLeft = right.left;
    var subRight = right.right;
    if (subRight.level > subLeft.level) {
      // Right-Right
      span.right = subRight;
      span.left = updateBranch(right, left, subLeft);
    } else {
      // Right-Left
      span.right = updateBranch(right, subLeft.right, subRight);
      span.left = updateBranch(subLeft, left, subLeft.left);
    }
  }
  return updateBranch(span, span.left, span.right);
}

} // module phosphor.collections
