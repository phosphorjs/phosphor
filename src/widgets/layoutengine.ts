/*-----------------------------------------------------------------------------
| Copyright (c) 2014-2015, S. Chris Colbert
|
| Distributed under the terms of the BSD 3-Clause License.
|
| The full license is in the file LICENSE, distributed with this software.
|----------------------------------------------------------------------------*/
module phosphor.widgets {

/**
 * A sizer object for the `layoutCalc` function.
 *
 * Instances of this class are used internally by the panel layouts
 * to implement their layout logic. User code will not typically use
 * this class directly.
 */
export
class LayoutSizer {
  /**
   * The size hint for the sizer.
   *
   * The sizer will be given this initial size subject to its bounds.
   */
  sizeHint = 0;

  /**
   * The minimum size of the sizer.
   *
   * The sizer will never be sized less than this value.
   *
   * Limits: [0, Infinity) && <= maxSize
   */
  minSize = 0;

  /**
   * The maximum size of the sizer.
   *
   * The sizer will never be sized greater than this value.
   *
   * Limits: [0, Infinity] && >= minSize
   */
  maxSize = Infinity;

  /**
   * The stretch factor for the sizer.
   *
   * This controls how much the sizer stretches relative to the other
   * sizers when layout space is distributed. A sizer with a stretch
   * factor of zero will only be resized after all stretch sizers
   * and expansive sizers have been sized to their limits.
   *
   * Limits: [0, Infinity)
   */
  stretch = 1;

  /**
   * Whether the sizer should consume extra space if available.
   *
   * Expansive sizers will absorb any remaining space after all
   * stretch sizers have been resized to their limits.
   */
  expansive = false;

  /**
   * The computed size of the sizer.
   *
   * This value is the output of the algorithm.
   */
  size = 0;

  /**
   * An internal storage property for the layout algorithm.
   */
  done = false;
}


/**
 * Distribute space among the given sizers.
 *
 * This distributes the given layout spacing among the sizers
 * according to the following algorithm:
 *
 *   1) Initialize the sizers's size to its size hint and compute
 *      the sums for each of size hint, min size, and max size.
 *
 *   2) If the total size hint equals the layout space, return.
 *
 *   3) If the layout space is less than the total min size,
 *      set all sizers to their min size and return.
 *
 *   4) If the layout space is greater than the total max size,
 *      set all sizers to their max size and return.
 *
 *   5) If the layout space is less than the total size hint,
 *      distribute the negative delta as follows:
 *
 *     a) Shrink each sizer with a stretch factor greater than
 *        zero by an amount proportional to the sum of stretch
 *        factors and negative space. If the sizer reaches its
 *        minimum size, remove it and its stretch factor from
 *        the computation.
 *
 *     b) If after adjusting all stretch sizers there remains
 *        negative space, distribute it equally among sizers
 *        with a stretch factor of zero. If a sizer reaches
 *        its minimum size, remove it from the computation.
 *
 *   6) If the layout space is greater than the total size hint,
 *      distribute the positive delta as follows:
 *
 *     a) Expand each sizer with a stretch factor greater than
 *        zero by an amount proportional to the sum of stretch
 *        factors and positive space. If the sizer reaches its
 *        maximum size, remove it and its stretch factor from
 *        the computation.
 *
 *     b) If after adjusting all stretch sizers there remains
 *        positive space, distribute it equally among sizers
 *        with the `expansive` flag set. If a sizer reaches
 *        its maximum size, remove it from the computation.
 *
 *     c) If after adjusting all stretch and expansive sizers
 *        there remains positive space, distribute it equally
 *        among sizers with a stretch factor of zero. If a sizer
 *        reaches its maximum size, remove it from the computation.
 */
export
function layoutCalc(sizers: LayoutSizer[], space: number): void {
  var count = sizers.length;
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

  // Setup the sizers and calculate the totals.
  for (var i = 0; i < count; ++i) {
    var sizer = sizers[i];
    var minSize = sizer.minSize;
    var maxSize = sizer.maxSize;
    var size = Math.max(minSize, Math.min(sizer.sizeHint, maxSize));
    sizer.done = false;
    sizer.size = size;
    totalSize += size;
    totalMin += minSize;
    totalMax += maxSize;
    if (sizer.stretch > 0) {
      totalStretch += sizer.stretch;
      stretchCount++;
    }
    if (sizer.expansive) {
      expansiveCount++;
    }
  }

  // 1) If the space is equal to the total size, return.
  if (space === totalSize) {
    return;
  }

  // 2) If the space is less than the total min, minimize each sizer.
  if (space <= totalMin) {
    for (var i = 0; i < count; ++i) {
      var sizer = sizers[i];
      sizer.size = sizer.minSize;
    }
    return;
  }

  // 3) If the space is greater than the total max, maximize each sizer.
  if (space >= totalMax) {
    for (var i = 0; i < count; ++i) {
      var sizer = sizers[i];
      sizer.size = sizer.maxSize;
    }
    return;
  }

  // The loops below perform sub-pixel precision sizing. A near zero
  // value is used for compares instead of zero to ensure that the
  // loop terminates when the subdivided space is reasonably small.
  var nearZero = 0.01;

  // A counter which decreaes monotonically each time a sizer is
  // resized to its limit. This ensure the loops terminate even
  // if there is space remaining to distribute.
  var notDoneCount = count;

  // 5) Distribute negative delta space.
  if (space < totalSize) {
    // 5a) Shrink each stretch sizer by an amount proportional to its
    // stretch factor. If it reaches its limit it's marked as done.
    // The loop progresses in phases where each sizer gets a chance to
    // consume its fair share for the phase, regardless of whether a
    // sizer before it reached its limit. This continues until the
    // stretch sizers or the free space is exhausted.
    var freeSpace = totalSize - space;
    while (stretchCount > 0 && freeSpace > nearZero) {
      var distSpace = freeSpace;
      var distStretch = totalStretch;
      for (var i = 0; i < count; ++i) {
        var sizer = sizers[i];
        if (sizer.done || sizer.stretch === 0) {
          continue;
        }
        var amt = sizer.stretch * distSpace / distStretch;
        if (sizer.size - amt <= sizer.minSize) {
          freeSpace -= sizer.size - sizer.minSize;
          totalStretch -= sizer.stretch;
          sizer.size = sizer.minSize;
          sizer.done = true;
          notDoneCount--;
          stretchCount--;
        } else {
          freeSpace -= amt;
          sizer.size -= amt;
        }
      }
    }
    // 5b) Distribute any remaining space evenly among the sizers
    // with zero stretch factors. This progresses in phases in the
    // same manner as step (5a).
    while (notDoneCount > 0 && freeSpace > nearZero) {
      var amt = freeSpace / notDoneCount;
      for (var i = 0; i < count; ++i) {
        var sizer = sizers[i];
        if (sizer.done) {
          continue;
        }
        if (sizer.size - amt <= sizer.minSize) {
          freeSpace -= sizer.size - sizer.minSize;
          sizer.size = sizer.minSize;
          sizer.done = true;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          sizer.size -= amt;
        }
      }
    }
  }
  // 6) Otherwise, distribute the positive delta space.
  else {
    // 6a) Expand each stretch sizer by an amount proportional to its
    // stretch factor. If it reaches its limit it's marked as done.
    // The loop progresses in phases where each sizer gets a chance to
    // consume its fair share for the phase, regardless of whether an
    // sizer before it reached its limit. This continues until the
    // stretch sizers or the free space is exhausted.
    var freeSpace = space - totalSize;
    while (stretchCount > 0 && freeSpace > nearZero) {
      var distSpace = freeSpace;
      var distStretch = totalStretch;
      for (var i = 0; i < count; ++i) {
        var sizer = sizers[i];
        if (sizer.done || sizer.stretch === 0) {
          continue;
        }
        var amt = sizer.stretch * distSpace / distStretch;
        if (sizer.size + amt >= sizer.maxSize) {
          freeSpace -= sizer.maxSize - sizer.size;
          totalStretch -= sizer.stretch;
          sizer.size = sizer.maxSize;
          sizer.done = true;
          notDoneCount--;
          stretchCount--;
          if (sizer.expansive) {
            expansiveCount--;
          }
        } else {
          freeSpace -= amt;
          sizer.size += amt;
        }
      }
    }
    // 6b) Distribute remaining space equally among expansive sizers.
    // This progresses in phases in the same manner as step (6a).
    while (expansiveCount > 0 && freeSpace > nearZero) {
      var amt = freeSpace / expansiveCount;
      for (var i = 0; i < count; ++i) {
        var sizer = sizers[i];
        if (sizer.done || !sizer.expansive) {
          continue;
        }
        if (sizer.size + amt >= sizer.maxSize) {
          freeSpace -= sizer.maxSize - sizer.size;
          sizer.size = sizer.maxSize;
          sizer.done = true;
          expansiveCount--;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          sizer.size += amt;
        }
      }
    }
    // 6c) Distribute any remaining space evenly among the sizers
    // with zero stretch factors. This progresses in phases in the
    // same manner as step (6a).
    while (notDoneCount > 0 && freeSpace > nearZero) {
      var amt = freeSpace / notDoneCount;
      for (var i = 0; i < count; ++i) {
        var sizer = sizers[i];
        if (sizer.done) {
          continue;
        }
        if (sizer.size + amt >= sizer.maxSize) {
          freeSpace -= sizer.maxSize - sizer.size;
          sizer.size = sizer.maxSize;
          sizer.done = true;
          notDoneCount--;
        } else {
          freeSpace -= amt;
          sizer.size += amt;
        }
      }
    }
  }
}

} // module phosphor.widgets
