/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.layout {

/**
 * Distribute space among the given sizing items.
 *
 * The distributes the given layout spacing among the sizing items
 * according the following algorithm:
 *
 *   1) Initialize the item's size to its size hint and compute
 *      the sums for each of size hint, min size, and max size.
 *
 *   2) If the total size hint equals the layout space, return.
 *
 *   3) If the layout space is less than the total min size,
 *      set all items to their min size and return.
 *
 *   4) If the layout space is greater than the total max size,
 *      set all items to their max size and return.
 *
 *   5) If the layout space is less than the total size hint,
 *      distribute the negative delta as follows:
 *
 *     a) Shrink each item with a stretch factor greater than
 *        zero by an amount proportional to the sum of stretch
 *        factors and negative space. If the item reaches its
 *        minimum size, remove it and its stretch factor from
 *        the computation.
 *
 *     b) If after adjusting all stretch items there remains
 *        negative space, distribute it equally among items
 *        with a stretch factor of zero. If an item reaches
 *        its minimum size, remove it from the computation.
 *
 *   6) If the layout space is greater than the total size hint,
 *      distribute the positive delta as follows:
 *
 *     a) Expand each item with a stretch factor greater than
 *        zero by an amount proportional to the sum of stretch
 *        factors and positive space. If the item reaches its
 *        maximum size, remove it and its stretch factor from
 *        the computation.
 *
 *     b) If after adjusting all stretch items there remains
 *        positive space, distribute it equally among items
 *        with the `expansive` flag set. If an item reaches
 *        its maximum size, remove it from the computation.
 *
 *     c) If after adjusting all stretch and expansive items
 *        there remains positive space, distribute it equally
 *        among items with a stretch factor of zero. If an item
 *        reaches its maximum size, remove it from the computation.
 */
export
function layoutCalc(items: SizingItem[], space: number): void {
  var count = items.length;
  if (count === 0) {
    return;
  }

  // Setup the counters.
  var totalMin = 0;
  var totalMax = 0;
  var totalSize = 0;
  var totalStretch = 0;
  var stretchCount = 0;
  var expansiveCount = 0;

  // Setup the items and calculate the totals.
  for (var i = 0; i < count; ++i) {
    var item = items[i];
    var size = Math.max(item.minSize, Math.min(item.sizeHint, item.maxSize));
    item.done = false;
    item.size = size;
    totalSize += size;
    totalMin += item.minSize;
    totalMax += item.maxSize;
    if (item.stretch > 0) {
      totalStretch += item.stretch;
      stretchCount++;
    }
    if (item.expansive) {
      expansiveCount++;
    }
  }

  // 1) If the space is equal to the total size, return.
  if (space === totalSize) {
    return;
  }

  // 2) If the space is less than the total min, minimize each item.
  if (space <= totalMin) {
    for (var i = 0; i < count; ++i) {
      var item = items[i];
      item.size = item.minSize;
    }
    return;
  }

  // 3) If the space is greater than the total max, maximize each item.
  if (space >= totalMax) {
    for (var i = 0; i < count; ++i) {
      var item = items[i];
      item.size = item.maxSize;
    }
    return;
  }

  // The loops below perform sub-pixel precision sizing. A near zero
  // value is used for compares instead of zero to ensure that the
  // loop terminates when the subdivided space is reasonably small.
  var nearZero = 0.01;

  // A counter which decreaes monotonically each time an item is
  // resized to its limit. This ensure the loops terminate even
  // if there is space remaining to distribute.
  var notDoneCount = count;

  // 5) Distribute negative delta space.
  if (space < totalSize) {
    // 5a) Shrink each stretch item by an amount proportional to its
    // stretch factor. If it reaches its limit it's marked as done.
    // The loop progresses in phases where each item gets a chance to
    // consume its fair share for the phase, regardless of whether an
    // item before it reached its limit. This continues until the
    // stretch items or the free space is exhausted.
    var freeSpace = totalSize - space;
    while (stretchCount > 0 && freeSpace > nearZero) {
      var distSpace = freeSpace;
      var distStretch = totalStretch;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.done || item.stretch === 0) {
          continue;
        }
        var amt = item.stretch * distSpace / distStretch;
        if (item.size - amt <= item.minSize) {
          freeSpace -= item.size - item.minSize;
          totalStretch -= item.stretch;
          item.size = item.minSize;
          item.done = true;
          notDoneCount--;
          stretchCount--;
        } else {
          freeSpace -= amt;
          item.size -= amt;
        }
      }
    }
    // 5b) Distribute any remaining space evenly among the items
    // with zero stretch factors. This progesses in phases in the
    // same manner as step (5a).
    while (notDoneCount > 0 && freeSpace > nearZero) {
      var amt = freeSpace / notDoneCount;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.done) {
          continue;
        }
        if (item.size - amt <= item.minSize) {
          freeSpace -= item.size - item.minSize;
          item.size = item.minSize;
          item.done = true;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          item.size -= amt;
        }
      }
    }
  }
  // 6) Otherwise, distribute the positive delta space.
  else {
    // 6a) Expand each stretch item by an amount proportional to its
    // stretch factor. If it reaches its limit it's marked as done.
    // The loop progresses in phases where each item gets a chance to
    // consume its fair share for the phase, regardless of whether an
    // item before it reached its limit. This continues until the
    // stretch items or the free space is exhausted.
    var freeSpace = space - totalSize;
    while (stretchCount > 0 && freeSpace > nearZero) {
      var distSpace = freeSpace;
      var distStretch = totalStretch;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.done || item.stretch === 0) {
          continue;
        }
        var amt = item.stretch * distSpace / distStretch;
        if (item.size + amt >= item.maxSize) {
          freeSpace -= item.maxSize - item.size;
          totalStretch -= item.stretch;
          item.size = item.maxSize;
          item.done = true;
          notDoneCount--;
          stretchCount--;
          if (item.expansive) {
            expansiveCount--;
          }
        } else {
          freeSpace -= amt;
          item.size += amt;
        }
      }
    }
    // 6b) Distribute remaining space equally among expansive items.
    // This progresses in phases in the same manner as step (6a).
    while (expansiveCount > 0 && freeSpace > nearZero) {
      var amt = freeSpace / expansiveCount;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.done || !item.expansive) {
          continue;
        }
        if (item.size + amt >= item.maxSize) {
          freeSpace -= item.maxSize - item.size;
          item.size = item.maxSize;
          item.done = true;
          expansiveCount--;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          item.size += amt;
        }
      }
    }
    // 6c) Distribute any remaining space evenly among the items
    // with zero stretch factors. This progesses in phases in the
    // same manner as step (6a).
    while (notDoneCount > 0 && freeSpace > nearZero) {
      var amt = freeSpace / notDoneCount;
      for (var i = 0; i < count; ++i) {
        var item = items[i];
        if (item.done) {
          continue;
        }
        if (item.size + amt >= item.maxSize) {
          freeSpace -= item.maxSize - item.size;
          item.size = item.maxSize;
          item.done = true;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          item.size += amt;
        }
      }
    }
  }
}

} // module phosphor.layout
